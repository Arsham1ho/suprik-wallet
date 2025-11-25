import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Download, Smartphone } from 'lucide-react';
import { isRunningAsPWA, canInstallPWA, showPWAInstall } from '../utils/mobile/pwa';
import { Button } from './ui/button';

export function PWAStatus() {
  const [isPWA, setIsPWA] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [manifestLoaded, setManifestLoaded] = useState(false);

  useEffect(() => {
    checkPWAStatus();
  }, []);

  const checkPWAStatus = async () => {
    // Check if running as PWA
    setIsPWA(isRunningAsPWA());

    // Check if can install
    setCanInstall(canInstallPWA());

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      setSwRegistered(!!registration);
    }

    // Check Manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    setManifestLoaded(!!manifestLink);
  };

  const handleInstall = async () => {
    const installed = await showPWAInstall();
    if (installed) {
      setTimeout(() => {
        checkPWAStatus();
      }, 1000);
    }
  };

  const StatusItem = ({ 
    label, 
    status, 
    description 
  }: { 
    label: string; 
    status: boolean; 
    description: string;
  }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
      <div className="mt-0.5">
        {status ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-medium text-sm">{label}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${
            status ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
          }`}>
            {status ? 'OK' : 'Not Found'}
          </span>
        </div>
        <p className="text-slate-400 text-xs">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl text-white mb-2">
            PWA Status Check
          </h2>
          <p className="text-slate-400 text-sm">
            Check if Suprik Wallet PWA is configured correctly
          </p>
        </div>

        {/* PWA Mode Status */}
        {isPWA && (
          <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-green-300 font-medium">Running as PWA</h3>
            </div>
            <p className="text-green-200 text-sm">
              ✅ Suprik Wallet is currently running in standalone mode!
            </p>
          </div>
        )}

        {/* Status Checks */}
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-medium mb-3">System Check</h3>
          
          <StatusItem
            label="Service Worker"
            status={swRegistered}
            description="Enables offline mode and caching"
          />

          <StatusItem
            label="PWA Manifest"
            status={manifestLoaded}
            description="Contains app metadata and icons"
          />

          <StatusItem
            label="HTTPS"
            status={window.location.protocol === 'https:' || window.location.hostname === 'localhost'}
            description="Required for PWA installation"
          />

          <StatusItem
            label="Install Capability"
            status={canInstall}
            description="Browser supports PWA installation"
          />
        </div>

        {/* Install Actions */}
        {!isPWA && (
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3">Actions</h3>
            
            {canInstall ? (
              <Button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Suprik Wallet
              </Button>
            ) : (
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-200 text-sm mb-2">
                      Automatic installation not available
                    </p>
                    <p className="text-blue-300 text-xs">
                      On iOS: Use Safari → Share → "Add to Home Screen"<br />
                      On Android: Use Chrome menu → "Install app"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <details className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
          <summary className="text-slate-300 cursor-pointer text-sm font-medium">
            Debug Information
          </summary>
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-700">
              <span className="text-slate-500">Protocol:</span>
              <span className="text-slate-300">{window.location.protocol}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700">
              <span className="text-slate-500">User Agent:</span>
              <span className="text-slate-300 truncate max-w-[200px]">
                {navigator.userAgent}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700">
              <span className="text-slate-500">Display Mode:</span>
              <span className="text-slate-300">
                {isPWA ? 'standalone' : 'browser'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">SW Support:</span>
              <span className="text-slate-300">
                {'serviceWorker' in navigator ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </details>
      </motion.div>
    </div>
  );
}