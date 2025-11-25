/**
 * Biometric Authentication Utility
 * Uses Web Authentication API (WebAuthn) for biometric authentication
 * Supports Touch ID, Face ID, Windows Hello, etc.
 */

export interface BiometricSettings {
  enabled: boolean;
  autoLockMinutes: number; // 0 = disabled, 1-60 minutes
  requireForTransactions: boolean;
  lastAuthTime?: number;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

/**
 * Check if biometric authentication is available on this device/browser
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      console.log('[Biometric] WebAuthn not supported');
      return false;
    }

    // Check if we're in a context that supports WebAuthn (not iframe, has proper permissions)
    if (window.self !== window.top) {
      console.log('[Biometric] Cannot use WebAuthn in iframe context');
      return false;
    }

    // Check if platform authenticator (biometric) is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('[Biometric] Platform authenticator available:', available);
    return available;
  } catch (error) {
    console.error('[Biometric] Error checking availability:', error);
    return false;
  }
}

/**
 * Register biometric credential for the wallet
 */
export async function registerBiometric(walletId: string): Promise<BiometricAuthResult> {
  try {
    console.log('[Biometric] Registering credential for wallet:', walletId);

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create credential options
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Saturn Wallet',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(walletId),
        name: walletId,
        displayName: 'Saturn Wallet User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create credential' };
    }

    // Store credential ID in localStorage (in production, this would be stored securely on server)
    const credentialId = Array.from(new Uint8Array(credential.rawId))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem(`biometric_credential_${walletId}`, credentialId);

    console.log('[Biometric] ✓ Registration successful');
    return { success: true };
  } catch (error: any) {
    console.error('[Biometric] Registration error:', error);
    
    if (error.name === 'NotAllowedError') {
      return { success: false, cancelled: true, error: 'Authentication cancelled' };
    }
    
    return { success: false, error: error.message || 'Registration failed' };
  }
}

/**
 * Authenticate using biometric
 */
export async function authenticateBiometric(walletId: string, reason?: string): Promise<BiometricAuthResult> {
  try {
    console.log('[Biometric] Authenticating for wallet:', walletId, 'Reason:', reason);

    // Check if credential exists
    const credentialId = localStorage.getItem(`biometric_credential_${walletId}`);
    if (!credentialId) {
      console.log('[Biometric] No credential found, need to register first');
      // Try to register if no credential exists
      return await registerBiometric(walletId);
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Convert credential ID back to array
    const credentialIdArray = new Uint8Array(
      credentialId.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Create authentication options
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: credentialIdArray,
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'required',
      timeout: 60000,
    };

    // Get credential (this will trigger biometric prompt)
    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Authentication failed' };
    }

    // Update last auth time
    localStorage.setItem(`biometric_last_auth_${walletId}`, Date.now().toString());

    console.log('[Biometric] ✓ Authentication successful');
    return { success: true };
  } catch (error: any) {
    console.error('[Biometric] Authentication error:', error);
    
    if (error.name === 'NotAllowedError') {
      return { success: false, cancelled: true, error: 'Authentication cancelled' };
    }
    
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

/**
 * Check if wallet is locked (based on auto-lock timer)
 */
export function isWalletLocked(walletId: string, autoLockMinutes: number): boolean {
  if (autoLockMinutes === 0) return false;

  const lastAuthTime = localStorage.getItem(`biometric_last_auth_${walletId}`);
  if (!lastAuthTime) return true;

  const minutesSinceAuth = (Date.now() - parseInt(lastAuthTime)) / 1000 / 60;
  const isLocked = minutesSinceAuth >= autoLockMinutes;
  
  console.log('[Biometric] Checking lock status:', {
    minutesSinceAuth: minutesSinceAuth.toFixed(2),
    autoLockMinutes,
    isLocked
  });
  
  return isLocked;
}

/**
 * Remove biometric credential
 */
export function removeBiometric(walletId: string): void {
  localStorage.removeItem(`biometric_credential_${walletId}`);
  localStorage.removeItem(`biometric_last_auth_${walletId}`);
  console.log('[Biometric] Credential removed for wallet:', walletId);
}

/**
 * Get biometric type name based on platform
 */
export function getBiometricTypeName(): string {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'Touch ID';
  } else if (platform.includes('win') || userAgent.includes('win')) {
    return 'Windows Hello';
  } else if (userAgent.includes('android')) {
    return 'Fingerprint';
  } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'Face ID / Touch ID';
  }
  
  return 'Biometric';
}