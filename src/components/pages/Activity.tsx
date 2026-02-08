import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Copy, Check, Loader2, X, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';
import { getLocalSwapHistory, clearTransactionCache, fetchSolanaTransactionHistory, type TransactionItem } from '../../utils/transactionHistory';
import { useNetwork } from '../../utils/NetworkContext';
import { AccountManager } from '../../utils/accountManager';
import { TokenLogo, getSymbolByMint } from '../TokenLogo';

interface ActivityProps {
  walletId: string;
}

export function Activity({ walletId }: ActivityProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { network } = useNetwork();
  const [activities, setActivities] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<TransactionItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Track active account so we re-fetch when user switches accounts
  const activeAccount = AccountManager.getActiveAccount();
  const activeAccountId = activeAccount?.id || '';

  useEffect(() => {
    // Load transaction history
    fetchActivities(false);

    // Listen for swap history updates (when user completes a swap)
    const handleSwapHistoryUpdate = () => {
      console.log('[Activity] Swap history updated, refreshing activities...');
      fetchActivities();
    };

    window.addEventListener('swapHistoryUpdated', handleSwapHistoryUpdate);

    return () => {
      window.removeEventListener('swapHistoryUpdated', handleSwapHistoryUpdate);
    };
  }, [walletId, network, activeAccountId]);

  const fetchActivities = async (backgroundRefresh = false) => {
    try {
      // Debounce: Skip if we fetched recently (within last 5 seconds)
      const now = Date.now();
      if (now - lastFetchTime < 5000 && backgroundRefresh) {
        console.log('[Activity] ⏭️ Skipping fetch - too soon since last fetch');
        return;
      }

      setLastFetchTime(now);
      if (!backgroundRefresh) {
        setLoading(true);
      }
      console.log('[Activity] 🔄 Loading transaction history...');

      // Get local swap history
      const localSwaps = getLocalSwapHistory();
      console.log('[Activity] 📱 Local swap history:', localSwaps.length, 'transactions');

      // Get the active account's address
      const account = AccountManager.getActiveAccount();
      const solanaAddress = account?.addresses?.solana;

      let blockchainTxs: TransactionItem[] = [];

      // Fetch blockchain transactions if we have a Solana address
      if (solanaAddress) {
        console.log('[Activity] 🔗 Fetching blockchain transactions for:', solanaAddress);
        try {
          // Default to mainnet if network context is not yet available
          const isTestnet = network?.isTestnet ?? false;
          blockchainTxs = await fetchSolanaTransactionHistory(solanaAddress, isTestnet);
          console.log('[Activity] 🔗 Blockchain transactions:', blockchainTxs.length);
        } catch (error) {
          console.warn('[Activity] Failed to fetch blockchain transactions:', error);
        }
      }

      // Merge local swaps and blockchain transactions
      // Use tx.id as key (unique per token per direction, e.g. "sig_mint_receive")
      // This preserves multiple token transfers from the same transaction
      const txMap = new Map<string, TransactionItem>();
      // Track which signatures have local swap data (for dedup)
      const localSwapSignatures = new Set<string>();

      // Add local swaps first (they have more details like token names)
      // Filter to only include swaps from the current account
      const accountSwaps = localSwaps.filter(tx => tx.from === solanaAddress);
      for (const tx of accountSwaps) {
        txMap.set(tx.id, tx);
        if (tx.signature) localSwapSignatures.add(tx.signature);
      }

      // Add blockchain transactions (skip if local swap already has this signature)
      for (const tx of blockchainTxs) {
        // If local swap already covers this signature, skip blockchain version
        if (tx.signature && localSwapSignatures.has(tx.signature)) continue;
        txMap.set(tx.id, tx);
      }

      // Convert to array and sort by timestamp (most recent first)
      const allTransactions = Array.from(txMap.values()).sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      console.log('[Activity] ✅ Total transactions:', allTransactions.length);
      setActivities(allTransactions);
      setLoading(false);
    } catch (error: any) {
      console.error('[Activity] ❌ Error fetching activities:', error);
      // Don't show error toast for background refreshes
      if (!backgroundRefresh) {
        toast.error('Failed to load transaction history');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTokenSymbol = (activity: TransactionItem): string => {
    const symbol = activity.token || activity.coin || 'Unknown';
    // If symbol is "TOKEN" (unresolved), try to resolve from Jupiter's mint cache
    if (symbol === 'TOKEN' && activity.mint) {
      const resolved = getSymbolByMint(activity.mint);
      if (resolved) return resolved;
    }
    return symbol;
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

  const getDateGroup = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();

    // Reset time parts for accurate day comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    // Show actual date for older transactions (like Phantom)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupTransactionsByDate = (transactions: TransactionItem[]): { [key: string]: TransactionItem[] } => {
    // Sort transactions by date (most recent first)
    const sorted = [...transactions].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Group by date
    const grouped: { [key: string]: TransactionItem[] } = {};
    sorted.forEach(tx => {
      const group = getDateGroup(tx.timestamp);
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(tx);
    });

    return grouped;
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
        return { Icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-500/10', themeColor: null };
      case 'send':
        return { Icon: ArrowUpRight, color: '', bg: '', themeColor: colors.primary };
      case 'swap':
        return { Icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10', themeColor: null };
      default:
        return { Icon: ArrowUpRight, color: 'text-slate-500', bg: 'bg-slate-500/10', themeColor: null };
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

  const formatAmount = (amount: number | undefined, symbol: string): string => {
    if (amount === undefined || amount === null) return '0';

    // Handle very small amounts (avoid scientific notation)
    if (amount > 0 && amount < 0.000001) {
      return '< 0.000001';
    }

    if (symbol === 'SOL' || symbol === 'ETH' || symbol === 'BTC') {
      return amount.toFixed(6);
    }

    // For other tokens, show more decimals if the amount is very small
    if (amount > 0 && amount < 0.01) {
      return amount.toFixed(6);
    }

    return amount.toFixed(2);
  };

  const formatFeeUsd = (fee: number | undefined): string => {
    if (fee === undefined || fee === null) return '$0.00';

    // Handle very small fees (avoid scientific notation like $2.6288226720000004e-7)
    if (fee > 0 && fee < 0.01) {
      return '< $0.01';
    }

    return `$${fee.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: colors.primary }} />
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
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">{t.activity.activity}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                clearTransactionCache(); // Clear cache on manual refresh
                fetchActivities();
              }}
              className="text-slate-400 hover:text-white hover:bg-slate-900/50 h-9 w-9"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-900/50 h-9 w-9"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Activity List - Grouped by Date */}
        {(() => {
          const groupedActivities = groupTransactionsByDate(activities);
          const groups = Object.keys(groupedActivities);

          return (
            <div className="space-y-6">
              {groups.map((groupName, groupIdx) => (
                <div key={groupName}>
                  {/* Date Header */}
                  <h3 className="text-slate-400 font-medium mb-3 px-1">{groupName}</h3>

                  {/* Transactions in this group */}
                  <div className="space-y-2">
                      {groupedActivities[groupName].map((activity, idx) => {
                        const { Icon, color, bg } = getActivityIcon(activity.type);
                        const tokenSymbol = getTokenSymbol(activity);
                        
                        // Debug: Log token info
                        if (idx === 0) {
                          console.log('[Activity Debug] First transaction:', {
                            type: activity.type,
                            tokenSymbol,
                            token: activity.token,
                            coin: activity.coin,
                            fromToken: activity.fromToken,
                            toToken: activity.toToken,
                            fullActivity: activity
                          });
                        }

                        return (
                          <button
                            key={activity.id}
                            className="w-full p-4 rounded-2xl hover:bg-slate-900/50 transition-all flex items-center justify-between backdrop-blur-sm bg-slate-950/30 border border-slate-800/30 hover:border-slate-700/50"
                            onClick={() => setSelectedActivity(activity)}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative"
                              >
                                {/* Main Token Logo */}
                                {activity.type === 'swap' ? (
                                  // For swap: show both tokens overlapping
                                  <div className="w-12 h-12 relative">
                                    <div className="absolute left-0 top-0 w-9 h-9 z-10">
                                      {activity.fromToken || tokenSymbol ? (
                                        <TokenLogo
                                          symbol={activity.fromToken || tokenSymbol}
                                          name={activity.fromToken || tokenSymbol}
                                          size="sm"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                                          <span className="text-sm">?</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="absolute right-0 bottom-0 w-9 h-9">
                                      {activity.toToken ? (
                                        <TokenLogo
                                          symbol={activity.toToken}
                                          name={activity.toToken}
                                          size="sm"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                                          <span className="text-sm">?</span>
                                        </div>
                                      )}
                                    </div>
                                    {/* Swap icon badge */}
                                    <div
                                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg z-20"
                                      style={{ backgroundColor: colors.primary }}
                                    >
                                      <RefreshCw className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </div>
                                  </div>
                                ) : (
                                  // For send/receive: show single token
                                  <>
                                    {tokenSymbol && tokenSymbol !== 'Unknown' ? (
                                      <TokenLogo
                                        symbol={tokenSymbol}
                                        name={tokenSymbol}
                                        mint={activity.mint}
                                        size="md"
                                      />
                                    ) : (
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                                        <Icon className={`w-5 h-5 ${color}`} strokeWidth={2.5} />
                                      </div>
                                    )}
                                    {/* Send/Receive icon badge */}
                                    {activity.type === 'send' && (
                                      <div
                                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg"
                                        style={{ backgroundColor: colors.primary }}
                                      >
                                        <ArrowUpRight className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                      </div>
                                    )}
                                    {activity.type === 'receive' && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-slate-950 shadow-lg">
                                        <ArrowDownLeft className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-white capitalize font-semibold">
                                    {activity.type === 'swap' ? 'Swapped' : activity.type}
                                  </h4>
                                  {isNewTransaction(activity.timestamp) && (
                                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-slate-400 text-sm">
                                  {activity.type === 'send' && activity.to && `To ${truncateAddress(activity.to, 4, 4)}`}
                                  {activity.type === 'receive' && activity.from && `From ${truncateAddress(activity.from, 4, 4)}`}
                                  {activity.type === 'swap' && 'Jupiter'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              {activity.type === 'swap' ? (
                                <>
                                  <p className="text-green-500 text-sm font-semibold">
                                    +{formatAmount(activity.toAmount || 0, activity.toToken || '')} {activity.toToken}
                                  </p>
                                  <p className="font-medium text-white text-sm">
                                    -{formatAmount(activity.fromAmount || activity.amount, activity.fromToken || tokenSymbol)} {activity.fromToken || tokenSymbol}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p
                                    className="font-semibold"
                                    style={{ color: activity.type === 'receive' ? '#22c55e' : colors.primary }}
                                  >
                                    {activity.type === 'receive' ? '+' : '-'}
                                    {formatAmount(activity.amount, tokenSymbol)} {tokenSymbol}
                                  </p>
                                  <p className="text-slate-500 text-sm capitalize font-medium">{activity.status}</p>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {activities.length === 0 && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-4 border border-slate-800/50"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
            >
              <ArrowUpRight className="w-12 h-12 text-slate-600" strokeWidth={1.5} />
            </motion.div>
            <h3 className="text-slate-400 font-semibold mb-2">No transactions yet</h3>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">When you swap tokens using this wallet, your activity will appear here.</p>
          </motion.div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white max-w-[90vw] sm:max-w-sm w-full max-h-[85vh] overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="text-lg font-bold capitalize">
                  {selectedActivity.type} Details
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm">
                  Transaction details and blockchain info
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                {selectedActivity.type === 'swap' ? (
                  /* Swap - Overlapping tokens design */
                  <div className="py-6">
                    <div className="flex flex-col items-center">
                      {/* Overlapping Token Logos - First on left, second offset right */}
                      <div className="relative h-20 w-24 mb-4">
                        {/* From Token - on top left */}
                        <div className="absolute top-0 left-0 w-16 h-16 rounded-full shadow-lg z-20 ring-2 ring-slate-900">
                          <TokenLogo
                            symbol={selectedActivity.fromToken || getTokenSymbol(selectedActivity)}
                            name={selectedActivity.fromToken || getTokenSymbol(selectedActivity)}
                            size="lg"
                          />
                        </div>
                        {/* To Token - below and offset right */}
                        <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full shadow-lg z-10 ring-2 ring-slate-900">
                          <TokenLogo
                            symbol={selectedActivity.toToken}
                            name={selectedActivity.toToken}
                            size="lg"
                          />
                        </div>
                      </div>

                      {/* Token Swap Direction Text */}
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <span className="text-white">{selectedActivity.fromToken}</span>
                        <span style={{ color: colors.accent }}>→</span>
                        <span className="text-white">{selectedActivity.toToken}</span>
                      </div>

                      {/* Amounts */}
                      <div className="flex items-center gap-3 mt-3 text-sm text-slate-400">
                        <span>{formatAmount(selectedActivity.fromAmount, selectedActivity.fromToken || '')}</span>
                        <span>→</span>
                        <span className="text-green-400">{formatAmount(selectedActivity.toAmount, selectedActivity.toToken || '')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Send/Receive - Centered token with overlapping badge */
                  <div className="py-6">
                    <div className="flex flex-col items-center">
                      {/* Title */}
                      <h3 className="text-white text-lg font-semibold mb-4">
                        {selectedActivity.type === 'receive' ? 'Received' : 'Sent'}
                      </h3>

                      {/* Centered Token Logo with overlapping badge */}
                      <div className="relative mb-4">
                        {/* Main Token Logo - Centered */}
                        <div className="w-16 h-16 rounded-full shadow-lg ring-2 ring-slate-900">
                          <TokenLogo
                            symbol={getTokenSymbol(selectedActivity)}
                            name={getTokenSymbol(selectedActivity)}
                            size="lg"
                          />
                        </div>
                        {/* Send/Receive icon badge - overlapping bottom right */}
                        {selectedActivity.type === 'send' && (
                          <div
                            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <ArrowUpRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                        {selectedActivity.type === 'receive' && (
                          <div
                            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"
                            style={{ backgroundColor: `${colors.primary}CC` }}
                          >
                            <ArrowDownLeft className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>

                      {/* Amount with Token Symbol on same line */}
                      <p className={`text-3xl font-bold ${
                        selectedActivity.type === 'receive' ? 'text-green-500' : ''
                      }`} style={{ color: selectedActivity.type === 'send' ? colors.primary : undefined }}>
                        {selectedActivity.type === 'receive' ? '+' : '-'}
                        {formatAmount(selectedActivity.amount, getTokenSymbol(selectedActivity))} {getTokenSymbol(selectedActivity)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 text-sm">
                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status</span>
                    <Badge 
                      variant={selectedActivity.status === 'confirmed' ? 'default' : 'secondary'}
                      className={`text-xs h-5 ${selectedActivity.status === 'confirmed' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}
                    >
                      {selectedActivity.status}
                    </Badge>
                  </div>

                  {/* Timestamp */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Time</span>
                    <span className="text-white text-sm">
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
                      <span className="text-white capitalize text-sm">{selectedActivity.network}</span>
                    </div>
                  )}

                  {/* Exchange Rate (for swap) */}
                  {selectedActivity.type === 'swap' && selectedActivity.rate && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Rate</span>
                      <span className="text-white text-sm">1 {selectedActivity.fromToken} = {selectedActivity.rate} {selectedActivity.toToken}</span>
                    </div>
                  )}

                  {/* Fee */}
                  {selectedActivity.fee !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Fee</span>
                      <div className="text-right">
                        <span className="text-white text-sm">{formatFeeUsd(selectedActivity.fee)}</span>
                        {selectedActivity.type === 'swap' && selectedActivity.feeAmount && (
                          <p className="text-slate-500 text-xs">
                            {formatAmount(selectedActivity.feeAmount, selectedActivity.fromToken || '')} {selectedActivity.fromToken}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Total Deducted (for send) */}
                  {selectedActivity.totalDeducted !== undefined && selectedActivity.type === 'send' && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                      <span className="text-slate-400 font-semibold text-sm">Total</span>
                      <span className="text-white font-semibold text-sm">
                        {selectedActivity.totalDeducted.toFixed(6)} {getTokenSymbol(selectedActivity)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Addresses */}
                {(selectedActivity.to || selectedActivity.from) && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/30">
                    {selectedActivity.to && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">To</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white text-xs bg-slate-950/50 px-2 py-1.5 rounded-lg flex-1">
                            {truncateAddress(selectedActivity.to, 6, 6)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(selectedActivity.to!, 'to')}
                            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800/50"
                          >
                            {copiedField === 'to' ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedActivity.from && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">From</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white text-xs bg-slate-950/50 px-2 py-1.5 rounded-lg flex-1">
                            {selectedActivity.from === 'Blockchain' || selectedActivity.from === 'Dev Mode Simulation'
                              ? selectedActivity.from
                              : truncateAddress(selectedActivity.from, 6, 6)
                            }
                          </span>
                          {selectedActivity.from !== 'Blockchain' && selectedActivity.from !== 'Dev Mode Simulation' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(selectedActivity.from!, 'from')}
                              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800/50"
                            >
                              {copiedField === 'from' ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
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
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/30">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Transaction Hash</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white text-xs bg-slate-950/50 px-2 py-1.5 rounded-lg flex-1 break-all">
                          {truncateAddress(selectedActivity.signature, 8, 8)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(selectedActivity.signature!, 'signature')}
                          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800/50"
                        >
                          {copiedField === 'signature' ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dev Mode Notice */}
                {selectedActivity.isDevMode && selectedActivity.signature && (
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300 text-center">
                      ⚠️ Simulated transaction (Dev Mode)
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
                    className="w-full h-10 text-white border-0 shadow-lg"
                    style={{
                      backgroundColor: colors.primary,
                      boxShadow: `0 4px 14px -3px ${colors.primary}4D`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {selectedActivity.network === 'ethereum' ? 'Etherscan' :
                     selectedActivity.network === 'bitcoin' ? 'Blockchair' :
                     selectedActivity.network === 'devnet' ? 'Solscan (Dev)' :
                     'Solscan'}
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