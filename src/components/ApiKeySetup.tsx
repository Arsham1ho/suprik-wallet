import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Eye, EyeOff, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { areApiKeysConfigured, saveEncryptedApiKey, getEncryptedApiKey, removeApiKey } from '../utils/env';
import { setCloudflareWorkerURL, getCloudflareWorkerURL } from '../utils/puterAI';

export function ApiKeySetup() {
  const [heliusKey, setHeliusKey] = useState('');
  const [cfWorkerUrl, setCfWorkerUrl] = useState('');
  const [alchemyKey, setAlchemyKey] = useState('');
  const [jupiterKey, setJupiterKey] = useState('');
  const [showHelius, setShowHelius] = useState(false);
  const [showAlchemy, setShowAlchemy] = useState(false);
  const [showJupiter, setShowJupiter] = useState(false);
  const [apiStatus, setApiStatus] = useState({ helius: false, alchemy: false, jupiter: false, allConfigured: false });

  useEffect(() => {
    // Load existing keys from encrypted storage
    const loadKeys = async () => {
      const existingHelius = await getEncryptedApiKey('helius') || '';
      const existingAlchemy = await getEncryptedApiKey('alchemy') || '';
      const existingJupiter = await getEncryptedApiKey('jupiter') || '';

      setHeliusKey(existingHelius);
      setAlchemyKey(existingAlchemy);
      setJupiterKey(existingJupiter);
      setCfWorkerUrl(getCloudflareWorkerURL());

      // Check status
      checkApiStatus();
    };
    loadKeys();
  }, []);

  const checkApiStatus = () => {
    const status = areApiKeysConfigured();
    setApiStatus(status);
  };

  const saveHeliusKey = async () => {
    if (!heliusKey.trim()) {
      toast.error('Please enter a valid Helius API key');
      return;
    }

    await saveEncryptedApiKey('helius', heliusKey.trim());
    toast.success('Helius API key saved securely! Refresh to use real Solana data.');
    checkApiStatus();
  };

  const saveAlchemyKey = async () => {
    if (!alchemyKey.trim()) {
      toast.error('Please enter a valid Alchemy API key');
      return;
    }

    await saveEncryptedApiKey('alchemy', alchemyKey.trim());
    toast.success('Alchemy API key saved securely! Refresh to use real Ethereum data.');
    checkApiStatus();
  };

  const saveJupiterKey = async () => {
    if (!jupiterKey.trim()) {
      toast.error('Please enter a valid Jupiter API key');
      return;
    }

    await saveEncryptedApiKey('jupiter', jupiterKey.trim());
    toast.success('Jupiter API key saved! Swap fees will now be collected via Jupiter Referral.');
    checkApiStatus();
  };

  const removeHeliusKey = () => {
    removeApiKey('helius');
    setHeliusKey('');
    toast.success('Helius API key removed');
    checkApiStatus();
  };

  const removeAlchemyKey = () => {
    removeApiKey('alchemy');
    setAlchemyKey('');
    toast.success('Alchemy API key removed');
    checkApiStatus();
  };

  const removeJupiterKey = () => {
    removeApiKey('jupiter');
    setJupiterKey('');
    toast.success('Jupiter API key removed');
    checkApiStatus();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-blue-300">
            Suprik Wallet uses blockchain APIs to fetch real-time balance data.
          </p>
          <p className="text-xs text-blue-400/70">
            {apiStatus.allConfigured 
              ? '✅ All API keys configured - using real blockchain data'
              : '⚠️ Using demo data. Add API keys below to fetch real balances.'}
          </p>
        </div>
      </div>

      {/* Helius API Key */}
      <motion.div
        className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Helius API</h3>
            {apiStatus.helius && <Check className="w-4 h-4 text-green-500" />}
          </div>
          <a
            href="https://www.helius.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
          >
            Get Free Key <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        
        <p className="text-xs text-slate-400">
          For Solana blockchain data (balances, tokens, transactions)
        </p>

        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showHelius ? 'text' : 'password'}
              placeholder="Enter Helius API key"
              value={heliusKey}
              onChange={(e) => setHeliusKey(e.target.value)}
              className="pr-20 bg-slate-950/50 border-slate-700"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={() => setShowHelius(!showHelius)}
                className="p-1 hover:bg-slate-700/50 rounded"
              >
                {showHelius ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {heliusKey && (
                <button
                  onClick={removeHeliusKey}
                  className="p-1 hover:bg-slate-700/50 rounded"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>
          
          <Button
            onClick={saveHeliusKey}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!heliusKey.trim()}
          >
            Save Helius Key
          </Button>
        </div>
      </motion.div>

      {/* Alchemy API Key */}
      <motion.div
        className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Alchemy API</h3>
            {apiStatus.alchemy && <Check className="w-4 h-4 text-green-500" />}
          </div>
          <a
            href="https://www.alchemy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
          >
            Get Free Key <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        
        <p className="text-xs text-slate-400">
          For Ethereum blockchain data (balances, ERC20 tokens, gas prices)
        </p>

        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showAlchemy ? 'text' : 'password'}
              placeholder="Enter Alchemy API key"
              value={alchemyKey}
              onChange={(e) => setAlchemyKey(e.target.value)}
              className="pr-20 bg-slate-950/50 border-slate-700"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={() => setShowAlchemy(!showAlchemy)}
                className="p-1 hover:bg-slate-700/50 rounded"
              >
                {showAlchemy ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {alchemyKey && (
                <button
                  onClick={removeAlchemyKey}
                  className="p-1 hover:bg-slate-700/50 rounded"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>
          
          <Button
            onClick={saveAlchemyKey}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!alchemyKey.trim()}
          >
            Save Alchemy Key
          </Button>
        </div>
      </motion.div>

      {/* Jupiter API Key */}
      <motion.div
        className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Jupiter API</h3>
            {apiStatus.jupiter && <Check className="w-4 h-4 text-green-500" />}
          </div>
          <a
            href="https://portal.jup.ag/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
          >
            Get Free Key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-xs text-slate-400">
          For Jupiter Ultra API (enables swap fee collection via referral program)
        </p>

        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showJupiter ? 'text' : 'password'}
              placeholder="Enter Jupiter API key"
              value={jupiterKey}
              onChange={(e) => setJupiterKey(e.target.value)}
              className="pr-20 bg-slate-950/50 border-slate-700"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={() => setShowJupiter(!showJupiter)}
                className="p-1 hover:bg-slate-700/50 rounded"
              >
                {showJupiter ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {jupiterKey && (
                <button
                  onClick={removeJupiterKey}
                  className="p-1 hover:bg-slate-700/50 rounded"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>

          <Button
            onClick={saveJupiterKey}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!jupiterKey.trim()}
          >
            Save Jupiter Key
          </Button>
        </div>

        {!apiStatus.jupiter && (
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300">
              ⚠️ Without Jupiter API key, swaps will use the Legacy API without referral fee collection.
            </p>
          </div>
        )}
      </motion.div>

      {/* Cloudflare Worker URL */}
      <motion.div
        className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Cloudflare AI Worker</h3>
            {cfWorkerUrl && <Check className="w-4 h-4 text-green-500" />}
          </div>
          <span className="text-xs text-orange-400">Optional</span>
        </div>

        <p className="text-xs text-slate-400">
          Fallback AI provider using Cloudflare Workers AI (Llama 3.1). Deploy your own worker for free AI.
        </p>

        <div className="space-y-2">
          <Input
            type="text"
            placeholder="https://suprik-ai.your-subdomain.workers.dev"
            value={cfWorkerUrl}
            onChange={(e) => setCfWorkerUrl(e.target.value)}
            className="bg-slate-950/50 border-slate-700 text-xs"
          />

          <Button
            onClick={() => {
              const url = cfWorkerUrl.trim();
              if (!url) {
                toast.error('Please enter your Cloudflare Worker URL');
                return;
              }
              setCloudflareWorkerURL(url);
              toast.success('Cloudflare Worker URL saved! Reload the page to apply.');
            }}
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={!cfWorkerUrl.trim()}
          >
            Save Worker URL
          </Button>
        </div>
      </motion.div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800/20">
        <p className="text-xs text-slate-500">
          💡 <span className="text-slate-400">Your API keys are stored locally in your browser and never sent to any server.</span>
        </p>
      </div>
    </div>
  );
}