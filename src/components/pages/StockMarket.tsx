import { useState, useEffect, useRef } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';
import { STOCK_TOKENS, INDEX_ETFS, STOCKS_ONLY, type StockToken } from '../../utils/stockTokens';
import type { Token } from './Home';

interface StockMarketProps {
  walletId: string;
  onViewStock: (token: Token) => void;
}

interface StockPrice {
  price: number;
  change24h: number;
}

export function StockMarket({ walletId, onViewStock }: StockMarketProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [prices, setPrices] = useState<Map<string, StockPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchAllPrices();

    // Auto-refresh every 30 seconds
    refreshTimerRef.current = setInterval(() => {
      fetchAllPrices(true);
    }, 30000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  const fetchAllPrices = async (background = false) => {
    try {
      if (!background) setLoading(true);
      else setRefreshing(true);

      const newPrices = new Map<string, StockPrice>();

      // Fetch prices from DexScreener in parallel (batch by groups to avoid rate limits)
      const batchSize = 10;
      for (let i = 0; i < STOCK_TOKENS.length; i += batchSize) {
        const batch = STOCK_TOKENS.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(token => fetchTokenPrice(token.mint))
        );

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value) {
            newPrices.set(batch[idx].mint, result.value);
          }
        });
      }

      setPrices(newPrices);
    } catch (error) {
      console.error('[StockMarket] Error fetching prices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTokenPrice = async (mint: string): Promise<StockPrice | null> => {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const pairs = data.pairs;
      if (!pairs || pairs.length === 0) return null;

      // Filter to pairs with minimum liquidity to avoid distorted prices
      const validPairs = pairs.filter((p: any) => (p.liquidity?.usd || 0) >= 500);
      if (validPairs.length === 0) return null;

      // Pick the pair with highest liquidity
      const bestPair = validPairs.reduce((best: any, p: any) => {
        const liq = p.liquidity?.usd || 0;
        const bestLiq = best?.liquidity?.usd || 0;
        return liq > bestLiq ? p : best;
      }, validPairs[0]);

      const price = parseFloat(bestPair.priceUsd) || 0;
      const change24h = bestPair.priceChange?.h24 || 0;

      return { price, change24h };
    } catch {
      return null;
    }
  };

  const formatStockPrice = (price: number): string => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const handleStockTap = (stock: StockToken) => {
    const priceData = prices.get(stock.mint);
    const token: Token = {
      id: 0,
      mint: stock.mint,
      name: stock.name,
      symbol: stock.symbol,
      amount: 0,
      value: 0,
      price: priceData?.price || 0,
      change: priceData?.change24h || 0,
      logo: stock.stockSymbol.charAt(0),
      logoUrl: stock.logo,
      color: 'from-purple-500 to-purple-600',
      network: 'solana',
    };
    onViewStock(token);
  };

  const handleLogoError = (mint: string) => {
    setLogoErrors(prev => new Set(prev).add(mint));
  };

  const renderStockLogo = (stock: StockToken, size: 'sm' | 'md') => {
    const dims = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    const badgeDims = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const iconDims = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

    const badge = (
      <div className={`absolute bottom-0 right-0 translate-x-1 translate-y-1 z-10 bg-green-600 rounded-full ${badgeDims} flex items-center justify-center border-2 border-black shadow-md`}>
        <TrendingUp className={`${iconDims} text-white stroke-[2.5]`} />
      </div>
    );

    if (logoErrors.has(stock.mint)) {
      return (
        <div className="relative flex-shrink-0">
          <div className={`${dims} rounded-full bg-slate-800 flex items-center justify-center`}>
            <span className="text-xs font-bold text-white">{stock.stockSymbol.slice(0, 2)}</span>
          </div>
          {badge}
        </div>
      );
    }

    return (
      <div className="relative flex-shrink-0">
        <img
          src={stock.logo}
          alt={stock.companyName}
          className={`${dims} rounded-full object-cover bg-white`}
          onError={() => handleLogoError(stock.mint)}
        />
        {badge}
      </div>
    );
  };

  // Loading state - matches Home page loading pattern
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: colors.primary }} />
          <p className="text-slate-400">Loading stock prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 pt-6">
        {/* Header - matches Home page header style */}
        <motion.div
          className="flex items-center justify-between mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">{t.nav.stocks}</h1>
          <button
            onClick={() => fetchAllPrices()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Powered by badge */}
        <motion.div
          className="flex items-center gap-2 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-xs text-slate-500">Tokenized stocks by</span>
          <span className="text-xs font-semibold" style={{ color: colors.accent }}>Backed Finance</span>
        </motion.div>

        {/* Index ETFs - Horizontal Cards */}
        <motion.div
          className="flex gap-2.5 mb-6 overflow-x-auto no-scrollbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {INDEX_ETFS.map((etf) => {
            const priceData = prices.get(etf.mint);
            const change = priceData?.change24h || 0;
            const isPositive = change >= 0;

            return (
              <button
                key={etf.mint}
                onClick={() => handleStockTap(etf)}
                className="flex-1 min-w-[105px] p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 hover:bg-slate-900/80 transition-all active:scale-[0.97]"
              >
                <div className="flex items-center gap-2 mb-2">
                  {renderStockLogo(etf, 'sm')}
                  <span className="text-xs font-semibold text-white truncate">{etf.companyName}</span>
                </div>
                <p className="text-white font-semibold text-sm text-left">
                  {priceData ? formatStockPrice(priceData.price) : '—'}
                </p>
                <p className={`text-xs font-medium text-left ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {priceData ? formatChange(change) : '—'}
                </p>
              </button>
            );
          })}
        </motion.div>

        {/* Stocks Section - matches Home token list style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Tokenized Stocks</h2>

          <div className="space-y-2">
            {STOCKS_ONLY.map((stock, idx) => {
              const priceData = prices.get(stock.mint);
              const change = priceData?.change24h || 0;
              const isPositive = change >= 0;

              return (
                <motion.button
                  key={stock.mint}
                  onClick={() => handleStockTap(stock)}
                  className="w-full p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * idx }}
                >
                  <div className="flex items-center gap-3">
                    {renderStockLogo(stock, 'md')}
                    <div className="text-left">
                      <h4 className="text-white font-semibold">{stock.companyName}</h4>
                      <p className="text-slate-400 text-sm">{stock.stockSymbol}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {priceData ? formatStockPrice(priceData.price) : '—'}
                    </p>
                    <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {priceData ? formatChange(change) : '—'}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-600 mt-6 mb-2 px-4">
          xStock tokens are backed 1:1 by real shares held in custody by Backed Finance. Trade via Jupiter swap.
        </p>
      </div>
    </div>
  );
}
