import { projectId, publicAnonKey } from './supabase/info';

export type NetworkMode = 'mainnet' | 'testnet' | 'devnet';

export interface ChainBalance {
  native: number;
  tokens: any[];
  totalUsdValue: number;
}

/**
 * Fetch Solana balance with retry logic
 */
export async function fetchSolanaBalance(address: string, networkMode: NetworkMode = 'mainnet'): Promise<ChainBalance> {
  const maxRetries = 1; // Reduce to 1 attempt for faster response
  let lastError: Error | null = null;
  
  const networkLabel = networkMode === 'mainnet' ? 'mainnet-beta' : networkMode;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Blockchain] Fetching Solana balance for ${address.substring(0, 8)}... (attempt ${attempt}/${maxRetries}) on ${networkLabel}`);
      
      // Reduce timeout for faster failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (reduced from 30s)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/solana-balance`,
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Blockchain] ❌ Error fetching Solana balance (attempt ${attempt}):`, errorText);
        
        // If server is unavailable, fail fast
        if (response.status >= 500) {
          console.warn('[Blockchain] ⚠️ Server error, failing fast');
          break;
        }
        
        throw new Error(`Failed to fetch Solana balance: ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`[Blockchain] ✅ SOL balance on ${networkLabel}:`, data.native.toFixed(6), 'SOL');
      console.log(`[Blockchain] ✅ Found ${data.tokens.length} SPL tokens`);

      return {
        native: data.native,
        tokens: data.tokens,
        totalUsdValue: data.totalUsdValue || 0
      };
    } catch (error: any) {
      lastError = error;
      
      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        console.error(`[Blockchain] ❌ Request timed out after 15s (RPC is slow or rate limited)`);
      } else {
        console.error(`[Blockchain] ❌ Attempt ${attempt} failed:`, error.message);
      }
      
      // No retry - fail fast for better UX
      break;
    }
  }
  
  // All retries failed - return gracefully with zero balance
  console.warn('[Blockchain] ⚠️ Could not fetch Solana balance from server, using zero balance');
  console.warn('[Blockchain] 💡 Tip: This usually means RPC is slow or rate limited. Wallet will retry automatically.');
  if (lastError?.message) {
    console.warn('[Blockchain] ⚠️ Last error:', lastError.message);
  }
  
  // Dispatch event so UI can show a helpful message
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blockchainTimeout', {
      detail: { chain: 'solana', error: lastError?.message }
    }));
  }
  
  return {
    native: 0,
    tokens: [],
    totalUsdValue: 0
  };
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
 * Fetch token prices from server
 */
export async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    console.log('[Blockchain] Fetching token prices for:', symbols.join(', '));
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout (allows backend to respond)
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/token-prices`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ symbols }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('[Blockchain] ❌ Error fetching token prices:', response.status);
      throw new Error(`Failed to fetch token prices: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Blockchain] ✅ Token prices fetched:', data.prices);
    
    return data.prices || {};
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[Blockchain] ⚠️ Token prices request timed out after 12s, using fallback prices');
    } else {
      console.warn('[Blockchain] ⚠️ Error fetching token prices:', error.message);
    }
    
    // 🔥 FALLBACK: Use hardcoded prices when API is unavailable
    console.log('[Blockchain] 💾 Using cached fallback prices');
    const fallbackPrices: Record<string, number> = {
      'SOL': 245.00,
      'ETH': 3200.00,
      'BTC': 97000.00,
      'USDC': 1.00,
      'USDT': 1.00,
      'BNB': 620.00,
      'XRP': 0.52,
      'ADA': 0.45,
      'DOGE': 0.08,
      'MATIC': 0.85,
      'DOT': 7.20,
      'SHIB': 0.000024,
      'AVAX': 38.50,
      'LINK': 15.80,
      'UNI': 8.90,
      'ATOM': 9.40,
      'LTC': 102.50,
      'BONK': 0.00003,
      'PARAI': 0.059,
      'PAI': 0.059,
    };
    
    // Return only requested symbols
    const result: Record<string, number> = {};
    symbols.forEach(symbol => {
      result[symbol] = fallbackPrices[symbol] || 0;
    });
    
    return result;
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