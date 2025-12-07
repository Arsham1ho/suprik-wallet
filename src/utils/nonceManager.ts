/**
 * Durable Nonce Manager for CosmoPay
 * Enables offline transactions without time limits
 */

import { deriveSolanaKeypair } from './transactions';

export interface NonceAccountInfo {
  address: string;
  authority: string;
  nonce: string;
  lamportsPerSignature: number;
  exists: boolean;
}

/**
 * Check if a nonce account exists and get its info
 */
export async function getNonceAccountInfo(
  nonceAccountAddress: string,
  isTestnet: boolean = false
): Promise<NonceAccountInfo | null> {
  try {
    const { PublicKey, NONCE_ACCOUNT_LENGTH } = await import('@solana/web3.js');
    const { getSolanaConnection } = await import('./transactions');

    const connection = await getSolanaConnection(isTestnet);
    const nonceAccountPubkey = new PublicKey(nonceAccountAddress);

    const accountInfo = await connection.getAccountInfo(nonceAccountPubkey);

    if (!accountInfo) {
      return {
        address: nonceAccountAddress,
        authority: '',
        nonce: '',
        lamportsPerSignature: 0,
        exists: false,
      };
    }

    // Parse nonce account data manually instead of using NonceAccount.fromAccountData
    // The nonce account data structure:
    // - Version (u32): 4 bytes
    // - State (u32): 4 bytes  
    // - Authority (PublicKey): 32 bytes
    // - Nonce (Blockhash): 32 bytes
    // - FeeCalculator (u64): 8 bytes
    
    const data = accountInfo.data;
    
    // Check if account is initialized (state should be 1)
    const state = data.readUInt32LE(4);
    if (state !== 1) {
      return {
        address: nonceAccountAddress,
        authority: '',
        nonce: '',
        lamportsPerSignature: 0,
        exists: false,
      };
    }
    
    // Read authority (32 bytes starting at offset 8)
    const authorityBytes = data.slice(8, 40);
    const authority = new PublicKey(authorityBytes);
    
    // Read nonce/blockhash (32 bytes starting at offset 40)
    const nonceBytes = data.slice(40, 72);
    const nonce = Buffer.from(nonceBytes).toString('base64');
    
    // Read lamportsPerSignature (u64 at offset 72)
    const lamportsPerSignature = Number(data.readBigUInt64LE(72));

    return {
      address: nonceAccountAddress,
      authority: authority.toBase58(),
      nonce: nonce,
      lamportsPerSignature: lamportsPerSignature,
      exists: true,
    };
  } catch (error) {
    console.error('[NonceManager] Error getting nonce account info:', error);
    return null;
  }
}

/**
 * Create a new nonce account
 */
export async function createNonceAccount(params: {
  mnemonic: string;
  accountIndex?: number;
  isTestnet?: boolean;
}): Promise<{ success: boolean; nonceAccountAddress?: string; signature?: string; error?: string }> {
  try {
    const { mnemonic, accountIndex = 0, isTestnet = false } = params;

    console.log('[NonceManager] Creating nonce account...');

    const {
      Transaction,
      SystemProgram,
      PublicKey,
      Keypair,
      NONCE_ACCOUNT_LENGTH,
      LAMPORTS_PER_SOL,
    } = await import('@solana/web3.js');
    const { getSolanaConnection } = await import('./transactions');

    // Derive keypair (authority)
    const authorityKeypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const authority = authorityKeypair.publicKey;

    // Generate new keypair for nonce account
    const nonceAccountKeypair = Keypair.generate();
    const nonceAccount = nonceAccountKeypair.publicKey;

    console.log('[NonceManager] Nonce account address:', nonceAccount.toBase58());
    console.log('[NonceManager] Authority:', authority.toBase58());

    // Connect to network
    const connection = await getSolanaConnection(isTestnet);

    // Calculate rent
    const rentExemption = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH);
    console.log('[NonceManager] Rent exemption:', rentExemption / LAMPORTS_PER_SOL, 'SOL');

    // Check authority balance
    const balance = await connection.getBalance(authority);
    const totalRequired = rentExemption + 5000; // Add 5000 lamports for fees

    if (balance < totalRequired) {
      return {
        success: false,
        error: `Insufficient balance. Need ${totalRequired / LAMPORTS_PER_SOL} SOL but have ${balance / LAMPORTS_PER_SOL} SOL`,
      };
    }

    // Create transaction
    const transaction = new Transaction();

    // 1. Create nonce account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: authority,
        newAccountPubkey: nonceAccount,
        lamports: rentExemption,
        space: NONCE_ACCOUNT_LENGTH,
        programId: SystemProgram.programId,
      })
    );

    // 2. Initialize nonce account
    transaction.add(
      SystemProgram.nonceInitialize({
        noncePubkey: nonceAccount,
        authorizedPubkey: authority,
      })
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authority;

    console.log('[NonceManager] Signing transaction...');

    // Sign with both keypairs
    transaction.sign(authorityKeypair, nonceAccountKeypair);

    console.log('[NonceManager] Broadcasting transaction...');

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());

    console.log('[NonceManager] Transaction sent:', signature);
    console.log('[NonceManager] Waiting for confirmation...');

    // Wait for confirmation
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    console.log('[NonceManager] ✅ Nonce account created successfully!');

    // Save nonce account address to localStorage
    localStorage.setItem('cosmopay_nonce_account', nonceAccount.toBase58());

    return {
      success: true,
      nonceAccountAddress: nonceAccount.toBase58(),
      signature,
    };
  } catch (error: any) {
    console.error('[NonceManager] ❌ Error creating nonce account:', error);
    return {
      success: false,
      error: error.message || 'Failed to create nonce account',
    };
  }
}

/**
 * Get stored nonce account address from localStorage
 */
export function getStoredNonceAccount(): string | null {
  return localStorage.getItem('cosmopay_nonce_account');
}

/**
 * Store nonce account address to localStorage
 */
export function storeNonceAccount(address: string): void {
  localStorage.setItem('cosmopay_nonce_account', address);
}

/**
 * Clear stored nonce account
 */
export function clearStoredNonceAccount(): void {
  localStorage.removeItem('cosmopay_nonce_account');
}

/**
 * Close nonce account and reclaim rent
 */
export async function closeNonceAccount(params: {
  mnemonic: string;
  nonceAccountAddress: string;
  accountIndex?: number;
  isTestnet?: boolean;
}): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const { mnemonic, nonceAccountAddress, accountIndex = 0, isTestnet = false } = params;

    console.log('[NonceManager] Closing nonce account...');

    const { Transaction, SystemProgram, PublicKey } = await import('@solana/web3.js');
    const { getSolanaConnection } = await import('./transactions');

    // Derive keypair (authority)
    const authorityKeypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const authority = authorityKeypair.publicKey;

    // Connect to network
    const connection = await getSolanaConnection(isTestnet);

    // Create withdraw instruction (withdraws all lamports, effectively closing account)
    const nonceAccountPubkey = new PublicKey(nonceAccountAddress);

    // Get nonce account info
    const accountInfo = await connection.getAccountInfo(nonceAccountPubkey);
    if (!accountInfo) {
      return {
        success: false,
        error: 'Nonce account not found',
      };
    }

    const transaction = new Transaction().add(
      SystemProgram.nonceWithdraw({
        noncePubkey: nonceAccountPubkey,
        authorizedPubkey: authority,
        toPubkey: authority,
        lamports: accountInfo.lamports, // Withdraw all
      })
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authority;

    // Sign transaction
    transaction.sign(authorityKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());

    console.log('[NonceManager] Transaction sent:', signature);

    // Wait for confirmation
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    console.log('[NonceManager] ✅ Nonce account closed successfully!');

    // Clear from localStorage
    clearStoredNonceAccount();

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('[NonceManager] ❌ Error closing nonce account:', error);
    return {
      success: false,
      error: error.message || 'Failed to close nonce account',
    };
  }
}