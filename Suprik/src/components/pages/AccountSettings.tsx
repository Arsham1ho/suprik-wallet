import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, User, Check, Wallet, X, Loader2, Smile, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { PlanetAvatar } from '../PlanetAvatar';
import { AnimalAvatar } from '../AnimalAvatar';
import { EmojiSelector } from '../EmojiSelector';
import { AccountSwitcher } from '../AccountSwitcher';
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
  const [newAccountName, setNewAccountName] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  
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
      // Try to load username from backend first
      let username = localStorage.getItem('saturn_username') || '@account1';
      
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
        console.log('[AccountSettings] Could not fetch from backend, using localStorage');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/accounts/${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/update-username`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId, username }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update username');
      }
      
      const data = await response.json();
      
      // Update localStorage with the normalized username from server
      localStorage.setItem('saturn_username', data.username);
      
      toast.success('Username updated successfully');
      setOriginalUsername(data.username);
      setUsername(data.username);
      setUsernameAvailable(null);
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

  const switchAccount = async (accountId: string) => {
    try {
      if (onSwitchAccount) {
        onSwitchAccount(accountId);
        toast.success('Switched account successfully');
        onBack();
      }
    } catch (error) {
      console.error('Error switching account:', error);
      toast.error('Failed to switch account');
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch(
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

      if (!response.ok) throw new Error('Failed to delete account');
      
      toast.success('Account deleted successfully');
      setTimeout(() => onSignOut(), 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-8"
        >
          <div className="relative group">
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <AnimalAvatar 
              size="lg" 
              walletId={walletId}
              profilePicture={walletInfo?.profilePicture}
              selectedEmoji={selectedEmoji}
            />
            
            {/* Enhanced emoji selector button */}
            <motion.button 
              onClick={() => setShowEmojiSelector(true)}
              className="absolute -bottom-1 -right-1 p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-xl border-2 border-slate-900"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              <Smile className="w-5 h-5 text-white drop-shadow-lg" />
              
              {/* Pulse ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-400"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </motion.button>
          </div>
          
          <motion.p 
            className="text-slate-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Customize your avatar
          </motion.p>
        </motion.div>

        {/* Username */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative space-y-3 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl"
        >
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
          
          <Label htmlFor="username" className="text-white flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
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
                      ? 'border-red-500/50 focus-visible:ring-red-500/30 bg-red-950/20'
                      : usernameAvailable === true && username !== originalUsername
                      ? 'border-green-500/50 focus-visible:ring-green-500/30 bg-green-950/20'
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
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
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
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
        </motion.div>

        {/* Wallet Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative space-y-4 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl overflow-hidden"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-50" />
          
          <div className="relative z-10">
            <h3 className="text-white font-medium flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-lg">
                <Wallet className="w-4 h-4 text-purple-400" />
              </div>
              Wallet Information
            </h3>
            
            <Separator className="bg-slate-700/50 my-4" />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                <span className="text-slate-400 text-sm">Wallet ID</span>
                <span className="text-slate-300 font-mono text-xs bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/30">
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

              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-700/30">
                <span className="text-slate-400 text-sm">Type</span>
                <span className="text-purple-300 text-sm font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                  Multi-chain Wallet
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white font-medium">Your Accounts</h3>
            <span className="text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>
          
          <div className="space-y-2.5">
            {accounts.map((account, index) => {
              const isActive = account.walletId === walletId;
              // Use wallet context addresses for current account, 
              // for other accounts show placeholder or stored addresses
              const addresses = isActive && wallet?.addresses ? wallet.addresses : {
                solana: account.solanaAddress || 'Loading...',
                ethereum: 'Loading...',
                base: 'Loading...',
              };
              
              return (
                <motion.button
                  key={account.id}
                  onClick={() => !isActive && switchAccount(account.walletId)}
                  className={`w-full p-4 rounded-xl border transition-all relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-950/50 to-blue-950/50 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                      : 'bg-slate-900/50 border-slate-800/30 hover:bg-slate-900/80 hover:border-slate-700/50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={!isActive ? { scale: 1.01, x: 4 } : {}}
                  whileTap={!isActive ? { scale: 0.99 } : {}}
                >
                  {/* Active account gradient overlay */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" />
                  )}
                  
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg ${
                          isActive 
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600' 
                            : 'bg-gradient-to-br from-slate-700 to-slate-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {account.username}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {account.isPrimary ? 'Primary Account' : `Account ${index + 1}`}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-300 bg-purple-900/40 px-2.5 py-1 rounded-full border border-purple-700/30">
                            Active
                          </span>
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                        </div>
                      )}
                    </div>
                    
                    {/* Wallet Addresses */}
                    <div className="space-y-2 pl-14">
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                        <span className="text-slate-400 text-xs">Solana</span>
                        <span className="text-slate-300 font-mono text-xs">
                          {addresses.solana.slice(0, 6)}...{addresses.solana.slice(-4)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                        <span className="text-slate-400 text-xs">Ethereum</span>
                        <span className="text-slate-300 font-mono text-xs">
                          {addresses.ethereum.slice(0, 6)}...{addresses.ethereum.slice(-4)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                        <span className="text-slate-400 text-xs">Base</span>
                        <span className="text-slate-300 font-mono text-xs">
                          {addresses.base.slice(0, 6)}...{addresses.base.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            onClick={() => setShowAddAccountDialog(true)}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/30 hover:from-purple-950/50 hover:to-blue-950/50 border border-purple-500/30 hover:border-purple-500/50 flex items-center justify-center gap-2 text-white transition-all shadow-lg"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="p-1 bg-purple-500/20 rounded-lg">
              <Plus className="w-4 h-4 text-purple-400" />
            </div>
            <span>Add Another Account</span>
          </motion.button>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h3 className="text-red-400 font-medium px-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-red-500 rounded-full" />
            Danger Zone
          </h3>
          
          <motion.div 
            className="bg-gradient-to-br from-red-950/30 to-red-900/20 rounded-2xl border border-red-900/40 p-5 relative overflow-hidden"
            whileHover={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
          >
            {/* Warning pattern background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px)'
              }} />
            </div>
            
            <div className="mb-4 relative z-10">
              <h4 className="text-white font-medium mb-1.5 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                Delete Account
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg relative z-10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account Permanently
            </Button>
          </motion.div>
        </motion.div>
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
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. Make sure you have backed up your recovery phrase before deleting your account. All your data will be permanently deleted.
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
              Yes, Delete My Account
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
    </div>
  );
}