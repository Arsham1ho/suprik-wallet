/**
 * CoinGecko API Utilities - Client-Side Price & Chart Data
 *
 * This module provides comprehensive CoinGecko integration for:
 * - Token price fetching with 24h change
 * - Historical chart data
 * - Dynamic token ID lookup via search
 *
 * Free tier limits: 10-30 calls/minute
 */

// Cache for CoinGecko ID lookups (persists across sessions)
const COINGECKO_ID_CACHE_KEY = 'suprik_coingecko_ids';
const COINGECKO_PRICE_CACHE_KEY = 'suprik_coingecko_prices';
const CACHE_DURATION_IDS = 24 * 60 * 60 * 1000; // 24 hours for IDs
const CACHE_DURATION_PRICES = 5 * 60 * 1000; // 5 minutes for prices (to avoid rate limiting)

// Known CoinGecko IDs for popular Solana tokens (instant lookup)
export const KNOWN_COINGECKO_IDS: Record<string, string> = {
  // Native coins
  'So11111111111111111111111111111111111111112': 'solana',
  'solana': 'solana',

  // Stablecoins
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',

  // Popular Solana tokens
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'dogwifhat',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'jupiter-exchange-solana',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'raydium',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'msol',
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'orca',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ethereum-wormhole',
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux': 'helium',
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'pyth-network',
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 'popcat',
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': 'render-token',
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': 'jito-governance-token',
  'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y': 'genesysgo-shadow',
  'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1': 'saber',
  'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT': 'step-finance',
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': 'serum',
  'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6': 'kin',
  'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': 'gst',
  'GMT111111111111111111111111111111111111111': 'stepn',

  // Parabolic AI - special token
  'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': 'parabolic-ai',
};

// Symbol to CoinGecko ID mapping (comprehensive list for all chains)
export const SYMBOL_TO_COINGECKO: Record<string, string> = {
  // === SOLANA TOKENS ===
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BONK': 'bonk',
  'WIF': 'dogwifhat',
  'JUP': 'jupiter-exchange-solana',
  'RAY': 'raydium',
  'MSOL': 'msol',
  'ORCA': 'orca',
  'WETH': 'ethereum-wormhole',
  'HNT': 'helium',
  'PYTH': 'pyth-network',
  'POPCAT': 'popcat',
  'RNDR': 'render-token',
  'RENDER': 'render-token',
  'JTO': 'jito-governance-token',
  'JITOSOL': 'jito-staked-sol',
  'SHDW': 'genesysgo-shadow',
  'SBR': 'saber',
  'STEP': 'step-finance',
  'SRM': 'serum',
  'KIN': 'kin',
  'GST': 'gst',
  'GMT': 'stepn',
  'PAI': 'parabolic-ai',
  'PARAI': 'parabolic-ai',
  'W': 'wormhole',
  'MEW': 'cat-in-a-dogs-world',
  'BOME': 'book-of-meme',
  'TRUMP': 'official-trump',
  'FARTCOIN': 'fartcoin',
  'AI16Z': 'ai16z',
  'PENGU': 'pudgy-penguins',
  'PNUT': 'peanut-the-squirrel',
  'GOAT': 'goatseus-maximus',
  'GIGA': 'gigachad-2',
  'MOODENG': 'moo-deng',
  'CHILLGUY': 'just-a-chill-guy',
  'SPX': 'spx6900',
  'GRASS': 'grass',
  'BRETT': 'brett',

  // === MAJOR CRYPTOCURRENCIES ===
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'POL': 'matic-network',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'TRX': 'tron',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'ICP': 'internet-computer',
  'APT': 'aptos',
  'FIL': 'filecoin',
  'ETC': 'ethereum-classic',
  'VET': 'vechain',
  'HBAR': 'hedera-hashgraph',
  'INJ': 'injective-protocol',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'FTM': 'fantom',
  'MKR': 'maker',
  'AAVE': 'aave',
  'GRT': 'the-graph',
  'SNX': 'havven',
  'CRV': 'curve-dao-token',
  'LDO': 'lido-dao',
  'RPL': 'rocket-pool',
  'COMP': 'compound-governance-token',
  'ENS': 'ethereum-name-service',
  'QNT': 'quant-network',
  'ALGO': 'algorand',
  'XLM': 'stellar',
  'XMR': 'monero',
  'EGLD': 'elrond-erd-2',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'GALA': 'gala',
  'ENJ': 'enjincoin',
  'IMX': 'immutable-x',
  'FLOW': 'flow',
  'THETA': 'theta-token',
  'FTT': 'ftx-token',
  'LEO': 'leo-token',
  'OKB': 'okb',
  'KCS': 'kucoin-shares',
  'CRO': 'crypto-com-chain',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'BABYDOGE': 'baby-doge-coin',
  'WBTC': 'wrapped-bitcoin',
  'STETH': 'staked-ether',
  'RETH': 'rocket-pool-eth',
  'CBETH': 'coinbase-wrapped-staked-eth',

  // === DEFI TOKENS ===
  'SUSHI': 'sushi',
  'YFI': 'yearn-finance',
  'BAL': 'balancer',
  '1INCH': '1inch',
  'DYDX': 'dydx',
  'GMX': 'gmx',
  'CAKE': 'pancakeswap-token',
  'SPELL': 'spell-token',
  'CVX': 'convex-finance',
  'FXS': 'frax-share',
  'FRAX': 'frax',
  'LUSD': 'liquity-usd',

  // === AI TOKENS ===
  'FET': 'fetch-ai',
  'AGIX': 'singularitynet',
  'OCEAN': 'ocean-protocol',
  'TAO': 'bittensor',
  'OLAS': 'autonolas',
  'AKT': 'akash-network',

  // === GAMING TOKENS ===
  'ILV': 'illuvium',
  'PRIME': 'echelon-prime',
  'MAGIC': 'magic',
  'RON': 'ronin',
  'GODS': 'gods-unchained',
  'VOXEL': 'voxies',
};

interface CachedIds {
  data: Record<string, string>;
  timestamp: number;
}

interface CachedPrices {
  data: Record<string, { price: number; change24h: number; marketCap: number }>;
  timestamp: number;
}

// Load cached IDs from localStorage
function loadCachedIds(): Record<string, string> {
  try {
    const cached = localStorage.getItem(COINGECKO_ID_CACHE_KEY);
    if (cached) {
      const parsed: CachedIds = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_IDS) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('[CoinGecko] Error loading cached IDs:', e);
  }
  return {};
}

// Save IDs to cache
function saveCachedIds(ids: Record<string, string>): void {
  try {
    const cacheData: CachedIds = {
      data: ids,
      timestamp: Date.now(),
    };
    localStorage.setItem(COINGECKO_ID_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('[CoinGecko] Error saving cached IDs:', e);
  }
}

// Load cached prices from localStorage
function loadCachedPrices(): Record<string, { price: number; change24h: number; marketCap: number }> | null {
  try {
    const cached = localStorage.getItem(COINGECKO_PRICE_CACHE_KEY);
    if (cached) {
      const parsed: CachedPrices = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_PRICES) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('[CoinGecko] Error loading cached prices:', e);
  }
  return null;
}

// Save prices to cache
function saveCachedPrices(prices: Record<string, { price: number; change24h: number; marketCap: number }>): void {
  try {
    const cacheData: CachedPrices = {
      data: prices,
      timestamp: Date.now(),
    };
    localStorage.setItem(COINGECKO_PRICE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('[CoinGecko] Error saving cached prices:', e);
  }
}

// Common CoinGecko IDs that can be passed directly (for non-Solana tokens)
const DIRECT_COINGECKO_IDS = new Set([
  'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 'dogecoin', 'solana',
  'polkadot', 'polygon', 'matic-network', 'chainlink', 'uniswap', 'avalanche-2',
  'litecoin', 'bitcoin-cash', 'stellar', 'monero', 'cosmos', 'near', 'aptos', 'sui',
  'internet-computer', 'filecoin', 'hedera-hashgraph', 'arbitrum', 'optimism',
  'fantom', 'algorand', 'vechain', 'flow', 'tezos', 'theta-token', 'eos',
  'the-sandbox', 'decentraland', 'axie-infinity', 'enjincoin', 'gala', 'immutable-x',
  'aave', 'maker', 'the-graph', 'lido-dao', 'usd-coin', 'tether', 'dai',
  'shiba-inu', 'pepe', 'floki', 'wrapped-bitcoin', 'staked-ether',
  'fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor', 'akash-network',
  'kaspa', 'mantle', 'elrond-erd-2', 'zilliqa', 'harmony', 'moonbeam', 'astar',
  'crypto-com-chain', 'kucoin-shares', 'okb', 'bitget-token',
  'frax', 'frax-share', 'liquity-usd', 'liquity', 'trueusd', 'paypal-usd',
  'worldcoin-wld', 'arkham', 'render-token', 'injective-protocol', 'sei-network',
  'celestia', 'starknet', 'tron',
]);

/**
 * Get CoinGecko ID for a token
 * First checks known IDs, then cached IDs, then searches CoinGecko API
 */
export async function getCoinGeckoId(mintOrSymbol: string, tokenName?: string): Promise<string | null> {
  const key = mintOrSymbol.toUpperCase();
  const lowerKey = mintOrSymbol.toLowerCase();

  // 0. Check if the input IS already a valid CoinGecko ID (for non-Solana tokens like ethereum, bitcoin)
  if (DIRECT_COINGECKO_IDS.has(lowerKey)) {
    console.log(`[CoinGecko] Direct ID match: ${lowerKey}`);
    return lowerKey;
  }

  // 1. Check known IDs by mint address
  if (KNOWN_COINGECKO_IDS[mintOrSymbol]) {
    return KNOWN_COINGECKO_IDS[mintOrSymbol];
  }

  // 2. Check known IDs by symbol
  if (SYMBOL_TO_COINGECKO[key]) {
    return SYMBOL_TO_COINGECKO[key];
  }

  // 3. Check cached IDs
  const cachedIds = loadCachedIds();
  if (cachedIds[mintOrSymbol]) {
    return cachedIds[mintOrSymbol];
  }
  if (cachedIds[key]) {
    return cachedIds[key];
  }

  // 4. Search CoinGecko API (rate limited)
  try {
    console.log(`[CoinGecko] Searching for token: ${mintOrSymbol}`);

    // Use the search endpoint
    const searchQuery = tokenName || mintOrSymbol;
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();

      // Find best match from coins
      if (data.coins && data.coins.length > 0) {
        // Try to find exact symbol match first
        const exactMatch = data.coins.find((coin: any) =>
          coin.symbol.toUpperCase() === key
        );

        if (exactMatch) {
          console.log(`[CoinGecko] Found exact match: ${exactMatch.id}`);
          // Cache the result
          cachedIds[mintOrSymbol] = exactMatch.id;
          cachedIds[key] = exactMatch.id;
          saveCachedIds(cachedIds);
          return exactMatch.id;
        }

        // Otherwise use first result
        const firstMatch = data.coins[0];
        console.log(`[CoinGecko] Using first result: ${firstMatch.id}`);
        cachedIds[mintOrSymbol] = firstMatch.id;
        saveCachedIds(cachedIds);
        return firstMatch.id;
      }
    }
  } catch (error) {
    console.warn(`[CoinGecko] Search failed for ${mintOrSymbol}:`, error);
  }

  return null;
}

/**
 * Fetch price data from CoinGecko for a single token
 * Uses cache first to avoid rate limiting
 */
export async function fetchCoinGeckoPrice(
  coinGeckoId: string
): Promise<{ price: number; change24h: number; marketCap: number } | null> {
  // Check cache first
  const cachedPrices = loadCachedPrices();
  if (cachedPrices && cachedPrices[coinGeckoId]) {
    console.log(`[CoinGecko] Using cached price for ${coinGeckoId}`);
    return cachedPrices[coinGeckoId];
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();
      const tokenData = data[coinGeckoId];

      if (tokenData) {
        const priceData = {
          price: tokenData.usd || 0,
          change24h: tokenData.usd_24h_change || 0,
          marketCap: tokenData.usd_market_cap || 0,
        };

        // Cache the result
        saveCachedPrices({ ...cachedPrices, [coinGeckoId]: priceData });

        return priceData;
      }
    } else if (response.status === 429) {
      console.warn(`[CoinGecko] Rate limited (429) for ${coinGeckoId}`);
      // Return stale cache if available
      if (cachedPrices && cachedPrices[coinGeckoId]) {
        return cachedPrices[coinGeckoId];
      }
    }
  } catch (error) {
    console.warn(`[CoinGecko] Price fetch failed for ${coinGeckoId}:`, error);
    // Return stale cache on error
    if (cachedPrices && cachedPrices[coinGeckoId]) {
      return cachedPrices[coinGeckoId];
    }
  }

  return null;
}

/**
 * Fetch prices for multiple tokens at once (more efficient)
 * CoinGecko allows up to 250 IDs per request
 */
export async function fetchCoinGeckoPrices(
  coinGeckoIds: string[]
): Promise<Record<string, { price: number; change24h: number; marketCap: number }>> {
  // Check cache first
  const cachedPrices = loadCachedPrices();
  if (cachedPrices) {
    // Check if all requested IDs are in cache
    const allCached = coinGeckoIds.every(id => cachedPrices[id]);
    if (allCached) {
      console.log('[CoinGecko] Using cached prices');
      return cachedPrices;
    }
  }

  const result: Record<string, { price: number; change24h: number; marketCap: number }> = {};

  if (coinGeckoIds.length === 0) {
    return result;
  }

  try {
    // Join all IDs (CoinGecko allows comma-separated list)
    const idsParam = coinGeckoIds.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

    console.log(`[CoinGecko] Fetching prices for ${coinGeckoIds.length} tokens`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();

      for (const id of coinGeckoIds) {
        const tokenData = data[id];
        if (tokenData) {
          result[id] = {
            price: tokenData.usd || 0,
            change24h: tokenData.usd_24h_change || 0,
            marketCap: tokenData.usd_market_cap || 0,
          };
        }
      }

      console.log(`[CoinGecko] ✅ Got prices for ${Object.keys(result).length} tokens`);

      // Cache the results
      saveCachedPrices({ ...cachedPrices, ...result });
    } else {
      console.warn(`[CoinGecko] Price API returned ${response.status}`);
    }
  } catch (error) {
    console.warn('[CoinGecko] Batch price fetch failed:', error);
  }

  return result;
}

/**
 * Fetch historical chart data from CoinGecko
 */
export async function fetchCoinGeckoChart(
  coinGeckoId: string,
  days: number
): Promise<Array<{ time: string; price: number }>> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}`;

    console.log(`[CoinGecko] Fetching chart for ${coinGeckoId}, days=${days}`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();

      if (data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
        // Sample to ~50 points for smooth chart
        const prices = data.prices;
        const step = Math.max(1, Math.floor(prices.length / 50));

        const chartData = prices
          .filter((_: [number, number], i: number) => i % step === 0)
          .map((item: [number, number]) => ({
            time: new Date(item[0]).toISOString(),
            price: item[1],
          }));

        console.log(`[CoinGecko] ✅ Chart: ${chartData.length} points`);
        return chartData;
      }
    } else {
      console.warn(`[CoinGecko] Chart API returned ${response.status}`);
    }
  } catch (error) {
    console.warn(`[CoinGecko] Chart fetch failed for ${coinGeckoId}:`, error);
  }

  return [];
}

/**
 * Get token price with automatic CoinGecko ID lookup
 * This is the main function to use for getting a token's price
 */
export async function getTokenPrice(
  mintOrSymbol: string,
  tokenName?: string
): Promise<{ price: number; change24h: number; marketCap: number } | null> {
  // First, get the CoinGecko ID
  const coinGeckoId = await getCoinGeckoId(mintOrSymbol, tokenName);

  if (!coinGeckoId) {
    console.log(`[CoinGecko] No ID found for ${mintOrSymbol}`);
    return null;
  }

  // Then fetch the price
  return fetchCoinGeckoPrice(coinGeckoId);
}

/**
 * Get chart data with automatic CoinGecko ID lookup
 */
export async function getTokenChart(
  mintOrSymbol: string,
  days: number,
  tokenName?: string
): Promise<Array<{ time: string; price: number }>> {
  // First, get the CoinGecko ID
  const coinGeckoId = await getCoinGeckoId(mintOrSymbol, tokenName);

  if (!coinGeckoId) {
    console.log(`[CoinGecko] No ID found for ${mintOrSymbol}`);
    return [];
  }

  // Then fetch the chart
  return fetchCoinGeckoChart(coinGeckoId, days);
}

// Cache for top tokens list
const TOP_TOKENS_CACHE_KEY = 'suprik_coingecko_top_tokens';
const TOP_TOKENS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface CoinGeckoMarketToken {
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

/**
 * Fetch top tokens by market cap from CoinGecko
 * This provides multi-chain coverage for the Search page
 */
export async function fetchTopTokens(
  page: number = 1,
  perPage: number = 250
): Promise<CoinGeckoMarketToken[]> {
  // Check cache first
  try {
    const cached = localStorage.getItem(TOP_TOKENS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < TOP_TOKENS_CACHE_DURATION && page === 1) {
        console.log(`[CoinGecko] Using cached top tokens (${parsed.data.length} tokens)`);
        return parsed.data;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`;

    console.log(`[CoinGecko] Fetching top tokens (page ${page}, ${perPage} per page)...`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data: CoinGeckoMarketToken[] = await response.json();
      console.log(`[CoinGecko] ✅ Fetched ${data.length} top tokens`);

      // Cache page 1 results
      if (page === 1) {
        try {
          localStorage.setItem(TOP_TOKENS_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        } catch (e) {
          // Ignore storage errors
        }
      }

      return data;
    } else {
      console.warn(`[CoinGecko] Top tokens API returned ${response.status}`);
    }
  } catch (error) {
    console.warn('[CoinGecko] Failed to fetch top tokens:', error);
  }

  // Return cached data as fallback
  try {
    const cached = localStorage.getItem(TOP_TOKENS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.data || [];
    }
  } catch (e) {
    // Ignore
  }

  return [];
}

/**
 * Preload top tokens in background
 */
export function preloadTopTokens(): void {
  fetchTopTokens(1, 250).catch(err => {
    console.warn('[CoinGecko] Background preload failed:', err);
  });
}
