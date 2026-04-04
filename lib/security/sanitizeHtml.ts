import sanitizeHtml from "sanitize-html";

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "code",
  "pre",
  "span",
  "div",
];

const DEFAULT_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  "*": ["class"],
};

export function sanitizeHtmlForRender(input: string): string {
  if (!input) return "";

  return sanitizeHtml(input, {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
    disallowedTagsMode: "discard",
  });
}
