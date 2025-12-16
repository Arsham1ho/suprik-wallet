/**
 * Suprik Wallet - Transaction History Utilities
 * Fetch transaction history from Solana and Ethereum blockchains
 * Also handles local swap history storage
 */

import { getHeliusApiKey, getAlchemyApiKey } from './env';

// Local storage key for swap history
const SWAP_HISTORY_KEY = 'suprik_swap_history';

// Cache for transaction history to avoid repeated API calls
const TX_CACHE_KEY = 'suprik_tx_cache';
const TX_CACHE_TTL = 60 * 1000; // 1 minute cache TTL

interface TxCache {
  data: TransactionItem[];
  timestamp: number;
  address: string;
}

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Fetch Solana transaction history with rate limiting and caching
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

    // Check cache first
    const cached = getCachedTransactions(address, network);
    if (cached) {
      return cached;
    }

    console.log('[TxHistory] Fetching Solana transactions for:', address);
    console.log('[TxHistory] Network:', isTestnet ? 'DEVNET' : 'MAINNET');

    const endpoint = isTestnet
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

    // Fetch signatures with reduced limit to avoid rate limiting
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [address, { limit: 15 }] // Reduced from 50 to 15
      })
    });

    const data = await response.json();
    const transactions: TransactionItem[] = [];

    if (data.result && Array.isArray(data.result)) {
      // Process in small batches with delays to avoid rate limiting
      const BATCH_SIZE = 3;
      const BATCH_DELAY = 500; // 500ms between batches

      for (let i = 0; i < data.result.length; i += BATCH_SIZE) {
        const batch = data.result.slice(i, i + BATCH_SIZE);

        // Process batch in parallel
        const batchPromises = batch.map(async (tx: { signature: string; blockTime: number; err: unknown }) => {
          try {
            const detailResponse = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTransaction',
                params: [tx.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
              })
            });

            const detailData = await detailResponse.json();

            if (detailData.result) {
              const txData = detailData.result;
              const meta = txData.meta;
              const accountKeys = txData.transaction?.message?.accountKeys || [];

              let userAccountIndex = 0;
              for (let j = 0; j < accountKeys.length; j++) {
                const accountKey = typeof accountKeys[j] === 'string'
                  ? accountKeys[j]
                  : accountKeys[j]?.pubkey;
                if (accountKey === address) {
                  userAccountIndex = j;
                  break;
                }
              }

              const preBalance = meta?.preBalances?.[userAccountIndex] || 0;
              const postBalance = meta?.postBalances?.[userAccountIndex] || 0;
              const balanceChange = postBalance - preBalance;

              const type = balanceChange > 0 ? 'receive' : 'send';
              const amount = Math.abs(balanceChange) / 1e9;

              let fromAddress = address;
              let toAddress = address;

              if (accountKeys.length >= 2) {
                const firstAccount = typeof accountKeys[0] === 'string'
                  ? accountKeys[0]
                  : accountKeys[0]?.pubkey;
                const secondAccount = typeof accountKeys[1] === 'string'
                  ? accountKeys[1]
                  : accountKeys[1]?.pubkey;

                if (type === 'receive') {
                  fromAddress = firstAccount || address;
                  toAddress = address;
                } else {
                  fromAddress = address;
                  toAddress = secondAccount || address;
                }
              }

              return {
                id: tx.signature,
                type,
                token: 'SOL',
                amount,
                value: 0,
                date: new Date(tx.blockTime * 1000).toISOString(),
                timestamp: new Date(tx.blockTime * 1000).toISOString(),
                status: tx.err ? 'failed' : 'confirmed',
                from: fromAddress,
                to: toAddress,
                hash: tx.signature,
                signature: tx.signature,
                network: isTestnet ? 'devnet' : 'solana',
              } as TransactionItem;
            }
            return null;
          } catch (detailError) {
            console.error('[TxHistory] Error fetching transaction details:', detailError);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        transactions.push(...batchResults.filter((tx): tx is TransactionItem => tx !== null));

        // Add delay between batches (except for last batch)
        if (i + BATCH_SIZE < data.result.length) {
          await delay(BATCH_DELAY);
        }
      }
    }

    // Cache the results
    cacheTransactions(address, network, transactions);

    console.log('[TxHistory] ✅ Fetched', transactions.length, 'Solana transactions');
    return transactions;

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