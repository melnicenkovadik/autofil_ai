import type { Profile, CanonicalKey } from '@shared/types/profile';
import type { InputLike, FieldMeta } from '@modules/mapping/scorer';
import { scoreElementToKey } from '@modules/mapping/scorer';
import { extractMeta, getFormFields } from './selectors';
import { setNativeValue, setSelectValue } from './dom';
import { normalizePhoneNumber, getCountryISO } from '@modules/mapping/normalize';
import { logger } from '@shared/utils/logger';
import type { FieldContext } from '@shared/types/messages';
import { loadSettings } from '@modules/unlock';
import { fillFileInput } from './file-autofill';

const SCORE_THRESHOLD = 5;
const NO_MATCH_EVENT = 'autofill:no-match';

/**
 * Fill a single field with profile data
 */
export async function fillCurrentField(el: InputLike, profile: Profile): Promise<boolean> {
  const result = await detectFieldKey(el);
  const canonicalKey = result?.key || null;
  const usedAI = result?.usedAI || false;
  
  if (!canonicalKey) {
    logger.info('Could not detect field key for', el);
    // Try custom fields before giving up
    const customFilled = matchCustomField(el, profile);
    if (customFilled) {
      return true;
    }
    notifyNoMatch(el);
    return false;
  }
  
  const value = getValueForKey(canonicalKey, profile);
  
  if (!value) {
    logger.info('No value for key', canonicalKey);
    // Try custom fields as fallback
    const customFilled = matchCustomField(el, profile);
    if (customFilled) {
      return true;
    }
    notifyNoMatch(el);
    return false;
  }
  
  const filled = fillField(el, value, canonicalKey);
  if (!filled) {
    notifyNoMatch(el);
    return false;
  }
  
  // Store AI flag for toast
  if (usedAI) {
    (el as any)._autofillUsedAI = true;
  }
  
  return true;
}

/**
 * Fill all fields in a form
 */
export async function fillFormForElement(form: HTMLFormElement, profile: Profile): Promise<number> {
  const fields = getFormFields(form);
  let filledCount = 0;
  
  for (const field of fields) {
    const filled = await fillCurrentField(field, profile);
    if (filled) filledCount++;
  }
  
  return filledCount;
}

/**
 * Fill all visible inputs on the page (fallback when no form tag)
 */
export async function fillAllVisibleFields(profile: Profile): Promise<number> {
  const allInputs = document.querySelectorAll<InputLike>('input, textarea, select');
  let filledCount = 0;
  
  for (const input of allInputs) {
    // Skip hidden/invisible fields
    if (input.offsetParent === null || input.type === 'hidden') {
      continue;
    }
    
    const filled = await fillCurrentField(input, profile);
    if (filled) filledCount++;
  }
  
  return filledCount;
}

/**
 * Detect the canonical key for a field
 * Priority: Scorer → AI (if enabled)
 */
async function detectFieldKey(el: InputLike): Promise<{ key: CanonicalKey; usedAI: boolean } | null> {
  // 1. Use scorer with heuristics
  const meta = extractMeta(el);
  const scored = scoreElementToKey(el, meta);
  
  if (scored && scored.score >= SCORE_THRESHOLD) {
    logger.info('Matched by scorer', scored.key, scored.score);
    return { key: scored.key, usedAI: false };
  }
  
  // 2. Try AI if enabled and score is low but not zero
  if (scored && scored.score > 0 && scored.score < SCORE_THRESHOLD) {
    const settings = await loadSettings();
    
    if (settings.aiEnabled && settings.openaiApiKey) {
      logger.info('Trying AI classification for low-confidence field');
      const aiKey = await classifyWithAI(el, meta);
      if (aiKey) {
        logger.info('✨ AI classified as', aiKey);
        return { key: aiKey, usedAI: true };
      }
    }
  }
  
  return scored?.key ? { key: scored.key, usedAI: false } : null;
}

/**
 * Classify field using AI (via background script)
 */
async function classifyWithAI(el: InputLike, meta: FieldMeta): Promise<CanonicalKey | null> {
  try {
    const context: FieldContext = {
      tag: el.tagName.toLowerCase(),
      type: (el as HTMLInputElement).type || undefined,
      autocomplete: el.getAttribute('autocomplete') || undefined,
      name: el.getAttribute('name') || undefined,
      id: el.id || undefined,
      className: el.className || undefined,
      label: meta.labelText || undefined,
      placeholder: meta.placeholder || undefined,
      ariaLabel: meta.ariaLabel || undefined,
      nearbyText: meta.nearbyText || undefined,
    };
    
    const response = await chrome.runtime.sendMessage({
      type: 'AI_CLASSIFY',
      payload: { context },
    });
    
    if (response?.ok && response.key) {
      return response.key as CanonicalKey;
    }
  } catch (e) {
    logger.warn('AI classification failed', e);
  }
  
  return null;
}

/**
 * Get value from profile for a canonical key
 */
function getValueForKey(key: CanonicalKey, profile: Profile): string {
  // Check canonical fields
  if (profile.fields[key]) {
    return profile.fields[key];
  }
  
  // Check custom fields
  if (profile.custom) {
    const custom = profile.custom.find((c) => c.key === key);
    if (custom) return custom.value;
  }
  
  return '';
}

/**
 * Fill a field with a value
 */
function fillField(el: InputLike, value: string, key: CanonicalKey): boolean {
  if (!value) return false;
  
  try {
    if (el instanceof HTMLSelectElement) {
      // Handle select elements
      let valueToSet = value;
      
      // Special handling for countries
      if (key === 'country') {
        valueToSet = getCountryISO(value);
      }
      
      return setSelectValue(el, valueToSet);
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      let valueToSet = value;
      
      // Special handling for phone numbers
      if (key === 'phonePrimary' || key === 'phoneAlt') {
        valueToSet = normalizePhoneNumber(value);
      }
      
      // Special handling for countries in text inputs
      if (key === 'country') {
        valueToSet = getCountryISO(value);
      }
      
      setNativeValue(el, valueToSet);
      return true;
    }
  } catch (e) {
    logger.warn('Failed to fill field', e);
  }
  
  return false;
}

function notifyNoMatch(el: InputLike): void {
  window.dispatchEvent(
    new CustomEvent(NO_MATCH_EVENT, {
      detail: { element: el },
    }),
  );
}

/**
 * Try to match custom field keys against field metadata (name/id/class/placeholder)
 */
function matchCustomField(el: InputLike, profile: Profile): boolean {
  if (!profile.custom || profile.custom.length === 0) return false;
  
  const meta = extractMeta(el);
  const searchText = [
    (el.getAttribute('name') || '').toLowerCase(),
    (el.getAttribute('id') || '').toLowerCase(),
    (el.getAttribute('class') || '').toLowerCase(),
    meta.labelText?.toLowerCase() || '',
    meta.placeholder?.toLowerCase() || '',
  ]
    .filter(Boolean)
    .join(' ');
  
  for (const custom of profile.custom) {
    const customKeyPattern = new RegExp(`\\b${custom.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (customKeyPattern.test(searchText)) {
      logger.info('Matched custom field', custom.key, custom.type);
      
      // Handle file inputs specially
      if (custom.type === 'file' && el instanceof HTMLInputElement && el.type === 'file') {
        return fillFileInput(el, custom);
      }
      
      // Handle regular inputs
      setNativeValue(el, custom.value);
      return true;
    }
  }
  
  return false;
}

