/**
 * CosmoPay - Offline Transaction Utilities with Durable Nonce
 * Create, serialize, and parse offline Solana transactions without time limits
 */

import { deriveSolanaKeypair } from './transactions';
import { getNonceAccountInfo } from './nonceManager';

export interface OfflineTransaction {
  version: string;
  network: 'mainnet' | 'devnet';
  from: string;
  to: string;
  token: {
    symbol: string;
    mint: string;
    logo: string;
    decimals: number;
  };
  amount: string;
  timestamp: number;
  serializedTransaction: string; // Base64 encoded signed transaction
  nonceAccount?: string; // Nonce account used for durable transactions
  signature?: string;
}

/**
 * Create an offline SOL transfer transaction with durable nonce
 */
export async function createOfflineSolTransaction(params: {
  mnemonic: string;
  toAddress: string;
  amount: number; // in SOL
  accountIndex?: number;
  isTestnet?: boolean;
  nonceAccount?: string; // Optional: use durable nonce for no time limit
}): Promise<OfflineTransaction> {
  const { mnemonic, toAddress, amount, accountIndex = 0, isTestnet = false, nonceAccount } = params;

  console.log('[CosmoPay] Creating offline SOL transaction...');
  if (nonceAccount) {
    console.log('[CosmoPay] Using durable nonce (no time limit)');
  }

  const { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
  const { getSolanaConnection } = await import('./transactions');

  // Derive keypair
  const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
  const fromPubkey = keypair.publicKey;

  // Connect to network
  const connection = await getSolanaConnection(isTestnet);

  // Create transaction
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
  const transaction = new Transaction();

  // If using nonce account, add nonce advance instruction first
  if (nonceAccount) {
    const nonceAccountPubkey = new PublicKey(nonceAccount);
    
    // Get nonce account info
    const nonceInfo = await getNonceAccountInfo(nonceAccount, isTestnet);
    if (!nonceInfo || !nonceInfo.exists) {
      throw new Error('Nonce account not found or not initialized');
    }

    // Add nonce advance instruction
    transaction.add(
      SystemProgram.nonceAdvance({
        noncePubkey: nonceAccountPubkey,
        authorizedPubkey: fromPubkey,
      })
    );

    // Use nonce as blockhash
    transaction.recentBlockhash = nonceInfo.nonce;
    transaction.feePayer = fromPubkey;
  } else {
    // Get recent blockhash (standard, time-limited)
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;
  }

  // Add transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(toAddress),
      lamports,
    })
  );

  // Sign transaction
  transaction.sign(keypair);

  // Serialize transaction
  const serialized = transaction.serialize().toString('base64');

  console.log('[CosmoPay] ✅ Offline transaction created');

  return {
    version: '1.0',
    network: isTestnet ? 'devnet' : 'mainnet',
    from: fromPubkey.toBase58(),
    to: toAddress,
    token: {
      symbol: 'SOL',
      mint: 'native',
      logo: '⚡',
      decimals: 9,
    },
    amount: amount.toString(),
    timestamp: Date.now(),
    serializedTransaction: serialized,
    nonceAccount: nonceAccount, // Store nonce account if used
  };
}

/**
 * Create an offline SPL token transfer transaction with durable nonce
 */
export async function createOfflineSPLTransaction(params: {
  mnemonic: string;
  toAddress: string;
  amount: number;
  tokenMint: string;
  tokenSymbol: string;
  tokenLogo: string;
  decimals: number;
  accountIndex?: number;
  isTestnet?: boolean;
  nonceAccount?: string; // Optional: use durable nonce for no time limit
}): Promise<OfflineTransaction> {
  const {
    mnemonic,
    toAddress,
    amount,
    tokenMint,
    tokenSymbol,
    tokenLogo,
    decimals,
    accountIndex = 0,
    isTestnet = false,
    nonceAccount
  } = params;

  console.log('[CosmoPay] Creating offline SPL token transaction...');
  if (nonceAccount) {
    console.log('[CosmoPay] Using durable nonce (no time limit)');
  }

  const { Transaction, PublicKey, SystemProgram } = await import('@solana/web3.js');
  const {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  } = await import('@solana/spl-token');
  const { getSolanaConnection } = await import('./transactions');

  // Derive keypair
  const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
  const fromPubkey = keypair.publicKey;

  // Connect to network
  const connection = await getSolanaConnection(isTestnet);

  // Get token accounts
  const mintPubkey = new PublicKey(tokenMint);
  const toPubkey = new PublicKey(toAddress);

  // Detect the correct token program (SPL Token vs Token-2022)
  const mintInfo = await connection.getAccountInfo(mintPubkey);
  if (!mintInfo) {
    throw new Error('Token mint account not found');
  }
  
  const tokenProgramId = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID) 
    ? TOKEN_2022_PROGRAM_ID 
    : TOKEN_PROGRAM_ID;
  
  console.log('[CosmoPay] Token program:', tokenProgramId.toBase58());

  const fromTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const toTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    toPubkey,
    false,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Check if recipient token account exists, if not create it
  const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
  const needsTokenAccount = !toTokenAccountInfo;

  // Check SOL balance if we need to create token account
  if (needsTokenAccount) {
    const { LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    const { getMinimumBalanceForRentExemption } = await import('@solana/spl-token');
    
    const solBalance = await connection.getBalance(fromPubkey);
    
    // Get actual account size needed for this specific token
    // For Token-2022, the account might need more space for extensions
    // We'll use a very conservative estimate to ensure transaction succeeds
    let accountSize = 165; // Default token account size
    
    // Check if this is Token-2022
    const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
    if (mintAccountInfo && mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      console.log('[CosmoPay] Token-2022 detected');
      // Token-2022 accounts can have extensions, use safe maximum
      // The actual rent will be determined by the program during account creation
      accountSize = 250; // Very conservative estimate that covers all Token-2022 scenarios
      console.log('[CosmoPay] Using safe maximum size for Token-2022:', accountSize, 'bytes');
    } else {
      console.log('[CosmoPay] Standard SPL Token detected, using 165 bytes');
    }
    
    // Get actual rent-exempt balance required for token account
    const rentExemptBalance = await getMinimumBalanceForRentExemption(accountSize, connection);
    
    // Add buffer for transaction fees (need more for nonce transactions)
    const feeBuffer = nonceAccount ? 15000 : 10000; // More buffer for nonce transactions
    const minRequiredLamports = rentExemptBalance + feeBuffer;
    
    console.log('[CosmoPay] ====== RENT CALCULATION ======');
    console.log('[CosmoPay] SOL balance:', solBalance / LAMPORTS_PER_SOL, 'SOL', `(${solBalance} lamports)`);
    console.log('[CosmoPay] Account size:', accountSize, 'bytes');
    console.log('[CosmoPay] Rent-exempt minimum:', rentExemptBalance / LAMPORTS_PER_SOL, 'SOL', `(${rentExemptBalance} lamports)`);
    console.log('[CosmoPay] Fee buffer:', feeBuffer / LAMPORTS_PER_SOL, 'SOL', `(${feeBuffer} lamports)`);
    console.log('[CosmoPay] Total required:', minRequiredLamports / LAMPORTS_PER_SOL, 'SOL', `(${minRequiredLamports} lamports)`);
    console.log('[CosmoPay] ============================');
    
    if (solBalance < minRequiredLamports) {
      const shortfall = (minRequiredLamports - solBalance) / LAMPORTS_PER_SOL;
      console.error('[CosmoPay] ❌ Insufficient SOL! Short by:', shortfall, 'SOL');
      
      throw new Error(
        `Insufficient SOL to create recipient token account.\n\n` +
        `Required: ${(minRequiredLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL\n` +
        `Current: ${(solBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n` +
        `Short by: ${shortfall.toFixed(6)} SOL\n\n` +
        `Please add at least ${shortfall.toFixed(6)} SOL to your wallet and try again.`
      );
    }
    
    console.log('[CosmoPay] ✅ Sufficient SOL balance for token account creation');
  }

  // Calculate amount in token's smallest unit
  const transferAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

  // Create transaction
  const transaction = new Transaction();

  // If using nonce account, add nonce advance instruction first
  if (nonceAccount) {
    const nonceAccountPubkey = new PublicKey(nonceAccount);
    
    // Get nonce account info
    const nonceInfo = await getNonceAccountInfo(nonceAccount, isTestnet);
    if (!nonceInfo || !nonceInfo.exists) {
      throw new Error('Nonce account not found or not initialized');
    }

    // Add nonce advance instruction
    transaction.add(
      SystemProgram.nonceAdvance({
        noncePubkey: nonceAccountPubkey,
        authorizedPubkey: fromPubkey,
      })
    );

    // Use nonce as blockhash
    transaction.recentBlockhash = nonceInfo.nonce;
    transaction.feePayer = fromPubkey;
  } else {
    // Get recent blockhash (standard, time-limited)
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;
  }

  // Create recipient token account if needed
  if (needsTokenAccount) {
    console.log('[CosmoPay] Creating recipient token account...');
    
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey, // payer
        toTokenAccount, // associated token account
        toPubkey, // owner
        mintPubkey, // mint
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Add transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromPubkey,
    transferAmount,
    [],
    tokenProgramId
  );
  transaction.add(transferInstruction);

  // Sign transaction
  transaction.sign(keypair);

  // Serialize transaction
  const serialized = transaction.serialize().toString('base64');

  console.log('[CosmoPay] ✅ Offline SPL transaction created');

  return {
    version: '1.0',
    network: isTestnet ? 'devnet' : 'mainnet',
    from: fromPubkey.toBase58(),
    to: toAddress,
    token: {
      symbol: tokenSymbol,
      mint: tokenMint,
      logo: tokenLogo,
      decimals,
    },
    amount: amount.toString(),
    timestamp: Date.now(),
    serializedTransaction: serialized,
    nonceAccount: nonceAccount, // Store nonce account if used
  };
}

/**
 * Parse an offline transaction from JSON string
 */
export function parseOfflineTransaction(data: string): OfflineTransaction | null {
  try {
    const parsed = JSON.parse(data);

    // Validate required fields
    if (
      !parsed.version ||
      !parsed.network ||
      !parsed.from ||
      !parsed.to ||
      !parsed.token ||
      !parsed.amount ||
      !parsed.timestamp ||
      !parsed.serializedTransaction
    ) {
      console.error('[CosmoPay] Invalid transaction format - missing required fields');
      return null;
    }

    return parsed as OfflineTransaction;
  } catch (error) {
    console.error('[CosmoPay] Failed to parse transaction:', error);
    return null;
  }
}

/**
 * Submit an offline transaction to the network
 */
export async function submitOfflineTransaction(
  offlineTransaction: OfflineTransaction
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('[CosmoPay] Submitting offline transaction to network...');

    if (offlineTransaction.nonceAccount) {
      console.log('[CosmoPay] Transaction uses durable nonce - no time limit!');
    }

    const { Connection } = await import('@solana/web3.js');
    const { getSolanaConnection } = await import('./transactions');

    // Get correct network connection
    const isTestnet = offlineTransaction.network === 'devnet';
    const connection = await getSolanaConnection(isTestnet);

    // Deserialize transaction - Browser-compatible base64 decoding
    const binaryString = atob(offlineTransaction.serializedTransaction);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('[CosmoPay] Broadcasting transaction...');

    // Send transaction
    const signature = await connection.sendRawTransaction(bytes, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log('[CosmoPay] Transaction sent:', signature);
    console.log('[CosmoPay] Waiting for confirmation...');

    // Wait for confirmation
    // For nonce transactions, poll for status since we don't have a blockhash
    if (offlineTransaction.nonceAccount) {
      // Poll for confirmation using signature only
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max wait
      
      while (!confirmed && attempts < maxAttempts) {
        try {
          const status = await connection.getSignatureStatus(signature);
          if (status?.value?.confirmationStatus === 'confirmed' || 
              status?.value?.confirmationStatus === 'finalized') {
            confirmed = true;
            break;
          }
          
          if (status?.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
          }
        } catch (pollError) {
          console.log('[CosmoPay] Polling for confirmation...', attempts);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
      }
      
      if (!confirmed) {
        throw new Error('Transaction confirmation timeout');
      }
    } else {
      // Standard confirmation with blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );
    }

    console.log('[CosmoPay] ✅ Transaction confirmed!');

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('[CosmoPay] ❌ Failed to submit transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit transaction',
    };
  }
}

/**
 * Convert offline transaction to JSON string
 */
export function serializeOfflineTransaction(transaction: OfflineTransaction): string {
  return JSON.stringify(transaction, null, 2);
}

/**
 * Download offline transaction as file
 */
export function downloadOfflineTransaction(transaction: OfflineTransaction, filename?: string) {
  const json = serializeOfflineTransaction(transaction);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `cosmopay-tx-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('[CosmoPay] Transaction file downloaded');
}