/**
 * Saturn Wallet - Web3 Wallet Manager
 * Client-side wallet management similar to Phantom
 */

import * as bip39 from "@scure/bip39";
import { englishWordlist } from "../wordlist";
import { HDKey } from "micro-ed25519-hdkey";
import {
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import CryptoJS from "crypto-js";

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
  // Validate wordlist
  if (englishWordlist.length !== 2048) {
    throw new Error(
      `Wordlist has ${englishWordlist.length} words, expected 2048`
    );
  }

  // Generate 128 bits of entropy (12 words)
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const mnemonic = bip39.entropyToMnemonic(entropy, englishWordlist);

  // Securely clear entropy from memory
  crypto.getRandomValues(entropy);
  entropy.fill(0);

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
 * Uses micro-ed25519-hdkey (SLIP-0010) for derivation - same as Phantom wallet
 */
export function deriveKeypairFromSeed(
  seedPhrase: string,
  accountIndex: number = 0
): Keypair {
  if (!validateSeedPhrase(seedPhrase)) {
    throw new Error("Invalid seed phrase");
  }

  // Convert seed phrase to seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase, "");

  // Derive path for Solana using micro-ed25519-hdkey (SLIP-0010, same as Phantom)
  // Path: m/44'/501'/accountIndex'/0'
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const hdkey = HDKey.fromMasterSeed(seed);
  const derived = hdkey.derive(path);

  // Create keypair from derived private key (32 bytes)
  if (!derived.privateKey) {
    throw new Error("Failed to derive private key");
  }
  return Keypair.fromSeed(derived.privateKey);
}

/**
 * Encrypt seed phrase with password
 */
export function encryptSeedPhrase(
  seedPhrase: string,
  password: string
): EncryptedWallet {
  // Generate random salt and IV
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  // Derive key from password using PBKDF2 (OWASP 2023 recommends 600,000 for SHA-256)
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 600000,
  });

  // Encrypt seed phrase
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encrypted: encrypted.toString(),
    salt: salt.toString(),
    iv: iv.toString(),
  };
}

/**
 * Decrypt seed phrase with password
 */
export function decryptSeedPhrase(
  encryptedWallet: EncryptedWallet,
  password: string
): string {
  try {
    const salt = CryptoJS.enc.Hex.parse(encryptedWallet.salt);
    const iv = CryptoJS.enc.Hex.parse(encryptedWallet.iv);

    // Derive key from password (OWASP 2023 recommends 600,000 for SHA-256)
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 600000,
    });

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encryptedWallet.encrypted, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const seedPhrase = decrypted.toString(CryptoJS.enc.Utf8);

    if (!seedPhrase || !validateSeedPhrase(seedPhrase)) {
      throw new Error("Decryption failed or invalid seed phrase");
    }

    return seedPhrase;
  } catch (error) {
    throw new Error("Invalid password or corrupted wallet");
  }
}

/**
 * Store encrypted wallet in localStorage
 */
export function storeWallet(
  walletId: string,
  encryptedWallet: EncryptedWallet
): void {
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
export function getPublicKey(
  seedPhrase: string,
  accountIndex: number = 0
): string {
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
  rpcUrl: string = "https://api.mainnet-beta.solana.com"
): Promise<{ signature: string; success: boolean; error?: string }> {
  let keypair: Keypair | null = null;
  try {
    // Derive keypair
    keypair = deriveKeypairFromSeed(seedPhrase, accountIndex);

    // Connect to Solana
    const connection = new Connection(rpcUrl, "confirmed");

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
      { commitment: "confirmed" }
    );

    // Securely clear the keypair's secret key after use
    secureClearArray(keypair.secretKey);

    return {
      signature,
      success: true,
    };
  } catch (error: any) {
    return {
      signature: "",
      success: false,
      error: error.message || "Transaction failed",
    };
  } finally {
    // Always clear the keypair secret key
    if (keypair) {
      secureClearArray(keypair.secretKey);
    }
  }
}

/**
 * Get SOL balance
 */
export async function getBalance(
  publicKey: string,
  rpcUrl: string = "https://api.mainnet-beta.solana.com"
): Promise<number> {
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const pubkey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Get balance error:", error);
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
  try {
    transaction.sign(keypair);
    return transaction;
  } finally {
    // Securely clear the keypair's secret key after signing
    secureClearArray(keypair.secretKey);
  }
}

/**
 * Export private key (for advanced users)
 * SECURITY: This function requires a valid mnemonic to export
 * The mnemonic is already verified by the caller (SecuritySettings) via password decryption
 */
export async function exportPrivateKey(
  seedPhrase: string,
  _password?: string, // Kept for backwards compatibility, validation done by caller
  accountIndex: number = 0
): Promise<{ privateKey: Uint8Array; success: boolean; error?: string }> {
  try {
    // Validate the seed phrase first
    if (!seedPhrase || !validateSeedPhrase(seedPhrase)) {
      return { privateKey: new Uint8Array(0), success: false, error: 'Invalid seed phrase' };
    }

    // The password verification is already done by the caller (SecuritySettings)
    // which decrypts the mnemonic from SecureStorage before calling this function.
    // We just need to derive the private key from the validated seed phrase.

    // Export the private key
    const keypair = deriveKeypairFromSeed(seedPhrase, accountIndex);
    const privateKey = new Uint8Array(keypair.secretKey);

    // Clear the original keypair
    secureClearArray(keypair.secretKey);

    return { privateKey, success: true };
  } catch (error: any) {
    return { privateKey: new Uint8Array(0), success: false, error: error.message || 'Export failed' };
  }
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
export function deriveMultipleAccounts(
  seedPhrase: string,
  count: number = 5
): WalletAccount[] {
  const accounts: WalletAccount[] = [];

  for (let i = 0; i < count; i++) {
    const keypair = deriveKeypairFromSeed(seedPhrase, i);
    accounts.push({
      publicKey: keypair.publicKey.toBase58(),
      name: i === 0 ? "Main Account" : `Account ${i + 1}`,
      index: i,
    });
  }

  return accounts;
}

/**
 * Securely clear a Uint8Array (for private keys)
 */
function secureClearArray(arr: Uint8Array): void {
  crypto.getRandomValues(arr);
  arr.fill(0);
}

/**
 * Session storage for temporary decrypted seed (for active session)
 */
let sessionSeed: { seed: string; expiry: number } | null = null;

export function setSessionSeed(
  seedPhrase: string,
  durationMs: number = 15 * 60 * 1000
): void {
  // Clear any existing session first
  if (sessionSeed) {
    clearSessionSeed();
  }
  sessionSeed = {
    seed: seedPhrase,
    expiry: Date.now() + durationMs,
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
  if (sessionSeed) {
    // Overwrite seed string in memory before nullifying
    // Note: JavaScript strings are immutable, but we do our best
    sessionSeed.seed = '';
    sessionSeed.expiry = 0;
  }
  sessionSeed = null;
}

export function hasActiveSession(): boolean {
  return getSessionSeed() !== null;
}
