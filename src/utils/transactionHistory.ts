/**
 * Suprik Wallet - Transaction History Utilities
 * Fetch transaction history from Solana and Ethereum blockchains
 * Also handles local swap history storage
 */

import { getHeliusApiKey, getAlchemyApiKey } from './env';

// Local storage key for swap history
const SWAP_HISTORY_KEY = 'suprik_swap_history';

// Cache for transaction history to avoid repeated API calls
const TX_CACHE_KEY = 'suprik_tx_cache_v12'; // v12: fetch token account transactions for complete history
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
    for (let v = 2; v <= 12; v++) {
      localStorage.removeItem(`suprik_tx_cache_v${v}_solana-mainnet`);
      localStorage.removeItem(`suprik_tx_cache_v${v}_solana-devnet`);
    }
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
  // Pump.fun tokens
  'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump': 'PUMP',
  '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump': 'PNUT',
  '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump': 'FARTCOIN',
  'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump': 'GOAT',
  'GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump': 'ACT',
  'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump': 'CHILLGUY',
  'BAGE9SrkSGQMsCxvYWg7gxHbFy9HGKqX4nSguLMAppump': 'ZEREBRO',
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

  // Check if it's a pump.fun token (mint ends with 'pump')
  // Most pump.fun tokens have recognizable mints but unknown symbols
  if (mintAddress && mintAddress.toLowerCase().endsWith('pump')) {
    // Try to get the name from the API response as fallback
    const nameFromAPI = transfer.name || transfer.tokenName;
    if (nameFromAPI && nameFromAPI.length <= 20) {
      return nameFromAPI.toUpperCase();
    }
    // Return a shortened mint as last resort for pump.fun tokens
    return mintAddress.slice(0, 4).toUpperCase();
  }

  // Log unknown mints for debugging (only once per mint)
  if (mintAddress && !loggedUnknownMints.has(mintAddress)) {
    console.log('[TxHistory] ⚠️ Unknown mint - add to KNOWN_TOKEN_MINTS:', mintAddress);
    loggedUnknownMints.add(mintAddress);
  }

  // Return "TOKEN" for unknown tokens instead of truncated mint (cleaner display)
  return 'TOKEN';
}

// Track logged unknown mints to avoid console spam
const loggedUnknownMints = new Set<string>();

/**
 * Known DEX/Swap program IDs for detecting swap transactions
 */
const SWAP_PROGRAM_IDS = [
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',  // Jupiter v6
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',  // Jupiter v4
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', // Orca Whirlpool
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca v2
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', // Raydium CPMM
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM v4
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',  // Meteora DLMM
];

/**
 * Fetch Solana transaction history using public RPC (fallback when no Helius API key)
 * Uses getSignaturesForAddress and getParsedTransaction
 * Enhanced to detect swaps via token balance changes
 */
async function fetchSolanaTransactionHistoryViaRPC(
  address: string,
  isTestnet: boolean = false
): Promise<TransactionItem[]> {
  try {
    const rpcUrl = isTestnet
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    const networkName = isTestnet ? 'solana-devnet' : 'solana-mainnet';

    // Check cache first
    const cached = getCachedTransactions(address, networkName);
    if (cached) {
      return cached;
    }

    console.log('[TxHistory] Fetching via public RPC for:', address);

    // Step 1: Get user's token accounts to fetch their transactions too
    // This is important because SPL token transfers go through the token account, not the wallet directly
    let tokenAccountAddresses: string[] = [];
    try {
      const tokenAccountsResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            address,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed' }
          ]
        })
      });
      const tokenAccountsData = await tokenAccountsResponse.json();
      if (tokenAccountsData.result?.value) {
        tokenAccountAddresses = tokenAccountsData.result.value.map((acc: any) => acc.pubkey);
        console.log('[TxHistory] Found', tokenAccountAddresses.length, 'token accounts');
      }
    } catch (e) {
      console.log('[TxHistory] Could not fetch token accounts:', e);
    }

    // Step 2: Get recent signatures for the wallet address
    const signaturesResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [address, { limit: 100 }]
      })
    });

    const signaturesData = await signaturesResponse.json();
    const allSignatures = new Set<string>();

    if (signaturesData.result) {
      for (const s of signaturesData.result) {
        allSignatures.add(s.signature);
      }
    }

    // Step 3: Also get signatures for each token account (to catch token transfers)
    // Limit to first 5 token accounts to avoid rate limits
    for (const tokenAccount of tokenAccountAddresses.slice(0, 5)) {
      try {
        const tokenSigsResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [tokenAccount, { limit: 30 }]
          })
        });
        const tokenSigsData = await tokenSigsResponse.json();
        if (tokenSigsData.result) {
          for (const s of tokenSigsData.result) {
            allSignatures.add(s.signature);
          }
        }
      } catch {
        // Ignore individual token account errors
      }
    }

    if (allSignatures.size === 0) {
      console.log('[TxHistory] No transactions found via RPC');
      return [];
    }

    const signatures = Array.from(allSignatures);
    console.log('[TxHistory] Found', signatures.length, 'total signatures via RPC');

    // Step 4: Fetch parsed transactions in batches (to avoid rate limits)
    const transactions: TransactionItem[] = [];
    const processedSignatures = new Set<string>();
    const batchSize = 5;

    // Process up to 100 signatures to get more history
    for (let i = 0; i < Math.min(signatures.length, 100); i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);

      const txResponses = await Promise.all(batch.map(async (sig: string) => {
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getParsedTransaction',
              params: [sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
            })
          });
          const data = await response.json();
          return { signature: sig, tx: data.result };
        } catch {
          return { signature: sig, tx: null };
        }
      }));

      for (const { signature, tx } of txResponses) {
        if (!tx || !tx.meta || processedSignatures.has(signature)) continue;
        processedSignatures.add(signature);

        try {
          const timestamp = tx.blockTime
            ? new Date(tx.blockTime * 1000).toISOString()
            : new Date().toISOString();
          const status = tx.meta.err ? 'failed' : 'confirmed';

          // Check if this is a swap by looking at involved programs
          const accountKeys = tx.transaction?.message?.accountKeys || [];
          const isSwap = accountKeys.some((acc: any) => {
            const pubkey = typeof acc === 'string' ? acc : acc.pubkey;
            return SWAP_PROGRAM_IDS.includes(pubkey);
          });

          // Parse token balance changes from preTokenBalances and postTokenBalances
          const preTokenBalances = tx.meta.preTokenBalances || [];
          const postTokenBalances = tx.meta.postTokenBalances || [];

          // Build a map of token balance changes for the user
          const tokenChanges: Map<string, { mint: string; change: number; decimals: number }> = new Map();

          // Find user's token accounts and calculate changes
          for (const post of postTokenBalances) {
            if (post.owner === address) {
              const mint = post.mint;
              const postAmount = parseFloat(post.uiTokenAmount?.uiAmountString || '0');
              const pre = preTokenBalances.find((p: any) => p.accountIndex === post.accountIndex);
              const preAmount = pre ? parseFloat(pre.uiTokenAmount?.uiAmountString || '0') : 0;
              const change = postAmount - preAmount;

              // Keep all token changes (even tiny amounts like 0.00001 USDC)
              if (Math.abs(change) > 0) {
                tokenChanges.set(mint, {
                  mint,
                  change,
                  decimals: post.uiTokenAmount?.decimals || 9
                });
              }
            }
          }

          // Also check preTokenBalances for accounts that may have been closed
          for (const pre of preTokenBalances) {
            if (pre.owner === address && !tokenChanges.has(pre.mint)) {
              const post = postTokenBalances.find((p: any) => p.accountIndex === pre.accountIndex);
              const preAmount = parseFloat(pre.uiTokenAmount?.uiAmountString || '0');
              const postAmount = post ? parseFloat(post.uiTokenAmount?.uiAmountString || '0') : 0;
              const change = postAmount - preAmount;

              // Keep all token changes (even tiny amounts)
              if (Math.abs(change) > 0) {
                tokenChanges.set(pre.mint, {
                  mint: pre.mint,
                  change,
                  decimals: pre.uiTokenAmount?.decimals || 9
                });
              }
            }
          }

          // Parse SOL balance changes
          const preBalances = tx.meta.preBalances || [];
          const postBalances = tx.meta.postBalances || [];
          const userAccountIndex = accountKeys.findIndex((acc: any) => {
            const pubkey = typeof acc === 'string' ? acc : acc.pubkey;
            return pubkey === address;
          });

          let solChange = 0;
          if (userAccountIndex >= 0 && preBalances[userAccountIndex] !== undefined) {
            const preBal = preBalances[userAccountIndex] / 1e9;
            const postBal = postBalances[userAccountIndex] / 1e9;
            solChange = postBal - preBal;
          }

          // Detect swap: user loses one token and gains another (or SOL)
          const increases = Array.from(tokenChanges.values()).filter(t => t.change > 0);
          const decreases = Array.from(tokenChanges.values()).filter(t => t.change < 0);

          // Include SOL in swap detection
          if (solChange > 0.001) {
            increases.push({ mint: 'So11111111111111111111111111111111111111112', change: solChange, decimals: 9 });
          } else if (solChange < -0.001) {
            decreases.push({ mint: 'So11111111111111111111111111111111111111112', change: solChange, decimals: 9 });
          }

          if (isSwap && increases.length > 0 && decreases.length > 0) {
            // This is a swap transaction
            const fromToken = decreases[0];
            const toToken = increases[0];
            const fromSymbol = KNOWN_TOKEN_MINTS[fromToken.mint] || 'TOKEN';
            const toSymbol = KNOWN_TOKEN_MINTS[toToken.mint] || 'TOKEN';

            console.log('[TxHistory] 🔄 RPC detected SWAP:', Math.abs(fromToken.change), fromSymbol, '→', toToken.change, toSymbol);

            transactions.push({
              id: signature,
              type: 'swap',
              token: fromSymbol,
              amount: Math.abs(fromToken.change),
              date: timestamp,
              timestamp,
              status,
              signature,
              network: isTestnet ? 'devnet' : 'solana',
              fromToken: fromSymbol,
              toToken: toSymbol,
              fromAmount: Math.abs(fromToken.change),
              toAmount: toToken.change,
              from: address,
            });
          } else if (tokenChanges.size > 0) {
            // Regular token transfers
            for (const [mint, data] of tokenChanges) {
              const tokenSymbol = KNOWN_TOKEN_MINTS[mint] || 'TOKEN';
              const isReceive = data.change > 0;

              // Try to find the counterparty address from token balances
              let counterpartyAddress = 'Unknown';
              if (isReceive) {
                // For receives, find who sent the tokens (their balance decreased)
                for (const pre of preTokenBalances) {
                  if (pre.mint === mint && pre.owner !== address) {
                    const post = postTokenBalances.find((p: any) => p.accountIndex === pre.accountIndex);
                    const preAmt = parseFloat(pre.uiTokenAmount?.uiAmountString || '0');
                    const postAmt = post ? parseFloat(post.uiTokenAmount?.uiAmountString || '0') : 0;
                    if (postAmt < preAmt) {
                      counterpartyAddress = pre.owner;
                      break;
                    }
                  }
                }
              } else {
                // For sends, find who received the tokens (their balance increased)
                for (const post of postTokenBalances) {
                  if (post.mint === mint && post.owner !== address) {
                    const pre = preTokenBalances.find((p: any) => p.accountIndex === post.accountIndex);
                    const preAmt = pre ? parseFloat(pre.uiTokenAmount?.uiAmountString || '0') : 0;
                    const postAmt = parseFloat(post.uiTokenAmount?.uiAmountString || '0');
                    if (postAmt > preAmt) {
                      counterpartyAddress = post.owner;
                      break;
                    }
                  }
                }
              }

              console.log('[TxHistory] 📥 RPC found token tx:', isReceive ? 'receive' : 'send', Math.abs(data.change), tokenSymbol);

              transactions.push({
                id: `${signature}_${mint}`,
                type: isReceive ? 'receive' : 'send',
                token: tokenSymbol,
                amount: Math.abs(data.change),
                date: timestamp,
                timestamp,
                status,
                signature,
                network: isTestnet ? 'devnet' : 'solana',
                from: isReceive ? counterpartyAddress : address,
                to: isReceive ? address : counterpartyAddress,
              });
            }
          } else if (Math.abs(solChange) > 0.001) {
            // Pure SOL transfer (not part of a swap)
            console.log('[TxHistory] 📥 RPC found SOL tx:', solChange > 0 ? 'receive' : 'send', Math.abs(solChange).toFixed(6), 'SOL');

            transactions.push({
              id: signature,
              type: solChange > 0 ? 'receive' : 'send',
              token: 'SOL',
              amount: Math.abs(solChange),
              date: timestamp,
              timestamp,
              status,
              signature,
              network: isTestnet ? 'devnet' : 'solana',
              from: solChange < 0 ? address : 'Unknown',
              to: solChange > 0 ? address : 'Unknown',
            });
          }
        } catch (parseError) {
          console.error('[TxHistory] Error parsing RPC transaction:', parseError);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < signatures.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Cache the results
    cacheTransactions(address, networkName, transactions);
    console.log('[TxHistory] ✅ Fetched', transactions.length, 'transactions via public RPC');

    return transactions;
  } catch (error) {
    console.error('[TxHistory] Error fetching via public RPC:', error);
    return [];
  }
}

/**
 * Fetch Solana transaction history using Helius Enhanced Transactions API
 * This API returns parsed transactions including SPL token transfers
 * Falls back to public RPC if no Helius API key is configured
 */
export async function fetchSolanaTransactionHistory(
  address: string,
  isTestnet: boolean = false
): Promise<TransactionItem[]> {
  try {
    const apiKey = getHeliusApiKey();
    const network = isTestnet ? 'solana-devnet' : 'solana-mainnet';

    if (!apiKey) {
      console.log('[TxHistory] ℹ️ Helius API key not configured - using public RPC fallback');
      return fetchSolanaTransactionHistoryViaRPC(address, isTestnet);
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
    console.log('[TxHistory] Looking for address:', address);

    // Lowercase address for case-insensitive comparison
    const addressLower = address.toLowerCase();

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

          // Find all tokens sent and received by user (case-insensitive address comparison)
          const sentTokens = tokenTransfers.filter((t: any) =>
            t.fromUserAccount?.toLowerCase() === addressLower && (t.tokenAmount || 0) > 0
          );
          const receivedTokens = tokenTransfers.filter((t: any) =>
            t.toUserAccount?.toLowerCase() === addressLower && (t.tokenAmount || 0) > 0
          );

          // Check native SOL transfers too (case-insensitive)
          const sentSOL = nativeTransfers.find((t: any) =>
            t.fromUserAccount?.toLowerCase() === addressLower && t.amount > 10000
          ); // > 0.00001 SOL
          const receivedSOL = nativeTransfers.find((t: any) =>
            t.toUserAccount?.toLowerCase() === addressLower && t.amount > 10000
          );

          // Debug: Log what we found for this transaction
          if (receivedTokens.length > 0 || receivedSOL) {
            console.log('[TxHistory] 🔍 Found RECEIVES in tx:', signature.slice(0, 8), {
              tokenReceives: receivedTokens.length,
              solReceive: receivedSOL ? (receivedSOL.amount / 1e9).toFixed(6) + ' SOL' : null
            });
          }

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
              const isReceive = transfer.toUserAccount?.toLowerCase() === addressLower;
              const isSend = transfer.fromUserAccount?.toLowerCase() === addressLower;
              const amount = transfer.tokenAmount || 0;

              // Skip zero-amount transfers
              if (amount <= 0) continue;

              if (isReceive || isSend) {
                const tokenSymbol = getTokenSymbol(transfer);
                const txId = `${signature}_${transfer.mint || 'token'}_${isReceive ? 'receive' : 'send'}`;

                if (!processedSignatures.has(txId)) {
                  console.log(`[TxHistory] ${isReceive ? '📥 TOKEN RECEIVE' : '📤 TOKEN SEND'}:`, amount, tokenSymbol);
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

          // Handle native SOL transfers
          // Process even if token transfers exist (user might have received SOL + tokens in same tx)
          if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
            // Find ALL transfers involving the user (not just the largest) - case-insensitive
            const userReceives = tx.nativeTransfers.filter((t: any) =>
              t.toUserAccount?.toLowerCase() === addressLower && t.amount > 0
            );
            const userSends = tx.nativeTransfers.filter((t: any) =>
              t.fromUserAccount?.toLowerCase() === addressLower && t.amount > 0
            );

            // Process receives
            if (userReceives.length > 0) {
              // Get the largest receive
              const mainReceive = userReceives.reduce((max: any, t: any) =>
                t.amount > (max?.amount || 0) ? t : max, null);

              if (mainReceive && mainReceive.amount > 10000) { // > 0.00001 SOL
                const amount = mainReceive.amount / 1e9;
                const solTxId = `${signature}_sol_receive`;

                if (!processedSignatures.has(solTxId)) {
                  console.log('[TxHistory] 📥 Found SOL RECEIVE:', amount, 'SOL from', mainReceive.fromUserAccount?.slice(0, 8));
                  transactions.push({
                    id: solTxId,
                    type: 'receive',
                    token: 'SOL',
                    amount,
                    date: timestamp,
                    timestamp,
                    status: tx.transactionError ? 'failed' : 'confirmed',
                    from: mainReceive.fromUserAccount || 'Unknown',
                    to: mainReceive.toUserAccount || address,
                    signature,
                    network: isTestnet ? 'devnet' : 'solana',
                  });
                  processedSignatures.add(solTxId);
                }
              }
            }

            // Process sends (only if not already processed as swap)
            if (userSends.length > 0 && !processedSignatures.has(signature)) {
              // Get the largest send
              const mainSend = userSends.reduce((max: any, t: any) =>
                t.amount > (max?.amount || 0) ? t : max, null);

              if (mainSend && mainSend.amount > 100000) { // > 0.0001 SOL
                const amount = mainSend.amount / 1e9;
                const solTxId = `${signature}_sol_send`;

                if (!processedSignatures.has(solTxId)) {
                  transactions.push({
                    id: solTxId,
                    type: 'send',
                    token: 'SOL',
                    amount,
                    date: timestamp,
                    timestamp,
                    status: tx.transactionError ? 'failed' : 'confirmed',
                    from: mainSend.fromUserAccount || address,
                    to: mainSend.toUserAccount || 'Unknown',
                    signature,
                    network: isTestnet ? 'devnet' : 'solana',
                  });
                  processedSignatures.add(solTxId);
                }
              }
            }
          }
        } catch (parseError) {
          console.error('[TxHistory] Error parsing transaction:', parseError);
        }
      }
    }

    // Filter out very small amounts that are just fees/dust
    // Be more lenient to match Phantom's display
    const filteredTransactions = transactions.filter(tx => {
      if (tx.type === 'swap') return true; // Keep all swaps
      if (tx.type === 'receive') {
        // Keep all token receives (even tiny USDC amounts like Phantom shows)
        if (tx.token !== 'SOL') return tx.amount > 0;
        // For SOL receives, only filter extremely tiny amounts
        if (tx.token === 'SOL' && tx.amount < 0.000001) return false;
        return tx.amount > 0;
      }
      // For sends, filter more aggressively (dust, fees, spam)
      if (tx.token === 'SOL' && tx.amount < 0.0001) return false; // Less than 0.0001 SOL (~$0.02)
      // Filter zero amounts
      if (tx.amount <= 0) return false;
      return true;
    });

    // Cache the results
    cacheTransactions(address, network, filteredTransactions);

    // Log breakdown of transaction types
    const receives = filteredTransactions.filter(tx => tx.type === 'receive');
    const sends = filteredTransactions.filter(tx => tx.type === 'send');
    const swaps = filteredTransactions.filter(tx => tx.type === 'swap');
    console.log('[TxHistory] ✅ Fetched', filteredTransactions.length, 'Solana transactions');
    console.log('[TxHistory]    📥 Receives:', receives.length, '📤 Sends:', sends.length, '🔄 Swaps:', swaps.length);

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
 * Resolve token symbol from mint address
 * Used to fix "TOKEN" symbols in swap history
 */
function resolveSymbolFromMint(mint: string | undefined, fallbackSymbol: string): string {
  // If no mint, return fallback
  if (!mint) return fallbackSymbol;

  // Check our known mints database
  if (KNOWN_TOKEN_MINTS[mint]) {
    return KNOWN_TOKEN_MINTS[mint];
  }

  // Pump.fun tokens end with 'pump' - try to extract a better name
  if (mint.toLowerCase().endsWith('pump')) {
    // Return a shortened version of the mint as the symbol (first 4 chars uppercase)
    // This is better than "TOKEN"
    return mint.slice(0, 4).toUpperCase();
  }

  return fallbackSymbol;
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
  fromMint?: string; // Mint address for from token (for symbol resolution)
  toMint?: string;   // Mint address for to token (for symbol resolution)
}): void {
  try {
    const history = getLocalSwapHistory();

    // Resolve symbols from mint addresses if the symbol is "TOKEN" or empty
    let fromTokenSymbol = swap.fromToken;
    let toTokenSymbol = swap.toToken;

    // If fromToken is "TOKEN" or empty, try to resolve from mint
    if (!fromTokenSymbol || fromTokenSymbol === 'TOKEN' || fromTokenSymbol === '') {
      fromTokenSymbol = resolveSymbolFromMint(swap.fromMint, 'TOKEN');
      console.log('[TxHistory] Resolved fromToken from mint:', swap.fromMint, '→', fromTokenSymbol);
    }

    // If toToken is "TOKEN" or empty, try to resolve from mint
    if (!toTokenSymbol || toTokenSymbol === 'TOKEN' || toTokenSymbol === '') {
      toTokenSymbol = resolveSymbolFromMint(swap.toMint, 'TOKEN');
      console.log('[TxHistory] Resolved toToken from mint:', swap.toMint, '→', toTokenSymbol);
    }

    const newSwap: TransactionItem = {
      id: swap.signature,
      type: 'swap',
      token: fromTokenSymbol,
      amount: swap.fromAmount,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      signature: swap.signature,
      network: 'solana',
      fromToken: fromTokenSymbol,
      toToken: toTokenSymbol,
      fromAmount: swap.fromAmount,
      toAmount: swap.toAmount,
      rate: swap.rate,
      fee: swap.fee,
      feeAmount: swap.feeAmount,
      from: swap.walletAddress,
      // Store mint addresses for future reference/debugging
      fromMint: swap.fromMint,
      toMint: swap.toMint,
    } as TransactionItem & { fromMint?: string; toMint?: string };

    // Add to beginning of array (most recent first)
    history.unshift(newSwap);

    // Keep only last 100 swaps
    const trimmed = history.slice(0, 100);

    localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(trimmed));
    console.log('[TxHistory] ✅ Saved swap to history:', fromTokenSymbol, '→', toTokenSymbol);

    // Dispatch event to notify Activity page
    window.dispatchEvent(new CustomEvent('swapHistoryUpdated'));
  } catch (error) {
    console.error('[TxHistory] Error saving swap to history:', error);
  }
}

/**
 * Get local swap history from storage
 * Also fixes any entries that have "TOKEN" as symbol (from before fix)
 * Removes entries that can't be fixed (old entries without mint addresses)
 */
export function getLocalSwapHistory(): TransactionItem[] {
  try {
    const stored = localStorage.getItem(SWAP_HISTORY_KEY);
    if (stored) {
      let history = JSON.parse(stored);

      // Fix any entries with "TOKEN" or empty symbols
      let needsSave = false;
      const entriesToRemove: string[] = [];

      for (const entry of history) {
        if (entry.type === 'swap') {
          // Fix fromToken if it's "TOKEN" or empty
          if (!entry.fromToken || entry.fromToken === 'TOKEN' || entry.fromToken === '') {
            // First try to resolve from stored mint address
            if (entry.fromMint) {
              const resolved = resolveSymbolFromMint(entry.fromMint, 'TOKEN');
              if (resolved !== 'TOKEN') {
                entry.fromToken = resolved;
                entry.token = resolved;
                needsSave = true;
                console.log('[TxHistory] Fixed fromToken from mint:', entry.fromMint, '→', resolved);
              }
            }
            // Fallback: try to identify from token field
            else if (entry.token && entry.token !== 'TOKEN' && entry.token !== '') {
              entry.fromToken = entry.token;
              needsSave = true;
            }
          }
          // Fix toToken if it's "TOKEN" or empty
          if (!entry.toToken || entry.toToken === 'TOKEN' || entry.toToken === '') {
            // First try to resolve from stored mint address
            if (entry.toMint) {
              const resolved = resolveSymbolFromMint(entry.toMint, 'TOKEN');
              if (resolved !== 'TOKEN') {
                entry.toToken = resolved;
                needsSave = true;
                console.log('[TxHistory] Fixed toToken from mint:', entry.toMint, '→', resolved);
              }
            }
            // Fallback: For swaps to SOL, we can identify by amount patterns
            else if (entry.toAmount && entry.toAmount < 1 && entry.fromAmount > 10) {
              // Likely swapping meme coin to SOL
              entry.toToken = 'SOL';
              needsSave = true;
            }
          }
          // Also fix the token field
          if (entry.token === 'TOKEN' && entry.fromToken && entry.fromToken !== 'TOKEN') {
            entry.token = entry.fromToken;
            needsSave = true;
          }

          // If still showing "TOKEN" after all fixes, mark for removal
          // These are old entries without mint addresses that can't be fixed
          if (entry.fromToken === 'TOKEN' || entry.toToken === 'TOKEN') {
            console.log('[TxHistory] Removing unfixable swap entry with TOKEN:', entry.id);
            entriesToRemove.push(entry.id);
            needsSave = true;
          }
        }
      }

      // Remove unfixable entries
      if (entriesToRemove.length > 0) {
        history = history.filter((e: any) => !entriesToRemove.includes(e.id));
        console.log('[TxHistory] Removed', entriesToRemove.length, 'unfixable TOKEN entries');
      }

      // Save fixed history back
      if (needsSave) {
        localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(history));
        console.log('[TxHistory] Fixed/cleaned swap history');
      }

      return history;
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