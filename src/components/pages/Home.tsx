import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Grid2X2, Send as SendIcon, Plus, Search, DollarSign, QrCode, ChevronDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../../utils/clipboard';
import { useWallet } from '../../utils/WalletContext';
import { fetchAllBalances, fetchTokenPrices } from '../../utils/blockchain';
import { loadAllTokens } from '../../utils/tokenLoader';
import { useNetwork } from '../../utils/NetworkContext';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';
import { Wrench } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { SendReceiveDialog } from '../SendReceiveDialog';
import { ReceiveDialog } from '../ReceiveDialog';
import { AddTokenDialog } from '../AddTokenDialog';
import { CoinDetail } from './CoinDetail';
import { TokenLogo } from '../TokenLogo';
import { AnimalAvatar } from '../AnimalAvatar';
import { BlockchainSetup } from '../BlockchainSetup';
import { AccountSwitcher } from '../AccountSwitcher';
import { AccountManager } from '../../utils/accountManager';
import { deriveAddresses } from '../../utils/wallet';
// import { usePullToRefresh } from '../../utils/mobile/usePullToRefresh';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getCustomTokens, removeDuplicateParabolic, type CustomToken } from '../../utils/customTokens';

interface HomeProps {
  onNavigate: (page: 'swap' | 'send' | 'search') => void;
  walletId: string;
  onTokensLoaded?: (tokens: Token[]) => void;
}

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
    mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8', // Real Parabolic AI Solana mint
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

export function Home({ onNavigate, walletId, onTokensLoaded }: HomeProps) {
  const { t, formatPrice } = useLanguage();
  const { gradient } = useTheme();
  const wallet = useWallet();
  const network = useNetwork();
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<{network: string, lastCheck: string} | null>(null);
  const [checkingBlockchain, setCheckingBlockchain] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date>(new Date());
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState('Account 1');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState(walletId);
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
      
      // Switch to the active account in WalletContext
      if (wallet.isUnlocked && activeAccount.accountIndex !== wallet.currentAccount) {
        wallet.switchAccount(activeAccount.accountIndex);
      }
    }
  }, []);

  // Load accounts from AccountManager
  useEffect(() => {
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
  }, [wallet.addresses, walletId]);

  // Handle switch account
  const handleSwitchAccount = async (accountId: string) => {
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

      console.log('[Home] ✅ State updated:', {
        accountId,
        name: account.name,
        profilePicture: account.profilePicture,
        emoji: account.selectedEmoji
      });

      // Refresh balances for new account
      setLoading(true);
      await loadBlockchainBalances();

      toast.success(`Switched to ${account.name}`);
      console.log('[Home] ✅ Account switched successfully');
    } catch (error) {
      console.error('[Home] Error switching account:', error);
      toast.error('Failed to switch account');
    }
  };

  // Handle create new account
  const handleCreateAccount = async () => {
    try {
      if (!wallet.mnemonic || !wallet.isUnlocked) {
        toast.error('Please unlock your wallet first');
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
  };

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
    setShowDebug(!showDebug);
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

  useEffect(() => {
    // 🧹 Cleanup: Remove duplicate PARAI token (silent cleanup)
    removeDuplicateParabolic();
    
    loadWalletInfo();
    loadBlockchainBalances();
    
    // 🧹 Cleanup duplicate tokens on mount (server-side)
    cleanupDuplicateTokens();
    
    // 🚀 OPTIMIZATION: Auto-refresh every 10 seconds (like Phantom) - prices are cached for 60s
    const priceInterval = setInterval(() => {
      if (wallet.isUnlocked && wallet.addresses) {
        console.log('[Home] ⚡ Auto-refreshing balances (fast mode)...');
        setLastPriceUpdate(new Date());
        loadBlockchainBalances(true);
      }
    }, 10000); // 10 seconds - faster than before!
    
    // Listen for custom event from DevModeDialog and Send page
    const handleBalanceUpdate = () => {
      console.log('[Home] Balance update event received, refreshing...');
      loadBlockchainBalances();
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
    
    window.addEventListener('walletBalanceUpdated', handleBalanceUpdate);
    window.addEventListener('profilePictureUpdated', handleProfileUpdate);
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    window.addEventListener('customTokensChanged', handleCustomTokensChanged);
    
    return () => {
      clearInterval(priceInterval);
      window.removeEventListener('walletBalanceUpdated', handleBalanceUpdate);
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('customTokensChanged', handleCustomTokensChanged);
    };
  }, [wallet.addresses, wallet.isUnlocked, walletId]);

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

  // Cleanup duplicate tokens (silent background task)
  const cleanupDuplicateTokens = async () => {
    try {
      console.log('[Home] 🧹 Starting duplicate token cleanup...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/cleanup-duplicate-tokens`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.removed > 0) {
          console.log('[Home] ✅ Cleaned up', data.removed, 'duplicate tokens:', data.duplicates);
          toast.success(`Removed ${data.removed} duplicate token(s)`, { duration: 3000 });
          // Refresh balances to reflect cleanup
          await fetchWalletBalances();
        } else {
          console.log('[Home] ✅ No duplicates found');
        }
      } else {
        console.error('[Home] Cleanup error:', await response.text());
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
      
      console.log('[Home] Fetching token logos from CoinGecko...');
      
      // Fetch first page of coins (top 100)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/coingecko-coins?page=1&per_page=100`,
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
        
        console.log('[Home] ✅ Token logos fetched and cached');
        return logoMap;
      }
      
      return {};
    } catch (error) {
      console.error('[Home] Error fetching token logos:', error);
      return {};
    }
  };

  const loadBlockchainBalances = async (isAutoRefresh: boolean = false) => {
    // Debug: Check wallet state
    console.log('[Home] 🔍 Wallet state check:', {
      hasAddresses: !!wallet.addresses,
      isUnlocked: wallet.isUnlocked,
      addresses: wallet.addresses,
      networkMode: network.networkMode,
      isTestnet: network.isTestnet,
      isAutoRefresh
    });
    
    // If wallet is unlocked and we have addresses, fetch from blockchain
    if (wallet.addresses && wallet.isUnlocked) {
      console.log('[Home] 🔗 Fetching balances from blockchain APIs in', network.isTestnet ? 'TESTNET' : 'MAINNET', 'mode');
      
      // Don't show loading skeleton on auto-refresh
      if (!isAutoRefresh) {
        setLoading(true);
      }
      
      try {
        // ========== USE NEW TOKEN LOADER - EXACTLY LIKE PHANTOM! ==========
        console.log('[Home] 🚀 Loading tokens using new Phantom-like auto-detection...');
        
        const newTokens = await loadAllTokens(
          wallet.addresses,
          network.networkMode,
          network.isTestnet
        );
        
        console.log('[Home] ✅ Loaded', newTokens.length, 'tokens');
        
        // Show empty state message if no tokens
        if (newTokens.length === 0 && network.isTestnet) {
          toast.info('No testnet tokens found. Get tokens from faucets!', { duration: 5000 });
        }
        
        // 🚀 CHECK FOR BALANCE CHANGES - emit event if balances changed
        if (isAutoRefresh && tokens.length > 0) {
          // Check if any token balance increased (receive)
          const balanceIncreases: string[] = [];
          
          newTokens.forEach(newToken => {
            const oldToken = tokens.find(t => t.symbol === newToken.symbol);
            if (oldToken && newToken.amount > oldToken.amount) {
              const increase = newToken.amount - oldToken.amount;
              balanceIncreases.push(`+${increase.toFixed(6)} ${newToken.symbol}`);
            }
          });
          
          // If balance increased, notify user
          if (balanceIncreases.length > 0) {
            console.log('[Home] 💰 Incoming transaction detected:', balanceIncreases.join(', '));
            toast.success(`Received: ${balanceIncreases.join(', ')}`, { duration: 5000 });
            window.dispatchEvent(new Event('walletBalanceUpdated'));
          } else {
            // Check if any balance changed at all
            const oldBalances = tokens.map(t => `${t.symbol}:${t.amount}`).sort().join(',');
            const newBalances = newTokens.map(t => `${t.symbol}:${t.amount}`).sort().join(',');
            
            if (oldBalances !== newBalances) {
              console.log('[Home] 💰 Balance changed detected! Notifying Activity page...');
              window.dispatchEvent(new Event('walletBalanceUpdated'));
            }
          }
        }
        
        setTokens(newTokens);
        onTokensLoaded?.(newTokens);
        setLastPriceUpdate(new Date());
      } catch (error) {
        console.error('[Home] Error fetching blockchain balances:', error);
        toast.error('Failed to fetch blockchain balances');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to server (legacy mode)
      console.log('[Home] ⚠️ Wallet not unlocked, using server balances');
      // fetchTokenPrices(); // REMOVED - causes error
      fetchWalletBalances();
    }
  };

  const fetchWalletBalances = async () => {
    try {
      console.log('[Home] Fetching wallet balances for wallet:', walletId);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet-tokens/${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Home] Wallet balances received:', Object.keys(data.tokens || {}).length, 'tokens');
        console.log('[Home] Token balances:', data.tokens);
        
        // Deduplicate tokens by mint address (not by symbol)
        // Create a map: mint -> token data
        const tokensByMint = new Map<string, TokenData>();
        
        // First, add default tokens
        defaultSolanaTokens.forEach(token => {
          tokensByMint.set(token.mint, token);
        });
        
        // Then, merge with stored tokens (stored tokens override if mint matches)
        Object.entries(data.tokens || {}).forEach(([symbol, storedToken]: [string, any]) => {
          const mint = storedToken.mint || symbol.toLowerCase();
          
          // Check if we already have this mint
          const existingToken = tokensByMint.get(mint);
          
          if (existingToken) {
            // Update existing token with stored data
            tokensByMint.set(mint, {
              ...existingToken,
              amount: storedToken.amount !== undefined ? storedToken.amount : existingToken.amount,
              name: storedToken.name || existingToken.name,
              symbol: storedToken.symbol || existingToken.symbol,
              logo: storedToken.logo || existingToken.logo,
              logoUrl: storedToken.logoUrl || existingToken.logoUrl,
            });
          } else {
            // New token - add it
            tokensByMint.set(mint, {
              mint: mint,
              name: storedToken.name || symbol,
              symbol: storedToken.symbol || symbol,
              amount: storedToken.amount || 0,
              logo: storedToken.logo || symbol.charAt(0),
              logoUrl: storedToken.logoUrl || '',
              color: storedToken.color || 'from-purple-500 to-purple-600',
              network: storedToken.network || 'solana',
            });
          }
        });
        
        // Convert map to array
        const updatedTokenList = Array.from(tokensByMint.values());
        
        console.log('[Home] ✅ Deduplicated tokens:', updatedTokenList.length, 'unique tokens by mint');
        
        // Now fetch prices with updated amounts (this is a refresh, not initial load)
        await fetchTokenPricesWithBalances(updatedTokenList, true);
      } else {
        // For fresh wallets, show 0 balances
        const zeroBalanceList = defaultSolanaTokens.map(token => ({ ...token, amount: 0 }));
        await fetchTokenPricesWithBalances(zeroBalanceList, true);
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      // Fallback to showing demo data with default tokens
      const symbols = ['SOL', 'ETH', 'BTC', 'USDC', 'USDT'];
      const prices = await fetchTokenPrices(symbols);
      console.log('[Home] Using fallback prices:', prices);
      setLoading(false);
    }
  };

  const fetchTokenPricesWithBalances = async (balances: TokenData[], isRefresh: boolean = false) => {
    try {
      console.log('Fetching token prices from backend...', isRefresh ? '(refresh)' : '(initial load)');
      
      // Extract unique symbols from balances
      const symbols = Array.from(new Set(balances.map(t => t.symbol)));
      
      // Use blockchain utility to fetch prices
      const pricesMap = await fetchTokenPrices(symbols);
      
      console.log('Token prices received:', pricesMap);
      
      // Map the price data to our token list with real balances
      const tokensWithPrices = balances.map((token, index) => {
        // Try to preserve existing price data if API fails for this token
        const existingToken = tokens.find(t => t.mint === token.mint);
        const price = pricesMap[token.symbol] || existingToken?.price || 0;
        const change24h = existingToken?.change || 0;
        const value = token.amount * price;
        
        // Use the logoUrl from token
        const imageUrl = existingToken?.logoUrl || token.logoUrl || '';
        
        return {
          id: index + 1,
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          amount: token.amount,
          value: value,
          price: price,
          change: change24h,
          logo: token.logo,
          logoUrl: imageUrl,
          color: token.color,
          network: token.network,
        };
      });

      // Only update tokens if we have valid data with prices
      if (tokensWithPrices.length > 0) {
        // Check if we have at least some prices (not all 0)
        const hasPrices = tokensWithPrices.some(t => t.price > 0);
        
        if (hasPrices || tokens.length === 0) {
          // Update if we have prices OR if this is the first load
          setTokens(tokensWithPrices);
          onTokensLoaded?.(tokensWithPrices);
          setLastPriceUpdate(new Date());
          console.log('Tokens updated successfully with real balances');
        } else if (isRefresh) {
          // During refresh, if no prices available, keep existing tokens but update amounts
          const updatedExistingTokens = tokens.map(existingToken => {
            const newToken = tokensWithPrices.find(t => t.mint === existingToken.mint);
            if (newToken) {
              // Update amount and recalculate value, but keep existing price
              return {
                ...existingToken,
                amount: newToken.amount,
                value: newToken.amount * existingToken.price,
              };
            }
            return existingToken;
          });
          setTokens(updatedExistingTokens);
          console.log('Tokens updated with new amounts, keeping existing prices');
        }
      }
    } catch (error: any) {
      console.error('Error fetching token prices:', error.message, error);
      // Only set fallback if tokens array is empty (initial load)
      if (tokens.length === 0) {
        setTokens(balances.map((token, index) => ({
          id: index + 1,
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          amount: token.amount,
          value: token.amount * 100, // Fallback value
          price: 100,
          change: 0,
          logo: token.logo,
          logoUrl: token.logoUrl,
          color: token.color,
          network: token.network,
        })));
      }
    } finally {
      // Only set loading to false on initial load, not on refresh
      if (!isRefresh) {
        setLoading(false);
      }
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
      console.log('========== MANUAL BLOCKCHAIN CHECK ==========');
      console.log('Checking blockchain for new transactions...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/check-blockchain-transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Blockchain check result:', data);
        
        // Update network status
        if (data.network) {
          setNetworkStatus({
            network: data.network,
            lastCheck: new Date().toLocaleTimeString()
          });
        }
        
        if (data.newTransactions && data.newTransactions.length > 0) {
          console.log('New transactions detected:', data.newTransactions);
          toast.success(`Found ${data.newTransactions.length} new transaction(s)!`);
          // Refresh balances
          await fetchWalletBalances();
        } else {
          console.log('No new transactions found, refreshing balances anyway...');
          // Even if no new transactions, still refresh to get updated balances
          await fetchWalletBalances();
          // Removed toast notification for silent refresh
        }
      } else {
        const errorData = await response.json();
        console.error('Blockchain check error response:', errorData);
        toast.error('Failed to check blockchain');
      }
      console.log('===========================================');
    } catch (error) {
      console.error('Error checking blockchain transactions:', error);
      toast.error('Error checking blockchain');
    } finally {
      setCheckingBlockchain(false);
    }
  };

  const totalBalance = tokens.reduce((sum, token) => sum + token.value, 0);
  const totalChange = tokens.reduce((sum, token) => sum + (token.amount * token.price * token.change / 100), 0);
  const totalChangePercent = totalBalance > 0 ? (totalChange / totalBalance) * 100 : 0;

  // Animate balance changes smoothly
  useEffect(() => {
    if (animatedBalance === 0 && totalBalance > 0) {
      // Initial load - set immediately without animation
      setAnimatedBalance(totalBalance);
      return;
    }

    const startValue = animatedBalance;
    const endValue = totalBalance;
    const duration = 1500; // 1.5 seconds for smoother animation
    const startTime = Date.now();

    // Easing function for smooth deceleration (ease-out cubic)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing function
      const easedProgress = easeOutCubic(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setAnimatedBalance(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedBalance(endValue);
      }
    };

    requestAnimationFrame(animate);
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
        {/* Blockchain Setup Alert */}
        <BlockchainSetup walletId={walletId} />

        {/* Header with Profile Info */}
        <motion.div 
          className="space-y-4 pt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Top row - Avatar and Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAccountSwitcherOpen(true)}
              className="flex items-center gap-3 hover:bg-slate-900/30 rounded-xl p-2 -ml-2 transition-all group"
            >
              <AnimalAvatar 
                size="md" 
                walletId={currentAccountId}
                profilePicture={profilePicture}
                selectedEmoji={selectedEmoji}
              />
              <div className="text-left">
                <p className="text-slate-400 text-sm">{username}</p>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-white font-semibold">Suprik Wallet</h2>
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
                onClick={() => {
                  setLastPriceUpdate(new Date());
                  checkBlockchainTransactions();
                  fetchWalletBalances();
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
        </motion.div>

        {/* Total Balance Card */}
        <motion.div 
          className="relative rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Background with dark overlay on image */}
          <div className="relative h-40">
            <ImageWithFallback
              src="https://images.pexels.com/photos/730564/pexels-photo-730564.jpeg"
              alt="Night sky background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/60" />
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full flex flex-col justify-center">
              <p className="text-purple-200 text-sm mb-2">{t.home.totalBalance}</p>
              {loading ? (
                <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse" />
              ) : (
                <motion.h1 
                  className="text-5xl tracking-tight text-white"
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
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="grid grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setReceiveOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all border border-slate-800/30"
          >
            <QrCode className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-slate-300">{t.home.receive}</span>
          </button>
          
          <button
            onClick={() => onNavigate('send')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all border border-slate-800/30"
          >
            <SendIcon className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-slate-300">{t.home.send}</span>
          </button>
          
          <button
            onClick={() => onNavigate('swap')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all border border-slate-800/30"
          >
            <RefreshCw className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-slate-300">{t.nav.swap}</span>
          </button>
          
          <button
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all border border-slate-800/30"
          >
            <DollarSign className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-slate-300">Buy</span>
          </button>
        </motion.div>

        {/* Tokens Section */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">{t.home.yourAssets}</h3>
            <button
              onClick={() => setAddTokenOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t.home.addToken}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-xl bg-slate-900/50 border border-slate-800/30 text-center space-y-3"
            >
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
                      className="block p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 transition-colors text-purple-300"
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
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredTokens.map((token, idx) => {
                const tokenChange = token.amount * token.price * token.change / 100;
                return (
                  <motion.button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className="w-full p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <TokenLogo 
                        logoUrl={token.logoUrl}
                        logo={token.logo}
                        name={token.name}
                        color={token.color}
                        symbol={token.symbol}
                        mint={token.mint}
                        size="md"
                      />
                      <div className="text-left">
                        <h4 className="text-white font-semibold">{token.name}</h4>
                        <p className="text-slate-400 text-sm">
                          {token.amount} {token.symbol}
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
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* View Disclosures */}
        <motion.div
          className="pt-2 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button className="flex items-center gap-2 text-slate-500 text-sm hover:text-slate-400 transition-colors">
            <span className="w-4 h-4 flex items-center justify-center">ⓘ</span>
            View disclosures
          </button>
        </motion.div>
      </div>

      <SendReceiveDialog open={sendOpen} onOpenChange={setSendOpen} mode="send" />
      <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} walletId={walletId} />
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
        currentAccount={{
          id: currentAccountId,
          name: username,
          addresses: {
            solana: wallet.addresses?.solana || '',
            ethereum: wallet.addresses?.ethereum || '',
          },
          profilePicture: profilePicture || undefined,
          selectedEmoji: selectedEmoji || undefined,
        }}
        accounts={accounts}
        onSwitchAccount={handleSwitchAccount}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}