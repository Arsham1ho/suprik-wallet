/**
 * Copy text to clipboard with fallback for when Clipboard API is blocked
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  console.log('[Clipboard] Starting copy operation, length:', text.length);
  
  // Method 1: Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      console.log('[Clipboard] Trying Clipboard API...');
      await navigator.clipboard.writeText(text);
      console.log('[Clipboard] ✓ Clipboard API succeeded');
      return true;
    } catch (err) {
      console.log('[Clipboard] ✗ Clipboard API failed:', err);
      // Fall through to fallback methods
    }
  } else {
    console.log('[Clipboard] Clipboard API not available. Secure context:', window.isSecureContext);
  }

  // Method 2: Fallback using textarea and execCommand
  try {
    console.log('[Clipboard] Trying textarea fallback method...');
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible but still accessible for selection
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.zIndex = '9999';
    textArea.readOnly = false;
    textArea.contentEditable = 'true';
    
    document.body.appendChild(textArea);
    
    // Focus and select
    textArea.focus();
    textArea.select();
    
    // For iOS Safari
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    textArea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('[Clipboard] ✓ Textarea fallback succeeded');
      return true;
    } else {
      console.log('[Clipboard] ✗ Textarea fallback failed');
    }
  } catch (err) {
    console.error('[Clipboard] ✗ Textarea fallback error:', err);
  }

  // Method 3: Last resort - try direct selection
  try {
    console.log('[Clipboard] Trying direct selection method...');
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.textContent = text;
    document.body.appendChild(tempDiv);
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNode(tempDiv);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(tempDiv);
      
      if (successful) {
        console.log('[Clipboard] ✓ Direct selection succeeded');
        return true;
      }
    }
    document.body.removeChild(tempDiv);
  } catch (err) {
    console.error('[Clipboard] ✗ Direct selection error:', err);
  }
  
  console.error('[Clipboard] ✗ All copy methods failed');
  return false;
}

/**
 * Copy sensitive text to clipboard and auto-clear after a timeout.
 * Use this for seed phrases, private keys, and recovery phrases.
 */
let autoClearTimer: ReturnType<typeof setTimeout> | null = null;

export async function copyToClipboardWithAutoClear(
  text: string,
  timeoutMs = 30000,
): Promise<boolean> {
  // Clear any pending auto-clear timer
  if (autoClearTimer) {
    clearTimeout(autoClearTimer);
    autoClearTimer = null;
  }

  const success = await copyToClipboard(text);

  if (success) {
    autoClearTimer = setTimeout(async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText('');
        }
      } catch {
        // Clipboard clear failed silently — browser may have revoked permission
      }
      autoClearTimer = null;
    }, timeoutMs);
  }

  return success;
}
