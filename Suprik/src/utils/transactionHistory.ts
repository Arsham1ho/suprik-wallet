/**
 * Saturn Wallet - Transaction History Utilities
 * Fetch transaction history from Solana and Ethereum blockchains
 */

import { getHeliusApiKey, getAlchemyApiKey } from './env';

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
 * Fetch Solana transaction history
 */
export async function fetchSolanaTransactionHistory(
  address: string,
  isTestnet: boolean = false
): Promise<TransactionItem[]> {
  try {
    console.log('[TxHistory] Fetching Solana transactions for:', address);
    console.log('[TxHistory] Network:', isTestnet ? 'DEVNET' : 'MAINNET');
    
    const apiKey = getHeliusApiKey();
    
    if (!apiKey) {
      console.warn('[TxHistory] ⚠️ No Helius API key - cannot fetch real transactions');
      return [];
    }
    
    // Use Helius Enhanced Transactions API
    const endpoint = isTestnet
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          address,
          {
            limit: 50,
          }
        ]
      })
    });
    
    const data = await response.json();
    const transactions: TransactionItem[] = [];
    
    if (data.result && Array.isArray(data.result)) {
      for (const tx of data.result) {
        // Fetch transaction details
        try {
          const detailResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getTransaction',
              params: [
                tx.signature,
                {
                  encoding: 'jsonParsed',
                  maxSupportedTransactionVersion: 0
                }
              ]
            })
          });
          
          const detailData = await detailResponse.json();
          
          if (detailData.result) {
            const txData = detailData.result;
            const meta = txData.meta;
            
            // Determine if it's a send or receive
            const preBalance = meta?.preBalances?.[0] || 0;
            const postBalance = meta?.postBalances?.[0] || 0;
            const balanceChange = postBalance - preBalance;
            
            const type = balanceChange > 0 ? 'receive' : 'send';
            const amount = Math.abs(balanceChange) / 1e9; // Convert lamports to SOL
            
            transactions.push({
              id: tx.signature,
              type,
              token: 'SOL',
              amount,
              value: 0, // Would need price data
              date: new Date(tx.blockTime * 1000).toISOString(),
              timestamp: new Date(tx.blockTime * 1000).toISOString(),
              status: tx.err ? 'failed' : 'confirmed',
              from: address,
              to: address,
              hash: tx.signature,
              signature: tx.signature,
              network: isTestnet ? 'devnet' : 'solana',
            });
          }
        } catch (detailError) {
          console.error('[TxHistory] Error fetching transaction details:', detailError);
          // Continue to next transaction
        }
      }
    }
    
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
    console.log('[TxHistory] Fetching Ethereum transactions for:', address);
    console.log('[TxHistory] Network:', isTestnet ? 'SEPOLIA' : 'MAINNET');
    
    const apiKey = getAlchemyApiKey();
    
    if (!apiKey) {
      console.warn('[TxHistory] ⚠️ No Alchemy API key - cannot fetch real transactions');
      return [];
    }
    
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
