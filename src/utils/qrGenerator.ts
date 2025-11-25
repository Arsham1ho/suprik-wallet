/**
 * QR Code Generator Utilities for CosmoPay
 */

/**
 * Generate QR code as data URL using qrcode library
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    // Dynamically import qrcode library
    const QRCode = await import('qrcode');
    
    // Generate QR code as data URL
    const dataUrl = await QRCode.default.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    
    return dataUrl;
  } catch (error) {
    console.error('[QRGenerator] Failed to generate QR code:', error);
    throw error;
  }
}

/**
 * Download QR code as PNG image
 */
export function downloadQRCode(dataUrl: string, filename?: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || `cosmopay-qr-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('[QRGenerator] QR code downloaded');
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    console.log('[QRGenerator] Copied to clipboard');
    return true;
  } catch (error) {
    console.error('[QRGenerator] Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Share using Web Share API (if available)
 */
export async function shareData(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      console.log('[QRGenerator] Shared successfully');
      return true;
    } else {
      console.warn('[QRGenerator] Web Share API not supported');
      return false;
    }
  } catch (error) {
    console.error('[QRGenerator] Failed to share:', error);
    return false;
  }
}
