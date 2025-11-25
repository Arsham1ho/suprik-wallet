import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { ArrowLeft, Shield, Eye, EyeOff, Download, Key, Copy, Check, Fingerprint, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { 
  isBiometricAvailable, 
  registerBiometric, 
  removeBiometric, 
  getBiometricTypeName,
  type BiometricSettings 
} from '../../utils/biometric';

interface SecuritySettingsProps {
  onBack: () => void;
  walletId: string;
}

interface WalletInfo {
  seedPhrase: string | null;
  email?: string | null;
  authMethod?: string;
  createdAt: string;
  username?: string;
  walletName?: string;
  profilePicture?: string;
  networkStatus?: string;
}

interface UserSettings {
  language: string;
  currency: string;
  usePassword: boolean;
  password?: string;
  biometric?: BiometricSettings;
}

export function SecuritySettings({ onBack, walletId }: SecuritySettingsProps) {
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [copiedWord, setCopiedWord] = useState<number | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [settingUpBiometric, setSettingUpBiometric] = useState(false);
  const biometricType = getBiometricTypeName();

  useEffect(() => {
    loadData();
    checkBiometric();
  }, [walletId]);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    console.log('[SecuritySettings] Biometric available:', available);
  };

  const loadData = async () => {
    try {
      // Load wallet info from localStorage (client-side architecture)
      const storedAuthMethod = localStorage.getItem('saturn_auth_method') || 'recovery-phrase';
      const storedSeedPhrase = null; // Never load from localStorage for security
      
      setWalletInfo({
        seedPhrase: storedSeedPhrase,
        email: null,
        authMethod: storedAuthMethod,
        createdAt: null,
        username: null,
        walletName: null,
        profilePicture: null,
        networkStatus: null,
      });
      
      // Try to load user settings from server (these are stored server-side)
      try {
        const settingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/user-settings/${walletId}`,
          {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          }
        );
        
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          setUserSettings(data);
        }
      } catch (settingsError) {
        console.log('[SecuritySettings] No user settings found, using defaults');
      }
      
      console.log('[SecuritySettings] ✅ Data loaded from localStorage');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...userSettings, ...newSettings };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/update-settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ walletId, settings: updatedSettings }),
        }
      );

      if (!response.ok) throw new Error('Failed to update settings');
      
      setUserSettings(updatedSettings as UserSettings);
      toast.success('Security settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const setPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    await updateSettings({ usePassword: true, password: newPassword });
    setShowPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const removePassword = async () => {
    await updateSettings({ usePassword: false, password: undefined });
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      // Check availability first
      if (!biometricAvailable) {
        toast.error('Biometric authentication is not available on this device');
        return;
      }
      
      // Enable biometric
      setSettingUpBiometric(true);
      try {
        const result = await registerBiometric(walletId);
        
        if (result.success) {
          const newBiometricSettings: BiometricSettings = {
            enabled: true,
            autoLockMinutes: 5, // Default to 5 minutes
            requireForTransactions: true,
          };
          await updateSettings({ 
            biometric: newBiometricSettings 
          });
          toast.success(`${biometricType} enabled successfully`);
        } else {
          if (!result.cancelled) {
            toast.error(result.error || 'Failed to enable biometric');
          }
        }
      } catch (error) {
        console.error('[SecuritySettings] Biometric setup error:', error);
        toast.error('Failed to enable biometric');
      } finally {
        setSettingUpBiometric(false);
      }
    } else {
      // Disable biometric
      removeBiometric(walletId);
      await updateSettings({ 
        biometric: { 
          enabled: false, 
          autoLockMinutes: 0,
          requireForTransactions: false 
        } 
      });
      toast.success(`${biometricType} disabled`);
    }
  };

  const updateAutoLock = async (minutes: number) => {
    const currentBiometric = userSettings?.biometric || { 
      enabled: true, 
      autoLockMinutes: 5,
      requireForTransactions: true 
    };
    await updateSettings({ 
      biometric: { ...currentBiometric, autoLockMinutes: minutes } 
    });
  };

  const toggleRequireForTransactions = async (required: boolean) => {
    const currentBiometric = userSettings?.biometric || { 
      enabled: true, 
      autoLockMinutes: 5,
      requireForTransactions: false 
    };
    await updateSettings({ 
      biometric: { ...currentBiometric, requireForTransactions: required } 
    });
  };

  const downloadLogs = () => {
    const logs = {
      walletId,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings: userSettings,
      message: 'Saturn Wallet Logs',
      account: {
        username: walletInfo?.username,
        created: walletInfo?.createdAt,
      }
    };
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saturn-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs downloaded successfully');
  };

  const copyToClipboard = async (text: string, wordIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (wordIndex !== undefined) {
        setCopiedWord(wordIndex);
        setTimeout(() => setCopiedWord(null), 2000);
      }
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const removeRecoveryPhrase = () => {
    toast.error('Cannot remove recovery phrase - it\'s required to access your wallet');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const seedWords = walletInfo?.seedPhrase?.split(' ') || [];

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
          <h1 className="text-xl">Security & Privacy</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Authentication Method Info */}
        {walletInfo?.authMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-medium">Authentication Method</h4>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">
                {walletInfo.authMethod === 'email' 
                  ? `You signed up with email: ${walletInfo.email}`
                  : 'You signed up with recovery phrase'
                }
              </p>
              {walletInfo.authMethod === 'email' && walletInfo.email && (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
                  <p className="text-blue-200 text-xs">
                    💡 A recovery phrase was automatically generated for your wallet. You can view it below.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recovery Phrase Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Recovery Phrase</h3>
          
          <div className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-orange-400" />
              <h4 className="text-orange-400 font-medium">Secret Recovery Phrase</h4>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Your 12-word recovery phrase is the master key to your wallet. Never share it with anyone.
            </p>

            {!phraseConfirmed ? (
              <div className="space-y-3">
                <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-yellow-300 border border-yellow-900/30">
                  ⚠️ Make sure you're in a private location before revealing your phrase
                </div>
                <Button 
                  onClick={() => setPhraseConfirmed(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  I Understand, Show Recovery Phrase
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div className={`transition-all duration-300 ${!phraseVisible && 'blur-md select-none'}`}>
                    <div className="grid grid-cols-3 gap-2">
                      {seedWords.map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() => phraseVisible && copyToClipboard(word, idx)}
                          disabled={!phraseVisible}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-left hover:bg-slate-800 transition-colors relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-slate-500 text-xs block">{idx + 1}.</span>
                              <span className="text-white text-sm font-medium">{word}</span>
                            </div>
                            {phraseVisible && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {copiedWord === idx ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {!phraseVisible && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button 
                        onClick={() => setPhraseVisible(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Reveal Phrase
                      </Button>
                    </div>
                  )}
                </div>

                {phraseVisible && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700" 
                      onClick={() => copyToClipboard(walletInfo?.seedPhrase || '')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All Words
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-slate-700"
                      onClick={() => setPhraseVisible(false)}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </Button>
                  </div>
                )}

                <Button 
                  variant="outline"
                  className="w-full border-red-900/30 text-red-400 hover:bg-red-950/20"
                  onClick={removeRecoveryPhrase}
                >
                  Remove Recovery Phrase
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Biometric Authentication */}
        {biometricAvailable && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-slate-400 text-sm px-2">Biometric Authentication</h3>
              
              <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Fingerprint className="w-5 h-5 text-purple-400" />
                  <h4 className="text-white font-medium">{biometricType}</h4>
                </div>
                
                <p className="text-slate-400 text-sm mb-4">
                  Use {biometricType} to unlock your wallet and approve transactions.
                </p>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-white text-sm">Enable {biometricType}</span>
                  </div>
                  <Switch
                    checked={userSettings?.biometric?.enabled || false}
                    onCheckedChange={toggleBiometric}
                    disabled={settingUpBiometric}
                  />
                </div>

                {/* Additional Settings (shown only when enabled) */}
                {userSettings?.biometric?.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 mt-4"
                  >
                    {/* Auto-lock Timer */}
                    <div className="space-y-2">
                      <Label htmlFor="autoLock" className="text-slate-300">Auto-lock After</Label>
                      <p className="text-xs text-slate-500 mb-2">
                        Your wallet will lock after this time of inactivity
                      </p>
                      <select
                        id="autoLock"
                        value={userSettings?.biometric?.autoLockMinutes || 5}
                        onChange={(e) => updateAutoLock(parseInt(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="0">Never</option>
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes (Recommended)</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                      </select>
                    </div>

                    {/* Require for Transactions */}
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-white text-sm">Require for Transactions</p>
                        <p className="text-slate-500 text-xs">Ask for {biometricType} before sending</p>
                      </div>
                      <Switch
                        checked={userSettings?.biometric?.requireForTransactions || false}
                        onCheckedChange={toggleRequireForTransactions}
                      />
                    </div>

                    {/* Info */}
                    <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
                      <p className="text-blue-200 text-xs">
                        💡 Your biometric data is stored securely on your device and never leaves it.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            <Separator className="bg-slate-800" />
          </>
        )}

        {/* Password Protection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Password Protection</h3>
          
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-purple-400" />
              <h4 className="text-white font-medium">Sign-in Password</h4>
            </div>
            
            {userSettings?.usePassword ? (
              <div className="space-y-3">
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-3">
                  <p className="text-green-300 text-sm">✓ Password protection is enabled</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowPasswordForm(true)}
                    variant="outline"
                    className="flex-1 border-slate-700"
                  >
                    Change Password
                  </Button>
                  <Button 
                    onClick={removePassword}
                    variant="outline"
                    className="flex-1 border-red-900/30 text-red-400"
                  >
                    Remove Password
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-400 text-sm">
                  Add an extra layer of security by requiring a password to sign in.
                </p>
                <Button 
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Set Password
                </Button>
              </div>
            )}

            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-slate-700 space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                    placeholder="Enter password (min 8 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                    placeholder="Confirm password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={setPassword}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Save Password
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    variant="outline"
                    className="flex-1 border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Logs & Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Data & Logs</h3>
          
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-medium">App Logs</h4>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Download diagnostic logs for troubleshooting or backup purposes.
            </p>
            <Button 
              onClick={downloadLogs}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download App Logs
            </Button>
          </div>
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4"
        >
          <h4 className="text-blue-300 font-medium mb-2">🔒 Security Tips</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Never share your recovery phrase with anyone</li>
            <li>• Store your phrase offline in a safe location</li>
            <li>• Use a strong, unique password</li>
            <li>• Beware of phishing attempts</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}