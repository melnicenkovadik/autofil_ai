export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  const setter = desc?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    (el as any).value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export function setSelectValue(select: HTMLSelectElement, value: string): boolean {
  // Try exact value match
  const byValue = Array.from(select.options).find((o) => o.value.toLowerCase() === value.toLowerCase());
  if (byValue) {
    select.value = byValue.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  // Try label/text match
  const byText = Array.from(select.options).find((o) => o.text.trim().toLowerCase() === value.trim().toLowerCase());
  if (byText) {
    select.value = byText.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}


