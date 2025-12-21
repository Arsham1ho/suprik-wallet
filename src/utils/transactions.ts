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

  // Log the derived address for debugging
  console.log('[deriveSolanaKeypair] Derived address:', keypair.publicKey.toBase58());

  return keypair;
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
    console.log('[Transactions] 🔗 Connecting to Solana via Helius:', isTestnet ? 'DEVNET' : 'MAINNET');
  } else {
    // Fallback to public RPC (rate limited but works)
    endpoint = isTestnet
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    console.warn('[Transactions] ⚠️ No Helius API key found, using public RPC (rate limited)');
    console.log('[Transactions] 💡 Tip: Add VITE_HELIUS_API_KEY to .env.local for better performance');
    console.log('[Transactions] 🔗 Connecting to Solana via public RPC:', isTestnet ? 'DEVNET' : 'MAINNET');
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
    console.log('[Transactions] 🔗 Connecting to Ethereum via Alchemy:', network.toUpperCase());
  } else {
    // Fallback to public RPC (rate limited but works)
    endpoint = isTestnet
      ? 'https://rpc.sepolia.org'
      : 'https://cloudflare-eth.com';
    console.warn('[Transactions] ⚠️ No Alchemy API key found, using public RPC (rate limited)');
    console.log('[Transactions] 💡 Tip: Add VITE_ALCHEMY_API_KEY to .env.local for better performance');
    console.log('[Transactions] 🔗 Connecting to Ethereum via public RPC:', network.toUpperCase());
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
  } catch (error) {
    console.error('[Transactions] Error estimating Solana fee:', error);
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
  } catch (error) {
    console.error('[Transactions] Error estimating Ethereum fee:', error);
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
    
    console.log('[Transactions] 🚀 Sending SOL transaction...');
    console.log('[Transactions] Mode:', isTestnet ? 'TESTNET (Devnet)' : 'MAINNET');
    console.log('[Transactions] To:', toAddress);
    console.log('[Transactions] Amount:', amount, 'SOL');
    
    // Import Solana web3.js dynamically
    const { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    
    // Derive keypair
    const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const fromPubkey = keypair.publicKey;
    
    console.log('[Transactions] From:', fromPubkey.toBase58());
    
    // Connect to Solana (with correct network based on isTestnet flag)
    const connection = await getSolanaConnection(isTestnet);

    // Check balance with retry (RPC can sometimes return stale data)
    let balance = 0;
    let retries = 3;
    while (retries > 0) {
      try {
        balance = await connection.getBalance(fromPubkey, 'confirmed');
        console.log('[Transactions] Balance check attempt', 4 - retries, ':', balance / LAMPORTS_PER_SOL, 'SOL');
        // If we got a non-zero balance, we're good
        if (balance > 0) break;
        // If balance is 0, retry once more to confirm it's not a stale read
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      } catch (e) {
        console.warn('[Transactions] Balance check error, retrying...', e);
      }
      retries--;
    }

    const lamports = amount * LAMPORTS_PER_SOL;

    console.log('[Transactions] Current balance:', balance / LAMPORTS_PER_SOL, 'SOL');
    console.log('[Transactions] Sending:', lamports / LAMPORTS_PER_SOL, 'SOL');
    
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
    console.log('[Transactions] Estimated fee:', estimatedFee / LAMPORTS_PER_SOL, 'SOL');
    
    // Check if we have enough balance including fees
    const totalRequired = lamports + estimatedFee;
    console.log('[Transactions] Total required:', totalRequired / LAMPORTS_PER_SOL, 'SOL');
    
    if (balance < totalRequired) {
      const shortfall = (totalRequired - balance) / LAMPORTS_PER_SOL;
      console.error('[Transactions] Insufficient balance. Short by:', shortfall, 'SOL');

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
    
    console.log('[Transactions] ✍️ Signing transaction...');
    
    // Sign transaction (client-side only!)
    transaction.sign(keypair);
    
    console.log('[Transactions] 📡 Broadcasting transaction...');
    
    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log('[Transactions] Transaction sent:', signature);
    console.log('[Transactions] ⏳ Waiting for confirmation...');
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash: finalBlockhash,
      lastValidBlockHeight,
    }, 'confirmed');
    
    console.log('[Transactions] ✅ Transaction confirmed!');
    
    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('[Transactions] ❌ Error sending SOL:', error);
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
    
    console.log('[Transactions] 🚀 Sending ETH transaction...');
    console.log('[Transactions] Mode:', isTestnet ? 'TESTNET (Sepolia)' : 'MAINNET');
    console.log('[Transactions] To:', toAddress);
    console.log('[Transactions] Amount:', amount, 'ETH');
    
    const { ethers } = await import('ethers');
    
    // Derive wallet
    const wallet = await deriveEthereumWallet(mnemonic, accountIndex);
    
    console.log('[Transactions] From:', wallet.address);
    
    // Connect to provider (with correct network based on isTestnet flag)
    const provider = await getEthereumProvider(isTestnet);
    const connectedWallet = wallet.connect(provider);
    
    // Check balance
    const balance = await connectedWallet.provider.getBalance(wallet.address);
    const value = ethers.parseEther(amount.toString());
    
    console.log('[Transactions] Current balance:', ethers.formatEther(balance), 'ETH');
    console.log('[Transactions] Sending:', ethers.formatEther(value), 'ETH');
    
    // Estimate gas
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);
    const gasLimit = BigInt(21000); // Standard ETH transfer
    const estimatedFee = gasPrice * gasLimit;
    
    console.log('[Transactions] Estimated fee:', ethers.formatEther(estimatedFee), 'ETH');
    
    // Check if we have enough balance including fees
    const totalRequired = value + estimatedFee;
    
    if (balance < totalRequired) {
      console.error('[Transactions] Insufficient balance');
      return {
        success: false,
        hash: '',
        error: `Insufficient balance. Need ${ethers.formatEther(totalRequired)} ETH (including fees) but have ${ethers.formatEther(balance)} ETH`
      };
    }
    
    console.log('[Transactions] ✍️ Signing and sending transaction...');
    
    // Send transaction
    const tx = await connectedWallet.sendTransaction({
      to: toAddress,
      value: value,
    });
    
    console.log('[Transactions] Transaction sent:', tx.hash);
    console.log('[Transactions] ⏳ Waiting for confirmation...');
    
    // Wait for confirmation
    await tx.wait();
    
    console.log('[Transactions] ✅ Transaction confirmed!');
    
    return {
      success: true,
      hash: tx.hash,
    };
  } catch (error: any) {
    console.error('[Transactions] ❌ Error sending ETH:', error);
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
    
    console.log('[Transactions] 🚀 Sending SPL token...');
    console.log('[Transactions] Mode:', isTestnet ? 'TESTNET' : 'MAINNET');
    console.log('[Transactions] Token:', tokenMint);
    console.log('[Transactions] To:', toAddress);
    console.log('[Transactions] Amount:', amount);
    
    // TESTNET MODE: Simulate transaction
    if (isTestnet) {
      console.log('[Transactions] ✅ TESTNET MODE: Simulating transaction...');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock signature
      const mockSignature = `testnet_spl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      console.log('[Transactions] ✅ TESTNET transaction simulated successfully!');
      console.log('[Transactions] Mock Signature:', mockSignature);
      
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
      createAssociatedTokenAccountInstruction,
      TOKEN_PROGRAM_ID,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    } = await import('@solana/spl-token');
    
    // Derive keypair
    const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const fromPubkey = keypair.publicKey;
    const walletAddress = fromPubkey.toBase58();

    console.log('[Transactions] From wallet:', walletAddress);
    console.log('[Transactions] ℹ️ Verify this address matches your wallet on Solscan.io');

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
    
    console.log('[Transactions] Token program:', tokenProgramId.toBase58());
    
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
        console.log('[Transactions] Token-2022 detected');
        // Token-2022 accounts can have extensions, use safe maximum
        // The actual rent will be determined by the program during account creation
        accountSize = 250; // Very conservative estimate that covers all Token-2022 scenarios
        console.log('[Transactions] Using safe maximum size for Token-2022:', accountSize, 'bytes');
      } else {
        console.log('[Transactions] Standard SPL Token detected, using 165 bytes');
      }

      // Get actual rent-exempt balance required for token account
      // Use connection.getMinimumBalanceForRentExemption (Solana web3.js method)
      const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(accountSize);
      
      // Add buffer for transaction fees
      const feeBuffer = 10000; // 0.00001 SOL
      const minRequiredLamports = rentExemptBalance + feeBuffer;
      
      console.log('[Transactions] ====== RENT CALCULATION ======');
      console.log('[Transactions] SOL balance:', solBalance / LAMPORTS_PER_SOL, 'SOL', `(${solBalance} lamports)`);
      console.log('[Transactions] Account size:', accountSize, 'bytes');
      console.log('[Transactions] Rent-exempt minimum:', rentExemptBalance / LAMPORTS_PER_SOL, 'SOL', `(${rentExemptBalance} lamports)`);
      console.log('[Transactions] Fee buffer:', feeBuffer / LAMPORTS_PER_SOL, 'SOL', `(${feeBuffer} lamports)`);
      console.log('[Transactions] Total required:', minRequiredLamports / LAMPORTS_PER_SOL, 'SOL', `(${minRequiredLamports} lamports)`);
      console.log('[Transactions] ============================');
      
      if (solBalance < minRequiredLamports) {
        const shortfall = (minRequiredLamports - solBalance) / LAMPORTS_PER_SOL;
        console.error('[Transactions] ❌ Insufficient SOL! Short by:', shortfall, 'SOL');
        
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
      
      console.log('[Transactions] ✅ Sufficient SOL balance for token account creation');
      console.log('[Transactions] ℹ️ Recipient token account does not exist, will create it');
    }
    
    // Calculate amount in token's smallest unit
    const transferAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    
    console.log('[Transactions] From token account:', fromTokenAccount.toBase58());
    console.log('[Transactions] To token account:', toTokenAccount.toBase58());
    console.log('[Transactions] Transfer amount:', transferAmount.toString());

    // Check if source token account exists and has balance
    const fromTokenAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    if (!fromTokenAccountInfo) {
      console.error('[Transactions] ❌ Source token account does not exist!');
      console.error('[Transactions] Wallet address:', walletAddress);
      console.error('[Transactions] This usually means:');
      console.error('[Transactions] 1. You have never received this token on MAINNET');
      console.error('[Transactions] 2. OR your tokens are on DEVNET (testnet)');
      console.error('[Transactions] 3. Check your wallet at: https://solscan.io/account/' + walletAddress);
      throw new Error(`No tokens found. Your wallet (${walletAddress.slice(0, 8)}...) has no ${tokenMint.slice(0, 8)}... tokens on mainnet. Check Solscan to verify.`);
    }

    // Verify SOL balance for transaction fees
    const solBalance = await connection.getBalance(fromPubkey);
    console.log('[Transactions] SOL balance for fees:', solBalance / LAMPORTS_PER_SOL, 'SOL');
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
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      transferAmount,
      [],
      tokenProgramId
    );
    
    transaction.add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;
    
    console.log('[Transactions] ✍️ Signing transaction...');
    
    // Sign transaction
    transaction.sign(keypair);
    
    console.log('[Transactions] 📡 Broadcasting transaction...');
    
    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log('[Transactions] Transaction sent:', signature);
    console.log('[Transactions] ⏳ Waiting for confirmation...');
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');
    
    console.log('[Transactions] ✅ Transaction confirmed!');
    
    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('[Transactions] ❌ Error sending SPL token:', error);
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
    
    console.log('[Transactions] 🚀 Sending ERC20 token...');
    console.log('[Transactions] Mode:', isTestnet ? 'TESTNET' : 'MAINNET');
    console.log('[Transactions] Token:', tokenAddress);
    console.log('[Transactions] To:', toAddress);
    console.log('[Transactions] Amount:', amount);
    
    // TESTNET MODE: Simulate transaction
    if (isTestnet) {
      console.log('[Transactions] ✅ TESTNET MODE: Simulating transaction...');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock hash
      const mockHash = `0xtestnet_erc20_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      console.log('[Transactions] ✅ TESTNET transaction simulated successfully!');
      console.log('[Transactions] Mock Hash:', mockHash);
      
      return {
        success: true,
        hash: mockHash,
      };
    }
    
    // MAINNET MODE: Real blockchain transaction
    const { ethers } = await import('ethers');
    
    // Derive wallet
    const wallet = await deriveEthereumWallet(mnemonic, accountIndex);
    
    console.log('[Transactions] From:', wallet.address);
    
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
    
    console.log('[Transactions] Transfer amount:', transferAmount.toString());
    
    console.log('[Transactions] ✍️ Signing and sending transaction...');
    
    // Send transaction
    const tx = await tokenContract.transfer(toAddress, transferAmount);
    
    console.log('[Transactions] Transaction sent:', tx.hash);
    console.log('[Transactions] ⏳ Waiting for confirmation...');
    
    // Wait for confirmation
    await tx.wait();
    
    console.log('[Transactions] ✅ Transaction confirmed!');
    
    return {
      success: true,
      hash: tx.hash,
    };
  } catch (error: any) {
    console.error('[Transactions] ❌ Error sending ERC20 token:', error);
    return {
      success: false,
      hash: '',
      error: error.message || 'Transaction failed'
    };
  }
}