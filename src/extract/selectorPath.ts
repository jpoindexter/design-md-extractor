export function selectorPath(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 4) {
    const tag = current.tagName.toLowerCase();
    const className = Array.from(current.classList).slice(0, 2).join('.');
    parts.unshift(className ? `${tag}.${className}` : tag);
    current = current.parentElement;
  }

  return parts.join(' > ');
}
