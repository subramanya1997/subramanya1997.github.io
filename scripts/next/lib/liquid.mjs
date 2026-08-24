// A deliberately small Liquid interpreter, used only by the markdown-twin
// generator to render the handful of Jekyll pages whose twin body is produced
// by `render_generic_page` (contact, privacy, publications, awesome-loops).
//
// Those pages use assign / for / if / unless plus a dozen filters. The rendered
// result is immediately stripped of HTML tags and collapsed to a single line by
// the twin generator, so only the text nodes have to be right — this is not a
// general-purpose Liquid engine and should not grow into one. Anything it
// cannot parse throws, and the caller falls back to the raw template, matching
// the plugin's `rescue StandardError` behavior.

// ---------------------------------------------------------------------------
// values
// ---------------------------------------------------------------------------

function lookup(scope, expression) {
  const trimmed = expression.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "nil" || trimmed === "null" || trimmed === "empty") return null;
  const quoted = /^(['"])(.*)\1$/s.exec(trimmed);
  if (quoted) return quoted[2];

  let value = scope;
  for (const part of trimmed.split(".")) {
    if (value === null || value === undefined) return null;
    if (part === "size") {
      if (Array.isArray(value) || typeof value === "string") return value.length;
      if (typeof value === "object") return Object.keys(value).length;
      return 0;
    }
    if (part === "first") value = Array.isArray(value) ? value[0] : null;
    else if (part === "last") value = Array.isArray(value) ? value[value.length - 1] : null;
    else value = value[part];
  }
  return value === undefined ? null : value;
}

function stringify(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(stringify).join("");
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function truthy(value) {
  return !(value === null || value === undefined || value === false);
}

// ---------------------------------------------------------------------------
// filters
// ---------------------------------------------------------------------------

const FILTERS = {
  prepend: (value, arg) => `${stringify(arg)}${stringify(value)}`,
  append: (value, arg) => `${stringify(value)}${stringify(arg)}`,
  downcase: (value) => stringify(value).toLowerCase(),
  upcase: (value) => stringify(value).toUpperCase(),
  strip: (value) => stringify(value).trim(),
  escape: (value) =>
    stringify(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;"),
  strip_html: (value) =>
    stringify(value)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[\s\S]*?>/g, ""),
  jsonify: (value) => JSON.stringify(value ?? null),
  default: (value, arg) => (truthy(value) && value !== "" ? value : arg),
  size: (value) => (value == null ? 0 : Array.isArray(value) || typeof value === "string" ? value.length : Object.keys(value).length),
  join: (value, arg) => (Array.isArray(value) ? value.map(stringify).join(stringify(arg)) : stringify(value)),
  uniq: (value) => (Array.isArray(value) ? [...new Set(value)] : value),
  sort: (value, arg) => {
    if (!Array.isArray(value)) return value;
    const key = arg ? stringify(arg) : null;
    return [...value].sort((a, b) => {
      const left = stringify(key ? lookup(a, key) : a);
      const right = stringify(key ? lookup(b, key) : b);
      return left < right ? -1 : left > right ? 1 : 0;
    });
  },
  map: (value, arg) => (Array.isArray(value) ? value.map((item) => lookup(item, stringify(arg))) : value),
};

function applyFilter(name, value, args, scope) {
  const filter = FILTERS[name];
  if (filter) return filter(value, args[0] === undefined ? undefined : lookup(scope, args[0]));
  if (name === "where_exp") {
    // {{ list | where_exp: "item", "item.property" }} — truthiness only.
    const variable = lookup(scope, args[0]);
    const expression = String(lookup(scope, args[1]) ?? "");
    if (!Array.isArray(value)) return value;
    return value.filter((item) =>
      truthy(evaluateCondition(expression, { ...scope, [String(variable)]: item }))
    );
  }
  throw new Error(`unsupported liquid filter: ${name}`);
}

function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (const char of text) {
    if (quote) {
      if (char === quote) quote = null;
      current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "[" || char === "(") depth += 1;
    if (char === "]" || char === ")") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

function evaluateExpression(expression, scope) {
  const segments = splitTopLevel(expression, "|").map((part) => part.trim());
  let value = lookup(scope, segments[0]);
  for (const segment of segments.slice(1)) {
    const match = /^([a-z_]+)\s*(?::\s*(.*))?$/is.exec(segment);
    if (!match) throw new Error(`unsupported liquid filter expression: ${segment}`);
    const args = match[2] ? splitTopLevel(match[2], ",").map((part) => part.trim()) : [];
    value = applyFilter(match[1], value, args, scope);
  }
  return value;
}

function evaluateCondition(expression, scope) {
  for (const separator of [" or ", " and "]) {
    const index = expression.indexOf(separator);
    if (index !== -1) {
      const left = truthy(evaluateCondition(expression.slice(0, index), scope));
      const right = truthy(evaluateCondition(expression.slice(index + separator.length), scope));
      return separator === " or " ? left || right : left && right;
    }
  }
  const comparison = /^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/s.exec(expression.trim());
  if (comparison) {
    const left = evaluateExpression(comparison[1], scope);
    const right = evaluateExpression(comparison[3], scope);
    switch (comparison[2]) {
      case "==": return left === right;
      case "!=": return left !== right;
      case ">": return Number(left) > Number(right);
      case "<": return Number(left) < Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<=": return Number(left) <= Number(right);
      default: return false;
    }
  }
  return truthy(evaluateExpression(expression, scope));
}

// ---------------------------------------------------------------------------
// template parsing
// ---------------------------------------------------------------------------

const TOKEN = /\{\{(.*?)\}\}|\{%(.*?)%\}/gs;

function tokenize(template) {
  const tokens = [];
  let cursor = 0;
  for (const match of template.matchAll(TOKEN)) {
    if (match.index > cursor) tokens.push({ type: "text", value: template.slice(cursor, match.index) });
    if (match[1] !== undefined) tokens.push({ type: "output", value: match[1].trim() });
    else tokens.push({ type: "tag", value: match[2].trim() });
    cursor = match.index + match[0].length;
  }
  if (cursor < template.length) tokens.push({ type: "text", value: template.slice(cursor) });
  return tokens;
}

function render(tokens, start, stop, scope, out) {
  let index = start;
  while (index < stop) {
    const token = tokens[index];
    if (token.type === "text") {
      out.push(token.value);
      index += 1;
      continue;
    }
    if (token.type === "output") {
      out.push(stringify(evaluateExpression(token.value, scope)));
      index += 1;
      continue;
    }

    const [keyword, ...rest] = token.value.split(/\s+/);
    const body = rest.join(" ");

    if (keyword === "assign") {
      const match = /^([\w.]+)\s*=\s*(.*)$/s.exec(body);
      if (!match) throw new Error(`unsupported assign: ${body}`);
      scope[match[1]] = evaluateExpression(match[2], scope);
      index += 1;
      continue;
    }

    if (keyword === "comment") {
      index = matchingEnd(tokens, index, "comment") + 1;
      continue;
    }

    if (keyword === "for") {
      const end = matchingEnd(tokens, index, "for");
      const match = /^(\w+)\s+in\s+(.+?)(?:\s+limit:\s*(\d+))?$/s.exec(body);
      if (!match) throw new Error(`unsupported for: ${body}`);
      let items = evaluateExpression(match[2], scope);
      if (!Array.isArray(items)) items = items ? [items] : [];
      if (match[3]) items = items.slice(0, Number(match[3]));
      items.forEach((item, position) => {
        const inner = {
          ...scope,
          [match[1]]: item,
          forloop: {
            index: position + 1,
            index0: position,
            first: position === 0,
            last: position === items.length - 1,
            length: items.length,
          },
        };
        render(tokens, index + 1, end, inner, out);
      });
      index = end + 1;
      continue;
    }

    if (keyword === "if" || keyword === "unless") {
      const end = matchingEnd(tokens, index, keyword);
      const branches = collectBranches(tokens, index, end, keyword);
      for (const branch of branches) {
        const matched =
          branch.condition === null
            ? true
            : keyword === "unless" && branch.isPrimary
              ? !truthy(evaluateCondition(branch.condition, scope))
              : truthy(evaluateCondition(branch.condition, scope));
        if (matched) {
          render(tokens, branch.start, branch.end, scope, out);
          break;
        }
      }
      index = end + 1;
      continue;
    }

    // Unknown tags (include, raw, highlight, …) render as nothing, which is
    // what the tag-stripped twin body would show anyway.
    index += 1;
  }
}

function matchingEnd(tokens, start, keyword) {
  let depth = 0;
  for (let index = start; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "tag") continue;
    const word = token.value.split(/\s+/)[0];
    if (word === keyword) depth += 1;
    if (word === `end${keyword}`) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`unterminated liquid ${keyword}`);
}

function collectBranches(tokens, start, end, keyword) {
  const branches = [];
  let depth = 0;
  let currentCondition = tokens[start].value.slice(keyword.length).trim();
  let currentStart = start + 1;
  let isPrimary = true;
  for (let index = start; index < end; index += 1) {
    const token = tokens[index];
    if (token.type !== "tag") continue;
    const word = token.value.split(/\s+/)[0];
    if (word === keyword || word === "for" || word === "case") depth += 1;
    if (word === `end${keyword}` || word === "endfor" || word === "endcase") depth -= 1;
    if (depth !== 1 || index === start) continue;
    if (word === "elsif" || word === "else") {
      branches.push({ condition: currentCondition, start: currentStart, end: index, isPrimary });
      isPrimary = false;
      currentCondition = word === "else" ? null : token.value.slice(word.length).trim();
      currentStart = index + 1;
    }
  }
  branches.push({ condition: currentCondition, start: currentStart, end, isPrimary });
  return branches;
}

/** Render a Liquid template against `scope`. Throws on unsupported syntax. */
export function renderLiquid(template, scope) {
  if (!template.includes("{")) return template;
  const tokens = tokenize(template);
  const out = [];
  render(tokens, 0, tokens.length, { ...scope }, out);
  return out.join("");
}
