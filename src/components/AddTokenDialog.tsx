import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, TrendingUp, TrendingDown, Plus, Loader2, Minus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { TokenLogo } from './TokenLogo';
import { TOKEN_REGISTRY, searchTokens, type TokenMetadata } from '../utils/tokenRegistry';
import { addCustomToken, removeCustomToken, isTokenAdded } from '../utils/customTokens';

interface AddTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenAdded?: () => void;
}

interface DisplayToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  mint?: string;
}

export function AddTokenDialog({ open, onOpenChange, onTokenAdded }: AddTokenDialogProps) {
  const { formatPrice } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<DisplayToken[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<DisplayToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCoin, setAddingCoin] = useState<string | null>(null);
  const [addedCoins, setAddedCoins] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadTokens();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Use searchTokens from registry for efficient search
      const registryResults = searchTokens(searchQuery);
      const filtered = registryResults.map(tokenToDisplayToken).slice(0, 100);
      setFilteredCoins(filtered);
    } else {
      setFilteredCoins(coins.slice(0, 100));
    }
  }, [searchQuery, coins]);

  // Convert TokenMetadata to DisplayToken format
  const tokenToDisplayToken = (token: TokenMetadata): DisplayToken => ({
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    image: token.image,
    current_price: 0, // Will be fetched dynamically when needed
    market_cap: 0,
    market_cap_rank: TOKEN_REGISTRY.indexOf(token) + 1,
    price_change_percentage_24h: 0,
    mint: token.mint,
  });

  const loadTokens = async () => {
    try {
      setLoading(true);
      console.log('[AddTokenDialog] Loading tokens from TOKEN_REGISTRY (client-side)...');

      // Convert TOKEN_REGISTRY to DisplayToken format
      const displayTokens = TOKEN_REGISTRY.map(tokenToDisplayToken);

      // Load which tokens are already added (check by id)
      const addedSet = new Set<string>();
      displayTokens.forEach(token => {
        if (isTokenAdded(token.id)) {
          addedSet.add(token.id);
        }
      });
      setAddedCoins(addedSet);

      console.log(`[AddTokenDialog] Loaded ${displayTokens.length} tokens from registry`);
      setCoins(displayTokens);
      setFilteredCoins(displayTokens.slice(0, 50));
    } catch (error) {
      console.error('[AddTokenDialog] Error loading tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoin = async (coin: DisplayToken) => {
    try {
      setAddingCoin(coin.id);
      console.log('[AddTokenDialog] Adding coin to wallet (client-side):', coin.symbol);

      // Add to local custom tokens storage
      addCustomToken({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        mint: coin.mint || coin.id,
        network: 'solana',
      });

      // Mark as added
      setAddedCoins(prev => new Set([...prev, coin.id]));

      toast.success(`${coin.symbol.toUpperCase()} added to your wallet!`);

      // Notify parent to refresh
      if (onTokenAdded) {
        onTokenAdded();
      }
    } catch (error: any) {
      console.error('[AddTokenDialog] Error adding coin:', error);
      toast.error(error.message || 'Failed to add coin to wallet');
    } finally {
      setAddingCoin(null);
    }
  };

  const handleRemoveCoin = async (coin: DisplayToken) => {
    try {
      setAddingCoin(coin.id);
      console.log('[AddTokenDialog] Removing coin from wallet (client-side):', coin.symbol);

      // Remove from local custom tokens storage (uses id)
      removeCustomToken(coin.id);

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
      console.error('[AddTokenDialog] Error removing coin:', error);
      toast.error(error.message || 'Failed to remove coin from wallet');
    } finally {
      setAddingCoin(null);
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap > 0) return `$${marketCap.toLocaleString()}`;
    return '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-slate-800/50 text-white w-full max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40 px-4 py-5 border-b border-slate-800/50">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Token</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Search and add tokens to your wallet
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Search Input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
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
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
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
                        {coin.current_price > 0 ? (
                          <>
                            <span className="text-slate-300">{formatPrice(coin.current_price)}</span>
                            <span className={`flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500">Price loads on add</span>
                        )}
                      </div>
                      {coin.market_cap > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          MCap: {formatMarketCap(coin.market_cap)}
                        </p>
                      )}
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
                Tokens are added with 0 balance. Send funds to see them in your wallet.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
