/**
 * Environment Variables Configuration
 *
 * Suprik Wallet reads API keys from environment variables
 * In development: from .env.local
 * In production: from Vercel Environment Variables
 *
 * User-provided API keys are encrypted before storage in localStorage
 */

// Encrypted API key storage keys
const ENCRYPTED_HELIUS_KEY = 'suprik_helius_encrypted';
const ENCRYPTED_ALCHEMY_KEY = 'suprik_alchemy_encrypted';
const ENCRYPTED_JUPITER_KEY = 'suprik_jupiter_encrypted';
const API_KEY_SECRET = 'suprik_api_secret';

/**
 * Get or create a random secret for encrypting API keys
 */
function getApiKeySecret(): string {
  let secret = localStorage.getItem(API_KEY_SECRET);
  if (!secret) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    secret = btoa(String.fromCharCode(...randomBytes));
    localStorage.setItem(API_KEY_SECRET, secret);
  }
  return secret;
}

/**
 * Encrypt an API key for storage
 */
async function encryptApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const secret = getApiKeySecret();

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // Lower for API keys (less sensitive than mnemonic)
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine salt, iv, and encrypted data
  const result = {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedData)))
  };

  return JSON.stringify(result);
}

/**
 * Decrypt an API key from storage
 */
async function decryptApiKey(encryptedJson: string): Promise<string | null> {
  try {
    const { salt, iv, data } = JSON.parse(encryptedJson);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const secret = localStorage.getItem(API_KEY_SECRET);

    if (!secret) return null;

    const saltArray = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
    const ivArray = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
    const encryptedArray = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedArray
    );

    return decoder.decode(decryptedData);
  } catch {
    return null;
  }
}

// In-memory cache for decrypted API keys (avoids async calls in sync functions)
let cachedHeliusKey: string | null = null;
let cachedAlchemyKey: string | null = null;
let cachedJupiterKey: string | null = null;

/**
 * Save an encrypted API key
 */
export async function saveEncryptedApiKey(type: 'helius' | 'alchemy' | 'jupiter', apiKey: string): Promise<void> {
  const encrypted = await encryptApiKey(apiKey);
  const storageKey = type === 'helius' ? ENCRYPTED_HELIUS_KEY : type === 'alchemy' ? ENCRYPTED_ALCHEMY_KEY : ENCRYPTED_JUPITER_KEY;
  localStorage.setItem(storageKey, encrypted);

  // Update in-memory cache
  if (type === 'helius') {
    cachedHeliusKey = apiKey;
  } else if (type === 'alchemy') {
    cachedAlchemyKey = apiKey;
  } else {
    cachedJupiterKey = apiKey;
    // Also update the Jupiter swap module
    const { setJupiterApiKey } = await import('./jupiterSwap');
    setJupiterApiKey(apiKey);
  }

  // Remove any legacy unencrypted keys for security
  if (type !== 'jupiter') {
    const legacyKey = type === 'helius' ? 'HELIUS_API_KEY' : 'ALCHEMY_API_KEY';
    localStorage.removeItem(legacyKey);
  }
}

/**
 * Get a decrypted API key
 */
export async function getEncryptedApiKey(type: 'helius' | 'alchemy' | 'jupiter'): Promise<string | null> {
  const storageKey = type === 'helius' ? ENCRYPTED_HELIUS_KEY : type === 'alchemy' ? ENCRYPTED_ALCHEMY_KEY : ENCRYPTED_JUPITER_KEY;
  const encrypted = localStorage.getItem(storageKey);

  if (encrypted) {
    return await decryptApiKey(encrypted);
  }

  // Fall back to legacy unencrypted storage (not for jupiter)
  if (type !== 'jupiter') {
    const legacyKey = type === 'helius' ? 'HELIUS_API_KEY' : 'ALCHEMY_API_KEY';
    return localStorage.getItem(legacyKey);
  }

  return null;
}

/**
 * Remove an API key
 */
export function removeApiKey(type: 'helius' | 'alchemy' | 'jupiter'): void {
  const storageKey = type === 'helius' ? ENCRYPTED_HELIUS_KEY : type === 'alchemy' ? ENCRYPTED_ALCHEMY_KEY : ENCRYPTED_JUPITER_KEY;
  localStorage.removeItem(storageKey);

  if (type !== 'jupiter') {
    const legacyKey = type === 'helius' ? 'HELIUS_API_KEY' : 'ALCHEMY_API_KEY';
    localStorage.removeItem(legacyKey);
  }

  // Clear cache
  if (type === 'helius') {
    cachedHeliusKey = null;
  } else if (type === 'alchemy') {
    cachedAlchemyKey = null;
  } else {
    cachedJupiterKey = null;
  }
}

/**
 * Get Helius API key from environment or encrypted storage
 */
export function getHeliusApiKey(): string | undefined {
  // Try Vite env variable first (local development)
  const viteKey = import.meta.env?.VITE_HELIUS_API_KEY;
  if (viteKey) return viteKey;

  // Fallback to window.ENV (server-side rendered)
  if (typeof window !== 'undefined') {
    const windowKey = (window as any).ENV?.HELIUS_API_KEY;
    if (windowKey) return windowKey;

    // Return cached decrypted key (populated by initializeApiKeys or saveEncryptedApiKey)
    if (cachedHeliusKey) return cachedHeliusKey;
  }

  return undefined;
}

/**
 * Get Alchemy API key from environment or encrypted storage
 */
export function getAlchemyApiKey(): string | undefined {
  // Try Vite env variable first (local development)
  const viteKey = import.meta.env?.VITE_ALCHEMY_API_KEY;
  if (viteKey) return viteKey;

  // Fallback to window.ENV (server-side rendered)
  if (typeof window !== 'undefined') {
    const windowKey = (window as any).ENV?.ALCHEMY_API_KEY;
    if (windowKey) return windowKey;

    // Return cached decrypted key (populated by initializeApiKeys or saveEncryptedApiKey)
    if (cachedAlchemyKey) return cachedAlchemyKey;
  }

  return undefined;
}

/**
 * Get Jupiter API key from environment or encrypted storage
 * Required for Jupiter Ultra API to work with referral fees
 * Get a free key from https://portal.jup.ag/api-keys
 */
export function getJupiterApiKey(): string | undefined {
  // Try Vite env variable first (local development)
  const viteKey = import.meta.env?.VITE_JUPITER_API_KEY;
  if (viteKey) return viteKey;

  // Fallback to window.ENV (server-side rendered)
  if (typeof window !== 'undefined') {
    const windowKey = (window as any).ENV?.JUPITER_API_KEY;
    if (windowKey) return windowKey;

    // Return cached decrypted key (populated by initializeApiKeys or saveEncryptedApiKey)
    if (cachedJupiterKey) return cachedJupiterKey;
  }

  return undefined;
}

/**
 * Helper to check if APIs are configured
 */
export function areApiKeysConfigured(): {
  helius: boolean;
  alchemy: boolean;
  jupiter: boolean;
  allConfigured: boolean;
} {
  const helius = !!getHeliusApiKey();
  const alchemy = !!getAlchemyApiKey();
  const jupiter = !!getJupiterApiKey();

  return {
    helius,
    alchemy,
    jupiter,
    allConfigured: helius && alchemy
  };
}

/**
 * Initialize API keys - must be called on app startup
 * Loads encrypted keys into cache and migrates any legacy unencrypted keys
 */
export async function initializeApiKeys(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Migrate legacy unencrypted keys to encrypted storage
  const legacyHelius = localStorage.getItem('HELIUS_API_KEY');
  const legacyAlchemy = localStorage.getItem('ALCHEMY_API_KEY');

  if (legacyHelius) {
    // Check if we already have an encrypted version
    const encryptedHelius = localStorage.getItem(ENCRYPTED_HELIUS_KEY);
    if (!encryptedHelius) {
      // Migrate: encrypt and store
      await saveEncryptedApiKey('helius', legacyHelius);
    } else {
      // Already migrated, just remove the legacy key
      localStorage.removeItem('HELIUS_API_KEY');
    }
  }

  if (legacyAlchemy) {
    const encryptedAlchemy = localStorage.getItem(ENCRYPTED_ALCHEMY_KEY);
    if (!encryptedAlchemy) {
      await saveEncryptedApiKey('alchemy', legacyAlchemy);
    } else {
      localStorage.removeItem('ALCHEMY_API_KEY');
    }
  }

  // Load encrypted keys into cache
  const heliusKey = await getEncryptedApiKey('helius');
  const alchemyKey = await getEncryptedApiKey('alchemy');
  const jupiterKey = await getEncryptedApiKey('jupiter');

  if (heliusKey) cachedHeliusKey = heliusKey;
  if (alchemyKey) cachedAlchemyKey = alchemyKey;
  if (jupiterKey) {
    cachedJupiterKey = jupiterKey;
    // Initialize Jupiter swap module with the API key
    const { setJupiterApiKey } = await import('./jupiterSwap');
    setJupiterApiKey(jupiterKey);
  }
}