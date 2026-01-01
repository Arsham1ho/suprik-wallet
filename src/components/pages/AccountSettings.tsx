import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, User, Check, Wallet, X, Loader2, Smile, Key, FileText, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { AnimalAvatar } from '../AnimalAvatar';
import { EmojiSelector } from '../EmojiSelector';
import { ImportWalletDialog } from '../ImportWalletDialog';
import { AccountManager } from '../../utils/accountManager';
import { useWallet } from '../../utils/WalletContext';
import { deriveAddresses } from '../../utils/wallet';

interface AccountSettingsProps {
  onBack: () => void;
  walletId: string;
  onSignOut: () => void;
  onSwitchAccount?: (accountId: string) => void;
}

interface WalletInfo {
  seedPhrase: string;
  createdAt: string;
  username?: string;
  profilePicture?: string;
}

interface Account {
  id: string;
  username: string;
  walletId: string;
  createdAt: string;
  isPrimary: boolean;
  accountIndex?: number;
  solanaAddress?: string;
  selectedEmoji?: string;
}

export function AccountSettings({ onBack, walletId, onSignOut, onSwitchAccount }: AccountSettingsProps) {
  const wallet = useWallet(); // Access wallet context
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showAddAccountOptions, setShowAddAccountOptions] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMode, setImportMode] = useState<'seed-phrase' | 'private-key'>('seed-phrase');
  
  // Username validation states
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string>('');
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // New account username validation states
  const [checkingNewUsername, setCheckingNewUsername] = useState(false);
  const [newUsernameAvailable, setNewUsernameAvailable] = useState<boolean | null>(null);
  const [newUsernameError, setNewUsernameError] = useState<string>('');
  const checkNewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWalletInfo();
    loadAccounts();
  }, [walletId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      if (checkNewTimeoutRef.current) {
        clearTimeout(checkNewTimeoutRef.current);
      }
    };
  }, []);

  const checkNewUsernameAvailability = async (usernameToCheck: string) => {
    // Don't check if empty
    if (!usernameToCheck || usernameToCheck === '@') {
      setNewUsernameAvailable(null);
      setNewUsernameError('');
      return;
    }

    // Validate username format - PHANTOM STYLE: lowercase, numbers, underscore only
    if (usernameToCheck.length < 4) {
      setNewUsernameError('Username must be at least 3 characters (excluding @)');
      setNewUsernameAvailable(false);
      return;
    }

    // Only allow lowercase letters, numbers, and underscore (Phantom style)
    if (!/^@[a-z0-9_]+$/.test(usernameToCheck)) {
      setNewUsernameError('Username can only contain lowercase letters, numbers, and underscores');
      setNewUsernameAvailable(false);
      return;
    }

    setCheckingNewUsername(true);
    setNewUsernameError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/check-username/${encodeURIComponent(usernameToCheck)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNewUsernameAvailable(data.available);
        if (!data.available) {
          setNewUsernameError('This username is already taken');
        }
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setNewUsernameError('Failed to check username availability');
      setNewUsernameAvailable(null);
    } finally {
      setCheckingNewUsername(false);
    }
  };

  const handleNewAccountNameChange = (value: string) => {
    // Always ensure @ is at the beginning
    let formattedValue = value;
    if (!value.startsWith('@')) {
      formattedValue = '@' + value.replace(/^@*/, '');
    } else {
      // Prevent multiple @ symbols at the start
      formattedValue = '@' + value.slice(1).replace(/^@*/, '');
    }
    
    // Convert to lowercase (Phantom style)
    formattedValue = formattedValue.toLowerCase();
    
    setNewAccountName(formattedValue);
    
    // Clear any existing timeout
    if (checkNewTimeoutRef.current) {
      clearTimeout(checkNewTimeoutRef.current);
    }
    
    // Set new timeout for debounced check (500ms after user stops typing)
    checkNewTimeoutRef.current = setTimeout(() => {
      checkNewUsernameAvailability(formattedValue);
    }, 500);
  };

  const loadWalletInfo = async () => {
    try {
      // Load username from localStorage first (this is the source of truth for local state)
      const localUsername = localStorage.getItem('saturn_username');
      let username = localUsername || '@account1';

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.username) {
            username = data.username;
            // Sync to localStorage
            localStorage.setItem('saturn_username', username);
          }
        }
      } catch (fetchError) {
        // If backend fetch fails, use the localStorage value we already loaded
        console.log('[AccountSettings] Could not fetch from backend, using localStorage:', localUsername);
      }
      
      const walletName = localStorage.getItem('saturn_wallet_name') || 'Suprik Wallet';
      const savedEmoji = localStorage.getItem(`saturn_avatar_emoji_${walletId}`);
      
      // Ensure username always starts with @ and is lowercase
      let formattedUsername = username.startsWith('@') ? username : '@' + username;
      formattedUsername = formattedUsername.toLowerCase();
      
      if (savedEmoji) {
        setSelectedEmoji(savedEmoji);
      }
      
      setWalletInfo({
        username: formattedUsername,
        walletName,
        seedPhrase: null,
        email: null,
        authMethod: 'recovery-phrase',
        createdAt: null,
        profilePicture: null,
        networkStatus: null,
      });
      
      setUsername(formattedUsername);
      setOriginalUsername(formattedUsername);
      setUsernameAvailable(null); // Reset validation state
      
      console.log('[AccountSettings] ✅ Wallet info loaded:', formattedUsername);
    } catch (error) {
      console.error('Error loading wallet info:', error);
      toast.error('Failed to load account info');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      console.log('[AccountSettings] 📂 Loading accounts from AccountManager...');

      // Load accounts from AccountManager (localStorage)
      let allAccounts = AccountManager.getAccounts();
      const activeAccountId = AccountManager.getActiveAccountId();

      console.log('[AccountSettings] ✅ Loaded accounts:', allAccounts);
      console.log('[AccountSettings] 🔵 Active account ID:', activeAccountId);

      // Fix accounts that don't have addresses by deriving them
      let needsUpdate = false;
      if (wallet.mnemonic && wallet.isUnlocked) {
        for (let i = 0; i < allAccounts.length; i++) {
          const acc = allAccounts[i];
          if (!acc.addresses?.solana) {
            console.log('[AccountSettings] 🔧 Fixing missing address for:', acc.name);
            const accountIndex = acc.accountIndex ?? i;
            const addresses = await deriveAddresses(wallet.mnemonic, accountIndex);
            acc.addresses = {
              solana: addresses.solana,
              ethereum: addresses.ethereum,
            };
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          localStorage.setItem('saturn_accounts', JSON.stringify(allAccounts));
          console.log('[AccountSettings] ✅ Fixed and saved account addresses');
        }
      }

      // Transform AccountManager accounts to match the Account interface
      const transformedAccounts = allAccounts.map((acc, index) => ({
        id: acc.id,
        username: acc.name,
        walletId: acc.id, // Use account ID as walletId for switching
        createdAt: new Date(acc.createdAt).toISOString(),
        isPrimary: index === 0, // First account is primary
        accountIndex: acc.accountIndex,
        solanaAddress: acc.addresses?.solana || '',
        selectedEmoji: acc.selectedEmoji,
      }));

      setAccounts(transformedAccounts);
      setActiveAccountId(activeAccountId);
    } catch (error) {
      console.error('[AccountSettings] Error loading accounts:', error);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    // Don't check if it's the same as original or empty
    if (!usernameToCheck || usernameToCheck === '@' || usernameToCheck === originalUsername) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    // Validate username format - PHANTOM STYLE: lowercase, numbers, underscore only
    if (usernameToCheck.length < 4) {
      setUsernameError('Username must be at least 3 characters (excluding @)');
      setUsernameAvailable(false);
      return;
    }

    // Only allow lowercase letters, numbers, and underscore (Phantom style)
    if (!/^@[a-z0-9_]+$/.test(usernameToCheck)) {
      setUsernameError('Username can only contain lowercase letters, numbers, and underscores');
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/check-username/${encodeURIComponent(usernameToCheck)}?walletId=${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError('This username is already taken');
        }
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Failed to check username availability');
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Always ensure @ is at the beginning
    let formattedValue = value;
    if (!value.startsWith('@')) {
      formattedValue = '@' + value.replace(/^@*/, '');
    } else {
      // Prevent multiple @ symbols at the start
      formattedValue = '@' + value.slice(1).replace(/^@*/, '');
    }
    
    // Convert to lowercase (Phantom style)
    formattedValue = formattedValue.toLowerCase();
    
    setUsername(formattedValue);
    
    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // Set new timeout for debounced check (500ms after user stops typing)
    checkTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(formattedValue);
    }, 500);
  };

  const saveUsername = async () => {
    // Don't save if username hasn't changed
    if (username === originalUsername) {
      toast.info('No changes to save');
      return;
    }

    // Don't save if username is not available
    if (usernameAvailable === false) {
      toast.error('Please choose a different username');
      return;
    }

    // Don't save if still checking
    if (checkingUsername) {
      toast.info('Please wait while we check username availability');
      return;
    }

    try {
      // Normalize username
      const normalizedUsername = username.toLowerCase();

      // Save locally FIRST (this is the primary storage for client-side wallet)
      localStorage.setItem('saturn_username', normalizedUsername);

      // Update state immediately
      setOriginalUsername(normalizedUsername);
      setUsername(normalizedUsername);
      setUsernameAvailable(null);

      // Try to sync with server (optional - don't fail if server doesn't have wallet)
      if (walletId) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/update-username`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ walletId, username: normalizedUsername }),
            }
          );

          if (!response.ok) {
            // Server sync failed - that's okay, we saved locally
            console.log('[AccountSettings] Server sync failed, but username saved locally');
          }
        } catch (serverError) {
          // Server sync failed - that's okay, we saved locally
          console.log('[AccountSettings] Server sync error:', serverError);
        }
      }

      toast.success('Username updated successfully');
      loadWalletInfo();
      loadAccounts();
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update username');
    }
  };

  const createAccount = async () => {
    if (!newAccountName.trim() || newAccountName === '@') {
      toast.error('Please enter an account name');
      return;
    }

    // Don't create if username is not available
    if (newUsernameAvailable === false) {
      toast.error('Please choose a different username');
      return;
    }

    // Don't create if still checking
    if (checkingNewUsername) {
      toast.info('Please wait while we check username availability');
      return;
    }

    setCreatingAccount(true);
    try {
      // Ensure username starts with @
      const formattedUsername = newAccountName.startsWith('@') ? newAccountName : '@' + newAccountName;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/create-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            parentWalletId: walletId,
            username: formattedUsername,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create account');
      
      const data = await response.json();
      toast.success('Account created successfully');
      setShowAddAccountDialog(false);
      setNewAccountName('');
      setNewUsernameAvailable(null);
      setNewUsernameError('');
      loadAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Handle create new account (like Home page - no dialog)
  const handleCreateAccount = async () => {
    try {
      // Get mnemonic from secure session
      const mnemonic = wallet.getMnemonic();

      if (!mnemonic || !wallet.isUnlocked) {
        toast.error('Please unlock your wallet first');
        return;
      }

      console.log('[AccountSettings] ➕ Creating new account...');

      // Get next account index
      const nextIndex = AccountManager.getNextAccountIndex();
      console.log('[AccountSettings] Next account index:', nextIndex);

      // Derive addresses for new account
      const newAddresses = await deriveAddresses(mnemonic, nextIndex);
      console.log('[AccountSettings] Derived addresses for new account');

      // Create account in AccountManager
      const newAccount = AccountManager.createNewAccount(
        walletId,
        {
          solana: newAddresses.solana,
          ethereum: newAddresses.ethereum,
        }
      );

      // Reload accounts to show the new one
      loadAccounts();

      toast.success(`Created ${newAccount.name}!`);
      console.log('[AccountSettings] ✅ New account created:', newAccount);
    } catch (error: any) {
      console.error('[AccountSettings] Error creating account:', error);
      toast.error(error.message || 'Failed to create account');
    }
  };

  const switchAccount = async (accountId: string) => {
    try {
      if (onSwitchAccount) {
        onSwitchAccount(accountId);
        
        // Update the active account ID in state
        setActiveAccountId(accountId);
        
        // Reload wallet info for the new account
        await loadWalletInfo();
        
        toast.success('Switched account successfully');
        // Stay on the page - don't call onBack()
      }
    } catch (error) {
      console.error('Error switching account:', error);
      toast.error('Failed to switch account');
    }
  };

  const deleteAccount = async () => {
    try {
      const allAccounts = AccountManager.getAccounts();
      const currentActiveId = AccountManager.getActiveAccountId();

      console.log('[AccountSettings] 🗑️ Deleting account:', currentActiveId);
      console.log('[AccountSettings] 📊 Total accounts:', allAccounts.length);

      // If this is the last account, delete everything and sign out
      if (allAccounts.length <= 1) {
        console.log('[AccountSettings] ⚠️ This is the last account - full wallet deletion');

        // Delete from backend
        try {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/delete-wallet`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ walletId }),
            }
          );
        } catch (backendError) {
          console.warn('[AccountSettings] Backend deletion failed (continuing with local):', backendError);
        }

        // Clear all local storage
        localStorage.removeItem('saturn_accounts');
        localStorage.removeItem('saturn_active_account_id');
        localStorage.removeItem('saturn_encrypted_mnemonic');
        localStorage.removeItem('saturn_wallet_id');
        localStorage.removeItem('saturn_username');

        toast.success('Wallet deleted successfully');
        setTimeout(() => onSignOut(), 1500);
        return;
      }

      // Delete only the current account
      const deleted = AccountManager.deleteAccount(currentActiveId!);

      if (!deleted) {
        toast.error('Failed to delete account');
        return;
      }

      // Get the new active account after deletion
      const newActiveAccount = AccountManager.getActiveAccount();

      if (newActiveAccount && onSwitchAccount) {
        // Notify the app to switch to the new account
        onSwitchAccount(newActiveAccount.id);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('accountSwitched', {
          detail: { accountId: newActiveAccount.id }
        }));
      }

      // Reload accounts list
      loadAccounts();

      toast.success('Account deleted successfully');
      console.log('[AccountSettings] ✅ Account deleted, switched to:', newActiveAccount?.name);

    } catch (error) {
      console.error('[AccountSettings] Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    localStorage.setItem(`saturn_avatar_emoji_${walletId}`, emoji);
    toast.success('Avatar updated successfully!');
    
    // Trigger event for other components to refresh
    window.dispatchEvent(new CustomEvent('avatarUpdated'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Get account index for current wallet
  const currentAccountIndex = accounts.findIndex(acc => acc.walletId === walletId);

  // Get the active account for avatar display (fallback to first account if not found)
  const activeAccount = accounts.find(acc => acc.id === activeAccountId) || accounts[0];

  // Use effective active account ID for comparison
  const effectiveActiveAccountId = activeAccountId || accounts[0]?.id;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Account Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <AnimalAvatar
              size="lg"
              walletId={activeAccount?.solanaAddress || walletId}
              profilePicture={walletInfo?.profilePicture}
              selectedEmoji={activeAccount?.selectedEmoji || selectedEmoji}
            />
            
            <button 
              onClick={() => setShowEmojiSelector(true)}
              className="absolute -bottom-1 -right-1 p-2 bg-[#ad46ff] hover:bg-[#ad46ff]/90 rounded-full shadow-lg border-2 border-black transition-colors"
            >
              <Smile className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <p className="text-slate-400 text-sm">
            Customize your avatar
          </p>
        </div>

        {/* Username */}
        <div className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-slate-800/30">
          <Label htmlFor="username" className="text-white flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Username
          </Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`bg-slate-950/50 text-white pr-10 border transition-all ${
                    usernameError
                      ? 'border-red-500/50 focus-visible:ring-red-500/30'
                      : usernameAvailable === true && username !== originalUsername
                      ? 'border-green-500/50 focus-visible:ring-green-500/30'
                      : 'border-slate-700/50 focus-visible:ring-purple-500/30'
                  }`}
                  placeholder="@username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {checkingUsername ? (
                      <motion.div
                        key="checking"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      </motion.div>
                    ) : usernameError ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </motion.div>
                    ) : usernameAvailable === true && username !== originalUsername ? (
                      <motion.div
                        key="available"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Check className="w-4 h-4 text-green-400" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
              <Button 
                onClick={saveUsername}
                disabled={
                  checkingUsername || 
                  usernameAvailable === false || 
                  username === originalUsername ||
                  username.length < 4 ||
                  !!usernameError
                }
                className="bg-[#ad46ff] hover:bg-[#ad46ff]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </Button>
            </div>
            <AnimatePresence>
              {usernameError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-red-400 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {usernameError}
                </motion.p>
              )}
              {usernameAvailable === true && username !== originalUsername && !usernameError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-green-400 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  This username is available!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="space-y-4 bg-slate-900/50 rounded-xl p-4 border border-slate-800/30">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-400" />
            Wallet Information
          </h3>
          
          <Separator className="bg-slate-700/50" />
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
              <span className="text-slate-400 text-sm">Wallet ID</span>
              <span className="text-slate-300 font-mono text-xs">
                {walletId.slice(0, 8)}...{walletId.slice(-6)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
              <span className="text-slate-400 text-sm">Created</span>
              <span className="text-slate-300 text-sm">
                {walletInfo?.createdAt ? new Date(walletInfo.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Recently'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
              <span className="text-slate-400 text-sm">Type</span>
              <span className="text-slate-300 text-sm">
                Multi-chain Wallet
              </span>
            </div>
          </div>
        </div>

        {/* Accounts */}
        <div className="space-y-3">
          <h3 className="text-slate-400 text-sm px-2">Your Accounts</h3>
          
          {/* Info Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-slate-300 text-sm">
              <span className="text-purple-300">💡</span> Manage multiple accounts with the same recovery phrase. Each account has its own unique address.
            </p>
          </div>
          
          <div className="space-y-2">
            {accounts.map((account, index) => {
              const isActive = account.id === effectiveActiveAccountId;
              
              return (
                <motion.button
                  key={account.id}
                  onClick={() => !isActive && switchAccount(account.walletId)}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/50' 
                      : 'bg-slate-900/50 border-slate-800/30 hover:bg-slate-900/80'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AnimalAvatar
                        size="sm"
                        walletId={account.solanaAddress || account.id}
                        selectedEmoji={account.selectedEmoji}
                      />
                      <div className="text-left">
                        <p className={`font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {account.username}
                        </p>
                        <p className="text-slate-400 text-xs font-mono">
                          {account.solanaAddress
                            ? `${account.solanaAddress.slice(0, 4)}...${account.solanaAddress.slice(-4)}`
                            : (account.isPrimary ? 'Primary Account' : 'Additional Account')}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-300 bg-purple-600/20 px-2.5 py-1 rounded-full border border-purple-500/30">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {!showAddAccountOptions ? (
              <motion.button
                key="add-button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => setShowAddAccountOptions(true)}
                className="w-full p-4 rounded-xl bg-[#ad46ff] hover:bg-[#ad46ff]/90 text-white flex items-center justify-center gap-2 transition-all font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Account</span>
              </motion.button>
            ) : (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <p className="text-sm text-slate-400 mb-3">Choose how to add an account:</p>

                {/* Option 1: Create New Account */}
                <button
                  onClick={() => {
                    handleCreateAccount();
                    setShowAddAccountOptions(false);
                  }}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:border-purple-400/50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold">Create New Account</h4>
                    <p className="text-slate-400 text-sm">Generate a new address from your wallet</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>

                {/* Option 2: Import Seed Phrase */}
                <button
                  onClick={() => {
                    setImportMode('seed-phrase');
                    setShowImportDialog(true);
                    setShowAddAccountOptions(false);
                  }}
                  className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 hover:bg-slate-800/50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold">Import Seed Phrase</h4>
                    <p className="text-slate-400 text-sm">Use a 12 or 24 word recovery phrase</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 transition-colors" />
                </button>

                {/* Option 3: Import Private Key */}
                <button
                  onClick={() => {
                    setImportMode('private-key');
                    setShowImportDialog(true);
                    setShowAddAccountOptions(false);
                  }}
                  className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 hover:bg-slate-800/50 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold">Import Private Key</h4>
                    <p className="text-slate-400 text-sm">Import using a private key string</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
                </button>

                {/* Cancel button */}
                <button
                  onClick={() => setShowAddAccountOptions(false)}
                  className="w-full p-3 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="bg-slate-800" />

        {/* Danger Zone */}
        <div className="space-y-3">
          <h3 className="text-slate-400 text-sm px-2">Danger Zone</h3>
          
          <div className="bg-slate-900/50 rounded-xl border border-red-900/30 p-4">
            <div className="mb-4">
              <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                Delete Account
              </h4>
              <p className="text-slate-400 text-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account Permanently
            </Button>
          </div>
        </div>
      </div>

      {/* Add Account Dialog */}
      <Dialog 
        open={showAddAccountDialog} 
        onOpenChange={(open) => {
          setShowAddAccountDialog(open);
          if (!open) {
            // Reset states when dialog closes
            setNewAccountName('');
            setNewUsernameAvailable(null);
            setNewUsernameError('');
            if (checkNewTimeoutRef.current) {
              clearTimeout(checkNewTimeoutRef.current);
            }
          }
        }}
      >
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Create a new account within your wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                ℹ️ New accounts share the same recovery phrase but have unique wallet addresses
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <div className="relative">
                <Input
                  id="accountName"
                  value={newAccountName}
                  onChange={(e) => handleNewAccountNameChange(e.target.value)}
                  className={`bg-slate-900 text-white pr-10 ${
                    newUsernameError
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : newUsernameAvailable === true
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : 'border-slate-700'
                  }`}
                  placeholder="@trading"
                  disabled={creatingAccount}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {checkingNewUsername ? (
                      <motion.div
                        key="checking"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      </motion.div>
                    ) : newUsernameError ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </motion.div>
                    ) : newUsernameAvailable === true ? (
                      <motion.div
                        key="available"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
              <AnimatePresence>
                {newUsernameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-red-400"
                  >
                    {newUsernameError}
                  </motion.p>
                )}
                {newUsernameAvailable === true && !newUsernameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-green-400 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    This username is available!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">Features:</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 ml-6">
                <li>• Separate wallet address</li>
                <li>• Independent balance tracking</li>
                <li>• Same recovery phrase</li>
                <li>• Easy account switching</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowAddAccountDialog(false);
                  setNewAccountName('');
                  setNewUsernameAvailable(null);
                  setNewUsernameError('');
                  if (checkNewTimeoutRef.current) {
                    clearTimeout(checkNewTimeoutRef.current);
                  }
                }}
                variant="outline"
                className="flex-1 border-slate-700"
                disabled={creatingAccount}
              >
                Cancel
              </Button>
              <Button
                onClick={createAccount}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={
                  creatingAccount || 
                  !newAccountName.trim() || 
                  newAccountName === '@' ||
                  checkingNewUsername ||
                  newUsernameAvailable === false ||
                  !!newUsernameError
                }
              >
                {creatingAccount ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-950 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {accounts.length <= 1 ? 'Delete Entire Wallet?' : 'Delete This Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="text-slate-400 text-sm">
              {accounts.length <= 1 ? (
                <div className="space-y-3">
                  <p className="text-red-400 font-semibold">⚠️ WARNING: Risk of Permanent Fund Loss!</p>
                  <p>If you haven't saved your recovery phrase or private keys, <span className="text-red-400 font-medium">ALL your funds will be permanently lost</span> and cannot be recovered.</p>
                  <p>Before deleting, please make sure you have:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Downloaded or written down your 12-word recovery phrase</li>
                    <li>Exported private keys for all accounts</li>
                    <li>Verified you can access your backup</li>
                  </ul>
                  <p className="text-slate-500 text-xs mt-2">This action cannot be undone.</p>
                </div>
              ) : (
                <p>This will delete the currently active account. Your other accounts will remain intact. You can recreate this account later using the same recovery phrase.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              {accounts.length <= 1 ? 'Yes, Delete Wallet' : 'Yes, Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Emoji Selector */}
      <EmojiSelector
        open={showEmojiSelector}
        onOpenChange={setShowEmojiSelector}
        onSelect={handleEmojiSelect}
        currentEmoji={selectedEmoji || undefined}
      />

      {/* Import Wallet Dialog */}
      <ImportWalletDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        mode={importMode}
        isAddingAccount={true}
        onSuccess={() => {
          loadAccounts();
          toast.success('Wallet imported successfully!');
        }}
      />
    </div>
  );
}