// App version - auto-updated on build
// Format: MAJOR.MINOR.PATCH
// ⚠️ INCREMENT THIS ON EVERY DEPLOY TO FORCE CACHE BUST
export const APP_VERSION = '2.1.0';

// Build timestamp - updated each build
export const BUILD_DATE = '2025-12-23';

// Full version string for display
export const VERSION_STRING = `Suprik v${APP_VERSION}`;

// Version key for localStorage
const VERSION_STORAGE_KEY = 'suprik_app_version';

/**
 * Check if app version changed and force reload if needed
 * This ensures users always get the latest version
 */
export function checkVersionAndReload(): boolean {
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log(`[Version] Update detected: ${storedVersion} → ${APP_VERSION}`);

    // Store new version
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    // Force reload from server (bypass cache)
    window.location.reload();
    return true;
  }

  // First time or same version - just store it
  localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
  return false;
}

/**
 * Clear all caches and reload (manual trigger)
 */
export async function forceRefresh(): Promise<void> {
  // Clear localStorage version to trigger reload
  localStorage.removeItem(VERSION_STORAGE_KEY);

  // Clear all caches
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }

  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  }

  // Force reload
  window.location.reload();
}
