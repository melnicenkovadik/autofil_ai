import type { InputLike } from '@modules/mapping/scorer';

let iframeHost: HTMLDivElement | null = null;
let iframe: HTMLIFrameElement | null = null;

let iframeReady = false;
let pendingOpen: string | null = null;

export function showAddFieldModal(element: InputLike): void {
  
  if (!iframeHost) {
    createIframeModal();
  }
  
  // Get suggested field name from element
  const suggestedName = 
    element.getAttribute('name') || 
    element.getAttribute('id') || 
    element.getAttribute('placeholder') || 
    'field';
  
  if (iframeHost && iframe) {
    iframeHost.style.display = 'block';
    
    // Send message to iframe if ready, otherwise queue it
    if (iframeReady) {
      iframe.contentWindow?.postMessage({
        type: 'OPEN_ADD_FIELD_MODAL',
        payload: { suggestedName }
      }, '*');
    } else {
      pendingOpen = suggestedName;
    }
  }
}

function createIframeModal(): void {
  iframeHost = document.createElement('div');
  iframeHost.id = 'autofill-add-field-modal-host';
  iframeHost.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    display: none;
  `;
  
  document.body.appendChild(iframeHost);
  
  iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
  `;
  
  // Load the add-field-modal entry point
  iframe.src = chrome.runtime.getURL('add-field-modal.html');
  
  iframeHost.appendChild(iframe);
  
  // Listen for messages from iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'ADD_FIELD_MODAL_READY') {
      iframeReady = true;
      // If there's a pending open, send it now
      if (pendingOpen && iframe) {
        iframe.contentWindow?.postMessage({
          type: 'OPEN_ADD_FIELD_MODAL',
          payload: { suggestedName: pendingOpen }
        }, '*');
        pendingOpen = null;
      }
    } else if (event.data.type === 'ADD_FIELD_MODAL_CLOSED') {
      hideModal();
    } else if (event.data.type === 'ADD_FIELD_MODAL_SAVED') {
      hideModal();
      // Request refill
      chrome.runtime.sendMessage({ type: 'REQUEST_FILL_ONE' }).catch(() => {});
    }
  });
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && iframeHost?.style.display === 'block') {
      hideModal();
    }
  });
}

function hideModal(): void {
  if (iframeHost) {
    iframeHost.style.display = 'none';
  }
}

export function cleanupAddFieldModal(): void {
  if (iframeHost && iframeHost.parentElement) {
    iframeHost.parentElement.removeChild(iframeHost);
  }
  iframeHost = null;
  iframe = null;
  iframeReady = false;
  pendingOpen = null;
}

