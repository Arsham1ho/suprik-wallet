import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, ChevronRight, Copy, User } from 'lucide-react';
import { AnimalAvatar } from './AnimalAvatar';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';

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
}

export function AccountSwitcher({
  open,
  onOpenChange,
  currentAccount,
  accounts,
  onSwitchAccount,
  onCreateAccount,
}: AccountSwitcherProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800/30">
          <DialogTitle className="text-xl font-bold">Your Accounts</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">Switch between your accounts or create a new one.</DialogDescription>
        </DialogHeader>

        <div className="px-3 py-3 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {accounts.map((account, idx) => {
              const isActive = account.id === currentAccount.id;
              
              return (
                <motion.button
                  key={account.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    if (!isActive) {
                      onSwitchAccount(account.id);
                      onOpenChange(false);
                    }
                  }}
                  className={`w-full p-4 rounded-xl mb-2 transition-all flex items-center justify-between group ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30' 
                      : 'bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 hover:border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AnimalAvatar
                      size="sm"
                      walletId={account.id}
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
                          className="flex items-center gap-1 text-slate-400 hover:text-purple-400 transition-colors"
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
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Create New Account Button */}
        <div className="px-6 py-4 border-t border-slate-800/30">
          <Button
            onClick={() => {
              onCreateAccount();
              onOpenChange(false);
            }}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}