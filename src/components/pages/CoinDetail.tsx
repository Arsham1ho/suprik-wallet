import React, { useState, useEffect } from 'react';
import { ArrowLeft, LayoutGrid, QrCode, DollarSign, Share2, MoreHorizontal, ExternalLink, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { TokenLogo } from '../TokenLogo';
import { TokenReceiveDialog } from '../TokenReceiveDialog';
import { PlanetAvatar } from '../PlanetAvatar';
import { AnimalAvatar } from '../AnimalAvatar';
import { toast } from 'sonner';
import { copyToClipboard } from '../../utils/clipboard';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { getCoinGeckoId, getTokenPrice, getTokenChart } from '../../utils/coingecko';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import type { Token } from './Home';

interface CoinDetailProps {
  token: Token;
  onBack: () => void;
  walletId: string;
  onNavigateToSend?: (token: Token) => void;
}

interface CoinDetails {
  mint: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changeAmount: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  description: string;
  website: string;
  twitter: string;
  chartData: Array<{ time: string; price: number }>;
}

type TimePeriod = '1H' | '1D' | '1W' | '1M' | 'YTD';

export function CoinDetail({ token, onBack, walletId, onNavigateToSend }: CoinDetailProps) {
  const { formatPrice, convertPrice } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ time: string; price: number; x: number; y: number } | null>(null);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // User profile state
  const [userProfile, setUserProfile] = useState<{
    username: string;
    walletName: string;
  }>({
    username: '@Saturn',
    walletName: 'Account 1',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{network: string, lastCheck: string} | null>(null);

  useEffect(() => {
    fetchCoinDetails();
  }, [token.mint]);

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
    
    // Listen for profile picture updates
    const handleProfileUpdate = () => {
      console.log('[CoinDetail] Profile picture updated, refreshing...');
      fetchUserProfile();
    };
    
    window.addEventListener('profilePictureUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
    };
  }, [walletId]);

  // Refetch when period changes - ALWAYS refetch to get new chart data
  useEffect(() => {
    console.log(`[CoinDetail] ⏱️ Period changed to ${selectedPeriod}, fetching new chart data...`);
    fetchCoinDetails();
  }, [selectedPeriod]);

  // Auto-refresh price every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing coin price...');
      fetchCoinDetails(true); // Background refresh without loading state
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [token.mint, selectedPeriod]);

  // Fetch coin details from CoinGecko (primary) with DexScreener/Jupiter fallback
  const fetchCoinDetails = async (backgroundRefresh: boolean = false) => {
    try {
      // Don't show loading on background refresh
      if (!backgroundRefresh) {
        // Only show chart loading if we already have data (not initial load)
        if (coinDetails) {
          setChartLoading(true);
        } else {
          setLoading(true);
        }
      }

      console.log('[CoinDetail] Fetching coin details for:', {
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        existingPrice: token.price,
        existingChange: token.change,
        mintLength: token.mint?.length
      });

      // Start with token's existing price as fallback (from Search page or Home)
      const fallbackPrice = token.price || 0;
      const fallbackChange = token.change || 0;

      let price = 0;
      let change24h = 0;
      let marketCap = 0;
      let chartData: Array<{ time: string; price: number }> = [];

      // Check if mint is a Solana address (44 chars) or a CoinGecko ID
      const isSolanaMint = token.mint && token.mint.length >= 32 && token.mint.length <= 50;
      const isLikelyCoinGeckoId = token.mint && token.mint.length < 30 && !token.mint.includes('1111');

      // For Solana tokens, try Jupiter first (no rate limits, most reliable for Solana)
      if (isSolanaMint && price === 0) {
        try {
          console.log(`[CoinDetail] Trying Jupiter v2 for ${token.symbol}...`);
          const jupResponse = await fetch(
            `https://api.jup.ag/price/v2?ids=${token.mint}`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (jupResponse.ok) {
            const jupData = await jupResponse.json();
            const priceData = jupData.data?.[token.mint];
            if (priceData?.price) {
              price = parseFloat(priceData.price);
              console.log(`[CoinDetail] ✅ Jupiter v2: ${token.symbol} = $${price}`);
            }
          }
        } catch (jupError) {
          console.warn('[CoinDetail] Jupiter v2 failed:', jupError);
        }
      }

      // Try DexScreener for Solana tokens (good fallback, no rate limits)
      if (isSolanaMint && price === 0) {
        try {
          console.log(`[CoinDetail] Trying DexScreener for ${token.symbol}...`);
          const dexResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${token.mint}`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (dexResponse.ok) {
            const dexData = await dexResponse.json();
            const pair = dexData.pairs?.[0];
            if (pair) {
              price = parseFloat(pair.priceUsd) || 0;
              change24h = pair.priceChange?.h24 || 0;
              marketCap = pair.marketCap || 0;
              console.log(`[CoinDetail] ✅ DexScreener: ${token.symbol} = $${price}, 24h: ${change24h}%`);
            }
          }
        } catch (dexError) {
          console.warn('[CoinDetail] DexScreener failed');
        }
      }

      // Try CoinGecko for price + 24h change (may be rate limited)
      if (price === 0) {
        // Get CoinGecko ID
        let coinGeckoId = await getCoinGeckoId(token.symbol, token.name);
        if (!coinGeckoId) {
          console.log(`[CoinDetail] Symbol not found, trying mint: ${token.mint}`);
          coinGeckoId = await getCoinGeckoId(token.mint, token.name);
        }
        // If mint looks like a CoinGecko ID, use it directly
        if (!coinGeckoId && isLikelyCoinGeckoId) {
          coinGeckoId = token.mint.toLowerCase();
          console.log(`[CoinDetail] Using mint as CoinGecko ID: ${coinGeckoId}`);
        }

        if (coinGeckoId) {
          console.log(`[CoinDetail] CoinGecko ID for ${token.symbol}: ${coinGeckoId}`);
          let priceData = await getTokenPrice(token.symbol, token.name);
          if (!priceData || priceData.price === 0) {
            priceData = await getTokenPrice(token.mint, token.name);
          }
          if (priceData && priceData.price > 0) {
            price = priceData.price;
            change24h = priceData.change24h;
            marketCap = priceData.marketCap;
            console.log(`[CoinDetail] ✅ CoinGecko: ${token.symbol} = $${price.toFixed(6)}, 24h: ${change24h.toFixed(2)}%`);
          }
        }
      }

      // Fallback: CoinCap API for non-Solana tokens (free, no rate limits)
      if (price === 0 && !isSolanaMint) {
        try {
          // CoinCap uses lowercase IDs like "bitcoin", "ethereum", "tron"
          const coinCapId = token.mint.toLowerCase().replace(/-/g, '');
          console.log(`[CoinDetail] Trying CoinCap for ${token.symbol} (${coinCapId})...`);
          const coinCapResponse = await fetch(
            `https://api.coincap.io/v2/assets/${coinCapId}`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (coinCapResponse.ok) {
            const coinCapData = await coinCapResponse.json();
            if (coinCapData.data?.priceUsd) {
              price = parseFloat(coinCapData.data.priceUsd);
              change24h = parseFloat(coinCapData.data.changePercent24Hr) || 0;
              marketCap = parseFloat(coinCapData.data.marketCapUsd) || 0;
              console.log(`[CoinDetail] ✅ CoinCap: ${token.symbol} = $${price.toFixed(6)}, 24h: ${change24h.toFixed(2)}%`);
            }
          }
        } catch (coinCapError) {
          console.warn('[CoinDetail] CoinCap failed:', coinCapError);
        }
      }

      // If we still have no price, try the fallback from Home page
      if (price === 0 && fallbackPrice > 0) {
        price = fallbackPrice;
        change24h = fallbackChange;
        console.log(`[CoinDetail] ⚠️ Using Home page price: $${price}`);
      }

      // Fetch chart data - CoinGecko primary, Jupiter fallback
      chartData = await fetchChartData(token.mint, selectedPeriod, price, change24h);

      // If we have chart data but no price change, calculate it from the chart
      if (chartData.length > 1 && (change24h === 0 || Math.abs(change24h) < 0.001)) {
        const firstPrice = chartData[0].price;
        const lastPrice = chartData[chartData.length - 1].price;
        if (firstPrice > 0) {
          change24h = ((lastPrice - firstPrice) / firstPrice) * 100;
          // Also update price from chart if needed
          if (price === 0 || Math.abs(price - lastPrice) / lastPrice > 0.1) {
            price = lastPrice;
          }
          console.log(`[CoinDetail] 📊 Calculated change from chart: ${change24h.toFixed(2)}%`);
        }
      }

      // If still no price, use the fallback from the token (Home page price)
      if (price === 0 && fallbackPrice > 0) {
        price = fallbackPrice;
        change24h = fallbackChange;
        console.log(`[CoinDetail] ⚠️ Using fallback price from Home: $${price}`);
      }

      // Log final result
      if (price === 0) {
        console.warn(`[CoinDetail] ❌ Could not fetch price for ${token.symbol} (${token.mint}) from any source`);
      }

      const details: CoinDetails = {
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        currentPrice: price,
        change24h: change24h,
        changeAmount: price * change24h / 100,
        marketCap: marketCap,
        totalSupply: 0,
        circulatingSupply: 0,
        description: `${token.name} (${token.symbol}) on Solana.`,
        website: '',
        twitter: '',
        chartData: chartData,
      };

      console.log(`[CoinDetail] ✅ Coin details loaded for ${token.symbol}:`, {
        price: details.currentPrice,
        change: details.change24h,
        chartPoints: details.chartData?.length || 0
      });

      setCoinDetails(details);
    } catch (error: any) {
      console.error('Error fetching coin details:', error);
      // Use fallback data from token props
      if (!coinDetails) {
        console.log('Using fallback data from token props');
        setCoinDetails({
          mint: token.mint,
          symbol: token.symbol,
          name: token.name,
          currentPrice: token.price || 0,
          change24h: token.change || 0,
          changeAmount: (token.price || 0) * (token.change || 0) / 100,
          marketCap: 0,
          totalSupply: 0,
          circulatingSupply: 0,
          description: `${token.name} (${token.symbol}) cryptocurrency details.`,
          website: '',
          twitter: '',
          chartData: generateFallbackChartData(token.price || 0, token.change || 0),
        });
      }
    } finally {
      if (!backgroundRefresh) {
        setLoading(false);
        setChartLoading(false);
      }
    }
  };

  // Fetch historical chart data - CoinGecko primary, Jupiter fallback
  const fetchChartData = async (
    mint: string,
    period: TimePeriod,
    currentPrice: number,
    change24h: number
  ): Promise<Array<{ time: string; price: number }>> => {
    try {
      // Map period to days for CoinGecko API
      const periodToDays: Record<TimePeriod, number> = {
        '1H': 1,      // CoinGecko minimum is 1 day, will filter to 1H
        '1D': 1,
        '1W': 7,
        '1M': 30,
        'YTD': Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
      };

      const days = periodToDays[period];

      // PRIMARY: Get CoinGecko chart using the utility (handles dynamic ID lookup)
      const chartData = await getTokenChart(mint, days, token.name);

      if (chartData.length > 0) {
        // For 1H period, filter to last hour only
        if (period === '1H') {
          const oneHourAgo = Date.now() - 3600000;
          const filtered = chartData.filter(p => new Date(p.time).getTime() >= oneHourAgo);
          if (filtered.length > 0) {
            console.log(`[CoinDetail] ✅ CoinGecko chart (1H filtered): ${filtered.length} points`);
            return filtered;
          }
        }
        console.log(`[CoinDetail] ✅ CoinGecko chart: ${chartData.length} points`);
        return chartData;
      }

      // FALLBACK: Jupiter Price History for tokens not on CoinGecko
      try {
        const periodConfig: Record<TimePeriod, { interval: string; seconds: number }> = {
          '1H': { interval: '1m', seconds: 3600 },
          '1D': { interval: '15m', seconds: 86400 },
          '1W': { interval: '1H', seconds: 604800 },
          '1M': { interval: '4H', seconds: 2592000 },
          'YTD': { interval: '1D', seconds: Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 1000) },
        };

        const config = periodConfig[period];
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - config.seconds;

        const jupiterHistoryUrl = `https://api.jup.ag/price/v2/history?id=${mint}&type=${config.interval}&time_from=${startTime}&time_to=${endTime}`;
        console.log(`[CoinDetail] Trying Jupiter history for ${token.symbol}`);

        const response = await fetch(jupiterHistoryUrl, {
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const jupChartData = data.data.map((item: { unixTime: number; value: number }) => ({
              time: new Date(item.unixTime * 1000).toISOString(),
              price: item.value,
            }));
            console.log(`[CoinDetail] ✅ Jupiter history: ${jupChartData.length} points`);
            return jupChartData;
          }
        }
      } catch (jupErr) {
        console.warn('[CoinDetail] Jupiter history failed:', jupErr);
      }

      // LAST FALLBACK: Synthetic data
      console.log('[CoinDetail] Using synthetic chart data');
      return generateFallbackChartData(currentPrice, change24h);
    } catch (error) {
      console.error('[CoinDetail] Chart data fetch failed:', error);
      return generateFallbackChartData(currentPrice, change24h);
    }
  };

  // Generate fallback chart data when API fails - creates realistic-looking variation
  const generateFallbackChartData = (currentPrice: number, change24h: number) => {
    const data = [];
    const now = Date.now();

    // Determine data points and interval based on selected period
    const periodSettings: Record<TimePeriod, { points: number; intervalMs: number }> = {
      '1H': { points: 60, intervalMs: 60000 },        // 1 point per minute
      '1D': { points: 48, intervalMs: 1800000 },      // 1 point per 30 min
      '1W': { points: 42, intervalMs: 14400000 },     // 1 point per 4 hours
      '1M': { points: 30, intervalMs: 86400000 },     // 1 point per day
      'YTD': { points: 52, intervalMs: 604800000 },   // 1 point per week
    };

    const settings = periodSettings[selectedPeriod] || periodSettings['1D'];
    const { points: dataPoints, intervalMs } = settings;

    // Calculate start price from change
    const effectiveChange = change24h || 0;
    const startPrice = currentPrice / (1 + effectiveChange / 100);
    const priceRange = currentPrice - startPrice;

    // Add natural-looking variation (±2% volatility)
    const volatility = currentPrice * 0.02;

    // Use a seeded random based on mint to get consistent charts for same token
    let seed = token.mint.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(now - (dataPoints - 1 - i) * intervalMs);
      const progress = i / (dataPoints - 1);

      // Base price following the trend
      let price = startPrice + priceRange * progress;

      // Add realistic variation (sine wave + noise)
      const sineWave = Math.sin(progress * Math.PI * 4) * volatility * 0.3;
      const noise = (seededRandom() - 0.5) * volatility * 0.5;
      price = price + sineWave + noise;

      // Ensure price stays positive
      price = Math.max(price, currentPrice * 0.001);

      data.push({
        time: timestamp.toISOString(),
        price: price,
      });
    }

    // Ensure the last point matches current price
    if (data.length > 0) {
      data[data.length - 1].price = currentPrice;
    }

    return data;
  };

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      console.log('[CoinDetail] Loading user profile from localStorage...');
      
      // In client-side architecture, profile data is in localStorage
      const username = localStorage.getItem('saturn_username') || '@suprik';
      const walletName = localStorage.getItem('saturn_wallet_name') || 'Suprik Wallet';
      const profilePicture = localStorage.getItem('saturn_profile_picture') || null;
      const solanaNetwork = localStorage.getItem('saturn_solana_network');
      
      setUserProfile({
        username,
        walletName,
      });
      setProfilePicture(profilePicture);
      
      if (solanaNetwork === 'devnet') {
        setNetworkStatus({
          network: 'devnet',
          lastCheck: new Date().toISOString()
        });
      } else {
        setNetworkStatus(null);
      }
      
      console.log('[CoinDetail] ✅ User profile loaded from localStorage');
    } catch (error: any) {
      console.error('[CoinDetail] Error loading user profile:', error);
      // Keep default values on error
    } finally {
      setProfileLoading(false);
    }
  };

  const handleShare = async () => {
    const currentPrice = coinDetails?.currentPrice || token.price || 0;
    const change24h = coinDetails?.change24h || token.change || 0;
    const changeSymbol = change24h >= 0 ? '+' : '';
    
    // Create shareable link
    const shareUrl = `${window.location.origin}/?token=${encodeURIComponent(token.mint)}`;
    
    // Format share text
    const shareText = `Check out ${token.name} (${token.symbol}) on Saturn Wallet 🪐
💰 Price: $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
📈 24h Change: ${changeSymbol}${change24h.toFixed(2)}%`;

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${token.name} (${token.symbol}) - Saturn Wallet`,
          text: shareText,
          url: shareUrl,
        });
        console.log('Shared successfully via Web Share API');
        return; // Successfully shared, exit
      } catch (error: any) {
        // Handle different error types
        if (error.name === 'AbortError') {
          // User cancelled the share - do nothing
          console.log('Share cancelled by user');
          return;
        }
        // For other errors (NotAllowedError, etc.), fall back to clipboard
        console.log('Web Share not available, falling back to clipboard');
      }
    }
    
    // Fallback to clipboard (either no Web Share API or it failed)
    const fullShareText = `${shareText}\n\n🔗 ${shareUrl}`;
    const success = await copyToClipboard(fullShareText);
    if (success) {
      toast.success('Token link copied to clipboard!');
    } else {
      toast.error('Failed to copy token link');
    }
  };

  // Detect network and get block explorer
  const getBlockExplorer = () => {
    const mintAddress = token.mint.toLowerCase();
    
    // Ethereum (0x address, 42 characters)
    if (mintAddress.startsWith('0x') && mintAddress.length === 42) {
      return {
        name: 'Etherscan',
        url: `https://etherscan.io/token/${token.mint}`,
        icon: ExternalLink
      };
    }
    
    // Polygon (0x address but different detection - you can add custom logic)
    // For now, treating all 0x as Ethereum, can be enhanced
    
    // Solana (base58, typically 32-44 characters, no 0x)
    if (!mintAddress.startsWith('0x')) {
      return {
        name: 'Solscan',
        url: `https://solscan.io/token/${token.mint}`,
        icon: ExternalLink
      };
    }
    
    // Default to Solscan
    return {
      name: 'Solscan',
      url: `https://solscan.io/token/${token.mint}`,
      icon: ExternalLink
    };
  };

  const blockExplorer = getBlockExplorer();

  const currentPrice = coinDetails?.currentPrice || token.price || 0;
  const change24h = coinDetails?.change24h || token.change || 0;
  const changeAmount = coinDetails?.changeAmount || 0;
  const chartData = coinDetails?.chartData || [];

  // Calculate chart path with padding for better visualization
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : currentPrice;
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : currentPrice;
  const priceRange = maxPrice - minPrice || 1;
  
  // Add 5% padding to top and bottom for better visualization
  const paddedMax = maxPrice + priceRange * 0.05;
  const paddedMin = minPrice - priceRange * 0.05;
  const paddedRange = paddedMax - paddedMin;

  const chartPath = (() => {
    if (chartData.length === 0) return 'M 0 50 L 100 50'; // Default flat line when no data

    const validPoints = chartData.filter(point =>
      point && typeof point.price === 'number' && !isNaN(point.price) && isFinite(point.price)
    );

    if (validPoints.length === 0) return 'M 0 50 L 100 50'; // Fallback if no valid points

    return validPoints.map((point, idx) => {
      const x = validPoints.length > 1 ? (idx / (validPoints.length - 1)) * 100 : 50;
      const y = paddedRange > 0 ? 100 - ((point.price - paddedMin) / paddedRange) * 100 : 50;
      // Ensure x and y are valid numbers
      const safeX = isNaN(x) || !isFinite(x) ? 50 : x;
      const safeY = isNaN(y) || !isFinite(y) ? 50 : y;
      return `${idx === 0 ? 'M' : 'L'} ${safeX} ${safeY}`;
    }).join(' ');
  })();

  // Handle chart hover with improved positioning
  const handleChartHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (chartData.length === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xPercent = (x / rect.width) * 100;
    
    // Clamp xPercent to valid range
    const clampedXPercent = Math.max(0, Math.min(100, xPercent));
    
    // Find nearest data point
    const index = Math.round((clampedXPercent / 100) * (chartData.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, chartData.length - 1));
    const point = chartData[clampedIndex];
    
    if (point && typeof point.price === 'number' && !isNaN(point.price)) {
      // Calculate x position - handle single data point case
      const xPos = chartData.length > 1 
        ? (clampedIndex / (chartData.length - 1)) * 100 
        : 50;
      
      // Calculate y position with validation
      let yPos = 50; // default to center
      if (paddedRange > 0 && !isNaN(paddedMin) && !isNaN(paddedRange)) {
        yPos = 100 - ((point.price - paddedMin) / paddedRange) * 100;
      }
      
      // Validate final values before setting state
      if (!isNaN(xPos) && !isNaN(yPos) && isFinite(xPos) && isFinite(yPos)) {
        setHoveredPoint({
          time: point.time,
          price: point.price,
          x: xPos,
          y: yPos,
        });
      }
    }
  };

  const handleChartLeave = () => {
    setHoveredPoint(null);
  };

  // Format numbers with intelligent precision
  const formatCurrency = (value: number) => {
    // Use the language context formatPrice for proper currency conversion
    return formatPrice(value);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    
    // Format based on selected period
    if (selectedPeriod === '1H' || selectedPeriod === '1D') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (selectedPeriod === '1W') {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return value.toLocaleString();
  };

  const stripHtml = (html: string) => {
    // Safely strip HTML tags using regex instead of innerHTML to prevent XSS
    // This removes all HTML tags while preserving text content
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&')  // Decode &amp;
      .replace(/&lt;/g, '<')   // Decode &lt;
      .replace(/&gt;/g, '>')   // Decode &gt;
      .replace(/&quot;/g, '"') // Decode &quot;
      .replace(/&#39;/g, "'")  // Decode &#39;
      .trim();
  };

  const truncateDescription = (text: string, maxLength: number = 200) => {
    const clean = stripHtml(text);
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength) + '...';
  };

  const balance24hReturn = token.amount * changeAmount;

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div className="px-4 pb-24">
        {/* Back Button & Title */}
        <div className="py-6">
          <motion.button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-900 rounded-lg transition-colors mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex items-center justify-center gap-3 mb-2">
            <TokenLogo 
              logoUrl={token.logoUrl}
              logo={token.logo}
              name={token.name}
              color={token.color}
              symbol={token.symbol}
              mint={token.mint}
              size="lg"
            />
            <h1 className="text-2xl font-semibold">{coinDetails?.name || token.name}</h1>
          </div>
        </div>

        {/* Price Display */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <>
              {/* Loading skeleton for price */}
              <div className="h-12 w-48 bg-slate-800/50 rounded-lg animate-pulse mx-auto mb-3" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-20 bg-slate-800/50 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-slate-800/50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-slate-800/50 rounded animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <motion.h2
                key={`price-${currentPrice.toFixed(6)}`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-6xl font-bold mb-3 token-price-amount"
              >
                {formatCurrency(currentPrice)}
              </motion.h2>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <motion.span
                    key={`change-${changeAmount.toFixed(6)}`}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`text-lg font-semibold ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {change24h >= 0 ? '+' : ''}{formatCurrency(changeAmount)}
                  </motion.span>
                  <motion.span
                    key={`percent-${change24h.toFixed(4)}`}
                    initial={{ opacity: 0.7, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`px-2 py-1 rounded-md text-sm font-semibold ${change24h >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                  >
                    {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                  </motion.span>
                </div>
                <span className="text-xs text-slate-500">Past {selectedPeriod}</span>
              </div>
            </>
          )}
        </motion.div>

        {/* Chart */}
        <motion.div
          className="mb-6 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading || chartData.length === 0 ? (
            <div className="h-64 bg-gradient-to-b from-slate-950/50 to-slate-900/30 rounded-2xl animate-pulse" />
          ) : (
            <motion.div 
              key={`chart-${selectedPeriod}`}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-64 relative cursor-crosshair bg-gradient-to-b from-slate-950/50 to-transparent rounded-2xl overflow-hidden p-4"
              onMouseMove={handleChartHover}
              onMouseLeave={handleChartLeave}
            >
              {chartLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400">Updating...</span>
                  </div>
                </div>
              )}
              
              {/* Hover Tooltip with smart positioning */}
              {hoveredPoint && (() => {
                // Calculate tooltip position to keep it within bounds
                // Tooltip is now smaller (~100px width), so adjust thresholds
                const isLeftSide = hoveredPoint.x < 15;
                const isRightSide = hoveredPoint.x > 70; // More conservative threshold
                const isCenterLeft = hoveredPoint.x >= 15 && hoveredPoint.x < 50;
                const isCenterRight = hoveredPoint.x >= 50 && hoveredPoint.x <= 70;
                
                let tooltipStyle: React.CSSProperties = {
                  top: hoveredPoint.y < 30 ? '20px' : 'auto',
                  bottom: hoveredPoint.y >= 30 ? '20px' : 'auto',
                };
                
                if (isLeftSide) {
                  // Left corner: position to the right of cursor
                  tooltipStyle.left = `${hoveredPoint.x}%`;
                  tooltipStyle.transform = 'translateX(12px)';
                } else if (isRightSide) {
                  // Right corner: position to the left of cursor
                  tooltipStyle.right = `${100 - hoveredPoint.x}%`;
                  tooltipStyle.transform = 'translateX(-12px)';
                } else if (isCenterLeft) {
                  // Center-left: position centered above cursor
                  tooltipStyle.left = `${hoveredPoint.x}%`;
                  tooltipStyle.transform = 'translateX(-50%)';
                } else {
                  // Center-right: position centered above cursor
                  tooltipStyle.left = `${hoveredPoint.x}%`;
                  tooltipStyle.transform = 'translateX(-50%)';
                }
                
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-lg px-2.5 py-1.5 shadow-2xl pointer-events-none backdrop-blur-xl whitespace-nowrap"
                    style={tooltipStyle}
                  >
                    <div className="text-[10px] text-purple-300 mb-0.5">{formatTime(hoveredPoint.time)}</div>
                    <div className="text-sm text-white">{formatCurrency(hoveredPoint.price)}</div>
                  </motion.div>
                );
              })()}
              
              {/* Price Labels and Time Range */}
              {!hoveredPoint && chartData.length > 0 && (
                <>
                  <motion.div 
                    key={`max-${maxPrice}`}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-2 right-2 text-[10px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm"
                  >
                    {formatCurrency(maxPrice)}
                  </motion.div>
                  <motion.div 
                    key={`min-${minPrice}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm"
                  >
                    {formatCurrency(minPrice)}
                  </motion.div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {formatTime(chartData[0].time)}
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {selectedPeriod}
                  </div>
                </>
              )}
              
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`chartGradient-${token.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={change24h >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={change24h >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="0.2"
                    opacity="0.3"
                  />
                ))}
                
                {/* Hover line */}
                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1="0"
                    x2={hoveredPoint.x}
                    y2="100"
                    stroke="#a78bfa"
                    strokeWidth="0.3"
                    strokeDasharray="2,2"
                    opacity="0.6"
                  />
                )}
                
                {/* Chart gradient fill */}
                <motion.path
                  key={`fill-${selectedPeriod}`}
                  d={`${chartPath || 'M 0 50 L 100 50'} L 100 100 L 0 100 Z`}
                  fill={`url(#chartGradient-${token.symbol})`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    d: `${chartPath || 'M 0 50 L 100 50'} L 100 100 L 0 100 Z`
                  }}
                  transition={{
                    opacity: { duration: 0.5, ease: "easeInOut" },
                    d: { duration: 0.6, ease: "easeInOut" }
                  }}
                />

                {/* Chart line */}
                <motion.path
                  key={`line-${selectedPeriod}`}
                  d={chartPath || 'M 0 50 L 100 50'}
                  stroke={change24h >= 0 ? '#10b981' : '#ef4444'}
                  strokeWidth="0.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                    d: chartPath || 'M 0 50 L 100 50'
                  }}
                  transition={{
                    pathLength: { duration: 0.8, ease: "easeInOut" },
                    opacity: { duration: 0.5, ease: "easeInOut" },
                    d: { duration: 0.6, ease: "easeInOut" }
                  }}
                />
                
                {/* Hover point with glow */}
                {hoveredPoint && (
                  <>
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="2.5"
                      fill={change24h >= 0 ? '#10b981' : '#ef4444'}
                      opacity="0.3"
                    />
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="1.5"
                      fill={change24h >= 0 ? '#10b981' : '#ef4444'}
                      stroke="white"
                      strokeWidth="0.8"
                    />
                  </>
                )}
              </svg>
            </motion.div>
          )}
        </motion.div>

        {/* Time Period Selector */}
        <div className="flex justify-between mb-8">
          {(['1H', '1D', '1W', '1M', 'YTD'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => {
                console.log(`[CoinDetail] 📊 Period button clicked: ${period}`);
                setSelectedPeriod(period);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedPeriod === period
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={`grid gap-3 mb-8 ${token.amount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {/* Send Button - Only show if user has balance */}
          {token.amount > 0 && (
            <button 
              onClick={() => onNavigateToSend?.(token)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/50 hover:bg-slate-900/50 transition-colors border-b-2 border-blue-500"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-semibold">Send</span>
            </button>
          )}
          
          {/* Receive Button - Only enabled for Solana tokens */}
          {(() => {
            // Check if this is a Solana token (not BTC, ETH, or other non-Solana tokens)
            const isSolanaToken = !['BTC', 'ETH', 'MATIC', 'AVAX', 'BNB'].includes(token.symbol.toUpperCase()) &&
                                  !token.mint?.startsWith('0x') &&
                                  token.symbol.toUpperCase() !== 'BITCOIN' &&
                                  token.symbol.toUpperCase() !== 'ETHEREUM';

            if (isSolanaToken) {
              return (
                <button
                  onClick={() => setShowReceiveDialog(true)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/50 hover:bg-slate-900/50 transition-colors border-b-2 border-purple-500"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold">Receive</span>
                </button>
              );
            } else {
              return (
                <button
                  disabled
                  className="relative flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/30 cursor-not-allowed opacity-60 transition-all"
                >
                  {/* Coming Soon Badge */}
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    Coming Soon
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Receive</span>
                </button>
              );
            }
          })()}
          
          <button 
            disabled
            className="relative flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/30 cursor-not-allowed opacity-60 transition-all"
          >
            {/* Coming Soon Badge */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              Coming Soon
            </div>
            
            <div className="w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Cash Buy</span>
          </button>
          
          <button 
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-950/50 hover:bg-slate-900/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400">More</span>
          </button>
        </div>

        {/* Balance & Value Cards */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-950/50 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Balance</div>
            <div className="text-xl font-semibold">{token.amount.toFixed(4)}</div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Value</div>
            <div className="text-xl font-semibold">{formatCurrency(token.amount * currentPrice)}</div>
          </div>
        </div>

        {/* 24h Return */}
        <div className="bg-slate-950/50 rounded-xl p-4 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">24h Return</div>
            <div className={`text-xl font-semibold ${balance24hReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(balance24hReturn)}
            </div>
          </div>
        </div>

        {/* Info Section */}
        {coinDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-4">Info</h3>
            <div className="bg-slate-950/50 rounded-xl overflow-hidden divide-y divide-slate-900">
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-400">Name</span>
                <span className="font-semibold">{coinDetails.name}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-400">Symbol</span>
                <span className="font-semibold">{coinDetails.symbol}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-400">Network</span>
                <span className="font-semibold">{coinDetails.symbol === 'BTC' ? 'Bitcoin' : coinDetails.symbol === 'ETH' ? 'Ethereum' : 'Solana'}</span>
              </div>
              {token.mint && token.mint !== 'solana' && token.mint !== 'ethereum' && (
                <div className="flex justify-between items-center p-4">
                  <span className="text-slate-400">Contract</span>
                  <button
                    onClick={() => {
                      copyToClipboard(token.mint || '');
                      toast.success('Contract address copied!');
                    }}
                    className="flex items-center gap-2 font-mono text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>{token.mint?.substring(0, 4)}...{token.mint?.substring(token.mint.length - 4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-400">Market Cap</span>
                <span className="font-semibold">{formatLargeNumber(coinDetails.marketCap)}</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-400">Total Supply</span>
                <span className="font-semibold">{formatLargeNumber(coinDetails.totalSupply)}</span>
              </div>
              {coinDetails.circulatingSupply > 0 && (
                <div className="flex justify-between items-center p-4">
                  <span className="text-slate-400">Circulating Supply</span>
                  <span className="font-semibold">{formatLargeNumber(coinDetails.circulatingSupply)}</span>
                </div>
              )}
            </div>

            {/* About Section */}
            {coinDetails.description && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                  {showFullDescription ? stripHtml(coinDetails.description) : truncateDescription(coinDetails.description)}
                </p>
                {stripHtml(coinDetails.description).length > 200 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors"
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </button>
                )}

                {/* Links */}
                <div className="flex gap-3 mt-4">
                  {coinDetails.website && (
                    <a
                      href={coinDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-semibold">Website</span>
                    </a>
                  )}
                  {coinDetails.twitter && (
                    <a
                      href={`https://twitter.com/${coinDetails.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-semibold">𝕏</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Token Receive Dialog */}
      <TokenReceiveDialog
        open={showReceiveDialog}
        onOpenChange={setShowReceiveDialog}
        token={token}
        walletId={walletId}
      />

      {/* More Options Sheet */}
      <Sheet open={showMoreMenu} onOpenChange={setShowMoreMenu}>
        <SheetContent 
          side="bottom" 
          className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-0 h-auto w-full md:max-w-[430px] mx-auto pb-safe"
        >
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-slate-700 rounded-full" />
          </div>
          
          <SheetHeader className="px-6 pb-4 space-y-1">
            <SheetTitle className="text-white text-left text-lg">
              More Options
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-left text-sm">
              Additional actions for {token.symbol}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-1 px-4 pb-6">
            {/* Share */}
            <button
              onClick={async () => {
                await handleShare();
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/50 rounded-2xl transition-all active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base text-white mb-0.5">Share Token</div>
                <div className="text-sm text-slate-400">Share {token.symbol} details</div>
              </div>
            </button>

            {/* View on Block Explorer */}
            <button
              onClick={() => {
                window.open(blockExplorer.url, '_blank', 'noopener,noreferrer');
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/50 rounded-2xl transition-all active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base text-white mb-0.5">View on {blockExplorer.name}</div>
                <div className="text-sm text-slate-400">Open in block explorer</div>
              </div>
            </button>

            {/* Copy Contract Address */}
            <button
              onClick={async () => {
                const success = await copyToClipboard(token.mint);
                if (success) {
                  toast.success('Contract address copied!');
                } else {
                  toast.error('Failed to copy address');
                }
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/50 rounded-2xl transition-all active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-base text-white mb-0.5">Copy Contract Address</div>
                <div className="text-sm text-slate-400 truncate">{token.mint.slice(0, 24)}...</div>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}