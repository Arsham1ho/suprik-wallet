import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, ChevronRight, Copy, Key, FileText, UserPlus } from 'lucide-react';
import { AnimalAvatar } from './AnimalAvatar';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';
import { useTheme } from '../utils/ThemeContext';

interface Account {
  id: string;
  name: string;
  addresses: {
    solana: string;
    ethereum: string;
  };
  profilePicture?: string;
  selectedEmoji?: string;
}

interface AccountSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAccount: Account;
  accounts: Account[];
  onSwitchAccount: (accountId: string) => void;
  onCreateAccount: () => void;
  onImportSeedPhrase?: () => void;
  onImportPrivateKey?: () => void;
}

export function AccountSwitcher({
  open,
  onOpenChange,
  currentAccount,
  accounts,
  onSwitchAccount,
  onCreateAccount,
  onImportSeedPhrase,
  onImportPrivateKey,
}: AccountSwitcherProps) {
  const { colors } = useTheme();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  // Track if initial animation has played to prevent re-animations
  const hasAnimatedRef = useRef(false);

  // Reset animation state when dialog opens
  useEffect(() => {
    if (open) {
      // Allow animation on first open, then disable
      setTimeout(() => {
        hasAnimatedRef.current = true;
      }, 500);
    } else {
      // Reset when dialog closes so next open animates
      hasAnimatedRef.current = false;
    }
  }, [open]);

  // Reset showAddOptions when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowAddOptions(false);
    }
    onOpenChange(newOpen);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await copyToClipboard(address);
      setCopiedAddress(address);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800/30">
          <DialogTitle className="text-xl font-bold">Your Accounts</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">Switch between your accounts or create a new one.</DialogDescription>
        </DialogHeader>

        <div className="px-3 py-3 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {/* Deduplicate accounts by Solana address to prevent showing duplicates */}
            {accounts
              .filter((account, index, self) =>
                index === self.findIndex(a => a.addresses.solana === account.addresses.solana)
              )
              .map((account, idx) => {
              const isActive = account.id === currentAccount.id;
              
              return (
                <motion.div
                  key={account.id}
                  initial={hasAnimatedRef.current ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={hasAnimatedRef.current ? { duration: 0 } : { delay: idx * 0.05 }}
                  onClick={() => {
                    if (!isActive) {
                      onSwitchAccount(account.id);
                      onOpenChange(false);
                    }
                  }}
                  className={`w-full p-4 rounded-xl mb-2 transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'border'
                      : 'bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 hover:border-slate-700/50'
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(to right, ${colors.primary}33, ${colors.secondary}33)`,
                    borderColor: `${colors.primary}4D`,
                  } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <AnimalAvatar
                      size="sm"
                      walletId={account.addresses.solana || account.id}
                      profilePicture={account.profilePicture}
                      selectedEmoji={account.selectedEmoji}
                    />

                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-semibold">{account.name}</h4>
                        {isActive && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">Active</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAddress(account.addresses.solana);
                          }}
                          className="flex items-center gap-1 text-slate-400 transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        >
                          <span className="text-xs font-mono">
                            {truncateAddress(account.addresses.solana)}
                          </span>
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!isActive && (
                    <ChevronRight className="w-5 h-5 text-slate-500 transition-colors group-hover:text-theme-accent" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add Account Button / Options */}
        <div className="px-6 py-4 border-t border-slate-800/30">
          {!showAddOptions ? (
            <button
              onClick={() => setShowAddOptions(true)}
              className="w-full p-4 rounded-xl text-white flex items-center justify-center gap-2 transition-all font-medium"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Account</span>
            </button>
          ) : (
            <div className="space-y-3">
                <p className="text-sm text-slate-400 mb-3">Choose how to add an account:</p>

                {/* Option 1: Create New Account */}
                <button
                  onClick={() => {
                    onCreateAccount();
                    setShowAddOptions(false);
                    onOpenChange(false);
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
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold">Create New Account</h4>
                    <p className="text-slate-400 text-sm">Generate a new address from your wallet</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-theme-accent transition-colors" />
                </button>

                {/* Option 2: Import Seed Phrase */}
                <button
                  onClick={() => {
                    if (onImportSeedPhrase) {
                      onImportSeedPhrase();
                    } else {
                      toast.info('Seed phrase import coming soon!');
                    }
                    setShowAddOptions(false);
                    onOpenChange(false);
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
                    if (onImportPrivateKey) {
                      onImportPrivateKey();
                    } else {
                      toast.info('Private key import coming soon!');
                    }
                    setShowAddOptions(false);
                    onOpenChange(false);
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
                  onClick={() => setShowAddOptions(false)}
                  className="w-full p-3 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}