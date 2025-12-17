import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

// Token logo mapping - Direct CDN URLs for major tokens
const TOKEN_LOGO_MAP: Record<string, string> = {
  'SOL': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  'USDT': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'BTC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'BNB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  'BONK': 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  'WIF': 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
  'JUP': 'https://static.jup.ag/jup/icon.png',
  'RAY': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  'MATIC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  // Parabolic AI tokens
  'PAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAB': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
  'PARAI': 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
};

// Fallback logo sources - Multiple CDNs for maximum coverage
const FALLBACK_SOURCES = {
  // CryptoLogos.cc - High quality crypto logos
  cryptoLogos: (symbol: string) => `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`,
  
  // CoinGecko CDN - Large image (higher quality)
  coinGeckoLarge: (id: string) => `https://assets.coingecko.com/coins/images/${id}/large/${id}.png`,
  
  // CoinGecko CDN - Small image (faster loading)
  coinGeckoSmall: (id: string) => `https://assets.coingecko.com/coins/images/${id}/small/${id}.png`,
  
  // Alternative: Coin icon from common CDN
  cryptoCompare: (symbol: string) => `https://www.cryptocompare.com/media/37746251/${symbol.toLowerCase()}.png`,
  
  // Trust Wallet Assets (very comprehensive)
  trustWallet: (symbol: string) => `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/logo.png`,
  
  // Solana Token List (for SPL tokens)
  solanaTokenList: (mint: string) => `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
};

export function TokenLogo({ logoUrl, logo, name, color, symbol, size = 'md', token, coinGeckoId, mint }: TokenLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string | null>(null);
  
  // If token object is provided, use its properties
  const actualSymbol = symbol || token?.symbol;
  const providedLogoUrl = logoUrl || token?.logoUrl;
  const actualCoinGeckoId = coinGeckoId || token?.coinGeckoId;
  const actualMint = mint || (token as any)?.mint;
  
  const actualLogo = logo || token?.logo || (actualSymbol ? actualSymbol.charAt(0).toUpperCase() : '?');
  const actualName = name || token?.name || 'Token';
  const actualColor = color || token?.color || 'from-purple-600 to-purple-500';
  
  // Build fallback image chain with multiple CDNs
  const imageSources: string[] = [];
  
  // SPECIAL CASE: Parabolic AI tokens - Always use official logo first
  if (actualSymbol && PARABOLIC_TOKENS.includes(actualSymbol.toUpperCase())) {
    imageSources.push('https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png');
  }
  
  // 1. PRIMARY: Use provided logoUrl (from CoinGecko API - this is already the full URL)
  if (providedLogoUrl) {
    imageSources.push(providedLogoUrl);
  }
  
  // 2. SECONDARY: Check if token has a direct logo mapping
  if (actualSymbol && TOKEN_LOGO_MAP[actualSymbol.toUpperCase()]) {
    imageSources.push(TOKEN_LOGO_MAP[actualSymbol.toUpperCase()]);
  }
  
  // 3. Solana Token List - For SPL tokens with mint address
  if (actualMint && actualMint !== 'solana' && actualMint !== 'ethereum' && actualMint !== 'bitcoin') {
    imageSources.push(FALLBACK_SOURCES.solanaTokenList(actualMint));
  }
  
  // 4. CryptoLogos.cc - Very reliable for major coins
  if (actualSymbol) {
    const majorTokens = [
      'BTC', 'ETH', 'SOL', 'USDC', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 
      'MATIC', 'DOT', 'LINK', 'UNI', 'ATOM', 'LTC', 'AVAX', 'SHIB', 
      'BCH', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP', 'FIL', 'APT', 'ARB',
      'OP', 'MKR', 'AAVE', 'SNX', 'CRV', 'COMP', 'SUSHI', 'YFI',
      'BONK', 'WIF', 'PEPE', 'FLOKI', 'SAND', 'MANA', 'AXS', 'GALA',
      'TRX', 'DOGE', 'WBTC', 'WETH', 'WBT', 'HYPE', 'BCH'
    ];
    if (majorTokens.includes(actualSymbol.toUpperCase())) {
      imageSources.push(FALLBACK_SOURCES.cryptoLogos(actualSymbol));
    }
  }
  
  // 5. CryptoCompare - Another fallback
  if (actualSymbol) {
    imageSources.push(FALLBACK_SOURCES.cryptoCompare(actualSymbol));
  }
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl'
  };
  
  const symbolUpper = actualSymbol?.toUpperCase();
  
  // Reset image error when logoUrl changes
  useEffect(() => {
    setImageError(false);
    setCurrentImageIndex(0);
  }, [providedLogoUrl, actualSymbol]);
  
  // Handle image error - try next fallback
  const handleImageError = () => {
    if (currentImageIndex < imageSources.length - 1) {
      console.log(`[TokenLogo] Image failed for ${actualSymbol} at URL: ${imageSources[currentImageIndex]}, trying fallback ${currentImageIndex + 1}`);
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      console.log(`[TokenLogo] All images failed for ${actualSymbol}. Tried ${imageSources.length} sources:`, imageSources);
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
        key={`${actualSymbol}-${currentImageIndex}`}
        src={currentSource}
        alt={actualName}
        className="w-full h-full object-cover"
        onError={handleImageError}
        loading="lazy"
      />
    );
  } else {
    // Fallback to gradient with letter
    // Special styling for Parabolic AI tokens
    const isPARAI = actualSymbol && PARABOLIC_TOKENS.includes(actualSymbol.toUpperCase());
    const fallbackColor = isPARAI ? 'from-cyan-400 via-blue-500 to-purple-600' : actualColor;
    
    logoContent = (
      <div 
        className={`w-full h-full bg-gradient-to-br ${fallbackColor} flex items-center justify-center text-white shadow-inner ${isPARAI ? 'shadow-lg shadow-cyan-500/30' : ''}`}
      >
        {actualLogo}
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden shadow-lg relative`}>
      {logoContent}
      {actualSymbol === 'BONK' && size === 'md' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 z-10">
          <span className="text-[8px]">📄</span>
        </div>
      )}
    </div>
  );
}