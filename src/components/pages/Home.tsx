import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Grid2X2, Send as SendIcon, Plus, Search, DollarSign, QrCode, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '../../utils/clipboard';
import { useWallet } from '../../utils/WalletContext';
import { loadAllTokens } from '../../utils/tokenLoader';
import { useNetwork } from '../../utils/NetworkContext';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';
import { Wrench, TrendingUp } from 'lucide-react';
import { SendReceiveDialog } from '../SendReceiveDialog';
import { AddTokenDialog } from '../AddTokenDialog';
import { CoinDetail } from './CoinDetail';
import { TokenLogo } from '../TokenLogo';
import { AnimalAvatar } from '../AnimalAvatar';
// BlockchainSetup removed - not needed for production
import { AccountSwitcher } from '../AccountSwitcher';
import { ImportWalletDialog } from '../ImportWalletDialog';
import { AccountManager } from '../../utils/accountManager';
import { deriveAddresses } from '../../utils/wallet';
// import { usePullToRefresh } from '../../utils/mobile/usePullToRefresh';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getCustomTokens, removeDuplicateParabolic, type CustomToken } from '../../utils/customTokens';
import { TOKEN_REGISTRY, TOKEN_BY_SYMBOL } from '../../utils/tokenRegistry';
import { STOCK_BY_MINT } from '../../utils/stockTokens';
import balanceBackgroundImg from '../../assets/balance-bg.png';
import dollarBgImage from 'figma:asset/03e3917f15913824a7f09aea55d83b590255a690.png';
import chartGrowthImg from 'figma:asset/cf0c640acfd7594fc19f2f68c33b585fb257787d.png';
import circuitBoardImg from 'figma:asset/33819ceff9748d2e7acb552e77a691621fc959ae.png';
import galaxyImg from 'figma:asset/5b4b9e5bc3dce63bd529dad0b6d15398841deffb.png';
import atomImg from 'figma:asset/87f8b32663f196ec1a0eb5a25bdc487bcfefae9d.png';
import techAtomImg from 'figma:asset/5aa70e98ce3aee3ece131f170f241d48a15c7bb9.png';
import cosmicAtomImg from 'figma:asset/6dddf15e38d9de8af29c1069d4e32f01893e25c6.png';
// Custom background images
import purpleSmokeImg from '../../assets/purple-smoke-bg.png';
import neonAtomImg from '../../assets/neon-atom-bg.png';

interface HomeProps {
  onNavigate: (page: 'swap' | 'send' | 'receive' | 'search') => void;
  walletId: string;
  onTokensLoaded?: (tokens: Token[]) => void;
  isActive?: boolean;
}

const balanceBackgrounds: { [key: string]: string } = {
  'none': '', // No background image
  'cosmic-atom': cosmicAtomImg,
  'tech-atom': techAtomImg,
  'atom': atomImg,
  'galaxy': galaxyImg,
  'circuit-board': circuitBoardImg,
  'chart-growth': chartGrowthImg,
  'digital-money': 'https://images.unsplash.com/photo-1694217363951-f922ec85f7e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbW9uZXklMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2NDUyNjM0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  'gemini-dollar': 'https://i.ibb.co/wNSSLqZL/Gemini-Generated-Image-vhrk9dvhrk9dvhrk.png',
  'bitcoin-stack': 'https://cdn.theatlantic.com/thumbor/1QQCcjt02QXBNLgdiLtZL-i1yHU=/0x144:3500x2113/960x540/media/img/mt/2017/11/RTX3KA07/original.jpg',
  'nft-world': 'https://png.pngtree.com/thumb_back/fh260/background/20230704/pngtree-3d-render-of-crypto-currency-and-nft-composition-image_3828737.jpg',
  'multi-coins': 'https://media.istockphoto.com/id/1034363382/photo/coins-of-various-cryptocurrencies.jpg?s=612x612&w=0&k=20&c=-ia1tKJeGeoJ7bWN8i6Udzq92MZ9T9vi--OFT6fVsiA=',
  'crypto-future': 'https://t4.ftcdn.net/jpg/11/97/30/75/360_F_1197307541_NvhbbyeEs6zfVKuT6vtPnwpSIjbosTKW.jpg',
  // New backgrounds
  'solana-purple': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'blockchain-network': 'https://images.unsplash.com/photo-1639322537228-f710d846310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'digital-grid': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'abstract-purple': 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'neon-city': 'https://images.unsplash.com/photo-1545486332-9e0999c535b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'space-nebula': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'aurora-sky': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'ocean-waves': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'purple-smoke': purpleSmokeImg,
  'neon-atom': neonAtomImg
};

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

interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  amount: number;
  logo: string;
  logoUrl: string;
  color: string;
  network: string;
}

const defaultSolanaTokens: TokenData[] = [
  {
    mint: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    amount: 0, // Will be loaded from blockchain
    logo: '◎',
    logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    color: 'from-purple-500 to-purple-600',
    network: 'solana'
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    amount: 0,
    logo: '$',
    logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    color: 'from-blue-500 to-blue-600',
    network: 'solana'
  },
  {
    mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
    name: 'Parabolic AI',
    symbol: 'PAI',
    amount: 0,
    logo: 'P',
    logoUrl: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
    color: 'from-cyan-500 to-blue-600',
    network: 'solana'
  },
];

// Coming Soon Networks (disabled for now, will be enabled later)
const comingSoonNetworks = [
  {
    mint: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: 0,
    logo: '₿',
    logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    color: 'from-orange-400 to-orange-500',
    network: 'bitcoin'
  },
  {
    mint: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    amount: 0,
    logo: 'Ξ',
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    color: 'from-slate-400 to-slate-500',
    network: 'ethereum'
  },
];

export function Home({ onNavigate, walletId, onTokensLoaded, isActive }: HomeProps) {
  const { t, formatPrice } = useLanguage();
  const { gradient, colors } = useTheme();
  const wallet = useWallet();
  const network = useNetwork();

  // Activity tracking refs - used to pause intervals when Home is hidden
  const isActiveRef = useRef(isActive ?? true);
  const lastFetchTimeRef = useRef<number>(Date.now());
  const prevActiveRef = useRef(isActive);
  // Ref to track last confirmed balances for change detection (avoids stale closure issues)
  const lastConfirmedBalancesRef = useRef<Map<string, number>>(new Map());
  const [sendOpen, setSendOpen] = useState(false);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [balanceBackground, setBalanceBackground] = useState<string>(() => {
    return localStorage.getItem('balanceBackground') || 'none';
  });
  const [tokens, setTokens] = useState<Token[]>([]);
  const [allVerifiedTokens, setAllVerifiedTokens] = useState<Token[]>([]);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAllTokens, setLoadingAllTokens] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{network: string, lastCheck: string} | null>(null);
  const [checkingBlockchain, setCheckingBlockchain] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date>(new Date());
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState('Account 1');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMode, setImportMode] = useState<'seed-phrase' | 'private-key'>('seed-phrase');
  const [currentAccountId, setCurrentAccountId] = useState(walletId);
  const [activeAccountAddress, setActiveAccountAddress] = useState<string | null>(null);
  const [receiveBtnTapped, setReceiveBtnTapped] = useState(false);
  const [sendBtnTapped, setSendBtnTapped] = useState(false);
  const [swapBtnTapped, setSwapBtnTapped] = useState(false);
  const [buyBtnTapped, setBuyBtnTapped] = useState(false);
  // Track if initial animation has played to prevent re-animations on data refresh
  const [hasAnimated, setHasAnimated] = useState(false);

  // Ref to track wallet state for interval callback (avoids recreating interval)
  const walletStateRef = useRef({ isUnlocked: wallet.isUnlocked, addresses: wallet.addresses });

  // Sync isActive ref with prop
  useEffect(() => { isActiveRef.current = isActive ?? true; }, [isActive]);

  // Soft refresh when returning to Home after being hidden
  useEffect(() => {
    const wasInactive = prevActiveRef.current === false;
    const isNowActive = isActive === true;
    prevActiveRef.current = isActive;
    if (wasInactive && isNowActive) {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch > 30000) {
        console.log('[Home] Returning to home, data stale, refreshing silently...');
        loadBlockchainBalances(true);
      }
    }
  }, [isActive]);
  const [accounts, setAccounts] = useState([
    {
      id: walletId,
      name: 'Account 1',
      addresses: {
        solana: wallet.addresses?.solana || '',
        ethereum: wallet.addresses?.ethereum || '',
      },
      profilePicture,
      selectedEmoji,
    }
  ]);

  // Sync current account with AccountManager on mount
  useEffect(() => {
    const activeAccount = AccountManager.getActiveAccount();
    if (activeAccount) {
      console.log('[Home] 🔄 Loading active account from AccountManager:', activeAccount.name);
      setCurrentAccountId(activeAccount.id);
      setUsername(activeAccount.name);
      setProfilePicture(activeAccount.profilePicture || null);
      setSelectedEmoji(activeAccount.selectedEmoji || null);
      setActiveAccountAddress(activeAccount.addresses?.solana || null);

      // Switch to the active account in WalletContext
      if (wallet.isUnlocked && activeAccount.accountIndex !== wallet.currentAccount) {
        wallet.switchAccount(activeAccount.accountIndex);
      }
    }
  }, []);

  // Track previous addresses to avoid unnecessary re-renders
  const prevAddressesRef = useRef<string | null>(null);

  // Load accounts from AccountManager
  useEffect(() => {
    // Create a stable key from addresses to compare
    const addressKey = wallet.addresses?.solana || null;

    // Skip if addresses haven't actually changed
    if (addressKey === prevAddressesRef.current) {
      return;
    }
    prevAddressesRef.current = addressKey;

    const loadAccounts = () => {
      const storedAccounts = AccountManager.getAccounts();

      // If no accounts exist, initialize first account
      if (storedAccounts.length === 0 && wallet.addresses) {
        const firstAccount = AccountManager.initializeFirstAccount(
          walletId,
          {
            solana: wallet.addresses.solana,
            ethereum: wallet.addresses.ethereum,
          },
          username
        );
        setAccounts([firstAccount]);
        setCurrentAccountId(firstAccount.id);
      } else if (storedAccounts.length > 0) {
        setAccounts(storedAccounts);
      }
    };

    loadAccounts();
  }, [wallet.addresses?.solana, walletId]);

  // Listen for background changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newBackground = localStorage.getItem('balanceBackground') || 'none';
      setBalanceBackground(newBackground);
    };

    window.addEventListener('storage', handleStorageChange);

    // Check periodically for same-tab updates (reduced frequency to avoid battery drain)
    const interval = setInterval(() => {
      if (!isActiveRef.current) return; // Skip when Home is hidden
      const currentBg = localStorage.getItem('balanceBackground') || 'none';
      setBalanceBackground(prev => prev !== currentBg ? currentBg : prev);
    }, 5000); // Check every 5 seconds instead of 1

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []); // Empty dependency array - interval only created once

  // Listen for blockchain timeout events
  useEffect(() => {
    const handleBlockchainTimeout = (event: any) => {
      const { chain, error } = event.detail;
      console.log('[Home] ⚠️ Blockchain timeout detected:', chain, error);
      
      // Show a helpful toast message
      toast.error(
        `Network is slow. Retrying in background...`,
        { 
          duration: 5000,
          description: 'Your balances will update automatically when the network responds.'
        }
      );
      
      // Retry after a delay
      setTimeout(() => {
        console.log('[Home] 🔄 Auto-retrying after blockchain timeout...');
        loadBlockchainBalances(true); // silent retry
      }, 5000);
    };

    window.addEventListener('blockchainTimeout', handleBlockchainTimeout);
    
    return () => {
      window.removeEventListener('blockchainTimeout', handleBlockchainTimeout);
    };
  }, []);

  // Cache key for storing balances per account
  const getBalanceCacheKey = (address: string) => `suprik_balance_cache_${address}`;

  // Save balances to cache
  const cacheBalances = (address: string, tokensData: Token[]) => {
    try {
      const cacheData = {
        tokens: tokensData,
        timestamp: Date.now(),
      };
      localStorage.setItem(getBalanceCacheKey(address), JSON.stringify(cacheData));
    } catch (e) {
      console.error('[Home] Error caching balances:', e);
    }
  };

  // Load balances from cache
  const loadCachedBalances = (address: string): Token[] | null => {
    try {
      const cached = localStorage.getItem(getBalanceCacheKey(address));
      if (cached) {
        const data = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data.tokens;
        }
      }
      return null;
    } catch (e) {
      console.error('[Home] Error loading cached balances:', e);
      return null;
    }
  };

  // Handle switch account
  const handleSwitchAccount = useCallback(async (accountId: string) => {
    try {
      console.log('[Home] 🔄 Switching to account:', accountId);

      const account = AccountManager.getAccountById(accountId);
      if (!account) {
        toast.error('Account not found');
        return;
      }

      console.log('[Home] Found account:', account);
      console.log('[Home] Current account index:', wallet.currentAccount);
      console.log('[Home] Target account index:', account.accountIndex);

      // Switch account in WalletContext
      await wallet.switchAccount(account.accountIndex);

      // Update active account in AccountManager
      AccountManager.setActiveAccount(accountId);

      // Update local state - THIS IS THE KEY PART
      setCurrentAccountId(accountId);
      setUsername(account.name);
      setProfilePicture(account.profilePicture || null);
      setSelectedEmoji(account.selectedEmoji || null);
      setActiveAccountAddress(account.addresses?.solana || null);

      console.log('[Home] ✅ State updated:', {
        accountId,
        name: account.name,
        profilePicture: account.profilePicture,
        emoji: account.selectedEmoji
      });

      // Try to load cached balances first for instant display
      const cachedTokens = account.addresses?.solana
        ? loadCachedBalances(account.addresses.solana)
        : null;

      if (cachedTokens && cachedTokens.length > 0) {
        console.log('[Home] ⚡ Using cached balances for instant display');
        setTokens(cachedTokens);
        // Update confirmed balances ref for new account
        const cacheMap = new Map<string, number>();
        cachedTokens.forEach(t => cacheMap.set(t.symbol, t.amount));
        lastConfirmedBalancesRef.current = cacheMap;
        setLoading(false);
        // Refresh in background
        loadBlockchainBalances(true);
      } else {
        // No cache - show loading and fetch
        lastConfirmedBalancesRef.current = new Map(); // Reset for new account
        setLoading(true);
        await loadBlockchainBalances();
      }

      toast.success(`Switched to ${account.name}`);
      console.log('[Home] ✅ Account switched successfully');
    } catch (error) {
      console.error('[Home] Error switching account:', error);
      toast.error('Failed to switch account');
    }
  }, [wallet]);

  // Handle create new account
  const handleCreateAccount = useCallback(async () => {
    try {
      if (!wallet.isUnlocked) {
        toast.error('Please unlock your wallet first');
        return;
      }

      if (!wallet.mnemonic) {
        toast.error('Cannot create accounts from a private key wallet. Import a seed phrase wallet instead.');
        return;
      }

      // Validate mnemonic before deriving
      const { validateMnemonic } = await import('../../utils/wallet');
      const isValid = await validateMnemonic(wallet.mnemonic);
      if (!isValid) {
        toast.error('Cannot create accounts from a private key wallet. Import a seed phrase wallet instead.');
        return;
      }

      console.log('[Home] ➕ Creating new account...');
      
      // Get next account index
      const nextIndex = AccountManager.getNextAccountIndex();
      
      // Derive addresses for new account
      const newAddresses = await deriveAddresses(wallet.mnemonic, nextIndex);
      
      // Create account in AccountManager
      const newAccount = AccountManager.createNewAccount(
        walletId,
        {
          solana: newAddresses.solana,
          ethereum: newAddresses.ethereum,
        }
      );

      // Update local accounts list
      const updatedAccounts = AccountManager.getAccounts();
      setAccounts(updatedAccounts);

      toast.success(`Created ${newAccount.name}!`);
      console.log('[Home] ✅ New account created:', newAccount);
    } catch (error) {
      console.error('[Home] Error creating account:', error);
      toast.error('Failed to create account');
    }
  }, [wallet.mnemonic, wallet.isUnlocked, walletId]);

  // Debug function to show all token sources
  const debugTokens = () => {
    console.log('========== 🔍 TOKEN DEBUG PANEL ==========');
    
    // 1. Current tokens in state
    console.log('1️⃣ Current tokens in state:', tokens);
    
    // 2. Custom tokens in localStorage
    const customTokens = getCustomTokens();
    console.log('2️⃣ Custom tokens in localStorage:', customTokens);
    
    // 3. Check for PARAI/PAI in custom tokens
    const paraiTokens = customTokens.filter(t => 
      t.symbol === 'PARAI' || t.symbol === 'PAI' || 
      t.name.toLowerCase().includes('parabolic')
    );
    console.log('3️⃣ Parabolic tokens in custom storage:', paraiTokens);
    
    // 4. Default tokens
    console.log('4️⃣ Default Solana tokens:', defaultSolanaTokens);
    
    // 5. Check CoinGecko cache
    const coingeckoCache = localStorage.getItem('coingecko_coins_cache');
    if (coingeckoCache) {
      try {
        const parsed = JSON.parse(coingeckoCache);
        const coins = Array.isArray(parsed) ? parsed : (parsed.coins || parsed.data || []);
        
        if (Array.isArray(coins)) {
          const parabolicCoins = coins.filter((coin: any) => 
            coin.symbol?.toLowerCase() === 'parai' || 
            coin.symbol?.toLowerCase() === 'pai' ||
            coin.name?.toLowerCase().includes('parabolic')
          );
          console.log('5️⃣ Parabolic tokens in CoinGecko cache:', parabolicCoins);
        }
      } catch (e) {
        console.error('Error parsing coingecko cache:', e);
      }
    }
    
    // 6. Find duplicate Parabolic tokens in current state
    const parabolicInState = tokens.filter(t => 
      t.symbol === 'PARAI' || t.symbol === 'PAI' ||
      t.name.toLowerCase().includes('parabolic')
    );
    console.log('6️⃣ Parabolic tokens in current state:', parabolicInState);
    
    console.log('==========================================');
    
    // Show summary alert
    const summary = `
📊 TOKEN DEBUG SUMMARY:

Total tokens: ${tokens.length}
Parabolic tokens found: ${parabolicInState.length}

${parabolicInState.map((t, i) => `
Token ${i + 1}:
- Name: ${t.name}
- Symbol: ${t.symbol}
- Mint: ${t.mint}
- Amount: ${t.amount}
- Logo: ${t.logoUrl?.substring(0, 50)}...
`).join('\n')}

Check console for full details!
    `;
    
    alert(summary);
  };

  // Clear all cache and reload
  const clearAllCache = () => {
    if (!confirm('⚠️ This will clear ALL cached data and reload the page. Continue?')) {
      return;
    }
    
    console.log('🗑️ Clearing all cache...');
    
    // Clear specific cache keys
    localStorage.removeItem('coingecko_coins_cache');
    localStorage.removeItem('token_logos_cache');
    localStorage.removeItem('saturn_custom_tokens');
    
    console.log('✅ Cache cleared!');
    toast.success('Cache cleared! Reloading...');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Pull to refresh - Disabled for now (hook not available)
  // const handleRefresh = async () => {
  //   console.log('Pull-to-refresh triggered');
  //   await Promise.all([
  //     fetchWalletBalances(),
  //     checkBlockchainTransactions(),
  //   ]);
  //   toast.success('Refreshed successfully!', { duration: 2000 });
  // };

  // const { isPulling, pullDistance, isRefreshing, threshold } = usePullToRefresh({
  //   onRefresh: handleRefresh,
  // });

  // Initial load - run once on mount
  useEffect(() => {
    // 🧹 Cleanup: Remove duplicate PARAI token (silent cleanup)
    removeDuplicateParabolic();

    loadWalletInfo();

    // Try to load cached balances first for instant display
    const activeAccount = AccountManager.getActiveAccount();
    const address = activeAccount?.addresses?.solana || wallet.addresses?.solana;
    if (address) {
      const cachedTokens = loadCachedBalances(address);
      if (cachedTokens && cachedTokens.length > 0) {
        console.log('[Home] ⚡ Using cached balances on mount for instant display');
        setTokens(cachedTokens);
        // Initialize confirmed balances ref from cache so first refresh doesn't false-trigger
        const cacheMap = new Map<string, number>();
        cachedTokens.forEach(t => cacheMap.set(t.symbol, t.amount));
        lastConfirmedBalancesRef.current = cacheMap;
        setLoading(false);
        // Mark animations as complete after a short delay
        setTimeout(() => setHasAnimated(true), 1000);
        // Refresh in background
        loadBlockchainBalances(true);
      } else {
        loadBlockchainBalances().then(() => {
          // Mark animations as complete after initial load
          setTimeout(() => setHasAnimated(true), 1000);
        });
      }
    } else {
      loadBlockchainBalances().then(() => {
        // Mark animations as complete after initial load
        setTimeout(() => setHasAnimated(true), 1000);
      });
    }

    // 🧹 Cleanup duplicate tokens on mount (server-side)
    cleanupDuplicateTokens();
  }, [walletId]); // Only run on mount and when walletId changes
  
  // Keep wallet state ref updated
  useEffect(() => {
    walletStateRef.current = { isUnlocked: wallet.isUnlocked, addresses: wallet.addresses };
  }, [wallet.isUnlocked, wallet.addresses]);

  // Auto-refresh interval - separated to prevent memory leaks
  useEffect(() => {
    // 🚀 OPTIMIZATION: Auto-refresh every 30 seconds to reduce re-renders
    const priceInterval = setInterval(() => {
      // Skip when Home is hidden (saves battery on mobile)
      if (!isActiveRef.current) return;
      // Use ref to get current wallet state without recreating interval
      if (walletStateRef.current.isUnlocked && walletStateRef.current.addresses) {
        console.log('[Home] ⚡ Auto-refreshing balances...');
        // Don't update lastPriceUpdate here - it causes unnecessary re-renders
        // The time will update when loadBlockchainBalances completes
        loadBlockchainBalances(true);
      }
    }, 30000); // 30 seconds - reduced to prevent UI flickering

    return () => {
      clearInterval(priceInterval);
    };
  }, []); // Empty dependency - interval created only once
  
  // Event listeners - separated to run only once
  useEffect(() => {
    // Listen for custom event from DevModeDialog and Send page
    const handleBalanceUpdate = () => {
      console.log('[Home] Balance update event received, refreshing silently...');
      loadBlockchainBalances(true); // Silent refresh to avoid loading skeleton flash
    };
    
    // Listen for profile picture updates
    const handleProfileUpdate = () => {
      console.log('Profile picture updated, refreshing...');
      loadWalletInfo();
    };
    
    // Listen for avatar emoji updates
    const handleAvatarUpdate = () => {
      console.log('Avatar updated, refreshing...');
      loadWalletInfo();
    };
    
    // Listen for custom tokens changes from Search page
    const handleCustomTokensChanged = () => {
      console.log('[Home] Custom tokens changed, refreshing...');
      loadBlockchainBalances();
    };

    // Listen for wallet imported (new account added)
    const handleWalletImported = () => {
      console.log('[Home] 🔄 Wallet imported, refreshing accounts and balances...');
      // Reload accounts list
      const updatedAccounts = AccountManager.getAccounts();
      setAccounts(updatedAccounts);
      // Get the new active account
      const activeAccount = AccountManager.getActiveAccount();
      if (activeAccount) {
        setCurrentAccountId(activeAccount.id);
        setUsername(activeAccount.name);
        setActiveAccountAddress(activeAccount.addresses?.solana || null);
        // Load the emoji for the new account
        const savedEmoji = localStorage.getItem(`saturn_avatar_emoji_${activeAccount.id}`);
        setSelectedEmoji(savedEmoji);
      }
      // Refresh balances
      loadBlockchainBalances();
    };

    // Listen for account switched
    const handleAccountSwitched = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[Home] 🔄 Account switched event received:', customEvent.detail?.accountId);
      const activeAccount = AccountManager.getActiveAccount();
      if (activeAccount) {
        setCurrentAccountId(activeAccount.id);
        setUsername(activeAccount.name);
        setActiveAccountAddress(activeAccount.addresses?.solana || null);
        const savedEmoji = localStorage.getItem(`saturn_avatar_emoji_${activeAccount.id}`);
        setSelectedEmoji(savedEmoji);
      }
      // Refresh accounts list and balances
      const updatedAccounts = AccountManager.getAccounts();
      setAccounts(updatedAccounts);
      loadBlockchainBalances();
    };

    window.addEventListener('walletBalanceUpdated', handleBalanceUpdate);
    window.addEventListener('profilePictureUpdated', handleProfileUpdate);
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    window.addEventListener('customTokensChanged', handleCustomTokensChanged);
    window.addEventListener('walletImported', handleWalletImported);
    window.addEventListener('accountSwitched', handleAccountSwitched);

    return () => {
      window.removeEventListener('walletBalanceUpdated', handleBalanceUpdate);
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('customTokensChanged', handleCustomTokensChanged);
      window.removeEventListener('walletImported', handleWalletImported);
      window.removeEventListener('accountSwitched', handleAccountSwitched);
    };
  }, []); // Only run once on mount
  
  // Network change handler - CRITICAL FIX for network switching!
  const isInitialNetworkRef = useRef(true);
  useEffect(() => {
    // Skip on initial mount - the walletId effect already triggers the first load
    if (isInitialNetworkRef.current) {
      isInitialNetworkRef.current = false;
      return;
    }
    console.log('[Home] 🌐 Network changed to:', network.networkMode, '(testnet:', network.isTestnet, ')');
    // Reset tokens and reload when network changes
    setTokens([]);
    setLoading(true);
    loadBlockchainBalances();
  }, [network.networkMode]); // Reload when network changes

  const loadWalletInfo = async () => {
    try {
      // In client-side architecture, profile data is in localStorage
      const storedProfilePicture = localStorage.getItem('saturn_profile_picture') || null;
      const storedUsername = localStorage.getItem('saturn_username') || '@Account1';
      const savedEmoji = localStorage.getItem(`saturn_avatar_emoji_${walletId}`);
      
      setProfilePicture(storedProfilePicture);
      // Ensure username always starts with @
      setUsername(storedUsername.startsWith('@') ? storedUsername : '@' + storedUsername);
      
      if (savedEmoji) {
        setSelectedEmoji(savedEmoji);
      }
      
      console.log('[Home] ✅ Wallet info loaded from localStorage');
    } catch (error) {
      console.error('Error loading wallet info:', error);
    }
  };

  // Cleanup duplicate tokens (client-side, using localStorage)
  const cleanupDuplicateTokens = () => {
    try {
      console.log('[Home] 🧹 Starting duplicate token cleanup (client-side)...');

      // Use the client-side cleanup function
      const removed = removeDuplicateParabolic();

      if (removed) {
        console.log('[Home] ✅ Cleaned up duplicate PARAI token');
        toast.success('Removed duplicate token', { duration: 3000 });
        // Refresh balances to reflect cleanup
        loadBlockchainBalances(true);
      } else {
        console.log('[Home] ✅ No duplicates found');
      }
    } catch (error) {
      console.error('[Home] Error during cleanup:', error);
      // Silent failure - don't bother user
    }
  };

  // Fetch token logos from CoinGecko
  const fetchTokenLogos = async (symbols: string[]) => {
    try {
      const logoMap: { [key: string]: string } = {};
      
      // Try to get from cache first
      const cached = localStorage.getItem('token_logos_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            console.log('[Home] Using cached token logos');
            return parsed.data;
          }
        } catch (e) {
          console.error('Error parsing cache:', e);
        }
      }
      
      console.log('[Home] Loading token logos from TOKEN_REGISTRY (client-side)...');

      // Get logos from TOKEN_REGISTRY (instant, no API call)
      TOKEN_REGISTRY.forEach((token) => {
        const symbol = token.symbol.toUpperCase();
        if (token.image) {
          logoMap[symbol] = token.image;
        }
      });

      // Cache the logos
      localStorage.setItem('token_logos_cache', JSON.stringify({
        data: logoMap,
        timestamp: Date.now()
      }));

      console.log('[Home] ✅ Token logos loaded from registry');
      return logoMap;
    } catch (error) {
      console.error('[Home] Error fetching token logos:', error);
      return {};
    }
  };

  const loadBlockchainBalances = async (isAutoRefresh: boolean = false) => {
    // Get the active account's addresses - prioritize AccountManager over WalletContext
    const activeAccount = AccountManager.getActiveAccount();
    const addressesToUse = activeAccount?.addresses || wallet.addresses;

    // Debug: Check wallet state
    console.log('[Home] 🔍 Wallet state check:', {
      hasAddresses: !!addressesToUse,
      isUnlocked: wallet.isUnlocked,
      activeAccountId: activeAccount?.id,
      activeAccountName: activeAccount?.name,
      addresses: addressesToUse,
      networkMode: network.networkMode,
      isTestnet: network.isTestnet,
      isAutoRefresh
    });

    // If wallet is unlocked and we have addresses, fetch from blockchain
    if (addressesToUse && wallet.isUnlocked) {
      console.log('[Home] 🔗 Fetching balances from blockchain APIs in', network.isTestnet ? 'TESTNET' : 'MAINNET', 'mode');
      console.log('[Home] 📍 Using address:', addressesToUse.solana);

      // Don't show loading skeleton on auto-refresh
      if (!isAutoRefresh) {
        setLoading(true);
      }

      try {
        // ========== USE NEW TOKEN LOADER - EXACTLY LIKE PHANTOM! ==========
        console.log('[Home] 🚀 Loading tokens using new Phantom-like auto-detection...');

        const newTokens = await loadAllTokens(
          addressesToUse,
          network.networkMode,
          network.isTestnet
        );

        console.log('[Home] ✅ Loaded', newTokens.length, 'tokens');

        // Cache the balances for this account
        if (addressesToUse.solana && newTokens.length > 0) {
          cacheBalances(addressesToUse.solana, newTokens);
        }
        
        // Notify Activity page if balances changed
        if (isAutoRefresh && lastConfirmedBalancesRef.current.size > 0) {
          const changed = newTokens.some(t => lastConfirmedBalancesRef.current.get(t.symbol) !== t.amount);
          if (changed) {
            window.dispatchEvent(new Event('walletBalanceUpdated'));
          }
        }

        // Update confirmed balances ref
        const newBalanceMap = new Map<string, number>();
        newTokens.forEach(t => newBalanceMap.set(t.symbol, t.amount));
        lastConfirmedBalancesRef.current = newBalanceMap;
        
        setTokens(newTokens);
        onTokensLoaded?.(newTokens);
        setLastPriceUpdate(new Date());
        lastFetchTimeRef.current = Date.now();
      } catch (error: any) {
        console.error('[Home] Error fetching blockchain balances:', error);
        
        // Show user-friendly error message
        if (error.message === 'Failed to fetch' || error.name === 'AbortError') {
          console.warn('[Home] ⚠️ Server temporarily unavailable, showing cached data');
          // Don't show error toast for network issues - just fail silently and show cached data
        } else {
          toast.error('Unable to fetch latest balances. Showing cached data.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Wallet not unlocked - show empty state with default tokens
      console.log('[Home] ⚠️ Wallet not unlocked, showing default tokens');
      // Show default tokens with zero balances
      const defaultTokenList: Token[] = defaultSolanaTokens.map((t, idx) => ({
        id: idx + 1,
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        amount: 0,
        value: 0,
        price: 0,
        change: 0,
        logo: t.symbol.charAt(0),
        color: 'from-purple-600 to-purple-400',
        logoUrl: t.logoUrl,
        network: 'solana' as const,
      }));
      setTokens(defaultTokenList);
      setLoading(false);
    }
  };

  // Refresh wallet balances (client-side) - used by callbacks
  const fetchWalletBalances = () => {
    console.log('[Home] Refreshing wallet balances (client-side)...');
    loadBlockchainBalances(true);
  };

  // Fetch all verified tokens from TOKEN_REGISTRY (client-side, like Phantom)
  const fetchAllVerifiedTokens = async () => {
    try {
      setLoadingAllTokens(true);
      console.log('[Home] Loading all verified tokens from TOKEN_REGISTRY (client-side)...');

      // Merge TOKEN_REGISTRY with wallet tokens
      const mergedTokens: Token[] = [];
      const seenSymbols = new Set<string>();

      TOKEN_REGISTRY.forEach((registryToken, index) => {
        const symbolUpper = registryToken.symbol.toUpperCase();

        // Skip duplicates
        if (seenSymbols.has(symbolUpper)) {
          return;
        }
        seenSymbols.add(symbolUpper);

        // Find matching token in wallet
        const walletToken = tokens.find(t =>
          t.symbol.toLowerCase() === registryToken.symbol.toLowerCase() ||
          t.name.toLowerCase() === registryToken.name.toLowerCase()
        );

        mergedTokens.push({
          id: index + 1,
          mint: walletToken?.mint || registryToken.mint || registryToken.id,
          symbol: symbolUpper,
          name: registryToken.name,
          amount: walletToken?.amount || 0,
          value: walletToken?.value || 0,
          price: walletToken?.price || 0, // Price will be loaded dynamically
          change: walletToken?.change || 0,
          logo: symbolUpper.charAt(0),
          color: walletToken?.color || 'from-purple-600 to-purple-400',
          logoUrl: registryToken.image,
          network: walletToken?.network || 'solana',
        });
      });

      // Sort: tokens with balance first, then by price
      mergedTokens.sort((a, b) => {
        if (a.amount > 0 && b.amount === 0) return -1;
        if (a.amount === 0 && b.amount > 0) return 1;
        return b.price - a.price;
      });

      setAllVerifiedTokens(mergedTokens);
      console.log('[Home] Loaded', mergedTokens.length, 'verified tokens from registry');

    } catch (error) {
      console.error('[Home] Error fetching verified tokens:', error);
      toast.error('Failed to load all tokens');
    } finally {
      setLoadingAllTokens(false);
    }
  };

  const checkBlockchainTransactions = async () => {
    // Skip in testnet mode
    if (network.isTestnet) {
      console.log('[Home] ⏭️ Skipping blockchain check in testnet mode');
      // Just refresh from backend
      await loadBlockchainBalances(true);
      return;
    }
    
    // Prevent overlapping refresh requests
    if (checkingBlockchain) {
      console.log('Blockchain check already in progress, skipping...');
      return;
    }
    
    try {
      setCheckingBlockchain(true);
      console.log('========== MANUAL BLOCKCHAIN CHECK (client-side) ==========');
      console.log('Refreshing balances directly from blockchain...');

      // Update network status
      setNetworkStatus({
        network: network.isTestnet ? 'devnet' : 'mainnet',
        lastCheck: new Date().toLocaleTimeString()
      });

      // Use client-side blockchain balance loading
      await loadBlockchainBalances(false);

      console.log('Blockchain refresh complete');
      console.log('===========================================');
    } catch (error) {
      console.error('Error checking blockchain:', error);
      toast.error('Error checking blockchain');
    } finally {
      setCheckingBlockchain(false);
    }
  };

  // Calculate total balance with NaN protection
  const totalBalance = tokens.reduce((sum, token) => {
    const value = Number(token.value) || 0;
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
  const totalChange = tokens.reduce((sum, token) => {
    const change = (Number(token.amount) || 0) * (Number(token.price) || 0) * (Number(token.change) || 0) / 100;
    return sum + (isNaN(change) ? 0 : change);
  }, 0);
  const totalChangePercent = totalBalance > 0 ? (totalChange / totalBalance) * 100 : 0;

  // Debug logging for balance issues
  console.log('[Home] 💰 Balance calculation:', {
    tokenCount: tokens.length,
    totalBalance,
    totalChange,
    tokenValues: tokens.map(t => ({ symbol: t.symbol, value: t.value, amount: t.amount, price: t.price }))
  });

  // Set balance immediately - no animation to prevent misleading visual changes
  useEffect(() => {
    setAnimatedBalance(totalBalance > 0 && !isNaN(totalBalance) ? totalBalance : 0);
  }, [totalBalance]);

  const filteredTokens = tokens
    .filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // First, separate tokens with balance from those without
      const hasBalanceA = a.amount > 0;
      const hasBalanceB = b.amount > 0;
      
      // Tokens with balance always come first
      if (hasBalanceA && !hasBalanceB) return -1;
      if (!hasBalanceA && hasBalanceB) return 1;
      
      // If both have balance or both don't, sort by total value (amount × price) in descending order
      const valueA = a.amount * a.price;
      const valueB = b.amount * b.price;
      return valueB - valueA;
    });

  // Memoize currentAccount to prevent unnecessary re-renders of AccountSwitcher
  const currentAccountMemo = useMemo(() => ({
    id: currentAccountId,
    name: username,
    addresses: {
      solana: activeAccountAddress || wallet.addresses?.solana || '',
      ethereum: wallet.addresses?.ethereum || '',
    },
    profilePicture: profilePicture || undefined,
    selectedEmoji: selectedEmoji || undefined,
  }), [currentAccountId, username, activeAccountAddress, wallet.addresses?.solana, wallet.addresses?.ethereum, profilePicture, selectedEmoji]);

  // Show coin detail if a token is selected
  if (selectedToken) {
    return (
      <CoinDetail
        token={selectedToken}
        onBack={() => setSelectedToken(null)}
        walletId={walletId}
        onNavigateToSend={(token) => {
          setSelectedToken(null);
          onNavigate('send');
          // Store selected token for Send page
          localStorage.setItem('saturn_send_selected_token', JSON.stringify(token));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-3 space-y-6 w-full">
        {/* Header with Profile Info */}
        <div className="space-y-4 pt-2">
          {/* Top row - Avatar and Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAccountSwitcherOpen(true)}
              className="flex items-center gap-3 hover:bg-slate-900/30 rounded-xl p-2 -ml-2 transition-all group"
            >
              <AnimalAvatar
                size="md"
                walletId={activeAccountAddress || wallet.addresses?.solana || currentAccountId}
                profilePicture={profilePicture}
                selectedEmoji={selectedEmoji}
              />
              <div className="text-left">
                <p className="text-slate-400 text-sm">{username}</p>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-white font-semibold wallet-name-text">Suprik Wallet</h2>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                </div>
                {network.isTestnet && (
                  <p className="text-xs text-yellow-400/90 mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                    You are in Testnet
                  </p>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end mr-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-500">Live</span>
                </div>
                <span className="text-[10px] text-slate-600">
                  {lastPriceUpdate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <button
                className="p-2 hover:bg-slate-900/50 rounded-lg transition-colors relative"
                onClick={async () => {
                  setLastPriceUpdate(new Date());
                  setCheckingBlockchain(true);
                  try {
                    // Use background refresh to avoid balance flickering
                    await loadBlockchainBalances(true);
                  } finally {
                    setCheckingBlockchain(false);
                  }
                }}
                title="Refresh prices & blockchain balance"
                disabled={checkingBlockchain}
              >
                <RefreshCw className={`w-5 h-5 text-slate-400 ${checkingBlockchain ? 'animate-spin' : ''}`} />
                {checkingBlockchain && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                )}
              </button>
              <button 
                onClick={() => onNavigate('search')}
                className="p-2 hover:bg-slate-900/50 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background with dark overlay on image */}
          <div className="relative h-40">
            {/* Background Image - only show if not 'none' */}
            {balanceBackground !== 'none' && balanceBackgrounds[balanceBackground] && (
              <div
                className="absolute inset-0 z-0 opacity-50"
                style={{
                  backgroundImage: `url('${balanceBackgrounds[balanceBackground]}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            )}

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/60" />
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full flex flex-col justify-center overflow-hidden">
              
              {/* Content */}
              <div className="relative z-10">
                <p className="text-purple-200 text-sm mb-2">{t.home.totalBalance}</p>
                {loading ? (
                  <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse" />
                ) : (
                  <motion.h1
                    className="text-5xl tracking-tight text-white total-balance-amount"
                    key={totalBalance}
                    initial={{ scale: 1.05, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      duration: 0.4,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                  >
                    {formatPrice(animatedBalance)}
                  </motion.h1>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-sm font-semibold ${totalChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {totalChange >= 0 ? '+' : ''}{Math.abs(totalChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${totalChangePercent >= 0 ? 'bg-green-400/30 text-green-200' : 'bg-red-400/30 text-red-200'}`}>
                    {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <motion.button
            onClick={() => {
              setReceiveBtnTapped(true);
              setTimeout(() => setReceiveBtnTapped(false), 500);
              onNavigate('receive');
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: receiveBtnTapped ? `${colors.primary}4D` : 'rgba(15, 23, 42, 0.5)',
              borderColor: receiveBtnTapped ? `${colors.primary}80` : 'rgba(51, 65, 85, 0.3)',
              borderWidth: '1px',
              borderStyle: 'solid',
              transition: 'all 0.3s ease',
            }}
            animate={{
              scale: receiveBtnTapped ? [1, 1.08, 1] : 1,
              boxShadow: receiveBtnTapped
                ? [`0 0 0px ${colors.primary}00`, `0 0 25px ${colors.primary}99`, `0 0 0px ${colors.primary}00`]
                : `0 0 0px ${colors.primary}00`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse rings */}
            <AnimatePresence>
              {receiveBtnTapped && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.accent }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.secondary }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  />
                </>
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                rotate: receiveBtnTapped ? [0, -15, 15, -15, 0] : 0,
                scale: receiveBtnTapped ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <QrCode className="w-6 h-6" style={{ color: colors.accent }} />
            </motion.div>
            <span className="text-sm text-slate-300 relative z-10">{t.home.receive}</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              setSendBtnTapped(true);
              setTimeout(() => {
                setSendBtnTapped(false);
                onNavigate('send');
              }, 500);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: sendBtnTapped ? `${colors.primary}4D` : 'rgba(15, 23, 42, 0.5)',
              borderColor: sendBtnTapped ? `${colors.primary}80` : 'rgba(51, 65, 85, 0.3)',
              borderWidth: '1px',
              borderStyle: 'solid',
              transition: 'all 0.3s ease',
            }}
            animate={{
              scale: sendBtnTapped ? [1, 1.08, 1] : 1,
              boxShadow: sendBtnTapped
                ? [`0 0 0px ${colors.primary}00`, `0 0 25px ${colors.primary}99`, `0 0 0px ${colors.primary}00`]
                : `0 0 0px ${colors.primary}00`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse rings */}
            <AnimatePresence>
              {sendBtnTapped && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.accent }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.secondary }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  />
                </>
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                rotate: sendBtnTapped ? [0, -15, 15, -15, 0] : 0,
                scale: sendBtnTapped ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <SendIcon className="w-6 h-6" style={{ color: colors.accent }} />
            </motion.div>
            <span className="text-sm text-slate-300 relative z-10">{t.home.send}</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              setSwapBtnTapped(true);
              setTimeout(() => {
                setSwapBtnTapped(false);
                onNavigate('swap');
              }, 500);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: swapBtnTapped ? `${colors.primary}4D` : 'rgba(15, 23, 42, 0.5)',
              borderColor: swapBtnTapped ? `${colors.primary}80` : 'rgba(51, 65, 85, 0.3)',
              borderWidth: '1px',
              borderStyle: 'solid',
              transition: 'all 0.3s ease',
            }}
            animate={{
              scale: swapBtnTapped ? [1, 1.08, 1] : 1,
              boxShadow: swapBtnTapped
                ? [`0 0 0px ${colors.primary}00`, `0 0 25px ${colors.primary}99`, `0 0 0px ${colors.primary}00`]
                : `0 0 0px ${colors.primary}00`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse rings */}
            <AnimatePresence>
              {swapBtnTapped && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.accent }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.secondary }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  />
                </>
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                rotate: swapBtnTapped ? [0, -15, 15, -15, 0] : 0,
                scale: swapBtnTapped ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <RefreshCw className="w-6 h-6" style={{ color: colors.accent }} />
            </motion.div>
            <span className="text-sm text-slate-300 relative z-10">{t.nav.swap}</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              setBuyBtnTapped(true);
              setTimeout(() => setBuyBtnTapped(false), 500);
              toast.info('Buy feature coming soon!');
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: buyBtnTapped ? `${colors.primary}4D` : 'rgba(15, 23, 42, 0.5)',
              borderColor: buyBtnTapped ? `${colors.primary}80` : 'rgba(51, 65, 85, 0.3)',
              borderWidth: '1px',
              borderStyle: 'solid',
              transition: 'all 0.3s ease',
            }}
            animate={{
              scale: buyBtnTapped ? [1, 1.08, 1] : 1,
              boxShadow: buyBtnTapped
                ? [`0 0 0px ${colors.primary}00`, `0 0 25px ${colors.primary}99`, `0 0 0px ${colors.primary}00`]
                : `0 0 0px ${colors.primary}00`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse rings */}
            <AnimatePresence>
              {buyBtnTapped && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.accent }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: colors.secondary }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  />
                </>
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                rotate: buyBtnTapped ? [0, -15, 15, -15, 0] : 0,
                scale: buyBtnTapped ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <DollarSign className="w-6 h-6" style={{ color: colors.accent }} />
            </motion.div>
            <span className="text-sm text-slate-300 relative z-10">Buy</span>
          </motion.button>
        </div>

        {/* Tokens Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">{t.home.yourAssets}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!showAllTokens && allVerifiedTokens.length === 0) {
                    fetchAllVerifiedTokens();
                  }
                  setShowAllTokens(!showAllTokens);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors text-sm font-medium text-slate-300 flex items-center gap-1.5"
              >
                {showAllTokens ? 'My Tokens' : 'All Tokens'}
                {loadingAllTokens && <Loader2 className="w-3 h-3 animate-spin" />}
              </button>
              <button
                onClick={() => onNavigate('search')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-white"
                style={{
                  backgroundColor: colors.primary,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
              >
                <Plus className="w-4 h-4" />
                {t.home.addToken}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800/30 text-center space-y-3">
              {network.isTestnet ? (
                <>
                  <div className="text-4xl mb-2">🧪</div>
                  <h4 className="text-white font-semibold">No Testnet Tokens</h4>
                  <p className="text-slate-400 text-sm">
                    Get free testnet tokens from these faucets:
                  </p>
                  <div className="space-y-2 text-sm">
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: `${colors.primary}33`,
                        color: colors.accent,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}4D`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.primary}33`}
                    >
                      ◎ Solana Devnet Faucet
                    </a>
                    <a
                      href="https://sepoliafaucet.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition-colors text-blue-300"
                    >
                      Ξ Ethereum Sepolia Faucet
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">💰</div>
                  <h4 className="text-white font-semibold">No Tokens Found</h4>
                  <p className="text-slate-400 text-sm">
                    Add tokens using the + button above
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(showAllTokens ? allVerifiedTokens : filteredTokens).map((token, idx) => {
                const tokenChange = token.amount * token.price * token.change / 100;
                return (
                  <button
                    key={`${token.mint}-${token.symbol}-${idx}`}
                    onClick={() => setSelectedToken(token)}
                    className="w-full p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <TokenLogo
                          logoUrl={token.logoUrl}
                          logo={token.logo}
                          name={token.name}
                          color={token.color}
                          symbol={token.symbol}
                          mint={token.mint}
                          size="md"
                        />
                        {token.mint && STOCK_BY_MINT.has(token.mint) && (
                          <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1 z-10 bg-green-600 rounded-full w-5 h-5 flex items-center justify-center border-2 border-black shadow-md">
                            <TrendingUp className="w-3 h-3 text-white stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-white font-semibold">{token.name}</h4>
                        <p className="text-slate-400 text-sm">
                          {token.amount > 0 ? `${token.amount.toFixed(token.symbol === 'BTC' ? 8 : (token.symbol === 'ETH' || token.symbol === 'SOL' ? 4 : 2))} ${token.symbol}` : token.symbol}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {formatPrice(token.value)}
                      </p>
                      {token.amount > 0 && (
                        <p className={`text-sm ${tokenChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tokenChange >= 0 ? '+' : ''}{formatPrice(Math.abs(tokenChange))}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View Disclosures */}
        <div className="pt-2 pb-4">
          <button className="flex items-center gap-2 text-slate-500 text-sm hover:text-slate-400 transition-colors">
            <span className="w-4 h-4 flex items-center justify-center">ⓘ</span>
            View disclosures
          </button>
        </div>
      </div>

      <SendReceiveDialog open={sendOpen} onOpenChange={setSendOpen} mode="send" />
      <AddTokenDialog 
        open={addTokenOpen} 
        onOpenChange={setAddTokenOpen} 
        walletId={walletId}
        onTokenAdded={() => {
          // Refresh tokens when a new token is added
          fetchWalletBalances();
        }}
      />
      <AccountSwitcher
        open={accountSwitcherOpen}
        onOpenChange={setAccountSwitcherOpen}
        currentAccount={currentAccountMemo}
        accounts={accounts}
        onSwitchAccount={handleSwitchAccount}
        onCreateAccount={handleCreateAccount}
        onImportSeedPhrase={() => {
          setImportMode('seed-phrase');
          setShowImportDialog(true);
        }}
        onImportPrivateKey={() => {
          setImportMode('private-key');
          setShowImportDialog(true);
        }}
      />
      <ImportWalletDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        mode={importMode}
        isAddingAccount={true}
        onSuccess={() => {
          setShowImportDialog(false);
          // Reload accounts after import
          const updatedAccounts = AccountManager.getAccounts();
          setAccounts(updatedAccounts);
          // Update active account state
          const activeAccount = AccountManager.getActiveAccount();
          if (activeAccount) {
            setCurrentAccountId(activeAccount.id);
            setUsername(activeAccount.name);
            setActiveAccountAddress(activeAccount.addresses?.solana || null);
            setSelectedEmoji(activeAccount.selectedEmoji || null);
          }
          fetchWalletBalances();
        }}
      />
    </div>
  );
}