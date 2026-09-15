declare module "sanitize-html" {
  type Transform = (
    tagName: string,
    attribs: Record<string, string>,
  ) => {
    tagName: string;
    attribs: Record<string, string>;
  };

  interface Options {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    transformTags?: Record<string, Transform>;
  }

  interface SanitizeHtml {
    (html: string, options?: Options): string;
    simpleTransform(
      tagName: string,
      attribs?: Record<string, string>,
    ): Transform;
  }

  const sanitizeHtml: SanitizeHtml;
  export default sanitizeHtml;
}
