/**
 * Token Enhancer - Enhance tokens with real prices and logos from multiple sources
 */

import { projectId, publicAnonKey } from './supabase/info';

interface EnhancedTokenData {
  price: number;
  logoUrl: string;
  change24h: number;
}

// Well-known token logos (as fallback)
const KNOWN_LOGOS: Record<string, string> = {
  'SOL': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  'USDT': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  'BONK': 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  'PAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
};

// Map mint addresses to CoinGecko IDs for fetching real prices
const MINT_TO_COINGECKO: Record<string, string> = {
  'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': 'parabolic-ai', // Real Parabolic AI Solana mint
  'Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh': 'parabolic-ai', // Alternate Parabolic mint
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'So11111111111111111111111111111111111111112': 'solana',
};

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
          
          console.log(`[TokenEnhancer] ✅ DexScreener: ${symbol} = $${price}, change: ${change24h}%`);
          console.log(`[TokenEnhancer] 🖼️  Logo: ${logoUrl ? 'Found' : 'Not found'}`);
        }
      }
    } catch (error) {
      console.error(`[TokenEnhancer] ⚠️  DexScreener failed for ${symbol}:`, error);
    }
  }
  
  // If price is still 0, try to get from backend
  if (price === 0) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/token-prices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ symbols: [symbol] })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        price = data.prices?.[symbol] || 0;
        console.log(`[TokenEnhancer] ✅ Backend: ${symbol} = $${price}`);
      }
    } catch (error) {
      console.error(`[TokenEnhancer] ⚠️  Backend failed for ${symbol}:`, error);
    }
  }
  
  return { price, logoUrl, change24h };
}

/**
 * Enhance multiple tokens in parallel
 */
export async function enhanceTokens(
  tokens: Array<{ mint: string; symbol: string; logoUrl?: string }>
): Promise<Map<string, EnhancedTokenData>> {
  console.log(`[TokenEnhancer] 🚀 Enhancing ${tokens.length} tokens...`);
  
  const results = await Promise.all(
    tokens.map(token => 
      enhanceToken(token.mint, token.symbol, token.logoUrl)
        .then(data => ({ symbol: token.symbol, data }))
        .catch(error => {
          console.error(`[TokenEnhancer] ❌ Failed to enhance ${token.symbol}:`, error);
          return { symbol: token.symbol, data: { price: 0, logoUrl: token.logoUrl || '', change24h: 0 } };
        })
    )
  );
  
  const map = new Map<string, EnhancedTokenData>();
  results.forEach(({ symbol, data }) => {
    map.set(symbol, data);
  });
  
  console.log(`[TokenEnhancer] ✅ Enhanced ${map.size} tokens`);
  return map;
}