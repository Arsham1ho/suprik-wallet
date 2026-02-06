/**
 * Blockchain Module - Client-Side RPC (Phantom-like architecture)
 *
 * This module now uses DIRECT RPC calls instead of server proxies.
 * All blockchain data is fetched client-side, just like Phantom wallet.
 *
 * Changes from previous version:
 * - Removed Supabase proxy for Solana balance
 * - Direct calls to Helius RPC / Solana public RPC
 * - Token detection via Helius DAS API
 * - Prices via Jupiter Price API
 */

import { fetchSolanaBalanceClient } from './blockchainClient';

// Keep Supabase imports for non-Solana functions (will be migrated later)
import { projectId, publicAnonKey } from './supabase/info';

// Re-export for backward compatibility
export type NetworkMode = 'mainnet' | 'testnet' | 'devnet';

export interface ChainBalance {
  native: number;
  tokens: any[];
  totalUsdValue: number;
}

/**
 * Fetch Solana balance - DIRECT RPC (Phantom-like)
 * No longer uses Supabase proxy - all client-side
 */
export async function fetchSolanaBalance(address: string, networkMode: NetworkMode = 'mainnet'): Promise<ChainBalance> {
  console.log(`[Blockchain] Fetching Solana balance via direct RPC (Phantom-like)...`);

  try {
    const result = await fetchSolanaBalanceClient(address, networkMode);

    console.log(`[Blockchain] ✅ SOL balance: ${result.native.toFixed(6)} SOL`);
    console.log(`[Blockchain] ✅ Found ${result.tokens.length} SPL tokens`);

    return {
      native: result.native,
      tokens: result.tokens,
      totalUsdValue: result.totalUsdValue,
    };
  } catch (error: any) {
    console.error('[Blockchain] ❌ Error fetching Solana balance:', error.message);

    // Dispatch event so UI can show a helpful message
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('blockchainTimeout', {
        detail: { chain: 'solana', error: error?.message }
      }));
    }

    return {
      native: 0,
      tokens: [],
      totalUsdValue: 0
    };
  }
}

/**
 * Fetch Ethereum balance with retry logic
 */
export async function fetchEthereumBalance(address: string, networkMode: NetworkMode = 'mainnet'): Promise<ChainBalance> {
  const maxRetries = 2; // Reduce retries to avoid long waits
  let lastError: Error | null = null;
  
  const networkLabel = networkMode === 'mainnet' ? 'mainnet' : networkMode === 'testnet' ? 'sepolia' : 'sepolia';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Blockchain] Fetching Ethereum balance for ${address.substring(0, 10)}... (attempt ${attempt}/${maxRetries}) on ${networkLabel}`);
      
      // Add timeout for Ethereum requests too
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/ethereum-balance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ address, networkMode }),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      // Server now returns 200 even on error (graceful degradation)
      const data = await response.json();
      
      // Check if there's a warning or error
      if (data.warning) {
        console.warn(`[Blockchain] ⚠️ ${data.warning}`);
      }
      if (data.error) {
        console.warn(`[Blockchain] ⚠️ Ethereum API error: ${data.error}`);
        // Continue anyway with zero balance
      }
      
      console.log(`[Blockchain] ✅ ETH balance on ${networkLabel}:`, (data.native || 0).toFixed(6), 'ETH');
      console.log(`[Blockchain] ✅ Found ${(data.tokens || []).length} ERC20 tokens`);

      return {
        native: data.native || 0,
        tokens: data.tokens || [],
        totalUsdValue: data.totalUsdValue || 0
      };
    } catch (error: any) {
      lastError = error;
      
      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        console.error(`[Blockchain] ❌ Attempt ${attempt} timed out after 30s`);
        console.warn('[Blockchain] ⚠️ Ethereum RPC is slow, skipping retries');
        break;
      } else {
        console.error(`[Blockchain] ❌ Attempt ${attempt} failed:`, error.message);
      }
      
      // Don't retry on network errors
      if (error.message === 'Failed to fetch') {
        console.warn('[Blockchain] ⚠️ Network error detected, skipping retries');
        break;
      }
      
      // Wait before retry (shorter backoff)
      if (attempt < maxRetries) {
        const waitTime = 1000; // Fixed 1s wait
        console.log(`[Blockchain] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All retries failed
  console.error('[Blockchain] ❌ All Ethereum balance fetch attempts failed:', lastError?.message);
  return {
    native: 0,
    tokens: [],
    totalUsdValue: 0
  };
}

/**
 * Fetch Bitcoin balance via server endpoint
 */
export async function fetchBitcoinBalance(address: string): Promise<ChainBalance> {
  try {
    console.log('[Blockchain] Fetching Bitcoin balance via server for:', address.substring(0, 10) + '...');
    
    // Use our server endpoint which has multiple API fallbacks
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/bitcoin-balance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ address })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Blockchain] ❌ Error fetching Bitcoin balance:', errorText);
      throw new Error(`Failed to fetch Bitcoin balance: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if there was an error in the response but status is 200 (our graceful fallback)
    if (data.error) {
      console.warn('[Blockchain] ⚠️ Bitcoin API error (using fallback):', data.error);
    }
    
    console.log('[Blockchain] ✅ BTC balance:', (data.native || 0).toFixed(8), 'BTC');
    
    return {
      native: data.native || 0,
      tokens: data.tokens || [],
      totalUsdValue: data.totalUsdValue || 0
    };
  } catch (error: any) {
    console.error('[Blockchain] ❌ Error fetching Bitcoin balance:', error.message);
    return { native: 0, tokens: [], totalUsdValue: 0 };
  }
}

/**
 * Fetch Base balance (Ethereum L2)
 */
export async function fetchBaseBalance(address: string, networkMode: NetworkMode = 'mainnet'): Promise<ChainBalance> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/base-balance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ address, networkMode })
      }
    );

    const data = await response.json();
    
    // If network not available, silently return zero balance (no warnings)
    if (data.warning || data.error) {
      return {
        native: 0,
        tokens: [],
        totalUsdValue: 0
      };
    }

    return {
      native: data.native || 0,
      tokens: data.tokens || [],
      totalUsdValue: data.totalUsdValue || 0
    };
  } catch (error: any) {
    // Silently return zero balance on any error
    return {
      native: 0,
      tokens: [],
      totalUsdValue: 0
    };
  }
}

/**
 * Fetch Polygon balance
 */
export async function fetchPolygonBalance(address: string, networkMode: NetworkMode = 'mainnet'): Promise<ChainBalance> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/polygon-balance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ address, networkMode })
      }
    );

    const data = await response.json();
    
    // If network not available, silently return zero balance (no warnings)
    if (data.warning || data.error) {
      return {
        native: 0,
        tokens: [],
        totalUsdValue: 0
      };
    }

    return {
      native: data.native || 0,
      tokens: data.tokens || [],
      totalUsdValue: data.totalUsdValue || 0
    };
  } catch (error: any) {
    // Silently return zero balance on any error
    return {
      native: 0,
      tokens: [],
      totalUsdValue: 0
    };
  }
}

/**
 * Fetch Sui balance
 */
export async function fetchSuiBalance(address: string): Promise<ChainBalance> {
  try {
    console.log('[Blockchain] Fetching Sui balance for:', address);
    
    // Sui not implemented yet - return 0
    return {
      native: 0,
      tokens: [],
      totalUsdValue: 0
    };
  } catch (error) {
    console.error('[Blockchain] Error fetching Sui balance:', error);
    return { native: 0, tokens: [], totalUsdValue: 0 };
  }
}

/**
 * Fetch all balances for all chains
 * NOTE: Currently only Solana is active. Other networks are coming soon.
 */
export async function fetchAllBalances(addresses: {
  solana: string;
  ethereum: string;
  bitcoin: string;
  base: string;
  polygon: string;
  sui: string;
}, networkMode: NetworkMode = 'mainnet'): Promise<{
  solana: ChainBalance;
  ethereum: ChainBalance;
  bitcoin: ChainBalance;
  base: ChainBalance;
  polygon: ChainBalance;
  sui: ChainBalance;
}> {
  console.log('[Blockchain] 🔄 Fetching balances for Solana network only (other networks coming soon)...');
  
  // Only fetch Solana balance
  const solana = await fetchSolanaBalance(addresses.solana, networkMode);
  
  // Return zero balances for other networks (coming soon)
  console.log('[Blockchain] ✅ Solana balance fetched. Other networks: Coming Soon');
  
  return {
    solana,
    ethereum: { native: 0, tokens: [], totalUsdValue: 0 },
    bitcoin: { native: 0, tokens: [], totalUsdValue: 0 },
    base: { native: 0, tokens: [], totalUsdValue: 0 },
    polygon: { native: 0, tokens: [], totalUsdValue: 0 },
    sui: { native: 0, tokens: [], totalUsdValue: 0 }
  };
}

/**
 * Fetch token prices via Jupiter Price API (fallback for tokens not on CoinGecko)
 * NOTE: CoinGecko is called by tokenLoader.ts directly — not here, to avoid duplicate requests
 * that trigger rate limiting (429).
 */
export async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  // Known mint addresses for common symbols
  const SYMBOL_TO_MINT: Record<string, string> = {
    'SOL': 'So11111111111111111111111111111111111111112',
    'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  };

  const prices: Record<string, number> = {};

  try {
    const mints = symbols
      .map(s => SYMBOL_TO_MINT[s.toUpperCase()])
      .filter(Boolean);

    if (mints.length > 0) {
      console.log('[Blockchain] Fetching prices via Jupiter API for', mints.length, 'tokens...');

      // Get Jupiter API key if available
      const { getJupiterApiKey } = await import('./env');
      const apiKey = getJupiterApiKey();

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(
        `https://api.jup.ag/price/v2?ids=${mints.join(',')}`,
        { signal: AbortSignal.timeout(5000), headers }
      );

      if (response.ok) {
        const data = await response.json();

        // Map mint addresses back to symbols
        for (const [symbol, mint] of Object.entries(SYMBOL_TO_MINT)) {
          if (!prices[symbol]) {
            const priceData = data.data?.[mint];
            if (priceData?.price) {
              prices[symbol] = parseFloat(priceData.price);
            }
          }
        }

        console.log('[Blockchain] ✅ Jupiter prices fetched:', Object.keys(prices).length, 'tokens');
      } else {
        console.warn('[Blockchain] Jupiter API returned', response.status);
      }
    }

    if (Object.keys(prices).length > 0) {
      return prices;
    }

    throw new Error('No prices fetched');
  } catch (error: any) {
    console.warn('[Blockchain] ⚠️ Jupiter price API failed:', error.message);
    throw error;
  }
}

/**
 * Fetch token logo from multiple sources with fallback
 */
export async function fetchTokenLogo(symbol: string, coinGeckoId?: string): Promise<string | null> {
  const sources: string[] = [];
  
  // 1. Try CoinGecko API for the specific token
  if (coinGeckoId) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coin-details/${coinGeckoId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.image) {
          return data.image;
        }
      }
    } catch (error) {
      console.log('[fetchTokenLogo] CoinGecko API failed, trying fallbacks');
    }
  }
  
  // 2. Try CryptoLogos.cc for common tokens
  const commonTokens = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'LINK', 'UNI', 'ATOM', 'LTC', 'AVAX', 'SHIB', 'ARB', 'OP', 'APT'];
  if (commonTokens.includes(symbol.toUpperCase())) {
    const logoUrl = `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`;
    
    try {
      const response = await fetch(logoUrl, { method: 'HEAD' });
      if (response.ok) {
        return logoUrl;
      }
    } catch (error) {
      console.log('[fetchTokenLogo] CryptoLogos failed');
    }
  }
  
  return null;
}