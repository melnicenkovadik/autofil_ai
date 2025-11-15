import type { MessageToContent } from '@shared/types/messages';
import { showToast } from './content-utils/toast';
import { fillCurrentField, fillFormForElement, fillAllVisibleFields } from './content-utils/fill';
import { findClosestForm } from './content-utils/selectors';
import { startRecordMode } from './content-utils/record';
import { initHoverUI } from './content-utils/hover-ui';
import { showAddFieldModal } from './content-utils/add-field-modal';
import { logger } from '@shared/utils/logger';
import { getTranslation, initContentI18n } from '@shared/utils/i18n-content';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: true,
  main() {
    logger.info('Content script initialized');
    // Initialize i18n and hover UI
    void (async () => {
      await initContentI18n();
      await initHoverUI();
    })();

    chrome.runtime.onMessage.addListener((message: MessageToContent, _sender, _sendResponse) => {
      logger.debug('Received message', message.type);
  void (async () => {
    switch (message.type) {
          case 'FILL_ONE': {
            const profile = message.payload.profile;
            if (!profile) {
              showToast(await getTranslation('content.noActiveProfile'), 'error');
              break;
            }
            const active = (document.activeElement as HTMLElement | null) ?? null;
            if (!active || !(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement)) {
              showToast(await getTranslation('content.focusInputFirst'), 'info');
              break;
            }
            const ok = await fillCurrentField(active, profile);
            if (ok) {
              const usedAI = (active as any)._autofillUsedAI;
              delete (active as any)._autofillUsedAI;
              showToast(usedAI ? await getTranslation('content.filledFieldAI') : await getTranslation('content.filledField'), 'success');
            } else {
              const addFieldLabel = await getTranslation('content.addField');
              showToast(await getTranslation('content.nothingToFill'), 'info', {
                label: addFieldLabel,
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
            const profile = message.payload.profile;
            if (!profile) {
              showToast(await getTranslation('content.noActiveProfile'), 'error');
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
            
            const toastMessage = count 
              ? await getTranslation('content.filledFields', { count: count.toString() })
              : await getTranslation('content.nothingToFill');
            showToast(toastMessage, count ? 'success' : 'info');
            break;
          }
      case 'TOAST': {
        showToast(message.payload.message, message.payload.variant);
        break;
      }
      case 'RECORD_CAPTURE': {
        startRecordMode();
        showToast(await getTranslation('content.recordMode'), 'info');
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


