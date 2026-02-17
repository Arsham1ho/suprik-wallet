import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, AlertTriangle, Check, FileText, Key, ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { validateMnemonic, deriveAddresses, SecureStorage, deriveWalletId, WalletStorage, encryptWithPassword } from '../utils/wallet';
import { AccountManager } from '../utils/accountManager';
import { useWallet } from '../utils/WalletContext';
import { useTheme } from '../utils/ThemeContext';
import { fetchSolanaBalance } from '../utils/blockchain';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

interface DiscoveredAccount {
  index: number;
  address: string;
  balance: number;
  ethereumAddress: string;
}

type ImportMode = 'seed-phrase' | 'private-key';

interface ImportWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ImportMode;
  onSuccess?: () => void;
  existingPassword?: string; // If user is already logged in, use their existing password
  isAddingAccount?: boolean; // If true, user is adding a second account (already has a wallet)
}

export function ImportWalletDialog({
  open,
  onOpenChange,
  mode,
  onSuccess,
  existingPassword,
  isAddingAccount = false,
}: ImportWalletDialogProps) {
  const wallet = useWallet();
  const { colors } = useTheme();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'scanning' | 'select-accounts' | 'password'>('input');
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [scanProgress, setScanProgress] = useState(0);

  // Sync seedWords array to seedPhrase string
  const updateSeedPhrase = (words: string[]) => {
    setSeedWords(words);
    setSeedPhrase(words.filter(w => w.trim()).join(' '));
  };

  const handleWordChange = (index: number, value: string) => {
    // Handle paste of full seed phrase
    const trimmedValue = value.trim();
    const pastedWords = trimmedValue.split(/\s+/);

    if (pastedWords.length > 1) {
      // User pasted multiple words
      const newWordCount = pastedWords.length === 24 ? 24 : 12;
      setWordCount(newWordCount);
      const newWords = Array(newWordCount).fill('');
      pastedWords.slice(0, newWordCount).forEach((word, i) => {
        newWords[i] = word.toLowerCase();
      });
      updateSeedPhrase(newWords);
      return;
    }

    // Single word input
    const newWords = [...seedWords];
    newWords[index] = value.toLowerCase();
    updateSeedPhrase(newWords);
  };

  const resetForm = () => {
    setSeedPhrase('');
    setSeedWords(Array(12).fill(''));
    setWordCount(12);
    setPrivateKey('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowPrivateKey(false);
    setError('');
    setStep('input');
    setDiscoveredAccounts([]);
    setSelectedAccounts([]);
    setScanProgress(0);
  };

  // Scan for accounts with balance on the seed phrase
  const scanForAccounts = async (mnemonic: string): Promise<DiscoveredAccount[]> => {
    const accounts: DiscoveredAccount[] = [];
    const MAX_SCAN = 10; // Scan up to 10 derivation paths
    const MAX_EMPTY_IN_ROW = 3; // Stop after 3 empty accounts in a row

    let emptyInRow = 0;

    for (let i = 0; i < MAX_SCAN; i++) {
      setScanProgress(((i + 1) / MAX_SCAN) * 100);

      try {
        const addresses = await deriveAddresses(mnemonic, i);

        // Check if this address has any balance
        const balanceData = await fetchSolanaBalance(addresses.solana, 'mainnet');
        const balance = balanceData.native;

        if (balance > 0 || balanceData.tokens.length > 0) {
          accounts.push({
            index: i,
            address: addresses.solana,
            balance: balance,
            ethereumAddress: addresses.ethereum,
          });
          emptyInRow = 0; // Reset empty counter
        } else {
          emptyInRow++;
          // Always include the first account (index 0) even if empty
          if (i === 0) {
            accounts.push({
              index: i,
              address: addresses.solana,
              balance: 0,
              ethereumAddress: addresses.ethereum,
            });
          }
          // Stop scanning after 3 empty accounts in a row (after index 0)
          if (emptyInRow >= MAX_EMPTY_IN_ROW && i > 0) {
            break;
          }
        }
      } catch {
        // On error, still include the first account
        if (i === 0) {
          const addresses = await deriveAddresses(mnemonic, 0);
          accounts.push({
            index: 0,
            address: addresses.solana,
            balance: 0,
            ethereumAddress: addresses.ethereum,
          });
        }
        break;
      }
    }

    return accounts;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const validateSeedPhrase = async (): Promise<boolean> => {
    const words = seedPhrase.trim().toLowerCase().split(/\s+/);

    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must be 12 or 24 words');
      return false;
    }

    const isValid = await validateMnemonic(seedPhrase.trim().toLowerCase());
    if (!isValid) {
      setError('Invalid seed phrase. Please check and try again.');
      return false;
    }

    return true;
  };

  const validatePrivateKey = (): boolean => {
    const key = privateKey.trim();

    // Try to decode as base58
    try {
      const decoded = bs58.decode(key);

      // Solana private keys are 64 bytes (secret key) or 32 bytes (seed)
      if (decoded.length !== 64 && decoded.length !== 32) {
        setError('Invalid private key length. Must be 32 or 64 bytes.');
        return false;
      }

      return true;
    } catch {
      setError('Invalid private key format. Please enter a valid base58-encoded key.');
      return false;
    }
  };

  const handleContinue = async () => {
    setError('');
    setLoading(true);

    if (mode === 'seed-phrase') {
      const isValid = await validateSeedPhrase();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // For seed phrase imports, scan for multiple accounts
      setStep('scanning');

      try {
        const mnemonic = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
        const accounts = await scanForAccounts(mnemonic);

        setDiscoveredAccounts(accounts);
        // Pre-select all accounts with balance, or just the first one
        const accountsWithBalance = accounts.filter(a => a.balance > 0);
        if (accountsWithBalance.length > 0) {
          setSelectedAccounts(accountsWithBalance.map(a => a.index));
        } else {
          setSelectedAccounts([0]); // Select first account by default
        }

        setLoading(false);

        if (accounts.length > 1 || (accounts.length === 1 && accounts.some(a => a.balance > 0))) {
          // Show account selection if multiple accounts or account with balance found
          setStep('select-accounts');
        } else {
          // Only one empty account found, proceed directly
          if (isAddingAccount) {
            await handleImportAddAccount();
          } else if (existingPassword) {
            await handleImport(existingPassword);
          } else {
            setStep('password');
          }
        }
      } catch {
        setLoading(false);
        setError('Failed to scan accounts. Proceeding with default account.');
        // Fallback to simple import
        if (isAddingAccount) {
          await handleImportAddAccount();
        } else if (existingPassword) {
          await handleImport(existingPassword);
        } else {
          setStep('password');
        }
      }
    } else {
      // Private key import - no scanning needed
      const isValid = validatePrivateKey();
      if (!isValid) {
        setLoading(false);
        return;
      }

      setLoading(false);

      if (isAddingAccount) {
        await handleImportAddAccount();
      } else if (existingPassword) {
        await handleImport(existingPassword);
      } else {
        setStep('password');
      }
    }
  };

  const handleAccountSelection = (index: number) => {
    setSelectedAccounts(prev => {
      if (prev.includes(index)) {
        // Don't allow deselecting all accounts
        if (prev.length === 1) return prev;
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleConfirmAccounts = async () => {
    if (existingPassword) {
      // Password was provided (e.g., OAuth flow)
      await handleImportMultipleAccountsWithPassword(existingPassword);
    } else if (isAddingAccount) {
      // When adding an account to existing wallet, import directly without asking for password
      // The mnemonic will be stored separately for the imported accounts
      await handleImportMultipleAccounts();
    } else {
      // New wallet import - always requires password
      setStep('password');
    }
  };

  // Import multiple accounts when adding to existing wallet (no password needed)
  const handleImportMultipleAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      const accounts = AccountManager.getAccounts();
      const mnemonic = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
      const walletId = await deriveWalletId(mnemonic);
      let addedCount = 0;

      // Encrypt and store the imported mnemonic (AES-256-GCM)
      if (!wallet.password) {
        throw new Error('Wallet must be unlocked to add accounts. Please unlock first.');
      }
      const storedMnemonics = JSON.parse(localStorage.getItem('saturn_imported_mnemonics') || '{}');
      storedMnemonics[walletId] = await encryptWithPassword(mnemonic, wallet.password);
      localStorage.setItem('saturn_imported_mnemonics', JSON.stringify(storedMnemonics));

      for (const selectedIndex of selectedAccounts.sort((a, b) => a - b)) {
        const account = discoveredAccounts.find(a => a.index === selectedIndex);
        if (!account) continue;

        // Check if account with same Solana address already exists
        const existingAccount = accounts.find(
          (acc: any) => acc.addresses?.solana === account.address
        );
        if (existingAccount) {
          continue;
        }

        const uniqueAccountId = `${walletId}_imported_${account.index}_${Date.now()}`;

        const newAccount = {
          id: uniqueAccountId,
          name: `Account ${accounts.length + 1}`,
          accountIndex: account.index,
          addresses: {
            solana: account.address,
            ethereum: account.ethereumAddress,
          },
          createdAt: Date.now(),
          // CRITICAL: Mark as imported so WalletContext doesn't override addresses
          isImportedSeedPhrase: true,
          // Store walletId to retrieve mnemonic later for transactions
          importedWalletId: walletId,
        };

        accounts.push(newAccount);
        addedCount++;

        // Set first added account as active
        if (addedCount === 1) {
          localStorage.setItem('saturn_accounts', JSON.stringify(accounts));
          AccountManager.setActiveAccount(newAccount.id);
        }
      }

      localStorage.setItem('saturn_accounts', JSON.stringify(accounts));

      // Dispatch event with detail to indicate imported accounts
      window.dispatchEvent(new CustomEvent('walletImported', { detail: { isImportedSeedPhrase: true } }));

      toast.success(`${addedCount} account${addedCount > 1 ? 's' : ''} added successfully!`);
      onSuccess?.();
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add accounts');
    } finally {
      setLoading(false);
    }
  };

  // Import multiple accounts with password (new wallet or adding to existing)
  const handleImportMultipleAccountsWithPassword = async (pwd: string) => {
    setLoading(true);
    setError('');

    try {
      const mnemonic = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
      const walletId = await deriveWalletId(mnemonic);

      // Encrypt the imported mnemonic for each account
      // This allows transactions to work for accounts from different seed phrases
      const encryptedMnemonic = await encryptWithPassword(mnemonic, pwd);

      // Check if this is adding to an existing wallet or creating new
      const existingAccounts = AccountManager.getAccounts();
      const isAddingToExisting = existingAccounts.length > 0;

      if (!isAddingToExisting) {
        // New wallet: Store encrypted mnemonic as main wallet (per-wallet key)
        await SecureStorage.storeMnemonic(mnemonic, pwd, walletId);
        WalletStorage.setWalletId(walletId);
        WalletStorage.setCurrentAccount(0);
      }

      const accounts: any[] = isAddingToExisting ? [...existingAccounts] : [];

      for (const selectedIndex of selectedAccounts.sort((a, b) => a - b)) {
        const account = discoveredAccounts.find(a => a.index === selectedIndex);
        if (!account) continue;

        // Check if account with same Solana address already exists
        const existingAccount = accounts.find(
          (acc: any) => acc.addresses?.solana === account.address
        );
        if (existingAccount) {
          continue;
        }

        const uniqueAccountId = `${walletId}_imported_${account.index}_${Date.now()}`;

        accounts.push({
          id: uniqueAccountId,
          name: `Account ${accounts.length + 1}`,
          accountIndex: account.index,
          addresses: {
            solana: account.address,
            ethereum: account.ethereumAddress,
          },
          createdAt: Date.now(),
          // CRITICAL: Mark as imported and store encrypted mnemonic
          isImportedSeedPhrase: isAddingToExisting, // Only mark as imported if adding to existing wallet
          encryptedMnemonic: isAddingToExisting ? encryptedMnemonic : undefined, // Store encrypted mnemonic for transactions
        });
      }

      localStorage.setItem('saturn_accounts', JSON.stringify(accounts));

      // Set first new account as active (or first account if new wallet)
      const newAccountIndex = isAddingToExisting ? existingAccounts.length : 0;
      if (accounts.length > newAccountIndex) {
        AccountManager.setActiveAccount(accounts[newAccountIndex].id);
        localStorage.setItem('saturn_imported_pubkey', accounts[newAccountIndex].addresses.solana);
      }

      // Unlock wallet
      const unlocked = await wallet.unlock(pwd);
      if (!unlocked) {
        throw new Error('Failed to unlock wallet after import');
      }

      window.dispatchEvent(new CustomEvent('walletImported', { detail: { isImportedSeedPhrase: isAddingToExisting } }));

      const addedCount = accounts.length - (isAddingToExisting ? existingAccounts.length : 0);
      toast.success(`${addedCount} account${addedCount > 1 ? 's' : ''} imported successfully!`);
      onSuccess?.();
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  // Import when adding account to existing wallet (no password needed)
  const handleImportAddAccount = async () => {
    setLoading(true);
    setError('');

    try {
      // Get existing accounts to check for duplicates
      const accounts = AccountManager.getAccounts();

      if (mode === 'seed-phrase') {
        // Normalize mnemonic
        const mnemonic = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');

        // Derive addresses from the imported seed phrase
        const addresses = await deriveAddresses(mnemonic, 0);
        const walletId = await deriveWalletId(mnemonic);

        // Check if account with same Solana address already exists
        const existingAccount = accounts.find(
          (acc: any) => acc.addresses?.solana === addresses.solana
        );
        if (existingAccount) {
          setError('This wallet is already added to your accounts.');
          setLoading(false);
          return;
        }

        // Encrypt and store the imported mnemonic (AES-256-GCM)
        if (!wallet.password) {
          throw new Error('Wallet must be unlocked to add accounts. Please unlock first.');
        }
        const storedMnemonics = JSON.parse(localStorage.getItem('saturn_imported_mnemonics') || '{}');
        storedMnemonics[walletId] = await encryptWithPassword(mnemonic, wallet.password);
        localStorage.setItem('saturn_imported_mnemonics', JSON.stringify(storedMnemonics));

        // Create unique account ID
        const uniqueAccountId = `${walletId}_imported_${Date.now()}`;

        const newAccount = {
          id: uniqueAccountId,
          name: `Account ${accounts.length + 1}`,
          accountIndex: 0,
          addresses: {
            solana: addresses.solana,
            ethereum: addresses.ethereum,
          },
          createdAt: Date.now(),
          // CRITICAL: Mark as imported so WalletContext doesn't override addresses
          isImportedSeedPhrase: true,
          // Store walletId to retrieve mnemonic later for transactions
          importedWalletId: walletId,
        };

        accounts.push(newAccount);
        localStorage.setItem('saturn_accounts', JSON.stringify(accounts));

        // Set as active account
        AccountManager.setActiveAccount(newAccount.id);
      } else {
        // Private key import
        const key = privateKey.trim();
        const decoded = bs58.decode(key);

        let keypair: nacl.SignKeyPair;
        if (decoded.length === 64) {
          keypair = nacl.sign.keyPair.fromSecretKey(decoded);
        } else {
          keypair = nacl.sign.keyPair.fromSeed(decoded);
        }

        const solanaAddress = bs58.encode(keypair.publicKey);

        // Check if account with same Solana address already exists
        const existingAccount = accounts.find(
          (acc: any) => acc.addresses?.solana === solanaAddress
        );
        if (existingAccount) {
          setError('This wallet is already added to your accounts.');
          setLoading(false);
          return;
        }

        const uniqueAccountId = `pk_${solanaAddress.slice(0, 8)}_${Date.now()}`;

        // Encrypt and store the private key (AES-256-GCM)
        if (!wallet.password) {
          throw new Error('Wallet must be unlocked to add accounts. Please unlock first.');
        }
        const storedPrivateKeys = JSON.parse(localStorage.getItem('saturn_imported_private_keys') || '{}');
        storedPrivateKeys[solanaAddress] = await encryptWithPassword(key, wallet.password);
        localStorage.setItem('saturn_imported_private_keys', JSON.stringify(storedPrivateKeys));

        const newAccount = {
          id: uniqueAccountId,
          name: `Account ${accounts.length + 1}`,
          accountIndex: 0,
          addresses: {
            solana: solanaAddress,
            ethereum: '',
          },
          createdAt: Date.now(),
          isPrivateKeyImport: true,
          // Store reference to retrieve private key later
          importedPrivateKeyAddress: solanaAddress,
        };

        accounts.push(newAccount);
        localStorage.setItem('saturn_accounts', JSON.stringify(accounts));

        // Store the private key reference
        localStorage.setItem('saturn_imported_pubkey', solanaAddress);

        // Set as active account
        AccountManager.setActiveAccount(newAccount.id);
      }

      // Notify that wallet was imported
      window.dispatchEvent(new Event('walletImported'));

      toast.success('Account added successfully!');
      onSuccess?.();
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (pwd: string) => {
    setLoading(true);
    setError('');

    try {
      if (mode === 'seed-phrase') {
        await importFromSeedPhrase(pwd);
      } else {
        await importFromPrivateKey(pwd);
      }

      toast.success('Wallet imported successfully!');
      onSuccess?.();
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const importFromSeedPhrase = async (pwd: string) => {
    // Normalize mnemonic: lowercase, trim, and collapse multiple spaces to single space
    const mnemonic = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');

    // Generate wallet ID from mnemonic
    const walletId = await deriveWalletId(mnemonic);

    // Derive addresses from the mnemonic (always use index 0 for imported wallets)
    const addresses = await deriveAddresses(mnemonic, 0);

    // Store encrypted mnemonic (per-wallet key)
    await SecureStorage.storeMnemonic(mnemonic, pwd, walletId);

    // Store wallet ID (like SignIn does)
    WalletStorage.setWalletId(walletId);
    WalletStorage.setCurrentAccount(0);

    // Store the imported pubkey for reference
    localStorage.setItem('saturn_imported_pubkey', addresses.solana);

    // Create a unique account ID using walletId and timestamp to avoid duplicates
    const uniqueAccountId = `${walletId}_imported_${Date.now()}`;

    // Directly add account to AccountManager with accountIndex 0 (for the imported wallet)
    const accounts = AccountManager.getAccounts();
    const newAccount = {
      id: uniqueAccountId,
      name: `Account ${accounts.length + 1}`,
      accountIndex: 0, // Always 0 for imported wallets (first account of that seed phrase)
      addresses: {
        solana: addresses.solana,
        ethereum: addresses.ethereum,
      },
      createdAt: Date.now(),
    };

    // Add directly to localStorage
    accounts.push(newAccount);
    localStorage.setItem('saturn_accounts', JSON.stringify(accounts));

    // Set the new account as active
    AccountManager.setActiveAccount(newAccount.id);

    // Unlock wallet to update WalletContext with new mnemonic and addresses
    const unlocked = await wallet.unlock(pwd);

    if (!unlocked) {
      throw new Error('Failed to unlock wallet after import');
    }

    // Notify that wallet was imported
    window.dispatchEvent(new Event('walletImported'));
  };

  const importFromPrivateKey = async (pwd: string) => {
    const key = privateKey.trim();
    const decoded = bs58.decode(key);

    let keypair: nacl.SignKeyPair;

    if (decoded.length === 64) {
      // Full secret key (64 bytes)
      keypair = nacl.sign.keyPair.fromSecretKey(decoded);
    } else {
      // Seed (32 bytes)
      keypair = nacl.sign.keyPair.fromSeed(decoded);
    }

    const publicKey = bs58.encode(keypair.publicKey);

    // Generate a wallet ID from the public key
    const encoder = new TextEncoder();
    const data = encoder.encode(publicKey);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const walletId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

    // Store private key with prefix to identify it (per-wallet key)
    const privateKeyData = `PRIVKEY:${key}`;
    await SecureStorage.storeMnemonic(privateKeyData, pwd, walletId);

    // Store wallet ID (like SignIn does)
    WalletStorage.setWalletId(walletId);
    WalletStorage.setCurrentAccount(0);

    // Store the public key separately for later retrieval
    localStorage.setItem('saturn_imported_pubkey', publicKey);
    localStorage.setItem('saturn_import_type', 'privateKey');

    // Create account in AccountManager
    const newAccount = AccountManager.createNewAccount(
      walletId,
      {
        solana: publicKey,
        ethereum: '0x0000000000000000000000000000000000000000',
      }
    );

    // Set the new account as active
    AccountManager.setActiveAccount(newAccount.id);

    // Unlock wallet to update WalletContext with new private key
    const unlocked = await wallet.unlock(pwd);

    if (!unlocked) {
      throw new Error('Failed to unlock wallet after import');
    }

    // Notify that wallet was imported
    window.dispatchEvent(new Event('walletImported'));
  };

  const handlePasswordSubmit = async () => {
    if (!existingPassword) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Only check confirm password if creating new wallet (not adding account)
      if (!isAddingAccount && password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    // If we have discovered accounts from scanning, import them all
    if (discoveredAccounts.length > 0 && selectedAccounts.length > 0) {
      await handleImportMultipleAccountsWithPassword(existingPassword || password);
    } else {
      await handleImport(existingPassword || password);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              mode === 'seed-phrase'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-orange-500 to-amber-600'
            }`}>
              {mode === 'seed-phrase' ? (
                <FileText className="w-5 h-5 text-white" />
              ) : (
                <Key className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {mode === 'seed-phrase' ? 'Import Seed Phrase' : 'Import Private Key'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                {mode === 'seed-phrase'
                  ? 'Enter your 12 word recovery phrase'
                  : 'Enter your Solana private key'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 py-4"
            >
              {mode === 'seed-phrase' ? (
                <div className="space-y-3">
                  <Label>Recovery Phrase</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {seedWords.map((word, index) => (
                      <div key={index} className="relative">
                        {!word && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium pointer-events-none">
                            {index + 1}.
                          </span>
                        )}
                        <input
                          type="text"
                          value={word}
                          onChange={(e) => {
                            handleWordChange(index, e.target.value);
                            setError('');
                          }}
                          className={`w-full pr-2 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 ${word ? 'pl-2' : 'pl-7'}`}
                          style={{
                            // @ts-ignore - CSS custom properties
                            '--tw-ring-color': `${colors.primary}4D`,
                          } as React.CSSProperties}
                          onFocus={(e) => {
                            e.target.style.borderColor = `${colors.primary}80`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                          }}
                          placeholder=""
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Words: {seedWords.filter(w => w.trim()).length} / {wordCount}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <div className="relative">
                    <Input
                      id="privateKey"
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKey}
                      onChange={(e) => {
                        setPrivateKey(e.target.value);
                        setError('');
                      }}
                      className="bg-slate-900/50 border-slate-700/50 pr-10 text-sm"
                      placeholder="Import Private Key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Base58-encoded Solana private key (32 or 64 bytes)
                  </p>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 border-slate-700/50 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={loading || (mode === 'seed-phrase' ? seedWords.filter(w => w.trim()).length < wordCount : !privateKey.trim())}
                  className="flex-1 text-white disabled:opacity-50"
                  style={{ background: colors.primary }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </motion.div>
          ) : step === 'scanning' ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-8"
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: `${colors.primary}33` }}
                >
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.accent }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Scanning for Accounts</h3>
                <p className="text-slate-400 text-sm">
                  Looking for accounts with balance on this seed phrase...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%`, background: colors.primary }}
                />
              </div>
              <p className="text-center text-xs text-slate-500">
                Checking derivation paths... {Math.round(scanProgress)}%
              </p>
            </motion.div>
          ) : step === 'select-accounts' ? (
            <motion.div
              key="select-accounts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <button
                onClick={() => setStep('input')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-200 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Found {discoveredAccounts.length} account{discoveredAccounts.length > 1 ? 's' : ''} on this seed phrase
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {discoveredAccounts.map((account) => (
                  <button
                    key={account.index}
                    onClick={() => handleAccountSelection(account.index)}
                    className="w-full p-3 rounded-xl border transition-all flex items-center justify-between"
                    style={{
                      background: selectedAccounts.includes(account.index)
                        ? `${colors.primary}33`
                        : 'rgb(15 23 42 / 0.5)',
                      borderColor: selectedAccounts.includes(account.index)
                        ? `${colors.primary}80`
                        : 'rgb(51 65 85 / 0.5)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: selectedAccounts.includes(account.index)
                            ? colors.primary
                            : 'rgb(51 65 85)',
                          color: selectedAccounts.includes(account.index)
                            ? 'white'
                            : 'rgb(203 213 225)'
                        }}
                      >
                        {account.index + 1}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          Account {account.index + 1}
                        </p>
                        <p className="text-xs text-slate-400">
                          {account.address.slice(0, 6)}...{account.address.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.balance > 0 && (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          {account.balance.toFixed(4)} SOL
                        </span>
                      )}
                      {selectedAccounts.includes(account.index) && (
                        <Check className="w-5 h-5" style={{ color: colors.accent }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-500 text-center">
                Select the accounts you want to import
              </p>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleConfirmAccounts}
                disabled={loading || selectedAccounts.length === 0}
                className="w-full text-white"
                style={{ background: colors.primary }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Import {selectedAccounts.length} Account{selectedAccounts.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <button
                onClick={() => setStep(discoveredAccounts.length > 0 ? 'select-accounts' : 'input')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              {discoveredAccounts.length > 0 && selectedAccounts.length > 0 && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: `${colors.primary}1A`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}4D`
                  }}
                >
                  <p className="text-sm" style={{ color: colors.accent }}>
                    Importing {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} from this seed phrase
                  </p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  {isAddingAccount
                    ? 'Enter your wallet password to add this account.'
                    : "Create a password to encrypt your wallet. You'll need this password to unlock your wallet."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password">{isAddingAccount ? 'Wallet Password' : 'Password'}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="bg-slate-900/50 border-slate-700/50 pr-10"
                      placeholder={isAddingAccount ? 'Enter your wallet password...' : 'Enter password...'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isAddingAccount && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="bg-slate-900/50 border-slate-700/50"
                      placeholder="Confirm password..."
                    />
                  </div>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handlePasswordSubmit}
                disabled={loading || !password || (!isAddingAccount && !confirmPassword)}
                className="w-full text-white"
                style={{ background: colors.primary }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Import Wallet
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
