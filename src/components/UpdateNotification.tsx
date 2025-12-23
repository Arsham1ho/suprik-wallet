import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * UpdateNotification Component
 * Shows a notification when a new version of the app is available
 * Prompts users to refresh to get the latest updates
 */
export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    // Listen for service worker update messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        setNewVersion(event.data.version || 'new');
        setShowUpdate(true);
      }
    };

    // Listen for service worker state changes
    const handleSWStateChange = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          // Check if there's a waiting service worker
          if (registration.waiting) {
            setShowUpdate(true);
          }

          // Listen for new service workers
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version installed and waiting
                  setShowUpdate(true);
                }
              });
            }
          });
        });
      }
    };

    // Add message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      handleSWStateChange();

      // Also listen for controllerchange (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload to get the new version
        window.location.reload();
      });
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const handleUpdate = () => {
    // Tell the waiting service worker to skip waiting and take control
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    // Force reload the page
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-purple-400/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              Update Available{newVersion ? ` (v${newVersion})` : ''}
            </h3>
            <p className="text-white/80 text-xs mt-0.5">
              A new version is ready. Refresh to get the latest features and fixes.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-white text-purple-600 font-semibold text-sm py-2 px-4 rounded-xl hover:bg-white/90 transition-colors"
              >
                Refresh Now
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
