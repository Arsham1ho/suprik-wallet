import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { ExternalLink, CheckCircle, XCircle, Network, Bug } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { APIKeysTest } from './APIKeysTest';

interface BlockchainSetupProps {
  walletId: string;
}

export function BlockchainSetup({ walletId }: BlockchainSetupProps) {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [solanaNetwork, setSolanaNetwork] = useState<string>('mainnet');
  const [savingNetwork, setSavingNetwork] = useState(false);
  const [addresses, setAddresses] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    checkApiStatus();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet-settings/${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSolanaNetwork(data.solanaNetwork || 'mainnet');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNetworkChange = async (network: string) => {
    setSavingNetwork(true);
    setSolanaNetwork(network);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet-settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId, solanaNetwork: network }),
        }
      );

      if (response.ok) {
        console.log('Network setting saved:', network);
        // Trigger a balance refresh
        window.dispatchEvent(new Event('walletBalanceUpdated'));
      }
    } catch (error) {
      console.error('Error saving network setting:', error);
    } finally {
      setSavingNetwork(false);
    }
  };

  const checkApiStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/check-blockchain-transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApiStatus(data.apiKeysConfigured);
        setAddresses(data.addresses);
        console.log('Blockchain check response:', data);
      }
    } catch (error) {
      console.error('Error checking API status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !apiStatus) return null;

  const needsSetup = !apiStatus.helius || !apiStatus.alchemy;

  if (!needsSetup && solanaNetwork === 'mainnet') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 space-y-3"
    >
      {/* Debug Panel */}
      {showDebug && addresses && (
        <Alert className="bg-slate-800/50 border-slate-700 text-slate-300">
          <AlertDescription className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm"><strong>🔍 Debug Info</strong></p>
              <button onClick={() => setShowDebug(false)} className="text-xs underline">Hide</button>
            </div>
            <div className="text-xs space-y-1 font-mono">
              <div><strong>Network:</strong> {solanaNetwork}</div>
              <div><strong>Solana Address:</strong> {addresses.solana?.substring(0, 20)}...</div>
              <div><strong>Helius API:</strong> {apiStatus?.helius ? '✅ Configured' : '❌ Not configured'}</div>
              <div><strong>Alchemy API:</strong> {apiStatus?.alchemy ? '✅ Configured' : '❌ Not configured'}</div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs"
              onClick={() => {
                console.log('Full debug data:', { solanaNetwork, addresses, apiStatus });
                window.dispatchEvent(new Event('walletBalanceUpdated'));
              }}
            >
              Force Refresh & Log Debug
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Selector */}
      <Alert className="bg-purple-500/10 border-purple-500/20 text-purple-300">
        <AlertDescription className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <p className="text-sm">
                <strong>Solana Network</strong>
              </p>
            </div>
            {!showDebug && (
              <button 
                onClick={() => setShowDebug(true)} 
                className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300"
              >
                <Bug className="w-3 h-3" />
                Debug
              </button>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-purple-200">
              Select which Solana network to monitor. Use <strong>devnet</strong> for testing with faucet tokens.
            </p>
            <Select value={solanaNetwork} onValueChange={handleNetworkChange} disabled={savingNetwork}>
              <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 text-white">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainnet">Mainnet (Real SOL)</SelectItem>
                <SelectItem value="devnet">Devnet (Test SOL)</SelectItem>
              </SelectContent>
            </Select>
            {solanaNetwork === 'devnet' && (
              <div className="text-xs text-green-300 bg-green-500/10 p-3 rounded border border-green-500/20 space-y-2">
                <div>✅ <strong>Devnet Mode Active</strong></div>
                <div className="text-green-200">
                  Your wallet is now monitoring the Solana <strong>devnet</strong> blockchain. You can:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-green-200 ml-2">
                  <li>Get your wallet address from the "Receive" button</li>
                  <li>Visit <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">faucet.solana.com</a></li>
                  <li>Paste your address and request devnet SOL (up to 5 SOL)</li>
                  <li>Wait ~30 seconds for it to appear in your wallet</li>
                </ol>
                <div className="text-green-200 pt-1">
                  💡 This is REAL blockchain (devnet), not Dev Mode simulation!
                </div>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {needsSetup && (
        <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-300">
          <AlertDescription className="space-y-3">
            <p className="text-sm">
              🔗 <strong>Enable Real Blockchain Monitoring</strong>
            </p>
            <p className="text-xs text-blue-200">
              Configure API keys to monitor real blockchain transactions. Without these, only Dev Mode simulations will work.
            </p>
            
            {!apiStatus.alchemy && (
              <div className="text-xs text-yellow-300 bg-yellow-500/10 p-3 rounded border border-yellow-500/20 space-y-2">
                <div>⚠️ <strong>Alchemy API Key Setup Required:</strong></div>
                <ol className="list-decimal list-inside space-y-1 text-yellow-200 ml-2">
                  <li>Go to <a href="https://www.alchemy.com/" target="_blank" rel="noopener noreferrer" className="underline">Alchemy.com</a> and create a free account</li>
                  <li>Create a new app and select "Ethereum" and "Mainnet"</li>
                  <li>Click "API Key" button to view your key</li>
                  <li>Copy ONLY the API key (32+ character string like "Abc123XyzDef456...")</li>
                  <li>Do NOT copy the full URL - just the key part after "/v2/"</li>
                </ol>
              </div>
            )}
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {apiStatus.helius ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>Helius API (Solana) - {apiStatus.helius ? 'Configured' : 'Not configured'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {apiStatus.alchemy ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>Alchemy API (Ethereum/Polygon) - {apiStatus.alchemy ? 'Configured' : 'Not configured'}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-blue-400/30 text-blue-300 hover:bg-blue-500/20"
                onClick={() => window.open('https://docs.helius.dev/welcome/what-is-helius', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Get Helius Key
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-blue-400/30 text-blue-300 hover:bg-blue-500/20"
                onClick={() => window.open('https://www.alchemy.com/', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Get Alchemy Key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* API Keys Test Component */}
      <div className="mt-6">
        <APIKeysTest />
      </div>
    </motion.div>
  );
}
