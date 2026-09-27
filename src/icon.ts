// A small decorative subset, not a general HTML sanitizer. No DOM globals on import.
const HTML_TAGS = new Set(['span', 'i', 'b', 'em']);
const SVG_TAGS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'title', 'desc']);
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Copy trusted, passive icon markup into the manager's document before retaining it. */
export function cloneToastIcon(value: unknown, doc: Document): HTMLElement | SVGElement | null {
  if (value == null) return null;
  const owner = (value as Element).ownerDocument;
  const ctor = owner?.defaultView?.Element ?? doc.defaultView?.Element;
  if (!ctor || !(value instanceof ctor)) throw new TypeError('Toast icon must be an HTML or SVG element, not HTML text.');
  for (const element of [value, ...value.querySelectorAll('*')]) {
    const allowed = element.namespaceURI === HTML_NS ? HTML_TAGS : element.namespaceURI === SVG_NS ? SVG_TAGS : null;
    if (!allowed?.has(element.localName)) throw new TypeError('Toast icon contains an unsupported element.');
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || name.startsWith('data-a11y-toast') ||
          ['id', 'is', 'style', 'tabindex', 'contenteditable', 'autofocus', 'role', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy', 'href', 'xlink:href', 'src', 'srcset'].includes(name) ||
          (name === 'focusable' && attribute.value !== 'false') || /url\s*\(/i.test(attribute.value)) {
        throw new TypeError('Toast icon contains an unsupported attribute or reference.');
      }
    }
  }
  return doc.importNode(value, true) as HTMLElement | SVGElement;
}
