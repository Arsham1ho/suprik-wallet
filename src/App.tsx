import { useState, useEffect, useRef } from 'react';
import { WelcomeAnimation } from './components/WelcomeAnimation';
import { WelcomePage } from './components/WelcomePage';
import { IntroVideo } from './components/IntroVideo';
import { AccountCreatedAnimation } from './components/AccountCreatedAnimation';
import { PageTransition } from './components/PageTransition';
import { Landing } from './components/Landing';
import { SignIn } from './components/SignIn';
import { SignInOptions } from './components/SignInOptions';
import { SignUp } from './components/SignUp';
import { SignUpOptions } from './components/SignUpOptions';
import { EmailSignIn } from './components/EmailSignIn';
import { OAuthSignUp } from './components/OAuthSignUp';
import { MainApp } from './components/MainApp';
import { BiometricLock } from './components/BiometricLock';
import { InstallPWA } from './components/mobile/InstallPWA';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from './utils/ThemeContext';
import { WalletProvider, useWallet } from './utils/WalletContext';
import { LanguageProvider } from './utils/i18n/LanguageContext';
import { NetworkProvider } from './utils/NetworkContext';
import { isWalletLocked, type BiometricSettings } from './utils/biometric';
import { getUserSettings } from './utils/userSettings';
import { initPWAInstall, registerServiceWorker } from './utils/mobile/pwa';
import { installPWAIconsToCache } from './utils/generatePWAIcons';
import { SecureStorage, WalletStorage } from './utils/wallet';
import { UnlockWallet } from './components/UnlockWallet';
import { UpdateNotification } from './components/UpdateNotification';
import { initializeEnvironment } from './utils/initEnv';
import { AccountManager } from './utils/accountManager';
import { preloadJupiterTokens } from './utils/jupiterTokens';

// Preload Jupiter tokens in background for faster search
preloadJupiterTokens();

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showWelcomePage, setShowWelcomePage] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showAccountCreated, setShowAccountCreated] = useState(false);
  const [showPageTransition, setShowPageTransition] = useState(false);
  const [nextPage, setNextPage] = useState<'signin-options' | 'signup-options' | null>(null);
  const [currentPage, setCurrentPage] = useState<'landing' | 'signin' | 'signin-options' | 'signin-email' | 'signup' | 'signup-options' | 'signup-email' | 'signup-oauth-google' | 'signup-oauth-apple' | 'unlock' | 'app'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [processingOAuth, setProcessingOAuth] = useState(false);

  // Cache for biometric check to prevent multiple calls
  const biometricCheckCache = useRef<{ [key: string]: Promise<void> }>({});

  // Initialize environment on mount
  useEffect(() => {
    initializeEnvironment().catch(() => {
      // Environment initialization failed silently
    });
  }, []);

  // Handle OAuth callback (Google/Apple Sign In)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if URL has OAuth callback params (hash-based)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const hasOAuthParams = hashParams.has('access_token') || 
                            searchParams.has('code') || 
                            searchParams.has('error');
      
      if (hasOAuthParams) {
        setProcessingOAuth(true);
        setShowWelcome(false);
        setShowWelcomePage(false);
        setShowIntroVideo(false);
        sessionStorage.setItem('hasSeenWelcome', 'true');
        sessionStorage.setItem('hasSeenWelcomePage', 'true');
        sessionStorage.setItem('hasSeenVideo', 'true');
        
        try {
          const { createSupabaseClient } = await import('./utils/supabase/client');
          const supabase = createSupabaseClient();

          // Check for OAuth errors first
          if (searchParams.has('error')) {
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');
            toast.error(`OAuth error: ${errorDescription || error}`);
            window.history.replaceState({}, document.title, window.location.pathname);
            setProcessingOAuth(false);
            return;
          }

          // Get the session (Supabase SDK will automatically parse URL params)
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (session && session.user) {
            // Check if wallet already exists for this user
            const socialWalletKey = `social_wallet_${session.user.id}`;
            const existingWalletId = localStorage.getItem(socialWalletKey);
            
            if (existingWalletId && SecureStorage.hasWallet()) {
              // User has existing wallet from social login - try to auto-unlock
              const storedPassword = await WalletStorage.getOAuthPassword();
              if (storedPassword) {
                WalletStorage.setWalletId(existingWalletId);
              }
              
              toast.success(`Welcome back, ${session.user.email}! 👋`);
              handleAuthSuccess(session.access_token, existingWalletId, false);
            } else {
              // New social login - need to create wallet
              // Import wallet utilities
              const { generateMnemonic } = await import('./utils/wallet');
              const mnemonic = await generateMnemonic();
              // Generate cryptographically secure wallet ID
              const walletIdBytes = crypto.getRandomValues(new Uint8Array(16));
              const walletId = `wallet_${Array.from(walletIdBytes, b => b.toString(16).padStart(2, '0')).join('')}`;

              // Generate cryptographically secure random password for OAuth users
              const randomBytes = crypto.getRandomValues(new Uint8Array(32));
              const defaultPassword = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
              
              // Store the wallet with encryption using the default password
              await SecureStorage.storeMnemonic(mnemonic, defaultPassword);
              
              // Store OAuth password for seamless re-authentication (encrypted with device fingerprint)
              await WalletStorage.setOAuthPassword(defaultPassword);
              
              // Store the default password hint (NOT the actual password)
              localStorage.setItem(`${walletId}_password_hint`, 'oauth_login');
              
              // Link social account to wallet
              localStorage.setItem(socialWalletKey, walletId);
              localStorage.setItem(`${walletId}_auth_method`, 'social');
              localStorage.setItem(`${walletId}_social_provider`, session.user.app_metadata.provider || 'unknown');
              localStorage.setItem(`${walletId}_social_email`, session.user.email || '');
              
              // Store wallet ID
              WalletStorage.setWalletId(walletId);
              
              toast.success(`Account created! Welcome to Suprik! 🚀`);
              handleAuthSuccess(session.access_token, walletId, true);
            }
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            toast.error('Authentication failed. Please try again.');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error: any) {
          toast.error(`Authentication error: ${error.message}`);
          // Clean up URL even on error
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setProcessingOAuth(false);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Initialize PWA on mount
  useEffect(() => {
    initPWAInstall();
    registerServiceWorker().catch(() => {
      // Silently handle SW errors - app works fine without it
    });
  }, []);

  useEffect(() => {
    // Check if user has seen the onboarding flow in this session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    const hasSeenWelcomePage = sessionStorage.getItem('hasSeenWelcomePage');
    const hasSeenVideo = sessionStorage.getItem('hasSeenVideo');
    
    if (hasSeenWelcome && hasSeenWelcomePage && hasSeenVideo) {
      // User has completed full onboarding
      setShowWelcome(false);
      setShowWelcomePage(false);
      setShowIntroVideo(false);
    } else if (hasSeenWelcome && hasSeenWelcomePage) {
      // Show video next
      setShowWelcome(false);
      setShowWelcomePage(false);
      setShowIntroVideo(true);
    } else if (hasSeenWelcome) {
      // Show welcome page next
      setShowWelcome(false);
      setShowWelcomePage(true);
      setShowIntroVideo(false);
    }

    // Check if wallet exists in localStorage (new client-side architecture)
    const hasWallet = SecureStorage.hasWallet();
    const savedWalletId = WalletStorage.getWalletId();
    
    if (hasWallet && savedWalletId) {
      // Check for wallet format migration
      SecureStorage.migrateIfNeeded().then(migrated => {
        if (!migrated) {
          toast.info('Please re-import your recovery phrase to update wallet format');
        }
      });
      
      setWalletId(savedWalletId);
      setNeedsUnlock(true);
      setCurrentPage('unlock');
      // Skip all onboarding if wallet exists
      setShowWelcome(false);
      setShowWelcomePage(false);
      setShowIntroVideo(false);
      sessionStorage.setItem('hasSeenWelcome', 'true');
      sessionStorage.setItem('hasSeenWelcomePage', 'true');
      sessionStorage.setItem('hasSeenVideo', 'true');
      setCheckingLock(false);
    } else {
      // Check legacy wallet_id for backward compatibility
      const legacyWalletId = localStorage.getItem('wallet_id');
      if (legacyWalletId) {
        setWalletId(legacyWalletId);
        setIsAuthenticated(true);
        checkBiometricLock(legacyWalletId);
        setShowWelcome(false);
        setShowWelcomePage(false);
        setShowIntroVideo(false);
        sessionStorage.setItem('hasSeenWelcome', 'true');
        sessionStorage.setItem('hasSeenWelcomePage', 'true');
        sessionStorage.setItem('hasSeenVideo', 'true');
      } else {
        setCheckingLock(false);
      }
    }
  }, []);

  // Check if app should be locked on visibility change (tab switch, app background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && walletId && biometricSettings?.enabled) {
        // Re-check lock status when app becomes visible
        const locked = isWalletLocked(walletId, biometricSettings.autoLockMinutes);
        setIsLocked(locked);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [walletId, biometricSettings]);

  // Listen for wallet session lost event (when in-memory session is cleared)
  useEffect(() => {
    const handleSessionLost = () => {
      console.log('[App] 🔒 Wallet session lost event received - showing unlock screen');
      toast.error('Session expired. Please unlock your wallet.');
      setNeedsUnlock(true);
      setIsAuthenticated(false);
      setCurrentPage('unlock');
    };

    window.addEventListener('walletSessionLost', handleSessionLost);
    return () => window.removeEventListener('walletSessionLost', handleSessionLost);
  }, []);

  const checkBiometricLock = async (wId: string) => {
    try {
      setCheckingLock(true);
      
      // Check if biometric is available first
      const { isBiometricAvailable } = await import('./utils/biometric');
      const available = await isBiometricAvailable();
      
      if (!available) {
        setIsLocked(false);
        setBiometricSettings(null);
        setCheckingLock(false);
        return;
      }
      
      // Load settings from localStorage (instant, no server call)
      const settings = getUserSettings(wId);

      // Build biometric settings object from localStorage data
      const biometric: BiometricSettings | null = settings.biometricEnabled ? {
        enabled: true,
        autoLockMinutes: settings.autoLockMinutes || 5,
        requireForTransactions: true,
      } : null;

      setBiometricSettings(biometric);

      if (biometric?.enabled && biometric.autoLockMinutes > 0) {
        const locked = isWalletLocked(wId, biometric.autoLockMinutes);
        setIsLocked(locked);
      } else {
        setIsLocked(false);
      }
    } catch {
      // Default to unlocked - app should always be accessible
      setIsLocked(false);
      setBiometricSettings(null);
    } finally {
      setCheckingLock(false);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    if (needsUnlock) {
      // User unlocked wallet from unlock screen
      setNeedsUnlock(false);
      setIsAuthenticated(true);
      setCurrentPage('app');
    }
  };

  const handleAuthSuccess = (token: string, wId: string, isNewAccount: boolean = false) => {
    // Note: In new architecture, token is walletId and authentication happens client-side
    // No need to store wallet_id separately as WalletStorage handles it
    setWalletId(wId);
    setIsAuthenticated(true);
    
    if (isNewAccount) {
      // Show account created animation for new accounts
      setShowAccountCreated(true);
    } else {
      // Go directly to app for sign in
      setCurrentPage('app');
    }
  };

  const handleAccountCreatedComplete = () => {
    setShowAccountCreated(false);
    setCurrentPage('app');
  };

  const handleSignOut = () => {
    // Clear all wallet data
    WalletStorage.clear();
    localStorage.removeItem('wallet_id'); // Clear legacy key too
    sessionStorage.removeItem('hasSeenWelcome'); // Reset welcome animation
    sessionStorage.removeItem('hasSeenWelcomePage'); // Reset welcome page
    sessionStorage.removeItem('hasSeenVideo'); // Reset intro video
    setWalletId(null);
    setIsAuthenticated(false);
    setNeedsUnlock(false);
    setCurrentPage('landing');
    setShowWelcome(true); // Show welcome animation on next visit
    setShowWelcomePage(false);
    setShowIntroVideo(false);
  };

  const handleLockWallet = () => {
    // Don't clear wallet data, just set to locked state
    setNeedsUnlock(true);
    setIsAuthenticated(false);
    setCurrentPage('unlock');
    toast.success('Wallet locked');
  };

  const handleSwitchAccount = (newAccountId: string) => {
    // Update active account in AccountManager
    AccountManager.setActiveAccount(newAccountId);

    // Update walletId in localStorage and state
    localStorage.setItem('wallet_id', newAccountId);
    setWalletId(newAccountId);

    // Trigger a wallet context refresh by dispatching event
    window.dispatchEvent(new CustomEvent('accountSwitched', { detail: { accountId: newAccountId } }));
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setShowWelcomePage(true);
    sessionStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleWelcomePageContinue = () => {
    setShowWelcomePage(false);
    setShowIntroVideo(true);
    sessionStorage.setItem('hasSeenWelcomePage', 'true');
  };

  const handleIntroVideoComplete = () => {
    setShowIntroVideo(false);
    sessionStorage.setItem('hasSeenVideo', 'true');
  };

  const handlePageTransitionComplete = () => {
    setShowPageTransition(false);
    if (nextPage) {
      setCurrentPage(nextPage);
      setNextPage(null);
    }
  };

  return (
    <ThemeProvider walletId={walletId || undefined}>
      <WalletProvider walletId={walletId || undefined}>
        <LanguageProvider walletId={walletId}>
          <NetworkProvider>
            <div className="wallet-outer">
              <div className="wallet-container">
                {showWelcome ? (
                  <WelcomeAnimation onComplete={handleWelcomeComplete} />
                ) : showWelcomePage ? (
                  <WelcomePage onContinue={handleWelcomePageContinue} />
                ) : showIntroVideo ? (
                  <IntroVideo onComplete={handleIntroVideoComplete} />
                ) : showAccountCreated ? (
                  <AccountCreatedAnimation onComplete={handleAccountCreatedComplete} />
                ) : showPageTransition ? (
                  <PageTransition onComplete={handlePageTransitionComplete} />
                ) : processingOAuth ? (
                  <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-theme-accent"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-theme-accent" style={{ opacity: 0.3 }}></div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-medium">Setting up your wallet...</p>
                      <p className="text-slate-400 text-sm">This will only take a moment</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentPage === 'landing' && (
                      <Landing 
                        onCreateWallet={() => {
                          setNextPage('signup-options');
                          setShowPageTransition(true);
                        }}
                        onImportWallet={() => {
                          setNextPage('signin-options');
                          setShowPageTransition(true);
                        }}
                      />
                    )}
                    
                    {/* Sign In Flow */}
                    {currentPage === 'signin-options' && (
                      <SignInOptions 
                        onSelectRecoveryPhrase={() => setCurrentPage('signin')}
                        onSelectEmail={() => setCurrentPage('signin-email')}
                        onBack={() => setCurrentPage('landing')}
                      />
                    )}
                    
                    {currentPage === 'signin' && (
                      <SignIn 
                        onSuccess={(token, wId) => handleAuthSuccess(token, wId, false)}
                        onBack={() => setCurrentPage('signin-options')}
                      />
                    )}
                    
                    {currentPage === 'signin-email' && (
                      <EmailSignIn 
                        isSignUp={false}
                        onSuccess={(token, wId) => handleAuthSuccess(token, wId, false)}
                        onBack={() => setCurrentPage('signin-options')}
                      />
                    )}
                    
                    {/* Sign Up Flow */}
                    {currentPage === 'signup-options' && (
                      <SignUpOptions 
                        onSelectRecoveryPhrase={() => setCurrentPage('signup')}
                        onSelectEmail={() => setCurrentPage('signup-email')}
                        onSelectGoogle={() => setCurrentPage('signup-oauth-google')}
                        onSelectApple={() => setCurrentPage('signup-oauth-apple')}
                        onBack={() => setCurrentPage('landing')}
                      />
                    )}
                    
                    {currentPage === 'signup' && (
                      <SignUp 
                        onSuccess={(token, wId) => handleAuthSuccess(token, wId, true)}
                        onBack={() => setCurrentPage('signup-options')}
                      />
                    )}
                    
                    {currentPage === 'signup-email' && (
                      <EmailSignIn 
                        isSignUp={true}
                        onSuccess={(token, wId) => handleAuthSuccess(token, wId, true)}
                        onBack={() => setCurrentPage('signup-options')}
                      />
                    )}
                    
                    {/* OAuth Sign Up Screens */}
                    {currentPage === 'signup-oauth-google' && (
                      <OAuthSignUp 
                        provider="google"
                        onSuccess={(token, wId) => handleAuthSuccess(token, wId, true)}
                        onBack={() => setCurrentPage('signup-options')}
                      />
                    )}
                    
                    {currentPage === 'signup-oauth-apple' && (
                      <OAuthSignUp 
                        provider="apple"
                        onSuccess={(token, wId) => handleAuthSuccess(token, wId, true)}
                        onBack={() => setCurrentPage('signup-options')}
                      />
                    )}
                    
                    {/* Unlock Screen - for existing wallet */}
                    {currentPage === 'unlock' && needsUnlock && walletId && (
                      <UnlockWallet 
                        walletId={walletId}
                        onUnlock={handleUnlock}
                        onSignOut={handleSignOut}
                      />
                    )}
                    
                    {currentPage === 'app' && isAuthenticated && walletId && (
                      <>
                        {checkingLock ? (
                          <div
                            className="bg-black z-50"
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              width: '100vw',
                              height: '100dvh',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
                          </div>
                        ) : isLocked ? (
                          <BiometricLock walletId={walletId} onUnlock={handleUnlock} />
                        ) : (
                          <MainApp 
                            accessToken={walletId}
                            onSignOut={handleSignOut}
                            onLockWallet={handleLockWallet}
                            onSwitchAccount={handleSwitchAccount}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                
                <InstallPWA />
                <UpdateNotification />
                <Toaster theme="dark" />
              </div>
            </div>
          </NetworkProvider>
        </LanguageProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}