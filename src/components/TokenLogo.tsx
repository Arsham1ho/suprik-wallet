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
const failedLogos = new Set<string>(); // Track logos that failed to load

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

  // Meme coins - Solana
  'BONK': 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  'WIF': 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
  'POPCAT': 'https://assets.coingecko.com/coins/images/35824/large/popcat.jpg',
  'MEW': 'https://assets.coingecko.com/coins/images/36436/large/mew.png',
  'BOME': 'https://assets.coingecko.com/coins/images/36071/large/bome.jpg',
  'W': 'https://assets.coingecko.com/coins/images/35087/large/wormhole_logo_full_color_rgb_2k.png',
  'TRUMP': 'https://assets.coingecko.com/coins/images/53746/large/official_trump.jpg',
  'FARTCOIN': 'https://assets.coingecko.com/coins/images/52517/large/Fartcoin.png',
  'AI16Z': 'https://assets.coingecko.com/coins/images/52350/large/ai16z.jpg',
  'PENGU': 'https://assets.coingecko.com/coins/images/52563/large/pudgy.jpg',
  'PNUT': 'https://assets.coingecko.com/coins/images/51632/large/pnut.png',
  'GOAT': 'https://assets.coingecko.com/coins/images/51418/large/goatseus_maximus.jpg',
  'GIGA': 'https://assets.coingecko.com/coins/images/37620/large/Giga.png',
  'MOODENG': 'https://assets.coingecko.com/coins/images/50305/large/moo_deng.png',
  'CHILLGUY': 'https://assets.coingecko.com/coins/images/51761/large/chillguy.png',
  'SPX': 'https://assets.coingecko.com/coins/images/31401/large/spx6900.jpg',
  'GRASS': 'https://assets.coingecko.com/coins/images/40143/large/grass.jpg',
  'BRETT': 'https://assets.coingecko.com/coins/images/35529/large/brett.jpg',

  // Other L1/L2 tokens
  'APT': 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  'SUI': 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  'SEI': 'https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
  'TIA': 'https://assets.coingecko.com/coins/images/31967/large/tia.jpg',
  'INJ': 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  'FTM': 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'NEAR': 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
  'ATOM': 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  'DOT': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg',
  'AAVE': 'https://assets.coingecko.com/coins/images/12645/large/aave-token-round.png',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/large/arb.jpg',
  'OP': 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  'PEPE': 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  'SHIB': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  'LTC': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',

  // Parabolic AI tokens
  'PAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAB': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',

  // Suprana
  'SUPRA': 'https://assets.coingecko.com/coins/images/36611/large/suprana.jpg',
};

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

  try {
    // Jupiter Token API - works for ANY Solana token
    const response = await fetch(`https://token.jup.ag/strict`, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const tokens = await response.json();
      // Cache all tokens for future use
      tokens.forEach((token: any) => {
        if (token.address && token.logoURI) {
          jupiterLogoCache[token.address] = token.logoURI;
        }
      });

      if (jupiterLogoCache[mint]) {
        return jupiterLogoCache[mint];
      }
    }

    // Try single token lookup as fallback
    const singleResponse = await fetch(`https://token.jup.ag/all`);
    if (singleResponse.ok) {
      const allTokens = await singleResponse.json();
      const token = allTokens.find((t: any) => t.address === mint);
      if (token?.logoURI) {
        jupiterLogoCache[mint] = token.logoURI;
        return token.logoURI;
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
  const fetchedRef = useRef(false);

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

  // 1. PRIMARY: Use provided logoUrl (from CoinGecko API or registry)
  if (providedLogoUrl && providedLogoUrl.length > 0) {
    imageSources.push(providedLogoUrl);
  }

  // 2. SECONDARY: Check if token has a direct logo mapping by symbol
  if (actualSymbol && TOKEN_LOGO_MAP[actualSymbol.toUpperCase()]) {
    const mappedUrl = TOKEN_LOGO_MAP[actualSymbol.toUpperCase()];
    if (!imageSources.includes(mappedUrl)) {
      imageSources.push(mappedUrl);
    }
  }

  // 3. Jupiter cached logo (fetched dynamically)
  if (jupiterLogo && !imageSources.includes(jupiterLogo)) {
    imageSources.push(jupiterLogo);
  }

  // 4. Solana Token List - For SPL tokens with mint address
  if (actualMint && actualMint.length > 30 && !['solana', 'ethereum', 'bitcoin', 'polygon'].includes(actualMint)) {
    const solanaUrl = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${actualMint}/logo.png`;
    if (!imageSources.includes(solanaUrl)) {
      imageSources.push(solanaUrl);
    }
  }

  // 5. CoinGecko by ID if available
  if (coinGeckoId) {
    imageSources.push(`https://assets.coingecko.com/coins/images/${coinGeckoId}/large/${coinGeckoId}.png`);
  }

  // 6. CryptoCompare as last resort
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
