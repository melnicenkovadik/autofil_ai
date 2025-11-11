import type { InputLike } from '@modules/mapping/scorer';
import type { FieldMeta } from '@modules/mapping/scorer';

/**
 * Find the closest form element for a given element
 */
export function findClosestForm(element: HTMLElement | null): HTMLFormElement | null {
  if (!element) return null;
  
  // Check if element itself is a form
  if (element instanceof HTMLFormElement) return element;
  
  // Try closest() first (most efficient)
  const form = element.closest('form');
  if (form) return form;
  
  // Check if element is inside a shadow root
  let current: HTMLElement | null = element;
  while (current) {
    if (current instanceof HTMLFormElement) return current;
    
    const parent = current.parentElement;
    if (parent) {
      current = parent;
    } else if ((current as any).host) {
      // Jump out of shadow DOM
      current = (current as any).host;
    } else {
      break;
    }
  }
  
  return null;
}

/**
 * Check if an element is visible (not hidden by CSS or attributes)
 */
export function isVisible(el: HTMLElement): boolean {
  if (!el) return false;
  
  // Check explicit hidden attributes
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  // Check type="hidden" for inputs
  if (el instanceof HTMLInputElement && el.type === 'hidden') {
    return false;
  }
  
  // Check computed style
  const style = window.getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    style.width === '0px' ||
    style.height === '0px'
  ) {
    return false;
  }
  
  // Check if offscreen
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }
  
  return true;
}

/**
 * Extract metadata about a field for scoring
 */
export function extractMeta(el: InputLike): FieldMeta {
  const meta: FieldMeta = {};
  
  // Get associated label
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) {
      meta.labelText = label.textContent?.trim() || '';
    }
  }
  
  // If no label by "for", check if element is wrapped in a label
  if (!meta.labelText) {
    const parentLabel = el.closest('label');
    if (parentLabel) {
      // Get label text without the input's value
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      const inputs = clone.querySelectorAll('input, textarea, select');
      inputs.forEach(input => input.remove());
      meta.labelText = clone.textContent?.trim() || '';
    }
  }
  
  // Placeholder
  meta.placeholder = el.getAttribute('placeholder') || '';
  
  // ARIA label
  meta.ariaLabel = el.getAttribute('aria-label') || '';
  
  // aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy && !meta.ariaLabel) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) {
      meta.ariaLabel = labelElement.textContent?.trim() || '';
    }
  }
  
  // Nearby text (previous sibling text nodes, parent text)
  const nearbyTexts: string[] = [];
  
  // Check previous siblings
  let sibling = el.previousSibling;
  let count = 0;
  while (sibling && count < 3) {
    if (sibling.nodeType === Node.TEXT_NODE) {
      const text = sibling.textContent?.trim();
      if (text) nearbyTexts.push(text);
    } else if (sibling.nodeType === Node.ELEMENT_NODE) {
      const elemText = (sibling as Element).textContent?.trim();
      if (elemText && elemText.length < 100) {
        nearbyTexts.push(elemText);
      }
    }
    sibling = sibling.previousSibling;
    count++;
  }
  
  // Check parent's text (but limit length)
  const parent = el.parentElement;
  if (parent && parent.textContent) {
    const parentText = parent.textContent.trim();
    if (parentText.length < 200) {
      nearbyTexts.push(parentText);
    }
  }
  
  meta.nearbyText = nearbyTexts.join(' ').slice(0, 200);
  
  return meta;
}

/**
 * Get all fillable fields in a form
 */
export function getFormFields(form: HTMLFormElement): InputLike[] {
  const fields: InputLike[] = [];
  
  // Get all input, textarea, select elements
  const inputs = form.querySelectorAll<HTMLInputElement>('input');
  const textareas = form.querySelectorAll<HTMLTextAreaElement>('textarea');
  const selects = form.querySelectorAll<HTMLSelectElement>('select');
  
  [...inputs, ...textareas, ...selects].forEach((el) => {
    if (isVisible(el)) {
      fields.push(el);
    }
  });
  
  return fields;
}

/**
 * Generate a stable CSS selector for an element
 */
export function generateSelector(el: HTMLElement): string {
  // Try ID first (most stable)
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }
  
  // Try name attribute
  const name = el.getAttribute('name');
  if (name) {
    const tagName = el.tagName.toLowerCase();
    return `${tagName}[name="${CSS.escape(name)}"]`;
  }
  
  // Generate path with nth-child
  const path: string[] = [];
  let current: Element | null = el;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }
    
    // Add nth-child if needed
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (sibling) => sibling.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

