/**
 * A small JSX tag scanner for scripts/motion-check.mjs: enough to find opening
 * tags, their attribute text (which may hold `=>`, `>` and nested braces) and
 * their enclosing elements, without a TypeScript parser. Comments, strings and
 * template literals are skipped. A `<` counts as a tag only where JSX can start
 * (after `(`, `{`, `}`, `>`, `?`, `:`, `&&`, `||`, `,`, `=`, `return` or a line
 * start), so `useState<number>` and `a < b` are left alone.
 */

const START_AFTER = /(?:^|[({}>?:,=]|&&|\|\||\breturn|\n)\s*$/;

/** Read a JS string, template or comment starting at i; return the index after it, or -1. */
function skipNonCode(src, i) {
  const c = src[i];
  if (c === "/" && src[i + 1] === "/") {
    const n = src.indexOf("\n", i);
    return n === -1 ? src.length : n;
  }
  if (c === "/" && src[i + 1] === "*") {
    const n = src.indexOf("*/", i + 2);
    return n === -1 ? src.length : n + 2;
  }
  if (c === '"' || c === "'" || c === "`") {
    let j = i + 1;
    while (j < src.length && src[j] !== c) {
      if (src[j] === "\\") j++;
      else if (c === "`" && src[j] === "$" && src[j + 1] === "{") j = skipBraces(src, j + 1) - 1;
      j++;
    }
    return j + 1;
  }
  return -1;
}

/** From an opening `{` at i, return the index after its matching `}`. */
function skipBraces(src, i) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const s = skipNonCode(src, j);
    if (s !== -1) {
      j = s - 1;
      continue;
    }
    if (src[j] === "{") depth++;
    else if (src[j] === "}" && --depth === 0) return j + 1;
  }
  return src.length;
}

/**
 * Every JSX opening tag in `src`: { name, attrs, line, ancestors }, where
 * ancestors are the names of the open elements around it (outermost first).
 */
export function scanJsx(src) {
  const tags = [];
  const stack = [];
  let jsxText = false; // inside element children, where quotes are plain text
  for (let i = 0; i < src.length; i++) {
    if (!jsxText || src[i] === "{") {
      const s = jsxText ? -1 : skipNonCode(src, i);
      if (s !== -1) {
        i = s - 1;
        continue;
      }
    }
    if (src[i] === "{" && jsxText) {
      // An expression container in children: scan inside it as code.
      jsxText = false;
      stack.push({ name: "{", depth: 0 });
      continue;
    }
    if (!jsxText && stack.length && stack.at(-1).name === "{") {
      const top = stack.at(-1);
      if (src[i] === "{") top.depth++;
      else if (src[i] === "}") {
        if (top.depth === 0) {
          stack.pop();
          jsxText = true;
          continue;
        }
        top.depth--;
      }
    }
    if (src[i] !== "<") continue;
    const before = src.slice(Math.max(0, i - 12), i);
    if (!jsxText && !START_AFTER.test(before)) continue;
    const m = /^<(\/?)([A-Za-z][\w.]*)?/.exec(src.slice(i, i + 80));
    if (!m) continue;
    const closing = m[1] === "/";
    const name = m[2] ?? ""; // "" is a fragment
    // Read to the end of the tag, skipping attribute expressions and strings.
    let j = i + m[0].length;
    let selfClosing = false;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === "{") j = skipBraces(src, j) - 1;
      else if (c === '"' || c === "'") j = skipNonCode(src, j) - 1;
      else if (c === "/" && src[j + 1] === ">") {
        selfClosing = true;
        j++;
        break;
      } else if (c === ">") break;
    }
    const line = src.slice(0, i).split("\n").length;
    if (closing) {
      const at = stack.map((e) => e.name).lastIndexOf(name);
      if (at !== -1) stack.length = at;
      jsxText = stack.length > 0 && stack.at(-1).name !== "{";
    } else {
      const ancestors = stack.filter((e) => e.name !== "{").map((e) => e.name);
      tags.push({ name, attrs: src.slice(i + m[0].length, selfClosing ? j - 1 : j), line, ancestors });
      if (!selfClosing) {
        stack.push({ name });
        jsxText = true;
      } else jsxText = stack.length > 0 && stack.at(-1).name !== "{";
    }
    i = j;
  }
  return tags;
}
