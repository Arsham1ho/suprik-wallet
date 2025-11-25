/**
 * Saturn Wallet - Web3 Context
 * Global state management for Web3 wallet
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  generateSeedPhrase,
  validateSeedPhrase,
  encryptSeedPhrase,
  decryptSeedPhrase,
  storeWallet,
  retrieveWallet,
  deleteWallet,
  getPublicKey,
  deriveKeypairFromSeed,
  sendSOL,
  getBalance,
  setSessionSeed,
  getSessionSeed,
  clearSessionSeed,
  hasActiveSession,
  EncryptedWallet,
  WalletAccount,
  deriveMultipleAccounts
} from '../utils/web3/walletManager';

interface Web3WalletContextType {
  // Wallet state
  isUnlocked: boolean;
  currentAccount: WalletAccount | null;
  accounts: WalletAccount[];
  balance: number;
  
  // Wallet actions
  createWallet: (password: string) => Promise<{ walletId: string; seedPhrase: string }>;
  importWallet: (seedPhrase: string, password: string) => Promise<{ walletId: string }>;
  unlockWallet: (walletId: string, password: string) => Promise<boolean>;
  lockWallet: () => void;
  
  // Account management
  switchAccount: (accountIndex: number) => Promise<void>;
  addAccount: () => Promise<WalletAccount>;
  
  // Transactions
  send: (recipient: string, amount: number) => Promise<{ signature: string; success: boolean; error?: string }>;
  refreshBalance: () => Promise<void>;
  
  // Session
  sessionTimeout: number;
  extendSession: () => void;
  
  // Utilities
  exportSeedPhrase: (password: string) => Promise<string | null>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

const Web3WalletContext = createContext<Web3WalletContextType | undefined>(undefined);

export function useWeb3Wallet() {
  const context = useContext(Web3WalletContext);
  if (!context) {
    throw new Error('useWeb3Wallet must be used within Web3WalletProvider');
  }
  return context;
}

interface Web3WalletProviderProps {
  children: ReactNode;
}

export function Web3WalletProvider({ children }: Web3WalletProviderProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimeout] = useState(15 * 60 * 1000); // 15 minutes
  const [currentWalletId, setCurrentWalletId] = useState<string | null>(null);

  // Check for active session on mount
  useEffect(() => {
    const checkSession = async () => {
      const seed = getSessionSeed();
      if (seed) {
        try {
          const accs = deriveMultipleAccounts(seed, 1);
          if (accs.length > 0) {
            setAccounts(accs);
            setCurrentAccount(accs[0]);
            setIsUnlocked(true);
            await refreshBalance();
          }
        } catch (err) {
          clearSessionSeed();
        }
      }
    };
    
    checkSession();
  }, []);

  // Auto-refresh balance
  useEffect(() => {
    if (isUnlocked && currentAccount) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isUnlocked, currentAccount]);

  /**
   * Create a new wallet
   */
  const createWallet = async (password: string): Promise<{ walletId: string; seedPhrase: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate seed phrase
      const seedPhrase = generateSeedPhrase();
      
      // Encrypt and store
      const encrypted = encryptSeedPhrase(seedPhrase, password);
      const walletId = getPublicKey(seedPhrase, 0);
      storeWallet(walletId, encrypted);
      
      // Derive accounts
      const accs = deriveMultipleAccounts(seedPhrase, 1);
      
      // Set session
      setSessionSeed(seedPhrase, sessionTimeout);
      setAccounts(accs);
      setCurrentAccount(accs[0]);
      setIsUnlocked(true);
      setCurrentWalletId(walletId);
      
      // Refresh balance
      await refreshBalance();
      
      return { walletId, seedPhrase };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Import existing wallet
   */
  const importWallet = async (seedPhrase: string, password: string): Promise<{ walletId: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate seed phrase
      if (!validateSeedPhrase(seedPhrase)) {
        throw new Error('Invalid seed phrase');
      }
      
      // Encrypt and store
      const encrypted = encryptSeedPhrase(seedPhrase, password);
      const walletId = getPublicKey(seedPhrase, 0);
      storeWallet(walletId, encrypted);
      
      // Derive accounts
      const accs = deriveMultipleAccounts(seedPhrase, 1);
      
      // Set session
      setSessionSeed(seedPhrase, sessionTimeout);
      setAccounts(accs);
      setCurrentAccount(accs[0]);
      setIsUnlocked(true);
      setCurrentWalletId(walletId);
      
      // Refresh balance
      await refreshBalance();
      
      return { walletId };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unlock wallet with password
   */
  const unlockWallet = async (walletId: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Retrieve encrypted wallet
      const encrypted = retrieveWallet(walletId);
      if (!encrypted) {
        throw new Error('Wallet not found');
      }
      
      // Decrypt
      const seedPhrase = decryptSeedPhrase(encrypted, password);
      
      // Verify wallet ID matches
      const derivedWalletId = getPublicKey(seedPhrase, 0);
      if (derivedWalletId !== walletId) {
        throw new Error('Invalid wallet');
      }
      
      // Derive accounts
      const accs = deriveMultipleAccounts(seedPhrase, 1);
      
      // Set session
      setSessionSeed(seedPhrase, sessionTimeout);
      setAccounts(accs);
      setCurrentAccount(accs[0]);
      setIsUnlocked(true);
      setCurrentWalletId(walletId);
      
      // Refresh balance
      await refreshBalance();
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lock wallet
   */
  const lockWallet = () => {
    clearSessionSeed();
    setIsUnlocked(false);
    setCurrentAccount(null);
    setAccounts([]);
    setBalance(0);
    setCurrentWalletId(null);
  };

  /**
   * Switch to different account
   */
  const switchAccount = async (accountIndex: number) => {
    const seed = getSessionSeed();
    if (!seed) {
      throw new Error('Wallet is locked');
    }
    
    const acc = accounts.find(a => a.index === accountIndex);
    if (acc) {
      setCurrentAccount(acc);
      await refreshBalance();
    }
  };

  /**
   * Add new account
   */
  const addAccount = async (): Promise<WalletAccount> => {
    const seed = getSessionSeed();
    if (!seed) {
      throw new Error('Wallet is locked');
    }
    
    const newIndex = accounts.length;
    const newAccounts = deriveMultipleAccounts(seed, newIndex + 1);
    const newAccount = newAccounts[newIndex];
    
    setAccounts(newAccounts);
    
    return newAccount;
  };

  /**
   * Send SOL
   */
  const send = async (recipient: string, amount: number) => {
    const seed = getSessionSeed();
    if (!seed || !currentAccount) {
      throw new Error('Wallet is locked');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await sendSOL(seed, recipient, amount, currentAccount.index);
      
      if (result.success) {
        // Refresh balance after successful send
        setTimeout(() => refreshBalance(), 2000);
      }
      
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh balance
   */
  const refreshBalance = async () => {
    if (!currentAccount) return;
    
    try {
      const bal = await getBalance(currentAccount.publicKey);
      setBalance(bal);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  /**
   * Extend session
   */
  const extendSession = () => {
    const seed = getSessionSeed();
    if (seed) {
      setSessionSeed(seed, sessionTimeout);
    }
  };

  /**
   * Export seed phrase (requires password)
   */
  const exportSeedPhrase = async (password: string): Promise<string | null> => {
    if (!currentWalletId) {
      throw new Error('No wallet loaded');
    }
    
    try {
      const encrypted = retrieveWallet(currentWalletId);
      if (!encrypted) {
        throw new Error('Wallet not found');
      }
      
      const seedPhrase = decryptSeedPhrase(encrypted, password);
      return seedPhrase;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const value: Web3WalletContextType = {
    isUnlocked,
    currentAccount,
    accounts,
    balance,
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    switchAccount,
    addAccount,
    send,
    refreshBalance,
    sessionTimeout,
    extendSession,
    exportSeedPhrase,
    loading,
    error,
  };

  return (
    <Web3WalletContext.Provider value={value}>
      {children}
    </Web3WalletContext.Provider>
  );
}
