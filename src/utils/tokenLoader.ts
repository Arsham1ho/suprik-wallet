import { fetchAllBalances, fetchTokenPrices } from './blockchain';
import { enhanceTokens } from './tokenEnhancer';
import { getCustomTokens, type CustomToken } from './customTokens';
import { dedupe } from './requestDeduplication';
import { TOKEN_BY_MINT, TOKEN_BY_SYMBOL } from './tokenRegistry';
import { fetchCoinGeckoPrices, SYMBOL_TO_COINGECKO } from './coingecko';

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

// Known correct logos for major tokens (override any API/on-chain data)
// These are authoritative and won't be overwritten by potentially incorrect metadata
const VERIFIED_TOKEN_LOGOS: Record<string, string> = {
  'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  'USDT': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'BTC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'BONK': 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  'WIF': 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
  'JUP': 'https://static.jup.ag/jup/icon.png',
  'RAY': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  'ORCA': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
  'MSOL': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
  'PYTH': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png',
  'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'SUPRA': 'https://cdn.prod.website-files.com/686dcacdb4c6c4915a600eb7/686dcf27eb9628bb737f3939_Suprana4-transparent-200x200x.png',
  'HNT': 'https://cryptologos.cc/logos/helium-hnt-logo.png',
};

// Stablecoins - never override their price (always $1.00)
const STABLECOIN_SYMBOLS = new Set(['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'SUSD', 'PYUSD']);

// Verified token metadata by mint address
// This provides authoritative token info when blockchain metadata is missing/incorrect
interface TokenMetadata {
  symbol: string;
  name: string;
  logo?: string;
}

const VERIFIED_TOKEN_METADATA: Record<string, TokenMetadata> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD' },
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk' },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter' },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', name: 'dogwifhat' },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium' },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': { symbol: 'ORCA', name: 'Orca' },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'MSOL', name: 'Marinade Staked SOL' },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', name: 'Pyth Network' },
  'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': {
    symbol: 'PAI',
    name: 'Parabolic AI',
    logo: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png'
  },
  'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp': {
    symbol: 'SUPRA',
    name: 'Suprana',
    logo: 'https://cdn.prod.website-files.com/686dcacdb4c6c4915a600eb7/686dcf27eb9628bb737f3939_Suprana4-transparent-200x200x.png'
  },
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux': {
    symbol: 'HNT',
    name: 'Helium',
    logo: 'https://cryptologos.cc/logos/helium-hnt-logo.png'
  },
};


// Module-level cache for last successful prices - used as fallback when API fails
let lastSuccessfulPrices: Record<string, number> = {};
let lastSuccessfulChanges: Record<string, number> = {};

const PRICE_CACHE_KEY = 'suprik_last_good_prices';

function saveLastGoodPrices(prices: Record<string, number>, changes: Record<string, number>) {
  try {
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({ prices, changes, ts: Date.now() }));
  } catch (e) { /* ignore */ }
}

function loadLastGoodPrices(): { prices: Record<string, number>; changes: Record<string, number> } {
  try {
    const cached = localStorage.getItem(PRICE_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      // Use cached prices up to 1 hour old
      if (Date.now() - data.ts < 60 * 60 * 1000) {
        return { prices: data.prices || {}, changes: data.changes || {} };
      }
    }
  } catch (e) { /* ignore */ }
  return { prices: {}, changes: {} };
}

/**
 * Fetch token logos - CLIENT-SIDE ONLY (Phantom-like architecture)
 * Uses pre-cached TOKEN_REGISTRY - no server calls needed
 */
async function fetchTokenLogos(symbols: string[]): Promise<{ [key: string]: string }> {
  // Use dedupe to prevent duplicate calls
  return dedupe('token_logos', async () => {
    const logoMap: { [key: string]: string } = {};

    // Get logos from pre-cached token registry (instant, no API call)
    for (const symbol of symbols) {
      const registryToken = TOKEN_BY_SYMBOL.get(symbol.toUpperCase());
      if (registryToken?.image) {
        logoMap[symbol.toUpperCase()] = registryToken.image;
      }
    }
    console.log(`[TokenLoader] 🚀 Got ${Object.keys(logoMap).length} logos from token registry (client-side)`);

    // Also check localStorage cache for any additional logos
    try {
      const cached = localStorage.getItem('token_logos_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          // Merge cached logos (registry takes priority)
          return { ...parsed.data, ...logoMap };
        }
      }
    } catch (e) {
      // Ignore cache errors
    }

    // Cache the registry logos for faster subsequent loads
    localStorage.setItem('token_logos_cache', JSON.stringify({
      data: logoMap,
      timestamp: Date.now()
    }));

    return logoMap;
  }, { cacheTTL: 60000 }); // Cache for 1 minute
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
    
    // Fetch prices AND 24h changes from CoinGecko (primary source)
    let prices: Record<string, number> = {};
    let changes24h: Record<string, number> = {};

    // Step 1: Try CoinGecko (primary price source - separate try-catch to preserve partial results)
    try {
      const coinGeckoIds: string[] = [];
      const symbolToId: Record<string, string> = {};

      for (const symbol of uniqueSymbols) {
        const cgId = SYMBOL_TO_COINGECKO[symbol.toUpperCase()];
        if (cgId && !coinGeckoIds.includes(cgId)) {
          coinGeckoIds.push(cgId);
          symbolToId[symbol.toUpperCase()] = cgId;
        }
      }

      if (coinGeckoIds.length > 0) {
        console.log('[TokenLoader] 🔥 Fetching prices from CoinGecko for', coinGeckoIds.length, 'tokens...');
        const cgPrices = await fetchCoinGeckoPrices(coinGeckoIds);

        for (const [symbol, cgId] of Object.entries(symbolToId)) {
          const priceData = cgPrices[cgId];
          if (priceData) {
            prices[symbol] = priceData.price;
            changes24h[symbol] = priceData.change24h;
          }
        }

        console.log('[TokenLoader] ✅ CoinGecko prices fetched:', Object.keys(prices).length, 'tokens');
      }
    } catch (error) {
      console.warn('[TokenLoader] ⚠️ CoinGecko fetch failed:', error);
    }

    // Step 2: Try fallback API for missing symbols (separate try-catch to preserve CoinGecko prices)
    try {
      const missingSymbols = uniqueSymbols.filter(s => !prices[s.toUpperCase()]);
      if (missingSymbols.length > 0) {
        console.log('[TokenLoader] Fetching remaining', missingSymbols.length, 'prices via fallback...');
        const fallbackPrices = await fetchTokenPrices(missingSymbols);
        for (const [symbol, price] of Object.entries(fallbackPrices)) {
          if (!prices[symbol]) {
            prices[symbol] = price;
          }
        }
      }
    } catch (error) {
      console.warn('[TokenLoader] ⚠️ Fallback price fetch failed:', error);
    }

    // Step 3: If we got prices, cache them. If not, use last known good prices.
    if (Object.keys(prices).length >= 2) {
      console.log('[TokenLoader] ✅ Total prices fetched:', Object.keys(prices).length, 'symbols');
      lastSuccessfulPrices = { ...prices };
      lastSuccessfulChanges = { ...changes24h };
      saveLastGoodPrices(prices, changes24h);
    } else if (Object.keys(lastSuccessfulPrices).length > 0) {
      console.warn('[TokenLoader] ⚠️ Using in-memory cached prices (APIs temporarily unavailable)');
      prices = { ...lastSuccessfulPrices };
      changes24h = { ...lastSuccessfulChanges };
    } else {
      // Try localStorage (survives page refreshes)
      const stored = loadLastGoodPrices();
      if (Object.keys(stored.prices).length > 0) {
        console.warn('[TokenLoader] ⚠️ Using localStorage cached prices');
        prices = stored.prices;
        changes24h = stored.changes;
        lastSuccessfulPrices = { ...prices };
        lastSuccessfulChanges = { ...changes24h };
      } else {
        console.warn('[TokenLoader] ⚠️ No prices available - using stablecoins only');
        prices = { 'USDC': 1.00, 'USDT': 1.00 };
      }
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
      const solAmount = Number(balances.solana.native) || 0;
      const solPrice = Number(prices['SOL']) || 0;
      const solValue = solAmount * solPrice;
      const solChange = Number(changes24h['SOL']) || 0;

      tokens.push({
        id: tokens.length + 1,
        mint: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        amount: solAmount,
        value: isNaN(solValue) ? 0 : solValue,
        price: isNaN(solPrice) ? 0 : solPrice,
        change: isNaN(solChange) ? 0 : solChange,
        logo: '◎',
        logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        color: 'from-purple-500 to-purple-600',
        network: 'solana'
      });
    }
    
    // ========== SPL TOKENS - AUTO-DETECT EVERYTHING! ==========
    // Filter out wrapped SOL to prevent double-counting with native SOL
    const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';
    const filteredSplTokens = balances.solana.tokens.filter(t => t.mint !== WRAPPED_SOL_MINT);

    if (filteredSplTokens && filteredSplTokens.length > 0) {
      console.log('[TokenLoader] 🎯 Auto-adding', filteredSplTokens.length, 'SPL tokens (filtered wrapped SOL)...');
      console.log('[TokenLoader] 📋 SPL tokens from blockchain:', filteredSplTokens.map(t => ({
        symbol: t.symbol,
        name: t.name,
        amount: t.amount,
        mint: t.mint
      })));

      filteredSplTokens.forEach((token, idx) => {
        // In testnet: only show tokens with balance
        // In mainnet: show ALL tokens (like Phantom)
        if (token.amount > 0 || !isTestnet) {
          // 🔍 Check for verified metadata FIRST (highest priority for unknown tokens)
          const verifiedMeta = token.mint ? VERIFIED_TOKEN_METADATA[token.mint] : null;
          // Also check token registry (pre-cached data like Phantom)
          const registryMeta = token.mint ? TOKEN_BY_MINT.get(token.mint) : null;

          // Use verified metadata if available, then registry, then fall back to blockchain data
          let finalSymbol = verifiedMeta?.symbol || registryMeta?.symbol || token.symbol || 'UNKNOWN';
          let finalName = verifiedMeta?.name || registryMeta?.name || token.name || finalSymbol || 'Unknown Token';

          console.log(`[TokenLoader] ✅ Adding token #${idx + 1}:`, {
            symbol: finalSymbol,
            name: finalName,
            amount: token.amount,
            mint: token.mint,
            logoUrl: token.logoUrl,
            verifiedMeta: verifiedMeta ? 'YES' : 'NO'
          });

          // PRIORITY ORDER for logo:
          // 1. Verified token metadata logo (hardcoded, always correct)
          // 2. Verified token logos by symbol
          // 3. Enhanced data from DexScreener
          // 4. Helius DAS API (may have incorrect metadata)
          // 5. CoinGecko logos

          // Start with verified metadata logo (HIGHEST PRIORITY)
          let tokenLogoUrl = verifiedMeta?.logo || '';

          // Then try token registry (pre-cached like Phantom)
          if (!tokenLogoUrl && registryMeta?.image) {
            tokenLogoUrl = registryMeta.image;
          }

          // Then try verified logos by symbol
          if (!tokenLogoUrl) {
            tokenLogoUrl = VERIFIED_TOKEN_LOGOS[finalSymbol] || '';
          }

          // Check if enhanced data is available (from DexScreener)
          // Try by symbol first, then by mint address
          let enhancedToken = enhancedData.get(finalSymbol);

          // For unknown tokens, try to find by mint address
          if (!enhancedToken && token.mint) {
            enhancedToken = enhancedData.get(token.mint);
          }

          if (enhancedToken) {
            // 🔧 FIX: Use DexScreener name/symbol for unknown tokens
            if ((finalName === 'Unknown Token' || finalSymbol === 'UNKNOWN') && enhancedToken.name && enhancedToken.symbol) {
              console.log(`[TokenLoader] 🔧 Fixing unknown token with DexScreener data: ${enhancedToken.name} (${enhancedToken.symbol})`);
              finalName = enhancedToken.name;
              finalSymbol = enhancedToken.symbol;
            }

            // Only use enhanced logo if we don't have a verified one
            if (!tokenLogoUrl && enhancedToken.logoUrl) {
              tokenLogoUrl = enhancedToken.logoUrl;
            }
            // 🛡️ STABLECOIN PROTECTION: Never override stablecoin prices
            // DexScreener returns trading pair prices which are wrong for stablecoins
            const isStablecoin = STABLECOIN_SYMBOLS.has(finalSymbol.toUpperCase());
            if (enhancedToken.price > 0 && !isStablecoin) {
              prices[finalSymbol] = enhancedToken.price;
            } else if (isStablecoin) {
              prices[finalSymbol] = 1.00; // Force stablecoin price to $1.00
              console.log(`[TokenLoader] 💵 ${finalSymbol} is stablecoin - using fixed $1.00 price`);
            }
            console.log(`[TokenLoader] 🔥 Enhanced ${finalSymbol}: price=$${prices[finalSymbol]}, logo=${enhancedToken.logoUrl ? 'YES' : 'NO'}${isStablecoin ? ' (STABLECOIN)' : ''}`);
          }

          // Fallback to Helius/CoinGecko only if no verified logo
          if (!tokenLogoUrl) {
            tokenLogoUrl = token.logoUrl || logos[finalSymbol] || '';
          }

          console.log(`[TokenLoader] 🖼️ Logo for ${finalSymbol}: ${tokenLogoUrl ? 'FOUND' : 'MISSING'} (verified: ${!!verifiedMeta?.logo || !!VERIFIED_TOKEN_LOGOS[finalSymbol]})`);

          // Calculate price safely (ensure it's a valid number)
          // 🛡️ FINAL SAFEGUARD: Force stablecoins to $1.00
          const isStablecoinFinal = STABLECOIN_SYMBOLS.has(finalSymbol.toUpperCase());
          const tokenPrice = isStablecoinFinal ? 1.00 : (Number(prices[finalSymbol]) || 0);
          const tokenAmount = Number(token.amount) || 0;
          const tokenValue = tokenAmount * tokenPrice;

          // Get 24h change - priority: CoinGecko > Enhanced data (DexScreener)
          const tokenChange = Number(changes24h[finalSymbol]) || Number(enhancedToken?.change24h) || 0;

          tokens.push({
            id: tokens.length + 1,
            mint: token.mint || finalSymbol.toLowerCase(),
            name: finalName,
            symbol: finalSymbol,
            amount: tokenAmount,
            value: isNaN(tokenValue) ? 0 : tokenValue,
            price: isNaN(tokenPrice) ? 0 : tokenPrice,
            change: isNaN(tokenChange) ? 0 : tokenChange,
            logo: finalSymbol.charAt(0) || '?',
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
        change: changes24h['BTC'] || 0,
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
        change: changes24h['ETH'] || 0,
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
            change: changes24h[token.symbol] || 0,
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
            change: changes24h[token.symbol] || 0,
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
        change: changes24h['MATIC'] || 0,
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
            change: changes24h[token.symbol] || 0,
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
            change: changes24h[customToken.symbol] || 0,
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