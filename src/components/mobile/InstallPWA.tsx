import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '../ui/button';
import { canInstallPWA, showPWAInstall, isRunningAsPWA, getAddToHomeScreenInstructions } from '../../utils/mobile/pwa';

export function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if already running as PWA
    const runningAsPWA = isRunningAsPWA();
    setIsPWA(runningAsPWA);

    if (runningAsPWA) {
      console.log('[InstallPWA] Already running as PWA');
      return;
    }

    // Check if can install
    const checkInstall = () => {
      const canInstallNow = canInstallPWA();
      setCanInstall(canInstallNow);
      
      // Show prompt after 3 seconds if can install and user hasn't dismissed it
      if (canInstallNow && !localStorage.getItem('pwa_prompt_dismissed')) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    checkInstall();

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = () => {
      checkInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    const installed = await showPWAInstall();
    
    if (installed) {
      setShowPrompt(false);
      console.log('[InstallPWA] ✓ PWA installed successfully');
    } else {
      // Show manual instructions for iOS/browsers that don't support automatic install
      setShowInstructions(true);
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

  const instructions = getAddToHomeScreenInstructions();

  return (
    <>
      {/* Install Prompt Banner */}
      <AnimatePresence>
        {showPrompt && canInstall && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 w-auto md:max-w-[430px] mx-auto"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-purple-400/20">
              <div className="flex items-start gap-3">
                <div className="bg-white/10 rounded-full p-2 mt-0.5">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Install Suprik Wallet
                  </h3>
                  <p className="text-purple-100 text-sm mb-3">
                    Add to your home screen for a native app experience
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstall}
                      size="sm"
                      className="bg-white text-purple-600 hover:bg-purple-50"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Install
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                    >
                      Later
                    </Button>
                  </div>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-t-3xl w-full md:max-w-[430px] p-6 border-t border-slate-700"
            >
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />
              
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl text-white mb-2">
                  Install Suprik Wallet
                </h2>
                <p className="text-slate-400 text-sm">
                  {instructions.platform} Instructions
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <ol className="space-y-3">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-200 text-sm flex-1">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <Button
                onClick={() => setShowInstructions(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Got it!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}