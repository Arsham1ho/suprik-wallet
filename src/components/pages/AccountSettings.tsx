import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, User, Check, Wallet, X, Loader2, Smile, Key, FileText, Sparkles, ChevronRight, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AnimalAvatar } from '../AnimalAvatar';
import { EmojiSelector } from '../EmojiSelector';
import { ImportWalletDialog } from '../ImportWalletDialog';
import { AccountManager } from '../../utils/accountManager';
import { useWallet } from '../../utils/WalletContext';
import { useTheme } from '../../utils/ThemeContext';
import { deriveAddresses } from '../../utils/wallet';
import { scrollToTop } from '../../utils/scrollToTop';

interface AccountSettingsProps {
  onBack: () => void;
  walletId: string;
  onSignOut: () => void;
  onSwitchAccount?: (accountId: string) => void;
}

interface WalletInfo {
  username?: string;
  profilePicture?: string;
  [key: string]: any;
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
  const { colors } = useTheme();
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

  // Scroll to top when component mounts
  useLayoutEffect(() => {
    scrollToTop();
  }, []);

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

    // Username is a local-only label — format is valid
    setNewUsernameAvailable(true);
    setNewUsernameError('');
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
      // Load username from localStorage (source of truth — no server storage)
      const localUsername = localStorage.getItem('saturn_username');
      const username = localUsername || '@account1';
      
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
        profilePicture: null,
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

    // Username is a local-only label — format is valid
    setUsernameAvailable(true);
    setUsernameError('');
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

      // Save to localStorage (source of truth — no server storage)
      localStorage.setItem('saturn_username', normalizedUsername);

      // Update state immediately
      setOriginalUsername(normalizedUsername);
      setUsername(normalizedUsername);
      setUsernameAvailable(null);

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
      // Client-side account creation — seed phrase never leaves the device
      const mnemonic = wallet.getMnemonic();
      if (!mnemonic || !wallet.isUnlocked) {
        toast.error('Please unlock your wallet first');
        return;
      }

      const formattedUsername = newAccountName.startsWith('@') ? newAccountName : '@' + newAccountName;

      // Derive addresses client-side
      const nextIndex = AccountManager.getNextAccountIndex();
      const newAddresses = await deriveAddresses(mnemonic, nextIndex);

      // Create account in local AccountManager
      const newAccount = AccountManager.createNewAccount(walletId, {
        solana: newAddresses.solana,
        ethereum: newAddresses.ethereum,
      });

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
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

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 relative z-0">
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
              className="absolute -bottom-1 -right-1 p-2 rounded-full shadow-lg border-2 border-black transition-colors"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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
                      : 'border-slate-700/50'
                  }`}
                  style={!usernameError && !(usernameAvailable === true && username !== originalUsername) ? { '--tw-ring-color': `${colors.primary}4D` } as React.CSSProperties : undefined}
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
                className="text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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

        {/* Sign-in Method */}
        {(() => {
          const authMethod = localStorage.getItem(`${walletId}_auth_method`);
          const socialProvider = localStorage.getItem(`${walletId}_social_provider`);
          const socialEmail = localStorage.getItem(`${walletId}_social_email`);

          // Mask email: "john.doe@gmail.com" → "jo****e@gm***l.com"
          const maskEmail = (email: string): string => {
            const [local, domain] = email.split('@');
            if (!domain) return '****';
            const maskedLocal = local.length <= 2
              ? local[0] + '****'
              : local[0] + local[1] + '****' + local[local.length - 1];
            const [domName, ...domExt] = domain.split('.');
            const maskedDom = domName.length <= 2
              ? domName + '***'
              : domName[0] + domName[1] + '***' + domName[domName.length - 1];
            return `${maskedLocal}@${maskedDom}.${domExt.join('.')}`;
          };

          let methodLabel = 'Recovery Phrase';
          let methodIcon = <Shield className="w-5 h-5 text-purple-400" />;
          let methodDescription = 'Signed in using a 12-word recovery phrase';

          if (authMethod === 'social' || (!authMethod && socialProvider)) {
            if (socialProvider === 'google') {
              methodLabel = 'Google';
              methodIcon = (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              );
              methodDescription = socialEmail ? maskEmail(socialEmail) : 'Signed in with Google';
            } else if (socialProvider === 'apple') {
              methodLabel = 'Apple';
              methodIcon = (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              );
              methodDescription = socialEmail ? maskEmail(socialEmail) : 'Signed in with Apple';
            } else {
              methodLabel = 'Social Login';
              methodIcon = <Shield className="w-5 h-5 text-blue-400" />;
              methodDescription = socialEmail ? maskEmail(socialEmail) : 'Signed in with social account';
            }
          } else if (authMethod === 'email') {
            methodLabel = 'Email';
            methodIcon = <Mail className="w-5 h-5 text-blue-400" />;
            methodDescription = socialEmail ? maskEmail(socialEmail) : 'Signed in with email verification';
          }

          return (
            <div className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-slate-800/30">
              <Label className="text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Sign-in Method
              </Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800/30">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center flex-shrink-0">
                  {methodIcon}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">{methodLabel}</p>
                  <p className="text-slate-400 text-xs truncate">{methodDescription}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Accounts */}
        <div className="space-y-3">
          <h3 className="text-slate-400 text-sm px-2">Your Accounts</h3>
          
          {/* Info Card */}
          <div
            className="rounded-xl p-4 border"
            style={{
              background: `linear-gradient(to bottom right, ${colors.primary}1A, ${colors.secondary}1A)`,
              borderColor: `${colors.primary}4D`,
            }}
          >
            <p className="text-slate-300 text-sm">
              <span style={{ color: colors.accent }}>💡</span> Manage multiple accounts with the same recovery phrase. Each account has its own unique address.
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
                      ? ''
                      : 'bg-slate-900/50 border-slate-800/30 hover:bg-slate-900/80'
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(to bottom right, ${colors.primary}1A, ${colors.secondary}1A)`,
                    borderColor: `${colors.primary}80`,
                  } : undefined}
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
                        <span
                          className="text-xs px-2.5 py-1 rounded-full border"
                          style={{
                            color: colors.accent,
                            backgroundColor: `${colors.primary}33`,
                            borderColor: `${colors.primary}4D`,
                          }}
                        >
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
                className="w-full p-4 rounded-xl text-white flex items-center justify-center gap-2 transition-all font-medium"
                style={{ backgroundColor: colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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
                  className="w-full p-4 rounded-xl border transition-all flex items-center gap-4 group"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}33, ${colors.secondary}33)`,
                    borderColor: `${colors.primary}4D`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${colors.primary}80`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${colors.primary}4D`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold">Create New Account</h4>
                    <p className="text-slate-400 text-sm">Generate a new address from your wallet</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 transition-colors" style={{ color: undefined }} />
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
                <Wallet className="w-4 h-4" style={{ color: colors.accent }} />
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
                className="flex-1 text-white"
                style={{ backgroundColor: colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
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