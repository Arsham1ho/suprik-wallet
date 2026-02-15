import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  ArrowDownUp,
  ArrowDown,
  Settings as SettingsIcon,
  Info,
  Zap,
  Loader2,
  ChevronDown,
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { TokenLogo } from "../TokenLogo";
import { getUserSettings } from "../../utils/userSettings";
import { Search, type CoinGeckoToken, type WalletToken } from "./Search";
import { TOKEN_REGISTRY } from "../../utils/tokenRegistry";
import type { Token } from "./Home";
import { BiometricConfirmDialog } from "../BiometricConfirmDialog";
import { SwapSuccessDialog } from "../SwapSuccessDialog";
import { SwapFailedDialog } from "../SwapFailedDialog";
import { SwapNetworkIndicator } from "../SwapNetworkIndicator";
import { SwapModeIndicator } from "../SwapModeIndicator";
import type { BiometricSettings } from "../../utils/biometric";
import { useWallet } from "../../utils/WalletContext";
import { useNetwork } from "../../utils/NetworkContext";
import { useTheme } from "../../utils/ThemeContext";
import { AccountManager } from "../../utils/accountManager";
import { decryptWithPassword, decryptImportedSecret } from "../../utils/wallet";
import {
  getJupiterSwapQuote,
  executeJupiterSwap,
  getUltraSwapOrder,
  executeUltraSwap,
  POPULAR_SWAP_PAIRS,
  getTokenDecimals,
  getDecimalsForMint,
  resolveMintAddress,
  resolveMintAddressAsync,
  UltraOrderResponse,
  transferSwapFee,
  PLATFORM_FEE_BPS,
} from "../../utils/jupiterSwap";
import { saveSwapToHistory } from "../../utils/transactionHistory";
import { playSwapExchange } from "../../utils/sounds";

interface SwapProps {
  tokens: Token[];
  walletId: string;
  onSwapComplete?: () => void;
}

// Known Solana-native token IDs (CoinGecko IDs)
const SOLANA_TOKEN_IDS = new Set([
  'solana', 'bonk', 'jupiter-exchange-solana', 'jito-governance-token', 'pyth-network',
  'dogwifcoin', 'raydium', 'serum', 'orca', 'mango-markets', 'marinade-staked-sol',
  'msol', 'render-token', 'helium', 'helium-mobile', 'hivemapper', 'grass',
  'tensor', 'parcl', 'jito-staked-sol', 'blazestake-staked-sol', 'samoyedcoin',
  'bonfida', 'step-finance', 'cope', 'dust-protocol', 'stepn', 'green-satoshi-token',
  'magic-eden', 'phantom', 'drift-protocol', 'marinade', 'lido-staked-sol',
  'kin', 'star-atlas', 'star-atlas-dao', 'aurory', 'genopets', 'defi-land',
  'popcat', 'cat-in-a-dogs-world', 'book-of-meme', 'slerf', 'wen-4',
  'parabolic-ai', 'suprana', 'io-net', 'wormhole', 'nosana',
  'usd-coin', 'tether', // USDC and USDT have Solana versions
]);

// Known Solana-native token symbols
const SOLANA_TOKEN_SYMBOLS = new Set([
  'sol', 'bonk', 'jup', 'jto', 'pyth', 'wif', 'ray', 'srm', 'orca', 'mngo',
  'msol', 'rndr', 'hnt', 'mobile', 'honey', 'tnsr', 'prcl', 'jitosol', 'bsol',
  'samo', 'fida', 'step', 'cope', 'dust', 'gmt', 'gst', 'me', 'drift',
  'popcat', 'mew', 'bome', 'slerf', 'wen', 'pai', 'parai', 'io', 'w', 'nos',
  'usdc', 'usdt', // Stablecoins on Solana
]);

// Helper to check if a token is Solana-native
const isSolanaToken = (token: { id: string; symbol: string; name?: string; mint?: string }): boolean => {
  const symbol = token.symbol.toLowerCase();
  const id = token.id.toLowerCase();
  const name = (token.name || '').toLowerCase();

  // Check if it has a valid Solana mint address (base58, 32-44 chars)
  if (token.mint && token.mint.length >= 32 && token.mint.length <= 44 && !token.mint.startsWith('0x')) {
    // Additional check: known non-Solana tokens should not pass
    const nonSolanaSymbols = ['btc', 'eth', 'bnb', 'xrp', 'ada', 'doge', 'dot', 'matic', 'ltc', 'link', 'avax', 'atom'];
    if (!nonSolanaSymbols.includes(symbol)) {
      return true;
    }
  }

  // Check against known Solana token IDs and symbols
  if (SOLANA_TOKEN_IDS.has(id) || SOLANA_TOKEN_SYMBOLS.has(symbol)) {
    return true;
  }

  // Check for "solana" in name or ID
  if (id.includes('solana') || name.includes('solana')) {
    return true;
  }

  return false;
};

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
  decimals?: number; // Token decimals from registry/on-chain
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

// Symbol aliases for tokens with multiple known symbols
// Maps CoinGecko symbol -> alternative symbols that should be considered the same token
const SYMBOL_ALIASES: Record<string, string[]> = {
  'PARAI': ['PAI'],  // Parabolic AI uses both PARAI and PAI
  'PAI': ['PARAI'],
};

export function Swap({ tokens, walletId, onSwapComplete }: SwapProps) {
  const wallet = useWallet();
  const network = useNetwork();
  const { colors } = useTheme();

  // Use ref to store latest tokens to avoid dependency issues
  const tokensRef = useRef(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  // State for all coins from CoinGecko
  const [allCoins, setAllCoins] = useState<SwapToken[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [slippageMode, setSlippageMode] = useState<"auto" | "custom">("auto");
  const [priorityFee, setPriorityFee] = useState<"auto" | "custom">("auto");
  const [priorityFeeValue, setPriorityFeeValue] = useState("0.00001");
  const [tip, setTip] = useState<"auto" | "custom">("auto");
  const [tipValue, setTipValue] = useState("0");
  const [showSettings, setShowSettings] = useState(false);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showPriorityFeeSettings, setShowPriorityFeeSettings] = useState(false);
  const [showTipSettings, setShowTipSettings] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSwapAnimation, setShowSwapAnimation] = useState(false);
  const [biometricSettings, setBiometricSettings] =
    useState<BiometricSettings | null>(null);
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);
  const [recentSwaps, setRecentSwaps] = useState<SwapHistory[]>([]);

  // Token search dialog states
  const [showFromTokenSearch, setShowFromTokenSearch] = useState(false);
  const [showToTokenSearch, setShowToTokenSearch] = useState(false);

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successSwapData, setSuccessSwapData] = useState<{
    fromToken: any;
    toToken: any;
    fee?: string;
    feeUSD?: string;
    signature?: string;
  } | null>(null);

  // Failed dialog state
  const [showFailedDialog, setShowFailedDialog] = useState(false);
  const [failedSwapData, setFailedSwapData] = useState<{
    fromToken: any;
    toToken: any;
    error: string;
    signature?: string;
  } | null>(null);

  // Jupiter state (best DEX aggregator)
  const [useJupiter, setUseJupiter] = useState(true); // Default to real swaps
  const [jupiterQuote, setJupiterQuote] = useState<any>(null);
  const [ultraOrderResponse, setUltraOrderResponse] = useState<UltraOrderResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [route, setRoute] = useState<string | null>(null);

  // Quote version counter — incremented each time a new quote is requested.
  // Stale responses (from a previous token pair) check this before updating state.
  const quoteVersionRef = useRef(0);

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

  const loadBiometricSettings = useCallback(() => {
    try {
      // Load from localStorage (instant, no server call)
      const settings = getUserSettings(walletId);

      if (settings.biometricEnabled) {
        setBiometricSettings({
          enabled: true,
          autoLockMinutes: settings.autoLockMinutes || 5,
          requireForTransactions: settings.requireBiometricForTransactions || false,
        });
      } else {
        setBiometricSettings(null);
      }
    } catch (error) {
      console.error("[Swap] Error loading biometric settings:", error);
    }
  }, [walletId]);

  const loadRecentSwaps = useCallback(() => {
    try {
      // Load from localStorage (instant, no server call)
      const key = `suprik_recent_swaps_${walletId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const swaps = JSON.parse(stored);
        setRecentSwaps(swaps || []);
      }
    } catch (error) {
      console.error("[Swap] Error loading recent swaps:", error);
    }
  }, [walletId]);

  const fetchAllCoins = useCallback(
    async (isInitialLoad = false) => {
      try {
        // Don't show loading spinner on background refresh
        if (isInitialLoad) {
          setLoading(true);
        }
        console.log("[Swap] Loading coins from TOKEN_REGISTRY (client-side)...");

        // STEP 1: Start with ALL wallet tokens that have balance
        // This ensures we never lose a token with balance
        const walletTokensWithBalance = tokensRef.current.filter((t: Token) => t.amount > 0);
        console.log('[Swap] Wallet tokens with balance:', walletTokensWithBalance.map((t: Token) => ({
          symbol: t.symbol,
          name: t.name,
          mint: t.mint?.substring(0, 8) + '...',
          amount: t.amount
        })));

        // STEP 2: Create a map of wallet tokens by mint address for fast lookup
        const walletTokensByMint = new Map<string, Token>();
        const walletTokensBySymbol = new Map<string, Token>();
        const walletTokensByName = new Map<string, Token>();

        walletTokensWithBalance.forEach((t: Token) => {
          if (t.mint && t.mint.length > 20) { // Valid Solana mint address
            walletTokensByMint.set(t.mint, t);
          }
          // Only add to symbol map if it looks like a real symbol (not a mint address)
          if (t.symbol && t.symbol.length < 20 && !t.symbol.includes('...')) {
            walletTokensBySymbol.set(t.symbol.toUpperCase(), t);
          }
          // Also map by name for better matching
          if (t.name) {
            walletTokensByName.set(t.name.toLowerCase(), t);
          }
        });

        // STEP 3: Merge TOKEN_REGISTRY with wallet tokens
        const mergedCoins: SwapToken[] = TOKEN_REGISTRY.map((registryToken) => {
          const tokenSymbolUpper = registryToken.symbol.toUpperCase();
          const symbolAliases = SYMBOL_ALIASES[tokenSymbolUpper] || [];

          // Try to find matching wallet token by multiple methods:
          // 1. First try symbol match (fastest)
          let walletToken = walletTokensBySymbol.get(tokenSymbolUpper);

          // 2. Try symbol aliases
          if (!walletToken) {
            for (const alias of symbolAliases) {
              walletToken = walletTokensBySymbol.get(alias);
              if (walletToken) break;
            }
          }

          // 3. Try name match (case-insensitive)
          if (!walletToken) {
            walletToken = walletTokensByName.get(registryToken.name.toLowerCase());
          }

          // Resolve mint address
          const resolvedMint = resolveMintAddress(
            walletToken?.mint,
            registryToken.id,
            registryToken.symbol.toUpperCase()
          );

          return {
            id: registryToken.id,
            symbol: registryToken.symbol.toUpperCase(),
            name: registryToken.name,
            logo: registryToken.symbol.charAt(0).toUpperCase(),
            logoUrl: registryToken.image,
            price: walletToken?.price || 0,
            balance: walletToken?.amount || 0,
            hasBalance: walletToken ? walletToken.amount > 0 : false,
            mint: resolvedMint || registryToken.mint || walletToken?.mint,
            network: 'solana',
            decimals: registryToken.decimals,
          };
        });

        // Track which wallet tokens were already matched
        const matchedWalletMints = new Set<string>();
        mergedCoins.forEach(c => {
          if (c.hasBalance && c.mint) {
            matchedWalletMints.add(c.mint);
          }
        });

        // STEP 4: Add ALL wallet tokens with balance that weren't matched to TOKEN_REGISTRY
        console.log('[Swap] Checking for unmatched wallet tokens...');

        walletTokensWithBalance.forEach((walletToken: Token) => {
          // Check if this wallet token was already matched by mint address
          const alreadyMatched = walletToken.mint && matchedWalletMints.has(walletToken.mint);

          if (!alreadyMatched) {
            console.log(
              "[Swap] Adding unmatched wallet token:",
              walletToken.symbol,
              walletToken.name,
              walletToken.mint?.substring(0, 8) + '...'
            );

            const resolvedMint = resolveMintAddress(
              walletToken.mint,
              undefined,
              walletToken.symbol.toUpperCase()
            );

            // Use proper symbol - if wallet symbol looks like a mint address, try to get a better one
            let displaySymbol = walletToken.symbol.toUpperCase();
            if (displaySymbol.length > 10) {
              // Symbol looks like a mint address, use first 4-6 chars or name
              displaySymbol = walletToken.name?.toUpperCase().substring(0, 6) || displaySymbol.substring(0, 4);
            }

            mergedCoins.push({
              id: walletToken.mint || walletToken.symbol.toLowerCase(),
              symbol: displaySymbol,
              name: walletToken.name || 'Unknown Token',
              logo: walletToken.logo || displaySymbol.charAt(0).toUpperCase(),
              logoUrl: walletToken.logoUrl || "",
              price: walletToken.price || 0,
              balance: walletToken.amount,
              hasBalance: true, // We know it has balance - it's from walletTokensWithBalance
              mint: resolvedMint || walletToken.mint,
              network: walletToken.network || 'solana',
            });

            if (walletToken.mint) matchedWalletMints.add(walletToken.mint);
          }
        });

        // Log tokens with balance for debugging
        const tokensWithBalance = mergedCoins.filter(t => t.hasBalance);
        console.log('[Swap] Final tokens with balance:', tokensWithBalance.length,
          tokensWithBalance.map(t => ({ symbol: t.symbol, name: t.name })));

        // Sort: tokens with balance first, then by price
        mergedCoins.sort((a, b) => {
          if (a.hasBalance && !b.hasBalance) return -1;
          if (!a.hasBalance && b.hasBalance) return 1;
          return b.price - a.price;
        });

        setAllCoins(mergedCoins);
        console.log("[Swap] Loaded coins:", mergedCoins.length);

        // Auto-select SOL for "from" and USDC for "to" - ONLY on initial load
        if (isInitialLoad && mergedCoins.length > 0) {
          const solToken = mergedCoins.find(
            (c) => c.symbol === "SOL" && c.hasBalance
          );
          const usdcToken = mergedCoins.find((c) => c.symbol === "USDC");

          if (solToken) {
            setFromToken(solToken.id);
            if (usdcToken) {
              setToToken(usdcToken.id);
            } else {
              // Fallback: select any token that's not SOL
              const toTokenOption = mergedCoins.find(
                (c) => c.id !== solToken.id
              );
              if (toTokenOption) {
                setToToken(toTokenOption.id);
              }
            }
          } else {
            // Fallback: select first token with balance
            const tokenWithBalance = mergedCoins.find((c) => c.hasBalance);
            if (tokenWithBalance) {
              setFromToken(tokenWithBalance.id);
              // Select a different token for "to"
              const toTokenOption = mergedCoins.find(
                (c) => c.id !== tokenWithBalance.id
              );
              if (toTokenOption) {
                setToToken(toTokenOption.id);
              }
            }
          }
        }
      } catch (error) {
        console.error("[Swap] Error loading coins:", error);
        toast.error("Failed to load coins");
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    },
    [tokens]
  );

  // Function to get Jupiter quote (CLIENT-SIDE)
  const getJupiterQuoteData = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: string,
      inputSymbol: string,
      outputSymbol: string,
      inputTokenDecimals?: number,
      outputTokenDecimals?: number
    ) => {
      if (!amount || parseFloat(amount) <= 0) {
        setJupiterQuote(null);
        setUltraOrderResponse(null);
        setPriceImpact(null);
        setRoute(null);
        return;
      }

      // Increment version — any response from a prior version will be discarded
      const thisVersion = ++quoteVersionRef.current;

      setLoadingQuote(true);

      try {
        const amountNum = parseFloat(amount);

        console.log("🔄 [Swap] CLIENT-SIDE: Fetching Jupiter quote...");
        console.log("🔄 [Swap] Input:", inputMint);
        console.log("🔄 [Swap] Output:", outputMint);
        console.log("🔄 [Swap] Amount:", amountNum);
        console.log("🔄 [Swap] Testnet mode:", network.isTestnet);

        // Get input and output token decimals (using token data, symbol, and mint)
        const inputDecimals = getTokenDecimalsForToken(inputSymbol, inputMint, inputTokenDecimals);
        const outputDecimals = getTokenDecimalsForToken(outputSymbol, outputMint, outputTokenDecimals);

        console.log(
          "🔄 [Swap] Input symbol:",
          inputSymbol,
          "| decimals:",
          inputDecimals
        );
        console.log(
          "🔄 [Swap] Output symbol:",
          outputSymbol,
          "| decimals:",
          outputDecimals
        );

        // Use real Jupiter API based on network mode
        console.log(
          "🔄 [Swap] Network mode:",
          network.isTestnet ? "TESTNET" : "MAINNET"
        );

        // Calculate effective slippage:
        // - Auto mode: Use 3% default (good for most tokens including meme coins)
        // - Custom mode: Use the user's selected value
        const effectiveSlippage = slippageMode === "auto" ? 3 : parseFloat(slippage);
        console.log("🔄 [Swap] Slippage mode:", slippageMode, "Effective slippage:", effectiveSlippage + "%");

        // Use Ultra API for Jupiter Referral fee collection
        // The referral account FSHu56mFcP6eiL4HEJiijqRZekvjemmG8YpJpVmiJfuz is configured under the Ultra project
        // Ultra API uses referralAccount + referralFee parameters for fee collection
        let quote;
        let orderResponse;

        // Get wallet address for Ultra API taker parameter
        const walletData = localStorage.getItem('wallet_data');
        const walletAddress = walletData ? JSON.parse(walletData)?.addresses?.solana : null;

        if (walletAddress) {
          try {
            console.log("🔄 [Swap] Using Jupiter Ultra API (for referral fee collection)...");
            const ultraResult = await getUltraSwapOrder({
              inputMint,
              outputMint,
              amount: amountNum,
              takerAddress: walletAddress,
              slippage: effectiveSlippage,
              isTestnet: network.isTestnet,
              inputDecimals,
              outputDecimals,
            });
            quote = ultraResult.quote;
            orderResponse = ultraResult.orderResponse;
            setUltraOrderResponse(orderResponse);
            console.log("✅ [Swap] Ultra API order received!");
            console.log("✅ [Swap] Request ID:", orderResponse.requestId);
            console.log("✅ [Swap] Has transaction:", !!orderResponse.transaction);
            console.log("✅ [Swap] Fee mint:", orderResponse.feeMint || 'NOT SET');
            console.log("✅ [Swap] Fee bps:", orderResponse.feeBps || 'NOT SET');
            console.log("✅ [Swap] Fee account:", orderResponse.feeAccount || 'NOT SET');

            // If transaction is missing, we cannot use Ultra API for execution
            // Fall back to legacy API for this swap
            if (!orderResponse.transaction) {
              console.error("❌ [Swap] Ultra API returned no transaction! Falling back to legacy API.");
              console.error("❌ [Swap] Order response keys:", Object.keys(orderResponse));
              console.error("❌ [Swap] Note: Fee collection will NOT work without Ultra API transaction.");
              // Clear ultra response to force legacy API usage
              setUltraOrderResponse(null);
              // Get legacy quote instead
              quote = await getJupiterSwapQuote({
                inputMint,
                outputMint,
                amount: amountNum,
                slippage: effectiveSlippage,
                isTestnet: network.isTestnet,
                inputDecimals,
                outputDecimals,
              });
            }
          } catch (ultraError: any) {
            console.warn("⚠️ [Swap] Ultra API failed, falling back to legacy:", ultraError.message);
            // Fall back to legacy API (without referral fees)
            quote = await getJupiterSwapQuote({
              inputMint,
              outputMint,
              amount: amountNum,
              slippage: effectiveSlippage,
              isTestnet: network.isTestnet,
              inputDecimals,
              outputDecimals,
            });
            setUltraOrderResponse(null);
          }
        } else {
          // No wallet address available, use legacy API
          console.log("🔄 [Swap] No wallet address, using legacy API...");
          quote = await getJupiterSwapQuote({
            inputMint,
            outputMint,
            amount: amountNum,
            slippage: effectiveSlippage,
            isTestnet: network.isTestnet,
            inputDecimals,
            outputDecimals,
          });
          setUltraOrderResponse(null);
        }

        // If a newer quote was requested while we were waiting, discard this result
        if (quoteVersionRef.current !== thisVersion) {
          console.log("[Swap] Discarding stale quote response (version mismatch)");
          return;
        }

        if (quote) {
          setJupiterQuote(quote);
          setPriceImpact(quote.priceImpact);
          setRoute(quote.route.join(" → "));

          // Update toAmount with Jupiter quote
          setToAmount(quote.outputAmount.toFixed(6));

          console.log("✅ [Swap] Quote received!");
          console.log("✅ [Swap] Output amount:", quote.outputAmount);
          console.log("✅ [Swap] Price impact:", quote.priceImpact + "%");
          console.log("✅ [Swap] Using Ultra API:", !!orderResponse);
        } else {
          throw new Error("No quote available");
        }
      } catch (error: any) {
        // If a newer quote was requested, suppress errors from this stale request
        if (quoteVersionRef.current !== thisVersion) {
          console.log("[Swap] Suppressing error from stale quote request");
          setLoadingQuote(false);
          return;
        }

        console.error("❌ [Swap] Jupiter quote error:", error);

        // Better error messages based on error type
        if (error.message?.includes("timeout")) {
          toast.error("Request timed out. Please try again.");
        } else if (error.message?.includes("Invalid amount")) {
          toast.error("Please enter a valid amount.");
        } else if (
          error.message?.includes("DNS resolution") ||
          error.message?.includes("dns error")
        ) {
          // This error should not happen anymore with our improved fallback logic
          console.warn(
            "[Swap] DNS error encountered - this should not happen with fallback"
          );
        } else if (
          error.message?.includes("Network connection") ||
          error.message?.includes("Failed to fetch")
        ) {
          // Network errors should fall back to mock quotes automatically
          console.warn(
            "[Swap] Network error - fallback should have handled this"
          );
        } else if (error.message?.includes("No quote available")) {
          toast.error(
            "No swap route found for this pair. Try a different token."
          );
        } else if (error.message?.includes("No route found")) {
          toast.error(
            "Cannot swap between these tokens. Try a different pair."
          );
        } else {
          // Only show user-facing errors, others are handled internally
          if (
            !error.message?.includes("CORS") &&
            !error.message?.includes("mock")
          ) {
            toast.error(`Could not get price quote. Please try again.`);
          }
        }

        setJupiterQuote(null);
        setPriceImpact(null);
        setRoute(null);
        setToAmount("");
      } finally {
        setLoadingQuote(false);
      }
    },
    []
  );

  // Tokens that can be used for "You pay" (must have balance) - memoized
  const fromTokenOptions = useMemo(
    () => allCoins.filter((t) => t.hasBalance),
    [allCoins]
  );

  // Popular token pairs for quick swap
  const popularPairs = [
    { from: "SOL", to: "USDC", label: "SOL → USDC" },
    { from: "SOL", to: "USDT", label: "SOL → USDT" },
    { from: "ETH", to: "USDC", label: "ETH → USDC" },
    { from: "BTC", to: "USDT", label: "BTC → USDT" },
  ];

  // Tokens that can be used for "You receive" (all coins)
  const toTokenOptions = allCoins;

  const fromTokenData = useMemo(
    () => allCoins.find((t) => t.id === fromToken),
    [allCoins, fromToken]
  );
  const toTokenData = useMemo(
    () => allCoins.find((t) => t.id === toToken),
    [allCoins, toToken]
  );

  // Get token mint address - uses multiple resolution strategies
  const getMintAddressForToken = useCallback((token: SwapToken | undefined): string | null => {
    if (!token) return null;

    // Use the resolveMintAddress utility which tries:
    // 1. Direct mint property
    // 2. CoinGecko ID mapping
    // 3. Symbol mapping
    const resolvedMint = resolveMintAddress(token.mint, token.id, token.symbol);

    if (resolvedMint) {
      console.log(`[Swap] Resolved mint for ${token.symbol} (id: ${token.id}):`, resolvedMint);
      return resolvedMint;
    }

    console.log(`[Swap] No valid mint found for ${token.symbol} (id: ${token.id})`);
    return null;
  }, []);

  // Get token decimals - tries token data first, then symbol, then mint address
  const getTokenDecimalsForToken = useCallback((symbol: string, mint?: string, tokenDecimals?: number): number => {
    // First use decimals from token data (from TOKEN_REGISTRY) if available
    if (tokenDecimals !== undefined) {
      return tokenDecimals;
    }
    // Then try by symbol
    const bySymbol = getTokenDecimals(symbol);
    if (bySymbol !== 9) {
      return bySymbol; // Found a specific value (9 is default)
    }
    // Then try by mint address
    if (mint) {
      return getDecimalsForMint(mint);
    }
    return 9; // Default for Solana SPL tokens
  }, []);

  // Auto-calculate toAmount when fromAmount changes
  const handleFromAmountChange = useCallback(
    (value: string) => {
      setFromAmount(value);

      // Clear previous quote if amount is empty or invalid
      if (!value || parseFloat(value) <= 0 || !fromTokenData || !toTokenData) {
        setToAmount("");
        setJupiterQuote(null);
        setPriceImpact(null);
        setRoute(null);
        return;
      }

      if (useJupiter) {
        // Get mint addresses - now uses token's mint property first
        const inputMint = getMintAddressForToken(fromTokenData);
        const outputMint = getMintAddressForToken(toTokenData);

        if (inputMint && outputMint) {
          // Both tokens have valid mint addresses - use Jupiter for real quote
          console.log(
            "[Swap] Getting Jupiter quote for",
            fromTokenData.symbol,
            "→",
            toTokenData.symbol
          );
          console.log("[Swap] Input mint:", inputMint);
          console.log("[Swap] Output mint:", outputMint);
          getJupiterQuoteData(
            inputMint,
            outputMint,
            value,
            fromTokenData.symbol,
            toTokenData.symbol,
            fromTokenData.decimals,
            toTokenData.decimals
          );
        } else {
          // Token not supported by Jupiter, use simple calculation
          console.log(
            "[Swap] Token not supported by Jupiter. Using simple calculation."
          );
          console.log(
            "[Swap] Input mint:",
            inputMint,
            "| Output mint:",
            outputMint
          );
          if (fromTokenData.price > 0 && toTokenData.price > 0) {
            const calculatedTo =
              (parseFloat(value) * fromTokenData.price) / toTokenData.price;
            setToAmount(calculatedTo.toFixed(6));
          } else {
            setToAmount("");
          }
          setJupiterQuote(null);
          setPriceImpact(null);
          setRoute(null);
        }
      } else {
        // Fallback to simple price calculation
        if (fromTokenData.price > 0 && toTokenData.price > 0) {
          const calculatedTo =
            (parseFloat(value) * fromTokenData.price) / toTokenData.price;
          setToAmount(calculatedTo.toFixed(6));
        } else {
          setToAmount("");
        }
        setJupiterQuote(null);
        setPriceImpact(null);
        setRoute(null);
      }
    },
    [
      useJupiter,
      fromTokenData,
      toTokenData,
      getMintAddressForToken,
      getJupiterQuoteData,
    ]
  );

  // Re-fetch quote when toToken changes and there's an amount
  // We need to depend on toTokenData to ensure we have the updated token info
  useEffect(() => {
    if (toToken && fromAmount && parseFloat(fromAmount) > 0 && fromTokenData && toTokenData) {
      console.log("[Swap] toToken/toTokenData changed, re-fetching quote for:", fromTokenData.symbol, "→", toTokenData.symbol);
      // Use setTimeout to ensure state has settled after token selection
      const timer = setTimeout(() => {
        handleFromAmountChange(fromAmount);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [toToken, toTokenData?.id, toTokenData?.mint]); // Trigger on toToken change AND when toTokenData updates

  // Re-fetch quote when fromToken changes and there's an amount
  // We need to depend on fromTokenData to ensure we have the updated token info
  useEffect(() => {
    if (fromToken && fromAmount && parseFloat(fromAmount) > 0 && fromTokenData && toTokenData) {
      console.log("[Swap] fromToken/fromTokenData changed, re-fetching quote for:", fromTokenData.symbol, "→", toTokenData.symbol);
      // Use setTimeout to ensure state has settled after token selection
      const timer = setTimeout(() => {
        handleFromAmountChange(fromAmount);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fromToken, fromTokenData?.id, fromTokenData?.mint]); // Trigger on fromToken change AND when fromTokenData updates

  // Derive missing token prices from Jupiter quote
  // When a token has price=0 (e.g. xStock tokens from Search), calculate implied price from the quote
  useEffect(() => {
    if (!jupiterQuote || !fromTokenData || !toTokenData || !fromAmount) return;
    const fromAmt = parseFloat(fromAmount);
    const toAmt = jupiterQuote.outputAmount;
    if (!fromAmt || fromAmt <= 0 || !toAmt || toAmt <= 0) return;

    if (toTokenData.price === 0 && fromTokenData.price > 0) {
      const impliedPrice = (fromAmt * fromTokenData.price) / toAmt;
      if (impliedPrice > 0) {
        setAllCoins(prev => prev.map(t =>
          t.id === toTokenData.id ? { ...t, price: impliedPrice } : t
        ));
      }
    } else if (fromTokenData.price === 0 && toTokenData.price > 0) {
      const impliedPrice = (toAmt * toTokenData.price) / fromAmt;
      if (impliedPrice > 0) {
        setAllCoins(prev => prev.map(t =>
          t.id === fromTokenData.id ? { ...t, price: impliedPrice } : t
        ));
      }
    }
  }, [jupiterQuote, fromAmount, fromTokenData?.id, toTokenData?.id, fromTokenData?.price, toTokenData?.price]);

  // Quick swap function for popular pairs
  const quickSwap = useCallback(
    (fromSym: string, toSym: string) => {
      const fromSymUpper = fromSym.toUpperCase();
      const toSymUpper = toSym.toUpperCase();
      const fromAliases = SYMBOL_ALIASES[fromSymUpper] || [];
      const toAliases = SYMBOL_ALIASES[toSymUpper] || [];

      const fromTokenMatch = allCoins.find(
        (t) => {
          const sym = t.symbol.toUpperCase();
          return (sym === fromSymUpper || fromAliases.includes(sym)) && t.hasBalance;
        }
      );
      const toTokenMatch = allCoins.find((t) => {
        const sym = t.symbol.toUpperCase();
        return sym === toSymUpper || toAliases.includes(sym);
      });

      if (fromTokenMatch && toTokenMatch) {
        setFromToken(fromTokenMatch.id);
        setToToken(toTokenMatch.id);

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      } else {
        toast.error(`${fromSym} or ${toSym} not available`);
      }
    },
    [allCoins]
  );

  // Handle token selection from search
  const handleFromTokenSelect = useCallback(
    (token: CoinGeckoToken | null) => {
      if (token) {
        console.log("[Swap] handleFromTokenSelect called with:", token.symbol, token.id, "mint:", token.mint);

        // Find the token in allCoins (check symbol, aliases, and id)
        const tokenSymbolUpper = token.symbol.toUpperCase();
        const tokenAliases = SYMBOL_ALIASES[tokenSymbolUpper] || [];

        const matchedToken = allCoins.find(
          (t) => {
            const coinSymbolUpper = t.symbol.toUpperCase();
            return (
              coinSymbolUpper === tokenSymbolUpper ||
              tokenAliases.includes(coinSymbolUpper) ||
              t.id === token.id
            );
          }
        );

        // Only Solana network tokens are supported for swap (Jupiter only supports Solana)
        // Check both the wallet token network AND our Solana token detection
        const isFromSolana = matchedToken?.network === 'solana' || isSolanaToken({ id: token.id, symbol: token.symbol, name: token.name, mint: token.mint });
        if (matchedToken && !isFromSolana) {
          toast.error(`Swapping ${token.symbol} is coming soon! Only Solana network tokens are currently supported.`);
          setShowFromTokenSearch(false);
          return;
        }

        if (matchedToken && matchedToken.hasBalance) {
          console.log("[Swap] Found matched from token:", matchedToken.symbol, "mint:", matchedToken.mint);

          // If the selected token from Search has a mint but the matched one doesn't, update it
          // Also try to resolve mint from CoinGecko ID if not available
          const resolvedMint = token.mint || resolveMintAddress(undefined, token.id, token.symbol);
          if (resolvedMint && !matchedToken.mint) {
            console.log("[Swap] Updating allCoins with resolved mint:", resolvedMint);
            setAllCoins((prev: SwapToken[]) => prev.map((t: SwapToken) =>
              t.id === matchedToken.id
                ? { ...t, mint: resolvedMint }
                : t
            ));
          }

          setFromToken(matchedToken.id);
          setShowFromTokenSearch(false);

          // Clear old quote data and output amount — the useEffect will refetch
          setJupiterQuote(null);
          setUltraOrderResponse(null);
          setPriceImpact(null);
          setRoute(null);
          setToAmount("");

          // Haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }
        } else if (matchedToken && !matchedToken.hasBalance) {
          toast.error(`No ${token.symbol} balance available`);
        }
      }
      setShowFromTokenSearch(false);
    },
    [allCoins]
  );

  const handleToTokenSelect = useCallback(
    async (token: CoinGeckoToken | null) => {
      if (token) {
        console.log("[Swap] handleToTokenSelect called with:", token.symbol, token.id, "mint:", token.mint);

        // Close the search dialog immediately for better UX
        setShowToTokenSearch(false);

        // Resolve the mint address using all available sources (including async Jupiter lookup)
        let resolvedMint = token.mint || resolveMintAddress(undefined, token.id, token.symbol);

        // If no mint found synchronously, try async lookup from Jupiter
        if (!resolvedMint) {
          console.log("[Swap] No sync mint found, trying Jupiter API for", token.symbol);
          resolvedMint = await resolveMintAddressAsync(undefined, token.id, token.symbol);
        }

        console.log("[Swap] Resolved mint for", token.symbol, ":", resolvedMint);

        // Only Solana network tokens are supported for swap (Jupiter only supports Solana)
        // Check if this is actually a Solana-native token, not just a wrapped version
        if (!isSolanaToken({ id: token.id, symbol: token.symbol, name: token.name, mint: resolvedMint || undefined })) {
          toast.error(`Swapping ${token.symbol} is coming soon! Only Solana network tokens are currently supported.`);
          return;
        }

        // Also check if no mint could be resolved
        if (!resolvedMint) {
          toast.error(`Swapping ${token.symbol} is coming soon! Only Solana network tokens are currently supported.`);
          return;
        }

        // Find the token in allCoins (check symbol, aliases, and id)
        const tokenSymbolUpper = token.symbol.toUpperCase();
        const tokenAliases = SYMBOL_ALIASES[tokenSymbolUpper] || [];

        let matchedToken = allCoins.find(
          (t) => {
            const coinSymbolUpper = t.symbol.toUpperCase();
            return (
              coinSymbolUpper === tokenSymbolUpper ||
              tokenAliases.includes(coinSymbolUpper) ||
              t.id === token.id
            );
          }
        );

        if (matchedToken) {
          console.log("[Swap] Found matched token:", matchedToken.symbol, "current mint:", matchedToken.mint);

          // If we have a resolved mint but the matched one doesn't, update it
          if (resolvedMint && !matchedToken.mint) {
            console.log("[Swap] Updating allCoins with resolved mint:", resolvedMint);
            // Update the token in allCoins with the mint address
            setAllCoins(prev => prev.map(t =>
              t.id === matchedToken!.id
                ? { ...t, mint: resolvedMint }
                : t
            ));
          }

          // Set the token ID first, then clear quote data
          // This order is important for React's batched updates
          setToToken(matchedToken.id);

          // Clear old quote data and output amount — the useEffect will refetch
          setJupiterQuote(null);
          setUltraOrderResponse(null);
          setPriceImpact(null);
          setRoute(null);
          setToAmount("");

          // Haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }
        } else {
          // Token not found in allCoins - add it as a new option
          console.log("[Swap] Token not in allCoins, adding:", token.symbol, "mint:", resolvedMint);
          const newToken: SwapToken = {
            id: token.id,
            symbol: token.symbol.toUpperCase(),
            name: token.name,
            logo: token.symbol.charAt(0).toUpperCase(),
            logoUrl: token.image,
            price: token.current_price || 0,
            balance: 0,
            hasBalance: false,
            mint: resolvedMint || undefined,
            network: 'solana', // Assume Solana for now since Jupiter only supports Solana
          };

          // IMPORTANT: Use functional update to add token and set selection atomically
          // Set token ID first so it's available when allCoins updates
          setToToken(token.id);
          setAllCoins((prev: SwapToken[]) => {
            // Check if already added (avoid duplicates)
            if (prev.some((t: SwapToken) => t.id === token.id)) {
              return prev;
            }
            return [...prev, newToken];
          });

          // Clear old quote data and output amount — the useEffect will refetch
          setJupiterQuote(null);
          setUltraOrderResponse(null);
          setPriceImpact(null);
          setRoute(null);
          setToAmount("");

          // Haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }
        }

      } else {
        setShowToTokenSearch(false);
      }
    },
    [allCoins]
  );

  // Function to play success sound - uses sound from sounds.ts
  const playSuccessSound = useCallback(() => {
    playSwapExchange(); // Two-way swoosh like tokens exchanging
  }, []);

  // Calculate exchange rate - memoized (must be before handleSwap)
  // Prefer Jupiter quote rate when available, fall back to token prices
  const exchangeRate = useMemo(
    () => {
      // If we have Jupiter quote with valid amounts, calculate rate from quote
      if (jupiterQuote && fromAmount && parseFloat(fromAmount) > 0) {
        const inputAmt = parseFloat(fromAmount);
        const outputAmt = jupiterQuote.outputAmount;
        if (outputAmt > 0 && inputAmt > 0) {
          return (outputAmt / inputAmt).toFixed(6);
        }
      }

      // Fallback to token prices
      if (!fromTokenData || !toTokenData) return "0";
      // Prevent division by zero or invalid prices
      if (!toTokenData.price || toTokenData.price <= 0) return "0";
      if (!fromTokenData.price || fromTokenData.price <= 0) return "0";
      return (fromTokenData.price / toTokenData.price).toFixed(6);
    },
    [fromTokenData, toTokenData, jupiterQuote, fromAmount]
  );

  // Calculate estimated fee (0.5% of swap in USD) - memoized
  const estimatedFeeUSD = useMemo(
    () =>
      fromAmount && fromTokenData
        ? (parseFloat(fromAmount) * fromTokenData.price * 0.005).toFixed(2)
        : "0",
    [fromAmount, fromTokenData]
  );

  // Calculate fee in fromToken (0.5% of fromAmount) - memoized
  const feeInFromToken = useMemo(
    () => (fromAmount ? parseFloat(fromAmount) * 0.005 : 0),
    [fromAmount]
  );

  // Price impact warning threshold (for legacy swaps) - memoized
  const legacyPriceImpact = useMemo(
    () =>
      fromAmount && fromTokenData && toTokenData
        ? (
            ((parseFloat(fromAmount) * fromTokenData.price) / 1000000) *
            100
          ).toFixed(2)
        : "0",
    [fromAmount, fromTokenData, toTokenData]
  );

  // Check SOL balance for transaction fees - memoized
  // Minimum SOL needed: ~0.005 SOL for fees + potential token account creation
  const MIN_SOL_FOR_SWAP = 0.005;
  const solTokenData = useMemo(
    () => allCoins.find((t) => t.symbol.toUpperCase() === 'SOL' && t.hasBalance),
    [allCoins]
  );
  const solBalance = useMemo(
    () => solTokenData?.balance || 0,
    [solTokenData]
  );
  const hasEnoughSolForFees = useMemo(
    () => solBalance >= MIN_SOL_FOR_SWAP,
    [solBalance]
  );
  const isSwappingSol = useMemo(
    () => fromTokenData?.symbol.toUpperCase() === 'SOL',
    [fromTokenData]
  );

  // Calculate the total SOL needed when swapping FROM SOL:
  // swapAmount + fee (0.5% in SOL) + tx fee for fee transfer (~0.000005) + min SOL for rent (0.005)
  const totalSolNeededForSwap = useMemo(() => {
    if (!isSwappingSol || !fromAmount) return 0;
    const swapAmount = parseFloat(fromAmount);
    const feeAmount = swapAmount * 0.005; // 0.5% fee in SOL
    const feeTxCost = 0.000005; // Transaction cost for fee transfer
    return swapAmount + feeAmount + feeTxCost + MIN_SOL_FOR_SWAP;
  }, [isSwappingSol, fromAmount]);

  // If swapping SOL, check if remaining balance after swap covers fees
  const solBalanceAfterSwap = useMemo(() => {
    if (!isSwappingSol || !fromAmount) return solBalance;
    const swapAmount = parseFloat(fromAmount);
    const feeAmount = swapAmount * 0.005; // 0.5% fee in SOL
    const feeTxCost = 0.000005; // Transaction cost for fee transfer
    return Math.max(0, solBalance - swapAmount - feeAmount - feeTxCost);
  }, [isSwappingSol, fromAmount, solBalance]);

  // Check if user has enough balance for the swap (including fee when swapping SOL)
  const hasInsufficientBalance = useMemo(() => {
    if (!fromTokenData || !fromAmount) return false;
    const amount = parseFloat(fromAmount);
    if (amount <= 0) return false;

    if (isSwappingSol) {
      // When swapping SOL, check total SOL needed
      return totalSolNeededForSwap > fromTokenData.balance;
    } else {
      // When swapping other tokens, just check the token balance
      return amount > fromTokenData.balance;
    }
  }, [fromTokenData, fromAmount, isSwappingSol, totalSolNeededForSwap]);

  const willHaveEnoughSolAfterSwap = useMemo(
    () => isSwappingSol ? solBalanceAfterSwap >= MIN_SOL_FOR_SWAP : hasEnoughSolForFees,
    [isSwappingSol, solBalanceAfterSwap, hasEnoughSolForFees]
  );

  const showPriceImpactWarning = useMemo(
    () =>
      priceImpact
        ? Math.abs(priceImpact) > 1
        : parseFloat(legacyPriceImpact) > 1,
    [priceImpact, legacyPriceImpact]
  );

  const handleSwap = useCallback(async () => {
    try {
      setIsSwapping(true);
      setShowSwapAnimation(true);

      // Check if we should use Jupiter (real swap) or simulated swap
      const shouldUseJupiter = useJupiter && jupiterQuote;

      if (shouldUseJupiter) {
        // Real Jupiter swap
        console.log("🔄 Executing real Jupiter swap...");
        await handleJupiterSwap();
      } else {
        // Simulated swap (legacy)
        await handleSimulatedSwap();
      }
    } catch (error: any) {
      console.error("Swap error:", error);

      // Better error messages
      let errorMessage = "Failed to complete swap. Please try again.";

      if (error.message?.includes("Not enough SOL for token account rent")) {
        // Pass through the detailed rent error message
        errorMessage = error.message;
      } else if (error.message?.includes("Insufficient balance")) {
        errorMessage = "Insufficient balance to complete swap.";
      } else if (error.message?.includes("locked")) {
        errorMessage = "Please unlock your wallet first.";
      } else if (error.message?.includes("quote")) {
        errorMessage = "Quote expired. Please try again.";
      } else if (error.message?.includes("confirmation timeout")) {
        errorMessage = "Transaction was sent but confirmation is slow. Check Activity tab or Solscan for status.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("connection")
      ) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show failed dialog with details
      setFailedSwapData({
        fromToken: {
          symbol: fromTokenData?.symbol || "",
          name: fromTokenData?.name || "",
          amount: fromAmount,
          logo: fromTokenData?.logo || "",
          logoUrl: fromTokenData?.logoUrl || "",
          color: fromTokenData?.color || "from-purple-500 to-purple-600",
        },
        toToken: {
          symbol: toTokenData?.symbol || "",
          name: toTokenData?.name || "",
          logo: toTokenData?.logo || "",
          logoUrl: toTokenData?.logoUrl || "",
          color: toTokenData?.color || "from-blue-500 to-blue-600",
        },
        error: errorMessage,
      });
      setShowFailedDialog(true);
      setShowSwapAnimation(false);
      setIsSwapping(false);
    }

    // Inner function for Jupiter swap
    async function handleJupiterSwap() {
      try {
        if (!jupiterQuote) {
          throw new Error("No quote available. Please wait for quote to load.");
        }

        if (!wallet.mnemonic) {
          throw new Error("Wallet is locked. Please unlock first.");
        }

        // Check if active account is an imported account with its own mnemonic
        const activeAccount = AccountManager.getActiveAccount();
        let mnemonicToUse = wallet.mnemonic;
        let privateKeyBase58: string | undefined;

        // Check if this is a private key import
        const storedPrivateKeys = JSON.parse(localStorage.getItem('saturn_imported_private_keys') || '{}');
        const accountAddress = activeAccount?.addresses?.solana;
        const hasStoredPrivateKey = accountAddress && storedPrivateKeys[accountAddress];

        if (hasStoredPrivateKey || activeAccount?.isPrivateKeyImport) {
          // This account has its own private key in storage - use it
          const storedKey = storedPrivateKeys[accountAddress!];
          if (storedKey) {
            const decrypted = await decryptImportedSecret(storedKey, wallet.password);
            if (decrypted) {
              privateKeyBase58 = decrypted;
            } else {
              throw new Error("Failed to decrypt private key. Please delete and re-import this account.");
            }
          } else {
            throw new Error("Private key not found for this account. Please delete and re-import it.");
          }
        } else if (activeAccount?.isImportedSeedPhrase) {
          // Check if this imported account has an encrypted mnemonic stored
          if (activeAccount?.encryptedMnemonic) {
            if (!wallet.password) {
              throw new Error("Wallet password not available. Please unlock the wallet again.");
            }

            const decryptedMnemonic = await decryptWithPassword(activeAccount.encryptedMnemonic, wallet.password);
            if (!decryptedMnemonic) {
              throw new Error("Failed to decrypt imported account mnemonic. Please delete and re-import this account.");
            }

            mnemonicToUse = decryptedMnemonic;
          } else if (activeAccount?.importedWalletId) {
            // Check for mnemonic stored in saturn_imported_mnemonics (encrypted or legacy base64)
            const storedMnemonics = JSON.parse(localStorage.getItem('saturn_imported_mnemonics') || '{}');
            const storedMnemonic = storedMnemonics[activeAccount.importedWalletId];
            if (storedMnemonic) {
              const decrypted = await decryptImportedSecret(storedMnemonic, wallet.password);
              if (decrypted) {
                mnemonicToUse = decrypted;
              } else {
                throw new Error("Failed to decrypt imported account mnemonic. Please delete and re-import this account.");
              }
            } else {
              throw new Error("Imported account mnemonic not found. Please delete and re-import this account.");
            }
          } else {
            // This is an old imported account without encrypted mnemonic
            // User needs to re-import it with the new system
            throw new Error("This imported account needs to be re-imported. Please delete it and import again using Settings > Add Account.");
          }
        }

        // PRE-CHECK: Only check if user has the destination token already
        // If they already have the token, no rent is needed
        const hasDestToken = tokens.some(t =>
          t.symbol?.toUpperCase() === toTokenData?.symbol?.toUpperCase() && t.amount > 0
        );

        // Get the account index for derivation
        const accountIndexToUse = activeAccount?.accountIndex ?? 0;

        // Execute swap - use Ultra API if order response is available, otherwise legacy
        // Check for requestId (always present in Ultra API) rather than transaction field
        let result;
        if (ultraOrderResponse && ultraOrderResponse.requestId) {
          console.log("🚀 [Swap] Executing via Jupiter Ultra API (referral fees enabled)...");
          console.log("🚀 [Swap] Ultra API Request ID:", ultraOrderResponse.requestId);
          console.log("🚀 [Swap] Has transaction:", !!ultraOrderResponse.transaction);
          result = await executeUltraSwap({
            mnemonic: mnemonicToUse,
            quoteResponse: jupiterQuote,
            orderResponse: ultraOrderResponse,
            accountIndex: accountIndexToUse,
            isTestnet: network.isTestnet,
            privateKeyBase58,
          });
        } else {
          console.log("🔄 [Swap] Executing via Jupiter Legacy API...");
          result = await executeJupiterSwap({
            mnemonic: mnemonicToUse,
            quoteResponse: jupiterQuote,
            accountIndex: accountIndexToUse,
            isTestnet: network.isTestnet,
            privateKeyBase58,
          });
        }

        if (!result.success) {
          throw new Error(result.error || "Failed to execute swap");
        }

        console.log("✅ [Swap] Swap successful!");
        console.log("✅ [Swap] Signature:", result.signature);
        console.log("✅ [Swap] Used Ultra API:", !!ultraOrderResponse);

        // Transfer platform fee (0.5%) directly to fee wallet
        // Only on mainnet with a valid output amount
        const actualOutputAmount = result.outputAmount || jupiterQuote?.outputAmount || parseFloat(toAmount) || 0;

        if (!network.isTestnet && actualOutputAmount > 0) {
          try {
            // Get SOL price from wallet tokens (most reliable source)
            const solToken = tokens.find(t => t.symbol === 'SOL');
            const solPrice = solToken?.price || 0;

            // Calculate fee based on input value in SOL equivalent
            const inputAmount = parseFloat(fromAmount) || 0;
            const inputTokenPrice = fromTokenData?.price || 0;
            let feeAmountSOL = 0;

            if (fromTokenData?.symbol === 'SOL') {
              // Swapping SOL directly - fee is simply 0.5% of input
              feeAmountSOL = inputAmount * (PLATFORM_FEE_BPS / 10000);
            } else if (inputTokenPrice > 0 && solPrice > 0) {
              // Have both prices - convert input value to SOL equivalent
              const inputValueUSD = inputAmount * inputTokenPrice;
              const inputValueSOL = inputValueUSD / solPrice;
              feeAmountSOL = inputValueSOL * (PLATFORM_FEE_BPS / 10000);
            } else if (solPrice > 0 && jupiterQuote?.exchangeRate) {
              // Fallback: use Jupiter quote exchange rate to estimate value
              // If output is USDC/USDT, we know the USD value from the output amount
              const outputSymbol = toTokenData?.symbol?.toUpperCase();
              if (outputSymbol === 'USDC' || outputSymbol === 'USDT') {
                const outputValueUSD = actualOutputAmount;
                const inputValueSOL = outputValueUSD / solPrice;
                feeAmountSOL = inputValueSOL * (PLATFORM_FEE_BPS / 10000);
              } else if (toTokenData?.price && toTokenData.price > 0) {
                const outputValueUSD = actualOutputAmount * toTokenData.price;
                const inputValueSOL = outputValueUSD / solPrice;
                feeAmountSOL = inputValueSOL * (PLATFORM_FEE_BPS / 10000);
              }
            }

            // Skip if fee couldn't be calculated (no price data at all)
            if (feeAmountSOL <= 0) {
              console.warn("💰 [Swap] Could not calculate fee - no price data available");
              console.warn("💰 [Swap] inputPrice:", inputTokenPrice, "solPrice:", solPrice);
              // Store as pending fee for later collection
              try {
                const pendingFees = JSON.parse(localStorage.getItem('suprik_pending_fees') || '[]');
                pendingFees.push({
                  timestamp: Date.now(),
                  swapSignature: result.signature,
                  fromToken: fromTokenData?.symbol,
                  toToken: toTokenData?.symbol,
                  fromAmount: inputAmount,
                  toAmount: actualOutputAmount,
                  reason: 'no_price_data',
                });
                localStorage.setItem('suprik_pending_fees', JSON.stringify(pendingFees));
              } catch { /* ignore localStorage errors */ }
            } else {
              console.log("💰 [Swap] Collecting platform fee:", feeAmountSOL.toFixed(6), "SOL");
              console.log("💰 [Swap] Fee percentage:", PLATFORM_FEE_BPS / 100, "%");

              // Transfer fee with retry logic
              const attemptFeeTransfer = async (retriesLeft: number): Promise<void> => {
                const feeResult = await transferSwapFee({
                  mnemonic: mnemonicToUse,
                  feeAmountSOL,
                  accountIndex: accountIndexToUse,
                });

                if (feeResult.success && feeResult.signature) {
                  console.log("💰 [Swap] Fee transfer successful:", feeResult.signature);
                } else if (retriesLeft > 0) {
                  console.warn("💰 [Swap] Fee transfer failed, retrying in 3s...", feeResult.error);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  return attemptFeeTransfer(retriesLeft - 1);
                } else {
                  // All retries exhausted - store as pending
                  console.error("💰 [Swap] Fee transfer failed after all retries:", feeResult.error);
                  try {
                    const pendingFees = JSON.parse(localStorage.getItem('suprik_pending_fees') || '[]');
                    pendingFees.push({
                      timestamp: Date.now(),
                      swapSignature: result.signature,
                      fromToken: fromTokenData?.symbol,
                      toToken: toTokenData?.symbol,
                      feeAmountSOL,
                      reason: feeResult.error || 'transfer_failed',
                    });
                    localStorage.setItem('suprik_pending_fees', JSON.stringify(pendingFees));
                  } catch { /* ignore localStorage errors */ }
                }
              };

              // Run fee transfer in background with 2 retries
              attemptFeeTransfer(2).catch((feeError) => {
                console.error("💰 [Swap] Fee transfer error:", feeError);
              });
            }
          } catch (feeCalcError) {
            console.warn("💰 [Swap] Fee calculation error:", feeCalcError);
          }
        }

        // Save swap to local history (only on mainnet, not testnet)
        // Include mint addresses for symbol resolution in case symbol is "TOKEN"
        if (!network.isTestnet) {
          saveSwapToHistory({
            signature: result.signature || `swap_${Date.now()}`,
            fromToken: fromTokenData?.symbol || '',
            toToken: toTokenData?.symbol || '',
            fromAmount: parseFloat(fromAmount) || 0,
            toAmount: parseFloat(toAmount) || 0,
            rate: fromTokenData && toTokenData ? fromTokenData.price / toTokenData.price : undefined,
            fee: jupiterQuote?.fee ? jupiterQuote.fee * (fromTokenData?.price || 0) : undefined,
            feeAmount: jupiterQuote?.fee,
            walletAddress: wallet.addresses?.solana || '',
            fromMint: fromTokenData?.mint || jupiterQuote?.inputMint,
            toMint: toTokenData?.mint || jupiterQuote?.outputMint,
          });
        }

        // Play success sound
        playSuccessSound();

        await new Promise((resolve) => setTimeout(resolve, 500));

        setShowSwapAnimation(false);
        setIsSwapping(false);

        // Show success dialog with details
        setSuccessSwapData({
          fromToken: {
            symbol: fromTokenData?.symbol || "",
            name: fromTokenData?.name || "",
            amount: fromAmount,
            logo: fromTokenData?.logo || "",
            logoUrl: fromTokenData?.logoUrl || "",
            color: fromTokenData?.color || "from-purple-500 to-purple-600",
          },
          toToken: {
            symbol: toTokenData?.symbol || "",
            name: toTokenData?.name || "",
            amount: toAmount,
            logo: toTokenData?.logo || "",
            logoUrl: toTokenData?.logoUrl || "",
            color: toTokenData?.color || "from-blue-500 to-blue-600",
          },
          signature: result.signature,
          fee: jupiterQuote?.fee ? jupiterQuote.fee.toFixed(6) : undefined,
          feeUSD: jupiterQuote?.fee
            ? (jupiterQuote.fee * (fromTokenData?.price || 0)).toFixed(2)
            : undefined,
        });
        setShowSuccessDialog(true);

        // Reset form
        setFromAmount("");
        setToAmount("");
        setJupiterQuote(null);
        setUltraOrderResponse(null);
        setPriceImpact(null);
        setRoute(null);

        // Reload data
        loadRecentSwaps();

        if (onSwapComplete) {
          onSwapComplete();
        }

        // Trigger balance refresh
        window.dispatchEvent(new Event("walletBalanceUpdated"));
      } catch (error: any) {
        console.error("❌ [Swap] Jupiter swap error:", error);
        throw error;
      }
    }

    // Inner function for simulated swap
    async function handleSimulatedSwap() {
      try {
        // Simulate swap processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Calculate new balances with fee
        const fromAmountNum = parseFloat(fromAmount);
        const toAmountNum = parseFloat(toAmount);
        const feeAmount = feeInFromToken; // 0.5% fee in fromToken
        const totalDeducted = fromAmountNum + feeAmount; // Total deducted from balance

        // Check if user has enough balance including fee
        if (totalDeducted > fromTokenData.balance) {
          toast.error("Insufficient balance to cover swap amount and fee");
          setIsSwapping(false);
          setShowSwapAnimation(false);
          return;
        }

        const newFromBalance = fromTokenData.balance - totalDeducted;
        const newToBalance = toTokenData.balance + toAmountNum;

        // In testnet mode, update balance client-side only
        if (network.isTestnet) {
          console.log("🧪 [Swap] Testnet mode: Updating balances locally");

          // Update local state
          setAllCoins((prev) =>
            prev.map((coin) => {
              if (coin.id === fromTokenData.id) {
                return {
                  ...coin,
                  balance: newFromBalance,
                  hasBalance: newFromBalance > 0,
                };
              }
              if (coin.id === toTokenData.id) {
                return {
                  ...coin,
                  balance: newToBalance,
                  hasBalance: true,
                };
              }
              return coin;
            })
          );

          // Play success sound
          playSuccessSound();

          // Success feedback
          await new Promise((resolve) => setTimeout(resolve, 500));

          setShowSwapAnimation(false);
          setIsSwapping(false);

          // Show success dialog with details
          setSuccessSwapData({
            fromToken: {
              symbol: fromTokenData.symbol,
              name: fromTokenData.name,
              amount: fromAmount,
              logo: fromTokenData.logo,
              logoUrl: fromTokenData.logoUrl || "",
              color: "from-purple-500 to-purple-600",
            },
            toToken: {
              symbol: toTokenData.symbol,
              name: toTokenData.name,
              amount: toAmount,
              logo: toTokenData.logo,
              logoUrl: toTokenData.logoUrl || "",
              color: "from-blue-500 to-blue-600",
            },
            fee: feeAmount.toFixed(6),
            feeUSD: estimatedFeeUSD,
          });
          setShowSuccessDialog(true);

          // Reset form
          setFromAmount("");
          setToAmount("");

          // Trigger refresh in parent component to update home and activity
          if (onSwapComplete) {
            onSwapComplete();
          }

          // Also dispatch event for activity refresh
          window.dispatchEvent(new Event("walletBalanceUpdated"));

          return; // Exit early for testnet
        }

        // MAINNET MODE: Save swap to localStorage history
        try {
          const swapRecord = {
            id: `swap_${Date.now()}`,
            timestamp: new Date().toISOString(),
            fromToken: fromTokenData.symbol,
            toToken: toTokenData.symbol,
            fromAmount: fromAmountNum,
            toAmount: toAmountNum,
            exchangeRate,
            feeAmount,
            feeUSD: parseFloat(estimatedFeeUSD),
          };

          // Save to recent swaps in localStorage
          const key = `suprik_recent_swaps_${walletId}`;
          const existing = localStorage.getItem(key);
          const swaps = existing ? JSON.parse(existing) : [];
          swaps.unshift(swapRecord);
          // Keep only last 20 swaps
          localStorage.setItem(key, JSON.stringify(swaps.slice(0, 20)));

          console.log("[Swap] Swap saved to localStorage:", swapRecord);
        } catch (saveError) {
          console.error("[Swap] Error saving swap history:", saveError);
        }

        // Update local state
        setAllCoins((prev) =>
          prev.map((coin) => {
            if (coin.id === fromTokenData.id) {
              return {
                ...coin,
                balance: newFromBalance,
                hasBalance: newFromBalance > 0,
              };
            }
            if (coin.id === toTokenData.id) {
              return {
                ...coin,
                balance: newToBalance,
                hasBalance: true,
              };
            }
            return coin;
          })
        );

        // Play success sound
        playSuccessSound();

        // Success feedback
        await new Promise((resolve) => setTimeout(resolve, 500));

        setShowSwapAnimation(false);
        setIsSwapping(false);

        // Show success dialog with details
        setSuccessSwapData({
          fromToken: {
            symbol: fromTokenData.symbol,
            name: fromTokenData.name,
            amount: fromAmount,
            logo: fromTokenData.logo,
            logoUrl: fromTokenData.logoUrl || "",
            color: "from-purple-500 to-purple-600",
          },
          toToken: {
            symbol: toTokenData.symbol,
            name: toTokenData.name,
            amount: toAmount,
            logo: toTokenData.logo,
            logoUrl: toTokenData.logoUrl || "",
            color: "from-blue-500 to-blue-600",
          },
          fee: feeAmount.toFixed(6),
          feeUSD: estimatedFeeUSD,
        });
        setShowSuccessDialog(true);

        // Reset form
        setFromAmount("");
        setToAmount("");

        // Reload recent swaps
        loadRecentSwaps();

        // Trigger refresh in parent component to update home and activity
        if (onSwapComplete) {
          onSwapComplete();
        }

        // Also dispatch event for activity refresh
        window.dispatchEvent(new Event("walletBalanceUpdated"));
      } catch (error: any) {
        console.error("Simulated swap error:", error);
        toast.error(
          error.message || "Failed to complete swap. Please try again."
        );
        setShowSwapAnimation(false);
        setIsSwapping(false);
      }
    }
  }, [
    useJupiter,
    fromTokenData,
    toTokenData,
    fromAmount,
    wallet,
    walletId,
    jupiterQuote,
    slippage,
    playSuccessSound,
    onSwapComplete,
    loadRecentSwaps,
    toAmount,
    estimatedFeeUSD,
  ]);

  const initiateSwap = useCallback(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error("Please enter an amount");
      return;
    }
    if (!fromTokenData || parseFloat(fromAmount) > fromTokenData.balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!toTokenData) {
      toast.error("Please select a token to receive");
      return;
    }

    // Check if biometric confirmation is required
    if (
      biometricSettings?.enabled &&
      biometricSettings?.requireForTransactions
    ) {
      setShowBiometricConfirm(true);
    } else {
      handleSwap();
    }
  }, [fromAmount, fromTokenData, toTokenData, biometricSettings, handleSwap]);

  const handleFlip = useCallback(() => {
    // Only flip if both tokens are valid
    if (!fromToken || !toToken) return;

    // Check if the new "from" token has balance
    const newFromTokenData = allCoins.find((t) => t.id === toToken);
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
      const isFromSOL = fromTokenData.symbol.toUpperCase() === 'SOL';

      if (isFromSOL) {
        // When swapping FROM SOL, we need to reserve:
        // 1. Fee amount (0.5% of swap amount) - fee is paid in SOL
        // 2. Fee transaction cost (~0.000005 SOL)
        // 3. Minimum SOL for account rent (MIN_SOL_FOR_SWAP = 0.005)
        //
        // Formula: balance = swapAmount + (swapAmount * 0.005) + 0.000005 + 0.005
        //          balance = swapAmount * 1.005 + 0.005005
        //          swapAmount = (balance - 0.005005) / 1.005
        const reserveForFeeAndRent = 0.005005; // 0.005 min SOL + 0.000005 tx fee
        const availableForSwap = fromTokenData.balance - reserveForFeeAndRent;

        if (availableForSwap <= 0) {
          handleFromAmountChange("0");
          return;
        }

        // Max amount = availableForSwap / 1.005 (to account for the 0.5% fee)
        const maxSwapAmount = Math.floor((availableForSwap / 1.005) * 1000000) / 1000000;
        handleFromAmountChange(Math.max(0, maxSwapAmount).toString());
      } else {
        // When swapping FROM other tokens:
        // The 0.5% fee is still paid in SOL (not the input token)
        // So we can swap the full balance of the non-SOL token
        // But the UI shows "fee in fromToken" for display purposes
        // The actual fee transfer happens in SOL after the swap
        const maxSwapAmount = Math.floor(fromTokenData.balance * 1000000) / 1000000;
        handleFromAmountChange(maxSwapAmount.toString());
      }
    }
  }, [fromTokenData, handleFromAmountChange]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full">
        <div className="px-4 py-6 w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl">Swap</h1>
          </div>

          <div className="flex flex-col items-center justify-center mt-20">
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl">Swap</h1>
          </div>

          <div className="flex flex-col items-center justify-center mt-20">
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
        <div className="flex items-center justify-between mb-6">
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
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
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
          <div className="relative bg-slate-900/50 border border-slate-800/30 rounded-2xl p-5 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 h-6">
                <span className="text-slate-400 text-sm">You pay</span>
                {fromTokenData && fromTokenData.hasBalance ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">
                      Balance: {fromTokenData.balance.toFixed(4)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={setMaxAmount}
                      className="h-6 px-2 text-xs hover:bg-slate-900/50"
                      style={{ color: colors.accent }}
                    >
                      MAX
                    </Button>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm invisible">Balance: 0.0000</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFromTokenSearch(true)}
                  className="w-[140px] bg-slate-900/90 border text-white h-10 rounded-full px-3 flex items-center justify-between hover:bg-slate-800/90 transition-colors"
                  style={{ borderColor: `${colors.primary}80` }}
                >
                  {fromTokenData ? (
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
                  ) : (
                    <span className="text-slate-500">Select</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                <input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  min="0"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Prevent negative numbers
                    if (value === '' || parseFloat(value) >= 0) {
                      handleFromAmountChange(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent typing minus sign
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 bg-transparent border-0 text-2xl text-white font-medium placeholder:text-slate-700 h-14 focus:outline-none focus:ring-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {fromTokenData && fromAmount && (
                <div className="mt-2 text-slate-500 text-sm">
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
          <div className="relative bg-slate-900/50 border border-slate-800/30 rounded-2xl p-5 backdrop-blur-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 h-6">
                <span className="text-slate-400 text-sm">You receive</span>
                {toTokenData && toTokenData.hasBalance ? (
                  <span className="text-slate-400 text-sm">
                    Balance: {toTokenData.balance.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm invisible">Balance: 0.0000</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowToTokenSearch(true)}
                  className="w-[140px] bg-slate-900/90 border text-white h-10 rounded-full px-3 flex items-center justify-between hover:bg-slate-800/90 transition-colors"
                  style={{ borderColor: `${colors.primary}80` }}
                >
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
                    <span className="text-slate-500">Select</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                <div className="flex-1 text-2xl font-medium text-white h-14 flex items-center justify-center">
                  <span className="truncate">
                    {toAmount ? parseFloat(toAmount).toLocaleString('en-US', { maximumFractionDigits: 6 }) : "0.00"}
                  </span>
                </div>
              </div>

              {toTokenData && toAmount && (
                <div className="mt-2 text-slate-500 text-sm">
                  ≈ ${(parseFloat(toAmount) * toTokenData.price).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Impact Warning */}
        {showPriceImpactWarning && fromAmount && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-500 text-sm">
                  Price Impact: {priceImpact}%
                </p>
                <p className="text-yellow-500/70 text-xs mt-1">
                  This swap may have a significant price impact. Consider
                  breaking it into smaller trades.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insufficient SOL Warning */}
        {!network.isTestnet && !hasEnoughSolForFees && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">
                  Insufficient SOL for Transaction Fees
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  You need at least {MIN_SOL_FOR_SWAP} SOL to pay for transaction fees.
                  Current balance: {solBalance.toFixed(4)} SOL
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  Please deposit SOL to your wallet first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SOL Balance After Swap Warning */}
        {!network.isTestnet && isSwappingSol && fromAmount && hasEnoughSolForFees && !willHaveEnoughSolAfterSwap && (
          <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 text-sm font-medium">
                  Low SOL Balance After Swap
                </p>
                <p className="text-orange-400/70 text-xs mt-1">
                  After this swap, you'll have ~{solBalanceAfterSwap.toFixed(4)} SOL remaining.
                  You may not have enough for future transaction fees.
                </p>
                <p className="text-orange-400/70 text-xs mt-1">
                  Consider keeping at least {MIN_SOL_FOR_SWAP} SOL for fees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rate Info */}
        {fromAmount && (
          <div className="mt-4 bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Rate</span>
              <span className="text-white">
                {exchangeRate === "0" || parseFloat(exchangeRate) === 0
                  ? "Price unavailable"
                  : `1 ${fromTokenData?.symbol} ≈ ${exchangeRate} ${toTokenData?.symbol}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Fee (0.5%)</span>
              <div className="text-right">
                <span className="text-white">${estimatedFeeUSD}</span>
                <p className="text-slate-500 text-xs">
                  {isSwappingSol
                    ? `${feeInFromToken.toFixed(6)} SOL`
                    : `≈ ${feeInFromToken.toFixed(6)} SOL equivalent`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-400">Total Deducted</span>
              <span className="text-white">
                {isSwappingSol
                  ? `${(parseFloat(fromAmount || "0") + feeInFromToken + 0.005005).toFixed(6)} SOL`
                  : `${parseFloat(fromAmount || "0").toFixed(6)} ${fromTokenData?.symbol}`
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Slippage tolerance</span>
              <span className="text-white">{slippageMode === "auto" ? "3" : slippage}%</span>
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
            disabled={
              isSwapping ||
              !fromAmount ||
              parseFloat(fromAmount) <= 0 ||
              hasInsufficientBalance ||
              fromTokenOptions.length === 0 ||
              (!network.isTestnet && !hasEnoughSolForFees)
            }
            variant="theme"
            className="w-full h-14 mt-6 text-white disabled:opacity-50 shadow-lg transition-all hover:opacity-90"
            style={{
              background: !network.isTestnet && !hasEnoughSolForFees
                ? 'linear-gradient(to right, #dc2626, #b91c1c)'
                : `linear-gradient(to right, ${colors.primaryDark}, ${colors.primary})`,
              boxShadow: !network.isTestnet && !hasEnoughSolForFees
                ? '0 10px 25px -5px rgba(239, 68, 68, 0.3)'
                : `0 10px 25px -5px ${colors.primary}50`,
            }}
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
            ) : !network.isTestnet && !hasEnoughSolForFees ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Need SOL for fees</span>
              </div>
            ) : fromTokenOptions.length === 0 ? (
              "No tokens with balance"
            ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
              "Enter an amount"
            ) : hasInsufficientBalance ? (
              "Insufficient balance (including fee)"
            ) : (
              "Swap"
            )}
          </Button>
        </motion.div>

        {/* Testnet Mode Banner */}
        {network.isTestnet && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="text-blue-400 text-xl">🧪</div>
              <p className="text-sm text-blue-200">
                <strong>Testnet Mode Active</strong> - Swaps will be simulated
                (no real blockchain interaction)
              </p>
            </div>
          </div>
        )}

        {/* Recent Swaps */}
        {recentSwaps.length > 0 && (
          <div className="mt-6">
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
                        <span className="text-white text-sm">
                          {swap.fromAmount.toFixed(4)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {swap.fromToken}
                        </span>
                      </div>
                      <ArrowDown className="w-3 h-3 text-slate-600" />
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm">
                          {swap.toAmount.toFixed(4)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {swap.toToken}
                        </span>
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
                <span className="text-slate-400">
                  {slippageMode === "auto" ? "Auto (3%)" : `${slippage}%`}
                </span>
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
                <span className="text-slate-400">
                  {priorityFee === "auto" ? "Auto" : `${priorityFeeValue} SOL`}
                </span>
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
                <span className="text-slate-400">
                  {tip === "auto" ? "Auto" : `${tipValue} SOL`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slippage Settings Dialog */}
      <Dialog
        open={showSlippageSettings}
        onOpenChange={setShowSlippageSettings}
      >
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
                  checked={slippageMode === "auto"}
                  onCheckedChange={(checked) =>
                    setSlippageMode(checked ? "auto" : "custom")
                  }
                />
              </div>
              <p className="text-sm text-slate-400 ml-11">
                Uses 3% slippage - good for most tokens including meme coins.
              </p>
            </div>

            {/* Preset Options */}
            {["0.5", "1", "2", "5", "10"].map((value) => (
              <button
                key={value}
                onClick={() => {
                  setSlippageMode("custom");
                  setSlippage(value);
                }}
                className={`w-full bg-slate-900/50 rounded-xl p-4 text-left transition-colors ${
                  slippageMode === "custom" && slippage === value
                    ? "ring-2"
                    : "hover:bg-slate-800/50"
                }`}
                style={{
                  ringColor: slippageMode === "custom" && slippage === value ? colors.primary : undefined,
                  boxShadow: slippageMode === "custom" && slippage === value ? `0 0 0 2px ${colors.primary}` : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{value}%</span>
                  {slippageMode === "custom" && slippage === value && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Custom Input */}
            <div
              className={`bg-slate-900/50 rounded-xl p-4 ${
                slippageMode === "custom" &&
                !["0.5", "1", "2", "5", "10"].includes(slippage)
                  ? "ring-2"
                  : ""
              }`}
              style={{
                boxShadow: slippageMode === "custom" && !["0.5", "1", "2", "5", "10"].includes(slippage) ? `0 0 0 2px ${colors.primary}` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white">Custom</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={slippage}
                    onChange={(e) => {
                      setSlippageMode("custom");
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
              Your transaction will fail if the price changes more than the
              slippage. Too high of a value will result in an unfavorable trade.
            </p>
          </div>

          {/* Done Button */}
          <div className="p-4 border-t border-slate-800/50 mt-auto shrink-0">
            <Button
              onClick={() => setShowSlippageSettings(false)}
              className="w-full h-14 text-white rounded-xl transition-colors"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Priority Fee Settings Dialog */}
      <Dialog
        open={showPriorityFeeSettings}
        onOpenChange={setShowPriorityFeeSettings}
      >
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
                  checked={priorityFee === "auto"}
                  onCheckedChange={(checked) =>
                    setPriorityFee(checked ? "auto" : "custom")
                  }
                />
              </div>
              <p className="text-sm text-slate-400 ml-11">
                Phantom automatically calculates fees based on real-time network
                conditions.
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
                      setPriorityFee("custom");
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
              className="w-full h-14 text-white rounded-xl transition-colors"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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
                  checked={tip === "auto"}
                  onCheckedChange={(checked) =>
                    setTip(checked ? "auto" : "custom")
                  }
                />
              </div>
              <p className="text-sm text-slate-400 ml-11">
                Phantom automatically calculates tips based on real-time network
                conditions.
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
                      setTip("custom");
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
              className="w-full h-14 text-white rounded-xl transition-colors"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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
                    "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)",
                  ],
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
                    y: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, (Math.random() - 0.5) * 200],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "#a855f7" : "#3b82f6",
                  }}
                />
              ))}

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Token Animation Container */}
                <div className="relative w-full h-40 mb-8">
                  {/* Connecting Line */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ overflow: "visible" }}
                  >
                    <motion.path
                      d="M 60 60 Q 140 20, 220 60"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: [0, 1, 0],
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
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
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 top-8"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(168, 85, 247, 0.4)",
                          "0 0 40px rgba(168, 85, 247, 0.6)",
                          "0 0 20px rgba(168, 85, 247, 0.4)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center border-4 border-purple-400/30"
                    >
                      {/* Glow ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.4), transparent)",
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
                      rotate: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                    className="absolute right-0 top-8"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(59, 130, 246, 0.4)",
                          "0 0 40px rgba(59, 130, 246, 0.6)",
                          "0 0 20px rgba(59, 130, 246, 0.4)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center border-4 border-blue-400/30"
                    >
                      {/* Glow ring */}
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.4), transparent)",
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
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
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
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ backgroundSize: "200% 200%" }}
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
                      <span className="text-purple-400/60">
                        {fromTokenData?.symbol}
                      </span>
                    </motion.div>

                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
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
                      <span className="text-blue-400/60">
                        {toTokenData?.symbol}
                      </span>
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
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
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

      {/* Failed Dialog */}
      {failedSwapData && (
        <SwapFailedDialog
          open={showFailedDialog}
          onOpenChange={(open) => {
            setShowFailedDialog(open);
            if (!open) {
              // Clear data when dialog closes
              setFailedSwapData(null);
            }
          }}
          fromToken={failedSwapData.fromToken}
          toToken={failedSwapData.toToken}
          error={failedSwapData.error}
          signature={failedSwapData.signature}
          isTestnet={network.isTestnet}
          onRetry={() => {
            // Retry the swap with same parameters
            if (fromAmount && fromToken && toToken) {
              handleSwap();
            }
          }}
        />
      )}

      {/* From Token Search Dialog - Shows wallet tokens first, then all tokens */}
      <Dialog open={showFromTokenSearch} onOpenChange={setShowFromTokenSearch}>
        <DialogContent
          className="p-0 max-w-full h-full m-0 bg-black border-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Select Token to Pay</DialogTitle>
          <Search
            walletId={walletId}
            onSelectToken={handleFromTokenSelect}
            onBack={() => setShowFromTokenSearch(false)}
            walletTokens={allCoins as WalletToken[]}
          />
        </DialogContent>
      </Dialog>

      {/* To Token Search Dialog - Shows wallet tokens first, then all tokens */}
      <Dialog open={showToTokenSearch} onOpenChange={setShowToTokenSearch}>
        <DialogContent
          className="p-0 max-w-full h-full m-0 bg-black border-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Select Token to Receive</DialogTitle>
          <Search
            walletId={walletId}
            onSelectToken={handleToTokenSelect}
            onBack={() => setShowToTokenSearch(false)}
            walletTokens={allCoins as WalletToken[]}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
