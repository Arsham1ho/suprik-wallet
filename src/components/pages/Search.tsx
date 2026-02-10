import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search as SearchIcon, X, TrendingUp, TrendingDown, Plus, Minus, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { TokenLogo } from '../TokenLogo';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { addCustomToken, removeCustomToken, isTokenAdded, getCustomTokens } from '../../utils/customTokens';
import { TOKEN_REGISTRY, searchTokens as searchTokenRegistry } from '../../utils/tokenRegistry';
import { getJupiterTokens, searchJupiterTokens, jupiterToCoinGeckoFormat } from '../../utils/jupiterTokens';
import { STOCK_TOKENS, STOCK_BY_MINT } from '../../utils/stockTokens';
import { fetchTopTokens } from '../../utils/coingecko';
import cosmicBg from 'figma:asset/d1566f8943179b67e87faa45cecace8e6cc289ed.png';

// Wallet token interface for tokens with balance
export interface WalletToken {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  logoUrl?: string;
  price: number;
  balance: number;
  hasBalance: boolean;
  mint?: string;
  network?: string;
}

interface SearchProps {
  onBack: () => void;
  walletId: string;
  onSelectToken?: (token: CoinGeckoToken) => void;
  onViewCoinDetail?: (coin: CoinGeckoToken) => void;
  walletTokens?: WalletToken[]; // Tokens user holds - shown first
  showOnlyWalletTokens?: boolean; // If true, only show wallet tokens (for "pay" selector)
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
  mint?: string; // Solana mint address
}

// Helper function to check if a token is Solana-native (for "Coming Soon" badge)
const isSolanaToken = (coin: CoinGeckoToken): boolean => {
  const symbol = coin.symbol.toLowerCase();
  const id = coin.id.toLowerCase();
  const name = coin.name.toLowerCase();

  // Check if it has a Solana mint address
  if (coin.mint && coin.mint.length > 30) {
    return true;
  }

  // Check against known Solana token IDs and symbols
  if (
    SOLANA_TOKEN_IDS.has(id) ||
    SOLANA_TOKEN_SYMBOLS.has(symbol) ||
    id.includes('solana') ||
    name.includes('solana')
  ) {
    return true;
  }

  return false;
};

// Memoized Coin Item Component for better performance
const CoinItem = memo(({
  coin,
  onSelectToken,
  isAdded,
  isAdding,
  onAdd,
  onRemove,
  onClick,
  showComingSoon = false
}: {
  coin: CoinGeckoToken;
  onSelectToken?: (token: CoinGeckoToken) => void;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: (e: React.MouseEvent, coin: CoinGeckoToken) => void;
  onRemove: (e: React.MouseEvent, coin: CoinGeckoToken) => void;
  onClick: (coin: CoinGeckoToken) => void;
  showComingSoon?: boolean;
}) => {
  const priceChange = coin.price_change_percentage_24h || 0;
  const hasBalance = coin.amount && coin.amount > 0;
  const usdValue = (coin.value || (coin.amount || 0) * coin.current_price) || 0;

  // Format price display
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(2)}`;
    } else if (price > 0) {
      return `<$0.01`;
    }
    return '-';
  };

  // Format balance display
  const formatBalance = (amount: number, symbol: string) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
    } else if (amount >= 1000) {
      return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
    } else if (amount >= 0.0001) {
      return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} ${symbol}`;
    }
    return `${amount.toExponential(2)} ${symbol}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.15,
        ease: 'easeOut'
      }}
      className="w-full bg-slate-900/50 hover:bg-slate-800/50 rounded-xl p-3 transition-colors cursor-pointer mb-1.5"
      onClick={() => onClick(coin)}
    >
      <div className="flex items-center gap-3">
        {/* Token Logo */}
        <div className="flex-shrink-0 relative">
          <TokenLogo
            logoUrl={coin.image}
            symbol={coin.symbol}
            name={coin.name}
            size="md"
            coinGeckoId={coin.id}
          />
          {coin.mint && STOCK_BY_MINT.has(coin.mint) && (
            <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1 z-10 bg-green-600 rounded-full w-5 h-5 flex items-center justify-center border-2 border-black shadow-md">
              <TrendingUp className="w-3 h-3 text-white stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Token Info - Name, then balance */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-white text-sm font-semibold truncate">{coin.name}</span>
            {showComingSoon && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap flex-shrink-0">
                Coming Soon
              </span>
            )}
          </div>
          {/* Balance amount below name */}
          <div className="text-slate-400 text-xs">
            {hasBalance
              ? formatBalance(coin.amount!, coin.symbol.toUpperCase())
              : coin.symbol.toUpperCase()
            }
          </div>
        </div>

        {/* Price & Change on right */}
        <div className="text-right flex-shrink-0">
          <div className="text-white text-sm font-medium">
            {hasBalance ? formatPrice(usdValue) : formatPrice(coin.current_price)}
          </div>
          <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange < 0.01 && priceChange > -0.01 ? '<' : ''}${Math.abs(priceChange * (hasBalance ? usdValue : coin.current_price) / 100).toFixed(2)}
          </div>
        </div>

        {/* Add Button - Only show if not in selection mode */}
        {!onSelectToken && (
          <button
            onClick={(e) => isAdded ? onRemove(e, coin) : onAdd(e, coin)}
            disabled={isAdding}
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
              isAdded
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50`}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAdded ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
});

CoinItem.displayName = 'CoinItem';

// Comprehensive list of Solana-native tokens (by CoinGecko ID and symbol)
const SOLANA_TOKEN_IDS = new Set([
  'solana', 'bonk', 'jupiter-exchange-solana', 'jito-governance-token', 'pyth-network',
  'dogwifcoin', 'raydium', 'serum', 'orca', 'mango-markets', 'marinade-staked-sol',
  'msol', 'render-token', 'helium', 'helium-mobile', 'hivemapper', 'grass',
  'tensor', 'parcl', 'jito-staked-sol', 'blazestake-staked-sol', 'samoyedcoin',
  'bonfida', 'step-finance', 'cope', 'dust-protocol', 'stepn', 'green-satoshi-token',
  'magic-eden', 'phantom', 'drift-protocol', 'marinade', 'lido-staked-sol',
  'kin', 'star-atlas', 'star-atlas-dao', 'aurory', 'genopets', 'defi-land',
  'zebec-protocol', 'port-finance', 'tulip-protocol', 'solend', 'francium',
  'larix', 'hubble', 'saber', 'sunny-aggregator', 'quarry', 'lifinity',
  'cropper-finance', 'aldrin', 'dexlab', 'cyclos', 'goosefx', 'zeta',
  'hxro', 'mango', 'friktion', 'katana', 'psyoptions', 'synchrony',
  'mean-dao', 'symmetry', 'investin', 'solrise-finance', 'ratio-finance',
  'parrot-protocol', 'apricot-finance', 'jet-protocol', 'oxygen', 'mercurial-finance',
  'cashio', 'uxd-protocol', 'port-protocol', 'kamino', 'marginfi',
  'popcat', 'cat-in-a-dogs-world', 'book-of-meme', 'slerf', 'wen-4',
  'jeo-boden', 'mother-iggy', 'pundu', 'gigachad-2', 'myro',
  'silly-dragon', 'analos', 'harambe', 'bonk-2', 'dogwifhat',
  'parabolic-ai', 'suprana', 'io-net', 'wormhole', 'nosana',
  'access-protocol', 'grape-protocol', 'ninja-protocol', 'solanium',
  'liq-protocol', 'genesysgo-shadow', 'only1', 'media-network',
]);

const SOLANA_TOKEN_SYMBOLS = new Set([
  'sol', 'bonk', 'jup', 'jto', 'pyth', 'wif', 'ray', 'srm', 'orca', 'mngo',
  'msol', 'rndr', 'hnt', 'mobile', 'honey', 'tnsr', 'prcl', 'jitosol', 'bsol',
  'samo', 'fida', 'step', 'cope', 'dust', 'gmt', 'gst', 'me', 'drift',
  'kin', 'atlas', 'polis', 'aury', 'gene', 'dfl', 'zbc', 'port', 'tulip',
  'slnd', 'fran', 'larix', 'hbb', 'sbr', 'sunny', 'qry', 'lfnty',
  'crp', 'rin', 'dxl', 'cys', 'gofx', 'zex', 'hxro', 'ftt', 'kat',
  'psy', 'mean', 'symm', 'ivn', 'slrs', 'ratio', 'prt', 'apt', 'jet',
  'oxy', 'mer', 'cash', 'uxd', 'kmno', 'mfi', 'popcat', 'mew', 'bome',
  'slerf', 'wen', 'boden', 'mother', 'pundu', 'giga', 'myro', 'silly',
  'anal', 'haram', 'pai', 'parai', 'sup', 'supra', 'io', 'w', 'nos',
  'acs', 'grape', 'ninja', 'slim', 'liq', 'shdw', 'like', 'media',
]);

// Helper function to detect blockchain based on token metadata
const detectBlockchain = (coin: CoinGeckoToken): string[] => {
  const symbol = coin.symbol.toLowerCase();
  const name = coin.name.toLowerCase();
  const id = coin.id.toLowerCase();

  const blockchains: string[] = [];

  // xStock tokenized stocks (check mint against STOCK_BY_MINT or name pattern)
  if (
    (coin.mint && STOCK_BY_MINT.has(coin.mint)) ||
    name.includes('xstock') ||
    (symbol.endsWith('x') && name.includes('xstock'))
  ) {
    blockchains.push('stocks');
    blockchains.push('solana'); // xStocks are also Solana SPL tokens
    return blockchains;
  }

  // Solana tokens - check comprehensive lists
  if (
    SOLANA_TOKEN_IDS.has(id) ||
    SOLANA_TOKEN_SYMBOLS.has(symbol) ||
    id.includes('solana') ||
    name.includes('solana') ||
    (coin.mint && coin.mint.length > 30) // Has Solana mint address
  ) {
    blockchains.push('solana');
  }

  // Polygon tokens
  if (
    id.includes('polygon') ||
    symbol === 'matic' ||
    symbol === 'pol' ||
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

  // If no specific blockchain detected, assume it's multi-chain
  if (blockchains.length === 0) {
    blockchains.push('solana');
  }

  return blockchains;
};

// Constants for pagination
const INITIAL_TOKENS_COUNT = 50; // Show first 50 tokens initially for fast load
const LOAD_MORE_COUNT = 100; // Load 100 more tokens each time

export function Search({ onBack, walletId, onSelectToken, onViewCoinDetail, walletTokens, showOnlyWalletTokens }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<CoinGeckoToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(INITIAL_TOKENS_COUNT); // How many tokens to display (starts at 50)
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingCoin, setAddingCoin] = useState<string | null>(null);
  const [addedCoins, setAddedCoins] = useState<Set<string>>(new Set());
  const [walletTokenSymbols, setWalletTokenSymbols] = useState<Set<string>>(new Set());
  const [blockchainFilter, setBlockchainFilter] = useState<'all' | 'solana' | 'stocks' | 'polygon' | 'bsc'>('all');
  const [featuredTokensData, setFeaturedTokensData] = useState<CoinGeckoToken[]>([]);
  const [searchResults, setSearchResults] = useState<CoinGeckoToken[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch real-time data for featured tokens
  useEffect(() => {
    const fetchFeaturedTokens = async () => {
      try {
        console.log('[Search] Fetching Suprana token data from CoinGecko...');
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/suprana?localization=false&tickers=false&community_data=false&developer_data=false`
        );

        if (response.ok) {
          const data = await response.json();
          console.log('[Search] ✅ Suprana data:', data);
          
          const supranaToken: CoinGeckoToken = {
            id: 'suprana',
            symbol: data.symbol?.toUpperCase() || 'SUPRA',
            name: data.name || 'Suprana',
            image: data.image?.large || data.image?.small || 'https://assets.coingecko.com/coins/images/36611/large/suprana.jpg',
            current_price: data.market_data?.current_price?.usd || 0,
            market_cap: data.market_data?.market_cap?.usd || 0,
            market_cap_rank: data.market_cap_rank || 999,
            price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
            total_volume: data.market_data?.total_volume?.usd || 0,
            mint: 'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp'
          };

          setFeaturedTokensData([
            supranaToken,
            {
              id: 'parabolic-ai',
              symbol: 'PARAI',
              name: 'Parabolic AI',
              image: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
              current_price: 0.045,
              market_cap: 180000000,
              market_cap_rank: 320,
              price_change_percentage_24h: 8.7,
              total_volume: 8500000,
              mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8'
            }
          ]);
        } else {
          console.warn('[Search] Failed to fetch Suprana data, using fallback');
          // Use fallback data
          setFeaturedTokensData([
            {
              id: 'suprana',
              symbol: 'SUPRA',
              name: 'Suprana',
              image: 'https://assets.coingecko.com/coins/images/36611/large/suprana.jpg',
              current_price: 0.001086,
              market_cap: 52000000,
              market_cap_rank: 450,
              price_change_percentage_24h: -8.66,
              total_volume: 3200000,
              mint: 'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp'
            },
            {
              id: 'parabolic-ai',
              symbol: 'PARAI',
              name: 'Parabolic AI',
              image: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
              current_price: 0.045,
              market_cap: 180000000,
              market_cap_rank: 320,
              price_change_percentage_24h: 8.7,
              total_volume: 8500000,
              mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8'
            }
          ]);
        }
      } catch (error) {
        console.error('[Search] Error fetching featured tokens:', error);
        // Use fallback data on error
        setFeaturedTokensData([
          {
            id: 'suprana',
            symbol: 'SUPRA',
            name: 'Suprana',
            image: 'https://assets.coingecko.com/coins/images/36611/large/suprana.jpg',
            current_price: 0.001086,
            market_cap: 52000000,
            market_cap_rank: 450,
            price_change_percentage_24h: -8.66,
            total_volume: 3200000,
            mint: 'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp'
          },
          {
            id: 'parabolic-ai',
            symbol: 'PARAI',
            name: 'Parabolic AI',
            image: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
            current_price: 0.045,
            market_cap: 180000000,
            market_cap_rank: 320,
            price_change_percentage_24h: 8.7,
            total_volume: 8500000,
            mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8'
          }
        ]);
      }
    };

    fetchFeaturedTokens();
  }, []);

  // Load from TOKEN_REGISTRY instantly, then check localStorage cache
  useEffect(() => {
    // INSTANT LOAD: Use pre-cached token registry (like Phantom)
    // This gives users instant access to top tokens without waiting for API
    const registryCoins: CoinGeckoToken[] = TOKEN_REGISTRY.map((token, index) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      current_price: 0, // Prices will be fetched later
      market_cap: 0,
      market_cap_rank: index + 1,
      price_change_percentage_24h: 0,
      total_volume: 0,
      mint: token.mint,
    }));

    console.log(`[Search] 🚀 Instant load: ${registryCoins.length} pre-cached tokens from registry`);
    setCoins(registryCoins);
    setLoading(false); // Show tokens immediately

    // Then check localStorage for more tokens
    try {
      const cachedData = localStorage.getItem('coingecko_coins_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        // Use cache if less than 10 minutes old
        if (parsed.timestamp && now - parsed.timestamp < 10 * 60 * 1000) {
          console.log('[Search] Using localStorage cache for additional coins');
          // Merge with registry, avoiding duplicates
          const existingIds = new Set(registryCoins.map(c => c.id));
          const newCoins = (parsed.data || []).filter((c: CoinGeckoToken) => !existingIds.has(c.id));
          if (newCoins.length > 0) {
            setCoins(prev => [...prev, ...newCoins]);
            console.log(`[Search] Added ${newCoins.length} additional coins from cache`);
          }
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    fetchWalletTokens();
  }, [walletId]);

  // Search CoinGecko API when user types a query
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || showOnlyWalletTokens) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        console.log(`[Search] Searching for: "${searchQuery}"`);

        // 1. Search TOKEN_REGISTRY first (instant)
        const registryResults = searchTokenRegistry(searchQuery);
        console.log(`[Search] Found ${registryResults.length} results from TOKEN_REGISTRY`);

        // Convert registry results to CoinGeckoToken format
        const registryCoins: CoinGeckoToken[] = registryResults.slice(0, 30).map((token, index) => ({
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          image: token.image,
          current_price: 0,
          market_cap: 0,
          market_cap_rank: index + 1,
          price_change_percentage_24h: 0,
          total_volume: 0,
          mint: token.mint,
        }));

        // 2. Also search Jupiter tokens for more results
        const jupiterTokens = await getJupiterTokens();
        const jupiterResults = searchJupiterTokens(searchQuery, jupiterTokens);
        console.log(`[Search] Found ${jupiterResults.length} results from Jupiter`);

        // Convert Jupiter results
        const jupiterCoins: CoinGeckoToken[] = jupiterResults.slice(0, 50).map((token, index) =>
          jupiterToCoinGeckoFormat(token, registryCoins.length + index)
        );

        // Merge results, avoiding duplicates
        const existingMints = new Set(registryCoins.map(c => c.mint).filter(Boolean));
        const existingSymbols = new Set(registryCoins.map(c => c.symbol.toUpperCase()));

        const uniqueJupiterCoins = jupiterCoins.filter(jc => {
          if (jc.mint && existingMints.has(jc.mint)) return false;
          if (existingSymbols.has(jc.symbol.toUpperCase())) return false;
          return true;
        });

        const combinedResults = [...registryCoins, ...uniqueJupiterCoins];
        console.log(`[Search] Total search results: ${combinedResults.length}`);

        setSearchResults(combinedResults);
      } catch (error) {
        console.error('[Search] Error searching:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, showOnlyWalletTokens]);

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

  const fetchCoins = async () => {
    try {
      setLoading(true);

      console.log(`[Search] Loading tokens from TOKEN_REGISTRY + Jupiter API...`);

      // 1. First load from TOKEN_REGISTRY (instant)
      const registryCoins: CoinGeckoToken[] = TOKEN_REGISTRY.map((token, index) => ({
        id: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        image: token.image,
        current_price: 0,
        market_cap: 0,
        market_cap_rank: index + 1,
        price_change_percentage_24h: 0,
        total_volume: 0,
        mint: token.mint,
      }));

      console.log(`[Search] Loaded ${registryCoins.length} tokens from TOKEN_REGISTRY`);

      // Show registry tokens immediately
      setCoins(registryCoins);
      setLoading(false);

      // Track all tokens for merging
      let allCoins = [...registryCoins];
      const existingMints = new Set(registryCoins.map(c => c.mint).filter(Boolean));
      const existingSymbols = new Set(registryCoins.map(c => c.symbol.toUpperCase()));
      const existingIds = new Set(registryCoins.map(c => c.id));

      // 2. Fetch Jupiter tokens (1000+ Solana tokens)
      try {
        const jupiterTokens = await getJupiterTokens();
        console.log(`[Search] Fetched ${jupiterTokens.length} tokens from Jupiter API`);

        if (jupiterTokens.length > 0) {
          const jupiterCoins: CoinGeckoToken[] = jupiterTokens.map((token, index) =>
            jupiterToCoinGeckoFormat(token, allCoins.length + index)
          );

          const newJupiterCoins = jupiterCoins.filter(jc => {
            if (jc.mint && existingMints.has(jc.mint)) return false;
            if (existingSymbols.has(jc.symbol.toUpperCase())) return false;
            return true;
          });

          // Add to tracking sets
          newJupiterCoins.forEach(jc => {
            if (jc.mint) existingMints.add(jc.mint);
            existingSymbols.add(jc.symbol.toUpperCase());
            existingIds.add(jc.id);
          });

          allCoins = [...allCoins, ...newJupiterCoins];
          console.log(`[Search] Added ${newJupiterCoins.length} unique Jupiter tokens`);
        }
      } catch (jupiterError) {
        console.warn('[Search] Jupiter fetch failed:', jupiterError);
      }

      // 3. Fetch CoinGecko top tokens (multi-chain coverage with prices)
      try {
        const cgTopTokens = await fetchTopTokens(1, 250);
        console.log(`[Search] Fetched ${cgTopTokens.length} tokens from CoinGecko`);

        if (cgTopTokens.length > 0) {
          const newCgCoins: CoinGeckoToken[] = cgTopTokens
            .filter(cg => {
              // Skip if we already have this token
              if (existingIds.has(cg.id)) return false;
              if (existingSymbols.has(cg.symbol.toUpperCase())) return false;
              return true;
            })
            .map(cg => ({
              id: cg.id,
              symbol: cg.symbol.toUpperCase(),
              name: cg.name,
              image: cg.image,
              current_price: cg.current_price,
              market_cap: cg.market_cap,
              market_cap_rank: cg.market_cap_rank,
              price_change_percentage_24h: cg.price_change_percentage_24h,
              total_volume: cg.total_volume,
            }));

          allCoins = [...allCoins, ...newCgCoins];
          console.log(`[Search] Added ${newCgCoins.length} unique CoinGecko tokens`);
        }
      } catch (cgError) {
        console.warn('[Search] CoinGecko fetch failed:', cgError);
      }

      // 4. Add xStock tokenized stocks
      const stockCoins: CoinGeckoToken[] = STOCK_TOKENS
        .filter(st => !existingMints.has(st.mint) && !existingSymbols.has(st.symbol.toUpperCase()))
        .map((st, index) => ({
          id: `xstock-${st.stockSymbol.toLowerCase()}`,
          symbol: st.symbol.toUpperCase(),
          name: st.name,
          image: st.logo,
          current_price: 0,
          market_cap: 0,
          market_cap_rank: allCoins.length + index + 1,
          price_change_percentage_24h: 0,
          total_volume: 0,
          mint: st.mint,
        }));

      stockCoins.forEach(sc => {
        if (sc.mint) existingMints.add(sc.mint);
        existingSymbols.add(sc.symbol.toUpperCase());
        existingIds.add(sc.id);
      });

      allCoins = [...allCoins, ...stockCoins];
      console.log(`[Search] Added ${stockCoins.length} xStock tokenized stocks`);

      // Update state with all tokens
      setCoins(allCoins);
      setHasMore(allCoins.length > INITIAL_TOKENS_COUNT);
      console.log(`[Search] ✅ Total tokens available: ${allCoins.length}`);
    } catch (error) {
      console.error('[Search] Error loading coins:', error);
      // Fallback to registry tokens if outer try fails
      setHasMore(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      // Simulate loading delay for smooth UX
      setTimeout(() => {
        setDisplayCount(prev => {
          const newCount = prev + LOAD_MORE_COUNT;
          // Check if we've loaded all tokens
          if (newCount >= coins.length) {
            setHasMore(false);
          }
          return Math.min(newCount, coins.length);
        });
        setLoadingMore(false);
      }, 300);
    }
  }, [loadingMore, hasMore, coins.length]);

  const filteredCoins = useMemo(() => {
    // If showOnlyWalletTokens is true and we have wallet tokens, only show those
    if (showOnlyWalletTokens && walletTokens && walletTokens.length > 0) {
      // Convert wallet tokens to CoinGeckoToken format
      let walletCoinsFormatted: CoinGeckoToken[] = walletTokens
        .filter(t => t.hasBalance)
        .map(t => ({
          id: t.id,
          symbol: t.symbol,
          name: t.name,
          image: t.logoUrl || '',
          current_price: t.price,
          market_cap: 0,
          market_cap_rank: 0,
          price_change_percentage_24h: 0,
          total_volume: 0,
          amount: t.balance,
          value: t.balance * t.price,
          mint: t.mint,
        }));

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        walletCoinsFormatted = walletCoinsFormatted.filter(coin =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
        );
      }

      console.log(`[Search] Wallet tokens only mode: ${walletCoinsFormatted.length} tokens`);
      return walletCoinsFormatted;
    }

    // Combine featured tokens with regular coins
    let allCoins = [...featuredTokensData, ...coins];

    // Remove duplicates by coin.id (keep first occurrence - featured tokens first)
    const seenIds = new Set<string>();
    allCoins = allCoins.filter(coin => {
      if (seenIds.has(coin.id)) {
        return false;
      }
      seenIds.add(coin.id);
      return true;
    });

    // Apply blockchain filter
    if (blockchainFilter !== 'all') {
      allCoins = allCoins.filter(coin => {
        const blockchains = detectBlockchain(coin);
        return blockchains.includes(blockchainFilter);
      });
    }

    // If we have wallet tokens, prioritize them at the top
    if (walletTokens && walletTokens.length > 0) {
      const walletSymbols = new Set(walletTokens.filter(t => t.hasBalance).map(t => t.symbol.toUpperCase()));
      const walletIds = new Set(walletTokens.filter(t => t.hasBalance).map(t => t.id));

      // Split into wallet tokens and other tokens
      const inWallet: CoinGeckoToken[] = [];
      const notInWallet: CoinGeckoToken[] = [];

      allCoins.forEach(coin => {
        const coinSymbolUpper = coin.symbol.toUpperCase();
        if (walletSymbols.has(coinSymbolUpper) || walletIds.has(coin.id)) {
          // Find matching wallet token to get balance info
          const walletToken = walletTokens.find(
            t => t.symbol.toUpperCase() === coinSymbolUpper || t.id === coin.id
          );
          if (walletToken && walletToken.hasBalance) {
            inWallet.push({
              ...coin,
              amount: walletToken.balance,
              value: walletToken.balance * (coin.current_price || walletToken.price),
            });
          } else {
            notInWallet.push(coin);
          }
        } else {
          notInWallet.push(coin);
        }
      });

      // Sort wallet tokens by value (highest first)
      inWallet.sort((a, b) => (b.value || 0) - (a.value || 0));

      // Combine: wallet tokens first, then other tokens
      allCoins = [...inWallet, ...notInWallet];
    }

    // Apply search filter - if searching, show all results (no pagination limit)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      // First filter from loaded coins
      const localFiltered = allCoins.filter(coin =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
      );

      // Merge with API search results (if any)
      if (searchResults.length > 0) {
        const existingIds = new Set(localFiltered.map(c => c.id));
        const newFromSearch = searchResults.filter(c => !existingIds.has(c.id));

        // Combine: local results first (they have prices), then API search results
        const combined = [...localFiltered, ...newFromSearch];
        console.log(`[Search] Query: "${searchQuery}", Local: ${localFiltered.length}, API: ${newFromSearch.length}, Total: ${combined.length}`);
        return combined;
      }

      console.log(`[Search] Query: "${searchQuery}", Filtered: ${localFiltered.length} results`);
      return localFiltered;
    }

    // No search query - apply pagination (limit to displayCount)
    // First 1000 tokens load automatically, then user can load more
    const paginatedCoins = allCoins.slice(0, displayCount);
    console.log(`[Search] Showing ${paginatedCoins.length} of ${allCoins.length} tokens (displayCount: ${displayCount})`);
    return paginatedCoins;
  }, [coins, searchQuery, featuredTokensData, blockchainFilter, walletTokens, showOnlyWalletTokens, searchResults, displayCount]);

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
    <div className="search-page max-w-md mx-auto bg-black pb-24 overflow-x-hidden relative">
      {/* Cosmic background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
        style={{
          backgroundImage: `url(${cosmicBg})`,
          filter: 'blur(1px)'
        }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
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
            <h1 className="text-white font-semibold">{onSelectToken ? 'Select Token' : 'Search Tokens'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {showOnlyWalletTokens
                ? `${walletTokens?.filter(t => t.hasBalance).length || 0} tokens in wallet`
                : `${coins.length.toLocaleString()} available`
              }
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

        {/* Blockchain Filter Chips - Only show when NOT in wallet-only mode */}
        {!showOnlyWalletTokens && (
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
              onClick={() => setBlockchainFilter('stocks')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                blockchainFilter === 'stocks'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📈 Stocks
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
        )}

        {/* Quick stats */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 text-center"
          >
            {isSearching ? (
              <span className="text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Searching all tokens...
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Found <span className="text-purple-400 font-semibold">{filteredCoins.length}</span> {filteredCoins.length === 1 ? 'result' : 'results'}
                {searchResults.length > 0 && <span className="text-slate-500"> (including API search)</span>}
              </span>
            )}
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
            key="no-results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 px-4 relative z-20"
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
                {(() => {
                  // Split tokens into those with balance and without
                  const tokensWithBalance = filteredCoins.filter((c: CoinGeckoToken) => c.amount && c.amount > 0);
                  const tokensWithoutBalance = filteredCoins.filter((c: CoinGeckoToken) => !c.amount || c.amount <= 0);

                  // If showOnlyWalletTokens, we only have wallet tokens
                  if (showOnlyWalletTokens) {
                    return filteredCoins.map((coin: CoinGeckoToken) => (
                      <CoinItem
                        key={coin.id}
                        coin={coin}
                        onSelectToken={onSelectToken}
                        isAdded={addedCoins.has(coin.id)}
                        isAdding={addingCoin === coin.id}
                        onAdd={handleAddCoin}
                        onRemove={handleRemoveCoin}
                        onClick={handleTokenClick}
                        showComingSoon={!!onSelectToken && !isSolanaToken(coin)}
                      />
                    ));
                  }

                  // If we have tokens with balance, show them in a separate section
                  if (tokensWithBalance.length > 0 && !searchQuery) {
                    return (
                      <>
                        {/* Your Tokens Section */}
                        <div className="mb-2">
                          <div className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-2 px-1">
                            Your Tokens ({tokensWithBalance.length})
                          </div>
                          {tokensWithBalance.map((coin: CoinGeckoToken) => (
                            <CoinItem
                              key={coin.id}
                              coin={coin}
                              onSelectToken={onSelectToken}
                              isAdded={addedCoins.has(coin.id)}
                              isAdding={addingCoin === coin.id}
                              onAdd={handleAddCoin}
                              onRemove={handleRemoveCoin}
                              onClick={handleTokenClick}
                              showComingSoon={!!onSelectToken && !isSolanaToken(coin)}
                            />
                          ))}
                        </div>

                        {/* All Tokens Section */}
                        {tokensWithoutBalance.length > 0 && (
                          <div className="mt-4">
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2 px-1">
                              All Tokens
                            </div>
                            {tokensWithoutBalance.map((coin: CoinGeckoToken) => (
                              <CoinItem
                                key={coin.id}
                                coin={coin}
                                onSelectToken={onSelectToken}
                                isAdded={addedCoins.has(coin.id)}
                                isAdding={addingCoin === coin.id}
                                onAdd={handleAddCoin}
                                onRemove={handleRemoveCoin}
                                onClick={handleTokenClick}
                                showComingSoon={!!onSelectToken && !isSolanaToken(coin)}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    );
                  }

                  // Default: show all tokens without sections
                  return filteredCoins.map((coin: CoinGeckoToken) => (
                    <CoinItem
                      key={coin.id}
                      coin={coin}
                      onSelectToken={onSelectToken}
                      isAdded={addedCoins.has(coin.id)}
                      isAdding={addingCoin === coin.id}
                      onAdd={handleAddCoin}
                      onRemove={handleRemoveCoin}
                      onClick={handleTokenClick}
                      showComingSoon={!!onSelectToken && !isSolanaToken(coin)}
                    />
                  ));
                })()}
              </AnimatePresence>
            </motion.div>

            {/* Load More Button */}
            {!searchQuery && hasMore && !showOnlyWalletTokens && (
              <motion.div
                className="mt-6 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs text-slate-500">
                  Showing {displayCount.toLocaleString()} of {coins.length.toLocaleString()} tokens
                </p>
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    `Load More Tokens (+${Math.min(LOAD_MORE_COUNT, coins.length - displayCount).toLocaleString()})`
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