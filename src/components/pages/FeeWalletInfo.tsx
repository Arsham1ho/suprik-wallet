import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ChevronRight, Check, Copy, ExternalLink, Wallet, TrendingUp, DollarSign, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface FeeWalletInfoProps {
  onBack: () => void;
}

interface FeeWalletData {
  configured: boolean;
  address?: string;
  isValidSolana?: boolean;
  network?: string;
  balance?: number | null;
  explorerUrl?: string | null;
  stats?: {
    totalCollectedUSD: number;
    totalSwaps: number;
    onChainTransfers: number;
    trackedOnly: number;
  };
  message?: string;
  error?: string;
}

export function FeeWalletInfo({ onBack }: FeeWalletInfoProps) {
  const [loading, setLoading] = useState(true);
  const [feeWalletData, setFeeWalletData] = useState<FeeWalletData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadFeeWalletInfo();
  }, []);

  const loadFeeWalletInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/fee-wallet-info`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      setFeeWalletData(data);
      
      if (!response.ok && data.error) {
        toast.error(data.error);
      }
    } catch (error: any) {
      console.error('[Fee Wallet Info] Error:', error);
      toast.error('Failed to load fee wallet information');
      setFeeWalletData({ 
        configured: false, 
        error: 'Failed to load fee wallet information' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (feeWalletData?.address) {
      navigator.clipboard.writeText(feeWalletData.address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          <h1 className="text-2xl font-bold">Fee Wallet</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-400">Loading fee wallet information...</p>
          </div>
        ) : !feeWalletData?.configured ? (
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Fee Wallet Not Configured</h3>
                <p className="text-red-300 text-sm">
                  {feeWalletData?.error || 'The APP_FEE_WALLET environment variable is not set.'}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  To enable fee collection, set the APP_FEE_WALLET environment variable with your Solana wallet address.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl border ${
                feeWalletData.isValidSolana
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                {feeWalletData.isValidSolana ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    feeWalletData.isValidSolana ? 'text-green-300' : 'text-amber-300'
                  }`}>
                    {feeWalletData.isValidSolana ? 'Wallet Configured ✓' : 'Invalid Address'}
                  </h3>
                  <p className={`text-sm ${
                    feeWalletData.isValidSolana ? 'text-green-200/80' : 'text-amber-200/80'
                  }`}>
                    {feeWalletData.message}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Wallet Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-slate-900/50 border border-slate-800/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Wallet Address</h3>
                  <p className="text-slate-400 text-sm">{feeWalletData.network}</p>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-lg p-4 mb-3">
                <code className="text-purple-300 text-sm font-mono break-all">
                  {feeWalletData.address}
                </code>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyAddress}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </>
                  )}
                </Button>
                
                {feeWalletData.explorerUrl && (
                  <Button
                    onClick={() => window.open(feeWalletData.explorerUrl!, '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Solscan
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Balance */}
            {feeWalletData.balance !== null && feeWalletData.balance !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="text-slate-300 font-medium">Current Balance</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {feeWalletData.balance.toFixed(6)} SOL
                </p>
                <p className="text-purple-300 text-sm">
                  Fees collected on-chain and available
                </p>
              </motion.div>
            )}

            {/* Statistics */}
            {feeWalletData.stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <h3 className="text-white font-semibold mb-3">Fee Collection Statistics</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <p className="text-slate-400 text-xs">Total Collected</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      ${feeWalletData.stats.totalCollectedUSD.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <p className="text-slate-400 text-xs">Total Swaps</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {feeWalletData.stats.totalSwaps}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <p className="text-green-300 text-xs">On-Chain Transfers</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {feeWalletData.stats.onChainTransfers}
                    </p>
                    <p className="text-green-400 text-xs mt-1">
                      Transferred to wallet
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <p className="text-amber-300 text-xs">Tracked Only</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {feeWalletData.stats.trackedOnly}
                    </p>
                    <p className="text-amber-400 text-xs mt-1">
                      Not yet transferred
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
            >
              <div className="flex items-start gap-3">
                <div className="text-blue-400 text-xl">ℹ️</div>
                <div className="flex-1 text-sm text-blue-200/80">
                  <p className="font-medium text-blue-300 mb-2">How Fee Collection Works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Send transactions: Fees transferred on-chain automatically</li>
                    <li>• Swap transactions (SOL): Fees transferred on-chain automatically</li>
                    <li>• Swap transactions (Other): Tracked in database only</li>
                    <li>• All fees are recorded for analytics and reporting</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
