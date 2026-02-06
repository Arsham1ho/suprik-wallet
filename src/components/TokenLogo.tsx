import React, { useState, useEffect, useRef } from 'react';

interface Token {
  logoUrl?: string;
  logo?: string;
  name: string;
  color?: string;
  symbol?: string;
  coinGeckoId?: string;
}

interface TokenLogoProps {
  logoUrl?: string;
  logo?: string;
  name?: string;
  color?: string;
  symbol?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  token?: Token;
  coinGeckoId?: string;
  mint?: string; // SPL token mint address for Solana tokens
}

// Parabolic AI token symbols
const PARABOLIC_TOKENS = ['PARAI', 'PAI', 'PARAB'];

// In-memory cache for Jupiter token logos (persists during session)
const jupiterLogoCache: Record<string, string> = {};
const jupiterSymbolCache: Record<string, string> = {}; // Cache by symbol
const failedLogos = new Set<string>(); // Track logos that failed to load
let jupiterListLoaded = false;

// Pre-fetch Jupiter token list at startup for better logo coverage
async function preloadJupiterLogos(): Promise<void> {
  if (jupiterListLoaded) return;

  try {
    console.log('[TokenLogo] 🚀 Pre-loading Jupiter token list...');
    // Use "all" endpoint to get ALL tokens including meme coins
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://token.jup.ag/all', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const tokens = await response.json();
      let loadedCount = 0;
      tokens.forEach((token: { address: string; logoURI?: string; symbol?: string }) => {
        if (token.address && token.logoURI) {
          jupiterLogoCache[token.address] = token.logoURI;
          if (token.symbol) {
            // Only set symbol cache if not already set (first match wins)
            if (!jupiterSymbolCache[token.symbol.toUpperCase()]) {
              jupiterSymbolCache[token.symbol.toUpperCase()] = token.logoURI;
            }
          }
          loadedCount++;
        }
      });
      jupiterListLoaded = true;
      console.log(`[TokenLogo] ✅ Loaded ${loadedCount} logos from Jupiter (${Object.keys(jupiterSymbolCache).length} unique symbols)`);
    }
  } catch (error) {
    // Silently fail - Jupiter API may be unavailable, we'll rely on hardcoded logos
    console.log('[TokenLogo] Jupiter API unavailable, using hardcoded logos');
    jupiterListLoaded = true; // Mark as loaded so we don't keep retrying
  }
}

// Start preloading in background (don't block rendering)
setTimeout(() => preloadJupiterLogos(), 100);

// Token logo mapping - Direct CDN URLs for major tokens
const TOKEN_LOGO_MAP: Record<string, string> = {
  // Major coins
  'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  'USDT': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'BTC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'BNB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  'MATIC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',

  // Solana DeFi tokens
  'JUP': 'https://static.jup.ag/jup/icon.png',
  'RAY': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  'JTO': 'https://assets.coingecko.com/coins/images/33228/large/jto.png',
  'PYTH': 'https://assets.coingecko.com/coins/images/31924/large/pyth.png',
  'RENDER': 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  'HNT': 'https://assets.coingecko.com/coins/images/4284/large/Helium_HNT.png',
  'ORCA': 'https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png',
  'MSOL': 'https://assets.coingecko.com/coins/images/17752/large/mSOL.png',
  'JITOSOL': 'https://assets.coingecko.com/coins/images/28046/large/JitoSOL-200.png',

  // Meme coins - Solana (using reliable CoinGecko CDN URLs)
  'BONK': 'https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg',
  'WIF': 'https://coin-images.coingecko.com/coins/images/33566/large/dogwifhat.jpg',
  'POPCAT': 'https://coin-images.coingecko.com/coins/images/33760/large/image.jpg?1702964227',
  'MEW': 'https://coin-images.coingecko.com/coins/images/36440/large/MEW.png?1711442286',
  'BOME': 'https://coin-images.coingecko.com/coins/images/36071/large/bome.png?1710407255',
  'W': 'https://coin-images.coingecko.com/coins/images/35087/large/W_Token_%283%29.png?1758122686',
  'TRUMP': 'https://coin-images.coingecko.com/coins/images/53746/large/trump.png?1737171561',
  'FARTCOIN': 'https://coin-images.coingecko.com/coins/images/50891/large/fart.jpg?1729503972',
  'AI16Z': 'https://coin-images.coingecko.com/coins/images/51090/large/AI16Z.jpg?1730027175',
  'PENGU': 'https://coin-images.coingecko.com/coins/images/52622/large/PUDGY_PENGUINS_PENGU_PFP.png?1733809110',
  'PNUT': 'https://coin-images.coingecko.com/coins/images/51301/large/Peanut_the_Squirrel.png?1734941241',
  'GOAT': 'https://coin-images.coingecko.com/coins/images/50717/large/GOAT_LOGO_NEW.jpg?1731292759',
  'GIGA': 'https://coin-images.coingecko.com/coins/images/34755/large/IMG_0015.png?1705957165',
  'MOODENG': 'https://coin-images.coingecko.com/coins/images/50264/large/MOODENG.jpg?1726726975',
  'CHILLGUY': 'https://coin-images.coingecko.com/coins/images/52317/large/chillguy_icon_200x200.jpg?1741426676',
  'SPX': 'https://coin-images.coingecko.com/coins/images/31401/large/centeredcoin_%281%29.png?1737048493',
  'GRASS': 'https://coin-images.coingecko.com/coins/images/40094/large/Grass.jpg?1725697048',
  'BRETT': 'https://coin-images.coingecko.com/coins/images/33747/large/ogbretttttttt.jpg?1703454425',
  'VIRTUAL': 'https://coin-images.coingecko.com/coins/images/34057/large/LOGOMARK.png?1708356054',
  'ZEREBRO': 'https://coin-images.coingecko.com/coins/images/51289/large/zerebro_2.png?1730588883',
  'FWOG': 'https://coin-images.coingecko.com/coins/images/39453/large/fwog.png?1722318442',
  'AIXBT': 'https://coin-images.coingecko.com/coins/images/51784/large/3.png?1731981138',
  'ARC': 'https://coin-images.coingecko.com/coins/images/52701/large/u312bPNA_400x400.jpg?1734044765',
  'GRIFFAIN': 'https://coin-images.coingecko.com/coins/images/52547/large/griffain.jpg?1733946553',
  'ACT': 'https://coin-images.coingecko.com/coins/images/50984/large/ai_prophecy.jpg?1729653897',

  // L1/L2 tokens with reliable URLs
  'SEI': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/sei/images/sei.png',
  'TIA': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/celestia/images/celestia.png',

  // Other L1/L2 tokens
  'APT': 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  'SUI': 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  'INJ': 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  'FTM': 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'NEAR': 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
  'ATOM': 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  'DOT': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  'LINK': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  'UNI': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  'AAVE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/large/arb.jpg',
  'OP': 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  'PEPE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
  'SHIB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  'LTC': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',

  // DeFi tokens
  'LDO': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32/logo.png',
  'WBTC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  'DAI': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EescdeCB5BE1458D/logo.png',
  'MKR': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png',
  'CRV': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
  'COMP': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png',
  'SNX': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F/logo.png',
  'SUSHI': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B3595068778DD592e39A122f4f5a5cF09C90fE2/logo.png',
  '1INCH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x111111111117dC0aa78b770fA6A738034120C302/logo.png',

  // Parabolic AI tokens
  'PAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAB': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',

  // Suprana
  'SUPRA': 'https://cdn.prod.website-files.com/686dcacdb4c6c4915a600eb7/686dcf27eb9628bb737f3939_Suprana4-transparent-200x200x.png',

  // Additional tokens - Using coin-images.coingecko.com which has better CORS support
  'JLP': 'https://static.jup.ag/jlp/icon.png',
  'PRCL': 'https://coin-images.coingecko.com/coins/images/37078/large/ParclToken.png?1737478326',
  'TNSR': 'https://coin-images.coingecko.com/coins/images/35972/large/tnsr.png?1712687367',
  'KMNO': 'https://coin-images.coingecko.com/coins/images/35801/large/Kamino_200x200.png?1767944671',
  'DRIFT': 'https://coin-images.coingecko.com/coins/images/37509/large/DRIFT.png?1715842607',
  'IO': 'https://coin-images.coingecko.com/coins/images/36559/large/io.png',
  'CLOUD': 'https://coin-images.coingecko.com/coins/images/38485/large/CLOUD_128x128.png?1721331750',
  'ZETA': 'https://coin-images.coingecko.com/coins/images/26718/large/Twitter_icon.png?1696525788',
  'ALT': 'https://coin-images.coingecko.com/coins/images/34608/large/Logomark_200x200.png?1715107868',
  'PIXEL': 'https://coin-images.coingecko.com/coins/images/35100/large/pixel-icon.png?1708339519',
  'PORTAL': 'https://coin-images.coingecko.com/coins/images/35436/large/portal.jpeg?1708590254',
  'AEVO': 'https://coin-images.coingecko.com/coins/images/35893/large/aevo.png?1710138340',
  'STRK': 'https://coin-images.coingecko.com/coins/images/26433/large/starknet.png?1696525507',
  'SAGA': 'https://coin-images.coingecko.com/coins/images/25691/large/zcPXETKs_400x400.jpg?1696524818',
  'OMNI': 'https://coin-images.coingecko.com/coins/images/36465/large/Symbol-Color.png?1711511095',
  'ENA': 'https://coin-images.coingecko.com/coins/images/36530/large/ethena.png?1711701436',
  'DYM': 'https://coin-images.coingecko.com/coins/images/34182/large/dym.png?1704253006',
  'MANTA': 'https://coin-images.coingecko.com/coins/images/34289/large/manta.jpg?1704468717',
  'WEN': 'https://coin-images.coingecko.com/coins/images/34856/large/wen-logo-new.jpg?1741334229',
  'MOBILE': 'https://coin-images.coingecko.com/coins/images/29879/large/Mobile_Icon.png?1696528804',
  'HONEY': 'https://coin-images.coingecko.com/coins/images/28388/large/honey.png?1696527388',
  'BLZE': 'https://coin-images.coingecko.com/coins/images/28392/large/blze.png?1696527391',
  'STEP': 'https://coin-images.coingecko.com/coins/images/14988/large/step.png?1696514662',
  'SAMO': 'https://coin-images.coingecko.com/coins/images/15051/large/IXeEj5e.png?1696514710',
  'MNDE': 'https://coin-images.coingecko.com/coins/images/18867/large/c1.png?1750668234',
  'BSOL': 'https://coin-images.coingecko.com/coins/images/26636/large/blazesolana.png?1696525709',
  'LST': 'https://coin-images.coingecko.com/coins/images/32977/large/lst_%281%29.png?1700070841',
  'INF': 'https://coin-images.coingecko.com/coins/images/33682/large/inf.png',
  'DUAL': 'https://coin-images.coingecko.com/coins/images/25746/large/dual.png',
  'MEDIA': 'https://coin-images.coingecko.com/coins/images/15142/large/media50x50.png?1696514798',
  'ATLAS': 'https://coin-images.coingecko.com/coins/images/17659/large/Icon_Reverse.png?1696517190',
  'POLIS': 'https://coin-images.coingecko.com/coins/images/17789/large/POLIS.jpg?1696517312',
  'FIDA': 'https://coin-images.coingecko.com/coins/images/13395/large/bonfida.png?1696513157',
  'SRM': 'https://coin-images.coingecko.com/coins/images/11970/large/serum-logo.png?1696511829',
  'GENE': 'https://coin-images.coingecko.com/coins/images/20360/large/gene-token.png?1696519768',
  'SHDW': 'https://coin-images.coingecko.com/coins/images/22271/large/Property_1_Color.png?1696521615',
  'SLND': 'https://coin-images.coingecko.com/coins/images/19573/large/logo.webp?1733979407',
  'PORT': 'https://coin-images.coingecko.com/coins/images/17607/large/d-k0Ezts_400x400.jpg?1696517139',
  'TULIP': 'https://coin-images.coingecko.com/coins/images/15764/large/TqrUdBG.png?1696515389',
};

// Transform CoinGecko URLs to the CORS-friendly CDN
function transformImageUrl(url: string): string {
  if (!url) return url;
  // Convert assets.coingecko.com to coin-images.coingecko.com for better CORS support
  if (url.includes('assets.coingecko.com')) {
    return url.replace('assets.coingecko.com', 'coin-images.coingecko.com');
  }
  return url;
}

// Generate a consistent color based on symbol for fallback
const getSymbolColor = (symbol: string): string => {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
    'from-teal-500 to-cyan-500',
    'from-fuchsia-500 to-pink-500',
  ];

  // Create a simple hash from the symbol
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Fetch logo from Jupiter API for any Solana token
async function fetchJupiterLogo(mint: string): Promise<string | null> {
  // Check cache first
  if (jupiterLogoCache[mint]) {
    return jupiterLogoCache[mint];
  }

  // Don't retry if we already know it failed
  if (failedLogos.has(mint)) {
    return null;
  }

  // Wait for preload if it's in progress
  if (!jupiterListLoaded) {
    await preloadJupiterLogos();
    if (jupiterLogoCache[mint]) {
      return jupiterLogoCache[mint];
    }
  }

  try {
    // Try single token lookup from "all" list (includes non-strict tokens)
    const response = await fetch(`https://token.jup.ag/all`);
    if (response.ok) {
      const allTokens = await response.json();
      // Cache all tokens for future use
      allTokens.forEach((token: { address: string; logoURI?: string; symbol?: string }) => {
        if (token.address && token.logoURI) {
          jupiterLogoCache[token.address] = token.logoURI;
          if (token.symbol) {
            jupiterSymbolCache[token.symbol.toUpperCase()] = token.logoURI;
          }
        }
      });

      if (jupiterLogoCache[mint]) {
        return jupiterLogoCache[mint];
      }
    }
  } catch (error) {
    console.warn(`[TokenLogo] Jupiter API error for ${mint}:`, error);
  }

  failedLogos.add(mint);
  return null;
}

export function TokenLogo({ logoUrl, logo, name, color, symbol, size = 'md', token, coinGeckoId, mint }: TokenLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [jupiterLogo, setJupiterLogo] = useState<string | null>(null);
  const [isLoadingJupiter, setIsLoadingJupiter] = useState(false);
  const [jupiterCacheReady, setJupiterCacheReady] = useState(jupiterListLoaded);
  const fetchedRef = useRef(false);

  // Wait for Jupiter cache to be ready
  useEffect(() => {
    if (!jupiterListLoaded) {
      const checkInterval = setInterval(() => {
        if (jupiterListLoaded) {
          setJupiterCacheReady(true);
          clearInterval(checkInterval);
        }
      }, 100);
      // Cleanup and timeout after 5 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        setJupiterCacheReady(true); // Proceed anyway
      }, 5000);
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, []);

  // If token object is provided, use its properties
  const actualSymbol = symbol || token?.symbol;
  const providedLogoUrl = logoUrl || token?.logoUrl;
  const actualMint = mint || (token as any)?.mint;

  const actualLogo = logo || token?.logo || (actualSymbol ? actualSymbol.charAt(0).toUpperCase() : '?');
  const actualName = name || token?.name || 'Token';
  const actualColor = color || token?.color || (actualSymbol ? getSymbolColor(actualSymbol) : 'from-purple-600 to-purple-500');

  // Build fallback image chain with multiple CDNs
  const imageSources: string[] = [];

  // SPECIAL CASE: Parabolic AI tokens - Always use official logo first
  if (actualSymbol && PARABOLIC_TOKENS.includes(actualSymbol.toUpperCase())) {
    imageSources.push('https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png');
  }

  // 1. PRIMARY: Check if token has a direct logo mapping by symbol (most reliable)
  if (actualSymbol && TOKEN_LOGO_MAP[actualSymbol.toUpperCase()]) {
    imageSources.push(TOKEN_LOGO_MAP[actualSymbol.toUpperCase()]);
  }

  // 2. Jupiter pre-cached logo by symbol (from strict list)
  if (actualSymbol && jupiterSymbolCache[actualSymbol.toUpperCase()] && !imageSources.includes(jupiterSymbolCache[actualSymbol.toUpperCase()])) {
    imageSources.push(jupiterSymbolCache[actualSymbol.toUpperCase()]);
  }

  // 3. Jupiter cached logo by mint address
  if (actualMint && jupiterLogoCache[actualMint] && !imageSources.includes(jupiterLogoCache[actualMint])) {
    imageSources.push(jupiterLogoCache[actualMint]);
  }

  // 4. Use provided logoUrl (from CoinGecko API or registry) as fallback
  if (providedLogoUrl && providedLogoUrl.length > 0) {
    const transformedUrl = transformImageUrl(providedLogoUrl);
    if (!imageSources.includes(transformedUrl)) {
      imageSources.push(transformedUrl);
    }
  }

  // 5. Jupiter cached logo (fetched dynamically via useEffect)
  if (jupiterLogo && !imageSources.includes(jupiterLogo)) {
    imageSources.push(jupiterLogo);
  }

  // 6. Solana Token List - For SPL tokens with mint address
  if (actualMint && actualMint.length > 30 && !['solana', 'ethereum', 'bitcoin', 'polygon'].includes(actualMint)) {
    const solanaUrl = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${actualMint}/logo.png`;
    if (!imageSources.includes(solanaUrl)) {
      imageSources.push(solanaUrl);
    }
  }

  // 7. CoinGecko by ID if available
  if (coinGeckoId) {
    imageSources.push(`https://assets.coingecko.com/coins/images/${coinGeckoId}/large/${coinGeckoId}.png`);
  }

  // 8. CryptoCompare as last resort
  if (actualSymbol) {
    imageSources.push(`https://www.cryptocompare.com/media/37746251/${actualSymbol.toLowerCase()}.png`);
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  // Fetch Jupiter logo for unknown tokens with mint address
  useEffect(() => {
    if (fetchedRef.current) return;

    // Only fetch if we have a mint address and no good logo sources
    const hasGoodSource = providedLogoUrl || (actualSymbol && TOKEN_LOGO_MAP[actualSymbol.toUpperCase()]);

    if (actualMint && actualMint.length > 30 && !hasGoodSource && !jupiterLogoCache[actualMint]) {
      fetchedRef.current = true;
      setIsLoadingJupiter(true);

      fetchJupiterLogo(actualMint).then(logo => {
        if (logo) {
          setJupiterLogo(logo);
        }
        setIsLoadingJupiter(false);
      });
    } else if (actualMint && jupiterLogoCache[actualMint]) {
      setJupiterLogo(jupiterLogoCache[actualMint]);
    }
  }, [actualMint, providedLogoUrl, actualSymbol]);

  // Reset image error when props change
  useEffect(() => {
    setImageError(false);
    setCurrentImageIndex(0);
  }, [providedLogoUrl, actualSymbol, jupiterLogo]);

  // Handle image error - try next fallback
  const handleImageError = () => {
    if (currentImageIndex < imageSources.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setImageError(true);
    }
  };

  // Render logo content
  let logoContent: React.ReactNode;

  if (imageSources.length > 0 && !imageError && currentImageIndex < imageSources.length) {
    // Use image from sources with fallback chain
    const currentSource = imageSources[currentImageIndex];

    logoContent = (
      <img
        key={`${actualSymbol}-${currentImageIndex}-${currentSource}`}
        src={currentSource}
        alt={actualName}
        className="w-full h-full object-cover"
        onError={handleImageError}
        loading="lazy"
      />
    );
  } else {
    // Fallback to gradient with letter - now with consistent colors per symbol
    const isPARAI = actualSymbol && PARABOLIC_TOKENS.includes(actualSymbol.toUpperCase());
    const fallbackColor = isPARAI ? 'from-cyan-400 via-blue-500 to-purple-600' : actualColor;

    logoContent = (
      <div
        className={`w-full h-full bg-gradient-to-br ${fallbackColor} flex items-center justify-center text-white font-bold ${isPARAI ? 'shadow-lg shadow-cyan-500/30' : ''}`}
      >
        {actualLogo}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden shadow-lg relative bg-slate-800`}>
      {isLoadingJupiter && imageSources.length === 0 ? (
        <div className={`w-full h-full bg-gradient-to-br ${actualColor} flex items-center justify-center text-white font-bold animate-pulse`}>
          {actualLogo}
        </div>
      ) : (
        logoContent
      )}
    </div>
  );
}
