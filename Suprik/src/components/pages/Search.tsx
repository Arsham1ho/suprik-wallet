import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search as SearchIcon, TrendingUp, TrendingDown, Loader2, Plus, Minus, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';
import { TokenLogo } from '../TokenLogo';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { addCustomToken, removeCustomToken, isTokenAdded, getCustomTokens } from '../../utils/customTokens';

interface SearchProps {
  onBack: () => void;
  walletId: string;
  onSelectToken?: (token: CoinGeckoToken) => void;
  onViewCoinDetail?: (coin: CoinGeckoToken) => void;
}

export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  amount?: number;
  value?: number;
}

// Memoized Coin Item Component for better performance
const CoinItem = memo(({ 
  coin, 
  onSelectToken, 
  isAdded, 
  isAdding, 
  onAdd, 
  onRemove, 
  onClick 
}: {
  coin: CoinGeckoToken;
  onSelectToken?: (token: CoinGeckoToken) => void;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: (e: React.MouseEvent, coin: CoinGeckoToken) => void;
  onRemove: (e: React.MouseEvent, coin: CoinGeckoToken) => void;
  onClick: (coin: CoinGeckoToken) => void;
}) => {
  const priceChange = coin.price_change_percentage_24h || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.15,
        ease: 'easeOut'
      }}
      className="w-full bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-sm rounded-xl p-2.5 transition-colors border border-transparent hover:border-purple-500/30 cursor-pointer will-change-auto"
      onClick={() => onClick(coin)}
    >
      <div className="flex items-center gap-1.5">
        {/* Market Cap Rank */}
        <div className="text-xs text-slate-500 w-4 text-left flex-shrink-0">
          {coin.market_cap_rank || '-'}
        </div>

        {/* Token Logo */}
        <div className="flex-shrink-0">
          <TokenLogo
            logoUrl={coin.image}
            symbol={coin.symbol}
            name={coin.name}
            size="sm"
          />
        </div>

        {/* Token Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-white text-sm truncate">{coin.name}</div>
          <div className="text-slate-400 text-xs uppercase">
            {coin.symbol}
          </div>
        </div>

        {/* Price & Change */}
        <div className="text-right mr-1 flex-shrink-0">
          <div className="text-white text-xs">
            ${coin.current_price >= 0.01 
              ? coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
            }
          </div>
          <div className={`text-xs flex items-center gap-0.5 justify-end ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </div>
        </div>

        {/* Add Button - Only show if not in selection mode */}
        {!onSelectToken && (
          <button
            onClick={(e) => isAdded ? onRemove(e, coin) : onAdd(e, coin)}
            disabled={isAdding}
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
              isAdded
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50`}
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isAdded ? (
              <Minus className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
});

CoinItem.displayName = 'CoinItem';

// Helper function to detect blockchain based on token metadata
const detectBlockchain = (coin: CoinGeckoToken): string[] => {
  const symbol = coin.symbol.toLowerCase();
  const name = coin.name.toLowerCase();
  const id = coin.id.toLowerCase();
  
  const blockchains: string[] = [];
  
  // Solana tokens (common identifiers)
  if (
    id.includes('solana') ||
    symbol === 'sol' ||
    ['bonk', 'jup', 'jto', 'pyth', 'wif', 'ray', 'srm', 'orca', 'mngo', 'pai', 'supra'].includes(symbol)
  ) {
    blockchains.push('solana');
  }
  
  // Ethereum tokens (most popular tokens are on Ethereum)
  if (
    id.includes('ethereum') ||
    symbol === 'eth' ||
    ['usdt', 'usdc', 'dai', 'uni', 'link', 'aave', 'comp', 'snx', 'mkr', 'crv', 'ens', 'ldo'].includes(symbol) ||
    name.includes('ethereum') ||
    name.includes('erc-20') ||
    name.includes('erc20')
  ) {
    blockchains.push('ethereum');
  }
  
  // Polygon tokens
  if (
    id.includes('polygon') ||
    symbol === 'matic' ||
    name.includes('polygon')
  ) {
    blockchains.push('polygon');
  }
  
  // BSC tokens
  if (
    id.includes('binance') ||
    id.includes('bsc') ||
    symbol === 'bnb' ||
    name.includes('binance') ||
    name.includes('bsc')
  ) {
    blockchains.push('bsc');
  }
  
  // If no specific blockchain detected, assume it's multi-chain or ethereum (most common)
  if (blockchains.length === 0) {
    blockchains.push('ethereum');
  }
  
  return blockchains;
};

export function Search({ onBack, walletId, onSelectToken, onViewCoinDetail }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<CoinGeckoToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingCoin, setAddingCoin] = useState<string | null>(null);
  const [addedCoins, setAddedCoins] = useState<Set<string>>(new Set());
  const [walletTokenSymbols, setWalletTokenSymbols] = useState<Set<string>>(new Set());
  const [blockchainFilter, setBlockchainFilter] = useState<'all' | 'solana' | 'ethereum' | 'polygon' | 'bsc'>('all');

  // Featured tokens that should always appear at the top
  const featuredTokens: CoinGeckoToken[] = [
    {
      id: 'parabolic-ai',
      symbol: 'PAI',
      name: 'Parabolic AI',
      image: 'https://coin-images.coingecko.com/coins/images/30000/large/parabolic.png', // Generic placeholder
      current_price: 0,
      market_cap: 0,
      market_cap_rank: 0,
      price_change_percentage_24h: 0,
      total_volume: 0,
    },
    {
      id: 'supra',
      symbol: 'SUPRA',
      name: 'Suprana',
      image: 'https://coin-images.coingecko.com/coins/images/30598/large/supra.png',
      current_price: 0,
      market_cap: 0,
      market_cap_rank: 0,
      price_change_percentage_24h: 0,
      total_volume: 0,
    },
  ];

  // Load from localStorage cache on mount
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('coingecko_coins_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        // Use cache if less than 10 minutes old
        if (parsed.timestamp && now - parsed.timestamp < 10 * 60 * 1000) {
          console.log('Using localStorage cache for coins');
          setCoins(parsed.data || []);
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }
  }, []);

  useEffect(() => {
    fetchCoins(1);
    fetchWalletTokens();
    fetchFeaturedTokenPrices();
  }, [walletId]);
  
  // Fetch prices for featured tokens
  const fetchFeaturedTokenPrices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/token-prices`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            symbols: ['PAI', 'SUPRA']
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Search] Featured token prices response:', data);
        
        // Extract prices from response
        const prices = data.prices || data;
        
        // Update featured tokens with real prices
        featuredTokens[0].current_price = prices.PAI || 0;
        featuredTokens[1].current_price = prices.SUPRA || 0;
      } else {
        console.error('[Search] Failed to fetch featured token prices:', response.status);
      }
    } catch (error) {
      console.error('[Search] Error fetching featured token prices:', error);
    }
  };

  const fetchWalletTokens = async () => {
    try {
      console.log('[Search] Loading wallet tokens from localStorage...');
      
      // In client-side architecture, we don't have a server-side wallet token list
      // Instead, we'll just use an empty set since tokens are managed by blockchain APIs
      // Users can add any token they want and balances will be fetched from blockchain
      const tokenSymbols = new Set<string>();
      setWalletTokenSymbols(tokenSymbols);
      
      console.log('[Search] ✅ Wallet tokens initialized (client-side mode)');
    } catch (error) {
      console.error('[Search] Error initializing wallet tokens:', error);
    }
  };

  const fetchCoins = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log(`Fetching coins page ${pageNum}...`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coins?page=${pageNum}&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', response.status, errorText);
        
        // If rate limited, show a friendly message but don't throw
        if (response.status === 429 || errorText.includes('429')) {
          toast.error('Rate limit reached. Using cached data...');
          // Don't throw, let it continue with empty array
          return;
        }
        
        throw new Error('Failed to fetch coins');
      }

      const data = await response.json();
      
      // Handle error response
      if (data.error) {
        console.error('API returned error:', data.error);
        if (data.error.includes('429')) {
          toast.error('Rate limit reached. Please wait a moment...');
          return;
        }
        throw new Error(data.error);
      }
      
      console.log(`Fetched ${data.length} coins from page ${pageNum}`);

      if (pageNum === 1) {
        setCoins(data);
        // Cache the first page in localStorage
        try {
          localStorage.setItem('coingecko_coins_cache', JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error caching data:', e);
        }
      } else {
        setCoins(prev => [...prev, ...data]);
      }

      setHasMore(data.length === 100);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching coins:', error);
      
      // If page 1 fails and we have no coins, try to use localStorage cache even if expired
      if (pageNum === 1 && coins.length === 0) {
        try {
          const cachedData = localStorage.getItem('coingecko_coins_cache');
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.data && parsed.data.length > 0) {
              console.log('Using expired cache as fallback');
              setCoins(parsed.data);
              toast.error('Using cached data. Please try again later.');
            }
          }
        } catch (e) {
          console.error('Error reading fallback cache:', e);
        }
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      // Add a small delay to avoid rapid consecutive requests
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchCoins(page + 1);
    }
  }, [loadingMore, hasMore, page]);

  const filteredCoins = useMemo(() => {
    // Combine featured tokens with regular coins
    let allCoins = [...featuredTokens, ...coins];
    
    // Apply blockchain filter
    if (blockchainFilter !== 'all') {
      allCoins = allCoins.filter(coin => {
        const blockchains = detectBlockchain(coin);
        return blockchains.includes(blockchainFilter);
      });
    }
    
    // Apply search filter
    if (!searchQuery) return allCoins;
    const query = searchQuery.toLowerCase();
    return allCoins.filter(coin =>
      coin.name.toLowerCase().includes(query) ||
      coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, searchQuery, featuredTokens, blockchainFilter]);

  // Mark coins that are already in wallet
  useEffect(() => {
    const added = new Set<string>();
    
    // Check custom tokens from localStorage
    const customTokens = getCustomTokens();
    customTokens.forEach(token => {
      added.add(token.id);
    });
    
    setAddedCoins(added);
  }, [coins, walletTokenSymbols]);

  const handleTokenClick = useCallback((coin: CoinGeckoToken) => {
    if (onSelectToken) {
      // If in selection mode (for Swap), select the token
      onSelectToken(coin);
    } else if (onViewCoinDetail) {
      // Otherwise, view coin detail
      onViewCoinDetail(coin);
    }
  }, [onSelectToken, onViewCoinDetail]);

  const handleAddCoin = async (e: React.MouseEvent, coin: CoinGeckoToken) => {
    e.stopPropagation(); // Prevent triggering the coin detail view
    
    try {
      setAddingCoin(coin.id);
      
      console.log('[Search] Adding coin to custom tokens:', coin.symbol);
      
      // Add to localStorage
      const success = addCustomToken({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        network: 'multi' // Since it can be on multiple networks
      });
      
      if (success) {
        // Mark as added
        setAddedCoins(prev => new Set([...prev, coin.id]));
        toast.success(`${coin.symbol.toUpperCase()} added to your wallet!`);
        
        // Dispatch custom event to notify Home page
        window.dispatchEvent(new CustomEvent('customTokensChanged'));
      } else {
        toast.info(`${coin.symbol.toUpperCase()} is already in your wallet`);
      }
    } catch (error) {
      console.error('[Search] Error adding coin:', error);
      toast.error('Failed to add coin to wallet');
    } finally {
      setAddingCoin(null);
    }
  };

  const handleRemoveCoin = async (e: React.MouseEvent, coin: CoinGeckoToken) => {
    e.stopPropagation(); // Prevent triggering the coin detail view
    
    try {
      setAddingCoin(coin.id);
      
      console.log('[Search] Removing coin from custom tokens:', coin.symbol);
      
      // Remove from localStorage
      const success = removeCustomToken(coin.id);
      
      if (success) {
        // Mark as removed
        setAddedCoins(prev => {
          const newSet = new Set(prev);
          newSet.delete(coin.id);
          return newSet;
        });
        
        toast.success(`${coin.symbol.toUpperCase()} removed from your wallet!`);
        
        // Dispatch custom event to notify Home page
        window.dispatchEvent(new CustomEvent('customTokensChanged'));
      } else {
        toast.error('Token not found in wallet');
      }
    } catch (error) {
      console.error('[Search] Error removing coin:', error);
      toast.error('Failed to remove coin from wallet');
    } finally {
      setAddingCoin(null);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-black pb-24 overflow-x-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-transparent to-pink-950/30 pointer-events-none" />
      
      {/* Header */}
      <motion.div 
        className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-slate-800/50 px-4 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="p-2 hover:bg-slate-800/50 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-white font-semibold">{onSelectToken ? 'Select Token' : 'Search Coins'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {coins.length.toLocaleString()} available
            </p>
          </div>
        </div>

        {/* Search Input with gradient border */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or symbol..."
              className="bg-transparent border-0 text-white h-12 pl-12 pr-12 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Blockchain Filter Chips */}
        <motion.div
          className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => setBlockchainFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
              blockchainFilter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All Chains
          </motion.button>
          
          <motion.button
            onClick={() => setBlockchainFilter('solana')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
              blockchainFilter === 'solana'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🟣 Solana
          </motion.button>
          
          <motion.button
            onClick={() => setBlockchainFilter('ethereum')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
              blockchainFilter === 'ethereum'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚪ Ethereum
          </motion.button>
          
          <motion.button
            onClick={() => setBlockchainFilter('polygon')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
              blockchainFilter === 'polygon'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🟣 Polygon
          </motion.button>
          
          <motion.button
            onClick={() => setBlockchainFilter('bsc')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
              blockchainFilter === 'bsc'
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/25'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🟡 BSC
          </motion.button>
        </motion.div>

        {/* Quick stats */}
        {searchQuery && filteredCoins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 text-center"
          >
            <span className="text-xs text-slate-400">
              Found <span className="text-purple-400 font-semibold">{filteredCoins.length}</span> {filteredCoins.length === 1 ? 'result' : 'results'}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      <div className="px-3 pt-4 relative z-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800/50 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800/50 rounded w-24" />
                    <div className="h-3 bg-slate-800/50 rounded w-16" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-slate-800/50 rounded w-20" />
                    <div className="h-3 bg-slate-800/50 rounded w-16 ml-auto" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredCoins.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 px-4"
          >
            {/* Empty state illustration */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
                <SearchIcon className="w-10 h-10 text-slate-500" />
              </div>
            </motion.div>
            
            <h3 className="text-white font-semibold mb-2">
              {searchQuery ? 'No Results Found' : 'No Coins Available'}
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              {searchQuery 
                ? `We couldn't find any coins matching "${searchQuery}". Try a different search.`
                : 'There are no coins available at the moment. Please check back later.'
              }
            </p>
            
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                className="mt-6 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Clear Search
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnimatePresence initial={false}>
                {filteredCoins.map((coin) => (
                  <CoinItem
                    key={coin.id}
                    coin={coin}
                    onSelectToken={onSelectToken}
                    isAdded={addedCoins.has(coin.id)}
                    isAdding={addingCoin === coin.id}
                    onAdd={handleAddCoin}
                    onRemove={handleRemoveCoin}
                    onClick={handleTokenClick}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load More Button */}
            {!searchQuery && hasMore && (
              <motion.div 
                className="mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 h-12 rounded-full shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      Load More Coins
                      <motion.span
                        className="ml-2"
                        animate={{ y: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        ↓
                      </motion.span>
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}