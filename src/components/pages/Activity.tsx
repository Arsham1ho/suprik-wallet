import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Copy, Check, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { useWallet } from '../../utils/WalletContext';
import { useNetwork } from '../../utils/NetworkContext';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { fetchAllTransactionHistory, type TransactionItem } from '../../utils/transactionHistory';

interface ActivityProps {
  walletId: string;
}

export function Activity({ walletId }: ActivityProps) {
  const wallet = useWallet();
  const network = useNetwork();
  const { t } = useLanguage();
  const [activities, setActivities] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<TransactionItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
    
    // 🚀 POLLING: Auto-refresh every 15 seconds to catch new incoming transactions
    const pollingInterval = setInterval(() => {
      if (wallet.addresses?.solana && wallet.addresses?.ethereum) {
        console.log('[Activity] ⚡ Auto-polling for new transactions...');
        fetchActivities();
      }
    }, 15000); // 15 seconds - check for new transactions regularly
    
    // Listen for balance updates which might include new transactions
    const handleBalanceUpdate = () => {
      console.log('[Activity] Balance update event received, refreshing activities...');
      fetchActivities();
    };
    
    window.addEventListener('walletBalanceUpdated', handleBalanceUpdate);
    
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('walletBalanceUpdated', handleBalanceUpdate);
    };
  }, [walletId, wallet.addresses, network.isTestnet]); // Refresh when network mode changes

  const fetchActivities = async () => {
    try {
      setLoading(true);
      console.log('[Activity] 🔄 Fetching transaction history from blockchain...');
      console.log('[Activity] Network mode:', network.isTestnet ? 'TESTNET' : 'MAINNET');
      
      // 🧪 TESTNET MODE: No transactions available in testnet
      if (network.isTestnet) {
        console.log('[Activity] ⚠️ Testnet mode: No transaction history available');
        setActivities([]);
        return;
      }
      
      if (!wallet.addresses.solana || !wallet.addresses.ethereum) {
        console.warn('[Activity] No addresses available yet');
        setActivities([]);
        return;
      }

      // Fetch from blockchain APIs (mainnet only)
      const transactions = await fetchAllTransactionHistory(
        {
          solana: wallet.addresses.solana,
          ethereum: wallet.addresses.ethereum,
        },
        false // Always use mainnet for real transaction history
      );

      console.log('[Activity] ✅ Loaded', transactions.length, 'transactions from blockchain');
      setActivities(transactions);
    } catch (error: any) {
      console.error('[Activity] ❌ Error fetching activities:', error);
      toast.error('Failed to load transaction history');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getTokenSymbol = (activity: TransactionItem): string => {
    return activity.token || activity.coin || 'Unknown';
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const isNewTransaction = (timestamp: string): boolean => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    return diffMins < 5; // Less than 5 minutes old
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return { Icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'send':
        return { Icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'swap':
        return { Icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      default:
        return { Icon: ArrowUpRight, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  const getExplorerUrl = (activity: TransactionItem): string | null => {
    if (!activity.signature) return null;
    
    const tokenSymbol = getTokenSymbol(activity);
    const network = activity.network || '';
    
    // Use network field if available
    if (network === 'solana' || network === 'mainnet' || network === 'devnet') {
      const networkParam = network === 'devnet' ? '?cluster=devnet' : '';
      return `https://solscan.io/tx/${activity.signature}${networkParam}`;
    }
    
    if (network === 'ethereum') {
      return `https://etherscan.io/tx/${activity.signature}`;
    }
    
    if (network === 'bitcoin') {
      return `https://blockchair.com/bitcoin/transaction/${activity.signature}`;
    }
    
    // Fallback to token symbol detection
    if (tokenSymbol === 'SOL' || tokenSymbol === 'USDC' || tokenSymbol === 'BONK') {
      return `https://solscan.io/tx/${activity.signature}`;
    }
    
    if (tokenSymbol === 'ETH') {
      return `https://etherscan.io/tx/${activity.signature}`;
    }
    
    if (tokenSymbol === 'BTC') {
      return `https://blockchair.com/bitcoin/transaction/${activity.signature}`;
    }
    
    // Default to Solscan
    return `https://solscan.io/tx/${activity.signature}`;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const truncateAddress = (address: string, startChars = 6, endChars = 4): string => {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  const formatAmount = (amount: number, symbol: string): string => {
    if (symbol === 'SOL' || symbol === 'ETH' || symbol === 'BTC') {
      return amount.toFixed(6);
    }
    return amount.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-6 py-6 w-full">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">{t.activity.activity}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchActivities}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Activity List */}
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, idx) => {
              const { Icon, color, bg } = getActivityIcon(activity.type);
              const tokenSymbol = getTokenSymbol(activity);

              return (
                <motion.button
                  key={activity.id}
                  className="w-full p-4 rounded-xl hover:bg-slate-950/50 transition-all flex items-center justify-between backdrop-blur-sm border border-transparent hover:border-slate-800/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${bg}`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className={`w-5 h-5 ${color}`} strokeWidth={2.5} />
                    </motion.div>
                    
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white capitalize font-semibold">
                          {activity.type}
                        </h4>
                        {activity.type === 'swap' && activity.toToken && (
                          <span className="text-slate-500 text-sm font-medium">
                            {activity.fromToken || tokenSymbol} → {activity.toToken}
                          </span>
                        )}
                        {isNewTransaction(activity.timestamp) && (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                            New
                          </Badge>
                        )}
                        {activity.isDevMode && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Dev
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm font-medium">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {activity.type === 'swap' ? (
                      <>
                        <p className="font-semibold text-white">
                          {formatAmount(activity.fromAmount || activity.amount, activity.fromToken || tokenSymbol)} {activity.fromToken || tokenSymbol}
                        </p>
                        <p className="text-green-500 text-sm font-medium">
                          → {formatAmount(activity.toAmount || 0, activity.toToken || '')} {activity.toToken}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={`font-semibold ${
                          activity.type === 'receive' ? 'text-green-500' : 'text-white'
                        }`}>
                          {activity.type === 'receive' ? '+' : activity.type === 'send' ? '-' : ''}
                          {formatAmount(activity.amount, tokenSymbol)} {tokenSymbol}
                        </p>
                        <p className="text-slate-500 text-sm capitalize font-medium">{activity.status}</p>
                      </>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {activities.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {network.isTestnet ? (
              <>
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🧪</span>
                </div>
                <p className="text-slate-400 mb-2">Testnet Mode</p>
                <p className="text-slate-600 text-sm">Transaction history is only available on Mainnet</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-500 mb-2">No transactions yet</p>
                <p className="text-slate-600 text-sm">Your transaction history will appear here</p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold capitalize">
                  {selectedActivity.type} Details
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  View complete transaction details and blockchain information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Status Badge */}
                <div className="flex items-center justify-center gap-3">
                  {(() => {
                    const { Icon, color, bg } = getActivityIcon(selectedActivity.type);
                    return (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bg}`}>
                        <Icon className={`w-8 h-8 ${color}`} strokeWidth={2.5} />
                      </div>
                    );
                  })()}
                </div>

                {/* Amount */}
                <div className="text-center py-4">
                  {selectedActivity.type === 'swap' ? (
                    <>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white">
                            {formatAmount(selectedActivity.fromAmount, selectedActivity.fromToken)}
                          </p>
                          <p className="text-xl text-slate-400 mt-1">{selectedActivity.fromToken}</p>
                        </div>
                        <div className="text-blue-500">
                          <ArrowUpRight className="w-8 h-8 rotate-90" />
                        </div>
                        <div className="text-left">
                          <p className="text-3xl font-bold text-green-500">
                            {formatAmount(selectedActivity.toAmount, selectedActivity.toToken)}
                          </p>
                          <p className="text-xl text-slate-400 mt-1">{selectedActivity.toToken}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={`text-4xl font-bold ${
                        selectedActivity.type === 'receive' ? 'text-green-500' : 'text-white'
                      }`}>
                        {selectedActivity.type === 'receive' ? '+' : selectedActivity.type === 'send' ? '-' : ''}
                        {formatAmount(selectedActivity.amount, getTokenSymbol(selectedActivity))}
                      </p>
                      <p className="text-2xl text-slate-400 mt-1">{getTokenSymbol(selectedActivity)}</p>
                    </>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status</span>
                    <Badge 
                      variant={selectedActivity.status === 'confirmed' ? 'default' : 'secondary'}
                      className={selectedActivity.status === 'confirmed' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {selectedActivity.status}
                    </Badge>
                  </div>

                  {/* Timestamp */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Time</span>
                    <span className="text-white">
                      {new Date(selectedActivity.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Network */}
                  {selectedActivity.network && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Network</span>
                      <span className="text-white capitalize">{selectedActivity.network}</span>
                    </div>
                  )}

                  {/* Exchange Rate (for swap) */}
                  {selectedActivity.type === 'swap' && selectedActivity.rate && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Exchange Rate</span>
                      <span className="text-white">1 {selectedActivity.fromToken} = {selectedActivity.rate} {selectedActivity.toToken}</span>
                    </div>
                  )}

                  {/* Fee */}
                  {selectedActivity.fee !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Fee</span>
                      <div className="text-right">
                        <span className="text-white">${selectedActivity.fee}</span>
                        {selectedActivity.type === 'swap' && selectedActivity.feeAmount && (
                          <p className="text-slate-500 text-xs">
                            {selectedActivity.feeAmount.toFixed(6)} {selectedActivity.fromToken}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Total Deducted (for send) */}
                  {selectedActivity.totalDeducted !== undefined && selectedActivity.type === 'send' && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                      <span className="text-slate-400 font-semibold">Total Deducted</span>
                      <span className="text-white font-semibold">
                        {selectedActivity.totalDeducted.toFixed(6)} {getTokenSymbol(selectedActivity)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Addresses */}
                {(selectedActivity.to || selectedActivity.from) && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
                    {selectedActivity.to && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">To</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-white text-sm font-mono bg-slate-950/50 px-3 py-2 rounded-lg flex-1">
                            {truncateAddress(selectedActivity.to, 8, 8)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(selectedActivity.to!, 'to')}
                            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800/50"
                          >
                            {copiedField === 'to' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedActivity.from && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">From</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-white text-sm font-mono bg-slate-950/50 px-3 py-2 rounded-lg flex-1">
                            {selectedActivity.from === 'Blockchain' || selectedActivity.from === 'Dev Mode Simulation' 
                              ? selectedActivity.from 
                              : truncateAddress(selectedActivity.from, 8, 8)
                            }
                          </code>
                          {selectedActivity.from !== 'Blockchain' && selectedActivity.from !== 'Dev Mode Simulation' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(selectedActivity.from!, 'from')}
                              className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800/50"
                            >
                              {copiedField === 'from' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction Hash */}
                {selectedActivity.signature && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Transaction Hash</p>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-white text-sm font-mono bg-slate-950/50 px-3 py-2 rounded-lg flex-1 break-all">
                          {truncateAddress(selectedActivity.signature, 10, 10)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(selectedActivity.signature!, 'signature')}
                          className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800/50"
                        >
                          {copiedField === 'signature' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dev Mode Notice */}
                {selectedActivity.isDevMode && selectedActivity.signature && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300 text-center">
                      ⚠️ This is a simulated transaction (Dev Mode)<br />
                      The explorer link below is for demonstration only
                    </p>
                  </div>
                )}

                {/* Explorer Link */}
                {selectedActivity.signature && getExplorerUrl(selectedActivity) && (
                  <Button
                    onClick={() => {
                      const url = getExplorerUrl(selectedActivity);
                      if (url) {
                        if (selectedActivity.isDevMode) {
                          toast.info('Dev Mode: This would open the blockchain explorer in a real transaction');
                        } else {
                          window.open(url, '_blank');
                        }
                      }
                    }}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 shadow-lg shadow-purple-500/20"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {selectedActivity.network === 'ethereum' ? 'View on Etherscan' :
                     selectedActivity.network === 'bitcoin' ? 'View on Blockchair' :
                     selectedActivity.network === 'devnet' ? 'View on Solscan (Devnet)' :
                     'View on Solscan'}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}