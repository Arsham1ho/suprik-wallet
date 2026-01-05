import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2, Server } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNetwork, NetworkMode, getNetworkEndpoints } from '../../utils/NetworkContext';
import { useTheme } from '../../utils/ThemeContext';
import { toast } from 'sonner';
import { Connection } from '@solana/web3.js';

interface RpcSettingsProps {
  onBack: () => void;
}

export function RpcSettings({ onBack }: RpcSettingsProps) {
  const { networkMode, setNetworkMode, customRpcUrl, setCustomRpcUrl } = useNetwork();
  const { colors } = useTheme();
  const [customRpcInput, setCustomRpcInput] = useState(customRpcUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setCustomRpcInput(customRpcUrl);
  }, [customRpcUrl]);

  const testConnection = async (url: string) => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Test Solana RPC connection
      const connection = new Connection(url, 'confirmed');
      const blockHeight = await connection.getBlockHeight();
      
      console.log('[RPC Test] ✅ Connected successfully. Block height:', blockHeight);
      setTestResult('success');
      toast.success(`Connected! Block height: ${blockHeight}`);
      return true;
    } catch (error) {
      console.error('[RPC Test] ❌ Connection failed:', error);
      setTestResult('error');
      toast.error('Connection failed. Check the URL and try again.');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCustomRpc = async () => {
    if (!customRpcInput.trim()) {
      toast.error('Please enter an RPC URL');
      return;
    }

    // Validate URL format
    try {
      new URL(customRpcInput);
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    // Test connection first
    const isConnected = await testConnection(customRpcInput);
    
    if (isConnected) {
      setCustomRpcUrl(customRpcInput);
      setNetworkMode('custom');
      toast.success('Custom RPC saved!');
      
      // Trigger balance refresh
      window.dispatchEvent(new Event('walletBalanceUpdated'));
    }
  };

  const handleSelectNetwork = (mode: NetworkMode) => {
    setNetworkMode(mode);
    setTestResult(null);
    
    const networkNames = {
      mainnet: 'Mainnet',
      testnet: 'Testnet (Devnet)',
      localhost: 'Localhost',
      custom: 'Custom RPC',
    };
    
    toast.success(`Switched to ${networkNames[mode]}`);
    
    // Trigger balance refresh
    window.dispatchEvent(new Event('walletBalanceUpdated'));
  };

  const getCurrentRpc = () => {
    const endpoints = getNetworkEndpoints(networkMode, customRpcUrl);
    return endpoints.solana.rpc;
  };

  const networkOptions: { mode: NetworkMode; name: string; description: string; icon: typeof Server }[] = [
    {
      mode: 'mainnet',
      name: 'Mainnet',
      description: 'Production network',
      icon: Wifi,
    },
    {
      mode: 'testnet',
      name: 'Testnet (Devnet)',
      description: 'Safe testing environment',
      icon: Server,
    },
    {
      mode: 'localhost',
      name: 'Localhost',
      description: 'Local validator (port 8899)',
      icon: Server,
    },
    {
      mode: 'custom',
      name: 'Custom RPC',
      description: 'Use your own endpoint',
      icon: Server,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-6 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold">RPC Settings</h1>
        </div>

        {/* Current Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl border"
          style={{
            background: `linear-gradient(to right, ${colors.primary}1A, ${colors.secondary}1A)`,
            borderColor: `${colors.primary}4D`,
          }}
        >
          <div className="flex items-start gap-3">
            <Wifi className="w-5 h-5 mt-0.5" style={{ color: colors.accent }} />
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Current RPC Endpoint</p>
              <p className="text-white font-mono text-sm break-all">{getCurrentRpc()}</p>
            </div>
          </div>
        </motion.div>

        {/* Network Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-6"
        >
          <h3 className="text-slate-400 text-sm px-2">Select Network</h3>
          
          {networkOptions.map((option, index) => {
            const Icon = option.icon;
            const isActive = networkMode === option.mode;
            
            return (
              <motion.button
                key={option.mode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => handleSelectNetwork(option.mode)}
                className={`w-full p-4 rounded-xl transition-all flex items-center justify-between border ${
                  isActive
                    ? ''
                    : 'bg-slate-900/50 border-slate-800/30 hover:bg-slate-900/80'
                }`}
                style={isActive ? {
                  backgroundColor: `${colors.primary}33`,
                  borderColor: `${colors.primary}80`,
                } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${!isActive ? 'bg-slate-800' : ''}`}
                    style={isActive ? { background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` } : undefined}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{option.name}</p>
                      {isActive && (
                        <CheckCircle className="w-4 h-4" style={{ color: colors.accent }} />
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{option.description}</p>
                  </div>
                </div>
                {!isActive && <ChevronRight className="w-5 h-5 text-slate-600" />}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Custom RPC Configuration */}
        {networkMode === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h3 className="text-slate-400 text-sm px-2">Custom RPC Configuration</h3>
            
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/30 space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">RPC Endpoint URL</label>
                <Input
                  type="text"
                  placeholder="https://api.mainnet-beta.solana.com"
                  value={customRpcInput}
                  onChange={(e) => setCustomRpcInput(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Examples: Helius, QuickNode, Alchemy, or your own RPC
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResult === 'success'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  {testResult === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 text-sm">Connection successful!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 text-sm">Connection failed</span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => testConnection(customRpcInput)}
                  disabled={testing || !customRpcInput.trim()}
                  variant="outline"
                  className="flex-1 border-slate-700 hover:bg-slate-800"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleSaveCustomRpc}
                  disabled={testing || !customRpcInput.trim()}
                  className="flex-1 text-white"
                  style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
                >
                  Save & Use
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Developer Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-xl border"
          style={{
            backgroundColor: `${colors.primary}0D`,
            borderColor: `${colors.primary}33`,
          }}
        >
          <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: colors.accent }}>
            <Server className="w-4 h-4" />
            Developer Tips
          </h4>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• <strong>Localhost:</strong> Start your local validator with <code style={{ color: colors.accent }}>solana-test-validator</code></li>
            <li>• <strong>Helius:</strong> Get faster RPC at <code style={{ color: colors.accent }}>helius.dev</code></li>
            <li>• <strong>QuickNode:</strong> Premium endpoints at <code style={{ color: colors.accent }}>quicknode.com</code></li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
