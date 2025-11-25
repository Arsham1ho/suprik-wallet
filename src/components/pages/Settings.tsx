import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  Globe, 
  Shield, 
  Info, 
  Users, 
  LogOut, 
  Wrench, 
  Palette, 
  BookUser,
  Wallet,
  ChevronDown,
  Server
} from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { FeeWalletInfo } from './FeeWalletInfo';
import { ApiKeySetup } from '../ApiKeySetup';
import { BalanceChecker } from './BalanceChecker';
import { AccountSettings } from './AccountSettings';
import { PreferencesSettings } from './PreferencesSettings';
import { SecuritySettings } from './SecuritySettings';
import { AboutSuprik } from './AboutSuprik';
import { InviteFriends } from './InviteFriends';
import { NFTGallery } from './NFTGallery';
import { ThemeCustomization } from '../ThemeCustomization';
import { AddressBook } from '../AddressBook';
import { DevModeDialog } from '../DevModeDialog';
import { RpcSettings } from './RpcSettings';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { PlanetAvatar } from '../PlanetAvatar';
import { AnimalAvatar } from '../AnimalAvatar';
import { useNetwork } from '../../utils/NetworkContext';
import { VerifyParabolicInfo } from '../VerifyParabolicInfo';
import { AccountSwitcher } from '../AccountSwitcher';
import { AccountManager } from '../../utils/accountManager';
import { useWallet } from '../../utils/WalletContext';
import { deriveAddresses } from '../../utils/wallet';

interface SettingsProps {
  onSignOut: () => void;
  walletId: string;
  onSwitchAccount?: (walletId: string) => void;
}

type SettingsPage = 'main' | 'account' | 'preferences' | 'security' | 'about' | 'invite' | 'nft' | 'theme' | 'addressBook' | 'feeWallet' | 'apiKeys' | 'balanceChecker' | 'verifyToken' | 'rpc';

export function Settings({ onSignOut, walletId, onSwitchAccount }: SettingsProps) {
  const [currentPage, setCurrentPage] = useState<SettingsPage>('main');
  const [devMode, setDevMode] = useState(false);
  const [devDialogOpen, setDevDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const { isTestnet, toggleNetwork } = useNetwork();

  useEffect(() => {
    loadDevMode();
    loadProfilePicture();
    
    // Listen for profile picture updates
    const handleProfileUpdate = () => {
      loadProfilePicture();
    };
    
    window.addEventListener('profilePictureUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
    };
  }, [walletId]);

  const loadDevMode = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/get-dev-mode?walletId=${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDevMode(data.devMode || false);
      }
    } catch (error) {
      console.error('Error loading dev mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfilePicture = async () => {
    try {
      // In client-side architecture, profile data is in localStorage
      const storedProfilePicture = localStorage.getItem('saturn_profile_picture') || null;
      setProfilePicture(storedProfilePicture);
      
      console.log('[Settings] ✅ Profile picture loaded from localStorage');
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  const toggleDevMode = async (enabled: boolean) => {
    try {
      setDevMode(enabled);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/set-dev-mode`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId, devMode: enabled }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update dev mode');
      }

      toast.success(enabled ? 'Testnet Mode enabled' : 'Testnet Mode disabled');
    } catch (error) {
      console.error('Error toggling dev mode:', error);
      setDevMode(!enabled);
      toast.error('Failed to update testnet mode');
    }
  };

  // Render sub-pages
  if (currentPage === 'account') {
    return (
      <AccountSettings 
        onBack={() => setCurrentPage('main')} 
        walletId={walletId}
        onSignOut={onSignOut}
        onSwitchAccount={onSwitchAccount}
      />
    );
  }

  if (currentPage === 'preferences') {
    return (
      <PreferencesSettings 
        onBack={() => setCurrentPage('main')} 
        walletId={walletId}
      />
    );
  }

  if (currentPage === 'security') {
    return (
      <SecuritySettings 
        onBack={() => setCurrentPage('main')} 
        walletId={walletId}
      />
    );
  }

  if (currentPage === 'about') {
    return (
      <AboutSuprik 
        onBack={() => setCurrentPage('main')}
      />
    );
  }

  if (currentPage === 'invite') {
    return (
      <InviteFriends 
        onBack={() => setCurrentPage('main')}
        walletId={walletId}
      />
    );
  }

  if (currentPage === 'nft') {
    return (
      <NFTGallery 
        walletId={walletId}
        onBack={() => setCurrentPage('main')}
      />
    );
  }

  if (currentPage === 'theme') {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full">
        <div className="px-4 py-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('main')}
              className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold">Theme Customization</h1>
          </div>
          <ThemeCustomization walletId={walletId} />
        </div>
      </div>
    );
  }

  if (currentPage === 'addressBook') {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full">
        <div className="px-4 py-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('main')}
              className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold">Address Book</h1>
          </div>
          <AddressBook walletId={walletId} />
        </div>
      </div>
    );
  }

  if (currentPage === 'feeWallet') {
    return <FeeWalletInfo onBack={() => setCurrentPage('main')} />;
  }

  if (currentPage === 'apiKeys') {
    return (
      <div className="min-h-screen bg-black text-white pb-20 w-full">
        <div className="px-4 py-6 w-full max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('main')}
              className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 mr-3"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold">API Keys</h1>
          </div>
          <ApiKeySetup />
        </div>
      </div>
    );
  }

  if (currentPage === 'balanceChecker') {
    return (
      <BalanceChecker onBack={() => setCurrentPage('main')} />
    );
  }

  if (currentPage === 'verifyToken') {
    return (
      <VerifyParabolicInfo onBack={() => setCurrentPage('main')} />
    );
  }

  if (currentPage === 'rpc') {
    return (
      <RpcSettings onBack={() => setCurrentPage('main')} />
    );
  }

  // Main settings page
  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-6 w-full max-w-2xl mx-auto">
        {/* Header */}
        <motion.h1 
          className="text-2xl mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Settings
        </motion.h1>

        {/* Account */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-slate-400 text-sm px-2">Account</h3>
          
          <button
            onClick={() => setCurrentPage('account')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <AnimalAvatar 
                size="sm" 
                walletId={walletId}
                profilePicture={profilePicture}
              />
              <div className="text-left">
                <p className="text-white font-medium">Account Settings</p>
                <p className="text-slate-400 text-sm">Profile, username & accounts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </motion.div>

        {/* Wallet */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-slate-400 text-sm px-2">Wallet</h3>
          
          <button
            onClick={() => setCurrentPage('addressBook')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <BookUser className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Address Book</p>
                <p className="text-slate-400 text-sm">Manage saved addresses</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </motion.div>

        {/* Preferences */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-slate-400 text-sm px-2">Preferences</h3>
          
          <button
            onClick={() => setCurrentPage('preferences')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Language & Currency</p>
                <p className="text-slate-400 text-sm">Customize your experience</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          
          <button
            onClick={() => setCurrentPage('theme')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Theme Customization</p>
                <p className="text-slate-400 text-sm">Choose app colors & style</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </motion.div>

        {/* Security */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-slate-400 text-sm px-2">Security</h3>
          
          <button
            onClick={() => setCurrentPage('security')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Security & Privacy</p>
                <p className="text-slate-400 text-sm">Recovery phrase, password & logs</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </motion.div>

        {/* Developer Settings */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-slate-400 text-sm px-2">Developer</h3>
          
          <div className={`p-4 rounded-xl border transition-all ${
            isTestnet 
              ? 'bg-purple-500/10 border-purple-500/30' 
              : 'bg-slate-900/50 border-slate-800/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isTestnet 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-slate-800'
                }`}>
                  <Wrench className={`w-5 h-5 ${isTestnet ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">Testnet Mode</p>
                    {isTestnet && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">Active</span>}
                  </div>
                  <p className="text-slate-400 text-xs">
                    {isTestnet ? 'Using test network' : 'Enable for testing'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isTestnet}
                onCheckedChange={() => {
                  toggleNetwork();
                  toast.success(isTestnet ? 'Switched to Mainnet' : 'Switched to Testnet');
                  // Trigger a refresh of balances
                  window.dispatchEvent(new Event('walletBalanceUpdated'));
                }}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>

          {devMode && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onClick={() => setDevDialogOpen(true)}
              className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Test Receive Tokens</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </motion.button>
          )}

          <button
            onClick={() => setCurrentPage('rpc')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">RPC Settings</p>
                <p className="text-slate-400 text-sm">Configure network endpoints</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </motion.div>

        {/* Support & Info */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-slate-400 text-sm px-2">Support</h3>
          
          <button
            onClick={() => setCurrentPage('about')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">About Suprik</p>
                <p className="text-slate-400 text-sm">Version, features & links</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('invite')}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 transition-all flex items-center justify-between border border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Invite Friends</p>
                <p className="text-purple-300 text-sm">Share Suplet with others</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-600" />
          </button>
        </motion.div>

        {/* Lock Wallet */}
        <motion.div 
          className="mt-8 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={onSignOut}
            variant="outline"
            className="w-full h-12 border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-white backdrop-blur-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Lock Wallet
          </Button>

          <Button
            onClick={async () => {
              try {
                // Clear all local data including wallet_id (used by App.tsx)
                localStorage.removeItem('wallet_id');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('biometricEnabled');
                sessionStorage.clear();
                
                toast.success('Successfully signed out');
                
                // Wait a moment for toast to show, then sign out
                setTimeout(() => {
                  onSignOut();
                }, 500);
              } catch (error) {
                console.error('Sign out error:', error);
                toast.error('Failed to sign out');
              }
            }}
            variant="outline"
            className="w-full h-12 border-red-900/30 bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 backdrop-blur-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>

        {/* Version */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-slate-600 text-sm">Suprik v1.0.0</p>
        </motion.div>
      </div>

      {/* Dev Mode Dialog */}
      <DevModeDialog 
        open={devDialogOpen} 
        onOpenChange={setDevDialogOpen} 
        walletId={walletId}
        onTransactionAdded={() => {
          toast.success('Transaction simulated successfully!');
        }}
      />
    </div>
  );
}