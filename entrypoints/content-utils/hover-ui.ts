import type { InputLike } from '@modules/mapping/scorer';
import type { CanonicalKey } from '@shared/types/profile';
import { CANONICAL_FIELDS } from '@shared/constants/canonical-fields';
import { addRuleForElement } from './record';
import { logger } from '@shared/utils/logger';
import { getTranslation } from '@shared/utils/i18n-content';

type NoMatchDetail = {
  element: InputLike;
};

let DEFAULT_MESSAGE = '⌥⇧I to fill field • ⌥⇧F to fill form';
let NO_MATCH_MESSAGE = 'No data for this field. Add an autofill rule?';

let shadowHost: HTMLDivElement | null = null;
let tooltip: HTMLDivElement | null = null;
let messageSpan: HTMLSpanElement | null = null;
let addButton: HTMLButtonElement | null = null;
let formContainer: HTMLDivElement | null = null;
let fieldSelect: HTMLSelectElement | null = null;
let saveButton: HTMLButtonElement | null = null;
let cancelButton: HTMLButtonElement | null = null;
let pendingElement: InputLike | null = null;

/**
 * Initialize hover UI system
 */
export async function initHoverUI(): Promise<void> {
  // Load translations
  DEFAULT_MESSAGE = await getTranslation('content.hotkeyHint');
  NO_MATCH_MESSAGE = await getTranslation('content.noDataForField');
  
  // Listen to focus events on the page
  document.addEventListener('focusin', handleFocus, true);
  document.addEventListener('focusout', handleBlur, true);
  window.addEventListener('autofill:no-match', handleNoMatch as EventListener);
  
  // Hide tooltip on scroll
  window.addEventListener('scroll', hideTooltip, true);
  document.addEventListener('scroll', hideTooltip, true);
  
  // Update button text
  if (addButton) {
    getTranslation('content.addToAutofill').then(text => {
      if (addButton) addButton.textContent = text;
    });
  }
  
  // Update message span if already created
  if (messageSpan) {
    messageSpan.textContent = DEFAULT_MESSAGE;
  }
}

/**
 * Handle focus on input elements
 */
function handleFocus(event: Event): void {
  const target = event.target;
  
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return;
  }
  
  if (pendingElement && target !== pendingElement) {
    resetRulePrompt();
  }
  
  showTooltip(target);
}

/**
 * Handle blur (losing focus)
 */
function handleBlur(): void {
  hideTooltip();
  resetRulePrompt();
}

/**
 * Show tooltip near the focused element
 */
function showTooltip(target: HTMLElement): void {
  if (!shadowHost) {
    createShadowHost();
  }
  
  if (!tooltip || !messageSpan) return;
  
  // Update message text in case translation was loaded after creation
  // Only update if it's still the default message (not changed by showRulePrompt)
  const currentText = messageSpan.textContent || '';
  if (DEFAULT_MESSAGE && 
      (currentText === '⌥⇧I to fill field • ⌥⇧F to fill form' || 
       currentText === DEFAULT_MESSAGE ||
       currentText.includes('⌥⇧I'))) {
    messageSpan.textContent = DEFAULT_MESSAGE;
  }
  
  const rect = target.getBoundingClientRect();
  
  // Position tooltip above the input
  const top = rect.top + window.scrollY - 35;
  const left = rect.left + window.scrollX + rect.width / 2;
  
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.style.opacity = '1';
  tooltip.style.pointerEvents = 'auto';
}

/**
 * Hide tooltip
 */
function hideTooltip(): void {
  if (!tooltip) return;
  tooltip.style.opacity = '0';
  tooltip.style.pointerEvents = 'none';
}

/**
 * Create shadow DOM container for tooltip
 */
function createShadowHost(): void {
  // Create host element
  shadowHost = document.createElement('div');
  shadowHost.id = 'autofill-hover-ui-host';
  shadowHost.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 2147483646;
    pointer-events: none;
  `;
  
  document.body.appendChild(shadowHost);
  
  // Create shadow root
  const shadow = shadowHost.attachShadow({ mode: 'open' });
  
  // Create tooltip element
  tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    white-space: nowrap;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `;
  messageSpan = document.createElement('span');
  messageSpan.textContent = DEFAULT_MESSAGE || '⌥⇧I to fill field • ⌥⇧F to fill form';
  tooltip.appendChild(messageSpan);

  addButton = document.createElement('button');
  getTranslation('content.addToAutofill').then(text => {
    if (addButton) addButton.textContent = text;
  });
  addButton.style.cssText = `
    margin-top: 8px;
    background: #0969ff;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    display: none;
  `;
  addButton.addEventListener('click', () => {
    void showRulePrompt(true);
  });
  tooltip.appendChild(addButton);

  formContainer = document.createElement('div');
  formContainer.style.cssText = `
    margin-top: 8px;
    display: none;
    flex-direction: column;
    gap: 4px;
  `;

  fieldSelect = document.createElement('select');
  fieldSelect.style.cssText = `
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 12px;
  `;
  // Load translated field labels asynchronously
  (async () => {
    for (const field of CANONICAL_FIELDS) {
      const option = document.createElement('option');
      option.value = field.key;
      option.textContent = await getTranslation(`fields.${field.key}`);
      fieldSelect.appendChild(option);
    }
  })();
  formContainer.appendChild(fieldSelect);

  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'display: flex; gap: 6px; justify-content: space-between;';

  saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.style.cssText = `
    flex: 1;
    background: #2da44e;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
    cursor: pointer;
  `;
  saveButton.addEventListener('click', handleSaveRule);

  cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText = `
    flex: 1;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
    cursor: pointer;
  `;
  cancelButton.addEventListener('click', (event) => {
    event.preventDefault();
    void showRulePrompt(false);
  });

  actionRow.appendChild(saveButton);
  actionRow.appendChild(cancelButton);
  formContainer.appendChild(actionRow);

  tooltip.appendChild(formContainer);
  
  // Create arrow
  const arrow = document.createElement('div');
  arrow.style.cssText = `
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid rgba(0, 0, 0, 0.9);
  `;
  tooltip.appendChild(arrow);
  
  shadow.appendChild(tooltip);
}

/**
 * Clean up hover UI
 */
export function cleanupHoverUI(): void {
  document.removeEventListener('focusin', handleFocus, true);
  document.removeEventListener('focusout', handleBlur, true);
  window.removeEventListener('autofill:no-match', handleNoMatch as EventListener);
  window.removeEventListener('scroll', hideTooltip, true);
  document.removeEventListener('scroll', hideTooltip, true);
  
  if (shadowHost && shadowHost.parentElement) {
    shadowHost.parentElement.removeChild(shadowHost);
  }
  
  shadowHost = null;
  tooltip = null;
  messageSpan = null;
  addButton = null;
  formContainer = null;
  fieldSelect = null;
  saveButton = null;
  cancelButton = null;
  pendingElement = null;
}

function handleNoMatch(event: CustomEvent<NoMatchDetail>): void {
  // No longer show the hover UI prompt since we have the toast with + button
  // Just keep the element reference in case we need it later
  const target = event.detail?.element;
  if (!target) return;
  pendingElement = target;
}

async function showRulePrompt(showForm: boolean): Promise<void> {
  if (!messageSpan || !addButton || !formContainer) return;
  const text = showForm ? await getTranslation('content.selectFieldToMap') : NO_MATCH_MESSAGE;
  messageSpan.textContent = text;
  addButton.style.display = showForm ? 'none' : 'block';
  formContainer.style.display = showForm ? 'flex' : 'none';
  if (showForm && fieldSelect) {
    fieldSelect.focus();
  }
}

function resetRulePrompt(): void {
  pendingElement = null;
  if (messageSpan) {
    messageSpan.textContent = DEFAULT_MESSAGE || '⌥⇧I to fill field • ⌥⇧F to fill form';
  }
  if (addButton) addButton.style.display = 'none';
  if (formContainer) formContainer.style.display = 'none';
}

async function handleSaveRule(event: Event): Promise<void> {
  event.preventDefault();
  if (!pendingElement || !fieldSelect) {
    return;
  }
  const key = fieldSelect.value as CanonicalKey;
  if (!key) {
    return;
  }

  const saved = await addRuleForElement(pendingElement, key);
  if (saved) {
    resetRulePrompt();
    if (messageSpan) {
      messageSpan.textContent = 'Rule saved. Try filling again.';
      setTimeout(() => {
        if (messageSpan) messageSpan.textContent = DEFAULT_MESSAGE;
      }, 2000);
    }
    chrome.runtime.sendMessage({ type: 'REQUEST_FILL_ONE' }).catch(() => {});
  }
}

export function showAddRulePrompt(element: InputLike): void {
  pendingElement = element;
  logger.info('Showing add rule prompt for', element);
  if (fieldSelect) {
    fieldSelect.value = fieldSelect.options[0]?.value ?? '';
  }
  showTooltip(element);
  showRulePrompt(false);
}

