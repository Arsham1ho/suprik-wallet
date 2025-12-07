import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowDownUp, ArrowDown, Settings as SettingsIcon, Info, Zap, Loader2, ChevronDown, Search as SearchIcon, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { TokenLogo } from '../TokenLogo';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Search, type CoinGeckoToken } from './Search';
import type { Token } from './Home';
import { BiometricConfirmDialog } from '../BiometricConfirmDialog';
import { SwapSuccessDialog } from '../SwapSuccessDialog';
import { SwapNetworkIndicator } from '../SwapNetworkIndicator';
import { SwapModeIndicator } from '../SwapModeIndicator';
import type { BiometricSettings } from '../../utils/biometric';
import { useWallet } from '../../utils/WalletContext';
import { useNetwork } from '../../utils/NetworkContext';
import { 
  getJupiterSwapQuote, 
  executeJupiterSwap, 
  POPULAR_SWAP_PAIRS,
  getTokenMint,
  getTokenDecimals 
} from '../../utils/jupiterSwap';

interface SwapProps {
  tokens: Token[];
  walletId: string;
  onSwapComplete?: () => void;
}

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface SwapToken {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  logoUrl?: string;
  price: number;
  balance: number;
  hasBalance: boolean;
  mint?: string; // Token mint address for swaps
  network?: string; // Network (solana, ethereum, etc)
}

interface SwapHistory {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  timestamp: string;
  feeUSD: string;
}

export function Swap({ tokens, walletId, onSwapComplete }: SwapProps) {
  const wallet = useWallet();
  const network = useNetwork();
  
  // Use ref to store latest tokens to avoid dependency issues
  const tokensRef = useRef(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);
  
  // State for all coins from CoinGecko
  const [allCoins, setAllCoins] = useState<SwapToken[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [slippageMode, setSlippageMode] = useState<'auto' | 'custom'>('auto');
  const [priorityFee, setPriorityFee] = useState<'auto' | 'custom'>('auto');
  const [priorityFeeValue, setPriorityFeeValue] = useState('0.00001');
  const [tip, setTip] = useState<'auto' | 'custom'>('auto');
  const [tipValue, setTipValue] = useState('0');
  const [showSettings, setShowSettings] = useState(false);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showPriorityFeeSettings, setShowPriorityFeeSettings] = useState(false);
  const [showTipSettings, setShowTipSettings] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSwapAnimation, setShowSwapAnimation] = useState(false);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings | null>(null);
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);
  const [recentSwaps, setRecentSwaps] = useState<SwapHistory[]>([]);
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successSwapData, setSuccessSwapData] = useState<{
    fromToken: any;
    toToken: any;
    fee?: string;
    feeUSD?: string;
    signature?: string;
  } | null>(null);
  
  // Jupiter state (best DEX aggregator)
  const [useJupiter, setUseJupiter] = useState(true); // Default to real swaps
  const [jupiterQuote, setJupiterQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [route, setRoute] = useState<string | null>(null);

  // Fetch coins from CoinGecko - only on mount
  useEffect(() => {
    fetchAllCoins(true); // Initial load with loading spinner
    loadBiometricSettings();
    loadRecentSwaps();
  }, []); // Remove tokens dependency to prevent constant re-fetching

  // Auto-refresh prices every 30 seconds (background refresh without loading state)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllCoins(false); // Background refresh without loading spinner
    }, 30000);
    
    return () => clearInterval(interval);
  }, []); // FIXED: Empty deps to prevent re-creation of interval

  const loadBiometricSettings = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/user-settings/${walletId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const settings = await response.json();
        setBiometricSettings(settings.biometric || null);
      }
    } catch (error) {
      console.error('[Swap] Error loading biometric settings:', error);
    }
  }, [walletId]);

  const loadRecentSwaps = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/recent-swaps`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecentSwaps(data.swaps || []);
      }
    } catch (error) {
      console.error('[Swap] Error loading recent swaps:', error);
    }
  }, [walletId]);

  const fetchAllCoins = useCallback(async (isInitialLoad = false) => {
    try {
      // Don't show loading spinner on background refresh
      if (isInitialLoad) {
        setLoading(true);
      }
      console.log('Fetching coins for swap...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coins?page=1&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', response.status, errorText);
        
        // Try to use cached data if available
        if (response.status === 429 || errorText.includes('429')) {
          toast.error('Rate limit reached. Using cached data...');
        }
        throw new Error('Failed to fetch coins');
      }

      const coinGeckoData: CoinGeckoToken[] = await response.json();
      
      // Handle error response
      if (coinGeckoData && (coinGeckoData as any).error) {
        console.error('API returned error:', (coinGeckoData as any).error);
        throw new Error((coinGeckoData as any).error);
      }
      
      // Merge CoinGecko data with wallet tokens (use ref to avoid dependency)
      const mergedCoins: SwapToken[] = coinGeckoData.map(coin => {
        // Find matching token in wallet
        const walletToken = tokensRef.current.find(t => 
          t.symbol.toLowerCase() === coin.symbol.toLowerCase() ||
          t.name.toLowerCase() === coin.name.toLowerCase()
        );

        return {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          logo: coin.symbol.charAt(0).toUpperCase(),
          logoUrl: coin.image,
          price: coin.current_price,
          balance: walletToken?.amount || 0,
          hasBalance: walletToken ? walletToken.amount > 0 : false,
          mint: walletToken?.mint,
          network: walletToken?.network
        };
      });

      // Add wallet tokens that are not in CoinGecko list (use ref to avoid dependency)
      tokensRef.current.forEach(walletToken => {
        const alreadyExists = mergedCoins.find(c => 
          c.symbol.toLowerCase() === walletToken.symbol.toLowerCase() ||
          c.name.toLowerCase() === walletToken.name.toLowerCase()
        );
        
        if (!alreadyExists && walletToken.amount > 0) {
          console.log('Adding wallet token not in CoinGecko list:', walletToken.symbol);
          mergedCoins.push({
            id: walletToken.mint || walletToken.symbol.toLowerCase(),
            symbol: walletToken.symbol.toUpperCase(),
            name: walletToken.name,
            logo: walletToken.logo || walletToken.symbol.charAt(0).toUpperCase(),
            logoUrl: '',
            price: walletToken.price || 0,
            balance: walletToken.amount,
            hasBalance: walletToken.amount > 0,
            mint: walletToken.mint,
            network: walletToken.network
          });
        }
      });

      // Sort: tokens with balance first, then by price
      mergedCoins.sort((a, b) => {
        if (a.hasBalance && !b.hasBalance) return -1;
        if (!a.hasBalance && b.hasBalance) return 1;
        return b.price - a.price;
      });

      setAllCoins(mergedCoins);
      console.log('Loaded coins for swap:', mergedCoins.length);
      
      // Auto-select SOL for "from" and USDC for "to" - ONLY on initial load
      if (isInitialLoad && mergedCoins.length > 0) {
        const solToken = mergedCoins.find(c => c.symbol === 'SOL' && c.hasBalance);
        const usdcToken = mergedCoins.find(c => c.symbol === 'USDC');
        
        if (solToken) {
          setFromToken(solToken.id);
          if (usdcToken) {
            setToToken(usdcToken.id);
          } else {
            // Fallback: select any token that's not SOL
            const toTokenOption = mergedCoins.find(c => c.id !== solToken.id);
            if (toTokenOption) {
              setToToken(toTokenOption.id);
            }
          }
        } else {
          // Fallback: select first token with balance
          const tokenWithBalance = mergedCoins.find(c => c.hasBalance);
          if (tokenWithBalance) {
            setFromToken(tokenWithBalance.id);
            // Select a different token for "to"
            const toTokenOption = mergedCoins.find(c => c.id !== tokenWithBalance.id);
            if (toTokenOption) {
              setToToken(toTokenOption.id);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching coins:', error);
      toast.error('Failed to load coins');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [tokens]);

  // Function to get Jupiter quote (CLIENT-SIDE)
  const getJupiterQuoteData = useCallback(async (inputMint: string, outputMint: string, amount: string, inputSymbol: string, outputSymbol: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setJupiterQuote(null);
      setPriceImpact(null);
      setRoute(null);
      return;
    }

    setLoadingQuote(true);
    
    try {
      const amountNum = parseFloat(amount);
      
      console.log('🔄 [Swap] CLIENT-SIDE: Fetching Jupiter quote...');
      console.log('🔄 [Swap] Input:', inputMint);
      console.log('🔄 [Swap] Output:', outputMint);
      console.log('🔄 [Swap] Amount:', amountNum);
      console.log('🔄 [Swap] Testnet mode:', network.isTestnet);
      
      // Get input and output token decimals
      const inputDecimals = getTokenDecimalsForSymbol(inputSymbol);
      const outputDecimals = getTokenDecimalsForSymbol(outputSymbol);
      
      console.log('🔄 [Swap] Input symbol:', inputSymbol, '| decimals:', inputDecimals);
      console.log('🔄 [Swap] Output symbol:', outputSymbol, '| decimals:', outputDecimals);
      
      // Use real Jupiter API based on network mode
      console.log('🔄 [Swap] Network mode:', network.isTestnet ? 'TESTNET' : 'MAINNET');
      const quote = await getJupiterSwapQuote({
        inputMint,
        outputMint,
        amount: amountNum,
        slippage: parseFloat(slippage),
        isTestnet: network.isTestnet, // Use network context
        inputDecimals,
        outputDecimals,
      });
      
      if (quote) {
        setJupiterQuote(quote);
        setPriceImpact(quote.priceImpact);
        setRoute(quote.route.join(' → '));
        
        // Update toAmount with Jupiter quote
        setToAmount(quote.outputAmount.toFixed(6));
        
        console.log('✅ [Swap] Jupiter quote received!');
        console.log('✅ [Swap] Output amount:', quote.outputAmount);
        console.log('✅ [Swap] Price impact:', quote.priceImpact + '%');
      } else {
        throw new Error('No quote available');
      }
      
    } catch (error: any) {
      console.error('❌ [Swap] Jupiter quote error:', error);
      
      // Better error messages based on error type
      if (error.message?.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else if (error.message?.includes('Invalid amount')) {
        toast.error('Please enter a valid amount.');
      } else if (error.message?.includes('DNS resolution') || error.message?.includes('dns error')) {
        // This error should not happen anymore with our improved fallback logic
        console.warn('[Swap] DNS error encountered - this should not happen with fallback');
      } else if (error.message?.includes('Network connection') || error.message?.includes('Failed to fetch')) {
        // Network errors should fall back to mock quotes automatically
        console.warn('[Swap] Network error - fallback should have handled this');
      } else if (error.message?.includes('No quote available')) {
        toast.error('No swap route found for this pair. Try a different token.');
      } else if (error.message?.includes('No route found')) {
        toast.error('Cannot swap between these tokens. Try a different pair.');
      } else {
        // Only show user-facing errors, others are handled internally
        if (!error.message?.includes('CORS') && !error.message?.includes('mock')) {
          toast.error(`Could not get price quote. Please try again.`);
        }
      }
      
      setJupiterQuote(null);
      setPriceImpact(null);
      setRoute(null);
      
      // Fallback: Calculate simple exchange rate
      if (fromTokenData && toTokenData && amount) {
        const calculatedTo = (parseFloat(amount) * fromTokenData.price) / toTokenData.price;
        setToAmount(calculatedTo.toFixed(6));
      }
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  // Tokens that can be used for "You pay" (must have balance) - memoized
  const fromTokenOptions = useMemo(() => allCoins.filter(t => t.hasBalance), [allCoins]);
  
  // Popular token pairs for quick swap
  const popularPairs = [
    { from: 'SOL', to: 'USDC', label: 'SOL → USDC' },
    { from: 'SOL', to: 'USDT', label: 'SOL → USDT' },
    { from: 'ETH', to: 'USDC', label: 'ETH → USDC' },
    { from: 'BTC', to: 'USDT', label: 'BTC → USDT' },
  ];
  
  // Tokens that can be used for "You receive" (all coins)
  const toTokenOptions = allCoins;

  const fromTokenData = useMemo(() => allCoins.find(t => t.id === fromToken), [allCoins, fromToken]);
  const toTokenData = useMemo(() => allCoins.find(t => t.id === toToken), [allCoins, toToken]);

  // Get token mint address by symbol - memoized
  const getMintAddress = useCallback((symbol: string): string | null => {
    const mint = getTokenMint(symbol);
    // Return null if it's the same as input (not found)
    return mint !== symbol ? mint : null;
  }, []);

  // Get token decimals by symbol - memoized
  const getTokenDecimalsForSymbol = useCallback((symbol: string): number => {
    return getTokenDecimals(symbol);
  }, []);

  // Auto-calculate toAmount when fromAmount changes
  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value);
    
    // Clear previous quote if amount is empty or invalid
    if (!value || parseFloat(value) <= 0 || !fromTokenData || !toTokenData) {
      setToAmount('');
      setJupiterQuote(null);
      setPriceImpact(null);
      setRoute(null);
      return;
    }
    
    if (useJupiter) {
      // Get mint addresses
      const inputMint = getMintAddress(fromTokenData.symbol);
      const outputMint = getMintAddress(toTokenData.symbol);
      
      if (inputMint && outputMint && inputMint !== fromTokenData.symbol && outputMint !== toTokenData.symbol) {
        // Both tokens have valid mint addresses - use Jupiter for real quote
        console.log('[Swap] Getting Jupiter quote for', fromTokenData.symbol, '→', toTokenData.symbol);
        getJupiterQuoteData(inputMint, outputMint, value, fromTokenData.symbol, toTokenData.symbol);
      } else {
        // Token not supported by Jupiter, use simple calculation
        console.log('[Swap] Token not supported by Jupiter. Using simple calculation.');
        console.log('[Swap] Input mint:', inputMint, '| Output mint:', outputMint);
        const calculatedTo = (parseFloat(value) * fromTokenData.price) / toTokenData.price;
        setToAmount(calculatedTo.toFixed(6));
        setJupiterQuote(null);
        setPriceImpact(null);
        setRoute(null);
      }
    } else {
      // Fallback to simple price calculation
      const calculatedTo = (parseFloat(value) * fromTokenData.price) / toTokenData.price;
      setToAmount(calculatedTo.toFixed(6));
      setJupiterQuote(null);
      setPriceImpact(null);
      setRoute(null);
    }
  }, [useJupiter, fromTokenData, toTokenData, getMintAddress, getJupiterQuoteData]);

  // Quick swap function for popular pairs
  const quickSwap = useCallback((fromSym: string, toSym: string) => {
    const fromTokenMatch = allCoins.find(t => t.symbol === fromSym && t.hasBalance);
    const toTokenMatch = allCoins.find(t => t.symbol === toSym);
    
    if (fromTokenMatch && toTokenMatch) {
      setFromToken(fromTokenMatch.id);
      setToToken(toTokenMatch.id);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else {
      toast.error(`${fromSym} or ${toSym} not available`);
    }
  }, [allCoins]);

  // Function to play success sound - Enhanced celebratory sound!
  const playSuccessSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant success sound (three-tone ascending chime with echo)
      const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.25) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      
      // Main melody - ascending success tones
      playTone(659.25, now, 0.12, 0.25); // E5
      playTone(830.61, now + 0.12, 0.12, 0.28); // G#5
      playTone(1046.5, now + 0.24, 0.25, 0.3); // C6
      
      // Harmonics for richness
      playTone(1318.51, now + 0.24, 0.2, 0.15); // E6 (harmonic)
      
      // Subtle echo
      playTone(1046.5, now + 0.4, 0.15, 0.1); // C6 echo
      
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  }, []);

  // Calculate exchange rate - memoized (must be before handleSwap)
  const exchangeRate = useMemo(() => 
    fromTokenData && toTokenData 
      ? (fromTokenData.price / toTokenData.price).toFixed(6)
      : '0'
  , [fromTokenData, toTokenData]);

  // Calculate estimated fee (0.5% of swap in USD) - memoized
  const estimatedFeeUSD = useMemo(() => 
    fromAmount && fromTokenData
      ? (parseFloat(fromAmount) * fromTokenData.price * 0.005).toFixed(2)
      : '0'
  , [fromAmount, fromTokenData]);
  
  // Calculate fee in fromToken (0.5% of fromAmount) - memoized
  const feeInFromToken = useMemo(() => 
    fromAmount 
      ? (parseFloat(fromAmount) * 0.005)
      : 0
  , [fromAmount]);

  // Price impact warning threshold (for legacy swaps) - memoized
  const legacyPriceImpact = useMemo(() => 
    fromAmount && fromTokenData && toTokenData
      ? ((parseFloat(fromAmount) * fromTokenData.price) / 1000000 * 100).toFixed(2)
      : '0'
  , [fromAmount, fromTokenData, toTokenData]);
  
  const showPriceImpactWarning = useMemo(() => 
    priceImpact ? Math.abs(priceImpact) > 1 : parseFloat(legacyPriceImpact) > 1
  , [priceImpact, legacyPriceImpact]);

  const handleSwap = useCallback(async () => {
    try {
      setIsSwapping(true);
      setShowSwapAnimation(true);

      // Check if we should use Jupiter (real swap) or simulated swap
      const shouldUseJupiter = useJupiter && jupiterQuote;

      if (shouldUseJupiter) {
        // Real Jupiter swap
        console.log('🔄 Executing real Jupiter swap...');
        await handleJupiterSwap();
      } else {
        // Simulated swap (legacy)
        await handleSimulatedSwap();
      }

    } catch (error: any) {
      console.error('Swap error:', error);
      
      // Better error messages
      let errorMessage = 'Failed to complete swap. Please try again.';
      
      if (error.message?.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance to complete swap.';
      } else if (error.message?.includes('locked')) {
        errorMessage = 'Please unlock your wallet first.';
      } else if (error.message?.includes('quote')) {
        errorMessage = 'Quote expired. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setShowSwapAnimation(false);
      setIsSwapping(false);
    }

    // Inner function for Jupiter swap
    async function handleJupiterSwap() {
    try {
      if (!jupiterQuote) {
        throw new Error('No quote available. Please wait for quote to load.');
      }

      if (!wallet.mnemonic) {
        throw new Error('Wallet is locked. Please unlock first.');
      }

      console.log('🔄 [Swap] CLIENT-SIDE: Executing Jupiter swap...');
      console.log('🔄 [Swap] Network mode:', network.isTestnet ? 'TESTNET' : 'MAINNET');
      
      // Execute swap directly on client using network mode
      const result = await executeJupiterSwap({
        mnemonic: wallet.mnemonic,
        quoteResponse: jupiterQuote,
        isTestnet: network.isTestnet, // Use network context
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute swap');
      }
      
      console.log('✅ [Swap] Jupiter swap successful!');
      console.log('✅ [Swap] Signature:', result.signature);

      // Play success sound
      playSuccessSound();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowSwapAnimation(false);
      setIsSwapping(false);
      
      // Show success dialog with details
      setSuccessSwapData({
        fromToken: {
          symbol: fromTokenData?.symbol || '',
          name: fromTokenData?.name || '',
          amount: fromAmount,
          logo: fromTokenData?.logo || '',
          logoUrl: fromTokenData?.logoUrl || '',
          color: fromTokenData?.color || 'from-purple-500 to-purple-600'
        },
        toToken: {
          symbol: toTokenData?.symbol || '',
          name: toTokenData?.name || '',
          amount: toAmount,
          logo: toTokenData?.logo || '',
          logoUrl: toTokenData?.logoUrl || '',
          color: toTokenData?.color || 'from-blue-500 to-blue-600'
        },
        signature: result.signature,
        fee: jupiterQuote?.fee ? 
          (jupiterQuote.fee.toFixed(6)) : undefined,
        feeUSD: jupiterQuote?.fee ? 
          ((jupiterQuote.fee * (fromTokenData?.price || 0)).toFixed(2)) : undefined
      });
      setShowSuccessDialog(true);
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      setJupiterQuote(null);
      setPriceImpact(null);
      setRoute(null);
      
      // Reload data
      loadRecentSwaps();
      
      if (onSwapComplete) {
        onSwapComplete();
      }
      
      // Trigger balance refresh
      window.dispatchEvent(new Event('walletBalanceUpdated'));
      
    } catch (error: any) {
      console.error('❌ [Swap] Jupiter swap error:', error);
      throw error;
    }
    }

    // Inner function for simulated swap
    async function handleSimulatedSwap() {
    try {
      // Simulate swap processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate new balances with fee
      const fromAmountNum = parseFloat(fromAmount);
      const toAmountNum = parseFloat(toAmount);
      const feeAmount = feeInFromToken; // 0.5% fee in fromToken
      const totalDeducted = fromAmountNum + feeAmount; // Total deducted from balance
      
      // Check if user has enough balance including fee
      if (totalDeducted > fromTokenData.balance) {
        toast.error('Insufficient balance to cover swap amount and fee');
        setIsSwapping(false);
        setShowSwapAnimation(false);
        return;
      }
      
      const newFromBalance = fromTokenData.balance - totalDeducted;
      const newToBalance = toTokenData.balance + toAmountNum;

      // In testnet mode, update balance client-side only
      if (network.isTestnet) {
        console.log('🧪 [Swap] Testnet mode: Updating balances locally');
        
        // Update local state
        setAllCoins(prev => prev.map(coin => {
          if (coin.id === fromTokenData.id) {
            return { 
              ...coin, 
              balance: newFromBalance,
              hasBalance: newFromBalance > 0
            };
          }
          if (coin.id === toTokenData.id) {
            return { 
              ...coin, 
              balance: newToBalance,
              hasBalance: true
            };
          }
          return coin;
        }));

        // Play success sound
        playSuccessSound();
        
        // Success feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setShowSwapAnimation(false);
        setIsSwapping(false);
        
        // Show success dialog with details
        setSuccessSwapData({
          fromToken: {
            symbol: fromTokenData.symbol,
            name: fromTokenData.name,
            amount: fromAmount,
            logo: fromTokenData.logo,
            logoUrl: fromTokenData.logoUrl || '',
            color: 'from-purple-500 to-purple-600'
          },
          toToken: {
            symbol: toTokenData.symbol,
            name: toTokenData.name,
            amount: toAmount,
            logo: toTokenData.logo,
            logoUrl: toTokenData.logoUrl || '',
            color: 'from-blue-500 to-blue-600'
          },
          fee: feeAmount.toFixed(6),
          feeUSD: estimatedFeeUSD
        });
        setShowSuccessDialog(true);
        
        // Reset form
        setFromAmount('');
        setToAmount('');
        
        // Trigger refresh in parent component to update home and activity
        if (onSwapComplete) {
          onSwapComplete();
        }
        
        // Also dispatch event for activity refresh
        window.dispatchEvent(new Event('walletBalanceUpdated'));
        
        return; // Exit early for testnet
      }

      // MAINNET MODE: Update tokens in database
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/swap-tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletId,
            fromTokenId: fromTokenData.id,
            fromTokenSymbol: fromTokenData.symbol,
            fromAmount: fromAmountNum,
            newFromBalance,
            toTokenId: toTokenData.id,
            toTokenSymbol: toTokenData.symbol,
            toAmount: toAmountNum,
            newToBalance,
            exchangeRate,
            feeAmount: feeAmount,
            feeUSD: parseFloat(estimatedFeeUSD),
            totalDeducted: totalDeducted
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Swap] Backend error:', errorText);
        throw new Error('Failed to swap tokens');
      }

      // Update local state
      setAllCoins(prev => prev.map(coin => {
        if (coin.id === fromTokenData.id) {
          return { 
            ...coin, 
            balance: newFromBalance,
            hasBalance: newFromBalance > 0
          };
        }
        if (coin.id === toTokenData.id) {
          return { 
            ...coin, 
            balance: newToBalance,
            hasBalance: true
          };
        }
        return coin;
      }));

      // Play success sound
      playSuccessSound();
      
      // Success feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowSwapAnimation(false);
      setIsSwapping(false);
      
      // Show success dialog with details
      setSuccessSwapData({
        fromToken: {
          symbol: fromTokenData.symbol,
          name: fromTokenData.name,
          amount: fromAmount,
          logo: fromTokenData.logo,
          logoUrl: fromTokenData.logoUrl || '',
          color: 'from-purple-500 to-purple-600'
        },
        toToken: {
          symbol: toTokenData.symbol,
          name: toTokenData.name,
          amount: toAmount,
          logo: toTokenData.logo,
          logoUrl: toTokenData.logoUrl || '',
          color: 'from-blue-500 to-blue-600'
        },
        fee: feeAmount.toFixed(6),
        feeUSD: estimatedFeeUSD
      });
      setShowSuccessDialog(true);
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      
      // Reload recent swaps
      loadRecentSwaps();
      
      // Trigger refresh in parent component to update home and activity
      if (onSwapComplete) {
        onSwapComplete();
      }
      
      // Also dispatch event for activity refresh
      window.dispatchEvent(new Event('walletBalanceUpdated'));
      
    } catch (error: any) {
      console.error('Simulated swap error:', error);
      toast.error(error.message || 'Failed to complete swap. Please try again.');
      setShowSwapAnimation(false);
      setIsSwapping(false);
    }
    }
  }, [useJupiter, fromTokenData, toTokenData, fromAmount, wallet, walletId, jupiterQuote, slippage, playSuccessSound, onSwapComplete, loadRecentSwaps, toAmount, estimatedFeeUSD]);

  const initiateSwap = useCallback(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter an amount');
      return;
    }
    if (!fromTokenData || parseFloat(fromAmount) > fromTokenData.balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!toTokenData) {
      toast.error('Please select a token to receive');
      return;
    }

    // Check if biometric confirmation is required
    if (biometricSettings?.enabled && biometricSettings?.requireForTransactions) {
      setShowBiometricConfirm(true);
    } else {
      handleSwap();
    }
  }, [fromAmount, fromTokenData, toTokenData, biometricSettings, handleSwap]);

  const handleFlip = useCallback(() => {
    // Only flip if both tokens are valid
    if (!fromToken || !toToken) return;
    
    // Check if the new "from" token has balance
    const newFromTokenData = allCoins.find(t => t.id === toToken);
    if (newFromTokenData && !newFromTokenData.hasBalance) {
      toast.error(`${newFromTokenData.symbol} has no balance to swap`);
      return;
    }
    
    // Toggle the flip state for animation
    setIsFlipped(!isFlipped);
    
    // Swap the tokens and amounts
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  }, [fromToken, toToken, fromAmount, toAmount, isFlipped, allCoins]);

  const setMaxAmount = useCallback(() => {
    if (fromTokenData) {
      // Calculate max amount considering 0.5% fee
      // If balance is X, max swap amount is X / 1.005 (so X = swapAmount + fee)
      const maxSwapAmount = fromTokenData.balance / 1.005;
      handleFromAmountChange(maxSwapAmount.toFixed(6));
    }
  }, [fromTokenData, handleFromAmountChange]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full">
        <div className="px-4 py-6 w-full">
          <div 
            className="flex items-center justify-between mb-6"
          >
            <h1 className="text-2xl">Swap</h1>
          </div>
          
          <div 
            className="flex flex-col items-center justify-center mt-20"
          >
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-400">Loading coins...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no tokens available
  if (fromTokenOptions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full">
        <div className="px-4 py-6 w-full">
          <div 
            className="flex items-center justify-between mb-6"
          >
            <h1 className="text-2xl">Swap</h1>
          </div>
          
          <div 
            className="flex flex-col items-center justify-center mt-20"
          >
            <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center mb-4">
              <ArrowDown className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl mb-2">No tokens to swap</h3>
            <p className="text-slate-400 text-center max-w-xs">
              You need to have tokens in your wallet before you can swap them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-16 w-full">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-6"
        >
          <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
            <h1 className="text-2xl">Swap</h1>
            <SwapNetworkIndicator />
          </div>
          <motion.button 
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-900/50 rounded-lg transition-colors"
            whileHover={{ rotate: 90, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <SettingsIcon className="w-5 h-5 text-slate-400" />
          </motion.button>
        </div>

        {/* Network Mode Banner - Testnet */}
        {network.isTestnet && (
          <div
            className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-sm text-amber-300">
                🧪 <strong>Testnet Mode</strong> - Simulated swaps
              </p>
            </div>
          </div>
        )}

        {/* Swap Mode Indicator - Real vs Demo */}
        {!network.isTestnet && jupiterQuote && route && (
          <SwapModeIndicator 
            isRealMode={useJupiter}
            route={route}
            priceImpact={priceImpact}
          />
        )}

        {/* Swap Interface */}
        <div className="space-y-2">
          {/* From */}
          <div 
            className="relative bg-slate-900/50 border border-slate-800/30 rounded-2xl p-5 backdrop-blur-sm"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">You pay</span>
                {fromTokenData && fromTokenData.hasBalance && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">
                      Balance: {fromTokenData.balance.toFixed(4)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={setMaxAmount}
                      className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-slate-900/50"
                    >
                      MAX
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="w-[140px] bg-slate-950/80 border-slate-800/50 text-white h-14">
                    <SelectValue>
                      {fromTokenData && (
                        <div className="flex items-center gap-2">
                          <TokenLogo
                            logoUrl={fromTokenData.logoUrl}
                            logo={fromTokenData.logo}
                            symbol={fromTokenData.symbol}
                            name={fromTokenData.name}
                            mint={fromTokenData.mint}
                            size="sm"
                          />
                          <span>{fromTokenData.symbol}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 max-h-[300px] overflow-y-auto">
                    {fromTokenOptions.filter(t => t.id !== toToken).map(token => (
                      <SelectItem key={token.id} value={token.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <TokenLogo
                            logoUrl={token.logoUrl}
                            logo={token.logo}
                            symbol={token.symbol}
                            name={token.name}
                            mint={token.mint}
                            size="sm"
                          />
                          <div className="flex flex-col items-start">
                            <span>{token.symbol}</span>
                            {token.hasBalance && (
                              <span className="text-xs text-slate-400">{token.balance.toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white text-2xl placeholder:text-slate-700 h-14 focus-visible:ring-0"
                />
              </div>

              {fromTokenData && fromAmount && (
                <div 
                  className="mt-2 text-slate-500 text-sm"
                >
                  ≈ ${(parseFloat(fromAmount) * fromTokenData.price).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <motion.button
              onClick={handleFlip}
              className="w-10 h-10 bg-slate-900 hover:bg-purple-900/50 border-4 border-black rounded-full flex items-center justify-center transition-all"
              animate={{ rotate: isFlipped ? 180 : 0 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ArrowDownUp className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* To */}
          <div 
            className="relative bg-slate-900/50 border border-slate-800/30 rounded-2xl p-5 backdrop-blur-sm"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">You receive</span>
                {toTokenData && toTokenData.hasBalance && (
                  <span className="text-slate-400 text-sm">
                    Balance: {toTokenData.balance.toFixed(4)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-[140px] bg-slate-950/80 border-slate-800/50 text-white h-14">
                    <SelectValue>
                      {toTokenData ? (
                        <div className="flex items-center gap-2">
                          <TokenLogo
                            logoUrl={toTokenData.logoUrl}
                            logo={toTokenData.logo}
                            symbol={toTokenData.symbol}
                            name={toTokenData.name}
                            mint={toTokenData.mint}
                            size="sm"
                          />
                          <span>{toTokenData.symbol}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500\">Select</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 max-h-[300px] overflow-y-auto">
                    {allCoins.filter(t => t.id !== fromToken).map(token => (
                      <SelectItem key={token.id} value={token.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <TokenLogo
                            logoUrl={token.logoUrl}
                            logo={token.logo}
                            symbol={token.symbol}
                            name={token.name}
                            mint={token.mint}
                            size="sm"
                          />
                          <div className="flex flex-col items-start">
                            <span>{token.symbol}</span>
                            {token.hasBalance && (
                              <span className="text-xs text-slate-400">{token.balance.toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1 text-2xl text-white h-14 flex items-center">
                  {toAmount || '0.00'}
                </div>
              </div>

              {toTokenData && toAmount && (
                <div 
                  className="mt-2 text-slate-500 text-sm"
                >
                  ≈ ${(parseFloat(toAmount) * toTokenData.price).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Impact Warning */}
        {showPriceImpactWarning && fromAmount && (
          <div
            className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-500 text-sm">Price Impact: {priceImpact}%</p>
                <p className="text-yellow-500/70 text-xs mt-1">
                  This swap may have a significant price impact. Consider breaking it into smaller trades.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rate Info */}
        {fromAmount && (
          <div 
            className="mt-4 bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Rate</span>
              <span className="text-white">
                1 {fromTokenData?.symbol} ≈ {exchangeRate} {toTokenData?.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Fee (0.5%)</span>
              <div className="text-right">
                <span className="text-white">${estimatedFeeUSD}</span>
                <p className="text-slate-500 text-xs">
                  {feeInFromToken.toFixed(6)} {fromTokenData?.symbol}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Total Deducted</span>
              <span className="text-white">
                {(parseFloat(fromAmount || '0') + feeInFromToken).toFixed(6)} {fromTokenData?.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Slippage tolerance</span>
              <span className="text-white">{slippage}%</span>
            </div>
            
            {/* Jupiter Quote Details */}
            {useJupiter && jupiterQuote && loadingQuote && (
              <>
                <div className="h-px bg-slate-800 my-3" />
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Getting best price...</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Swap Button */}
        <motion.div
          whileHover={{ scale: isSwapping ? 1 : 1.02 }}
          whileTap={{ scale: isSwapping ? 1 : 0.98 }}
        >
          <Button
            onClick={initiateSwap}
            disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || (fromTokenData && (parseFloat(fromAmount) + feeInFromToken) > fromTokenData.balance) || fromTokenOptions.length === 0}
            className="w-full h-14 mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white disabled:opacity-50 shadow-lg shadow-purple-500/30 transition-all"
          >
            {isSwapping ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Swapping...</span>
              </div>
            ) : loadingQuote ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Getting quote...</span>
              </div>
            ) : fromTokenOptions.length === 0
              ? 'No tokens with balance'
              : !fromAmount || parseFloat(fromAmount) <= 0 
                ? 'Enter an amount'
                : fromTokenData && (parseFloat(fromAmount) + feeInFromToken) > fromTokenData.balance
                  ? 'Insufficient balance (including fee)'
                  : 'Swap'}
          </Button>
        </motion.div>

        {/* Testnet Mode Banner */}
        {network.isTestnet && (
          <div
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="text-blue-400 text-xl">🧪</div>
              <p className="text-sm text-blue-200">
                <strong>Testnet Mode Active</strong> - Swaps will be simulated (no real blockchain interaction)
              </p>
            </div>
          </div>
        )}

        {/* Recent Swaps */}
        {recentSwaps.length > 0 && (
          <div
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm text-slate-400">Recent Swaps</h3>
            </div>
            <div className="space-y-2">
              {recentSwaps.slice(0, 3).map((swap) => (
                <motion.div
                  key={swap.id}
                  className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 backdrop-blur-sm"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm">{swap.fromAmount.toFixed(4)}</span>
                        <span className="text-slate-400 text-sm">{swap.fromToken}</span>
                      </div>
                      <ArrowDown className="w-3 h-3 text-slate-600" />
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm">{swap.toAmount.toFixed(4)}</span>
                        <span className="text-slate-400 text-sm">{swap.toToken}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(swap.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-0 pt-4">
            {/* Slippage */}
            <button
              onClick={() => setShowSlippageSettings(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors rounded-lg"
            >
              <span className="text-white">Slippage</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{slippageMode === 'auto' ? 'Auto' : `${slippage}%`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
            </button>

            {/* Priority Fee */}
            <button
              onClick={() => setShowPriorityFeeSettings(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors rounded-lg mt-2"
            >
              <span className="text-white">Priority Fee</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{priorityFee === 'auto' ? 'Auto' : `${priorityFeeValue} SOL`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
            </button>

            {/* Tip */}
            <button
              onClick={() => setShowTipSettings(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors rounded-lg mt-2"
            >
              <span className="text-white">Tip</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{tip === 'auto' ? 'Auto' : `${tipValue} SOL`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slippage Settings Dialog */}
      <Dialog open={showSlippageSettings} onOpenChange={setShowSlippageSettings}>
        <DialogContent className="bg-black border-slate-800 text-white max-w-md sm:max-w-md h-[100dvh] sm:h-auto p-0 gap-0 [&>button]:hidden sm:top-[50%] sm:translate-y-[-50%] top-0 translate-y-0 rounded-none sm:rounded-lg flex flex-col">
          {/* Hidden Accessibility Elements */}
          <DialogTitle className="sr-only">Slippage Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Configure slippage tolerance for your swap transactions
          </DialogDescription>
          
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-slate-800/50 shrink-0">
            <button 
              onClick={() => setShowSlippageSettings(false)}
              className="text-white hover:text-slate-300"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl">Slippage</h2>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {/* Auto Option */}
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-white">Auto</span>
                </div>
                <Switch
                  checked={slippageMode === 'auto'}
                  onCheckedChange={(checked) => setSlippageMode(checked ? 'auto' : 'custom')}
                />
              </div>
              <p className="text-sm text-slate-400 ml-11">
                Phantom will find the lowest slippage for a successful swap.
              </p>
            </div>

            {/* Preset Options */}
            {['0.5', '1', '2'].map((value) => (
              <button
                key={value}
                onClick={() => {
                  setSlippageMode('custom');
                  setSlippage(value);
                }}
                className={`w-full bg-slate-900/50 rounded-xl p-4 text-left transition-colors ${
                  slippageMode === 'custom' && slippage === value
                    ? 'ring-2 ring-purple-600'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{value}%</span>
                  {slippageMode === 'custom' && slippage === value && (
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Custom Input */}
            <div 
              className={`bg-slate-900/50 rounded-xl p-4 ${
                slippageMode === 'custom' && !['0.5', '1', '2'].includes(slippage)
                  ? 'ring-2 ring-purple-600'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white">Custom</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={slippage}
                    onChange={(e) => {
                      setSlippageMode('custom');
                      setSlippage(e.target.value);
                    }}
                    className="w-20 bg-transparent border-0 text-white text-right p-0 focus-visible:ring-0"
                    placeholder="1.2"
                    step="0.1"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <p className="text-xs text-slate-500 px-1">
              Your transaction will fail if the price changes more than the slippage. Too high of a value will result in an unfavorable trade.
            </p>
          </div>

          {/* Done Button */}
          <div className="p-4 border-t border-slate-800/50 mt-auto shrink-0">
            <Button
              onClick={() => setShowSlippageSettings(false)}
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Priority Fee Settings Dialog */}
      <Dialog open={showPriorityFeeSettings} onOpenChange={setShowPriorityFeeSettings}>
        <DialogContent className="bg-black border-slate-800 text-white max-w-md sm:max-w-md h-[100dvh] sm:h-auto p-0 gap-0 [&>button]:hidden sm:top-[50%] sm:translate-y-[-50%] top-0 translate-y-0 rounded-none sm:rounded-lg flex flex-col">
          {/* Hidden Accessibility Elements */}
          <DialogTitle className="sr-only">Priority Fee Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Configure priority fee for your swap transactions
          </DialogDescription>
          
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-slate-800/50 shrink-0">
            <button 
              onClick={() => setShowPriorityFeeSettings(false)}
              className="text-white hover:text-slate-300"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl">Priority Fee</h2>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {/* Auto Option */}
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-white">Auto</span>
                </div>
                <Switch
                  checked={priorityFee === 'auto'}
                  onCheckedChange={(checked) => setPriorityFee(checked ? 'auto' : 'custom')}
                />
              </div>
              <p className="text-sm text-slate-400 ml-11">
                Phantom automatically calculates fees based on real-time network conditions.
              </p>
            </div>

            {/* Custom Input */}
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Custom</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priorityFeeValue}
                    onChange={(e) => {
                      setPriorityFee('custom');
                      setPriorityFeeValue(e.target.value);
                    }}
                    className="w-24 bg-transparent border-0 text-white text-right p-0 focus-visible:ring-0"
                    placeholder="0.00"
                    step="0.00001"
                  />
                  <span className="text-slate-400">SOL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="p-4 border-t border-slate-800/50 mt-auto shrink-0">
            <Button
              onClick={() => setShowPriorityFeeSettings(false)}
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tip Settings Dialog */}
      <Dialog open={showTipSettings} onOpenChange={setShowTipSettings}>
        <DialogContent className="bg-black border-slate-800 text-white max-w-md sm:max-w-md h-[100dvh] sm:h-auto p-0 gap-0 [&>button]:hidden sm:top-[50%] sm:translate-y-[-50%] top-0 translate-y-0 rounded-none sm:rounded-lg flex flex-col">
          {/* Hidden Accessibility Elements */}
          <DialogTitle className="sr-only">Tip Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Configure tip amount for your swap transactions
          </DialogDescription>
          
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-slate-800/50 shrink-0">
            <button 
              onClick={() => setShowTipSettings(false)}
              className="text-white hover:text-slate-300"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl">Tip</h2>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {/* Auto Option */}
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-white">Auto</span>
                </div>
                <Switch
                  checked={tip === 'auto'}
                  onCheckedChange={(checked) => setTip(checked ? 'auto' : 'custom')}
                />
              </div>
              <p className="text-sm text-slate-400 ml-11">
                Phantom automatically calculates tips based on real-time network conditions.
              </p>
            </div>

            {/* Custom Input */}
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Custom</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tipValue}
                    onChange={(e) => {
                      setTip('custom');
                      setTipValue(e.target.value);
                    }}
                    className="w-24 bg-transparent border-0 text-white text-right p-0 focus-visible:ring-0"
                    placeholder="0.00"
                    step="0.00001"
                  />
                  <span className="text-slate-400">SOL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="p-4 border-t border-slate-800/50 mt-auto shrink-0">
            <Button
              onClick={() => setShowTipSettings(false)}
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Animation Dialog - Removed */}

      {/* Old Animation (backup) - Hidden */}
      <AnimatePresence>
        {false && showSwapAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gradient-to-br from-slate-950/95 via-purple-950/20 to-blue-950/20 border border-purple-500/20 rounded-3xl p-10 max-w-sm w-full shadow-2xl overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <motion.div
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
              />

              {/* Particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, (Math.random() - 0.5) * 200]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full"
                  style={{
                    background: i % 2 === 0 ? '#a855f7' : '#3b82f6'
                  }}
                />
              ))}

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Token Animation Container */}
                <div className="relative w-full h-40 mb-8">
                  {/* Connecting Line */}
                  <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                    <motion.path
                      d="M 60 60 Q 140 20, 220 60"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: [0, 1, 0],
                        opacity: [0, 0.6, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* From Token */}
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute left-0 top-8"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(168, 85, 247, 0.4)',
                          '0 0 40px rgba(168, 85, 247, 0.6)',
                          '0 0 20px rgba(168, 85, 247, 0.4)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center border-4 border-purple-400/30"
                    >
                      {/* Glow ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.4), transparent)'
                        }}
                      />
                      <div className="relative z-10 scale-125">
                        <TokenLogo
                          logoUrl={fromTokenData?.logoUrl}
                          logo={fromTokenData?.logo}
                          symbol={fromTokenData?.symbol}
                          name={fromTokenData?.name}
                          mint={fromTokenData?.mint}
                          size="md"
                        />
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* To Token */}
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3
                    }}
                    className="absolute right-0 top-8"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(59, 130, 246, 0.4)',
                          '0 0 40px rgba(59, 130, 246, 0.6)',
                          '0 0 20px rgba(59, 130, 246, 0.4)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center border-4 border-blue-400/30"
                    >
                      {/* Glow ring */}
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.4), transparent)'
                        }}
                      />
                      <div className="relative z-10 scale-125">
                        <TokenLogo
                          logoUrl={toTokenData?.logoUrl}
                          logo={toTokenData?.logo}
                          symbol={toTokenData?.symbol}
                          name={toTokenData?.name}
                          mint={toTokenData?.mint}
                          size="md"
                        />
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Center Swap Icon */}
                  <motion.div
                    animate={{ 
                      rotate: [0, 180, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="relative">
                      {/* Outer glow ring */}
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-xl"
                      />
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center border-2 border-white/20 shadow-2xl">
                        <ArrowDownUp className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Text with better animation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <motion.h3 
                    className="text-3xl bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ backgroundSize: '200% 200%' }}
                  >
                    Swapping
                  </motion.h3>
                  
                  <div className="space-y-2 text-sm">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="text-purple-300">{fromAmount}</span>
                      <span className="text-purple-400/60">{fromTokenData?.symbol}</span>
                    </motion.div>
                    
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowDown className="w-4 h-4 mx-auto text-pink-400" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="text-blue-300">{toAmount}</span>
                      <span className="text-blue-400/60">{toTokenData?.symbol}</span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Progress Indicator */}
                <motion.div 
                  className="mt-8 flex items-center gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </motion.div>

                {/* Status text */}
                <motion.p
                  className="mt-4 text-xs text-slate-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Processing your swap...
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Confirmation Dialog */}
      <BiometricConfirmDialog
        open={showBiometricConfirm}
        onOpenChange={setShowBiometricConfirm}
        onConfirm={handleSwap}
        walletId={walletId}
        title="Confirm Swap"
        description="Authenticate to proceed with this swap"
        amount={fromAmount}
        token={fromTokenData?.symbol}
      />

      {/* Success Dialog */}
      {successSwapData && (
        <SwapSuccessDialog
          open={showSuccessDialog}
          onOpenChange={(open) => {
            setShowSuccessDialog(open);
            if (!open) {
              // Clear data when dialog closes
              setSuccessSwapData(null);
            }
          }}
          fromToken={successSwapData.fromToken}
          toToken={successSwapData.toToken}
          fee={successSwapData.fee}
          feeUSD={successSwapData.feeUSD}
          signature={successSwapData.signature}
          isTestnet={network.isTestnet}
        />
      )}
    </div>
  );
}
