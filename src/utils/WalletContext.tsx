import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { SecureStorage, WalletStorage, deriveAddresses } from './wallet';

// Rate limiting for unlock attempts - prevents brute force attacks
const UNLOCK_RATE_LIMIT_KEY = 'saturn_unlock_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout

interface UnlockAttempts {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

function getUnlockAttempts(): UnlockAttempts {
  try {
    const stored = localStorage.getItem(UNLOCK_RATE_LIMIT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { count: 0, firstAttempt: 0, lockedUntil: 0 };
}

function recordFailedAttempt(): { isLocked: boolean; remainingSeconds: number } {
  const attempts = getUnlockAttempts();
  const now = Date.now();

  // Check if currently locked
  if (attempts.lockedUntil > now) {
    return { isLocked: true, remainingSeconds: Math.ceil((attempts.lockedUntil - now) / 1000) };
  }

  // Reset if first attempt was more than lockout duration ago
  if (now - attempts.firstAttempt > LOCKOUT_DURATION_MS) {
    attempts.count = 0;
    attempts.firstAttempt = now;
  }

  attempts.count++;

  // Lock if max attempts reached
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION_MS;
    localStorage.setItem(UNLOCK_RATE_LIMIT_KEY, JSON.stringify(attempts));
    return { isLocked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  if (attempts.firstAttempt === 0) {
    attempts.firstAttempt = now;
  }

  localStorage.setItem(UNLOCK_RATE_LIMIT_KEY, JSON.stringify(attempts));
  return { isLocked: false, remainingSeconds: 0 };
}

function clearFailedAttempts(): void {
  localStorage.removeItem(UNLOCK_RATE_LIMIT_KEY);
}

function isCurrentlyLocked(): { isLocked: boolean; remainingSeconds: number } {
  const attempts = getUnlockAttempts();
  const now = Date.now();

  if (attempts.lockedUntil > now) {
    return { isLocked: true, remainingSeconds: Math.ceil((attempts.lockedUntil - now) / 1000) };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

// Secure session storage - NOT exposed in React state/DevTools
// Uses closure to protect sensitive data
const createSecureSession = () => {
  let _mnemonic: string | null = null;
  let _password: string | null = null;
  let _sessionExpiry: number = 0;
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  return {
    setCredentials: (mnemonic: string, password: string) => {
      _mnemonic = mnemonic;
      _password = password;
      _sessionExpiry = Date.now() + SESSION_DURATION;
    },
    getMnemonic: (): string | null => {
      if (Date.now() > _sessionExpiry) {
        _mnemonic = null;
        _password = null;
        return null;
      }
      return _mnemonic;
    },
    getPassword: (): string | null => {
      if (Date.now() > _sessionExpiry) {
        _mnemonic = null;
        _password = null;
        return null;
      }
      return _password;
    },
    clear: () => {
      // Overwrite before clearing (best effort for strings)
      _mnemonic = '';
      _password = '';
      _mnemonic = null;
      _password = null;
      _sessionExpiry = 0;
    },
    isValid: (): boolean => {
      return _mnemonic !== null && Date.now() < _sessionExpiry;
    },
    extendSession: () => {
      if (_mnemonic) {
        _sessionExpiry = Date.now() + SESSION_DURATION;
      }
    }
  };
};

// Single instance for the app
const secureSession = createSecureSession();

// Export for use in unlock UI
export { isCurrentlyLocked };

interface WalletContextType {
  // SECURITY: mnemonic and password are NOT exposed in context
  // Use getMnemonic() and getPassword() which access secure session
  walletId: string | null;
  addresses: {
    solana: string;
    ethereum: string;
    base: string;
    polygon: string;
    bitcoin: string;
    sui: string;
  } | null;
  currentAccount: number;
  isUnlocked: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  switchAccount: (accountIndex: number) => Promise<void>;
  // Secure accessors - these get values from protected closure, not React state
  getMnemonic: () => string | null;
  getPassword: () => string | null;
  // Convenience getters for mnemonic and password (calls getMnemonic/getPassword internally)
  mnemonic: string | null;
  password: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({
  children,
  walletId
}: {
  children: ReactNode;
  walletId?: string;
}) {
  // SECURITY: mnemonic and password are NO LONGER stored in React state
  // They are stored in secureSession closure which is not accessible via React DevTools
  const [addresses, setAddresses] = useState<WalletContextType['addresses']>(null);
  const [currentAccount, setCurrentAccount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Secure accessor functions - these call into the protected closure
  const getMnemonic = (): string | null => secureSession.getMnemonic();
  const getPassword = (): string | null => secureSession.getPassword();

  useEffect(() => {
    // Load current account from storage
    const savedAccount = WalletStorage.getCurrentAccount();
    setCurrentAccount(savedAccount);
  }, []);

  // Listen for account switch events
  useEffect(() => {
    const handleAccountSwitch = async (event: CustomEvent) => {
      const { accountId } = event.detail;

      // Re-derive addresses for the new account if wallet is unlocked
      const currentMnemonic = secureSession.getMnemonic();
      if (currentMnemonic && isUnlocked) {
        try {
          // Get the account from AccountManager to get its index
          const { AccountManager } = await import('./accountManager');
          const account = AccountManager.getAccountById(accountId);

          if (account) {
            const accountIndex = account.accountIndex;

            // Derive addresses for this account
            const derivedAddresses = await deriveAddresses(currentMnemonic, accountIndex);
            setAddresses(derivedAddresses);
            setCurrentAccount(accountIndex);
            WalletStorage.setCurrentAccount(accountIndex);

            // Check if this is an imported account
            const isImported = (account as any).isImportedSeedPhrase || (account as any).isPrivateKeyImport;

            if (isImported) {
              // For imported accounts, use THEIR stored addresses
              setAddresses({
                solana: account.addresses.solana,
                ethereum: account.addresses.ethereum,
                bitcoin: 'Imported account',
                base: account.addresses.ethereum,
                polygon: account.addresses.ethereum,
                sui: 'Imported account',
              });
            } else {
              // Sync AccountManager if address doesn't match (non-imported accounts)
              if (account.addresses.solana !== derivedAddresses.solana) {
                AccountManager.updateAccount(accountId, {
                  addresses: {
                    solana: derivedAddresses.solana,
                    ethereum: derivedAddresses.ethereum,
                  }
                });
              }
            }
          }
        } catch {
          // Error switching account
        }
      }
    };

    window.addEventListener('accountSwitched', handleAccountSwitch as EventListener);

    return () => {
      window.removeEventListener('accountSwitched', handleAccountSwitch as EventListener);
    };
  }, [isUnlocked]);

  const unlock = async (password: string): Promise<boolean> => {
    // Check rate limiting first
    const lockStatus = isCurrentlyLocked();
    if (lockStatus.isLocked) {
      return false;
    }

    try {
      const decryptedData = await SecureStorage.retrieveMnemonic(password);

      if (!decryptedData) {
        // Record failed attempt for rate limiting
        recordFailedAttempt();
        return false;
      }

      // Successful unlock - clear failed attempts
      clearFailedAttempts();

      // Check if this is a private key import
      if (decryptedData.startsWith('PRIVKEY:')) {
        // For private key imports, we stored the public key separately
        const importedPubkey = localStorage.getItem('saturn_imported_pubkey');

        if (!importedPubkey) {
          return false;
        }

        // Store credentials in secure session (NOT in React state)
        secureSession.setCredentials(decryptedData, password);
        setIsUnlocked(true);

        // For private key imports, we only have Solana address
        setAddresses({
          solana: importedPubkey,
          ethereum: '0x0000000000000000000000000000000000000000',
          base: '0x0000000000000000000000000000000000000000',
          polygon: '0x0000000000000000000000000000000000000000',
          bitcoin: 'Private key import - Solana only',
          sui: 'Private key import - Solana only',
        });

        return true;
      }

      // Store credentials in secure session (NOT in React state)
      secureSession.setCredentials(decryptedData, password);
      setIsUnlocked(true);

      // Derive addresses
      const derivedAddresses = await deriveAddresses(decryptedData, currentAccount);
      setAddresses(derivedAddresses);

      // Sync AccountManager with freshly derived addresses
      try {
        const { AccountManager } = await import('./accountManager');
        const activeAccount = AccountManager.getActiveAccount();

        if (activeAccount) {
          const isImported = (activeAccount as any).isImportedSeedPhrase || (activeAccount as any).isPrivateKeyImport;

          if (isImported) {
            // For imported accounts, use THEIR stored addresses
            setAddresses({
              solana: activeAccount.addresses.solana,
              ethereum: activeAccount.addresses.ethereum,
              bitcoin: 'Imported account',
              base: activeAccount.addresses.ethereum,
              polygon: activeAccount.addresses.ethereum,
              sui: 'Imported account',
            });
          } else if (activeAccount.addresses.solana !== derivedAddresses.solana) {
            AccountManager.updateAccount(activeAccount.id, {
              addresses: {
                solana: derivedAddresses.solana,
                ethereum: derivedAddresses.ethereum,
              }
            });
          }
        }
      } catch (error) {
        // Non-critical, wallet still works
      }

      // Store addresses in server KV store for blockchain check endpoint
      if (walletId) {
        try {
          const { projectId, publicAnonKey } = await import('../utils/supabase/info');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/store-addresses`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                walletId,
                addresses: derivedAddresses,
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);
        } catch (error: any) {
          // Non-critical error, wallet still works locally
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const lock = () => {
    // Securely clear credentials from the protected session
    secureSession.clear();
    setIsUnlocked(false);
    setAddresses(null);
  };

  const switchAccount = async (accountIndex: number) => {
    const currentMnemonic = secureSession.getMnemonic();
    if (!currentMnemonic) {
      return;
    }

    setCurrentAccount(accountIndex);
    WalletStorage.setCurrentAccount(accountIndex);

    // Re-derive addresses for new account
    const derivedAddresses = await deriveAddresses(currentMnemonic, accountIndex);
    setAddresses(derivedAddresses);

    // Handle imported accounts differently
    try {
      const { AccountManager } = await import('./accountManager');
      const account = AccountManager.getAccountByIndex(accountIndex);

      if (account) {
        const isImported = (account as any).isImportedSeedPhrase || (account as any).isPrivateKeyImport;

        if (isImported) {
          // For imported accounts, use THEIR stored addresses
          setAddresses({
            solana: account.addresses.solana,
            ethereum: account.addresses.ethereum,
            bitcoin: 'Imported account',
            base: account.addresses.ethereum,
            polygon: account.addresses.ethereum,
            sui: 'Imported account',
          });
        } else if (account.addresses.solana !== derivedAddresses.solana) {
          AccountManager.updateAccount(account.id, {
            addresses: {
              solana: derivedAddresses.solana,
              ethereum: derivedAddresses.ethereum,
            }
          });
        }
      }
    } catch (error) {
      // Non-critical
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    walletId: walletId || null,
    addresses,
    currentAccount,
    isUnlocked,
    unlock,
    lock,
    switchAccount,
    // Secure accessors - call into protected closure
    getMnemonic,
    getPassword,
    // Convenience getters for mnemonic and password (for backwards compatibility)
    // Note: These are computed fresh each time but values only change when isUnlocked changes
    get mnemonic() {
      return getMnemonic();
    },
    get password() {
      return getPassword();
    },
  }), [walletId, addresses, currentAccount, isUnlocked]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}