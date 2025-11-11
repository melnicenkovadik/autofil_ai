import type { CustomField } from '@shared/types/profile';
import { logger } from '@shared/utils/logger';

/**
 * Autofill a file input with Base64 data from custom field
 */
export function fillFileInput(inputEl: HTMLInputElement, customField: CustomField): boolean {
  if (inputEl.type !== 'file' || !customField.value || !customField.fileName) {
    return false;
  }

  try {
    // Parse Base64 data URL
    const dataUrl = customField.value;
    if (!dataUrl.startsWith('data:')) {
      logger.warn('Invalid Base64 data for file field');
      return false;
    }

    // Extract mime type and base64 content
    const [header, base64Content] = dataUrl.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : customField.fileType || 'application/octet-stream';

    // Convert Base64 to Blob
    const byteString = atob(base64Content);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([uint8Array], { type: mimeType });
    const file = new File([blob], customField.fileName, { type: mimeType });

    // Create DataTransfer and assign to input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputEl.files = dataTransfer.files;

    // Trigger change event
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));

    logger.info('File input filled', customField.fileName);
    return true;
  } catch (error) {
    logger.warn('Failed to fill file input', error);
    return false;
  }
}

