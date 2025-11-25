import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search as SearchIcon, Plus, Minus, Loader2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { TokenLogo } from './TokenLogo';
import { toast } from 'sonner@2.0.3';

interface AddTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  onTokenAdded?: () => void;
}

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export function AddTokenDialog({ open, onOpenChange, walletId, onTokenAdded }: AddTokenDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<CoinGeckoToken[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<CoinGeckoToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCoin, setAddingCoin] = useState<string | null>(null);
  const [addedCoins, setAddedCoins] = useState<Set<string>>(new Set());
  const [walletTokenSymbols, setWalletTokenSymbols] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchCoins();
      fetchWalletTokens();
    }
  }, [open]);

  const fetchWalletTokens = async () => {
    try {
      console.log('[AddTokenDialog] Loading wallet tokens from localStorage...');
      
      // In client-side architecture, we don't have a server-side wallet token list
      // Instead, we'll just use an empty set since tokens are managed by blockchain APIs
      // Users can add any token they want and balances will be fetched from blockchain
      const tokenSymbols = new Set<string>();
      setWalletTokenSymbols(tokenSymbols);
      
      console.log('[AddTokenDialog] ✅ Wallet tokens initialized (client-side mode)');
    } catch (error) {
      console.error('[AddTokenDialog] Error initializing wallet tokens:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = coins.filter(coin =>
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 50); // Limit to 50 results for performance
      setFilteredCoins(filtered);
    } else {
      setFilteredCoins(coins.slice(0, 50)); // Show top 50 by default
    }
    
    // Mark coins that are already in wallet
    const added = new Set<string>();
    coins.forEach(coin => {
      if (walletTokenSymbols.has(coin.symbol.toUpperCase())) {
        added.add(coin.id);
      }
    });
    setAddedCoins(added);
  }, [searchQuery, coins, walletTokenSymbols]);

  const fetchCoins = async () => {
    try {
      setLoading(true);
      console.log('Fetching CoinGecko coins...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coins?page=1&per_page=250`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', response.status, errorText);
        
        if (response.status === 429 || errorText.includes('429')) {
          toast.error('Rate limit reached. Please try again in a moment...');
        } else {
          toast.error('Failed to load coins');
        }
        throw new Error('Failed to fetch coins');
      }

      const data = await response.json();
      
      // Handle error response
      if (data.error) {
        console.error('API returned error:', data.error);
        if (data.error.includes('429')) {
          toast.error('Rate limit reached. Please try again later...');
        } else {
          toast.error('Failed to load coins');
        }
        return;
      }
      
      console.log(`Fetched ${data.length} coins`);
      setCoins(data);
      setFilteredCoins(data.slice(0, 50));
    } catch (error) {
      console.error('Error fetching coins:', error);
      // Error already shown in toast above
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoin = async (coin: CoinGeckoToken) => {
    try {
      setAddingCoin(coin.id);
      
      console.log('Adding coin to wallet:', coin.symbol);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/add-coin-to-wallet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletId,
            coinId: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add coin');
      }

      const data = await response.json();
      console.log('Coin added:', data);
      
      // Mark as added
      setAddedCoins(prev => new Set([...prev, coin.id]));
      
      toast.success(`${coin.symbol.toUpperCase()} added to your wallet!`);
      
      // Notify parent to refresh
      if (onTokenAdded) {
        onTokenAdded();
      }
    } catch (error: any) {
      console.error('Error adding coin:', error);
      toast.error(error.message || 'Failed to add coin to wallet');
    } finally {
      setAddingCoin(null);
    }
  };

  const handleRemoveCoin = async (coin: CoinGeckoToken) => {
    try {
      setAddingCoin(coin.id);
      
      console.log('Removing coin from wallet:', coin.symbol);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/remove-coin-from-wallet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletId,
            symbol: coin.symbol.toUpperCase()
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove coin');
      }

      const data = await response.json();
      console.log('Coin removed:', data);
      
      // Mark as removed
      setAddedCoins(prev => {
        const newSet = new Set(prev);
        newSet.delete(coin.id);
        return newSet;
      });
      
      toast.success(`${coin.symbol.toUpperCase()} removed from your wallet!`);
      
      // Notify parent to refresh
      if (onTokenAdded) {
        onTokenAdded();
      }
    } catch (error: any) {
      console.error('Error removing coin:', error);
      toast.error(error.message || 'Failed to remove coin from wallet');
    } finally {
      setAddingCoin(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-slate-800/50 text-white w-full max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40 px-4 py-5 border-b border-slate-800/50">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Token</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Search and add tokens from CoinGecko
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Search Input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Coins List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Loading tokens...</p>
              </div>
            </div>
          ) : filteredCoins.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <SearchIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">No tokens found</p>
                <p className="text-xs text-slate-500 mt-1">Try a different search term</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCoins.map((coin, index) => {
                const isAdded = addedCoins.has(coin.id);
                const isAdding = addingCoin === coin.id;
                const isPositive = coin.price_change_percentage_24h >= 0;

                return (
                  <motion.div
                    key={coin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50 transition-all"
                  >
                    {/* Coin Icon */}
                    <div className="relative shrink-0">
                      <TokenLogo
                        logoUrl={coin.image}
                        symbol={coin.symbol}
                        name={coin.name}
                        size="md"
                      />
                      {coin.market_cap_rank && coin.market_cap_rank <= 10 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                          {coin.market_cap_rank}
                        </div>
                      )}
                    </div>

                    {/* Coin Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-white truncate">{coin.name}</h3>
                        <span className="text-xs text-slate-400 uppercase">{coin.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-300">{formatPrice(coin.current_price)}</span>
                        <span className={`flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        MCap: {formatMarketCap(coin.market_cap)}
                      </p>
                    </div>

                    {/* Add/Remove Button */}
                    <Button
                      onClick={() => isAdded ? handleRemoveCoin(coin) : handleAddCoin(coin)}
                      disabled={isAdding}
                      size="sm"
                      className={`shrink-0 ${
                        isAdded
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isAdded ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Footer */}
        {!loading && filteredCoins.length > 0 && (
          <div className="px-4 pb-4">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-purple-200">
                💡 Tokens are added with 0 balance. Send funds to see them in your wallet.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}