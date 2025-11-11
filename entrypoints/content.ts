import type { MessageToContent } from '@shared/types/messages';
import { getActiveProfileId, loadProfilesState } from '@modules/profiles';
import { showToast } from './content-utils/toast';
import { fillCurrentField, fillFormForElement, fillAllVisibleFields } from './content-utils/fill';
import { findClosestForm } from './content-utils/selectors';
import { startRecordMode } from './content-utils/record';
import { initHoverUI } from './content-utils/hover-ui';
import { showAddFieldModal } from './content-utils/add-field-modal';
import { logger } from '@shared/utils/logger';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: true,
  main() {
    logger.info('Content script initialized');
    // Initialize hover UI on page load
    initHoverUI();

    chrome.runtime.onMessage.addListener((message: MessageToContent, _sender, _sendResponse) => {
      logger.debug('Received message', message.type);
  void (async () => {
    switch (message.type) {
          case 'FILL_ONE': {
            const profileId = message.payload.profileId ?? (await getActiveProfileId());
            const profile = (await loadProfilesState()).profiles.find((p) => p.id === profileId) ?? null;
            if (!profile) {
              showToast('No active profile', 'error');
              break;
            }
            const active = (document.activeElement as HTMLElement | null) ?? null;
            if (!active || !(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement)) {
              showToast('Focus an input first', 'info');
              break;
            }
            const ok = await fillCurrentField(active, profile);
            if (ok) {
              const usedAI = (active as any)._autofillUsedAI;
              delete (active as any)._autofillUsedAI;
              showToast(usedAI ? 'Filled field ✨ (AI)' : 'Filled field', 'success');
            } else {
              showToast('Nothing to fill', 'info', {
                label: 'Add Field',
                icon: '+',
                onClick: () => {
                  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) {
                    showAddFieldModal(active);
                  }
                },
              });
            }
            break;
          }
          case 'FILL_FORM': {
            const profileId = message.payload.profileId ?? (await getActiveProfileId());
            const profile = (await loadProfilesState()).profiles.find((p) => p.id === profileId) ?? null;
            if (!profile) {
              showToast('No active profile', 'error');
              break;
            }
            const active = document.activeElement as HTMLElement | null;
            const form = findClosestForm(active) ?? document.querySelector('form');
            
            let count = 0;
            if (form) {
              count = await fillFormForElement(form, profile);
            } else {
              // No form tag, fallback to all visible inputs on page
              count = await fillAllVisibleFields(profile);
            }
            
            showToast(count ? `Filled ${count} field(s)` : 'Nothing to fill', count ? 'success' : 'info');
            break;
          }
      case 'TOAST': {
        showToast(message.payload.message, message.payload.variant);
        break;
      }
      case 'RECORD_CAPTURE': {
        startRecordMode();
        showToast('Record mode: capturing inputs on change', 'info');
        break;
      }
      default:
        break;
    }
  })();
  return true;
});
  },
});


