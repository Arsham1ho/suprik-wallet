/**
 * Jupiter Token Service
 * Fetches and caches all Solana tokens from Jupiter's token list API
 * This provides 1000+ verified Solana tokens with logos
 */

export interface JupiterToken {
  address: string;      // Mint address
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
  };
}

// In-memory cache
let jupiterTokensCache: JupiterToken[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const LOCAL_STORAGE_KEY = 'jupiter_tokens_cache';
const LOCAL_STORAGE_TIME_KEY = 'jupiter_tokens_cache_time';

/**
 * Get all Jupiter tokens (from cache or API)
 */
export async function getJupiterTokens(): Promise<JupiterToken[]> {
  const now = Date.now();

  // Return memory cache if valid
  if (jupiterTokensCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return jupiterTokensCache;
  }

  // Try localStorage cache
  try {
    const cachedTime = localStorage.getItem(LOCAL_STORAGE_TIME_KEY);
    const cachedTokens = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (cachedTime && cachedTokens) {
      const cacheAge = now - parseInt(cachedTime, 10);
      if (cacheAge < CACHE_DURATION) {
        jupiterTokensCache = JSON.parse(cachedTokens);
        lastFetchTime = parseInt(cachedTime, 10);
        console.log(`[Jupiter] Loaded ${jupiterTokensCache.length} tokens from localStorage cache`);
        return jupiterTokensCache;
      }
    }
  } catch (e) {
    console.warn('[Jupiter] Failed to read localStorage cache:', e);
  }

  // Fetch from API
  try {
    console.log('[Jupiter] Fetching tokens from API...');

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // First try strict list (verified tokens only)
    const strictResponse = await fetch('https://token.jup.ag/strict', {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (strictResponse.ok) {
      const strictTokens: JupiterToken[] = await strictResponse.json();
      console.log(`[Jupiter] Fetched ${strictTokens.length} strict (verified) tokens`);

      // Also try to get more tokens from the 'all' endpoint (with separate timeout)
      try {
        const allController = new AbortController();
        const allTimeoutId = setTimeout(() => allController.abort(), 20000); // 20 second timeout for larger list

        const allResponse = await fetch('https://token.jup.ag/all', {
          headers: { 'Accept': 'application/json' },
          signal: allController.signal,
        });

        clearTimeout(allTimeoutId);

        if (allResponse.ok) {
          const allTokens: JupiterToken[] = await allResponse.json();
          console.log(`[Jupiter] Fetched ${allTokens.length} total tokens`);

          // Merge: strict tokens first (they're verified), then add others
          const strictAddresses = new Set(strictTokens.map(t => t.address));
          const additionalTokens = allTokens.filter(t => !strictAddresses.has(t.address));

          // Take top tokens from additional (by having logo)
          const additionalWithLogos = additionalTokens.filter(t => t.logoURI).slice(0, 2000);

          jupiterTokensCache = [...strictTokens, ...additionalWithLogos];
        } else {
          jupiterTokensCache = strictTokens;
        }
      } catch (e) {
        console.warn('[Jupiter] Failed to fetch all tokens, using strict only:', e);
        jupiterTokensCache = strictTokens;
      }
    } else {
      throw new Error(`HTTP ${strictResponse.status}`);
    }

    lastFetchTime = now;

    // Save to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jupiterTokensCache));
      localStorage.setItem(LOCAL_STORAGE_TIME_KEY, now.toString());
    } catch (e) {
      console.warn('[Jupiter] Failed to save to localStorage:', e);
    }

    console.log(`[Jupiter] Total tokens cached: ${jupiterTokensCache.length}`);
    return jupiterTokensCache;

  } catch (error) {
    console.error('[Jupiter] Failed to fetch tokens:', error);

    // Return whatever we have in cache
    if (jupiterTokensCache.length > 0) {
      return jupiterTokensCache;
    }

    // Try localStorage one more time
    try {
      const cachedTokens = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cachedTokens) {
        jupiterTokensCache = JSON.parse(cachedTokens);
        return jupiterTokensCache;
      }
    } catch (e) {
      // Ignore
    }

    return [];
  }
}

/**
 * Search Jupiter tokens by name or symbol
 */
export function searchJupiterTokens(query: string, tokens: JupiterToken[]): JupiterToken[] {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

  return tokens.filter(token =>
    token.symbol.toLowerCase().includes(lowerQuery) ||
    token.name.toLowerCase().includes(lowerQuery) ||
    token.address.toLowerCase() === lowerQuery
  ).slice(0, 100); // Limit results
}

/**
 * Get a single token by mint address
 */
export function getJupiterTokenByMint(mint: string, tokens: JupiterToken[]): JupiterToken | undefined {
  return tokens.find(t => t.address === mint);
}

/**
 * Get a single token by symbol
 */
export function getJupiterTokenBySymbol(symbol: string, tokens: JupiterToken[]): JupiterToken | undefined {
  const upperSymbol = symbol.toUpperCase();
  return tokens.find(t => t.symbol.toUpperCase() === upperSymbol);
}

/**
 * Convert Jupiter token to CoinGeckoToken format (for Search page compatibility)
 */
export function jupiterToCoinGeckoFormat(token: JupiterToken, index: number): {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  mint: string;
} {
  return {
    id: token.extensions?.coingeckoId || token.address,
    symbol: token.symbol.toUpperCase(),
    name: token.name,
    image: token.logoURI || '',
    current_price: 0, // Will be fetched separately
    market_cap: 0,
    market_cap_rank: index + 1,
    price_change_percentage_24h: 0,
    total_volume: 0,
    mint: token.address,
  };
}

/**
 * Preload tokens in background (call this early in app lifecycle)
 */
export function preloadJupiterTokens(): void {
  getJupiterTokens().catch(err => {
    console.warn('[Jupiter] Background preload failed:', err);
  });
}
