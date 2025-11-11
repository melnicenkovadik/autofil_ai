import type { InputLike } from '@modules/mapping/scorer';
import { getActiveProfileId, loadProfilesState, updateProfile } from '@modules/profiles';
import { showToast } from './toast';
import { logger } from '@shared/utils/logger';

let modalHost: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let currentElement: InputLike | null = null;

export function showAddFieldModal(element: InputLike): void {
  currentElement = element;
  
  if (!modalHost) {
    createModal();
  }
  
  if (modalHost) {
    modalHost.style.display = 'flex';
    
    // Get suggested field name from element
    const suggestedName = 
      element.getAttribute('name') || 
      element.getAttribute('id') || 
      element.getAttribute('placeholder') || 
      'field';
    
    const fieldNameInput = shadowRoot?.querySelector<HTMLInputElement>('#field-name-input');
    if (fieldNameInput) {
      fieldNameInput.value = suggestedName;
      fieldNameInput.select();
    }
  }
}

function createModal(): void {
  modalHost = document.createElement('div');
  modalHost.id = 'autofill-add-field-modal-host';
  modalHost.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
  `;
  
  document.body.appendChild(modalHost);
  shadowRoot = modalHost.attachShadow({ mode: 'open' });
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  modalContent.innerHTML = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      h2 {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }
      
      .subtitle {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
      }
      
      input, select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        background: white;
        transition: border-color 0.2s;
      }
      
      input:focus, select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .actions {
        display: flex;
        gap: 12px;
        margin-top: 28px;
        justify-content: flex-end;
      }
      
      button {
        padding: 10px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      
      .btn-cancel {
        background: #f3f4f6;
        color: #374151;
      }
      
      .btn-cancel:hover {
        background: #e5e7eb;
      }
      
      .btn-save {
        background: #3b82f6;
        color: white;
      }
      
      .btn-save:hover {
        background: #2563eb;
      }
      
      .hint {
        font-size: 13px;
        color: #9ca3af;
        margin-top: 6px;
      }
    </style>
    
    <h2>Add Custom Field</h2>
    <p class="subtitle">Create a custom field mapping for this input</p>
    
    <div class="form-group">
      <label for="field-name-input">Field Name</label>
      <input 
        type="text" 
        id="field-name-input" 
        placeholder="e.g., twitter, department, manager"
      />
      <p class="hint">This name will be used to match the field in the future</p>
    </div>
    
    <div class="form-group">
      <label for="field-type-select">Field Type</label>
      <select id="field-type-select">
        <option value="text">Text</option>
        <option value="email">Email</option>
        <option value="tel">Phone</option>
        <option value="url">URL</option>
        <option value="date">Date</option>
        <option value="multiline">Multiline</option>
        <option value="file">File (Base64, max 2 MB)</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="field-value-input">Default Value</label>
      <input 
        type="text" 
        id="field-value-input" 
        placeholder="Enter the value to autofill"
      />
      <input 
        type="file" 
        id="field-file-input" 
        style="display: none;"
        accept="*/*"
      />
      <p class="hint" id="value-hint">This value will be used to fill this field</p>
    </div>
    
    <div class="actions">
      <button class="btn-cancel" id="cancel-btn">Cancel</button>
      <button class="btn-save" id="save-btn">Save Custom Field</button>
    </div>
  `;
  
  shadowRoot.appendChild(modalContent);
  
  // Prevent clicks inside modal from closing it
  modalContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Event listeners
  const cancelBtn = shadowRoot.querySelector('#cancel-btn');
  const saveBtn = shadowRoot.querySelector('#save-btn');
  const fieldTypeSelect = shadowRoot.querySelector<HTMLSelectElement>('#field-type-select');
  const fieldValueInput = shadowRoot.querySelector<HTMLInputElement>('#field-value-input');
  const fieldFileInput = shadowRoot.querySelector<HTMLInputElement>('#field-file-input');
  const valueHint = shadowRoot.querySelector('#value-hint');
  
  cancelBtn?.addEventListener('click', hideModal);
  saveBtn?.addEventListener('click', handleSave);
  
  // Toggle between text and file input based on type
  fieldTypeSelect?.addEventListener('change', () => {
    const isFileType = fieldTypeSelect.value === 'file';
    if (fieldValueInput && fieldFileInput && valueHint) {
      fieldValueInput.style.display = isFileType ? 'none' : 'block';
      fieldFileInput.style.display = isFileType ? 'block' : 'none';
      valueHint.textContent = isFileType 
        ? 'Upload a file (max 2 MB). It will be stored as Base64.' 
        : 'This value will be used to fill this field';
    }
  });
  
  // Close on overlay click (outside modal content)
  modalHost.addEventListener('click', (e) => {
    if (e.target === modalHost) {
      hideModal();
    }
  });
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalHost?.style.display === 'flex') {
      hideModal();
    }
  });
}

function hideModal(): void {
  if (modalHost) {
    modalHost.style.display = 'none';
  }
  currentElement = null;
}

async function handleSave(): Promise<void> {
  if (!shadowRoot || !currentElement) return;
  
  const fieldNameInput = shadowRoot.querySelector<HTMLInputElement>('#field-name-input');
  const fieldTypeSelect = shadowRoot.querySelector<HTMLSelectElement>('#field-type-select');
  const fieldValueInput = shadowRoot.querySelector<HTMLInputElement>('#field-value-input');
  const fieldFileInput = shadowRoot.querySelector<HTMLInputElement>('#field-file-input');
  
  const fieldName = fieldNameInput?.value.trim();
  const fieldType = fieldTypeSelect?.value || 'text';
  
  if (!fieldName) {
    showToast('Field name is required', 'error');
    return;
  }
  
  // Handle file type
  if (fieldType === 'file') {
    const file = fieldFileInput?.files?.[0];
    if (!file) {
      showToast('Please select a file', 'error');
      return;
    }
    
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE) {
      showToast(`File too large. Max 2 MB (current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'error');
      return;
    }
    
    try {
      await saveCustomFieldWithFile(fieldName, fieldType, file);
    } catch (error) {
      logger.error('Failed to save custom field with file', error);
      showToast('Failed to save custom field', 'error');
    }
    return;
  }
  
  // Handle regular text value
  const fieldValue = fieldValueInput?.value || '';
  
  try {
    await saveCustomFieldWithValue(fieldName, fieldType, fieldValue);
  } catch (error) {
    logger.error('Failed to save custom field', error);
    showToast('Failed to save custom field', 'error');
  }
}

async function saveCustomFieldWithFile(fieldName: string, fieldType: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await saveCustomFieldWithValue(fieldName, fieldType, base64, file.name, file.type);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

async function saveCustomFieldWithValue(
  fieldName: string, 
  fieldType: string, 
  fieldValue: string,
  fileName?: string,
  fileType?: string
): Promise<void> {
  const profileId = await getActiveProfileId();
  if (!profileId) {
    showToast('No active profile', 'error');
    return;
  }
  
  const state = await loadProfilesState();
  const profile = state.profiles.find((p) => p.id === profileId);
  
  if (!profile) {
    showToast('Profile not found', 'error');
    return;
  }
  
  const existingCustom = profile.custom || [];
  const existingIndex = existingCustom.findIndex((c) => c.key === fieldName);
  
  const newField = {
    key: fieldName,
    type: fieldType as any,
    value: fieldValue,
    ...(fileName && { fileName }),
    ...(fileType && { fileType }),
  };
  
  let updatedCustom;
  if (existingIndex >= 0) {
    // Update existing
    updatedCustom = existingCustom.map((c, i) => (i === existingIndex ? newField : c));
  } else {
    // Add new
    updatedCustom = [...existingCustom, newField];
  }
  
  await updateProfile(profileId, { custom: updatedCustom });
  
  const displayValue = fileName || (fieldValue.length > 30 ? fieldValue.substring(0, 30) + '...' : fieldValue);
  showToast(`Custom field "${fieldName}" saved`, 'success');
  logger.info('Custom field saved', fieldName, displayValue);
  
  hideModal();
  
  // Try to fill the field again
  if (fieldValue) {
    chrome.runtime.sendMessage({ type: 'REQUEST_FILL_ONE' }).catch(() => {});
  }
}

export function cleanupAddFieldModal(): void {
  if (modalHost && modalHost.parentElement) {
    modalHost.parentElement.removeChild(modalHost);
  }
  modalHost = null;
  shadowRoot = null;
  currentElement = null;
}

