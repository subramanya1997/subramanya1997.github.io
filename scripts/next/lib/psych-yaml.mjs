// Ruby Psych-compatible YAML emitter for the flat front-matter blocks that
// _plugins/markdown_twin_generator.rb writes at the top of every markdown twin.
//
// js-yaml cannot be used here: it folds long strings into `>-` blocks and
// indents block sequences, while Psych emits wrapped plain scalars and
// unindented sequences. Only the shapes the twin generator produces are
// supported: a map of string -> string | string[].

const LINE_WIDTH = 80;
const NEEDS_QUOTES =
  /^(\s|[-?:,[\]{}#&*!|>'"%@`])|:\s|\s#|\s$|^$|^(true|false|null|yes|no|on|off|~)$/i;
const LOOKS_NUMERIC = /^[-+]?(\d[\d_]*(\.\d*)?([eE][-+]?\d+)?|\.\d+|0x[0-9a-f]+)$/i;
const LOOKS_TEMPORAL = /^\d{4}-\d{1,2}(-\d{1,2}([Tt ].*)?)?$/;

function needsQuoting(value) {
  return (
    NEEDS_QUOTES.test(value) || LOOKS_NUMERIC.test(value) || LOOKS_TEMPORAL.test(value)
  );
}

function scalar(value) {
  const text = String(value).replace(/\r?\n/g, " ");
  if (needsQuoting(text)) return `'${text.replace(/'/g, "''")}'`;
  return text;
}

/**
 * Psych wraps a scalar only once the column has already passed `best_width`:
 * the word that crosses column 80 stays on the line, and the break happens
 * before the next one. Continuation lines are indented two spaces.
 */
function wrap(prefix, text) {
  const words = text.split(" ");
  const lines = [];
  let current = prefix;
  let empty = true;
  for (const word of words) {
    if (!empty && current.length > LINE_WIDTH) {
      lines.push(current);
      current = "  ";
      empty = true;
    }
    current += empty ? word : ` ${word}`;
    empty = false;
  }
  lines.push(current);
  return lines.join("\n");
}

/** Emit `hash` the way Psych's YAML.dump would, without the trailing marker. */
function dumpYaml(hash) {
  const lines = [];
  for (const [key, value] of Object.entries(hash)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`- ${scalar(item)}`);
    } else {
      lines.push(wrap(`${key}: `, scalar(value)));
    }
  }
  return `${lines.join("\n")}\n`;
}

/** The `---\n…---\n` front matter block used by every twin. */
export function toFrontMatter(hash) {
  return `---\n${dumpYaml(hash)}---\n`;
}
