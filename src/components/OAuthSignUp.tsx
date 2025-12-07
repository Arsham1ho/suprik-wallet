import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { createSupabaseClient } from '../utils/supabase/client';
import { generateMnemonic, deriveWalletId, SecureStorage, WalletStorage } from '../utils/wallet';
import { useWallet } from '../utils/WalletContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface OAuthSignUpProps {
  provider: 'google' | 'apple';
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

export function OAuthSignUp({ provider, onSuccess, onBack }: OAuthSignUpProps) {
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    handleOAuthSignUp();
  }, []);

  const handleOAuthSignUp = async () => {
    try {
      setStatus('Opening sign in window...');
      
      const supabase = createSupabaseClient();
      
      // Start OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        console.error('[OAuth] Sign in error:', error);
        toast.error(error.message || 'Failed to start OAuth flow');
        onBack();
        return;
      }

      // The user will be redirected to the OAuth provider
      // When they return, we'll handle it in the redirect handler
      setStatus('Waiting for authentication...');
      
      // Listen for OAuth callback
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[OAuth] Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          setStatus('Creating your wallet...');
          
          try {
            // Generate recovery phrase
            const seedPhrase = await generateMnemonic();
            const walletId = await deriveWalletId(seedPhrase);
            
            // Create a password from user's email + provider
            // This is needed for local encryption
            const autoPassword = `${session.user.email}_${provider}_${Date.now()}`;
            
            // Store encrypted mnemonic
            await SecureStorage.storeMnemonic(seedPhrase, autoPassword);
            WalletStorage.setWalletId(walletId);
            WalletStorage.setCurrentAccount(0);
            
            // Store OAuth password securely (encrypted with device fingerprint)
            await WalletStorage.setOAuthPassword(autoPassword);
            
            // Store OAuth info
            localStorage.setItem('saturn_oauth_provider', provider);
            localStorage.setItem('saturn_oauth_email', session.user.email || '');
            
            // Generate default username
            const emailPrefix = session.user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
            const defaultUsername = `@${emailPrefix}${walletId.substring(0, 4)}`;
            localStorage.setItem('saturn_username', defaultUsername);
            
            // Store encrypted recovery phrase in backend for export later
            setStatus('Securing your recovery phrase...');
            
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/oauth/store-phrase`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                userId: session.user.id,
                seedPhrase: seedPhrase,
                provider: provider,
                email: session.user.email,
              }),
            });

            if (!response.ok) {
              console.warn('[OAuth] Failed to store phrase in backend, but continuing...');
            }
            
            setStatus('Unlocking wallet...');
            
            // Unlock wallet
            const unlocked = await wallet.unlock(autoPassword);
            
            if (!unlocked) {
              throw new Error('Failed to unlock wallet after creation');
            }
            
            console.log('[OAuth] ✅ Wallet created and unlocked');
            console.log('[OAuth] Wallet ID:', walletId);
            console.log('[OAuth] Username:', defaultUsername);
            console.log('[OAuth] Provider:', provider);
            
            toast.success(`Welcome! Signed in with ${provider === 'google' ? 'Google' : 'Apple'}`);
            
            // Clean up subscription
            subscription.unsubscribe();
            
            onSuccess(session.access_token, walletId);
          } catch (error: any) {
            console.error('[OAuth] Wallet creation error:', error);
            toast.error(error.message || 'Failed to create wallet');
            
            // Sign out on error
            await supabase.auth.signOut();
            subscription.unsubscribe();
            onBack();
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[OAuth] User signed out or cancelled');
          subscription.unsubscribe();
          onBack();
        }
      });

    } catch (error: any) {
      console.error('[OAuth] Error:', error);
      toast.error(error.message || 'OAuth sign up failed');
      setLoading(false);
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full flex items-center justify-center">
      <motion.div 
        className="text-center space-y-6 px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Provider Logo */}
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
          {provider === 'google' ? (
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          ) : (
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
        </div>

        {/* Loading Spinner */}
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-500" />

        {/* Status Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {provider === 'google' ? 'Google' : 'Apple'} Sign Up
          </h2>
          <p className="text-slate-400">
            {status}
          </p>
        </div>

        {/* Info */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 max-w-md mx-auto">
          <p className="text-sm text-slate-400 leading-relaxed">
            We're creating a secure wallet for you. A recovery phrase will be automatically generated and saved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}