/**
 * Blockchain Client - Direct RPC calls (Phantom-like architecture)
 *
 * This module makes DIRECT calls to blockchain RPCs without any server proxy.
 * All data fetching happens client-side, just like Phantom wallet.
 *
 * Architecture:
 * - Solana: Direct calls to Helius RPC or public Solana RPC
 * - Token detection: Helius DAS API (getAssetsByOwner)
 * - Prices: Direct CoinGecko API (with fallback to cached prices)
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getHeliusApiKey } from './env';
import { dedupe } from './requestDeduplication';
import { TOKEN_BY_MINT } from './tokenRegistry';

export type NetworkMode = 'mainnet' | 'testnet' | 'devnet';

export interface ChainBalance {
  native: number;
  tokens: TokenBalance[];
  totalUsdValue: number;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  logoUrl: string;
  price?: number;
}

// Cache for connections to avoid creating multiple instances
const connectionCache = new Map<string, Connection>();

/**
 * Get Solana RPC endpoint based on network
 */
function getSolanaEndpoint(networkMode: NetworkMode): string {
  const heliusKey = getHeliusApiKey();

  if (heliusKey) {
    // Use Helius RPC (faster, more reliable, higher rate limits)
    const network = networkMode === 'mainnet' ? 'mainnet' : 'devnet';
    return `https://${network}.helius-rpc.com/?api-key=${heliusKey}`;
  }

  // Fallback to public RPC
  if (networkMode === 'mainnet') {
    return 'https://api.mainnet-beta.solana.com';
  }
  return 'https://api.devnet.solana.com';
}

/**
 * Get or create a Solana connection
 */
function getConnection(networkMode: NetworkMode): Connection {
  const endpoint = getSolanaEndpoint(networkMode);

  if (!connectionCache.has(endpoint)) {
    console.log('[BlockchainClient] Creating new connection to:', endpoint.includes('helius') ? 'Helius RPC' : 'Public RPC');
    connectionCache.set(endpoint, new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    }));
  }

  return connectionCache.get(endpoint)!;
}

/**
 * Fetch Solana balance - DIRECT RPC CALL (like Phantom)
 */
export async function fetchSolanaBalanceClient(
  address: string,
  networkMode: NetworkMode = 'mainnet'
): Promise<ChainBalance> {
  // Use deduplication to prevent duplicate requests
  return dedupe(
    `solana_balance:${address}:${networkMode}`,
    async () => {
      try {
        console.log(`[BlockchainClient] Fetching Solana balance for ${address.slice(0, 8)}... on ${networkMode}`);

        const connection = getConnection(networkMode);
        const pubkey = new PublicKey(address);

        // Fetch SOL balance directly from RPC
        const lamports = await connection.getBalance(pubkey, 'confirmed');
        const solBalance = lamports / LAMPORTS_PER_SOL;

        console.log(`[BlockchainClient] SOL balance: ${solBalance.toFixed(6)} SOL`);

        // Fetch SPL tokens using Helius DAS API or standard RPC
        const tokens = await fetchSPLTokens(address, networkMode, connection);

        console.log(`[BlockchainClient] Found ${tokens.length} SPL tokens`);

        return {
          native: solBalance,
          tokens,
          totalUsdValue: 0, // Will be calculated by caller with prices
        };
      } catch (error: any) {
        console.error('[BlockchainClient] Error fetching Solana balance:', error.message);

        // Return empty balance on error (graceful degradation)
        return {
          native: 0,
          tokens: [],
          totalUsdValue: 0,
        };
      }
    },
    { cacheTTL: 10000 } // Cache for 10 seconds
  );
}

/**
 * Fetch SPL tokens - tries Helius DAS API first, then falls back to standard RPC
 */
async function fetchSPLTokens(
  address: string,
  networkMode: NetworkMode,
  connection: Connection
): Promise<TokenBalance[]> {
  const heliusKey = getHeliusApiKey();

  // Try Helius DAS API first (provides richer metadata)
  if (heliusKey && networkMode === 'mainnet') {
    try {
      const tokens = await fetchTokensViaHeliusDAS(address, heliusKey);
      if (tokens.length > 0) {
        return tokens;
      }
    } catch (error) {
      console.warn('[BlockchainClient] Helius DAS failed, falling back to RPC:', error);
    }
  }

  // Fallback to standard RPC token fetching
  return fetchTokensViaRPC(address, connection);
}

/**
 * Fetch tokens using Helius DAS API (Digital Asset Standard)
 * This provides rich metadata including token names, symbols, and logos
 */
async function fetchTokensViaHeliusDAS(
  address: string,
  heliusKey: string
): Promise<TokenBalance[]> {
  console.log('[BlockchainClient] Fetching tokens via Helius DAS API...');

  const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'suprik-wallet',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: address,
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: false,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Helius DAS API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Helius DAS API error');
  }

  const tokens: TokenBalance[] = [];
  const items = data.result?.items || [];

  for (const item of items) {
    // Only process fungible tokens
    if (item.interface !== 'FungibleToken' && item.interface !== 'FungibleAsset') {
      continue;
    }

    const tokenInfo = item.token_info || {};
    const content = item.content || {};
    const metadata = content.metadata || {};

    // Get amount (handle different decimal places)
    const balance = tokenInfo.balance || 0;
    const decimals = tokenInfo.decimals || 0;
    const amount = balance / Math.pow(10, decimals);

    // Skip zero balance tokens
    if (amount === 0) continue;

    // Get token metadata - check our registry first for accuracy
    const mint = item.id;
    const registryToken = TOKEN_BY_MINT.get(mint);

    const symbol = registryToken?.symbol || tokenInfo.symbol || metadata.symbol || 'UNKNOWN';
    const name = registryToken?.name || metadata.name || tokenInfo.symbol || 'Unknown Token';
    const logoUrl = registryToken?.image || content.links?.image || content.files?.[0]?.uri || '';

    tokens.push({
      mint,
      symbol,
      name,
      amount,
      decimals,
      logoUrl,
      price: tokenInfo.price_info?.price_per_token,
    });
  }

  console.log(`[BlockchainClient] Helius DAS returned ${tokens.length} tokens`);
  return tokens;
}

/**
 * Fetch tokens using standard Solana RPC (fallback method)
 * This is more limited but works without Helius API key
 */
async function fetchTokensViaRPC(
  address: string,
  connection: Connection
): Promise<TokenBalance[]> {
  console.log('[BlockchainClient] Fetching tokens via standard RPC...');

  try {
    const pubkey = new PublicKey(address);

    // Get all token accounts owned by this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      pubkey,
      { programId: TOKEN_PROGRAM_ID },
      'confirmed'
    );

    const tokens: TokenBalance[] = [];

    for (const { account } of tokenAccounts.value) {
      const parsedInfo = account.data.parsed?.info;
      if (!parsedInfo) continue;

      const mint = parsedInfo.mint;
      const tokenAmount = parsedInfo.tokenAmount;
      const amount = parseFloat(tokenAmount.uiAmountString || '0');

      // Skip zero balance tokens
      if (amount === 0) continue;

      // Get metadata from our registry
      const registryToken = TOKEN_BY_MINT.get(mint);

      tokens.push({
        mint,
        symbol: registryToken?.symbol || 'UNKNOWN',
        name: registryToken?.name || 'Unknown Token',
        amount,
        decimals: tokenAmount.decimals,
        logoUrl: registryToken?.image || '',
      });
    }

    console.log(`[BlockchainClient] RPC returned ${tokens.length} tokens`);
    return tokens;
  } catch (error) {
    console.error('[BlockchainClient] RPC token fetch error:', error);
    return [];
  }
}

/**
 * Fetch all balances - Solana only (other networks coming soon)
 */
export async function fetchAllBalancesClient(
  addresses: {
    solana: string;
    ethereum: string;
    bitcoin: string;
    base: string;
    polygon: string;
    sui: string;
  },
  networkMode: NetworkMode = 'mainnet'
): Promise<{
  solana: ChainBalance;
  ethereum: ChainBalance;
  bitcoin: ChainBalance;
  base: ChainBalance;
  polygon: ChainBalance;
  sui: ChainBalance;
}> {
  console.log('[BlockchainClient] Fetching Solana balance (direct RPC)...');

  // Only fetch Solana balance (other networks coming soon)
  const solana = await fetchSolanaBalanceClient(addresses.solana, networkMode);

  // Return zero balances for other networks
  const emptyBalance: ChainBalance = { native: 0, tokens: [], totalUsdValue: 0 };

  return {
    solana,
    ethereum: emptyBalance,
    bitcoin: emptyBalance,
    base: emptyBalance,
    polygon: emptyBalance,
    sui: emptyBalance,
  };
}

/**
 * Fetch token prices from Jupiter Price API (client-side, free, no rate limits)
 * This is what Phantom uses for Solana token prices
 */
export async function fetchTokenPricesClient(
  mints: string[]
): Promise<Record<string, number>> {
  if (mints.length === 0) return {};

  return dedupe(
    `token_prices:${mints.slice(0, 5).join(',')}`,
    async () => {
      try {
        console.log('[BlockchainClient] Fetching prices from Jupiter Price API...');

        // Jupiter Price API v3 - the latest public endpoint
        const response = await fetch(
          `https://api.jup.ag/price/v3?ids=${mints.join(',')}`
        );

        if (!response.ok) {
          throw new Error(`Jupiter Price API error: ${response.status}`);
        }

        const data = await response.json();
        const prices: Record<string, number> = {};

        // Map mint addresses to prices
        for (const [mint, priceData] of Object.entries(data.data || {})) {
          const price = (priceData as any)?.price;
          if (price) {
            prices[mint] = parseFloat(price);
          }
        }

        // Add SOL price (native token)
        const solMint = 'So11111111111111111111111111111111111111112';
        if (prices[solMint]) {
          prices['SOL'] = prices[solMint];
        }

        console.log(`[BlockchainClient] Got prices for ${Object.keys(prices).length} tokens`);
        return prices;
      } catch (error) {
        console.warn('[BlockchainClient] Jupiter Price API failed, using fallback prices');

        // Fallback prices
        return {
          'SOL': 245.00,
          'So11111111111111111111111111111111111111112': 245.00,
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.00, // USDC
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1.00, // USDT
        };
      }
    },
    { cacheTTL: 30000 } // Cache prices for 30 seconds
  );
}

/**
 * Get SOL price in USD
 */
export async function getSolPrice(): Promise<number> {
  try {
    const prices = await fetchTokenPricesClient(['So11111111111111111111111111111111111111112']);
    return prices['SOL'] || prices['So11111111111111111111111111111111111111112'] || 245.00;
  } catch {
    return 245.00; // Fallback price
  }
}

console.log('[BlockchainClient] Direct RPC client initialized (Phantom-like architecture)');
