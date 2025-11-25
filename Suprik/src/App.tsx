import React, { useState, useEffect, useRef } from 'react';
import { WelcomeAnimation } from './components/WelcomeAnimation';
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
import { toast } from 'sonner@2.0.3';
import { ThemeProvider } from './utils/ThemeContext';
import { WalletProvider } from './utils/WalletContext';
import { LanguageProvider } from './utils/i18n/LanguageContext';
import { NetworkProvider } from './utils/NetworkContext';
import { isWalletLocked, type BiometricSettings } from './utils/biometric';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { initPWAInstall, registerServiceWorker } from './utils/mobile/pwa';
import { installPWAIconsToCache } from './utils/generatePWAIcons';
import { SecureStorage, WalletStorage } from './utils/wallet';
import { UnlockWallet } from './components/UnlockWallet';
import { initializeEnvironment } from './utils/initEnv';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
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

  // Initialize environment variables on mount
  useEffect(() => {
    console.log('[App] 🔧 Initializing environment...');
    initializeEnvironment().catch((error) => {
      console.error('[App] ❌ Failed to initialize environment:', error);
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
        console.log('[App] 🔐 Detected OAuth callback, processing...');
        setProcessingOAuth(true);
        setShowWelcome(false);
        sessionStorage.setItem('hasSeenWelcome', 'true');
        
        try {
          const { createSupabaseClient } = await import('./utils/supabase/client');
          const supabase = createSupabaseClient();

          // Check for OAuth errors first
          if (searchParams.has('error')) {
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');
            console.error('[App] ❌ OAuth error:', error, errorDescription);
            toast.error(`OAuth error: ${errorDescription || error}`);
            window.history.replaceState({}, document.title, window.location.pathname);
            setProcessingOAuth(false);
            return;
          }

          // Get the session (Supabase SDK will automatically parse URL params)
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[App] ❌ Error getting session:', error);
            throw error;
          }
          
          if (session && session.user) {
            console.log('[App] ✅ OAuth session established:', session.user.email);
            console.log('[App] 📋 User ID:', session.user.id);
            console.log('[App] 🔑 Provider:', session.user.app_metadata.provider);
            
            // Check if wallet already exists for this user
            const socialWalletKey = `social_wallet_${session.user.id}`;
            const existingWalletId = localStorage.getItem(socialWalletKey);
            
            if (existingWalletId && SecureStorage.hasWallet()) {
              // User has existing wallet from social login
              console.log('[App] 📱 Existing social wallet found:', existingWalletId);
              
              // Try to auto-unlock with stored OAuth password
              const storedPassword = await WalletStorage.getOAuthPassword();
              if (storedPassword) {
                console.log('[App] 🔓 Auto-unlocking OAuth wallet...');
                // We'll set walletId and let the unlock screen or context handle it
                WalletStorage.setWalletId(existingWalletId);
              }
              
              toast.success(`Welcome back, ${session.user.email}! 👋`);
              handleAuthSuccess(session.access_token, existingWalletId, false);
            } else {
              // New social login - need to create wallet
              console.log('[App] 🆕 Creating new wallet for social login');
              
              // Import wallet utilities
              const { generateMnemonic } = await import('./utils/wallet');
              const mnemonic = await generateMnemonic();
              const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              console.log('[App] 💼 Wallet ID:', walletId);
              
              // Create a default password for OAuth users (derived from user ID)
              // This is secure because the user ID is unique and stored securely by Supabase
              const defaultPassword = `oauth_${session.user.id}_${session.user.email}`;
              
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
            console.log('[App] ⚠️ No session found after OAuth callback');
            toast.error('Authentication failed. Please try again.');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error: any) {
          console.error('[App] ❌ OAuth callback error:', error);
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
    console.log('[App] Initializing PWA...');
    initPWAInstall();
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('[App] ✓ Service Worker registered successfully');
      } else {
        console.log('[App] ℹ️ Service Worker not available (this is OK in development)');
      }
    }).catch((error) => {
      // Silently handle SW errors - app works fine without it
      console.log('[App] ℹ️ PWA features unavailable (app will work normally)');
    });
  }, []);

  useEffect(() => {
    // Check if user has seen welcome animation in this session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }

    // Check if wallet exists in localStorage (new client-side architecture)
    const hasWallet = SecureStorage.hasWallet();
    const savedWalletId = WalletStorage.getWalletId();
    
    if (hasWallet && savedWalletId) {
      console.log('[App] 🔐 Wallet found in localStorage, needs unlock');
      setWalletId(savedWalletId);
      setNeedsUnlock(true);
      setCurrentPage('unlock');
      // Skip welcome animation if wallet exists
      setShowWelcome(false);
      sessionStorage.setItem('hasSeenWelcome', 'true');
      setCheckingLock(false);
    } else {
      // Check legacy wallet_id for backward compatibility
      const legacyWalletId = localStorage.getItem('wallet_id');
      if (legacyWalletId) {
        console.log('[App] ⚠️ Found legacy wallet, migrating...');
        setWalletId(legacyWalletId);
        setIsAuthenticated(true);
        checkBiometricLock(legacyWalletId);
        setShowWelcome(false);
        sessionStorage.setItem('hasSeenWelcome', 'true');
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

  const checkBiometricLock = async (wId: string, retryCount = 0) => {
    try {
      setCheckingLock(true);
      
      // Check if biometric is available first
      const { isBiometricAvailable } = await import('./utils/biometric');
      const available = await isBiometricAvailable();
      
      if (!available) {
        console.log('[App] Biometric not available on this device, skipping lock check');
        setIsLocked(false);
        setBiometricSettings(null);
        setCheckingLock(false);
        return;
      }
      
      // Shorter timeout for faster fallback (5 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Fetch user settings to check if biometric is enabled
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/user-settings/${wId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const settings = await response.json();
        const biometric = settings.biometric as BiometricSettings | undefined;
        setBiometricSettings(biometric || null);

        if (biometric?.enabled && biometric.autoLockMinutes > 0) {
          const locked = isWalletLocked(wId, biometric.autoLockMinutes);
          setIsLocked(locked);
          console.log('[App] Wallet lock status:', locked);
        } else {
          setIsLocked(false);
        }
      } else {
        // Non-ok response means settings don't exist or error - default to unlocked
        setIsLocked(false);
        setBiometricSettings(null);
      }
    } catch (error: any) {
      // Suppress AbortError logs - they're expected from timeouts
      if (error.name !== 'AbortError') {
        console.error('[App] Error checking biometric lock:', error);
      }
      
      // Only retry once for AbortError (timeout), don't retry for other errors
      if (retryCount === 0 && error.name === 'AbortError') {
        console.log('[App] Timeout on first attempt, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkBiometricLock(wId, 1);
      }
      
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
    setWalletId(null);
    setIsAuthenticated(false);
    setNeedsUnlock(false);
    setCurrentPage('landing');
    setShowWelcome(true); // Show welcome animation on next visit
  };

  const handleSwitchAccount = (newWalletId: string) => {
    localStorage.setItem('wallet_id', newWalletId);
    setWalletId(newWalletId);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    sessionStorage.setItem('hasSeenWelcome', 'true');
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
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
              <div className="w-full max-w-[430px] min-h-screen bg-black shadow-2xl relative overflow-hidden">
                {showWelcome ? (
                  <WelcomeAnimation onComplete={handleWelcomeComplete} />
                ) : showAccountCreated ? (
                  <AccountCreatedAnimation onComplete={handleAccountCreatedComplete} />
                ) : showPageTransition ? (
                  <PageTransition onComplete={handlePageTransitionComplete} />
                ) : processingOAuth ? (
                  <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-purple-500/30"></div>
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
                          <div className="min-h-screen bg-black flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                          </div>
                        ) : isLocked ? (
                          <BiometricLock walletId={walletId} onUnlock={handleUnlock} />
                        ) : (
                          <MainApp 
                            accessToken={walletId}
                            onSignOut={handleSignOut}
                            onSwitchAccount={handleSwitchAccount}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                
                <InstallPWA />
                <Toaster theme="dark" />
              </div>
            </div>
          </NetworkProvider>
        </LanguageProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}