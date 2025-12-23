import { useState } from 'react';
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
  const [seedPhrase, setSeedPhrase] = useState('');
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

  const resetForm = () => {
    setSeedPhrase('');
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
      // When adding an account to existing wallet, we need the password to encrypt the mnemonic
      // The password is needed to decrypt transactions later
      setStep('password');
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
        // New wallet: Store encrypted mnemonic as main wallet
        await SecureStorage.storeMnemonic(mnemonic, pwd);
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

    // Store encrypted mnemonic
    await SecureStorage.storeMnemonic(mnemonic, pwd);

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

    // Store private key with prefix to identify it
    const privateKeyData = `PRIVKEY:${key}`;
    await SecureStorage.storeMnemonic(privateKeyData, pwd);

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
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md">
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
                  ? 'Enter your 12 or 24 word recovery phrase'
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
                <div className="space-y-2">
                  <Label htmlFor="seedPhrase">Recovery Phrase</Label>
                  <textarea
                    id="seedPhrase"
                    value={seedPhrase}
                    onChange={(e) => {
                      setSeedPhrase(e.target.value);
                      setError('');
                    }}
                    className="w-full h-32 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none font-mono text-sm"
                    placeholder="Enter your 12 or 24 word seed phrase, separated by spaces..."
                  />
                  <p className="text-xs text-slate-500">
                    Words: {seedPhrase.trim() ? seedPhrase.trim().split(/\s+/).length : 0}
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
                      className="bg-slate-900/50 border-slate-700/50 pr-10 font-mono text-sm"
                      placeholder="Enter your base58-encoded private key..."
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
                  disabled={loading || (mode === 'seed-phrase' ? !seedPhrase.trim() : !privateKey.trim())}
                  className="flex-1 bg-[#ad46ff] hover:bg-[#ad46ff]/90 text-white disabled:opacity-50"
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Scanning for Accounts</h3>
                <p className="text-slate-400 text-sm">
                  Looking for accounts with balance on this seed phrase...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
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
                    className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${
                      selectedAccounts.includes(account.index)
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedAccounts.includes(account.index)
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {account.index + 1}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          Account {account.index + 1}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
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
                        <Check className="w-5 h-5 text-purple-400" />
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
                className="w-full bg-[#ad46ff] hover:bg-[#ad46ff]/90 text-white"
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
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-sm text-purple-200">
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
                className="w-full bg-[#ad46ff] hover:bg-[#ad46ff]/90"
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
