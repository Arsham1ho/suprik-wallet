import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SecureStorage, WalletStorage, deriveAddresses } from './wallet';
import type { DerivedAccount } from './wallet';
import { useNetwork } from './NetworkContext';

interface WalletContextType {
  mnemonic: string | null;
  walletId: string | null;
  password: string | null; // Stored temporarily for decrypting imported account mnemonics
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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ 
  children, 
  walletId 
}: { 
  children: ReactNode;
  walletId?: string;
}) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<WalletContextType['addresses']>(null);
  const [currentAccount, setCurrentAccount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Load current account from storage
    const savedAccount = WalletStorage.getCurrentAccount();
    setCurrentAccount(savedAccount);
  }, []);

  // Listen for account switch events
  useEffect(() => {
    const handleAccountSwitch = async (event: CustomEvent) => {
      const { accountId } = event.detail;
      console.log('[WalletContext] 🔄 Account switch event received:', accountId);

      // Re-derive addresses for the new account if wallet is unlocked
      if (mnemonic && isUnlocked) {
        try {
          // Get the account from AccountManager to get its index
          const { AccountManager } = await import('./accountManager');
          const account = AccountManager.getAccountById(accountId);

          if (account) {
            const accountIndex = account.accountIndex;
            console.log('[WalletContext] 📍 Switching to account index:', accountIndex);

            // Derive addresses for this account
            const derivedAddresses = await deriveAddresses(mnemonic, accountIndex);
            setAddresses(derivedAddresses);
            setCurrentAccount(accountIndex);
            WalletStorage.setCurrentAccount(accountIndex);

            // Check if this is an imported account
            const isImported = (account as any).isImportedSeedPhrase || (account as any).isPrivateKeyImport;

            if (isImported) {
              // For imported accounts, use THEIR stored addresses
              console.log('[WalletContext] 📌 Switched to imported account, using stored addresses');
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
                console.log('[WalletContext] ⚠️ Updating stale address for account:', accountId);
                AccountManager.updateAccount(accountId, {
                  addresses: {
                    solana: derivedAddresses.solana,
                    ethereum: derivedAddresses.ethereum,
                  }
                });
              }
            }

            console.log('[WalletContext] ✅ Addresses updated for new account:', {
              solana: isImported ? account.addresses.solana : derivedAddresses.solana,
              ethereum: isImported ? account.addresses.ethereum : derivedAddresses.ethereum,
            });
          }
        } catch (error) {
          console.error('[WalletContext] Error switching account:', error);
        }
      }
    };

    window.addEventListener('accountSwitched', handleAccountSwitch as EventListener);

    return () => {
      window.removeEventListener('accountSwitched', handleAccountSwitch as EventListener);
    };
  }, [mnemonic, isUnlocked]);

  const unlock = async (password: string): Promise<boolean> => {
    try {
      const decryptedData = await SecureStorage.retrieveMnemonic(password);

      if (!decryptedData) {
        console.error('[WalletContext] Failed to decrypt wallet data');
        return false;
      }

      // Check if this is a private key import
      if (decryptedData.startsWith('PRIVKEY:')) {
        console.log('[WalletContext] ✅ Private key import detected');
        const privateKeyBase58 = decryptedData.substring(8);

        // For private key imports, we stored the public key separately
        const importedPubkey = localStorage.getItem('saturn_imported_pubkey');

        if (!importedPubkey) {
          console.error('[WalletContext] Missing imported public key');
          return false;
        }

        // Store the private key data (not a mnemonic, but we reuse the field)
        setMnemonic(decryptedData);
        setPassword(password); // Store password for decrypting imported account mnemonics
        setIsUnlocked(true);

        // For private key imports, we only have Solana address
        // Other chains will show placeholder addresses
        setAddresses({
          solana: importedPubkey,
          ethereum: '0x0000000000000000000000000000000000000000',
          base: '0x0000000000000000000000000000000000000000',
          polygon: '0x0000000000000000000000000000000000000000',
          bitcoin: 'Private key import - Solana only',
          sui: 'Private key import - Solana only',
        });

        console.log('[WalletContext] 🔑 Private key wallet unlocked:', {
          solana: importedPubkey,
        });

        return true;
      }

      console.log('[WalletContext] ✅ Mnemonic decrypted successfully');
      setMnemonic(decryptedData);
      setPassword(password); // Store password for decrypting imported account mnemonics
      setIsUnlocked(true);

      // Derive addresses
      const derivedAddresses = await deriveAddresses(decryptedData, currentAccount);
      setAddresses(derivedAddresses);

      console.log('[WalletContext] 🔑 Addresses derived:', {
        solana: derivedAddresses.solana,
        ethereum: derivedAddresses.ethereum,
      });

      // CRITICAL: Sync AccountManager with freshly derived addresses
      // This ensures the Receive page shows the same address as transactions use
      // BUT: Don't override addresses for accounts imported from different seed phrases!
      try {
        const { AccountManager } = await import('./accountManager');
        const activeAccount = AccountManager.getActiveAccount();

        if (activeAccount) {
          // Check if this is an imported account from a different seed phrase
          const isImported = (activeAccount as any).isImportedSeedPhrase || (activeAccount as any).isPrivateKeyImport;

          if (isImported) {
            // For imported accounts, use THEIR stored addresses, not derived ones
            console.log('[WalletContext] 📌 Using imported account addresses (not deriving)');
            console.log('[WalletContext] Imported address:', activeAccount.addresses.solana);
            setAddresses({
              solana: activeAccount.addresses.solana,
              ethereum: activeAccount.addresses.ethereum,
              bitcoin: 'Imported account',
              base: activeAccount.addresses.ethereum,
              polygon: activeAccount.addresses.ethereum,
              sui: 'Imported account',
            });
          } else if (activeAccount.addresses.solana !== derivedAddresses.solana) {
            // For non-imported accounts, sync if addresses don't match
            console.log('[WalletContext] ⚠️ AccountManager has stale address, updating...');
            console.log('[WalletContext] Old:', activeAccount.addresses.solana);
            console.log('[WalletContext] New:', derivedAddresses.solana);

            AccountManager.updateAccount(activeAccount.id, {
              addresses: {
                solana: derivedAddresses.solana,
                ethereum: derivedAddresses.ethereum,
              }
            });
            console.log('[WalletContext] ✅ AccountManager addresses synced');
          }
        }
      } catch (error) {
        console.warn('[WalletContext] Could not sync AccountManager:', error);
      }

      // Store addresses in server KV store for blockchain check endpoint
      if (walletId) {
        try {
          const { projectId, publicAnonKey } = await import('../utils/supabase/info');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
          console.log('[WalletContext] 📡 Addresses synced to server');
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.warn('[WalletContext] ⚠️ Address sync timeout');
          } else {
            console.warn('[WalletContext] ⚠️ Failed to sync addresses:', error.message);
          }
          // Non-critical error, wallet still works locally
        }
      }

      return true;
    } catch (error) {
      console.error('[WalletContext] Error unlocking wallet:', error);
      return false;
    }
  };

  const lock = () => {
    setMnemonic(null);
    setPassword(null); // Clear password on lock
    setIsUnlocked(false);
    setAddresses(null);
    console.log('[WalletContext] 🔒 Wallet locked');
  };

  const switchAccount = async (accountIndex: number) => {
    if (!mnemonic) {
      console.error('[WalletContext] Cannot switch account - wallet is locked');
      return;
    }

    setCurrentAccount(accountIndex);
    WalletStorage.setCurrentAccount(accountIndex);

    // Re-derive addresses for new account
    const derivedAddresses = await deriveAddresses(mnemonic, accountIndex);
    setAddresses(derivedAddresses);

    // Handle imported accounts differently
    try {
      const { AccountManager } = await import('./accountManager');
      const account = AccountManager.getAccountByIndex(accountIndex);

      if (account) {
        const isImported = (account as any).isImportedSeedPhrase || (account as any).isPrivateKeyImport;

        if (isImported) {
          // For imported accounts, use THEIR stored addresses
          console.log('[WalletContext] 📌 Switched to imported account, using stored addresses');
          setAddresses({
            solana: account.addresses.solana,
            ethereum: account.addresses.ethereum,
            bitcoin: 'Imported account',
            base: account.addresses.ethereum,
            polygon: account.addresses.ethereum,
            sui: 'Imported account',
          });
        } else if (account.addresses.solana !== derivedAddresses.solana) {
          // For non-imported accounts, sync if needed
          console.log('[WalletContext] ⚠️ Updating stale address for account', accountIndex);
          AccountManager.updateAccount(account.id, {
            addresses: {
              solana: derivedAddresses.solana,
              ethereum: derivedAddresses.ethereum,
            }
          });
        }
      }
    } catch (error) {
      console.warn('[WalletContext] Could not sync AccountManager:', error);
    }

    console.log('[WalletContext] 🔄 Switched to account', accountIndex);
  };

  return (
    <WalletContext.Provider
      value={{
        mnemonic,
        walletId,
        password,
        addresses,
        currentAccount,
        isUnlocked,
        unlock,
        lock,
        switchAccount,
      }}
    >
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