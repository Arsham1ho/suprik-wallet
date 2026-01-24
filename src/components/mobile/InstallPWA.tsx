import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { showPWAInstall, isRunningAsPWA } from '../../utils/mobile/pwa';

export function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if already running as PWA
    const runningAsPWA = isRunningAsPWA();
    setIsPWA(runningAsPWA);

    if (runningAsPWA) {
      console.log('[InstallPWA] Already running as PWA');
      return;
    }

    // Check if this is the first visit (user hasn't seen the install prompt before)
    const hasSeenPrompt = localStorage.getItem('pwa_prompt_dismissed');
    const firstVisit = !hasSeenPrompt;

    // Show prompt on first visit after a short delay
    if (firstVisit) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }
  }, []);

  const handleInstall = async () => {
    // Directly trigger the browser's install prompt
    const installed = await showPWAInstall();

    // Always dismiss the banner after attempting install
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');

    if (installed) {
      console.log('[InstallPWA] ✓ PWA installed successfully');
    } else {
      console.log('[InstallPWA] Install prompt not available or user declined');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Don't show anything if already running as PWA
  if (isPWA) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[398px]"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-purple-400/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">
                  Install Suprik Wallet
                </h3>
                <p className="text-white/80 text-xs mt-0.5">
                  Add to home screen for faster access and offline support.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-white text-purple-600 font-semibold text-sm py-2 px-4 rounded-xl hover:bg-white/90 transition-colors"
                  >
                    Install Now
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
