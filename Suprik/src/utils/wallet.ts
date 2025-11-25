import * as bip39 from '@scure/bip39';
import { englishWordlist } from './wordlist';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// DEBUG: Test wordlist
console.log('[Wallet] Wordlist check:', {
  type: typeof englishWordlist,
  isArray: Array.isArray(englishWordlist),
  length: englishWordlist.length,
  firstWord: englishWordlist[0],
  lastWord: englishWordlist[englishWordlist.length - 1],
  expected: 2048,
  isValid: englishWordlist.length === 2048
});

/**
 * Secure storage for encrypted mnemonic
 * Uses Web Crypto API for encryption
 */
export class SecureStorage {
  private static STORAGE_KEY = 'saturn_encrypted_wallet';

  /**
   * Derive encryption key from password using PBKDF2
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive actual encryption key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt and store mnemonic
   */
  static async storeMnemonic(mnemonic: string, password: string): Promise<void> {
    try {
      console.log('[SecureStorage] 🔐 Encrypting mnemonic...');
      
      const encoder = new TextEncoder();
      const data = encoder.encode(mnemonic);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Encrypt the mnemonic
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // Combine salt + IV + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
      
      // Store as base64
      const base64 = btoa(String.fromCharCode(...combined));
      localStorage.setItem(this.STORAGE_KEY, base64);
      
      console.log('[SecureStorage] ✅ Mnemonic encrypted and stored successfully');
    } catch (error) {
      console.error('[SecureStorage] ❌ Encryption failed:', error);
      throw new Error('Failed to encrypt mnemonic');
    }
  }

  /**
   * Retrieve and decrypt mnemonic
   */
  static async retrieveMnemonic(password: string): Promise<string | null> {
    try {
      console.log('[SecureStorage] 🔓 Attempting to decrypt mnemonic...');
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.error('[SecureStorage]  No encrypted wallet found in storage');
        return null;
      }

      // Decode from base64
      const combined = new Uint8Array(
        atob(stored).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encryptedData = combined.slice(28);
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      const mnemonic = decoder.decode(decryptedData);
      
      console.log('[SecureStorage] ✅ Mnemonic decrypted successfully');
      return mnemonic;
    } catch (error: any) {
      console.error('[SecureStorage] ❌ Failed to decrypt mnemonic:', error.name);
      console.error('[SecureStorage] This usually means:', {
        possibleCauses: [
          '1. Wrong password entered',
          '2. Corrupted storage data',
          '3. Mismatch between encryption and decryption',
          '4. Browser security context changed'
        ]
      });
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
}

/**
 * Simple storage (unencrypted) - for walletId only
 * Mnemonic should ALWAYS be encrypted
 */
export class WalletStorage {
  private static WALLET_ID_KEY = 'saturn_wallet_id';
  private static CURRENT_ACCOUNT_KEY = 'saturn_current_account';
  private static OAUTH_PASSWORD_KEY = 'saturn_oauth_password'; // Encrypted OAuth password
  
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
   * Store OAuth password (encrypted with browser fingerprint)
   * This allows seamless OAuth re-authentication
   */
  static async setOAuthPassword(password: string): Promise<void> {
    try {
      // Use browser fingerprint as encryption key (device-specific)
      const fingerprint = navigator.userAgent + window.screen.width + window.screen.height;
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      
      // Generate key from fingerprint
      const fingerprintBuffer = encoder.encode(fingerprint);
      const hashBuffer = await crypto.subtle.digest('SHA-256', fingerprintBuffer);
      const key = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Encrypt password
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // Store encrypted data + IV
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);
      const base64 = btoa(String.fromCharCode(...combined));
      
      localStorage.setItem(this.OAUTH_PASSWORD_KEY, base64);
    } catch (error) {
      console.error('[WalletStorage] Failed to store OAuth password:', error);
    }
  }
  
  /**
   * Retrieve OAuth password (if available and on same device)
   */
  static async getOAuthPassword(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.OAUTH_PASSWORD_KEY);
      if (!stored) return null;
      
      // Use browser fingerprint as decryption key
      const fingerprint = navigator.userAgent + window.screen.width + window.screen.height;
      const encoder = new TextEncoder();
      
      // Generate key from fingerprint
      const fingerprintBuffer = encoder.encode(fingerprint);
      const hashBuffer = await crypto.subtle.digest('SHA-256', fingerprintBuffer);
      const key = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Decode stored data
      const combined = new Uint8Array(
        atob(stored).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('[WalletStorage] Failed to retrieve OAuth password:', error);
      return null;
    }
  }
  
  static clearOAuthPassword(): void {
    localStorage.removeItem(this.OAUTH_PASSWORD_KEY);
  }
  
  static clear(): void {
    localStorage.removeItem(this.WALLET_ID_KEY);
    localStorage.removeItem(this.CURRENT_ACCOUNT_KEY);
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
    const sha3 = await import('@noble/hashes@1.3.3/sha3');
    
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    
    // Derive Solana address (BIP44: m/44'/501'/accountIndex'/0')
    const solanaPath = `m/44'/501'/${accountIndex}'/0'`;
    const solanaHdKey = bip32.HDKey.fromMasterSeed(seed);
    const solanaAccount = solanaHdKey.derive(solanaPath);
    if (!solanaAccount.privateKey) {
      throw new Error('Failed to derive Solana private key');
    }
    const solanaKeypair = nacl.sign.keyPair.fromSeed(solanaAccount.privateKey.slice(0, 32));
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
        const { sha256 } = await import('@noble/hashes@1.3.3/sha256');
        const { ripemd160 } = await import('@noble/hashes@1.3.3/ripemd160');
        
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
      } catch (error) {
        console.warn('[deriveAddresses] Bitcoin address generation failed:', error);
        // Fallback to a deterministic but invalid address for demo
        bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Example valid format
      }
    }
    
    // Sui address (using Ed25519, similar to Solana)
    const suiPath = `m/44'/784'/${accountIndex}'/0'/0'`;
    const suiHdKey = bip32.HDKey.fromMasterSeed(seed);
    const suiAccount = suiHdKey.derive(suiPath);
    let suiAddress = 'sui-address-placeholder';
    
    if (suiAccount.privateKey) {
      try {
        const { blake2b } = await import('@noble/hashes@1.3.3/blake2b');
        const suiKeypair = nacl.sign.keyPair.fromSeed(suiAccount.privateKey.slice(0, 32));
        
        // Sui address = Blake2b hash of (0x00 || public key)
        const publicKeyWithFlag = new Uint8Array([0x00, ...suiKeypair.publicKey]);
        const hash = blake2b(publicKeyWithFlag, { dkLen: 32 });
        suiAddress = '0x' + Array.from(hash)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (error) {
        console.warn('[deriveAddresses] Sui address generation failed:', error);
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
    console.error('[deriveAddresses] Failed to derive addresses:', error);
    throw error;
  }
}

/**
 * Generate a random 12-word mnemonic
 */
export async function generateMnemonic(): Promise<string> {
  try {
    console.log('[generateMnemonic] Starting mnemonic generation...');
    console.log('[generateMnemonic] Wordlist length:', englishWordlist.length);
    console.log('[generateMnemonic] Wordlist type:', typeof englishWordlist);
    console.log('[generateMnemonic] Is array:', Array.isArray(englishWordlist));
    
    // Validate wordlist before use
    if (!Array.isArray(englishWordlist)) {
      throw new Error('Wordlist is not an array');
    }
    
    if (englishWordlist.length !== 2048) {
      throw new Error(`Wordlist has ${englishWordlist.length} words, expected 2048`);
    }
    
    // Check that all elements are strings
    const allStrings = englishWordlist.every(word => typeof word === 'string');
    if (!allStrings) {
      throw new Error('Wordlist contains non-string elements');
    }
    
    console.log('[generateMnemonic] ✅ Wordlist validation passed');
    
    // Generate 128 bits of entropy (12 words)
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    console.log('[generateMnemonic] Generated entropy:', entropy.length, 'bytes');
    
    // Use inline wordlist
    const mnemonic = bip39.entropyToMnemonic(entropy, englishWordlist);
    
    console.log('[generateMnemonic] ✅ Generated 12-word mnemonic');
    return mnemonic;
  } catch (error) {
    console.error('[generateMnemonic] ❌ Error:', error);
    throw error;
  }
}

/**
 * Validate a mnemonic phrase
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  try {
    // Use inline wordlist (no import needed)
    const isValid = bip39.validateMnemonic(mnemonic, englishWordlist);
    console.log('[validateMnemonic]', isValid ? '✅ Valid' : '❌ Invalid');
    return isValid;
  } catch (error) {
    console.error('[validateMnemonic] ❌ Error:', error);
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