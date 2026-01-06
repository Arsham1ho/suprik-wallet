/**
 * Saturn Wallet - Transaction Utilities
 * CLIENT-SIDE transaction signing and broadcasting (like Phantom)
 * Supports Solana and Ethereum networks with TESTNET mode
 */

import * as bip39 from '@scure/bip39';
import { HDKey } from 'micro-ed25519-hdkey';

/**
 * Derive Solana keypair from mnemonic (CLIENT-SIDE)
 * Uses micro-ed25519-hdkey (SLIP-0010) for derivation - same as Phantom wallet
 *
 * IMPORTANT: This MUST use the exact same derivation as wallet.ts deriveAddresses()
 * to ensure the address shown in Receive page matches the address used for transactions.
 */
export async function deriveSolanaKeypair(mnemonic: string, accountIndex: number = 0) {
  // Security: Don't log mnemonic details
  console.log('[Transaction] 🔑 deriveSolanaKeypair called, accountIndex:', accountIndex);

  // Validate mnemonic before attempting derivation
  if (!mnemonic || typeof mnemonic !== 'string' || mnemonic.trim().length === 0) {
    console.error('[Transaction] ❌ deriveSolanaKeypair called with invalid mnemonic');
    throw new Error('Wallet session not found. Please lock and unlock your wallet to continue.');
  }

  // Check if mnemonic looks valid (should be 12 or 24 words)
  const wordCount = mnemonic.trim().split(/\s+/).length;
  if (wordCount !== 12 && wordCount !== 24) {
    console.error('[Transaction] ❌ Invalid mnemonic format');
    throw new Error('Invalid wallet data. Please lock and unlock your wallet to continue.');
  }

  try {
    // Convert mnemonic to seed - use mnemonicToSeedSync with empty passphrase
    // This MUST match wallet.ts line 404: bip39.mnemonicToSeedSync(mnemonic, '')
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');

    // Derive Solana path using micro-ed25519-hdkey (SLIP-0010, same as Phantom)
    // Path: m/44'/501'/accountIndex'/0'
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const hdkey = HDKey.fromMasterSeed(seed);
    const derived = hdkey.derive(path);

    if (!derived.privateKey) {
      throw new Error('Failed to derive Solana private key');
    }

    // Import Solana web3.js dynamically
    const { Keypair } = await import('@solana/web3.js');

    // Create keypair from derived private key (32 bytes)
    const keypair = Keypair.fromSeed(derived.privateKey);

    return keypair;
  } catch (error: any) {
    // Provide a user-friendly error message for mnemonic issues
    if (error.message?.includes('mnemonic') || error.message?.includes('Invalid')) {
      console.error('[Transaction] ❌ Mnemonic validation failed:', error.message);
      throw new Error('Invalid wallet data. Please lock and unlock your wallet to continue.');
    }
    throw error;
  }
}

/**
 * Derive Ethereum wallet from mnemonic (CLIENT-SIDE)
 */
export async function deriveEthereumWallet(mnemonic: string, accountIndex: number = 0) {
  // Import ethers dynamically
  const { ethers } = await import('ethers');
  
  // Create HD wallet from mnemonic
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  
  // Derive Ethereum path: m/44'/60'/0'/0/accountIndex
  const derivedNode = hdNode.derivePath(`m/44'/60'/0'/0/${accountIndex}`);
  
  return new ethers.Wallet(derivedNode.privateKey);
}

/**
 * Derive Ethereum private key from mnemonic (CLIENT-SIDE)
 * Alias for deriveEthereumWallet but returns the private key string
 */
export async function deriveEthereumPrivateKey(mnemonic: string, accountIndex: number = 0): Promise<string> {
  const wallet = await deriveEthereumWallet(mnemonic, accountIndex);
  return wallet.privateKey;
}

/**
 * Get Solana connection
 * Uses Helius RPC if API key is available, otherwise falls back to public RPC
 */
export async function getSolanaConnection(isTestnet: boolean = false) {
  const { Connection } = await import('@solana/web3.js');

  // Get Helius API key from environment
  const { getHeliusApiKey } = await import('./env');
  const HELIUS_API_KEY = getHeliusApiKey();

  let endpoint: string;

  if (HELIUS_API_KEY) {
    // Use Helius RPC (faster, more reliable, higher rate limits)
    endpoint = isTestnet
      ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
      : `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  } else {
    // Fallback to public RPC (rate limited but works)
    endpoint = isTestnet
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
  }

  return new Connection(endpoint, 'confirmed');
}

/**
 * Get Ethereum provider
 * Uses Alchemy RPC if API key is available, otherwise falls back to public RPC
 */
export async function getEthereumProvider(isTestnet: boolean = false) {
  const { ethers } = await import('ethers');

  // Get Alchemy API key from environment
  const { getAlchemyApiKey } = await import('./env');
  const ALCHEMY_API_KEY = getAlchemyApiKey();

  let endpoint: string;
  const network = isTestnet ? 'sepolia' : 'mainnet';

  if (ALCHEMY_API_KEY) {
    // Use Alchemy RPC (faster, more reliable)
    endpoint = `https://eth-${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  } else {
    // Fallback to public RPC (rate limited but works)
    endpoint = isTestnet
      ? 'https://rpc.sepolia.org'
      : 'https://cloudflare-eth.com';
  }

  return new ethers.JsonRpcProvider(endpoint);
}

/**
 * Estimate Solana transaction fee
 */
export async function estimateSolanaFee(fromAddress: string, toAddress: string, lamports: number): Promise<number> {
  try {
    const { Transaction, SystemProgram, PublicKey } = await import('@solana/web3.js');
    const connection = await getSolanaConnection();
    
    // Create a test transaction
    const testTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(fromAddress),
        toPubkey: new PublicKey(toAddress),
        lamports,
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    testTransaction.recentBlockhash = blockhash;
    testTransaction.feePayer = new PublicKey(fromAddress);
    
    const feeEstimate = await connection.getFeeForMessage(
      testTransaction.compileMessage(),
      'confirmed'
    );
    
    return feeEstimate.value || 5000; // Default to 5000 lamports if estimation fails
  } catch {
    return 5000; // Default fee
  }
}

/**
 * Estimate Ethereum transaction fee
 */
export async function estimateEthereumFee(fromAddress: string, toAddress: string, value: bigint): Promise<bigint> {
  try {
    const provider = await getEthereumProvider();
    
    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);
    
    // Estimate gas limit
    const gasLimit = await provider.estimateGas({
      from: fromAddress,
      to: toAddress,
      value: value,
    });
    
    // Calculate total fee
    const fee = gasPrice * gasLimit;
    
    return fee;
  } catch {
    return BigInt(21000) * BigInt(50000000000); // Default: 21000 gas * 50 gwei
  }
}

/**
 * Send SOL transaction
 */
export async function sendSolanaTransaction(params: {
  mnemonic: string;
  toAddress: string;
  amount: number; // in SOL
  accountIndex?: number;
  isTestnet?: boolean; // NEW: Testnet mode flag
}): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    const { mnemonic, toAddress, amount, accountIndex = 0, isTestnet = false } = params;

    // Import Solana web3.js dynamically
    const { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');

    // Derive keypair
    const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const fromPubkey = keypair.publicKey;
    
    // Connect to Solana (with correct network based on isTestnet flag)
    const connection = await getSolanaConnection(isTestnet);

    // Check balance with retry (RPC can sometimes return stale data)
    let balance = 0;
    let retries = 3;
    while (retries > 0) {
      try {
        balance = await connection.getBalance(fromPubkey, 'confirmed');
        // If we got a non-zero balance, we're good
        if (balance > 0) break;
        // If balance is 0, retry once more to confirm it's not a stale read
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      } catch {
        // Retry on error
      }
      retries--;
    }

    // Use Math.round() to avoid floating-point precision issues (e.g., 4003999.9999999995)
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);

    // Get fee estimate
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    const testTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: new PublicKey(toAddress),
        lamports,
      })
    );
    testTransaction.recentBlockhash = blockhash;
    testTransaction.feePayer = fromPubkey;
    
    const feeEstimate = await connection.getFeeForMessage(
      testTransaction.compileMessage(),
      'confirmed'
    );
    
    const estimatedFee = feeEstimate.value || 5000; // Default to 5000 lamports

    // Check if we have enough balance including fees
    const totalRequired = lamports + estimatedFee;

    if (balance < totalRequired) {
      // If balance is 0, it might be an RPC issue - provide a helpful message
      if (balance === 0) {
        return {
          success: false,
          signature: '',
          error: `Unable to verify balance (RPC returned 0). Your actual balance may differ. Please try again or check your wallet on Solscan.`
        };
      }

      return {
        success: false,
        signature: '',
        error: `Insufficient balance. Need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL (including fees) but have ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`
      };
    }
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: new PublicKey(toAddress),
        lamports,
      })
    );
    
    // Get recent blockhash
    const { blockhash: finalBlockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = finalBlockhash;
    transaction.feePayer = fromPubkey;

    // Sign transaction (client-side only!)
    transaction.sign(keypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash: finalBlockhash,
      lastValidBlockHeight,
    }, 'confirmed');
    
    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    return {
      success: false,
      signature: '',
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Send ETH transaction
 */
export async function sendEthereumTransaction(params: {
  mnemonic: string;
  toAddress: string;
  amount: number; // in ETH
  accountIndex?: number;
  isTestnet?: boolean; // NEW: Testnet mode flag
}): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const { mnemonic, toAddress, amount, accountIndex = 0, isTestnet = false } = params;

    const { ethers } = await import('ethers');

    // Derive wallet
    const wallet = await deriveEthereumWallet(mnemonic, accountIndex);
    
    // Connect to provider (with correct network based on isTestnet flag)
    const provider = await getEthereumProvider(isTestnet);
    const connectedWallet = wallet.connect(provider);
    
    // Check balance
    const balance = await connectedWallet.provider.getBalance(wallet.address);
    const value = ethers.parseEther(amount.toString());

    // Estimate gas
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);
    const gasLimit = BigInt(21000); // Standard ETH transfer
    const estimatedFee = gasPrice * gasLimit;

    // Check if we have enough balance including fees
    const totalRequired = value + estimatedFee;

    if (balance < totalRequired) {
      return {
        success: false,
        hash: '',
        error: `Insufficient balance. Need ${ethers.formatEther(totalRequired)} ETH (including fees) but have ${ethers.formatEther(balance)} ETH`
      };
    }

    // Send transaction
    const tx = await connectedWallet.sendTransaction({
      to: toAddress,
      value: value,
    });

    // Wait for confirmation
    await tx.wait();

    return {
      success: true,
      hash: tx.hash,
    };
  } catch (error: any) {
    return {
      success: false,
      hash: '',
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Send SPL token transaction
 */
export async function sendSPLTokenTransaction(params: {
  mnemonic: string;
  toAddress: string;
  amount: number;
  tokenMint: string;
  decimals: number;
  accountIndex?: number;
  isTestnet?: boolean; // NEW: Testnet mode flag
}): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    const { mnemonic, toAddress, amount, tokenMint, decimals, accountIndex = 0, isTestnet = false } = params;

    // TESTNET MODE: Simulate transaction
    if (isTestnet) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock signature with crypto.getRandomValues
      const randomBytes = crypto.getRandomValues(new Uint8Array(8));
      const randomHex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
      const mockSignature = `testnet_spl_${Date.now()}_${randomHex}`;

      return {
        success: true,
        signature: mockSignature,
      };
    }
    
    // MAINNET MODE: Real blockchain transaction
    const {
      Transaction,
      PublicKey,
      LAMPORTS_PER_SOL
    } = await import('@solana/web3.js');
    
    const {
      getAssociatedTokenAddress,
      createTransferInstruction,
      createTransferCheckedInstruction,
      createAssociatedTokenAccountInstruction,
      TOKEN_PROGRAM_ID,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    } = await import('@solana/spl-token');
    
    // Derive keypair
    const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const fromPubkey = keypair.publicKey;
    const walletAddress = fromPubkey.toBase58();

    // Connect to Solana (mainnet - SPL tokens only work on mainnet)
    const connection = await getSolanaConnection(false);
    
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

    // CRITICAL: Get actual decimals from the mint account to ensure accuracy
    // This overrides the passed-in decimals value to prevent "insufficient funds" errors
    const { getMint } = await import('@solana/spl-token');
    let actualDecimals = decimals;
    try {
      const mintData = await getMint(connection, mintPubkey, 'confirmed', tokenProgramId);
      actualDecimals = mintData.decimals;
      if (actualDecimals !== decimals) {
        console.log(`[Transaction] ⚠️ Decimals mismatch! Passed: ${decimals}, Actual: ${actualDecimals}. Using actual.`);
      }
    } catch (mintError) {
      console.warn('[Transaction] Could not fetch mint decimals, using provided value:', decimals);
    }
    
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
    
    // Check if recipient token account exists
    const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
    const needsTokenAccount = !toTokenAccountInfo;
    
    // Check SOL balance if we need to create token account
    if (needsTokenAccount) {
      const solBalance = await connection.getBalance(fromPubkey);

      // Get actual account size needed for this specific token
      // For Token-2022, the account might need more space for extensions
      // We'll use a very conservative estimate to ensure transaction succeeds
      let accountSize = 165; // Default token account size

      // Check if this is Token-2022
      const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
      if (mintAccountInfo && mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        // Token-2022 accounts can have extensions, use safe maximum
        // The actual rent will be determined by the program during account creation
        accountSize = 250; // Very conservative estimate that covers all Token-2022 scenarios
      }

      // Get actual rent-exempt balance required for token account
      // Use connection.getMinimumBalanceForRentExemption (Solana web3.js method)
      const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(accountSize);
      
      // Add buffer for transaction fees
      const feeBuffer = 10000; // 0.00001 SOL
      const minRequiredLamports = rentExemptBalance + feeBuffer;

      if (solBalance < minRequiredLamports) {
        const shortfall = (minRequiredLamports - solBalance) / LAMPORTS_PER_SOL;

        return {
          success: false,
          signature: '',
          error: `Insufficient SOL to create recipient token account.\n\n` +
                 `Required: ${(minRequiredLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL\n` +
                 `Current: ${(solBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n` +
                 `Short by: ${shortfall.toFixed(6)} SOL\n\n` +
                 `Please add at least ${shortfall.toFixed(6)} SOL to your wallet and try again.`
        };
      }
    }
    
    // Calculate amount in token's smallest unit using ACTUAL decimals from blockchain
    // Use Math.round() and convert to string to avoid floating-point precision issues with BigInt
    const rawAmount = amount * Math.pow(10, actualDecimals);
    const transferAmount = BigInt(Math.round(rawAmount).toString());
    console.log(`[Transaction] Transfer amount: ${amount} tokens = ${transferAmount.toString()} base units (${actualDecimals} decimals)`);

    // Check if source token account exists and has sufficient balance
    const fromTokenAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    if (!fromTokenAccountInfo) {
      throw new Error(`No tokens found. Your wallet (${walletAddress.slice(0, 8)}...) has no ${tokenMint.slice(0, 8)}... tokens on mainnet. Check Solscan to verify.`);
    }

    // Parse token account to check actual balance
    const { getAccount } = await import('@solana/spl-token');
    try {
      const tokenAccountData = await getAccount(connection, fromTokenAccount, 'confirmed', tokenProgramId);
      const actualBalance = tokenAccountData.amount;
      console.log(`[Transaction] Token account balance: ${actualBalance.toString()} base units`);

      if (actualBalance < transferAmount) {
        const actualBalanceHuman = Number(actualBalance) / Math.pow(10, actualDecimals);
        throw new Error(`Insufficient token balance. You have ${actualBalanceHuman.toFixed(6)} tokens but tried to send ${amount}`);
      }
    } catch (balanceError: any) {
      // If it's our own insufficient balance error, re-throw it
      if (balanceError.message?.includes('Insufficient token balance')) {
        throw balanceError;
      }
      // Otherwise log and continue (will fail at transaction level if balance is actually insufficient)
      console.warn('[Transaction] Could not verify token balance:', balanceError.message);
    }

    // Verify SOL balance for transaction fees
    const solBalance = await connection.getBalance(fromPubkey);
    if (solBalance === 0) {
      throw new Error('No SOL balance for transaction fees. Please deposit SOL first.');
    }

    // Create transaction
    const transaction = new Transaction();
    
    // Create recipient token account if needed
    if (needsTokenAccount) {
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
    
    // Create transfer instruction
    // Token-2022 tokens require transfer_checked which includes mint and decimals
    const isToken2022 = tokenProgramId.equals(TOKEN_2022_PROGRAM_ID);

    if (isToken2022) {
      // Use transferChecked for Token-2022 (required for tokens with extensions)
      console.log('[Transaction] Using transferChecked for Token-2022 token');
      const transferInstruction = createTransferCheckedInstruction(
        fromTokenAccount,
        mintPubkey,
        toTokenAccount,
        fromPubkey,
        transferAmount,
        actualDecimals,
        [],
        tokenProgramId
      );
      transaction.add(transferInstruction);
    } else {
      // Use regular transfer for standard SPL tokens
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        transferAmount,
        [],
        tokenProgramId
      );
      transaction.add(transferInstruction);
    }
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign transaction
    transaction.sign(keypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');
    
    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    return {
      success: false,
      signature: '',
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Send ERC20 token transaction
 */
export async function sendERC20TokenTransaction(params: {
  mnemonic: string;
  toAddress: string;
  amount: number;
  tokenAddress: string;
  decimals: number;
  accountIndex?: number;
  isTestnet?: boolean; // NEW: Testnet mode flag
}): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const { mnemonic, toAddress, amount, tokenAddress, decimals, accountIndex = 0, isTestnet = false } = params;

    // TESTNET MODE: Simulate transaction
    if (isTestnet) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock hash with crypto.getRandomValues
      const randomBytes = crypto.getRandomValues(new Uint8Array(8));
      const randomHex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
      const mockHash = `0xtestnet_erc20_${Date.now()}_${randomHex}`;

      return {
        success: true,
        hash: mockHash,
      };
    }
    
    // MAINNET MODE: Real blockchain transaction
    const { ethers } = await import('ethers');
    
    // Derive wallet
    const wallet = await deriveEthereumWallet(mnemonic, accountIndex);

    // Connect to provider
    const provider = await getEthereumProvider();
    const connectedWallet = wallet.connect(provider);
    
    // ERC20 ABI (transfer function only)
    const ERC20_ABI = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
    ];
    
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, connectedWallet);
    
    // Calculate amount in token's smallest unit
    const transferAmount = ethers.parseUnits(amount.toString(), decimals);

    // Send transaction
    const tx = await tokenContract.transfer(toAddress, transferAmount);

    // Wait for confirmation
    await tx.wait();

    return {
      success: true,
      hash: tx.hash,
    };
  } catch (error: any) {
    return {
      success: false,
      hash: '',
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Send SOL transaction using a private key directly (for private key imports)
 */
export async function sendSolanaTransactionWithPrivateKey(params: {
  privateKeyBase58: string;
  toAddress: string;
  amount: number; // in SOL
  isTestnet?: boolean;
}): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    const { privateKeyBase58, toAddress, amount, isTestnet = false } = params;

    console.log('[Transaction] 🔑 Sending SOL with private key, amount:', amount, 'isTestnet:', isTestnet);

    // Import Solana web3.js dynamically
    const { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Keypair } = await import('@solana/web3.js');
    const bs58 = await import('bs58');

    // Decode the private key from base58
    const privateKeyBytes = bs58.default.decode(privateKeyBase58);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const fromPubkey = keypair.publicKey;

    console.log('[Transaction] 📍 From address:', fromPubkey.toBase58());

    // Connect to Solana
    const connection = await getSolanaConnection(isTestnet);

    // Check balance
    const balance = await connection.getBalance(fromPubkey, 'confirmed');
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);

    // Get fee estimate
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    const testTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: new PublicKey(toAddress),
        lamports,
      })
    );
    testTransaction.recentBlockhash = blockhash;
    testTransaction.feePayer = fromPubkey;

    const feeEstimate = await connection.getFeeForMessage(
      testTransaction.compileMessage(),
      'confirmed'
    );
    const estimatedFee = feeEstimate.value || 5000;

    // Check if we have enough balance
    const totalRequired = lamports + estimatedFee;
    if (balance < totalRequired) {
      return {
        success: false,
        signature: '',
        error: `Insufficient balance. Need ${(totalRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL but have ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`
      };
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: new PublicKey(toAddress),
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash: finalBlockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = finalBlockhash;
    transaction.feePayer = fromPubkey;

    // Sign transaction
    transaction.sign(keypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash: finalBlockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    console.log('[Transaction] ✅ SOL transaction successful:', signature);

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('[Transaction] ❌ SOL transaction failed:', error);
    return {
      success: false,
      signature: '',
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Send SPL token transaction using a private key directly (for private key imports)
 */
export async function sendSPLTokenTransactionWithPrivateKey(params: {
  privateKeyBase58: string;
  toAddress: string;
  amount: number;
  tokenMint: string;
  decimals: number;
  isTestnet?: boolean;
}): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    const { privateKeyBase58, toAddress, amount, tokenMint, decimals, isTestnet = false } = params;

    console.log('[Transaction] 🔑 Sending SPL token with private key, amount:', amount, 'mint:', tokenMint);

    // TESTNET MODE: Simulate transaction
    if (isTestnet) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const randomBytes = crypto.getRandomValues(new Uint8Array(8));
      const randomHex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
      const mockSignature = `testnet_spl_pk_${Date.now()}_${randomHex}`;
      return { success: true, signature: mockSignature };
    }

    const { Transaction, PublicKey, Keypair, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    const bs58 = await import('bs58');
    const {
      getAssociatedTokenAddress,
      createTransferInstruction,
      createTransferCheckedInstruction,
      createAssociatedTokenAccountInstruction,
      TOKEN_PROGRAM_ID,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      getMint,
      getAccount,
    } = await import('@solana/spl-token');

    // Decode the private key from base58
    const privateKeyBytes = bs58.default.decode(privateKeyBase58);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const fromPubkey = keypair.publicKey;

    console.log('[Transaction] 📍 From address:', fromPubkey.toBase58());

    // Connect to Solana mainnet
    const connection = await getSolanaConnection(false);

    // Get token accounts
    const mintPubkey = new PublicKey(tokenMint);
    const toPubkey = new PublicKey(toAddress);

    // Detect the correct token program
    const mintInfo = await connection.getAccountInfo(mintPubkey);
    if (!mintInfo) {
      throw new Error('Token mint account not found');
    }

    const tokenProgramId = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

    // Get actual decimals from mint
    let actualDecimals = decimals;
    try {
      const mintData = await getMint(connection, mintPubkey, 'confirmed', tokenProgramId);
      actualDecimals = mintData.decimals;
    } catch {
      console.warn('[Transaction] Could not fetch mint decimals, using provided value');
    }

    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPubkey, fromPubkey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPubkey, toPubkey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Check if recipient token account exists
    const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
    const needsTokenAccount = !toTokenAccountInfo;

    // Check SOL balance if we need to create token account
    if (needsTokenAccount) {
      const solBalance = await connection.getBalance(fromPubkey);
      const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(165);
      const minRequired = rentExemptBalance + 10000;

      if (solBalance < minRequired) {
        return {
          success: false,
          signature: '',
          error: `Insufficient SOL to create recipient token account. Need ${(minRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL`
        };
      }
    }

    // Calculate transfer amount
    const transferAmount = BigInt(Math.round(amount * Math.pow(10, actualDecimals)));

    // Check source token account balance
    const fromTokenAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    if (!fromTokenAccountInfo) {
      throw new Error('No tokens found in your wallet for this token');
    }

    const tokenAccountData = await getAccount(connection, fromTokenAccount, 'confirmed', tokenProgramId);
    if (tokenAccountData.amount < transferAmount) {
      throw new Error(`Insufficient token balance. You have ${Number(tokenAccountData.amount) / Math.pow(10, actualDecimals)} but tried to send ${amount}`);
    }

    // Create transaction
    const transaction = new Transaction();

    if (needsTokenAccount) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, toTokenAccount, toPubkey, mintPubkey, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Add transfer instruction
    const isToken2022 = tokenProgramId.equals(TOKEN_2022_PROGRAM_ID);
    if (isToken2022) {
      transaction.add(createTransferCheckedInstruction(
        fromTokenAccount, mintPubkey, toTokenAccount, fromPubkey, transferAmount, actualDecimals, [], tokenProgramId
      ));
    } else {
      transaction.add(createTransferInstruction(
        fromTokenAccount, toTokenAccount, fromPubkey, transferAmount, [], tokenProgramId
      ));
    }

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign and send
    transaction.sign(keypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());

    await connection.confirmTransaction({
      signature, blockhash, lastValidBlockHeight,
    }, 'confirmed');

    console.log('[Transaction] ✅ SPL token transaction successful:', signature);

    return { success: true, signature };
  } catch (error: any) {
    console.error('[Transaction] ❌ SPL token transaction failed:', error);
    return {
      success: false,
      signature: '',
      error: error.message || 'Transaction failed'
    };
  }
}