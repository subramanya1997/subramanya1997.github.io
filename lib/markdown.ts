// Markdown -> HTML pipeline that reproduces the Jekyll build's output.
//
// The Jekyll site rendered content with:
//   * kramdown 2.5.1, `input: GFM` (kramdown-parser-gfm 1.1.0)
//   * Jekyll's kramdown defaults: entity_output as_char, hard_wrap false,
//     smart_quotes lsquo/rsquo/ldquo/rdquo, guess_lang true,
//     syntax_highlighter_opts.default_lang = "plaintext"
//   * rouge 4.x via kramdown's rouge syntax highlighter
//   * `_plugins/link_attributes.rb` (post-render anchor normalization)
//   * `_plugins/toc_filter.rb` (nested <ul> TOC markup - see lib/toc.ts)
//
// Everything below exists to keep the emitted HTML compatible with the CSS in
// css/main.css, the client-side TOC/lightbox JS, and inbound `#anchor` links.
//
// Public API: `renderMarkdown(md, options?) => Promise<RenderedMarkdown>`.
// The `{ html, toc }` shape is unchanged; extra fields are additive.

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot, Text as MdastText, Parent as MdastParent } from "mdast";
import type { Root as HastRoot, Element as HastElement, ElementContent } from "hast";

import { buildTocHtml, createHeadingIdGenerator, type TocEntry } from "./toc";

export type { TocEntry } from "./toc";
export { buildTocHtml, slugifyHeading } from "./toc";

export interface RenderMarkdownOptions {
  /**
   * Values for the handful of Liquid variables that appear inside content
   * markdown. Mirrors the relevant bits of `site.config.mjs`.
   */
  site?: {
    baseurl?: string;
    url?: string;
    email?: string;
    title?: string;
    /** Contents of `content/data/*.yml`, keyed by file name (`{ about: { ... } }`). */
    data?: Record<string, unknown>;
  };
  /**
   * Run the `_plugins/link_attributes.rb` port (default `true`).
   *
   * Jekyll applied that plugin in a `:post_render` hook, *after* `page.content`
   * had already been set to the converter's output — so the handful of Liquid
   * expressions that read `page.content` (notably `head.html`'s
   * `twitter:data1`, which is `number_of_words | divided_by: 200`) saw the HTML
   * without the derived `title` / `target` / `rel` attributes. Set this to
   * `false` to reproduce that intermediate string.
   */
  linkAttributes?: boolean;
}

export interface RenderedMarkdown {
  html: string;
  /** h2/h3 entries, matching what the client-side TOC script collects. */
  toc: TocEntry[];
  /** Every heading h2-h6, in document order. */
  headings: TocEntry[];
  /** Ready-made markup identical to `_plugins/toc_filter.rb`. */
  tocHtml: string;
  /** Inner HTML of the first top-level paragraph (empty string if none). */
  firstParagraphHtml: string;
  /** Plain text of the first top-level paragraph (empty string if none). */
  firstParagraphText: string;
}

const SITE_HOST = "subramanya.ai";

// ---------------------------------------------------------------------------
// 1. Liquid
//
// `content/posts/*.md` contain no `{% ... %}` tags. A single post and a few page sources
// use `{{ ... }}` variables, so only the variable form is resolved here.
// ---------------------------------------------------------------------------

/**
 * kramdown accepts unescaped spaces in link/image destinations
 * (`![Agent Directory](/assets/images/Agent Directory.png)`); CommonMark does
 * not, and remark would leave the whole construct as literal text. Wrap those
 * destinations in angle brackets so remark parses them the way kramdown did.
 */
const SPACED_DESTINATION_RE = /(!?\[[^\]\n]*\]\()(?!<)([^()<>\n]*\s[^()<>\n]*?)(\))/g;

function bracketSpacedDestinations(md: string): string {
  return md.replace(SPACED_DESTINATION_RE, (whole, open: string, dest: string, close: string) => {
    // Leave `](url "title")` alone - only bare destinations need the brackets.
    if (/\s["']/.test(dest)) return whole;
    return `${open}<${dest.trim()}>${close}`;
  });
}

/** kramdown's `HTML_SPAN_ELEMENTS` - everything else starts a block. */
const HTML_SPAN_ELEMENTS = new Set([
  "a", "abbr", "acronym", "b", "big", "bdo", "br", "button", "cite", "caption",
  "code", "del", "dfn", "em", "i", "img", "input", "ins", "kbd", "label",
  "option", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "samp", "select",
  "small", "span", "strike", "strong", "sub", "sup", "textarea", "tt", "u", "var",
]);

/**
 * kramdown starts a block-level HTML element as soon as one appears at the
 * beginning of a line (ending any open paragraph) and ends it at the matching
 * closing tag. CommonMark instead refuses to interrupt a paragraph with an
 * unknown tag like `<video>`, and once inside an HTML block it keeps consuming
 * until a blank line. Inserting blank lines around the balanced element
 * restores kramdown's block boundaries.
 */
function splitHtmlBlocks(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inFence = false;
  let fenceMarker = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence[1][0] === fenceMarker) {
        inFence = false;
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    const open = /^<([a-zA-Z][-\w]*)[\s/>]/.exec(line);
    if (!open || HTML_SPAN_ELEMENTS.has(open[1].toLowerCase())) {
      out.push(line);
      continue;
    }

    const tag = open[1].toLowerCase();
    const openRe = new RegExp(`<${tag}\\b`, "gi");
    const closeRe = new RegExp(`</${tag}\\s*>`, "gi");
    let depth = 0;
    let end = -1;
    for (let j = i; j < lines.length; j += 1) {
      if (lines[j].trim() === "" && depth === 0 && j > i) break;
      depth += (lines[j].match(openRe) ?? []).length;
      depth -= (lines[j].match(closeRe) ?? []).length;
      if (depth <= 0) {
        end = j;
        break;
      }
    }
    if (end === -1) {
      out.push(line);
      continue;
    }

    if (out.length && out[out.length - 1].trim() !== "") out.push("");
    for (let j = i; j <= end; j += 1) out.push(lines[j]);
    if (lines[end + 1] !== undefined && lines[end + 1].trim() !== "") out.push("");
    i = end;
  }

  return out.join("\n");
}

const LIQUID_OUTPUT_RE = /\{\{\s*([^}]*?)\s*\}\}/g;

function resolveLiquid(md: string, options: RenderMarkdownOptions): string {
  const site = {
    baseurl: "",
    url: "https://subramanya.ai",
    email: "subramanyanagabhushan@gmail.com",
    title: "Subramanya N",
    ...(options.site ?? {}),
  };

  return md.replace(LIQUID_OUTPUT_RE, (whole, expr: string) => {
    const parts = expr.split("|").map((p) => p.trim());
    const [head, ...filters] = parts;

    let value: string | undefined;
    const literal = head.match(/^'([^']*)'$|^"([^"]*)"$/);
    if (literal) {
      value = literal[1] ?? literal[2] ?? "";
    } else if (head.startsWith("site.data.")) {
      const resolved = head
        .slice("site.data.".length)
        .split(".")
        .reduce<unknown>(
          (acc, key) =>
            acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
          site.data ?? {},
        );
      if (resolved !== undefined && resolved !== null) value = String(resolved);
    } else if (head.startsWith("site.")) {
      const key = head.slice("site.".length) as keyof typeof site;
      if (key in site) value = String(site[key] ?? "");
    }
    if (value === undefined) return whole; // leave unknown expressions alone

    for (const filter of filters) {
      const prepend = filter.match(/^prepend:\s*(.+)$/);
      if (prepend) {
        const arg = prepend[1].trim();
        const argLiteral = arg.match(/^'([^']*)'$|^"([^"]*)"$/);
        if (argLiteral) value = (argLiteral[1] ?? argLiteral[2] ?? "") + value;
        else if (arg.startsWith("site.")) {
          const key = arg.slice("site.".length) as keyof typeof site;
          value = String(site[key] ?? "") + value;
        }
      }
      const append = filter.match(/^append:\s*(.+)$/);
      if (append) {
        const arg = append[1].trim();
        const argLiteral = arg.match(/^'([^']*)'$|^"([^"]*)"$/);
        if (argLiteral) value += argLiteral[1] ?? argLiteral[2] ?? "";
      }
    }
    return value;
  });
}

// ---------------------------------------------------------------------------
// 2. kramdown typography (smart quotes + typographic symbols)
//
// kramdown's span parsers run left-to-right; `smart_quotes` is registered
// before `typographic_syms`, which matters because the quote rules peek at a
// following `..` (see SQ_RULES rule 2). Both are therefore driven from a single
// scan here.
//
// Ported from kramdown/parser/kramdown/smart_quotes.rb and
// kramdown/parser/kramdown/typographic_symbol.rb. `smart_quotes` is configured
// (by Jekyll) as lsquo,rsquo,ldquo,rdquo and `entity_output: as_char`, so the
// substitutions are literal characters.
// ---------------------------------------------------------------------------

const QUOTE_CHARS = { lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d" };

const SQ_PUNCT = "[!\"#$%'()*+,\\-./:;<=>?@\\[\\\\\\]^_`{|}~]";
const SQ_CLOSE = "[^ \\\\\\t\\r\\n\\[{(-]";

type SqSubst = number | keyof typeof QUOTE_CHARS | "lquote1" | "rquote1" | "lquote2" | "rquote2";

const SQ_RULES: Array<[RegExp, SqSubst[]]> = [
  [/("|')(?=[_*]{1,2}\S)/y, ["lquote1"]],
  [new RegExp(`("|')(?=${SQ_PUNCT}(?!\\.\\.)\\B)`, "y"), ["rquote1"]],
  [/(\s?)"'(?=\w)/y, [1, "ldquo", "lsquo"]],
  [/(\s?)'"(?=\w)/y, [1, "lsquo", "ldquo"]],
  [/(\s?)'(?=\d\ds)/y, [1, "rsquo"]],
  [/(\s)('|")(?=\w)/y, [1, "lquote2"]],
  [new RegExp(`(${SQ_CLOSE})('|")`, "y"), [1, "rquote2"]],
  [/("|')(?=\s|s\b|$)/y, ["rquote1"]],
  [/([\s\S]?)'/y, [1, "lsquo"]],
  [/([\s\S]?)"/y, [1, "ldquo"]],
];

/** Which capture group holds the quote character, per pseudo-substitution. */
const SQ_QUOTE_GROUP: Record<string, number> = {
  lquote1: 1,
  rquote1: 1,
  lquote2: 2,
  rquote2: 2,
};

const SQ_SUBSTS: Record<string, keyof typeof QUOTE_CHARS> = {
  'rquote1"': "rdquo",
  "rquote1'": "rsquo",
  'rquote2"': "rdquo",
  "rquote2'": "rsquo",
  'lquote1"': "ldquo",
  "lquote1'": "lsquo",
  'lquote2"': "ldquo",
  "lquote2'": "lsquo",
};

const SMART_QUOTES_START = /[^\\]?["']/g;
const TYPOGRAPHIC_START = /---|--|\.\.\.|\\<<|\\>>|<< | >>|<<|>>/g;

const TYPOGRAPHIC_SUBSTS: Record<string, string> = {
  "---": "\u2014",
  "--": "\u2013",
  "...": "\u2026",
  "\\<<": "<<",
  "\\>>": ">>",
  "<< ": "\u00ab\u00a0",
  " >>": "\u00a0\u00bb",
  "<<": "\u00ab",
  ">>": "\u00bb",
};

function nextMatch(re: RegExp, text: string, from: number): RegExpExecArray | null {
  re.lastIndex = from;
  return re.exec(text);
}

export function applyKramdownTypography(text: string): string {
  if (!/["'.<>-]/.test(text)) return text;

  let out = "";
  let pos = 0;

  while (pos < text.length) {
    const quoteMatch = nextMatch(SMART_QUOTES_START, text, pos);
    const symMatch = nextMatch(TYPOGRAPHIC_START, text, pos);

    if (!quoteMatch && !symMatch) break;

    const quoteAt = quoteMatch ? quoteMatch.index : Infinity;
    const symAt = symMatch ? symMatch.index : Infinity;

    // Ties go to smart_quotes: it is registered earlier in @span_parsers.
    if (quoteAt <= symAt) {
      out += text.slice(pos, quoteAt);
      const consumed = applySmartQuoteRules(text, quoteAt, (s) => {
        out += s;
      });
      if (consumed === 0) {
        out += text[quoteAt];
        pos = quoteAt + 1;
      } else {
        pos = quoteAt + consumed;
      }
    } else {
      out += text.slice(pos, symAt);
      out += TYPOGRAPHIC_SUBSTS[symMatch![0]];
      pos = symAt + symMatch![0].length;
    }
  }

  return out + text.slice(pos);
}

function applySmartQuoteRules(text: string, at: number, emit: (s: string) => void): number {
  for (const [re, substs] of SQ_RULES) {
    re.lastIndex = at;
    const m = re.exec(text);
    if (!m || m.index !== at) continue;

    for (const subst of substs) {
      if (typeof subst === "number") {
        if (m[subst]) emit(m[subst]);
      } else if (subst in SQ_QUOTE_GROUP) {
        const quote = m[SQ_QUOTE_GROUP[subst]];
        const resolved = SQ_SUBSTS[`${subst}${quote}`];
        emit(QUOTE_CHARS[resolved]);
      } else {
        emit(QUOTE_CHARS[subst as keyof typeof QUOTE_CHARS]);
      }
    }
    return m[0].length;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// 3. rouge (syntax highlighting)
//
// A port of the pieces of rouge 4.x that this site's content actually needs:
// the `RegexLexer` engine plus the shell, console, json, python and plaintext
// lexers. Output is byte-compatible with
// `Rouge::Formatters::HTMLLegacy` (wrap: true, css_class: "highlight"), which
// is what kramdown asks for:
//
//   <div class="highlight"><pre class="highlight"><code>...</code></pre></div>
//
// kramdown then wraps that in `<div class="language-X highlighter-rouge">`.
// ---------------------------------------------------------------------------

/** rouge Token#shortname, i.e. the CSS class. "" means "emit no span". */
const TOKEN_SHORTNAME: Record<string, string> = {
  Text: "",
  "Text.Whitespace": "w",
  Comment: "c",
  "Comment.Single": "c1",
  Keyword: "k",
  "Keyword.Constant": "kc",
  "Keyword.Namespace": "kn",
  Name: "n",
  "Name.Builtin": "nb",
  "Name.Builtin.Pseudo": "bp",
  "Name.Variable": "nv",
  "Name.Tag": "nt",
  "Name.Constant": "no",
  "Name.Label": "nl",
  "Name.Function": "nf",
  "Name.Class": "nc",
  "Name.Decorator": "nd",
  "Name.Namespace": "nn",
  Operator: "o",
  "Operator.Word": "ow",
  Punctuation: "p",
  Str: "s",
  "Str.Single": "s1",
  "Str.Double": "s2",
  "Str.Backtick": "sb",
  "Str.Escape": "se",
  "Str.Heredoc": "sh",
  "Str.Interpol": "si",
  "Str.Affix": "sa",
  "Str.Doc": "sd",
  Num: "m",
  "Num.Float": "mf",
  "Num.Integer": "mi",
  "Num.Bin": "mb",
  "Num.Oct": "mo",
  "Num.Hex": "mh",
  "Num.Integer.Long": "il",
  "Generic.Prompt": "gp",
  "Generic.Output": "go",
  "Generic.Error": "gr",
  Error: "err",
};

type TokenPair = [string, string];

interface LexerRule {
  re: RegExp;
  /** Rules whose Ruby source began with `^` are only tried at line starts. */
  bol?: boolean;
  tok?: string;
  groups?: string[];
  next?: string;
  /** `:push` with no argument - re-push the state currently on top. */
  pushSelf?: true;
  pop?: number;
  run?: (lexer: RegexLexer, m: RegExpExecArray, emit: (t: string, v: string) => void) => void;
}

type StateEntry = LexerRule | { mixin: string };

const MAX_NULL_SCANS = 5;

abstract class RegexLexer {
  abstract readonly states: Record<string, StateEntry[]>;
  stack: string[] = ["root"];
  protected nullSteps = 0;

  reset(): void {
    this.stack = ["root"];
    this.nullSteps = 0;
  }

  streamTokens(text: string, emit: (t: string, v: string) => void): void {
    let pos = 0;
    while (pos < text.length) {
      const top = this.stack[this.stack.length - 1];
      const next = this.step(top, top, text, pos, emit);
      if (next === null) {
        emit("Error", text[pos]);
        pos += 1;
      } else {
        pos = next;
      }
    }
  }

  private step(
    stateName: string,
    topState: string,
    text: string,
    pos: number,
    emit: (t: string, v: string) => void,
  ): number | null {
    const entries = this.states[stateName];
    if (!entries) throw new Error(`unknown lexer state: ${stateName}`);

    for (const entry of entries) {
      if ("mixin" in entry) {
        const r = this.step(entry.mixin, topState, text, pos, emit);
        if (r !== null) return r;
        continue;
      }
      if (entry.bol && pos !== 0 && text[pos - 1] !== "\n") continue;

      entry.re.lastIndex = pos;
      const m = entry.re.exec(text);
      if (!m || m.index !== pos) continue;

      if (entry.groups) {
        entry.groups.forEach((tok, i) => {
          const val = m[i + 1];
          if (val) emit(tok, val);
        });
      } else if (entry.tok !== undefined) {
        if (m[0]) emit(entry.tok, m[0]);
      }
      if (entry.run) entry.run(this, m, emit);

      if (entry.pop) this.stack.splice(Math.max(0, this.stack.length - entry.pop));
      else if (entry.pushSelf) this.stack.push(topState);
      else if (entry.next) this.stack.push(entry.next);

      if (m[0].length === 0) {
        this.nullSteps += 1;
        if (this.nullSteps > MAX_NULL_SCANS) return null;
      } else {
        this.nullSteps = 0;
      }
      return pos + m[0].length;
    }
    return null;
  }
}

// --- plaintext -------------------------------------------------------------

class PlainTextLexer {
  constructor(private readonly token = "Text") {}
  reset(): void {}
  streamTokens(text: string, emit: (t: string, v: string) => void): void {
    emit(this.token, text);
  }
}

// --- shell -----------------------------------------------------------------

const SHELL_KEYWORDS =
  "if|fi|else|while|do|done|for|then|return|function|select|continue|until|esac|elif|in";

const SHELL_BUILTINS = [
  "alias bg bind break builtin caller cd command compgen",
  "complete declare dirs disown enable eval exec exit",
  "export false fc fg getopts hash help history jobs let",
  "local logout mapfile popd pushd pwd read readonly set",
  "shift shopt source suspend test time times trap true type",
  "typeset ulimit umask unalias unset wait",
  "cat tac nl od base32 base64 fmt pr fold head tail split csplit",
  "wc sum cksum b2sum md5sum sha1sum sha224sum sha256sum sha384sum",
  "sha512sum sort shuf uniq comm ptx tsort cut paste join tr expand",
  "unexpand ls dir vdir dircolors cp dd install mv rm shred link ln",
  "mkdir mkfifo mknod readlink rmdir unlink chown chgrp chmod touch",
  "df du stat sync truncate echo printf yes expr tee basename dirname",
  "pathchk mktemp realpath pwd stty printenv tty id logname whoami",
  "groups users who date arch nproc uname hostname hostid uptime chcon",
  "runcon chroot env nice nohup stdbuf timeout kill sleep factor numfmt",
  "seq tar grep sudo awk sed gzip gunzip",
]
  .join(" ")
  .split(/\s+/)
  .join("|");

class ShellLexer extends RegexLexer {
  heredocStr = "";

  readonly states: Record<string, StateEntry[]> = {
    basic: [
      { re: /#.*$/my, tok: "Comment" },
      { re: new RegExp(`\\b(?:${SHELL_KEYWORDS})\\s*\\b`, "y"), tok: "Keyword" },
      { re: /\bcase\b/y, tok: "Keyword", next: "case" },
      { re: new RegExp(`\\b(?:${SHELL_BUILTINS})\\s*\\b(?!\\.|-)`, "y"), tok: "Name.Builtin" },
      { re: /[.](?=\s)/y, tok: "Name.Builtin" },
      { re: /(\b\w+)(=)/y, groups: ["Name.Variable", "Operator"] },
      { re: /[[\]{}()!=>]/y, tok: "Operator" },
      { re: /&&|\|\|/y, tok: "Operator" },
      { re: /<<</y, tok: "Operator" },
      {
        re: /(<<-?)(\s*)(['"]?)(\\?)(\w+)(\3)/y,
        groups: ["Operator", "Text", "Str.Heredoc", "Str.Heredoc", "Name.Constant", "Str.Heredoc"],
        next: "heredoc",
        run: (lexer, m) => {
          (lexer as ShellLexer).heredocStr = m[5];
        },
      },
    ],
    heredoc: [
      { re: /\n/y, tok: "Str.Heredoc", next: "heredoc_nl" },
      { re: /[^$\n\\]+/y, tok: "Str.Heredoc" },
      { mixin: "interp" },
      { re: /\$/y, tok: "Str.Heredoc" },
    ],
    heredoc_nl: [
      {
        re: /\s*(\w+)\s*\n/y,
        run: (lexer, m, emit) => {
          const self = lexer as ShellLexer;
          if (m[1] === self.heredocStr) {
            emit("Name.Constant", m[0]);
            self.stack.splice(Math.max(0, self.stack.length - 2));
          } else {
            emit("Str.Heredoc", m[0]);
          }
        },
      },
      { re: /(?:)/y, pop: 1 },
    ],
    double_quotes: [
      { re: /(?:\$#?)?"/y, tok: "Str.Double", pop: 1 },
      { mixin: "interp" },
      { re: /[^"`\\$]+/y, tok: "Str.Double" },
    ],
    ansi_string: [
      { re: /\\[^]/y, tok: "Str.Escape" },
      { re: /[^\\']+/y, tok: "Str.Single" },
      { mixin: "single_quotes" },
    ],
    single_quotes: [
      { re: /'/y, tok: "Str.Single", pop: 1 },
      { re: /[^']+/y, tok: "Str.Single" },
    ],
    data: [
      { re: /\s+/y, tok: "Text" },
      { re: /\\[^]/y, tok: "Str.Escape" },
      { re: /\$?"/y, tok: "Str.Double", next: "double_quotes" },
      { re: /\$'/y, tok: "Str.Single", next: "ansi_string" },
      { re: /'/y, tok: "Str.Single", next: "single_quotes" },
      { re: /\*/y, tok: "Keyword" },
      { re: /;/y, tok: "Punctuation" },
      { re: /--?[\w-]+/y, tok: "Name.Tag" },
      { re: /[^=*\s{}()$"'`;\\<]+/y, tok: "Text" },
      { re: /\d+(?= |\n?$)/y, tok: "Num" },
      { re: /</y, tok: "Text" },
      { mixin: "interp" },
    ],
    curly: [
      { re: /\}/y, tok: "Keyword", pop: 1 },
      { re: /:-/y, tok: "Keyword" },
      { re: /[a-zA-Z0-9_]+/y, tok: "Name.Variable" },
      { re: /[^}:"`'$]+/y, tok: "Punctuation" },
      { mixin: "root" },
    ],
    paren_interp: [
      { re: /\)/y, tok: "Str.Interpol", pop: 1 },
      { re: /\(/y, tok: "Operator", next: "paren_inner" },
      { mixin: "root" },
    ],
    paren_inner: [
      { re: /\(/y, tok: "Operator", pushSelf: true },
      { re: /\)/y, tok: "Operator", pop: 1 },
      { mixin: "root" },
    ],
    math: [
      { re: /\)\)/y, tok: "Keyword", pop: 1 },
      { re: /[-+*/%^|&!]|\*\*|\|\|/y, tok: "Operator" },
      { re: /\d+(?:#\w+)?/y, tok: "Num" },
      { mixin: "root" },
    ],
    case: [
      { re: /\besac\b/y, tok: "Keyword", pop: 1 },
      { re: /\|/y, tok: "Punctuation" },
      { re: /\)/y, tok: "Punctuation", next: "case_stanza" },
      { mixin: "root" },
    ],
    case_stanza: [{ re: /;;/y, tok: "Punctuation", pop: 1 }, { mixin: "root" }],
    backticks: [{ re: /`/y, tok: "Str.Backtick", pop: 1 }, { mixin: "root" }],
    interp: [
      { re: /\\$/my, tok: "Str.Escape" },
      { re: /\\[^\n]/y, tok: "Str.Escape" },
      { re: /\$\(\(/y, tok: "Keyword", next: "math" },
      { re: /\$\(/y, tok: "Str.Interpol", next: "paren_interp" },
      { re: /\$\{#?/y, tok: "Keyword", next: "curly" },
      { re: /`/y, tok: "Str.Backtick", next: "backticks" },
      { re: /\$#?(?:\w+|[^\n])/y, tok: "Name.Variable" },
      { re: /\$[*@]/y, tok: "Name.Variable" },
    ],
    root: [{ mixin: "basic" }, { mixin: "data" }],
  };
}

// --- console (shell session) ----------------------------------------------

const CONSOLE_ELISION_RE = /^\s*(?:<[.]+>|[.]+)\s*$/;
// end_chars default to $ # > ; (comments stay off because "#" is a prompt char)
const CONSOLE_PROMPT_RE = /^[\s\S]*?[$#>;]/;

class ConsoleLexer {
  private lang = new ShellLexer();
  private output = new PlainTextLexer("Generic.Output");

  reset(): void {
    this.lang.reset();
    this.output.reset();
  }

  streamTokens(text: string, emit: (t: string, v: string) => void): void {
    this.lang.reset();
    this.output.reset();

    let pos = 0;
    while (pos < text.length) {
      const nl = text.indexOf("\n", pos);
      const line = nl === -1 ? text.slice(pos) : text.slice(pos, nl + 1);
      pos += line.length;

      if (CONSOLE_ELISION_RE.test(line)) {
        this.output.reset();
        this.lang.reset();
        emit("Comment", line);
        continue;
      }

      const prompt = CONSOLE_PROMPT_RE.exec(line);
      if (prompt) {
        this.output.reset();
        emit("Generic.Prompt", prompt[0]);
        let rest = line.slice(prompt[0].length);
        const lead = /^\s*/.exec(rest)![0];
        if (lead) {
          emit("Text.Whitespace", lead);
          rest = rest.slice(lead.length);
        }
        this.lang.streamTokens(rest, emit);
        continue;
      }

      this.lang.reset();
      this.output.streamTokens(line, emit);
    }
  }
}

// --- json ------------------------------------------------------------------

class JsonLexer extends RegexLexer {
  readonly states: Record<string, StateEntry[]> = {
    whitespace: [{ re: /\s+/y, tok: "Text.Whitespace" }],
    root: [
      { mixin: "whitespace" },
      { re: /\{/y, tok: "Punctuation", next: "object" },
      { re: /\[/y, tok: "Punctuation", next: "array" },
      { mixin: "name" },
      { mixin: "value" },
      { re: /[\]}]/y, tok: "Punctuation" },
    ],
    object: [
      { mixin: "whitespace" },
      { mixin: "name" },
      { mixin: "value" },
      { re: /\}/y, tok: "Punctuation", pop: 1 },
      { re: /,/y, tok: "Punctuation" },
    ],
    name: [
      {
        re: /("(?:\\.|[^"\\\n])*?")(\s*)(:)/y,
        groups: ["Name.Label", "Text.Whitespace", "Punctuation"],
      },
    ],
    value: [
      { mixin: "whitespace" },
      { mixin: "constants" },
      { re: /"/y, tok: "Str.Double", next: "string" },
      { re: /\[/y, tok: "Punctuation", next: "array" },
      { re: /\{/y, tok: "Punctuation", next: "object" },
    ],
    string: [
      { re: /[^\\"]+/y, tok: "Str.Double" },
      { re: /\\[^]/y, tok: "Str.Escape" },
      { re: /"/y, tok: "Str.Double", pop: 1 },
    ],
    array: [
      { mixin: "value" },
      { re: /\]/y, tok: "Punctuation", pop: 1 },
      { re: /,/y, tok: "Punctuation" },
    ],
    constants: [
      { re: /(?:true|false|null)/y, tok: "Keyword.Constant" },
      { re: /-?(?:0|[1-9]\d*)\.\d+(?:[eE][+-]?\d+)?/y, tok: "Num.Float" },
      { re: /-?(?:0|[1-9]\d*)(?:[eE][+-]?\d+)?/y, tok: "Num.Integer" },
    ],
  };
}

// --- python ----------------------------------------------------------------

const PY_IDENT = "[A-Za-z_][A-Za-z0-9_]*";
const PY_DOTTED = "[A-Za-z_.][A-Za-z0-9_.]*";
const PY_DIGITS = "[0-9](?:_?[0-9])*";
const PY_DECIMAL = `(?:(?:${PY_DIGITS})?\\.${PY_DIGITS}|${PY_DIGITS}\\.)`;
const PY_EXPONENT = `[eE][+-]?${PY_DIGITS}`;

const PY_KEYWORDS = `assert break continue del elif else except exec
  finally for global if lambda pass print raise
  return try while yield as with from import
  async await nonlocal`
  .trim()
  .split(/\s+/);

const PY_BUILTINS = `__import__ abs aiter all anext any apply ascii
  basestring bin bool buffer breakpoint bytearray bytes
  callable chr classmethod cmp coerce compile complex
  delattr dict dir divmod enumerate eval exec execfile exit
  file filter float format frozenset getattr globals
  hasattr hash help hex
  id input int intern isinstance issubclass iter len list locals long
  map max memoryview min next object oct open ord pow print property
  range raw_input reduce reload repr reversed round set setattr slice
  sorted staticmethod str sum super tuple type unichr unicode vars
  xrange zip`
  .trim()
  .split(/\s+/);

const PY_BUILTINS_PSEUDO = ["None", "Ellipsis", "NotImplemented", "False", "True"];

const PY_EXCEPTIONS = `ArithmeticError AssertionError AttributeError BaseException
  BaseExceptionGroup BlockingIOError BrokenPipeError BufferError
  BytesWarning ChildProcessError ConnectionAbortedError ConnectionError
  ConnectionRefusedError ConnectionResetError DeprecationWarning
  EOFError EnvironmentError EncodingWarning Exception ExceptionGroup
  FileExistsError FileNotFoundError FloatingPointError FutureWarning
  GeneratorExit IOError ImportError ImportWarning IndentationError
  IndexError InterruptedError IsADirectoryError
  KeyError KeyboardInterrupt LookupError
  MemoryError ModuleNotFoundError
  NameError NotADirectoryError NotImplemented NotImplementedError
  OSError OverflowError OverflowWarning PendingDeprecationWarning
  PermissionError ProcessLookupError PythonFinalizationError
  RecursionError ReferenceError ResourceWarning RuntimeError RuntimeWarning
  StandardError StopAsyncIteration StopIteration SyntaxError SyntaxWarning
  SystemError SystemExit TabError TimeoutError TypeError
  UnboundLocalError UnicodeDecodeError UnicodeEncodeError UnicodeError
  UnicodeTranslateError UnicodeWarning UserWarning ValueError VMSError
  Warning WindowsError
  ZeroDivisionError`
  .trim()
  .split(/\s+/);

class PythonLexer extends RegexLexer {
  /** rouge's StringRegister: a stack of [affix, delimiter] pairs. */
  strings: Array<[string, string]> = [];

  reset(): void {
    super.reset();
    this.strings = [];
  }

  readonly states: Record<string, StateEntry[]> = {
    root: [
      { re: /\n+/y, tok: "Text" },
      {
        re: /^(:)(\s*)((?:[ruRU]{0,2})"""[\s\S]*?""")/my,
        bol: true,
        groups: ["Punctuation", "Text", "Str.Doc"],
      },
      { re: /\.\.\.\B$/my, tok: "Name.Builtin.Pseudo" },
      { re: /[^\S\n]+/y, tok: "Text" },
      { re: /#.*\n?/y, tok: "Comment.Single" },
      { re: /[[\]{}:(),;.]/y, tok: "Punctuation" },
      { re: /\\\n/y, tok: "Text" },
      { re: /\\/y, tok: "Text" },
      { re: new RegExp(`@${PY_DOTTED}`, "iy"), tok: "Name.Decorator" },
      { re: /(?:in|is|and|or|not)\b/y, tok: "Operator.Word" },
      { re: /(?:<<|>>|\/\/|\*\*)=?/y, tok: "Operator" },
      { re: /[-~+/*%=<>&^|@]=?|!=/y, tok: "Operator" },
      {
        re: new RegExp(`(from)((?:\\\\\\s|\\s)+)(${PY_DOTTED})((?:\\\\\\s|\\s)+)(import)`, "y"),
        groups: ["Keyword.Namespace", "Text", "Name", "Text", "Keyword.Namespace"],
      },
      {
        re: new RegExp(`(import)(\\s+)(${PY_DOTTED})`, "y"),
        groups: ["Keyword.Namespace", "Text", "Name"],
      },
      { re: /(def)((?:\s|\\\s)+)/y, groups: ["Keyword", "Text"], next: "funcname" },
      { re: /(class)((?:\s|\\\s)+)/y, groups: ["Keyword", "Text"], next: "classname" },
      { re: /[a-z_]\w*[ \t]*(?=\([\s\S]*\))/y, tok: "Name.Function" },
      { re: /[A-Z_]\w*[ \t]*(?=\([\s\S]*\))/y, tok: "Name.Class" },
      { re: /`.*?`/y, tok: "Str.Backtick" },
      {
        re: /([rfbuRFBU]{0,2})('''|"""|['"])/y,
        groups: ["Str.Affix", "Str.Heredoc"],
        next: "generic_string",
        run: (lexer, m) => {
          (lexer as PythonLexer).strings.push([m[1].toLowerCase(), m[2]]);
        },
      },
      { mixin: "soft_keywords" },
      {
        re: new RegExp(`(?<!\\.)${PY_IDENT}`, "y"),
        run: (_lexer, m, emit) => {
          const word = m[0];
          if (PY_KEYWORDS.includes(word)) emit("Keyword", word);
          else if (PY_EXCEPTIONS.includes(word)) emit("Name.Builtin", word);
          else if (PY_BUILTINS.includes(word)) emit("Name.Builtin", word);
          else if (PY_BUILTINS_PSEUDO.includes(word)) emit("Name.Builtin.Pseudo", word);
          else emit("Name", word);
        },
      },
      { re: new RegExp(PY_IDENT, "y"), tok: "Name" },
      { re: new RegExp(`${PY_DECIMAL}(?:${PY_EXPONENT})?[jJ]?`, "y"), tok: "Num.Float" },
      { re: new RegExp(`${PY_DIGITS}${PY_EXPONENT}[jJ]?`, "y"), tok: "Num.Float" },
      { re: new RegExp(`${PY_DIGITS}[jJ]`, "y"), tok: "Num.Float" },
      { re: /0[bB](?:_?[01])+/y, tok: "Num.Bin" },
      { re: /0[oO](?:_?[0-7])+/y, tok: "Num.Oct" },
      { re: /0[xX](?:_?[a-fA-F0-9])+/y, tok: "Num.Hex" },
      { re: /\d+L/y, tok: "Num.Integer.Long" },
      { re: /[1-9](?:_?[0-9])*|0(?:_?0)*/y, tok: "Num.Integer" },
    ],
    funcname: [{ re: new RegExp(PY_IDENT, "y"), tok: "Name.Function", pop: 1 }],
    classname: [{ re: new RegExp(PY_IDENT, "y"), tok: "Name.Class", pop: 1 }],
    soft_keywords: [
      {
        re: new RegExp(
          `(^[ \\t]*)(match|case)\\b(?![ \\t]*(?:[:,;=^&|@~)\\]}]|(?:${PY_KEYWORDS.join("|")})\\b))`,
          "my",
        ),
        bol: true,
        groups: ["Text.Whitespace", "Keyword"],
        next: "soft_keywords_inner",
      },
    ],
    soft_keywords_inner: [
      { re: /(\s+)([^\n_]*)(_\b)/y, groups: ["Text.Whitespace", "Text", "Keyword"] },
      { re: /(?:)/y, pop: 1 },
    ],
    generic_string: [
      { re: /^\s*(?:>>>|\.\.\.)\B/my, bol: true, tok: "Generic.Prompt", next: "doctest" },
      { re: /[^'"\\{]+?/y, tok: "Str" },
      { re: /\{\{/y, tok: "Str" },
      {
        re: /'''|"""|['"]/y,
        run: (lexer, m, emit) => {
          const self = lexer as PythonLexer;
          emit("Str.Heredoc", m[0]);
          const last = self.strings[self.strings.length - 1];
          if (last && last[1] === m[0]) {
            self.strings.pop();
            self.stack.pop();
          }
        },
      },
      { re: /(?=\\)/y, tok: "Str", next: "generic_escape" },
      {
        re: /\{/y,
        run: (lexer, m, emit) => {
          const self = lexer as PythonLexer;
          const last = self.strings[self.strings.length - 1];
          if (last && last[0].includes("f")) {
            emit("Str.Interpol", m[0]);
            self.stack.push("generic_interpol");
          } else {
            emit("Str", m[0]);
          }
        },
      },
    ],
    generic_escape: [
      {
        re: /\\(?:[\\abfnrtv"']|\n|newline|N\{[a-zA-Z][a-zA-Z ]+[a-zA-Z]\}|u[a-fA-F0-9]{4}|U[a-fA-F0-9]{8}|x[a-fA-F0-9]{2}|[0-7]{1,3})/y,
        pop: 1,
        run: (lexer, m, emit) => {
          const self = lexer as PythonLexer;
          const last = self.strings[self.strings.length - 1];
          emit(last && last[0].includes("r") ? "Str" : "Str.Escape", m[0]);
        },
      },
      { re: /\\[^\n]/y, tok: "Str", pop: 1 },
    ],
    doctest: [
      { re: /\n\n/y, tok: "Text", pop: 1 },
      {
        re: /'''|"""/y,
        run: (lexer, m, emit) => {
          emit("Str.Heredoc", m[0]);
          if (lexer.stack.includes("generic_string")) {
            lexer.stack.splice(Math.max(0, lexer.stack.length - 2));
          }
        },
      },
      { mixin: "root" },
    ],
    generic_interpol: [
      {
        re: /[^{}!:]+/y,
        run: (lexer, m, emit) => {
          const inner = new PythonLexer();
          inner.streamTokens(m[0], emit);
        },
      },
      { re: /![asr]/y, tok: "Str.Interpol" },
      { re: /:/y, tok: "Str.Interpol" },
      { re: /\{/y, tok: "Str.Interpol", next: "generic_interpol" },
      { re: /\}/y, tok: "Str.Interpol", pop: 1 },
    ],
  };
}

// --- lexer registry --------------------------------------------------------

type AnyLexer = { reset(): void; streamTokens(text: string, emit: (t: string, v: string) => void): void };

const LEXERS: Record<string, () => AnyLexer> = {
  shell: () => new ShellLexer(),
  bash: () => new ShellLexer(),
  sh: () => new ShellLexer(),
  zsh: () => new ShellLexer(),
  ksh: () => new ShellLexer(),
  console: () => new ConsoleLexer(),
  terminal: () => new ConsoleLexer(),
  shell_session: () => new ConsoleLexer(),
  "shell-session": () => new ConsoleLexer(),
  json: () => new JsonLexer(),
  python: () => new PythonLexer(),
  py: () => new PythonLexer(),
  plaintext: () => new PlainTextLexer(),
  text: () => new PlainTextLexer(),
  plain: () => new PlainTextLexer(),
};

/**
 * Language tags that rouge knows but this port does not tokenize. They still
 * get the rouge wrapper markup (so css/main.css applies) with escaped, but
 * untokenized, content. Anything not listed here and not in LEXERS is treated
 * the way kramdown treats an unknown lexer: a bare `<pre><code class="...">`.
 */
const ROUGE_KNOWN_TAGS = new Set([
  "c", "clojure", "cmake", "coffeescript", "cpp", "csharp", "css", "diff", "docker",
  "elixir", "erlang", "go", "graphql", "groovy", "haskell", "hcl", "html", "http",
  "ini", "java", "javascript", "js", "jsx", "kotlin", "less", "lua", "make",
  "markdown", "nginx", "objective_c", "ocaml", "perl", "php", "powershell", "properties",
  "protobuf", "puppet", "r", "ruby", "rust", "sass", "scala", "scss", "sql", "swift",
  "terraform", "toml", "tsx", "typescript", "ts", "viml", "xml", "yaml", "yml",
]);

function escapeCode(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatTokens(pairs: TokenPair[]): string {
  // rouge's Lexer#continue_lex consolidates consecutive tokens of one type and
  // drops empty values before the formatter ever sees them.
  const merged: TokenPair[] = [];
  for (const [tok, val] of pairs) {
    if (!val) continue;
    const last = merged[merged.length - 1];
    if (last && last[0] === tok) last[1] += val;
    else merged.push([tok, val]);
  }

  let out = "";
  for (const [tok, val] of merged) {
    const shortname = TOKEN_SHORTNAME[tok];
    if (shortname === undefined) throw new Error(`unknown rouge token: ${tok}`);
    const safe = escapeCode(val);
    out += shortname === "" ? safe : `<span class="${shortname}">${safe}</span>`;
  }
  return out;
}

export interface HighlightResult {
  /** Full markup, including kramdown's outer `<div class="language-...">`. */
  html: string;
  /** Whether rouge handled it (false => bare `<pre><code>` fallback). */
  highlighted: boolean;
}

/**
 * Reproduces kramdown's `convert_codeblock` + rouge for one fenced block.
 *
 * `info` is the raw fence info string (`null`/`""` for a bare fence). Jekyll
 * sets `default_lang: "plaintext"`, so a bare fence becomes
 * `language-plaintext` and is run through rouge's PlainText lexer.
 */
export function highlightCode(code: string, info?: string | null): HighlightResult {
  const lang = info && info.trim() ? info.trim().split(/\s+/)[0] : null;
  const effective = lang ?? "plaintext"; // kramdown's `hl_opts[:default_lang]`
  const key = effective.toLowerCase();

  const factory = LEXERS[key];
  if (factory) {
    const lexer = factory();
    lexer.reset();
    const pairs: TokenPair[] = [];
    lexer.streamTokens(code, (t, v) => pairs.push([t, v]));
    const inner = formatTokens(pairs);
    return {
      html:
        `<div class="language-${effective} highlighter-rouge">` +
        `<div class="highlight"><pre class="highlight"><code>${inner}</code></pre></div>` +
        `</div>`,
      highlighted: true,
    };
  }

  if (ROUGE_KNOWN_TAGS.has(key)) {
    // Wrapper parity without token parity - documented gap.
    return {
      html:
        `<div class="language-${effective} highlighter-rouge">` +
        `<div class="highlight"><pre class="highlight"><code>${escapeCode(code)}</code></pre></div>` +
        `</div>`,
      highlighted: true,
    };
  }

  // Unknown to rouge (e.g. `mermaid`): kramdown falls back to a plain block and
  // strips the trailing newline via `result.chomp!`.
  const body = escapeCode(code).replace(/\n$/, "");
  const classAttr = lang ? ` class="language-${lang}"` : "";
  return { html: `<pre><code${classAttr}>${body}\n</code></pre>`, highlighted: false };
}

// ---------------------------------------------------------------------------
// 4. remark / rehype plugins
// ---------------------------------------------------------------------------

/**
 * kramdown inline attribute lists: `![alt](src){: .post-img width="100" }`.
 *
 * The IAL is a text node immediately following the element it decorates, so it
 * is consumed at the mdast stage (before typography runs over text nodes).
 */
const IAL_RE = /^\{:\s*([^}]*)\}/;

function parseIal(body: string): Record<string, string> {
  // Attribute order is preserved (kramdown writes them out in source order, and
  // `class` lands where the first `.name` shortcut appeared).
  const attrs: Record<string, string> = {};
  const re = /([.#][-\w]+)|([-\w]+)=("[^"]*"|'[^']*'|\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m[1]) {
      if (m[1][0] === ".") {
        attrs.class = attrs.class ? `${attrs.class} ${m[1].slice(1)}` : m[1].slice(1);
      } else {
        attrs.id = m[1].slice(1);
      }
    } else {
      attrs[m[2]] = m[3].replace(/^["']|["']$/g, "");
    }
  }
  return attrs;
}

function remarkKramdownIal() {
  return (tree: MdastRoot) => {
    visit(tree, "text", (node: MdastText, index, parent) => {
      if (!parent || index === null || index === undefined || index === 0) return;
      const match = IAL_RE.exec(node.value);
      if (!match) return;
      const target = (parent as MdastParent).children[index - 1] as {
        type: string;
        data?: { hProperties?: Record<string, string> };
      };
      if (!target || target.type === "text") return;

      const attrs = parseIal(match[1]);
      const data = (target.data ??= {});
      data.hProperties = { ...(data.hProperties ?? {}), ...attrs };
      node.value = node.value.slice(match[0].length);
    });
  };
}

/**
 * mdast-util-to-hast percent-encodes URLs; kramdown emitted them verbatim, so
 * `/assets/images/Agent Directory.png` must not become `Agent%20Directory.png`.
 */
function remarkVerbatimUrls() {
  return (tree: MdastRoot) => {
    visit(tree, (raw) => {
      if (raw.type !== "image" && raw.type !== "link") return;
      const node = raw as { type: string; url: string; data?: { hProperties?: Record<string, unknown> } };
      if (!node.url || !/\s/.test(node.url)) return;
      const data = (node.data ??= {});
      const key = node.type === "image" ? "src" : "href";
      data.hProperties = { [key]: node.url, ...(data.hProperties ?? {}) };
    });
  };
}

function remarkKramdownTypography() {
  return (tree: MdastRoot) => {
    // Raw HTML is deliberately left alone: kramdown's `parse_block_html`
    // defaults to false, so the contents of block-level HTML never get smart
    // quotes, entity resolution or any other span processing.
    visit(tree, "text", (node: MdastText) => {
      node.value = applyKramdownTypography(node.value);
    });
  };
}

/**
 * kramdown renders fenced code blocks itself (rouge + wrapper divs). The markup
 * is generated here, at the mdast stage - which is what keeps hand-written
 * `<pre>` blocks in the source untouched, exactly as Jekyll left them - but it
 * is parked behind a placeholder element and spliced back in as a raw node
 * after `rehype-raw`, so rouge's exact bytes (including `&gt;`) survive
 * serialization.
 */
/**
 * kramdown's `convert_codespan` also runs rouge - with `wrap: false` and
 * Jekyll's `default_lang: plaintext` - so every markdown code span carries
 * `class="language-plaintext highlighter-rouge"`. css/main.css styles that
 * selector, so it has to be reproduced.
 */
function remarkCodespanClass() {
  return (tree: MdastRoot) => {
    visit(tree, "inlineCode", (node) => {
      node.data = {
        ...(node.data ?? {}),
        hProperties: { className: ["language-plaintext", "highlighter-rouge"] },
      };
    });
  };
}

const ROUGE_SLOT = "rouge-slot";

function remarkRougeCodeBlocks(slots: string[]) {
  return (tree: MdastRoot) => {
    visit(tree, "code", (node: { lang?: string | null; value: string }, index, parent) => {
      if (!parent || index === null || index === undefined) return;
      const value = node.value.endsWith("\n") ? node.value : `${node.value}\n`;
      const { html } = highlightCode(value, node.lang ?? null);
      const slot = slots.push(html) - 1;
      // A paragraph (rather than the code node) so that `applyData` renames the
      // outermost element instead of the inner <code>.
      (parent as MdastParent).children[index] = {
        type: "paragraph",
        children: [],
        data: { hName: ROUGE_SLOT, hProperties: { "data-rouge": String(slot) } },
      } as never;
    });
  };
}

function rehypeRougeSlots(slots: string[]) {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: HastElement, index, parent) => {
      if (node.tagName !== ROUGE_SLOT || !parent || index === null || index === undefined) return;
      const slot = Number(node.properties?.["dataRouge"] ?? node.properties?.["data-rouge"]);
      (parent as { children: ElementContent[] }).children[index] = {
        type: "raw",
        value: slots[slot] ?? "",
      } as unknown as ElementContent;
    });
  };
}

function textContent(node: ElementContent | HastElement): string {
  if (node.type === "text") return node.value;
  if ("children" in node && node.children) {
    return node.children.map((c) => textContent(c as ElementContent)).join("");
  }
  return "";
}

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function rehypeKramdownHeadingIds(collect: TocEntry[]) {
  return (tree: HastRoot) => {
    const nextId = createHeadingIdGenerator();
    visit(tree, "element", (node: HastElement) => {
      if (!HEADING_TAGS.has(node.tagName)) return;
      const text = textContent(node);
      const id = (node.properties?.id as string | undefined) || nextId(text);
      node.properties = { ...(node.properties ?? {}), id };
      collect.push({ id, text, level: Number(node.tagName[1]) });
    });
  };
}

/**
 * kramdown emits `style="text-align: left"` on aligned table cells;
 * mdast-util-to-hast emits an `align` attribute. Normalize to kramdown's form
 * so the site CSS and any downstream scraping keep working.
 */
/**
 * kramdown (and nokogiri, which re-serialized every page) escapes `>` in text;
 * hast-util-to-html only escapes `<` and `&` and offers no option for it. Emit
 * the escaped form as a raw node so the bytes match.
 */
function rehypeEscapeGt() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName === "script" || node.tagName === "style") return;
      if (!node.children.some((c) => c.type === "text" && c.value.includes(">"))) return;

      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value.includes(">")) return [child];
        return child.value
          .split(/(>)/)
          .filter(Boolean)
          .map((part) =>
            part === ">"
              ? ({ type: "raw", value: "&gt;" } as unknown as ElementContent)
              : ({ type: "text", value: part } as ElementContent),
          );
      });
    });
  };
}

/** kramdown's `convert_ol` never emits a `start` attribute. */
function rehypeKramdownOrderedLists() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName === "ol" && node.properties) delete node.properties.start;
    });
  };
}

function rehypeKramdownTableAlign() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName !== "th" && node.tagName !== "td") return;
      const props = node.properties ?? {};
      const align = props.align as string | undefined;
      if (!align) return;
      delete props.align;
      props.style = `text-align: ${align}`;
      node.properties = props;
    });
  };
}

/**
 * Port of `_plugins/link_attributes.rb`: external anchors get
 * `target="_blank"` + `rel` containing `noopener`, and every anchor without a
 * `title` gets one derived from aria-label / text / image alt (max 120 chars).
 */
const TITLE_MAX_LENGTH = 120;

/** Stand-in for `rehypeLinkAttributes` when `linkAttributes: false`. */
function noopPlugin() {
  return () => {};
}

function rehypeLinkAttributes() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName !== "a") return;
      const props = (node.properties ??= {});
      const href = String(props.href ?? "").trim();
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      if (isExternal(href)) {
        if (!props.target) props.target = "_blank";
        const rel = Array.isArray(props.rel)
          ? props.rel.map(String)
          : String(props.rel ?? "").split(/\s+/).filter(Boolean);
        if (!rel.includes("noopener")) props.rel = [...rel, "noopener"];
      }

      if (!String(props.title ?? "").trim()) {
        const title = deriveTitle(node);
        if (title) props.title = title;
      }
    });
  };
}

function isExternal(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).host !== SITE_HOST;
  } catch {
    return false;
  }
}

function deriveTitle(node: HastElement): string | null {
  let text = String(node.properties?.["ariaLabel"] ?? "").trim();
  if (!text) text = textContent(node).replace(/\s+/g, " ").trim();
  if (!text) {
    let alt = "";
    visit(node, "element", (child: HastElement) => {
      if (!alt && child.tagName === "img" && child.properties?.alt) {
        alt = String(child.properties.alt).trim();
      }
    });
    text = alt;
  }
  if (!text) return null;
  if (text.length > TITLE_MAX_LENGTH) {
    text = `${text.slice(0, TITLE_MAX_LENGTH - 1).replace(/\s+$/, "")}\u2026`;
  }
  return text;
}

// ---------------------------------------------------------------------------
// 5. Public entry point
// ---------------------------------------------------------------------------

export async function renderMarkdown(
  md: string,
  options: RenderMarkdownOptions = {},
): Promise<RenderedMarkdown> {
  const headings: TocEntry[] = [];
  const codeSlots: string[] = [];
  const source = splitHtmlBlocks(bracketSpacedDestinations(resolveLiquid(md, options)));

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkVerbatimUrls)
    .use(remarkKramdownIal)
    .use(remarkKramdownTypography)
    .use(remarkCodespanClass)
    .use(remarkRougeCodeBlocks, codeSlots)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeRougeSlots, codeSlots)
    .use(rehypeKramdownHeadingIds, headings)
    .use(rehypeEscapeGt)
    .use(rehypeKramdownOrderedLists)
    .use(rehypeKramdownTableAlign)
    .use(options.linkAttributes === false ? noopPlugin : rehypeLinkAttributes)
    .use(rehypeStringify, {
      allowDangerousHtml: true,
      closeSelfClosing: false,
      // Attribute values are double-quoted, so a literal `'` inside one is
      // safe - and it is what nokogiri (and therefore _site) emitted.
      allowDangerousCharacters: true,
      characterReferences: { useNamedReferences: true },
    })
    .process(source);

  const html = String(file);
  const toc = headings.filter((h) => h.level === 2 || h.level === 3);
  const tocEntries = headings.filter((h) => h.level >= 2);

  const firstParagraph = /<p>([\s\S]*?)<\/p>/.exec(html);
  const firstParagraphHtml = firstParagraph ? firstParagraph[1] : "";
  const firstParagraphText = firstParagraphHtml
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .trim();

  return {
    html,
    toc,
    headings: tocEntries,
    tocHtml: buildTocHtml(tocEntries),
    firstParagraphHtml,
    firstParagraphText,
  };
}
