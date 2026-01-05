/**
 * Token Enhancer - Enhance tokens with real prices and logos from multiple sources
 *
 * CLIENT-SIDE ONLY - Uses DexScreener and Jupiter API directly (Phantom-like architecture)
 * No server proxy required.
 */

interface EnhancedTokenData {
  price: number;
  logoUrl: string;
  change24h: number;
  name?: string;
  symbol?: string;
}

// Well-known token logos (as fallback)
const KNOWN_LOGOS: Record<string, string> = {
  'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  'USDT': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  'BONK': 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  'PAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
};

// Known Solana token mints for reference
const KNOWN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  PAI: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
} as const;

// Stablecoins with known fixed prices - DON'T fetch from DexScreener (returns wrong prices)
const STABLECOIN_PRICES: Record<string, number> = {
  'USDC': 1.00,
  'USDT': 1.00,
  'DAI': 1.00,
  'BUSD': 1.00,
  'TUSD': 1.00,
  'USDP': 1.00,
  'GUSD': 1.00,
  'FRAX': 1.00,
  'LUSD': 1.00,
  'SUSD': 1.00,
  'PYUSD': 1.00,
};

// Stablecoin mint addresses (Solana)
const STABLECOIN_MINTS: Set<string> = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

/**
 * Enhance a single token with real price and logo from DexScreener
 */
export async function enhanceToken(
  mint: string,
  symbol: string,
  currentLogoUrl?: string
): Promise<EnhancedTokenData> {
  console.log(`[TokenEnhancer] 🔍 Enhancing ${symbol} (${mint})`);

  // Default values
  let price = 0;
  let logoUrl = currentLogoUrl || KNOWN_LOGOS[symbol] || '';
  let change24h = 0;
  let tokenName: string | undefined;
  let tokenSymbol: string | undefined;

  // 🛡️ STABLECOIN PROTECTION: Use fixed $1.00 price for stablecoins
  // DexScreener returns incorrect prices for stablecoins (shows trading pair prices)
  const upperSymbol = symbol?.toUpperCase();
  if (STABLECOIN_PRICES[upperSymbol] !== undefined || STABLECOIN_MINTS.has(mint)) {
    console.log(`[TokenEnhancer] 💵 ${symbol} is a stablecoin - using fixed price $1.00`);
    return {
      price: STABLECOIN_PRICES[upperSymbol] || 1.00,
      logoUrl: logoUrl || KNOWN_LOGOS[upperSymbol] || '',
      change24h: 0
    };
  }

  // Try to get data from DexScreener for Solana tokens
  if (mint.length > 32 && !mint.includes('-')) {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Find the pair with highest liquidity
          const bestPair = data.pairs.reduce((best: any, current: any) => {
            const bestLiq = best.liquidity?.usd || 0;
            const currentLiq = current.liquidity?.usd || 0;
            return currentLiq > bestLiq ? current : best;
          }, data.pairs[0]);
          
          price = parseFloat(bestPair.priceUsd || '0');
          change24h = bestPair.priceChange?.h24 || 0;
          
          // Get logo from DexScreener
          if (bestPair.info?.imageUrl) {
            logoUrl = bestPair.info.imageUrl;
          }

          // Get token name and symbol from DexScreener (for unknown tokens)
          if (bestPair.baseToken) {
            tokenName = bestPair.baseToken.name;
            tokenSymbol = bestPair.baseToken.symbol;
            console.log(`[TokenEnhancer] 📛 DexScreener metadata: name="${tokenName}", symbol="${tokenSymbol}"`);
          }

          console.log(`[TokenEnhancer] ✅ DexScreener: ${symbol} = $${price}, change: ${change24h}%`);
          console.log(`[TokenEnhancer] 🖼️  Logo: ${logoUrl ? 'Found' : 'Not found'}`);
        }
      }
    } catch (error) {
      console.error(`[TokenEnhancer] ⚠️  DexScreener failed for ${symbol}:`, error);
    }
  }
  
  // If price is still 0, try Jupiter Price API v3 (client-side, like Phantom)
  if (price === 0 && mint.length > 32) {
    try {
      const response = await fetch(`https://api.jup.ag/price/v3?ids=${mint}`);

      if (response.ok) {
        const data = await response.json();
        const priceData = data.data?.[mint];
        if (priceData?.price) {
          price = parseFloat(priceData.price);
          console.log(`[TokenEnhancer] ✅ Jupiter API: ${symbol} = $${price}`);
        }
      }
    } catch (error) {
      console.error(`[TokenEnhancer] ⚠️ Jupiter API failed for ${symbol}:`, error);
    }
  }

  // If price is still 0, try Raydium API (good for new pump.fun tokens)
  if (price === 0 && mint.length > 32) {
    try {
      const response = await fetch(`https://api-v3.raydium.io/mint/price?mints=${mint}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.[mint]) {
          price = parseFloat(data.data[mint]);
          console.log(`[TokenEnhancer] ✅ Raydium API: ${symbol} = $${price}`);
        }
      }
    } catch (error) {
      console.error(`[TokenEnhancer] ⚠️ Raydium API failed for ${symbol}:`, error);
    }
  }

  // If price is still 0, try pump.fun API for pump.fun tokens
  if (price === 0 && mint.length > 32) {
    try {
      const response = await fetch(`https://frontend-api.pump.fun/coins/${mint}`);

      if (response.ok) {
        const data = await response.json();
        if (data.usd_market_cap && data.total_supply) {
          // Calculate price from market cap and supply
          const marketCap = parseFloat(data.usd_market_cap);
          const supply = parseFloat(data.total_supply) / 1e6; // pump.fun tokens have 6 decimals
          if (supply > 0) {
            price = marketCap / supply;
            console.log(`[TokenEnhancer] ✅ Pump.fun API: ${symbol} = $${price}`);
          }
        }
        // Get logo from pump.fun if available
        if (!logoUrl && data.image_uri) {
          logoUrl = data.image_uri;
          console.log(`[TokenEnhancer] 🖼️ Got logo from pump.fun`);
        }
        // Get name from pump.fun if available
        if (data.name) {
          tokenName = data.name;
        }
        if (data.symbol) {
          tokenSymbol = data.symbol;
        }
      }
    } catch (error) {
      console.error(`[TokenEnhancer] ⚠️ Pump.fun API failed for ${symbol}:`, error);
    }
  }

  return { price, logoUrl, change24h, name: tokenName, symbol: tokenSymbol };
}

/**
 * Enhance multiple tokens in parallel
 * Returns a map with BOTH symbol AND mint as keys for flexible lookup
 */
export async function enhanceTokens(
  tokens: Array<{ mint: string; symbol: string; logoUrl?: string }>
): Promise<Map<string, EnhancedTokenData>> {
  console.log(`[TokenEnhancer] 🚀 Enhancing ${tokens.length} tokens...`);

  const results = await Promise.all(
    tokens.map(token =>
      enhanceToken(token.mint, token.symbol, token.logoUrl)
        .then(data => ({ mint: token.mint, symbol: token.symbol, data }))
        .catch(error => {
          console.error(`[TokenEnhancer] ❌ Failed to enhance ${token.symbol}:`, error);
          return { mint: token.mint, symbol: token.symbol, data: { price: 0, logoUrl: token.logoUrl || '', change24h: 0 } };
        })
    )
  );

  const map = new Map<string, EnhancedTokenData>();
  results.forEach(({ mint, symbol, data }) => {
    // Store by both symbol AND mint for flexible lookup
    map.set(symbol, data);
    if (mint) {
      map.set(mint, data);
    }
  });

  console.log(`[TokenEnhancer] ✅ Enhanced ${map.size} tokens (stored by symbol and mint)`);
  return map;
}