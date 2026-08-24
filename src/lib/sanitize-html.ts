const ALLOWED_TAGS = new Set([
  "a",
  "article",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "header",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "small",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);
const COMMON_ATTRIBUTES = new Set(["class", "title"]);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
};

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeUrl(value: string, allowImageData = false) {
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(normalized) ||
    (allowImageData && /^data:image\/(?:gif|jpeg|png|webp);base64,/i.test(normalized))
  ) {
    return value.trim();
  }
  return null;
}

function sanitizeTag(token: string) {
  const closing = /^<\s*\//.test(token);
  const nameMatch = token.match(/^<\s*\/?\s*([a-z0-9]+)/i);
  if (!nameMatch) return "";

  const tagName = nameMatch[1].toLowerCase();
  if (!ALLOWED_TAGS.has(tagName)) return "";
  if (closing) return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;

  const rawAttributes = token
    .slice(nameMatch[0].length, token.lastIndexOf(">"))
    .replace(/\/$/, "");
  const attributes: string[] = [];
  const attributePattern =
    /([a-zA-Z][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(rawAttributes)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (
      name.startsWith("on") ||
      name === "style" ||
      name === "srcdoc" ||
      (!COMMON_ATTRIBUTES.has(name) && !TAG_ATTRIBUTES[tagName]?.has(name))
    ) {
      continue;
    }

    let safeValue = value;
    if (name === "href") {
      const url = safeUrl(value);
      if (!url) continue;
      safeValue = url;
    }
    if (name === "src") {
      const url = safeUrl(value, true);
      if (!url) continue;
      safeValue = url;
    }
    if (name === "target" && !["_blank", "_self"].includes(value)) continue;
    if (["width", "height", "colspan", "rowspan"].includes(name)) {
      if (!/^\d{1,4}$/.test(value)) continue;
    }
    if (name === "class" && !/^[a-zA-Z0-9_:\-/\s\[\].%]+$/.test(value)) continue;

    attributes.push(`${name}="${escapeAttribute(safeValue)}"`);
  }

  if (tagName === "a" && attributes.some((attr) => attr === 'target="_blank"')) {
    const relIndex = attributes.findIndex((attr) => attr.startsWith("rel="));
    if (relIndex >= 0) attributes.splice(relIndex, 1);
    attributes.push('rel="noopener noreferrer"');
  }

  return `<${tagName}${attributes.length ? ` ${attributes.join(" ")}` : ""}${
    VOID_TAGS.has(tagName) ? " /" : ""
  }>`;
}

/**
 * Small allow-list sanitizer for administrator-authored training HTML.
 * Disallowed tags/attributes are removed and stray markup is rendered as text.
 */
export function sanitizeTrainingHtml(html: string) {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const tagPattern = /<[^>]*>/g;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(withoutComments)) !== null) {
    output += withoutComments.slice(cursor, match.index).replace(/</g, "&lt;");
    output += sanitizeTag(match[0]);
    cursor = match.index + match[0].length;
  }

  output += withoutComments.slice(cursor).replace(/</g, "&lt;");
  return output;
}
