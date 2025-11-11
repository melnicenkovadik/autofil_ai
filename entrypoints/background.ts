import { HOTKEYS } from '@modules/hotkeys';
import { getActiveProfileId } from '@modules/profiles';
import { isUnlocked, loadSettings } from '@modules/unlock';
import type { MessageToBackground, MessageToContent, BgCommand } from '@shared/types/messages';
import { logger } from '@shared/utils/logger';

export default defineBackground(() => {
  async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  async function sendToContent(tabId: number, msg: MessageToContent): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, msg);
    } catch (e) {
      logger.warn('sendToContent failed', e);
    }
  }

  chrome.runtime.onInstalled.addListener(async () => {
  logger.info('Extension installed/updated');
  // Touch settings to ensure defaults exist
  await loadSettings();
});

chrome.commands.onCommand.addListener(async (command) => {
  const cmd = command as BgCommand;
  if (cmd !== HOTKEYS.fillField && cmd !== HOTKEYS.fillForm) return;
  const unlocked = await isUnlocked();
  const activeTab = await getActiveTab();
  if (!activeTab?.id) return;
  if (!unlocked) {
    await sendToContent(activeTab.id, { type: 'TOAST', payload: { message: 'Locked. Unlock to autofill.', variant: 'error' } });
    return;
  }
  const profileId = await getActiveProfileId();
  if (cmd === HOTKEYS.fillField) {
    await sendToContent(activeTab.id, { type: 'FILL_ONE', payload: { profileId } });
  } else {
    await sendToContent(activeTab.id, { type: 'FILL_FORM', payload: { profileId } });
  }
});

chrome.runtime.onMessage.addListener((message: MessageToBackground, _sender, sendResponse) => {
  void (async () => {
    switch (message.type) {
      case 'REQUEST_FILL_ONE': {
        const unlocked = await isUnlocked();
        const tab = await getActiveTab();
        if (!tab?.id) break;
        if (!unlocked) {
          await sendToContent(tab.id, { type: 'TOAST', payload: { message: 'Locked. Unlock to autofill.', variant: 'error' } });
          break;
        }
        const profileId = await getActiveProfileId();
        await sendToContent(tab.id, { type: 'FILL_ONE', payload: { profileId } });
        break;
      }
      case 'REQUEST_FILL_FORM': {
        const unlocked = await isUnlocked();
        const tab = await getActiveTab();
        if (!tab?.id) break;
        if (!unlocked) {
          await sendToContent(tab.id, { type: 'TOAST', payload: { message: 'Locked. Unlock to autofill.', variant: 'error' } });
          break;
        }
        const profileId = await getActiveProfileId();
        await sendToContent(tab.id, { type: 'FILL_FORM', payload: { profileId } });
        break;
      }
      case 'AI_CLASSIFY': {
        const settings = await loadSettings();
          const { classifyField } = await import('@modules/ai');
        const res = await classifyField(message.payload.context, settings).catch((e: unknown) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : 'Unknown error',
        }));
        sendResponse(res);
        break;
      }
      case 'PING': {
        sendResponse({ ok: true });
        break;
      }
      default:
        break;
    }
  })();
  return true; // keep the message channel open for async sendResponse
});
});



