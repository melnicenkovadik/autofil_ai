type ToastVariant = 'success' | 'error' | 'info';

type ToastAction = {
  label: string;
  icon?: string;
  onClick: () => void;
};

const TOAST_DURATION = 10000;
const TOAST_ANIMATION_DURATION = 300;

let toastContainer: HTMLDivElement | null = null;

function getOrCreateToastContainer(): HTMLDivElement {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'autofill-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;
  
  document.body.appendChild(toastContainer);
  return toastContainer;
}

export function showToast(message: string, variant: ToastVariant = 'info', action?: ToastAction): void {
  const container = getOrCreateToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `autofill-toast autofill-toast-${variant}`;
  
  // Styles
  const baseStyles = `
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 320px;
    pointer-events: auto;
    opacity: 0;
    transform: translateX(100%);
    transition: all ${TOAST_ANIMATION_DURATION}ms ease-out;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  `;
  
  let variantStyles = '';
  switch (variant) {
    case 'success':
      variantStyles = `
        background: #10b981;
        color: white;
      `;
      break;
    case 'error':
      variantStyles = `
        background: #ef4444;
        color: white;
      `;
      break;
    case 'info':
    default:
      variantStyles = `
        background: #3b82f6;
        color: white;
      `;
      break;
  }
  
  toast.style.cssText = baseStyles + variantStyles;
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  messageSpan.style.flex = '1';
  toast.appendChild(messageSpan);
  
  if (action) {
    const actionButton = document.createElement('button');
    actionButton.textContent = action.icon || action.label;
    actionButton.style.cssText = `
      background: rgba(255, 255, 255, 0.25);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    actionButton.addEventListener('mouseenter', () => {
      actionButton.style.background = 'rgba(255, 255, 255, 0.35)';
    });
    actionButton.addEventListener('mouseleave', () => {
      actionButton.style.background = 'rgba(255, 255, 255, 0.25)';
    });
    actionButton.addEventListener('click', (e) => {
      e.stopPropagation();
      action.onClick();
      // Remove toast immediately after action
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    });
    toast.appendChild(actionButton);
  }
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
  });
  
  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
      
      // Clean up container if empty
      if (container.childElementCount === 0 && container.parentElement) {
        container.parentElement.removeChild(container);
        toastContainer = null;
      }
    }, TOAST_ANIMATION_DURATION);
  }, TOAST_DURATION);
}

