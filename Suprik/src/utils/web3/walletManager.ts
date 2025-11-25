/**
 * Saturn Wallet - Web3 Wallet Manager
 * Client-side wallet management similar to Phantom
 */

import * as bip39 from '@scure/bip39';
import { englishWordlist } from '../wordlist';
import { derivePath } from 'npm:ed25519-hd-key@1.3.0';
import { Keypair, PublicKey, Connection, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import CryptoJS from 'npm:crypto-js@4.2.0';

export interface WalletAccount {
  publicKey: string;
  name: string;
  index: number;
}

export interface EncryptedWallet {
  encrypted: string;
  salt: string;
  iv: string;
}

/**
 * Generate a new 12-word mnemonic seed phrase
 */
export function generateSeedPhrase(): string {
  console.log('[walletManager] Generating seed phrase...');
  console.log('[walletManager] Wordlist length:', englishWordlist.length);
  
  // Validate wordlist
  if (englishWordlist.length !== 2048) {
    throw new Error(`Wordlist has ${englishWordlist.length} words, expected 2048`);
  }
  
  // Generate 128 bits of entropy (12 words)
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const mnemonic = bip39.entropyToMnemonic(entropy, englishWordlist);
  
  console.log('[walletManager] ✅ Generated seed phrase');
  return mnemonic;
}

/**
 * Validate a seed phrase
 */
export function validateSeedPhrase(seedPhrase: string): boolean {
  return bip39.validateMnemonic(seedPhrase, englishWordlist);
}

/**
 * Derive a Solana keypair from seed phrase
 */
export function deriveKeypairFromSeed(seedPhrase: string, accountIndex: number = 0): Keypair {
  if (!validateSeedPhrase(seedPhrase)) {
    throw new Error('Invalid seed phrase');
  }

  // Convert seed phrase to seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase, '');
  
  // Derive path for Solana: m/44'/501'/0'/0'
  const derivationPath = `m/44'/501'/${accountIndex}'/0'`;
  // Convert Uint8Array to hex string
  const seedHex = Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join('');
  const derivedSeed = derivePath(derivationPath, seedHex).key;
  
  // Create keypair from derived seed
  return Keypair.fromSeed(derivedSeed);
}

/**
 * Encrypt seed phrase with password
 */
export function encryptSeedPhrase(seedPhrase: string, password: string): EncryptedWallet {
  // Generate random salt and IV
  const salt = CryptoJS.lib.WordArray.random(128/8);
  const iv = CryptoJS.lib.WordArray.random(128/8);
  
  // Derive key from password using PBKDF2
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  });
  
  // Encrypt seed phrase
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    encrypted: encrypted.toString(),
    salt: salt.toString(),
    iv: iv.toString()
  };
}

/**
 * Decrypt seed phrase with password
 */
export function decryptSeedPhrase(encryptedWallet: EncryptedWallet, password: string): string {
  try {
    const salt = CryptoJS.enc.Hex.parse(encryptedWallet.salt);
    const iv = CryptoJS.enc.Hex.parse(encryptedWallet.iv);
    
    // Derive key from password
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 10000
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encryptedWallet.encrypted, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const seedPhrase = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!seedPhrase || !validateSeedPhrase(seedPhrase)) {
      throw new Error('Decryption failed or invalid seed phrase');
    }
    
    return seedPhrase;
  } catch (error) {
    throw new Error('Invalid password or corrupted wallet');
  }
}

/**
 * Store encrypted wallet in localStorage
 */
export function storeWallet(walletId: string, encryptedWallet: EncryptedWallet): void {
  const key = `saturn_wallet_${walletId}`;
  localStorage.setItem(key, JSON.stringify(encryptedWallet));
}

/**
 * Retrieve encrypted wallet from localStorage
 */
export function retrieveWallet(walletId: string): EncryptedWallet | null {
  const key = `saturn_wallet_${walletId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Delete wallet from localStorage
 */
export function deleteWallet(walletId: string): void {
  const key = `saturn_wallet_${walletId}`;
  localStorage.removeItem(key);
}

/**
 * Get public key for account
 */
export function getPublicKey(seedPhrase: string, accountIndex: number = 0): string {
  const keypair = deriveKeypairFromSeed(seedPhrase, accountIndex);
  return keypair.publicKey.toBase58();
}

/**
 * Sign and send SOL transfer
 */
export async function sendSOL(
  seedPhrase: string,
  recipientAddress: string,
  amount: number,
  accountIndex: number = 0,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    // Derive keypair
    const keypair = deriveKeypairFromSeed(seedPhrase, accountIndex);
    
    // Connect to Solana
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Create transaction
    const recipientPubkey = new PublicKey(recipientAddress);
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: lamports,
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    // Sign and send
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      { commitment: 'confirmed' }
    );
    
    return {
      signature,
      success: true
    };
  } catch (error: any) {
    console.error('Send SOL error:', error);
    return {
      signature: '',
      success: false,
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Get SOL balance
 */
export async function getBalance(
  publicKey: string,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<number> {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const pubkey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Get balance error:', error);
    return 0;
  }
}

/**
 * Sign a transaction (without sending)
 */
export function signTransaction(
  seedPhrase: string,
  transaction: Transaction,
  accountIndex: number = 0
): Transaction {
  const keypair = deriveKeypairFromSeed(seedPhrase, accountIndex);
  transaction.sign(keypair);
  return transaction;
}

/**
 * Export private key (for advanced users)
 */
export function exportPrivateKey(seedPhrase: string, accountIndex: number = 0): Uint8Array {
  const keypair = deriveKeypairFromSeed(seedPhrase, accountIndex);
  return keypair.secretKey;
}

/**
 * Import wallet from private key
 */
export function importFromPrivateKey(privateKeyArray: number[]): Keypair {
  const secretKey = Uint8Array.from(privateKeyArray);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Create multiple accounts from same seed phrase
 */
export function deriveMultipleAccounts(seedPhrase: string, count: number = 5): WalletAccount[] {
  const accounts: WalletAccount[] = [];
  
  for (let i = 0; i < count; i++) {
    const keypair = deriveKeypairFromSeed(seedPhrase, i);
    accounts.push({
      publicKey: keypair.publicKey.toBase58(),
      name: i === 0 ? 'Main Account' : `Account ${i + 1}`,
      index: i
    });
  }
  
  return accounts;
}

/**
 * Session storage for temporary decrypted seed (for active session)
 */
let sessionSeed: { seed: string; expiry: number } | null = null;

export function setSessionSeed(seedPhrase: string, durationMs: number = 15 * 60 * 1000): void {
  sessionSeed = {
    seed: seedPhrase,
    expiry: Date.now() + durationMs
  };
}

export function getSessionSeed(): string | null {
  if (!sessionSeed) return null;
  
  if (Date.now() > sessionSeed.expiry) {
    clearSessionSeed();
    return null;
  }
  
  return sessionSeed.seed;
}

export function clearSessionSeed(): void {
  sessionSeed = null;
}

export function hasActiveSession(): boolean {
  return getSessionSeed() !== null;
}