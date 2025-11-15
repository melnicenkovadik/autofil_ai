import { extractMeta, isVisible } from './selectors';
import { scoreElementToKey } from '@modules/mapping/scorer';
import { logger } from '@shared/utils/logger';
import { showToast } from './toast';
import { getTranslation } from '@shared/utils/i18n-content';
import type { CanonicalKey } from '@shared/types/profile';

let isRecording = false;
const recordedFields = new Set<HTMLElement>();

/**
 * Start Record Mode - capture user inputs and save field mappings
 */
export function startRecordMode(): void {
  if (isRecording) {
    void stopRecordMode();
    return;
  }
  
  isRecording = true;
  recordedFields.clear();
  
  // Listen to all input changes
  document.addEventListener('input', handleInputChange, true);
  document.addEventListener('change', handleInputChange, true);
  
  logger.info('Record mode started');
}

/**
 * Stop Record Mode
 */
export async function stopRecordMode(): Promise<void> {
  if (!isRecording) return;
  
  isRecording = false;
  document.removeEventListener('input', handleInputChange, true);
  document.removeEventListener('change', handleInputChange, true);
  
  logger.info('Record mode stopped, recorded', recordedFields.size, 'fields');
  const message = await getTranslation('content.recordedFields', { count: recordedFields.size.toString() });
  showToast(message, 'success');
  
  recordedFields.clear();
}

export async function addRuleForElement(el: InputLike, key: CanonicalKey): Promise<boolean> {
  // Domain rules removed - this function is no longer used
  logger.info('addRuleForElement called but domain rules are disabled', el, key);
  const message = await getTranslation('content.domainRulesDisabled');
  showToast(message, 'info');
  return false;
}

/**
 * Handle input change during record mode
 */
async function handleInputChange(event: Event): Promise<void> {
  if (!isRecording) return;
  
  const target = event.target;
  
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return;
  }
  
  // Skip if already recorded
  if (recordedFields.has(target)) return;
  
  // Skip if not visible
  if (!isVisible(target)) return;
  
  // Skip if empty
  const value = target.value?.trim();
  if (!value) return;
  
  // Try to detect the field type
  const meta = extractMeta(target);
  const scored = scoreElementToKey(target, meta);
  
  if (!scored || scored.score < 3) {
    logger.info('Skipping field with low confidence score');
    return;
  }
  
  // Just log the detection for now (domain rules removed)
  recordedFields.add(target);
  logger.info('Detected field', scored.key, 'with score', scored.score);
}

/**
 * Check if currently recording
 */
export function isRecordModeActive(): boolean {
  return isRecording;
}

