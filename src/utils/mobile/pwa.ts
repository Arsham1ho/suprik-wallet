/**
 * PWA Installation & Service Worker Management
 */

let deferredPrompt: any = null;

/**
 * Listen for install prompt
 */
export function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Save the event for later use
    deferredPrompt = e;
    console.log('[PWA] Install prompt ready');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] PWA installed successfully');
    deferredPrompt = null;
  });
}

/**
 * Check if PWA can be installed
 */
export function canInstallPWA(): boolean {
  return deferredPrompt !== null;
}

/**
 * Show PWA install prompt
 */
export async function showPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user's response
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

  // Clear the prompt
  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Check if running as PWA
 */
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Register service worker with automatic update handling
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      // First check if sw.js exists
      const swCheck = await fetch('/sw.js', { method: 'HEAD' }).catch(() => null);

      if (!swCheck || !swCheck.ok) {
        console.log('[PWA] Service Worker file not found - skipping registration');
        console.log('[PWA] ℹ️ This is normal in development. SW will work in production.');
        return null;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always fetch fresh SW from network
      });

      console.log('[PWA] ✓ Service Worker registered:', registration);

      return registration;
    } catch (error) {
      console.log('[PWA] Service Worker registration skipped:', error instanceof Error ? error.message : 'Unknown error');
      console.log('[PWA] ℹ️ App will continue to work without offline support');
      return null;
    }
  }

  console.log('[PWA] Service Workers not supported in this browser');
  return null;
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    return registration.unregister();
  }
  return false;
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  }
  return false;
}

/**
 * Get device info for analytics
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isPWA: isRunningAsPWA(),
    hasNotch: window.screen.height / window.screen.width > 2,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
}

/**
 * Show notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Use type assertion for vibrate as it's valid for ServiceWorker notifications
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        } as NotificationOptions & { vibrate?: number[] });
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  }
}

/**
 * Add to home screen instructions
 */
export function getAddToHomeScreenInstructions() {
  const ua = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return {
      platform: 'iOS',
      steps: [
        'Tap the Share button',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top right corner',
      ],
    };
  } else if (/Android/i.test(ua)) {
    return {
      platform: 'Android',
      steps: [
        'Tap the menu button (⋮)',
        'Tap "Install app" or "Add to Home screen"',
        'Tap "Install" or "Add"',
      ],
    };
  }
  
  return {
    platform: 'Desktop',
    steps: [
      'Click the install icon in the address bar',
      'Click "Install"',
    ],
  };
}
