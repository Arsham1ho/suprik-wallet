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
  Server,
  HelpCircle,
  Key
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
import { HelpAndSupport } from './HelpAndSupport';
import { toast } from 'sonner';
import { PlanetAvatar } from '../PlanetAvatar';
import { AnimalAvatar } from '../AnimalAvatar';
import { useNetwork } from '../../utils/NetworkContext';
import { useTheme } from '../../utils/ThemeContext';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { VerifyParabolicInfo } from '../VerifyParabolicInfo';
import { AccountSwitcher } from '../AccountSwitcher';
import { AccountManager } from '../../utils/accountManager';
import { useWallet } from '../../utils/WalletContext';
import { deriveAddresses } from '../../utils/wallet';
import { VERSION_STRING } from '../../utils/version';

interface SettingsProps {
  onSignOut: () => void;
  walletId: string;
  onLockWallet?: () => void;
  onSwitchAccount?: (walletId: string) => void;
  onSubpageChange?: (isSubpage: boolean) => void;
}

type SettingsPage = 'main' | 'account' | 'preferences' | 'security' | 'about' | 'invite' | 'nft' | 'theme' | 'addressBook' | 'feeWallet' | 'apiKeys' | 'balanceChecker' | 'verifyToken' | 'rpc' | 'helpSupport';

export function Settings({ onSignOut, walletId, onLockWallet, onSwitchAccount, onSubpageChange }: SettingsProps) {
  const [currentPage, setCurrentPage] = useState<SettingsPage>('main');
  const [devMode, setDevMode] = useState(false);
  const [devDialogOpen, setDevDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [activeAccountAddress, setActiveAccountAddress] = useState<string | null>(null);
  const [activeAccountEmoji, setActiveAccountEmoji] = useState<string | null>(null);
  const { isTestnet, toggleNetwork } = useNetwork();
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Notify parent when on a subpage (to hide bottom nav)
  useEffect(() => {
    onSubpageChange?.(currentPage !== 'main');
  }, [currentPage, onSubpageChange]);

  useEffect(() => {
    loadDevMode();
    loadProfilePicture();
    loadActiveAccount();

    // Listen for profile picture updates
    const handleProfileUpdate = () => {
      loadProfilePicture();
    };

    // Listen for account switches
    const handleAccountSwitch = () => {
      loadActiveAccount();
    };

    window.addEventListener('profilePictureUpdated', handleProfileUpdate);
    window.addEventListener('accountSwitched', handleAccountSwitch);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
      window.removeEventListener('accountSwitched', handleAccountSwitch);
    };
  }, [walletId]);

  const loadActiveAccount = () => {
    try {
      const activeAccount = AccountManager.getActiveAccount();
      if (activeAccount) {
        setActiveAccountAddress(activeAccount.addresses?.solana || null);
        setActiveAccountEmoji(activeAccount.selectedEmoji || null);
      }
    } catch (error) {
      console.error('[Settings] Error loading active account:', error);
    }
  };

  const loadDevMode = () => {
    try {
      // Load from localStorage (instant, no server call)
      const key = `suprik_dev_mode_${walletId}`;
      const stored = localStorage.getItem(key);
      setDevMode(stored === 'true');
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

  const toggleDevMode = (enabled: boolean) => {
    try {
      setDevMode(enabled);

      // Save to localStorage (instant, no server call)
      const key = `suprik_dev_mode_${walletId}`;
      localStorage.setItem(key, enabled ? 'true' : 'false');

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
            <h1 className="text-2xl font-bold">{t.theme.title}</h1>
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
            <h1 className="text-2xl font-bold">{t.addressBook.title}</h1>
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

  if (currentPage === 'helpSupport') {
    return (
      <HelpAndSupport onBack={() => setCurrentPage('main')} />
    );
  }

  // Main settings page
  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full">
      <div className="px-4 py-6 w-full max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl mb-8">
          {t.settings.title}
        </h1>

        {/* Account */}
        <div className="space-y-3 mb-6">
          <h3 className="text-slate-400 text-sm px-2">{t.settings.general}</h3>

          <button
            onClick={() => setCurrentPage('account')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <AnimalAvatar
                size="sm"
                walletId={activeAccountAddress || walletId}
                profilePicture={profilePicture}
                selectedEmoji={activeAccountEmoji}
              />
              <div className="text-left">
                <p className="text-white font-medium">{t.settings.accountSettings}</p>
                <p className="text-slate-400 text-sm">{t.settings.accountSettingsDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('preferences')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{t.settings.preferences}</p>
                <p className="text-slate-400 text-sm">{t.settings.preferencesDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('security')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{t.settings.security}</p>
                <p className="text-slate-400 text-sm">{t.settings.securityDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('theme')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
              >
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{t.theme.title}</p>
                <p className="text-slate-400 text-sm">{t.settings.themeDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Developer Settings */}
        <div className="space-y-3 mb-6">
          <h3 className="text-slate-400 text-sm px-2">{t.settings.developer}</h3>

          <div
            className="p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: isTestnet ? `${colors.primary}1A` : 'rgba(15, 23, 42, 0.5)',
              borderColor: isTestnet ? `${colors.primary}4D` : 'rgba(51, 65, 85, 0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: isTestnet
                      ? `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`
                      : '#1e293b',
                  }}
                >
                  <Wrench className={`w-5 h-5 ${isTestnet ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{t.settings.testnetMode}</p>
                    {isTestnet && (
                      <span
                        className="text-xs text-white px-2 py-0.5 rounded"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {t.common.active}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">
                    {isTestnet ? t.settings.usingTestNetwork : t.settings.enableForTesting}
                  </p>
                </div>
              </div>
              <Switch
                checked={isTestnet}
                onCheckedChange={() => {
                  toggleNetwork();
                  toast.success(isTestnet ? t.settings.switchedToMainnet : t.settings.switchedToTestnet);
                  // Trigger a refresh of balances
                  window.dispatchEvent(new Event('walletBalanceUpdated'));
                }}
                style={{
                  backgroundColor: isTestnet ? colors.primary : undefined,
                }}
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
                <Wallet className="w-5 h-5" style={{ color: colors.accent }} />
                <span className="text-white font-medium">{t.settings.testReceiveTokens}</span>
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
                <p className="text-white font-medium">{t.settings.rpcSettings}</p>
                <p className="text-slate-400 text-sm">{t.settings.rpcSettingsDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('apiKeys')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">API Keys</p>
                <p className="text-slate-400 text-sm">Configure blockchain API keys</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Support & Info */}
        <div className="space-y-3 mb-6">
          <h3 className="text-slate-400 text-sm px-2">{t.settings.support}</h3>

          <button
            onClick={() => setCurrentPage('helpSupport')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{t.settings.helpSupport}</p>
                <p className="text-slate-400 text-sm">{t.settings.helpSupportDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('invite')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
              >
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{t.settings.inviteFriends}</p>
                <p className="text-slate-400 text-sm">{t.settings.inviteFriendsDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentPage('about')}
            className="w-full p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between border border-slate-800/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{t.settings.about}</p>
                <p className="text-slate-400 text-sm">{t.settings.aboutDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Lock Wallet */}
        <div className="mt-8 space-y-3">
          <Button
            onClick={() => {
              if (onLockWallet) {
                onLockWallet();
              } else {
                toast.error(t.messages.error.generic);
              }
            }}
            variant="outline"
            className="w-full h-12 border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-white backdrop-blur-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t.settings.lockWallet}
          </Button>

          <Button
            onClick={async () => {
              try {
                // Clear all local data including wallet_id (used by App.tsx)
                localStorage.removeItem('wallet_id');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('biometricEnabled');
                sessionStorage.clear();

                toast.success(t.settings.signedOut);

                // Wait a moment for toast to show, then sign out
                setTimeout(() => {
                  onSignOut();
                }, 500);
              } catch (error) {
                console.error('Sign out error:', error);
                toast.error(t.messages.error.generic);
              }
            }}
            variant="outline"
            className="w-full h-12 border-red-900/30 bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 backdrop-blur-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t.settings.signOut}
          </Button>
        </div>

        {/* Version */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">{VERSION_STRING}</p>
        </div>
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