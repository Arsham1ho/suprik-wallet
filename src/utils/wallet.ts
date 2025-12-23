import * as bip39 from '@scure/bip39';
import { englishWordlist } from './wordlist';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

/**
 * Securely clear sensitive data from memory
 * Overwrites the data with random bytes before releasing
 * This helps prevent memory dump attacks
 */
export function secureClear(data: Uint8Array | string | null | undefined): void {
  if (!data) return;

  if (data instanceof Uint8Array) {
    // Overwrite with random bytes
    crypto.getRandomValues(data);
    // Then zero out
    data.fill(0);
  } else if (typeof data === 'string') {
    // Strings are immutable in JS, but we can try to minimize exposure
    // by creating a new reference (the old one will be garbage collected)
    // This is a best-effort approach since JS doesn't allow direct memory manipulation
    // For truly sensitive data, always use Uint8Array instead of strings
  }
}

/**
 * Create a secure string wrapper that can be cleared
 * Use this for sensitive data that needs to be cleared from memory
 */
export class SecureString {
  private data: Uint8Array;
  private cleared = false;

  constructor(value: string) {
    const encoder = new TextEncoder();
    this.data = encoder.encode(value);
  }

  toString(): string {
    if (this.cleared) {
      throw new Error('SecureString has been cleared');
    }
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  clear(): void {
    if (!this.cleared) {
      secureClear(this.data);
      this.cleared = true;
    }
  }

  isCleared(): boolean {
    return this.cleared;
  }
}

/**
 * Secure storage for encrypted mnemonic
 * Uses CryptoJS for encryption (compatible with web3/walletManager)
 */
export class SecureStorage {
  private static STORAGE_KEY = 'saturn_encrypted_wallet';

  /**
   * Encrypt and store mnemonic
   */
  static async storeMnemonic(mnemonic: string, password: string): Promise<void> {
    try {
      
      const encoder = new TextEncoder();
      const data = encoder.encode(mnemonic);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from password using PBKDF2
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 600000, // OWASP 2023 recommended minimum
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Encrypt the mnemonic
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(encryptedData);
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
      const saltBase64 = btoa(String.fromCharCode(...salt));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      // Store as JSON with salt, iv, and encrypted data
      const encryptedWallet = {
        encrypted: encryptedBase64,
        salt: saltBase64,
        iv: ivBase64,
        version: 2 // Mark as Web Crypto API version
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedWallet));
    } catch (error) {
      throw new Error('Failed to encrypt mnemonic');
    }
  }

  /**
   * Retrieve and decrypt mnemonic
   */
  static async retrieveMnemonic(password: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      // Parse stored wallet data
      const encryptedWallet = JSON.parse(stored);

      if (!encryptedWallet.encrypted || !encryptedWallet.salt || !encryptedWallet.iv) {
        return null;
      }
      
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decode from base64
      const encryptedArray = new Uint8Array(
        atob(encryptedWallet.encrypted).split('').map(c => c.charCodeAt(0))
      );
      const salt = new Uint8Array(
        atob(encryptedWallet.salt).split('').map(c => c.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedWallet.iv).split('').map(c => c.charCodeAt(0))
      );
      
      // Derive key from password
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 600000, // OWASP 2023 recommended minimum
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedArray
      );

      // Convert to Uint8Array so we can clear it after use
      const decryptedArray = new Uint8Array(decryptedData);
      const mnemonic = decoder.decode(decryptedArray);

      // Clear the decrypted buffer from memory
      secureClear(decryptedArray);

      if (!mnemonic) {
        return null;
      }

      return mnemonic;
    } catch {
      // Decryption failed - likely wrong password or corrupted data
      return null;
    }
  }

  /**
   * Check if wallet exists
   */
  static hasWallet(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Delete stored wallet
   */
  static deleteWallet(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * Migrate old wallet format to new format if needed
   */
  static async migrateIfNeeded(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(stored);
        if (parsed.encrypted && parsed.salt && parsed.iv) {
          // Version 2 is current, older versions still work
          return true;
        }
      } catch {
        // Not JSON, definitely old format - needs re-import
        return false;
      }

      return false;
    } catch {
      return false;
    }
  }
}

/**
 * Simple storage (unencrypted) - for walletId only
 * Mnemonic should ALWAYS be encrypted
 */
export class WalletStorage {
  private static WALLET_ID_KEY = 'saturn_wallet_id';
  private static CURRENT_ACCOUNT_KEY = 'saturn_current_account';
  private static OAUTH_PASSWORD_KEY = 'saturn_oauth_password'; // Encrypted OAuth password
  private static DEVICE_SECRET_KEY = 'saturn_device_secret'; // Random device-specific secret
  private static PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommended minimum

  static setWalletId(walletId: string): void {
    localStorage.setItem(this.WALLET_ID_KEY, walletId);
  }

  static getWalletId(): string | null {
    return localStorage.getItem(this.WALLET_ID_KEY);
  }

  static setCurrentAccount(accountIndex: number): void {
    localStorage.setItem(this.CURRENT_ACCOUNT_KEY, accountIndex.toString());
  }

  static getCurrentAccount(): number {
    const stored = localStorage.getItem(this.CURRENT_ACCOUNT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Get or create a device-specific random secret
   * This secret is unique per device/browser and cannot be predicted
   */
  private static getOrCreateDeviceSecret(): string {
    let secret = localStorage.getItem(this.DEVICE_SECRET_KEY);
    if (!secret) {
      // Generate a cryptographically secure random secret (32 bytes = 256 bits)
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      secret = btoa(String.fromCharCode(...randomBytes));
      localStorage.setItem(this.DEVICE_SECRET_KEY, secret);
    }
    return secret;
  }

  /**
   * Store OAuth password with proper encryption
   * Uses: Device-specific random secret + PBKDF2 key derivation + AES-256-GCM
   * This allows seamless OAuth re-authentication on the same device
   */
  static async setOAuthPassword(password: string): Promise<void> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);

      // Get device-specific random secret (not predictable like browser fingerprint)
      const deviceSecret = this.getOrCreateDeviceSecret();

      // Generate random salt for PBKDF2
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Derive key using PBKDF2 (same security as seed phrase encryption)
      const secretBuffer = encoder.encode(deviceSecret);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        secretBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Encrypt password with AES-256-GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Store as JSON with salt, IV, and encrypted data
      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
      const saltBase64 = btoa(String.fromCharCode(...salt));
      const ivBase64 = btoa(String.fromCharCode(...iv));

      const stored = JSON.stringify({
        encrypted: encryptedBase64,
        salt: saltBase64,
        iv: ivBase64,
        version: 2 // Mark as secure version
      });

      localStorage.setItem(this.OAUTH_PASSWORD_KEY, stored);
    } catch {
      // Silently fail - OAuth password storage is a convenience feature
    }
  }

  /**
   * Retrieve OAuth password (if available and on same device)
   * Will fail if device secret doesn't exist (different device)
   */
  static async getOAuthPassword(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.OAUTH_PASSWORD_KEY);
      if (!stored) return null;

      // Get device secret - if it doesn't exist, we can't decrypt
      const deviceSecret = localStorage.getItem(this.DEVICE_SECRET_KEY);
      if (!deviceSecret) {
        // Different device or secret was cleared
        this.clearOAuthPassword();
        return null;
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Parse stored data
      let parsedData;
      try {
        parsedData = JSON.parse(stored);
      } catch {
        // Old format - clear and return null
        this.clearOAuthPassword();
        return null;
      }

      // Check version - old version needs migration
      if (!parsedData.version || parsedData.version < 2) {
        this.clearOAuthPassword();
        return null;
      }

      const { encrypted, salt, iv } = parsedData;

      // Decode from base64
      const encryptedArray = new Uint8Array(
        atob(encrypted).split('').map(c => c.charCodeAt(0))
      );
      const saltArray = new Uint8Array(
        atob(salt).split('').map(c => c.charCodeAt(0))
      );
      const ivArray = new Uint8Array(
        atob(iv).split('').map(c => c.charCodeAt(0))
      );

      // Derive key using PBKDF2
      const secretBuffer = encoder.encode(deviceSecret);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        secretBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltArray,
          iterations: this.PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivArray },
        key,
        encryptedArray
      );

      // Convert to Uint8Array so we can clear it after use
      const decryptedArray = new Uint8Array(decryptedData);
      const result = decoder.decode(decryptedArray);

      // Clear the decrypted buffer from memory
      secureClear(decryptedArray);

      return result;
    } catch {
      // Decryption failed - clear invalid data
      this.clearOAuthPassword();
      return null;
    }
  }

  static clearOAuthPassword(): void {
    localStorage.removeItem(this.OAUTH_PASSWORD_KEY);
    // Note: We don't clear DEVICE_SECRET_KEY as it may be used by other features
  }

  static clear(): void {
    localStorage.removeItem(this.WALLET_ID_KEY);
    localStorage.removeItem(this.CURRENT_ACCOUNT_KEY);
    localStorage.removeItem(this.DEVICE_SECRET_KEY); // Clear device secret on full clear
    this.clearOAuthPassword();
    SecureStorage.deleteWallet();
  }
}

/**
 * Account info (derived from mnemonic)
 */
export interface DerivedAccount {
  index: number;
  name: string;
  solanaAddress: string;
  ethereumAddress: string;
  bitcoinAddress?: string;
}

/**
 * Derive blockchain addresses from mnemonic
 * This function uses dynamic imports to load crypto libraries only when needed
 */
export async function deriveAddresses(
  mnemonic: string,
  accountIndex: number = 0
): Promise<{
  solana: string;
  ethereum: string;
  bitcoin: string;
  base: string;
  polygon: string;
  sui: string;
}> {
  try {
    // Dynamic imports for crypto libraries
    const bip32 = await import('@scure/bip32');
    const naclModule = await import('tweetnacl');
    const nacl = naclModule.default;
    const bs58Module = await import('bs58');
    const bs58 = bs58Module.default;
    const sha3 = await import('@noble/hashes/sha3');
    const { HDKey } = await import('micro-ed25519-hdkey');

    // Convert mnemonic to seed (64 bytes)
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');

    // Derive Solana address using micro-ed25519-hdkey (SLIP-0010, same as Phantom)
    // Path: m/44'/501'/accountIndex'/0'
    const solanaPath = `m/44'/501'/${accountIndex}'/0'`;

    const solanaHdKey = HDKey.fromMasterSeed(seed);
    const solanaDerived = solanaHdKey.derive(solanaPath);

    if (!solanaDerived.privateKey) {
      throw new Error('Failed to derive Solana private key');
    }

    // The derived private key is a 32-byte Ed25519 seed
    const solanaKeypair = nacl.sign.keyPair.fromSeed(solanaDerived.privateKey);
    const solanaAddress = bs58.encode(solanaKeypair.publicKey);
    
    // Derive Ethereum address (BIP44: m/44'/60'/0'/0/accountIndex)
    const ethPath = `m/44'/60'/0'/0/${accountIndex}`;
    const ethHdKey = bip32.HDKey.fromMasterSeed(seed);
    const ethAccount = ethHdKey.derive(ethPath);
    if (!ethAccount.publicKey) {
      throw new Error('Failed to derive Ethereum public key');
    }
    
    // Get Ethereum address from public key
    const publicKeyBytes = ethAccount.publicKey.slice(1); // Remove 0x04 prefix
    const hash = sha3.keccak_256(publicKeyBytes);
    const ethereumAddress = '0x' + Array.from(hash.slice(-20))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Base and Polygon use same address as Ethereum (EVM chains)
    const baseAddress = ethereumAddress;
    const polygonAddress = ethereumAddress;
    
    // Derive Bitcoin address (BIP44: m/44'/0'/0'/0/accountIndex)
    const btcPath = `m/44'/0'/0'/0/${accountIndex}`;
    const btcHdKey = bip32.HDKey.fromMasterSeed(seed);
    const btcAccount = btcHdKey.derive(btcPath);
    
    // Bitcoin address generation (P2WPKH - Native SegWit)
    let bitcoinAddress = '';
    if (btcAccount.publicKey) {
      try {
        const { sha256 } = await import('@noble/hashes/sha256');
        const { ripemd160 } = await import('@noble/hashes/ripemd160');
        
        // Compress the public key (33 bytes)
        const x = btcAccount.publicKey.slice(1, 33);
        const y = btcAccount.publicKey.slice(33, 65);
        const prefix = y[31] % 2 === 0 ? 0x02 : 0x03;
        const compressedPubKey = new Uint8Array([prefix, ...x]);
        
        // Create P2WPKH (witness pubkey hash): OP_0 <20-byte-hash>
        const pubKeyHash = ripemd160(sha256(compressedPubKey));
        
        // Bech32 encoding for bc1 addresses
        const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
        const BECH32_POLYMOD = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
        
        function bech32Polymod(values: number[]): number {
          let chk = 1;
          for (const v of values) {
            const top = chk >> 25;
            chk = (chk & 0x1ffffff) << 5 ^ v;
            for (let i = 0; i < 5; i++) {
              if ((top >> i) & 1) chk ^= BECH32_POLYMOD[i];
            }
          }
          return chk;
        }
        
        function bech32CreateChecksum(hrp: string, data: number[]): number[] {
          const values = [...hrp.split('').map(c => c.charCodeAt(0) >> 5), 0, ...hrp.split('').map(c => c.charCodeAt(0) & 31), ...data];
          const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 1;
          const checksum: number[] = [];
          for (let i = 0; i < 6; i++) {
            checksum.push((polymod >> (5 * (5 - i))) & 31);
          }
          return checksum;
        }
        
        function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] {
          let acc = 0;
          let bits = 0;
          const ret: number[] = [];
          const maxv = (1 << toBits) - 1;
          
          for (const value of data) {
            acc = (acc << fromBits) | value;
            bits += fromBits;
            while (bits >= toBits) {
              bits -= toBits;
              ret.push((acc >> bits) & maxv);
            }
          }
          
          if (pad) {
            if (bits > 0) ret.push((acc << (toBits - bits)) & maxv);
          } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
            throw new Error('Invalid bits');
          }
          
          return ret;
        }
        
        // Create bech32 address
        const hrp = 'bc'; // mainnet
        const witnessVersion = 0;
        const data = convertBits(pubKeyHash, 8, 5, true);
        const combined = [witnessVersion, ...data];
        const checksum = bech32CreateChecksum(hrp, combined);
        const fullData = [...combined, ...checksum];
        
        bitcoinAddress = hrp + '1' + fullData.map(d => CHARSET[d]).join('');
      } catch {
        // Bitcoin address generation failed, use placeholder
        bitcoinAddress = '';
      }
    }
    
    // Sui address (using Ed25519, similar to Solana)
    const suiPath = `m/44'/784'/${accountIndex}'/0'/0'`;
    const suiHdKey = bip32.HDKey.fromMasterSeed(seed);
    const suiAccount = suiHdKey.derive(suiPath);
    let suiAddress = 'sui-address-placeholder';
    
    if (suiAccount.privateKey) {
      try {
        const { blake2b } = await import('@noble/hashes/blake2b');
        const suiKeypair = nacl.sign.keyPair.fromSeed(suiAccount.privateKey.slice(0, 32));
        
        // Sui address = Blake2b hash of (0x00 || public key)
        const publicKeyWithFlag = new Uint8Array([0x00, ...suiKeypair.publicKey]);
        const hash = blake2b(publicKeyWithFlag, { dkLen: 32 });
        suiAddress = '0x' + Array.from(hash)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        // Sui address generation failed, use placeholder
      }
    }

    return {
      solana: solanaAddress,
      ethereum: ethereumAddress,
      bitcoin: bitcoinAddress,
      base: baseAddress,
      polygon: polygonAddress,
      sui: suiAddress,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Generate a random 12-word mnemonic
 */
export async function generateMnemonic(): Promise<string> {
  // Validate wordlist before use
  if (!Array.isArray(englishWordlist) || englishWordlist.length !== 2048) {
    throw new Error('Invalid wordlist');
  }

  // Generate 128 bits of entropy (12 words)
  const entropy = crypto.getRandomValues(new Uint8Array(16));

  // Generate mnemonic from entropy
  const mnemonic = bip39.entropyToMnemonic(entropy, englishWordlist);

  // Clear entropy from memory
  secureClear(entropy);

  return mnemonic;
}

/**
 * Validate a mnemonic phrase
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  try {
    return bip39.validateMnemonic(mnemonic, englishWordlist);
  } catch {
    return false;
  }
}

/**
 * Derive a wallet ID from mnemonic (for identification purposes only)
 * This is NOT the blockchain address
 */
export async function deriveWalletId(mnemonic: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 16); // First 16 chars of hash
}

/**
 * Encrypt data with a password (for storing imported mnemonics per account)
 * Uses the same encryption as SecureStorage but returns the encrypted string
 */
export async function encryptWithPassword(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password using PBKDF2
  const passwordBuffer = encoder.encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 600000, // OWASP 2023 recommended minimum
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBytes
  );

  // Convert to base64 for storage
  const encryptedArray = new Uint8Array(encryptedData);
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  // Return as JSON string
  return JSON.stringify({
    encrypted: encryptedBase64,
    salt: saltBase64,
    iv: ivBase64,
  });
}

/**
 * Decrypt data with a password (for retrieving imported mnemonics)
 */
export async function decryptWithPassword(encryptedJson: string, password: string): Promise<string | null> {
  try {
    const { encrypted, salt, iv } = JSON.parse(encryptedJson);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode from base64
    const encryptedArray = new Uint8Array(
      atob(encrypted).split('').map(c => c.charCodeAt(0))
    );
    const saltArray = new Uint8Array(
      atob(salt).split('').map(c => c.charCodeAt(0))
    );
    const ivArray = new Uint8Array(
      atob(iv).split('').map(c => c.charCodeAt(0))
    );

    // Derive key from password
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: 600000, // OWASP 2023 recommended minimum
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedArray
    );

    // Convert to Uint8Array so we can clear it after use
    const decryptedArray = new Uint8Array(decryptedData);
    const result = decoder.decode(decryptedArray);

    // Clear the decrypted buffer from memory
    secureClear(decryptedArray);

    return result;
  } catch {
    // Decryption failed - likely wrong password
    return null;
  }
}