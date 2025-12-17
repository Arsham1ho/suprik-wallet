/**
 * Suprik Wallet - Transaction History Utilities
 * Fetch transaction history from Solana and Ethereum blockchains
 * Also handles local swap history storage
 */

import { getHeliusApiKey, getAlchemyApiKey } from './env';

// Local storage key for swap history
const SWAP_HISTORY_KEY = 'suprik_swap_history';

// Cache for transaction history to avoid repeated API calls
const TX_CACHE_KEY = 'suprik_tx_cache_v5'; // v5: added correct PAI/PARAB mint addresses
const TX_CACHE_TTL = 60 * 1000; // 1 minute cache TTL

interface TxCache {
  data: TransactionItem[];
  timestamp: number;
  address: string;
}


export interface TransactionItem {
  id: string;
  type: 'send' | 'receive' | 'swap';
  token?: string; // Token symbol (for non-swap transactions)
  coin?: string; // Alternative to token
  amount: number;
  value?: number; // USD value
  date: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed' | 'confirmed';
  from?: string;
  to?: string;
  hash?: string;
  signature?: string; // Transaction signature (alternative to hash)
  network?: 'solana' | 'ethereum' | 'bitcoin' | 'mainnet' | 'devnet';
  
  // Swap-specific fields
  fromToken?: string;
  toToken?: string;
  fromAmount?: number;
  toAmount?: number;
  rate?: number;
  
  // Fee information
  fee?: number;
  feeAmount?: number;
  totalDeducted?: number;
  
  // Dev/Test mode
  isDevMode?: boolean;
}

/**
 * Get cached transaction history if valid
 */
function getCachedTransactions(address: string, network: string): TransactionItem[] | null {
  try {
    const cacheKey = `${TX_CACHE_KEY}_${network}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache: TxCache = JSON.parse(cached);
      if (cache.address === address && Date.now() - cache.timestamp < TX_CACHE_TTL) {
        console.log(`[TxHistory] Using cached ${network} transactions`);
        return cache.data;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

/**
 * Save transaction history to cache
 */
function cacheTransactions(address: string, network: string, data: TransactionItem[]): void {
  try {
    const cacheKey = `${TX_CACHE_KEY}_${network}`;
    const cache: TxCache = {
      data,
      timestamp: Date.now(),
      address,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Clear transaction cache (useful when debugging)
 */
export function clearTransactionCache(): void {
  try {
    // Clear current version
    localStorage.removeItem(`${TX_CACHE_KEY}_solana-mainnet`);
    localStorage.removeItem(`${TX_CACHE_KEY}_solana-devnet`);
    // Clear old cache versions too
    localStorage.removeItem('suprik_tx_cache_solana-mainnet');
    localStorage.removeItem('suprik_tx_cache_solana-devnet');
    localStorage.removeItem('suprik_tx_cache_v2_solana-mainnet');
    localStorage.removeItem('suprik_tx_cache_v2_solana-devnet');
    localStorage.removeItem('suprik_tx_cache_v3_solana-mainnet');
    localStorage.removeItem('suprik_tx_cache_v3_solana-devnet');
    localStorage.removeItem('suprik_tx_cache_v4_solana-mainnet');
    localStorage.removeItem('suprik_tx_cache_v4_solana-devnet');
    // Also clear local swap history that may have incorrect token symbols
    localStorage.removeItem(SWAP_HISTORY_KEY);
    console.log('[TxHistory] ✅ All cache AND local swap history cleared');
  } catch {
    // Ignore
  }
}

/**
 * Known token mint addresses to symbols mapping
 * Used when Helius doesn't return the symbol
 */
const KNOWN_TOKEN_MINTS: Record<string, string> = {
  // Native
  'So11111111111111111111111111111111111111112': 'SOL',
  // Stablecoins
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA': 'USDS',
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX': 'USDH',
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL',
  // Major tokens
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': 'JTO',
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'PYTH',
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux': 'HNT',
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': 'RNDR',
  'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6': 'TNSR',
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': 'WEN',
  'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5': 'MEW',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'WIF',
  'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS': 'KMNO',
  '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ': 'W',
  'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y': 'SHDW',
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'ORCA',
  'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey': 'MNDE',
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL',
  // Parabolic AI - actual mint addresses from user's transactions
  'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': 'PAI',  // Parabolic AI token
  '9Etc4gpfsYDdvqD291WrftqAFtaTmArxEd31pCpSLMan': 'PARAB', // Parabolic token
  // Other PAI addresses (alternate mints)
  'PAi8X9u52FgZrA8UGLBRbpP8v7WFi3Z7PU2urCbEbNs': 'PAI',
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC': 'PAI',
  '9EtchMDdm8vJnquqNBjjfFaHwPkBcMN8FHtbo8X1xCd4': 'PARAB',
  'HrkK6skGvAYZjAcPjJeZ2gNqgfSrhVy7TopKPSjKDLsY': 'PAI',
  'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs': 'GRASS',
  'LAYER4xPpTCb3QL8S9u4Mfq3cEJLBfNCtgY8UmEdpump': 'LAYER',
  'CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu': 'CLOUD',
  'FUCKuTfQVT9yCe3y7ZYPhUoMDPzYSYtMthMUKvp4DZ3q': 'GM',
  'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx': 'ATLAS',
  'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk': 'POLIS',
  'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp': 'SLND',
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac': 'MNGO',
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': 'SRM',
  'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': 'GST',
  'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT': 'STEP',
  'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6': 'KIN',
  'METAewgxyPbgwsseH8T16a39CQ5VyVxZi9zXiDPY18m': 'MPLX',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh': 'BTC',
  'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM': 'USDCet',
  '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx': 'GMT',
  'HxhWkVpk5NS4Ltg5nij2G671CKXFRKPK8vy271Fjy6Fs': 'GARI',
};

/**
 * Get token symbol from mint address
 * Helius API can return symbol in multiple fields depending on version/endpoint
 */
function getTokenSymbol(transfer: any): string {
  // Check if it's native SOL first (multiple ways to detect)
  if (transfer.tokenStandard === 'Native' ||
      transfer.mint === 'So11111111111111111111111111111111111111112' ||
      transfer.isNativeTransfer) {
    return 'SOL';
  }

  // Try to get mint address from various possible fields
  const mintAddress = transfer.mint || transfer.tokenAddress || transfer.tokenMint || transfer.address;

  // First priority: Look up in our known mints database
  if (mintAddress && KNOWN_TOKEN_MINTS[mintAddress]) {
    return KNOWN_TOKEN_MINTS[mintAddress];
  }

  // Second priority: Use symbol from API if valid
  const symbolFromAPI = transfer.symbol || transfer.tokenSymbol || transfer.name;
  if (symbolFromAPI && symbolFromAPI !== '' && symbolFromAPI !== 'Unknown' && symbolFromAPI !== 'unknown') {
    return symbolFromAPI;
  }

  // Log unknown mints for debugging (only once per mint)
  if (mintAddress && !loggedUnknownMints.has(mintAddress)) {
    console.log('[TxHistory] ⚠️ Unknown mint - add to KNOWN_TOKEN_MINTS:', mintAddress);
    loggedUnknownMints.add(mintAddress);
  }

  // Return first 4 chars of mint as fallback
  if (mintAddress) {
    return mintAddress.slice(0, 4) + '...';
  }

  return 'Token';
}

// Track logged unknown mints to avoid console spam
const loggedUnknownMints = new Set<string>();

/**
 * Fetch Solana transaction history using Helius Enhanced Transactions API
 * This API returns parsed transactions including SPL token transfers
 */
export async function fetchSolanaTransactionHistory(
  address: string,
  isTestnet: boolean = false
): Promise<TransactionItem[]> {
  try {
    const apiKey = getHeliusApiKey();
    const network = isTestnet ? 'solana-devnet' : 'solana-mainnet';

    if (!apiKey) {
      console.log('[TxHistory] ℹ️ Helius API key not configured - transaction history not available');
      return [];
    }

    // Check cache first (but use short TTL)
    const cached = getCachedTransactions(address, network);
    if (cached) {
      return cached;
    }

    console.log('[TxHistory] Fetching Solana transactions for:', address);
    console.log('[TxHistory] Network:', isTestnet ? 'DEVNET' : 'MAINNET');

    // Use Helius Enhanced Transactions API - returns parsed token transfers!
    const baseUrl = isTestnet
      ? `https://api-devnet.helius.xyz/v0/addresses/${address}/transactions`
      : `https://api.helius.xyz/v0/addresses/${address}/transactions`;

    const response = await fetch(`${baseUrl}?api-key=${apiKey}&limit=50`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('[TxHistory] Helius API error:', response.status);
      return [];
    }

    const data = await response.json();
    const transactions: TransactionItem[] = [];
    const processedSignatures = new Set<string>(); // Avoid duplicates

    console.log('[TxHistory] Raw API response:', data.length, 'transactions');

    if (Array.isArray(data)) {
      for (const tx of data) {
        try {
          const timestamp = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString();
          const signature = tx.signature;
          const txType = tx.type; // SWAP, TRANSFER, UNKNOWN, etc.

          // Skip if already processed this signature
          if (processedSignatures.has(signature)) continue;

          console.log('[TxHistory] Processing tx:', { signature: signature.slice(0, 8), type: txType, tokenTransfers: tx.tokenTransfers?.length, nativeTransfers: tx.nativeTransfers?.length });

          // Detect if this is a swap transaction
          // A swap is when user sends one token and receives another in the same transaction
          const tokenTransfers = tx.tokenTransfers || [];
          const nativeTransfers = tx.nativeTransfers || [];

          // Find all tokens sent and received by user
          const sentTokens = tokenTransfers.filter((t: any) => t.fromUserAccount === address && (t.tokenAmount || 0) > 0);
          const receivedTokens = tokenTransfers.filter((t: any) => t.toUserAccount === address && (t.tokenAmount || 0) > 0);

          // Check native SOL transfers too
          const sentSOL = nativeTransfers.find((t: any) => t.fromUserAccount === address && t.amount > 10000); // > 0.00001 SOL
          const receivedSOL = nativeTransfers.find((t: any) => t.toUserAccount === address && t.amount > 10000);

          // Determine if this is a swap:
          // 1. Helius marks it as SWAP, OR
          // 2. User sent one token and received a different token in same tx
          const isSwapByType = txType === 'SWAP';
          const isSwapByTransfers = (sentTokens.length > 0 && receivedTokens.length > 0) ||
                                    (sentTokens.length > 0 && receivedSOL) ||
                                    (sentSOL && receivedTokens.length > 0);

          if (isSwapByType || isSwapByTransfers) {
            // Find the main sent and received transfers
            let sentTransfer = sentTokens[0];
            let receivedTransfer = receivedTokens[0];

            // If no token sent but SOL was sent
            if (!sentTransfer && sentSOL) {
              sentTransfer = { tokenStandard: 'Native', symbol: 'SOL', tokenAmount: sentSOL.amount / 1e9, mint: 'So11111111111111111111111111111111111111112' };
            }
            // If no token received but SOL was received
            if (!receivedTransfer && receivedSOL) {
              receivedTransfer = { tokenStandard: 'Native', symbol: 'SOL', tokenAmount: receivedSOL.amount / 1e9, mint: 'So11111111111111111111111111111111111111112' };
            }

            if (sentTransfer && receivedTransfer) {
              const fromToken = getTokenSymbol(sentTransfer);
              const toToken = getTokenSymbol(receivedTransfer);

              // Make sure it's actually different tokens (not just internal transfers)
              if (fromToken !== toToken || sentTransfer.mint !== receivedTransfer.mint) {
                transactions.push({
                  id: signature,
                  type: 'swap',
                  token: fromToken,
                  amount: sentTransfer.tokenAmount || 0,
                  date: timestamp,
                  timestamp,
                  status: tx.transactionError ? 'failed' : 'confirmed',
                  signature,
                  network: isTestnet ? 'devnet' : 'solana',
                  fromToken,
                  toToken,
                  fromAmount: sentTransfer.tokenAmount || 0,
                  toAmount: receivedTransfer.tokenAmount || 0,
                  from: address,
                });
                processedSignatures.add(signature);
                continue;
              }
            }
          }

          // Handle TOKEN transfers (SPL tokens like BONK, RAY, USDC, etc.)
          // Only process if this wasn't already handled as a swap
          if (tokenTransfers.length > 0 && !processedSignatures.has(signature)) {
            for (const transfer of tokenTransfers) {
              const isReceive = transfer.toUserAccount === address;
              const isSend = transfer.fromUserAccount === address;
              const amount = transfer.tokenAmount || 0;

              // Skip zero-amount transfers
              if (amount <= 0) continue;

              if (isReceive || isSend) {
                const tokenSymbol = getTokenSymbol(transfer);
                const txId = `${signature}_${transfer.mint || 'token'}`;

                if (!processedSignatures.has(txId)) {
                  transactions.push({
                    id: txId,
                    type: isReceive ? 'receive' : 'send',
                    token: tokenSymbol,
                    amount,
                    date: timestamp,
                    timestamp,
                    status: tx.transactionError ? 'failed' : 'confirmed',
                    from: transfer.fromUserAccount || 'Unknown',
                    to: transfer.toUserAccount || 'Unknown',
                    signature,
                    network: isTestnet ? 'devnet' : 'solana',
                  });
                  processedSignatures.add(txId);
                }
              }
            }
          }

          // Handle native SOL transfers (only if no token transfers were processed)
          if (tx.nativeTransfers && tx.nativeTransfers.length > 0 && !processedSignatures.has(signature)) {
            // Find the main transfer (largest amount, involving user)
            const userTransfers = tx.nativeTransfers.filter((t: any) =>
              (t.toUserAccount === address || t.fromUserAccount === address) && t.amount > 0
            );

            if (userTransfers.length > 0) {
              // Get the largest transfer
              const mainTransfer = userTransfers.reduce((max: any, t: any) =>
                t.amount > (max?.amount || 0) ? t : max, null);

              if (mainTransfer && mainTransfer.amount > 5000) { // Skip tiny amounts (< 0.000005 SOL, likely fees)
                const isReceive = mainTransfer.toUserAccount === address;
                const amount = mainTransfer.amount / 1e9;

                transactions.push({
                  id: `${signature}_sol`,
                  type: isReceive ? 'receive' : 'send',
                  token: 'SOL',
                  amount,
                  date: timestamp,
                  timestamp,
                  status: tx.transactionError ? 'failed' : 'confirmed',
                  from: mainTransfer.fromUserAccount || 'Unknown',
                  to: mainTransfer.toUserAccount || 'Unknown',
                  signature,
                  network: isTestnet ? 'devnet' : 'solana',
                });
                processedSignatures.add(signature);
              }
            }
          }
        } catch (parseError) {
          console.error('[TxHistory] Error parsing transaction:', parseError);
        }
      }
    }

    // Filter out very small amounts that are just fees
    const filteredTransactions = transactions.filter(tx => {
      if (tx.type === 'swap') return true; // Keep all swaps
      if (tx.token === 'SOL' && tx.amount < 0.00001) return false; // Filter tiny SOL
      return tx.amount > 0; // Keep all non-zero amounts
    });

    // Cache the results
    cacheTransactions(address, network, filteredTransactions);

    console.log('[TxHistory] ✅ Fetched', filteredTransactions.length, 'Solana transactions (including tokens)');
    return filteredTransactions;

  } catch (error) {
    console.error('[TxHistory] Error fetching Solana history:', error);
    return [];
  }
}

/**
 * Fetch Ethereum transaction history
 */
export async function fetchEthereumTransactionHistory(
  address: string,
  isTestnet: boolean = false
): Promise<TransactionItem[]> {
  try {
    const apiKey = getAlchemyApiKey();
    
    if (!apiKey) {
      // Silently return empty - API key is optional
      console.log('[TxHistory] ℹ️ Alchemy API key not configured - transaction history not available');
      return [];
    }
    
    console.log('[TxHistory] Fetching Ethereum transactions for:', address);
    console.log('[TxHistory] Network:', isTestnet ? 'SEPOLIA' : 'MAINNET');
    
    // Use correct network
    const network = isTestnet ? 'sepolia' : 'mainnet';
    
    // Use Alchemy Asset Transfers API
    const response = await fetch(`https://eth-${network}.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toAddress: address,
          category: ['external', 'internal', 'erc20', 'erc721'],
          maxCount: '0x32', // 50 transactions
          order: 'desc',
        }]
      })
    });
    
    const data = await response.json();
    const transactions: TransactionItem[] = [];
    
    if (data.result?.transfers) {
      for (const transfer of data.result.transfers) {
        transactions.push({
          id: transfer.hash,
          type: transfer.to?.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
          token: transfer.asset || 'ETH',
          amount: parseFloat(transfer.value || '0'),
          value: 0, // Would need price data
          date: new Date().toISOString(), // Alchemy doesn't return timestamp in this endpoint
          timestamp: new Date().toISOString(),
          status: 'confirmed',
          from: transfer.from,
          to: transfer.to,
          hash: transfer.hash,
          signature: transfer.hash,
          network: 'ethereum',
        });
      }
    }
    
    console.log('[TxHistory] ✅ Fetched', transactions.length, 'Ethereum transactions');
    return transactions;
    
  } catch (error) {
    console.error('[TxHistory] Error fetching Ethereum history:', error);
    return [];
  }
}

/**
 * Fetch all transaction history
 */
export async function fetchAllTransactionHistory(
  addresses: {
    solana: string;
    ethereum: string;
  },
  isTestnet: boolean = false
): Promise<TransactionItem[]> {
  console.log('[TxHistory] 🚀 Fetching transaction history...');
  console.log('[TxHistory] Mode:', isTestnet ? 'TESTNET' : 'MAINNET');
  
  const [solanaTxs, ethTxs] = await Promise.all([
    fetchSolanaTransactionHistory(addresses.solana, isTestnet),
    fetchEthereumTransactionHistory(addresses.ethereum, isTestnet),
  ]);
  
  // Combine and sort by date
  const allTransactions = [...solanaTxs, ...ethTxs].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  console.log('[TxHistory] ✅ Total transactions:', allTransactions.length);
  return allTransactions;
}

/**
 * Save a swap transaction to local storage
 */
export function saveSwapToHistory(swap: {
  signature: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate?: number;
  fee?: number;
  feeAmount?: number;
  walletAddress: string;
}): void {
  try {
    const history = getLocalSwapHistory();

    const newSwap: TransactionItem = {
      id: swap.signature,
      type: 'swap',
      token: swap.fromToken,
      amount: swap.fromAmount,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      signature: swap.signature,
      network: 'solana',
      fromToken: swap.fromToken,
      toToken: swap.toToken,
      fromAmount: swap.fromAmount,
      toAmount: swap.toAmount,
      rate: swap.rate,
      fee: swap.fee,
      feeAmount: swap.feeAmount,
      from: swap.walletAddress,
    };

    // Add to beginning of array (most recent first)
    history.unshift(newSwap);

    // Keep only last 100 swaps
    const trimmed = history.slice(0, 100);

    localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(trimmed));
    console.log('[TxHistory] ✅ Saved swap to history:', swap.fromToken, '→', swap.toToken);

    // Dispatch event to notify Activity page
    window.dispatchEvent(new CustomEvent('swapHistoryUpdated'));
  } catch (error) {
    console.error('[TxHistory] Error saving swap to history:', error);
  }
}

/**
 * Get local swap history from storage
 */
export function getLocalSwapHistory(): TransactionItem[] {
  try {
    const stored = localStorage.getItem(SWAP_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[TxHistory] Error reading swap history:', error);
  }
  return [];
}

/**
 * Clear local swap history
 */
export function clearSwapHistory(): void {
  localStorage.removeItem(SWAP_HISTORY_KEY);
  console.log('[TxHistory] Cleared swap history');
}