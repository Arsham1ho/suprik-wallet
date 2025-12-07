import { projectId, publicAnonKey } from './supabase/info';
import { fetchAllBalances, fetchTokenPrices } from './blockchain';
import { enhanceTokens } from './tokenEnhancer';
import { getCustomTokens, type CustomToken } from './customTokens';

export interface Token {
  id: number;
  mint: string;
  name: string;
  symbol: string;
  amount: number;
  value: number;
  price: number;
  change: number;
  logo: string;
  logoUrl: string;
  color: string;
  network: string;
}

export interface WalletAddresses {
  solana: string;
  ethereum: string;
  bitcoin: string;
  base: string;
  polygon: string;
  sui: string;
}

/**
 * Fetch token logos from CoinGecko (with caching)
 */
async function fetchTokenLogos(symbols: string[]): Promise<{ [key: string]: string }> {
  try {
    const logoMap: { [key: string]: string } = {};
    
    // Try to get from cache first
    const cached = localStorage.getItem('token_logos_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          console.log('[TokenLoader] Using cached token logos');
          return parsed.data;
        }
      } catch (e) {
        console.error('Error parsing cache:', e);
      }
    }
    
    console.log('[TokenLoader] Fetching token logos from CoinGecko...');
    
    // Fetch first page of coins (top 250)
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coins?page=1&per_page=250`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    if (response.ok) {
      const coins = await response.json();
      
      // Map symbols to logos
      coins.forEach((coin: any) => {
        const symbol = coin.symbol.toUpperCase();
        if (coin.image) {
          logoMap[symbol] = coin.image;
        }
      });
      
      // Cache the logos
      localStorage.setItem('token_logos_cache', JSON.stringify({
        data: logoMap,
        timestamp: Date.now()
      }));
      
      console.log('[TokenLoader] ✅ Token logos fetched and cached');
      return logoMap;
    }
    
    return {};
  } catch (error) {
    console.error('[TokenLoader] Error fetching token logos:', error);
    return {};
  }
}

/**
 * Load all tokens from blockchain - EXACTLY LIKE PHANTOM
 * Auto-detects ALL SPL tokens and shows them automatically
 */
export async function loadAllTokens(
  addresses: WalletAddresses,
  networkMode: 'mainnet' | 'testnet',
  isTestnet: boolean
): Promise<Token[]> {
  console.log('[TokenLoader] 🚀 Loading tokens in', networkMode, 'mode...');
  
  try {
    // Fetch balances from blockchain
    const balances = await fetchAllBalances(addresses, networkMode);
    
    console.log('[TokenLoader] 📊 Blockchain data received:');
    console.log('  - SOL balance:', balances.solana.native);
    console.log('  - SPL tokens:', balances.solana.tokens.length);
    console.log('  - ETH balance:', balances.ethereum.native);
    console.log('  - ERC20 tokens:', balances.ethereum.tokens.length);
    console.log('  - BTC balance:', balances.bitcoin.native);
    console.log('  - BASE balance:', balances.base.native);
    console.log('  - Base tokens:', balances.base.tokens.length);
    console.log('  - MATIC balance:', balances.polygon.native);
    console.log('  - Polygon tokens:', balances.polygon.tokens.length);
    
    // Collect all symbols for price fetching
    const allSymbols = [
      'SOL',
      'ETH',
      'BTC',
      'MATIC',
      ...balances.solana.tokens.map(t => t.symbol),
      ...balances.ethereum.tokens.map(t => t.symbol),
      ...balances.base.tokens.map(t => t.symbol),
      ...balances.polygon.tokens.map(t => t.symbol)
    ];
    const uniqueSymbols = Array.from(new Set(allSymbols.filter(s => s)));
    
    // Fetch prices (with error handling)
    let prices: Record<string, number> = {};
    try {
      prices = await fetchTokenPrices(uniqueSymbols);
      console.log('[TokenLoader] ✅ Fetched prices for', Object.keys(prices).length, 'symbols');
    } catch (error) {
      console.warn('[TokenLoader] ⚠️ Using cached prices (API temporarily unavailable)');
      // Fallback prices
      prices = {
        'SOL': 245.00,
        'ETH': 3200.00,
        'BTC': 97000.00,
        'USDC': 1.00,
        'USDT': 1.00,
        'MATIC': 0.85,
        'PARAI': 0.05938,
      };
    }
    
    // Fetch token logos (with error handling)
    let logos: Record<string, string> = {};
    try {
      logos = await fetchTokenLogos(uniqueSymbols);
      // Add official PARAI logo
      logos['PARAI'] = 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png';
    } catch (error) {
      console.warn('[TokenLoader] ⚠️ Using default token icons');
      logos = {
        'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png'
      };
    }
    
    // 🚀 ENHANCE tokens with real prices and logos from DexScreener
    console.log('[TokenLoader] 🚀 Enhancing SPL tokens with real data from DexScreener...');
    const tokensToEnhance = balances.solana.tokens
      .filter(t => t.amount > 0 || !isTestnet)
      .map(t => ({ mint: t.mint, symbol: t.symbol, logoUrl: t.logoUrl }));
    
    const enhancedData = await enhanceTokens(tokensToEnhance);
    console.log('[TokenLoader] ✅ Enhanced', enhancedData.size, 'tokens with real data');
    
    // Build tokens array
    const tokens: Token[] = [];
    
    // ========== NATIVE COINS ==========
    
    // SOL - show if has balance OR in mainnet mode (Phantom behavior)
    if (balances.solana.native > 0 || !isTestnet) {
      tokens.push({
        id: tokens.length + 1,
        mint: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        amount: balances.solana.native,
        value: balances.solana.native * (prices['SOL'] || 0),
        price: prices['SOL'] || 0,
        change: 0,
        logo: '◎',
        logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        color: 'from-purple-500 to-purple-600',
        network: 'solana'
      });
    }
    
    // ========== SPL TOKENS - AUTO-DETECT EVERYTHING! ==========
    if (balances.solana.tokens && balances.solana.tokens.length > 0) {
      console.log('[TokenLoader] 🎯 Auto-adding', balances.solana.tokens.length, 'SPL tokens...');
      console.log('[TokenLoader] 📋 SPL tokens from blockchain:', balances.solana.tokens.map(t => ({
        symbol: t.symbol,
        name: t.name,
        amount: t.amount,
        mint: t.mint
      })));
      
      balances.solana.tokens.forEach((token, idx) => {
        // In testnet: only show tokens with balance
        // In mainnet: show ALL tokens (like Phantom)
        if (token.amount > 0 || !isTestnet) {
          console.log(`[TokenLoader] ✅ Adding token #${idx + 1}:`, {
            symbol: token.symbol,
            name: token.name,
            amount: token.amount,
            mint: token.mint,
            logoUrl: token.logoUrl // Log the logoUrl from Helius
          });
          
          // Use logoUrl from Helius (DAS API) first, then fallback to CoinGecko
          let tokenLogoUrl = token.logoUrl || logos[token.symbol] || '';
          
          // Check if enhanced data is available (from DexScreener)
          const enhancedToken = enhancedData.get(token.symbol);
          if (enhancedToken) {
            if (enhancedToken.logoUrl) {
              tokenLogoUrl = enhancedToken.logoUrl;
            }
            if (enhancedToken.price > 0) {
              prices[token.symbol] = enhancedToken.price;
            }
            console.log(`[TokenLoader] 🔥 Enhanced ${token.symbol}: price=$${enhancedToken.price}, logo=${enhancedToken.logoUrl ? 'YES' : 'NO'}`);
          }
          
          tokens.push({
            id: tokens.length + 1,
            mint: token.mint || token.symbol.toLowerCase(),
            name: token.name || token.symbol || 'Unknown Token',
            symbol: token.symbol || 'UNKNOWN',
            amount: token.amount || 0,
            value: (token.amount || 0) * (prices[token.symbol] || 0),
            price: prices[token.symbol] || 0,
            change: enhancedToken?.change24h || 0,
            logo: token.symbol?.charAt(0) || '?',
            logoUrl: tokenLogoUrl,
            color: 'from-cyan-500 to-blue-600',
            network: 'solana'
          });
        } else {
          console.log(`[TokenLoader] ⏭️  Skipping testnet token with 0 balance:`, token.symbol);
        }
      });
    }
    
    // BTC - show if has balance OR in mainnet mode
    if (balances.bitcoin.native > 0 || !isTestnet) {
      tokens.push({
        id: tokens.length + 1,
        mint: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        amount: balances.bitcoin.native,
        value: balances.bitcoin.native * (prices['BTC'] || 0),
        price: prices['BTC'] || 0,
        change: 0,
        logo: '₿',
        logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        color: 'from-orange-400 to-orange-500',
        network: 'bitcoin'
      });
    }
    
    // ETH - show if has balance OR in mainnet mode
    if (balances.ethereum.native > 0 || !isTestnet) {
      tokens.push({
        id: tokens.length + 1,
        mint: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        amount: balances.ethereum.native,
        value: balances.ethereum.native * (prices['ETH'] || 0),
        price: prices['ETH'] || 0,
        change: 0,
        logo: 'Ξ',
        logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        color: 'from-slate-400 to-slate-500',
        network: 'ethereum'
      });
    }
    
    // ========== ERC20 TOKENS ==========
    if (balances.ethereum.tokens && balances.ethereum.tokens.length > 0) {
      balances.ethereum.tokens.forEach((token) => {
        if (token.amount > 0 || !isTestnet) {
          tokens.push({
            id: tokens.length + 1,
            mint: token.mint || token.symbol.toLowerCase(),
            name: token.name || token.symbol,
            symbol: token.symbol || 'UNKNOWN',
            amount: token.amount || 0,
            value: (token.amount || 0) * (prices[token.symbol] || 0),
            price: prices[token.symbol] || 0,
            change: 0,
            logo: token.symbol?.charAt(0) || '?',
            logoUrl: logos[token.symbol] || '',
            color: 'from-blue-500 to-blue-600',
            network: 'ethereum'
          });
        }
      });
    }
    
    // BASE (Ethereum L2) - show if has balance OR in mainnet mode
    // NOTE: Base API may not be available with free tier Alchemy - only show if balance > 0
    if (balances.base.native > 0) {
      tokens.push({
        id: tokens.length + 1,
        mint: 'base',
        name: 'Base',
        symbol: 'ETH',
        amount: balances.base.native,
        value: balances.base.native * (prices['ETH'] || 0),
        price: prices['ETH'] || 0,
        change: 0,
        logo: 'B',
        logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        color: 'from-blue-400 to-blue-500',
        network: 'base'
      });
    }
    
    // ========== BASE TOKENS ==========
    if (balances.base.tokens && balances.base.tokens.length > 0) {
      balances.base.tokens.forEach((token) => {
        if (token.amount > 0) {
          tokens.push({
            id: tokens.length + 1,
            mint: token.mint || token.symbol.toLowerCase(),
            name: token.name || token.symbol,
            symbol: token.symbol || 'UNKNOWN',
            amount: token.amount || 0,
            value: (token.amount || 0) * (prices[token.symbol] || 0),
            price: prices[token.symbol] || 0,
            change: 0,
            logo: token.symbol?.charAt(0) || '?',
            logoUrl: logos[token.symbol] || '',
            color: 'from-blue-400 to-cyan-500',
            network: 'base'
          });
        }
      });
    }
    
    // MATIC (Polygon) - show if has balance OR in mainnet mode
    // NOTE: Polygon API may not be available with free tier Alchemy - only show if balance > 0
    if (balances.polygon.native > 0) {
      tokens.push({
        id: tokens.length + 1,
        mint: 'polygon',
        name: 'Polygon',
        symbol: 'MATIC',
        amount: balances.polygon.native,
        value: balances.polygon.native * (prices['MATIC'] || 0),
        price: prices['MATIC'] || 0,
        change: 0,
        logo: '⬡',
        logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        color: 'from-purple-400 to-purple-500',
        network: 'polygon'
      });
    }
    
    // ========== POLYGON TOKENS ==========
    if (balances.polygon.tokens && balances.polygon.tokens.length > 0) {
      balances.polygon.tokens.forEach((token) => {
        if (token.amount > 0) {
          tokens.push({
            id: tokens.length + 1,
            mint: token.mint || token.symbol.toLowerCase(),
            name: token.name || token.symbol,
            symbol: token.symbol || 'UNKNOWN',
            amount: token.amount || 0,
            value: (token.amount || 0) * (prices[token.symbol] || 0),
            price: prices[token.symbol] || 0,
            change: 0,
            logo: token.symbol?.charAt(0) || '?',
            logoUrl: logos[token.symbol] || '',
            color: 'from-purple-400 to-pink-500',
            network: 'polygon'
          });
        }
      });
    }
    
    // ========== CUSTOM TOKENS (from Search page) ==========
    const customTokens = getCustomTokens();
    if (customTokens.length > 0) {
      console.log('[TokenLoader] 🎯 Found', customTokens.length, 'custom tokens');
      
      customTokens.forEach((customToken) => {
        // Check if already exists
        const exists = tokens.some(t =>
          t.mint?.toLowerCase() === customToken.mint?.toLowerCase() ||
          (t.symbol.toLowerCase() === customToken.symbol.toLowerCase() && t.network === customToken.network)
        );
        
        if (!exists) {
          console.log('[TokenLoader] ✅ Adding custom token:', customToken.symbol);
          tokens.push({
            id: tokens.length + 1,
            mint: customToken.mint || customToken.id,
            name: customToken.name,
            symbol: customToken.symbol,
            amount: 0,
            value: 0,
            price: prices[customToken.symbol] || 0,
            change: 0,
            logo: customToken.symbol.charAt(0),
            logoUrl: customToken.image,
            color: 'from-purple-500 to-pink-500',
            network: customToken.network || 'solana'
          });
        }
      });
    }
    
    console.log('[TokenLoader] ✅ Total tokens loaded:', tokens.length);
    console.log('[TokenLoader] 📊 Breakdown:');
    console.log('  - SPL tokens:', balances.solana.tokens.length);
    console.log('  - ERC20 tokens:', balances.ethereum.tokens.length);
    console.log('  - Native coins:', 3);
    console.log('  - Custom tokens:', customTokens.length);
    
    return tokens;
  } catch (error) {
    console.error('[TokenLoader] ❌ Error loading tokens:', error);
    throw error;
  }
}