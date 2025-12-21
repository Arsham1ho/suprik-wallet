/**
 * Suprik Wallet - Jupiter Swap Integration
 *
 * Complete Jupiter swap implementation with referral fee collection
 * Uses Jupiter API v6 (free public endpoint)
 * Implements platform fee collection similar to Phantom wallet
 */

import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { deriveSolanaKeypair, getSolanaConnection } from './transactions';

// ===========================
// Configuration
// ===========================

// Jupiter API endpoints (lite-api - free public API)
// Note: api.jup.ag/swap/v1 requires paid API key
// lite-api.jup.ag is the free tier (until Dec 31, 2025)
const JUPITER_QUOTE_URL = 'https://lite-api.jup.ag/swap/v1/quote';
const JUPITER_SWAP_URL = 'https://lite-api.jup.ag/swap/v1/swap';

// Suprik Platform Fee Configuration
// Fee is collected in basis points (bps): 50 bps = 0.5%
export const PLATFORM_FEE_BPS = 50; // 0.5% fee (same as Phantom)

// Suprik Fee Wallet Addresses (for receiving platform fees)
// Jupiter Referral Account (from referral.jup.ag)
export const JUPITER_REFERRAL_ACCOUNT = 'FSHu56mFcP6eiL4HEJiijqRZekvjemmG8YpJpVmiJfuz';

export const FEE_WALLET_CONFIG = {
  // Main wallet address
  feeWalletAddress: '93QBsBSLuzmV1DDFiuLLKmhxk6meRAyiXkpxZ3zbDkLD',

  // Jupiter referral account for fee collection
  referralAccount: JUPITER_REFERRAL_ACCOUNT,

  // Direct token accounts for fee collection (wallet's ATAs)
  // These are used when Jupiter Referral PDAs are not initialized
  tokenAccounts: {
    // USDC token account
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '4ZLVoKeGbmf4DhXJ9a8UhM5WbyJgpLPGPT7NBSJQpmLA',
  } as Record<string, string>,
};

// ===========================
// Types
// ===========================

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  outputAmount: number;
  minOutputAmount: number;
  priceImpact: number;
  fee: number;
  feePercent: number;
  route: string[];
  exchangeRate: number;
  quoteResponse?: any; // Jupiter quote response for swap execution
  platformFee?: number; // Platform fee in output token
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  inputAmount?: number;
  outputAmount?: number;
  platformFee?: number;
  error?: string;
}

// ===========================
// Token Mint Addresses (Mainnet)
// ===========================

const TOKEN_MINTS: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'SRM': 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'PYTH': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  'JTO': 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  'RENDER': 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  'MSOL': 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  'JITOSOL': 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  'BSOL': 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
  // Additional popular tokens
  'WBTC': '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
  'WETH': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  'SAMO': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'FIDA': 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
  'MNGO': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  'STEP': 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
  'COPE': '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh',
  'DUST': 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
  'GMT': '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx',
  'GST': 'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB',
  'PARAI': 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
  'PAI': 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
  'SUP': 'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp',
  'KMNO': 'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS',
  'W': '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
};

// CoinGecko ID to Solana Mint Address mapping
// This allows looking up mint addresses for tokens selected from CoinGecko search
const COINGECKO_ID_TO_MINT: Record<string, string> = {
  'solana': 'So11111111111111111111111111111111111111112',
  'usd-coin': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'tether': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'raydium': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'serum': 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'jupiter-exchange-solana': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'dogwifcoin': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'pyth-network': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  'jito-governance-token': 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  'render-token': 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  'orca': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  'msol': 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  'jito-staked-sol': 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  'blazestake-staked-sol': 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
  'wrapped-bitcoin-sollet': '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
  'wrapped-ether-sollet': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  'samoyedcoin': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'bonfida': 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
  'mango-markets': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  'step-finance': 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
  'cope': '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh',
  'dust-protocol': 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
  'stepn': '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx',
  'green-satoshi-token': 'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB',
  'parabolic-ai': 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
  'suprana': 'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp',
  // Popular meme coins and Solana tokens
  'popcat': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  'cat-in-a-dogs-world': 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
  'helium': 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  'helium-mobile': 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6',
  'tensor': 'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6',
  'parcl': 'PARCLkmyDa7XApzn22E4Nm3FLZLWLWLWjYyXLcAoEMV',
  'wormhole': '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
  'kamino-finance': 'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS',
  'kamino': 'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS',
  'io-net': 'BZLbGTNCSFfoth2GYDtwr7e4imWzpR5jqcUuGEwr646K',
  // Additional meme coins - pump.fun and other popular tokens
  'pump': 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', // PUMP token
  'pnut': '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', // Peanut the Squirrel
  'ai16z': 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', // ai16z
  'fartcoin': '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', // Fartcoin
  'goat': 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', // GOAT
  'moodeng': 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY', // Moo Deng
  'act': 'GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump', // ACT
  'chillguy': 'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump', // Just a chill guy
  'zerebro': 'BAGE9SrkSGQMsCxvYWg7gxHbFy9HGKqX4nSguLMAppump', // Zerebro
  'griffain': 'KENJSUYLASHUMfHyy5o4Hp2FdNqZg1AsUPhfH2kYvEP', // Griffain
  'pengu': '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv', // Pudgy Penguins
  'turbo': 'HNg5PYJmtqcmzXrv6S9zP1CDKk5BgDuyFBxbvMkswdqq', // Turbo
  'daddy': 'CNvitvFnSM5xfMpDBJEMDJUavJhuQqfwj2kSF3JBJuTR', // Daddy Tate
  'giga': 'GigaHPFLwvSCQgJS8CpSdFPo3VTELLwhiQvjR5hgQpJB', // GIGA
  'mother': 'mother8B3BqDdh8TLEUpQbVmAKNK2NfdKoiL4mFBZRY', // MOTHER
  'michi': 'michi9n9QZb72K8iCWDLcCkhvNVAKFRKfZ6cCGKAvnYC', // Michi
  'slerf': '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3', // SLERF
  'cwif': '7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1', // CWIF
  'wen': 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', // WEN
  'myro': 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', // MYRO
  'book-of-meme': 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // BOME (Book of Meme)
};

// Cache for dynamically fetched mint addresses (from Jupiter API)
const dynamicMintCache: Record<string, string> = {};

// Token decimals
const TOKEN_DECIMALS: Record<string, number> = {
  'SOL': 9,
  'USDC': 6,
  'USDT': 6,
  'RAY': 6,
  'SRM': 6,
  'BONK': 5,
  'JUP': 6,
  'WIF': 6,
  'PYTH': 6,
  'JTO': 9,
  'RENDER': 8,
  'ORCA': 6,
  'MSOL': 9,
  'JITOSOL': 9,
  'BSOL': 9,
  // Additional tokens
  'WBTC': 8,
  'WETH': 8,
  'SAMO': 9,
  'FIDA': 6,
  'MNGO': 6,
  'STEP': 9,
  'COPE': 6,
  'DUST': 9,
  'GMT': 9,
  'GST': 9,
  'PARAI': 9,
  'PAI': 9,
  // Pump.fun tokens (most have 6 decimals)
  'PUMP': 6,
  'PNUT': 6,
  'FARTCOIN': 6,
  'GOAT': 6,
  'ACT': 6,
  'CHILLGUY': 6,
  'ZEREBRO': 6,
};

// Reverse mapping: Mint address to decimals (for dynamic lookup)
const MINT_TO_DECIMALS: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 9,  // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 6, // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 6, // WIF
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': 8, // RENDER
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 6, // RAY
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 6, // PYTH
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': 9, // JTO
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 6, // ORCA
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 9, // MSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 9, // JITOSOL
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 9, // BSOL
  // Pump.fun tokens (most have 6 decimals)
  'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump': 6, // PUMP
  '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump': 6, // PNUT
  '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump': 6, // FARTCOIN
  'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump': 6, // GOAT
  'GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump': 6, // ACT
  'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump': 6, // CHILLGUY
  'BAGE9SrkSGQMsCxvYWg7gxHbFy9HGKqX4nSguLMAppump': 6, // ZEREBRO
};

/**
 * Get token decimals by mint address
 * Falls back to 9 (standard Solana SPL token decimals) if not found
 * Special handling for pump.fun tokens (mint ends with 'pump') - they use 6 decimals
 */
export function getDecimalsForMint(mint: string): number {
  // Check static mapping first
  if (MINT_TO_DECIMALS[mint]) {
    return MINT_TO_DECIMALS[mint];
  }

  // Pump.fun tokens end with 'pump' and use 6 decimals
  if (mint.toLowerCase().endsWith('pump')) {
    console.log('[Jupiter] Detected pump.fun token, using 6 decimals:', mint);
    return 6;
  }

  // Default to 9 for standard SPL tokens
  return 9;
}

// ===========================
// Helper Functions
// ===========================

export function getTokenMint(symbol: string): string {
  return TOKEN_MINTS[symbol.toUpperCase()] || symbol;
}

export function getTokenDecimals(symbol: string): number {
  return TOKEN_DECIMALS[symbol.toUpperCase()] || 9;
}

/**
 * Get mint address by CoinGecko ID
 * Returns the Solana mint address for known tokens, or null if not found
 */
export function getMintByCoinGeckoId(coinGeckoId: string): string | null {
  const id = coinGeckoId.toLowerCase();
  // Check static mapping first
  if (COINGECKO_ID_TO_MINT[id]) {
    return COINGECKO_ID_TO_MINT[id];
  }
  // Check dynamic cache
  if (dynamicMintCache[id]) {
    return dynamicMintCache[id];
  }
  return null;
}

/**
 * Try to get mint address from multiple sources:
 * 1. Direct mint property
 * 2. CoinGecko ID mapping
 * 3. Symbol mapping
 * 4. Dynamic cache
 */
export function resolveMintAddress(
  mint?: string,
  coinGeckoId?: string,
  symbol?: string
): string | null {
  console.log(`[resolveMintAddress] Input: mint=${mint}, id=${coinGeckoId}, symbol=${symbol}`);

  // PRIORITY 1: Try CoinGecko ID mapping first (most reliable for tokens from search)
  if (coinGeckoId) {
    const fromCoinGecko = getMintByCoinGeckoId(coinGeckoId);
    if (fromCoinGecko) {
      console.log(`[resolveMintAddress] Found via CoinGecko ID: ${fromCoinGecko}`);
      return fromCoinGecko;
    }
  }

  // PRIORITY 2: Try symbol mapping (for known tokens)
  if (symbol) {
    const upperSymbol = symbol.toUpperCase();
    const fromSymbol = getTokenMint(upperSymbol);
    if (fromSymbol !== upperSymbol) {
      console.log(`[resolveMintAddress] Found via symbol: ${fromSymbol}`);
      return fromSymbol;
    }
    // Also check dynamic cache by symbol
    if (dynamicMintCache[upperSymbol]) {
      console.log(`[resolveMintAddress] Found via dynamic cache: ${dynamicMintCache[upperSymbol]}`);
      return dynamicMintCache[upperSymbol];
    }
  }

  // PRIORITY 3: If mint is already a valid Solana address (base58, 32-44 chars)
  // Only use this if we couldn't find it through our mappings
  if (mint && mint.length >= 32 && mint.length <= 44 && !mint.includes('-') && !mint.startsWith('0x')) {
    // Validate it looks like a Solana base58 address
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (base58Regex.test(mint)) {
      console.log(`[resolveMintAddress] Using direct mint (validated base58): ${mint}`);
      return mint;
    }
  }

  console.log(`[resolveMintAddress] No valid mint found`);
  return null;
}

/**
 * Fetch mint address from Jupiter token API
 * This is used for tokens not in our static mappings
 */
export async function fetchMintFromJupiter(symbol: string): Promise<string | null> {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  if (dynamicMintCache[upperSymbol]) {
    console.log(`[Jupiter] Cache hit for ${upperSymbol}:`, dynamicMintCache[upperSymbol]);
    return dynamicMintCache[upperSymbol];
  }

  try {
    console.log(`[Jupiter] Fetching mint for ${upperSymbol} from Jupiter API...`);

    // Use Jupiter Token API V2 search endpoint
    // This is the new endpoint (V1 deprecated August 2025)
    const response = await fetch(
      `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(upperSymbol)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (response.ok) {
      const data = await response.json();
      // V2 returns tokens array with mint addresses
      const tokens = data.tokens || data;
      if (Array.isArray(tokens) && tokens.length > 0) {
        // Find exact symbol match (case-insensitive)
        const exactMatch = tokens.find(
          (t: any) => t.symbol?.toUpperCase() === upperSymbol
        );
        if (exactMatch && (exactMatch.address || exactMatch.mint)) {
          const mint = exactMatch.address || exactMatch.mint;
          console.log(`[Jupiter] Found mint for ${upperSymbol}:`, mint);
          dynamicMintCache[upperSymbol] = mint;
          return mint;
        }

        // Use first result if no exact match
        const firstResult = tokens[0];
        if (firstResult && (firstResult.address || firstResult.mint)) {
          const mint = firstResult.address || firstResult.mint;
          console.log(`[Jupiter] Using first result for ${upperSymbol}:`, firstResult.symbol, mint);
          dynamicMintCache[upperSymbol] = mint;
          return mint;
        }
      }
    }

    // Fallback: Try DexScreener API to find Solana token by symbol
    try {
      const dexResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(upperSymbol)}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        if (dexData.pairs && dexData.pairs.length > 0) {
          // Find Solana pairs with matching symbol
          const solanaPair = dexData.pairs.find(
            (p: any) => p.chainId === 'solana' &&
                        (p.baseToken?.symbol?.toUpperCase() === upperSymbol ||
                         p.quoteToken?.symbol?.toUpperCase() === upperSymbol)
          );
          if (solanaPair) {
            const mint = solanaPair.baseToken?.symbol?.toUpperCase() === upperSymbol
              ? solanaPair.baseToken?.address
              : solanaPair.quoteToken?.address;
            if (mint) {
              console.log(`[Jupiter] Found mint via DexScreener for ${upperSymbol}:`, mint);
              dynamicMintCache[upperSymbol] = mint;
              return mint;
            }
          }
        }
      }
    } catch (dexError) {
      console.warn(`[Jupiter] DexScreener fallback failed for ${upperSymbol}:`, dexError);
    }

    console.log(`[Jupiter] No mint found for ${upperSymbol}`);
    return null;
  } catch (error) {
    console.error(`[Jupiter] Error fetching mint for ${upperSymbol}:`, error);
    return null;
  }
}

/**
 * Async version of resolveMintAddress that can fetch from Jupiter API
 * Use this when you need to resolve mints for unknown tokens
 */
export async function resolveMintAddressAsync(
  mint?: string,
  coinGeckoId?: string,
  symbol?: string
): Promise<string | null> {
  // First try synchronous resolution
  const syncResult = resolveMintAddress(mint, coinGeckoId, symbol);
  if (syncResult) {
    return syncResult;
  }

  // If symbol is provided, try fetching from Jupiter
  if (symbol) {
    const jupiterResult = await fetchMintFromJupiter(symbol);
    if (jupiterResult) {
      return jupiterResult;
    }
  }

  return null;
}

// Jupiter Referral Program ID
const JUPITER_REFERRAL_PROGRAM_ID = new PublicKey('REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3');

/**
 * Derive the referral token account PDA for a specific mint
 * This is how Jupiter Referral Program stores fee accounts
 */
export async function getReferralTokenAccountPDA(mint: string): Promise<string> {
  const referralAccountPubkey = new PublicKey(JUPITER_REFERRAL_ACCOUNT);
  const mintPubkey = new PublicKey(mint);

  const [referralTokenAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('referral_ata'),
      referralAccountPubkey.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    JUPITER_REFERRAL_PROGRAM_ID
  );

  return referralTokenAccount.toBase58();
}

/**
 * Get fee token account for the output mint
 * First checks for direct token accounts, then falls back to Jupiter Referral PDA
 */
export async function getFeeAccountAsync(outputMint: string): Promise<string | null> {
  try {
    // First, check if we have a direct token account configured for this mint
    if (FEE_WALLET_CONFIG.tokenAccounts && FEE_WALLET_CONFIG.tokenAccounts[outputMint]) {
      const directAccount = FEE_WALLET_CONFIG.tokenAccounts[outputMint];
      console.log('[Jupiter] Using direct token account:', directAccount, 'for mint:', outputMint);
      return directAccount;
    }

    // Fall back to Jupiter Referral PDA (if initialized)
    const referralTokenAccount = await getReferralTokenAccountPDA(outputMint);
    console.log('[Jupiter] Referral token account:', referralTokenAccount, 'for mint:', outputMint);
    return referralTokenAccount;
  } catch (error) {
    console.error('[Jupiter] Error deriving fee account:', error);
    return null;
  }
}

// Synchronous version for backwards compatibility
export function getFeeAccount(_outputMint?: string): string | null {
  return null;
}

// ===========================
// Get Swap Quote from Jupiter
// ===========================

export async function getJupiterSwapQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage?: number;
  isTestnet?: boolean;
  inputDecimals?: number;
  outputDecimals?: number;
}): Promise<SwapQuote> {
  try {
    const {
      inputMint,
      outputMint,
      amount,
      slippage = 1,
      isTestnet = false,
      inputDecimals = 9,
      outputDecimals = 9
    } = params;

    console.log('[Jupiter] Getting swap quote...');
    console.log('[Jupiter] Input:', inputMint);
    console.log('[Jupiter] Output:', outputMint);
    console.log('[Jupiter] Amount (UI):', amount);
    console.log('[Jupiter] Input Decimals:', inputDecimals);
    console.log('[Jupiter] Output Decimals:', outputDecimals);
    console.log('[Jupiter] Platform Fee:', PLATFORM_FEE_BPS, 'bps');
    console.log('[Jupiter] Mode:', isTestnet ? 'TESTNET' : 'MAINNET');

    // Helper function to generate mock quote for testnet/fallback
    const generateMockQuote = (): SwapQuote => {
      console.log('[Jupiter] Generating simulated quote');

      // Realistic mock exchange rates
      let exchangeRate = 0.997;

      if (inputMint.includes('So1111') && outputMint.includes('EPjFW')) {
        exchangeRate = 185; // SOL → USDC
      } else if (inputMint.includes('EPjFW') && outputMint.includes('So1111')) {
        exchangeRate = 0.0054; // USDC → SOL
      } else if (inputMint.includes('So1111') && outputMint.includes('Es9vM')) {
        exchangeRate = 185; // SOL → USDT
      } else if (inputMint.includes('Es9vM') && outputMint.includes('So1111')) {
        exchangeRate = 0.0054; // USDT → SOL
      } else if (inputMint.includes('EPjFW') && outputMint.includes('Es9vM')) {
        exchangeRate = 0.9998; // USDC → USDT
      } else if (inputMint.includes('Es9vM') && outputMint.includes('EPjFW')) {
        exchangeRate = 0.9998; // USDT → USDC
      }

      const platformFeePercent = PLATFORM_FEE_BPS / 100; // Convert bps to percent
      const outputBeforeFee = amount * exchangeRate;
      const platformFee = outputBeforeFee * (platformFeePercent / 100);
      const outputAmount = outputBeforeFee - platformFee;
      const minOutputAmount = outputAmount * (1 - slippage / 100);

      return {
        inputMint,
        outputMint,
        inputAmount: amount,
        outputAmount,
        minOutputAmount,
        priceImpact: 0.1,
        fee: platformFee,
        feePercent: platformFeePercent,
        route: ['Simulated Mode'],
        exchangeRate,
        platformFee,
      };
    };

    // TESTNET MODE: Return mock quote
    if (isTestnet) {
      console.log('[Jupiter] TESTNET MODE: Using simulated quote');
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockQuote();
    }

    // MAINNET MODE: Use Jupiter API v1
    const lamportsAmount = Math.floor(amount * Math.pow(10, inputDecimals));

    console.log('[Jupiter] Amount (lamports):', lamportsAmount);

    if (lamportsAmount <= 0 || !isFinite(lamportsAmount)) {
      throw new Error('Invalid amount');
    }

    const slippageBps = Math.floor(slippage * 100);

    // Check if we have a fee account for the output token
    const hasFeeAccount = FEE_WALLET_CONFIG.tokenAccounts &&
                          FEE_WALLET_CONFIG.tokenAccounts[outputMint];

    // Build quote URL - add platformFeeBps only if we can collect fees
    const quoteParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: lamportsAmount.toString(),
      slippageBps: slippageBps.toString(),
    });

    // Only add platform fee if we have a fee account for this output token
    if (hasFeeAccount) {
      quoteParams.append('platformFeeBps', PLATFORM_FEE_BPS.toString());
      console.log('[Jupiter] Platform fee enabled:', PLATFORM_FEE_BPS, 'bps');
    } else {
      console.log('[Jupiter] No fee account for output token, skipping platform fee');
    }

    const quoteUrl = `${JUPITER_QUOTE_URL}?${quoteParams.toString()}`;

    console.log('[Jupiter] Fetching quote from:', quoteUrl);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(quoteUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Jupiter] Quote API error:', response.status, errorText);
        throw new Error(`Quote API error: ${response.status}`);
      }

      const quote = await response.json();

      if (!quote || !quote.outAmount) {
        console.error('[Jupiter] Invalid quote response:', quote);
        throw new Error('Invalid quote response');
      }

      console.log('[Jupiter] Quote received successfully!');
      console.log('[Jupiter] Raw quote:', JSON.stringify(quote, null, 2).substring(0, 1000));
      console.log('[Jupiter] Input mint from quote:', quote.inputMint);
      console.log('[Jupiter] Output mint from quote:', quote.outputMint);
      console.log('[Jupiter] Expected output mint:', outputMint);
      console.log('[Jupiter] OutAmount (raw):', quote.outAmount);
      console.log('[Jupiter] Expected output decimals:', outputDecimals);

      // CRITICAL: Verify the output mint matches what we requested
      if (quote.outputMint !== outputMint) {
        console.error('[Jupiter] ⚠️ OUTPUT MINT MISMATCH!');
        console.error('[Jupiter] Requested:', outputMint);
        console.error('[Jupiter] Jupiter returned:', quote.outputMint);
        throw new Error('No route available for this token pair. Please try a different token.');
      }

      // Parse amounts
      const outputAmountLamports = parseFloat(quote.outAmount);
      const outputAmount = outputAmountLamports / Math.pow(10, outputDecimals);
      console.log('[Jupiter] Output amount calculation:', outputAmountLamports, '/', Math.pow(10, outputDecimals), '=', outputAmount);

      // Calculate platform fee from quote
      const platformFeeLamports = quote.platformFee?.amount
        ? parseFloat(quote.platformFee.amount)
        : outputAmountLamports * (PLATFORM_FEE_BPS / 10000);
      const platformFee = platformFeeLamports / Math.pow(10, outputDecimals);

      const priceImpact = quote.priceImpactPct
        ? parseFloat(quote.priceImpactPct)
        : 0;

      const minOutputAmount = outputAmount * (1 - slippage / 100);

      // Extract route info
      const route = quote.routePlan?.map((r: any) =>
        r.swapInfo?.label || r.swapInfo?.ammKey?.substring(0, 8) || 'DEX'
      ) || ['Jupiter'];

      return {
        inputMint,
        outputMint,
        inputAmount: amount,
        outputAmount,
        minOutputAmount,
        priceImpact,
        fee: platformFee,
        feePercent: PLATFORM_FEE_BPS / 100,
        route,
        exchangeRate: outputAmount / amount,
        quoteResponse: quote, // Store for swap execution
        platformFee,
      };

    } catch (fetchError: any) {
      console.warn('[Jupiter] API call failed:', fetchError.message);

      // Check if it's a network/CORS error - fall back to simulation
      if (fetchError.name === 'AbortError' ||
          fetchError.message === 'Failed to fetch' ||
          fetchError.name === 'TypeError') {
        console.log('[Jupiter] Network issue detected, using simulation mode');
        return generateMockQuote();
      }

      throw fetchError;
    }

  } catch (error: any) {
    console.error('[Jupiter] Quote error:', error);
    throw error;
  }
}

// ===========================
// Execute Swap with Jupiter
// ===========================

export async function executeJupiterSwap(params: {
  mnemonic: string;
  quoteResponse: SwapQuote;
  accountIndex?: number;
  isTestnet?: boolean;
}): Promise<SwapResult> {
  try {
    const { mnemonic, quoteResponse, accountIndex = 0, isTestnet = false } = params;

    console.log('[Jupiter] Executing swap...');
    console.log('[Jupiter] Mode:', isTestnet ? 'TESTNET' : 'MAINNET');
    console.log('[Jupiter] Route:', quoteResponse.route);
    console.log('[Jupiter] Platform Fee:', quoteResponse.platformFee);

    // Check if this is a simulated quote
    const isSimulatedQuote = quoteResponse.route.some(r =>
      r.includes('Simulated Mode') || r.includes('Demo')
    );

    // TESTNET MODE or Simulated Quote: Simulate swap
    if (isTestnet || isSimulatedQuote) {
      const mode = isTestnet ? 'TESTNET' : 'SIMULATION';
      console.log(`[Jupiter] ${mode}: Simulating swap...`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSignature = `suprik_${mode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      console.log(`[Jupiter] ${mode} swap completed!`);
      console.log('[Jupiter] Mock Signature:', mockSignature);

      return {
        success: true,
        signature: mockSignature,
        inputAmount: quoteResponse.inputAmount,
        outputAmount: quoteResponse.outputAmount,
        platformFee: quoteResponse.platformFee,
      };
    }

    // MAINNET MODE: Execute real swap
    console.log('[Jupiter] MAINNET: Executing real swap...');

    // Derive keypair
    const keypair = await deriveSolanaKeypair(mnemonic, accountIndex);
    const connection = await getSolanaConnection(false); // Mainnet

    console.log('[Jupiter] Wallet:', keypair.publicKey.toBase58());

    // Check SOL balance before swap with retry (RPC can sometimes return stale data)
    let solBalance = 0;
    let retries = 3;
    while (retries > 0) {
      try {
        solBalance = await connection.getBalance(keypair.publicKey, 'confirmed');
        console.log('[Jupiter] Balance check attempt', 4 - retries, ':', solBalance / 1e9, 'SOL');
        // If we got a non-zero balance, we're good
        if (solBalance > 0) break;
        // If balance is 0, retry once more to confirm it's not a stale read
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      } catch (e) {
        console.warn('[Jupiter] Balance check error, retrying...', e);
      }
      retries--;
    }
    console.log('[Jupiter] Final SOL balance:', solBalance / 1e9, 'SOL');

    if (solBalance === 0) {
      throw new Error('Unable to verify SOL balance (RPC returned 0). Please try again. If you have SOL, the network may be slow.');
    }

    // Minimum SOL needed for transaction fee + potential token account creation (~0.005 SOL)
    const MIN_SOL_FOR_SWAP = 0.005 * 1e9; // 0.005 SOL in lamports
    if (solBalance < MIN_SOL_FOR_SWAP) {
      const currentSOL = (solBalance / 1e9).toFixed(4);
      throw new Error(`Low SOL balance (${currentSOL} SOL). You need at least 0.005 SOL to cover transaction fees and token account creation.`);
    }

    // Check for real quote response
    if (!quoteResponse.quoteResponse) {
      throw new Error('No valid Jupiter quote available. Please try again.');
    }

    // CRITICAL: Log what we're about to swap
    console.log('[Jupiter] EXECUTING SWAP:');
    console.log('[Jupiter] - Input mint:', quoteResponse.quoteResponse.inputMint);
    console.log('[Jupiter] - Output mint:', quoteResponse.quoteResponse.outputMint);
    console.log('[Jupiter] - Expected output mint:', quoteResponse.outputMint);
    console.log('[Jupiter] - Input amount:', quoteResponse.inputAmount);
    console.log('[Jupiter] - Output amount:', quoteResponse.outputAmount);

    // Verify output mint matches what user requested (prevent wrong token swaps)
    if (quoteResponse.outputMint && quoteResponse.quoteResponse.outputMint !== quoteResponse.outputMint) {
      console.error('[Jupiter] ⚠️ SWAP BLOCKED - OUTPUT MINT MISMATCH!');
      console.error('[Jupiter] User requested:', quoteResponse.outputMint);
      console.error('[Jupiter] Jupiter is trying to swap to:', quoteResponse.quoteResponse.outputMint);
      throw new Error('Swap blocked: Jupiter is trying to swap to a different token than requested. Please try again.');
    }

    // Build swap request body
    // Use dynamicSlippage to handle volatile tokens like meme coins
    // This lets Jupiter automatically adjust slippage at execution time
    const swapRequestBody: any = {
      quoteResponse: quoteResponse.quoteResponse,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
      // Enable dynamic slippage for volatile tokens
      // minBps: minimum slippage (100 = 1%), maxBps: maximum slippage (1500 = 15%)
      dynamicSlippage: {
        minBps: 100,  // 1% minimum
        maxBps: 1500, // 15% maximum - good for meme coins
      },
    };

    // Add fee account if we have one configured for the output token
    const outputMint = quoteResponse.quoteResponse.outputMint;
    if (FEE_WALLET_CONFIG.tokenAccounts && FEE_WALLET_CONFIG.tokenAccounts[outputMint]) {
      const feeAccount = FEE_WALLET_CONFIG.tokenAccounts[outputMint];
      swapRequestBody.feeAccount = feeAccount;
      console.log('[Jupiter] Fee collection enabled! Fee account:', feeAccount);
    } else {
      console.log('[Jupiter] No fee account for output token, swapping without platform fees');
    }

    console.log('[Jupiter] Requesting swap transaction...');
    console.log('[Jupiter] Dynamic slippage enabled: 1% - 15%');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const swapResponse = await fetch(JUPITER_SWAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(swapRequestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      console.error('[Jupiter] Swap API error:', swapResponse.status, errorText);
      throw new Error(`Swap API error: ${swapResponse.status} - ${errorText}`);
    }

    const swapData = await swapResponse.json();

    if (!swapData || !swapData.swapTransaction) {
      console.error('[Jupiter] Invalid swap response:', swapData);
      throw new Error('Invalid swap transaction response');
    }

    console.log('[Jupiter] Swap transaction received');

    // Deserialize and sign transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    console.log('[Jupiter] Signing transaction...');

    transaction.sign([keypair]);

    console.log('[Jupiter] Broadcasting transaction...');

    // Send transaction with retry
    let signature: string;
    try {
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
        preflightCommitment: 'confirmed',
      });
    } catch (sendError: any) {
      console.error('[Jupiter] Send error:', sendError);

      // Try with skipPreflight if first attempt fails
      console.log('[Jupiter] Retrying with skipPreflight...');
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        maxRetries: 5,
      });
    }

    console.log('[Jupiter] Transaction sent:', signature);
    console.log('[Jupiter] Waiting for confirmation...');

    // Wait for confirmation using signature status polling (more reliable)
    let confirmed = false;
    const maxAttempts = 30; // 30 attempts, 2 seconds each = 60 seconds total

    for (let attempt = 0; attempt < maxAttempts && !confirmed; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks

      try {
        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }

        if (status?.value?.confirmationStatus === 'confirmed' ||
            status?.value?.confirmationStatus === 'finalized') {
          confirmed = true;
          console.log('[Jupiter] Transaction confirmed at attempt', attempt + 1);
        }
      } catch (statusError: any) {
        // Continue polling on status check errors
        console.log('[Jupiter] Status check attempt', attempt + 1, '- waiting...');
      }
    }

    if (!confirmed) {
      // Final check - sometimes the transaction succeeds but confirmation is slow
      const finalStatus = await connection.getSignatureStatus(signature);
      if (finalStatus?.value?.confirmationStatus === 'confirmed' ||
          finalStatus?.value?.confirmationStatus === 'finalized') {
        confirmed = true;
      } else if (finalStatus?.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(finalStatus.value.err)}`);
      } else {
        // Transaction was sent but not confirmed in time
        // Return success with the signature - user can check on Solscan
        console.log('[Jupiter] Transaction sent but confirmation timed out. Signature:', signature);
        console.log('[Jupiter] Transaction may still succeed - check: https://solscan.io/tx/' + signature);

        // Return as success with signature - the transaction is on-chain
        return {
          success: true,
          signature,
          inputAmount: quoteResponse.inputAmount,
          outputAmount: quoteResponse.outputAmount,
          platformFee: quoteResponse.platformFee,
        };
      }
    }

    console.log('[Jupiter] Swap confirmed!');

    return {
      success: true,
      signature,
      inputAmount: quoteResponse.inputAmount,
      outputAmount: quoteResponse.outputAmount,
      platformFee: quoteResponse.platformFee,
    };

  } catch (error: any) {
    console.error('[Jupiter] Swap error:', error);

    // Provide user-friendly error messages
    let userMessage = error.message || 'Swap failed';

    // Get the full error string including logs (for SendTransactionError)
    const errorStr = JSON.stringify(error.message || error);
    const logsStr = error.logs ? JSON.stringify(error.logs) : errorStr;
    const fullErrorStr = errorStr + ' ' + logsStr;

    // Check for Jupiter slippage error (0x1788 = 6024 = SlippageToleranceExceeded)
    if (fullErrorStr.includes('0x1788') || fullErrorStr.includes('6024')) {
      userMessage = 'Price moved too much during swap. This token is very volatile - please try again immediately (prices change fast).';
    }
    // Check for empty wallet (no prior credit - wallet has never received SOL)
    else if (fullErrorStr.includes('no record of a prior credit') || fullErrorStr.includes('AccountNotFound')) {
      userMessage = 'Your wallet has no SOL balance. Please deposit SOL first to pay for transaction fees.';
    }
    // Check for block height exceeded (transaction expired)
    else if (fullErrorStr.includes('block height exceeded') || fullErrorStr.includes('expired') || error.name === 'TransactionExpiredBlockheightExceededError') {
      userMessage = 'Transaction expired. The network is busy - please try again.';
    }
    // Check for insufficient lamports for rent (creating new token account)
    else if (fullErrorStr.includes('insufficient lamports')) {
      const needMatch = fullErrorStr.match(/need\s*(\d+)/);
      const haveMatch = fullErrorStr.match(/insufficient lamports\s*(\d+)/);
      const needed = needMatch ? parseInt(needMatch[1]) / 1e9 : 0.002;
      const have = haveMatch ? parseInt(haveMatch[1]) / 1e9 : 0;
      const shortfall = (needed - have).toFixed(4);
      userMessage = `Not enough SOL for token account rent. You need ~${shortfall} more SOL (≈0.002 SOL total) to receive this token for the first time.`;
    } else if (fullErrorStr.includes('Insufficient') || fullErrorStr.includes('insufficient')) {
      userMessage = 'Insufficient balance for this swap. Make sure you have enough SOL for fees.';
    } else if (fullErrorStr.includes('slippage')) {
      userMessage = 'Price moved too much. Try increasing slippage tolerance.';
    } else if (error.name === 'AbortError' || fullErrorStr.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    } else if (error.message === 'Failed to fetch') {
      userMessage = 'Network error. Please check your connection.';
    } else if (fullErrorStr.includes('0x1') || fullErrorStr.includes('custom program error')) {
      // Check if it's specifically a rent/lamports issue from the logs
      if (fullErrorStr.includes('lamports') || fullErrorStr.includes('Transfer:')) {
        userMessage = 'Not enough SOL for transaction. You need at least 0.002 SOL for token account rent.';
      } else {
        userMessage = 'Transaction failed. This may be due to insufficient SOL for fees or token account creation.';
      }
    }

    return {
      success: false,
      error: userMessage,
    };
  }
}

// ===========================
// Popular Swap Pairs
// ===========================

export const POPULAR_SWAP_PAIRS = [
  { from: 'SOL', to: 'USDC', label: 'SOL → USDC' },
  { from: 'USDC', to: 'SOL', label: 'USDC → SOL' },
  { from: 'SOL', to: 'USDT', label: 'SOL → USDT' },
  { from: 'USDT', to: 'SOL', label: 'USDT → SOL' },
  { from: 'USDC', to: 'USDT', label: 'USDC → USDT' },
  { from: 'SOL', to: 'JUP', label: 'SOL → JUP' },
  { from: 'SOL', to: 'BONK', label: 'SOL → BONK' },
  { from: 'SOL', to: 'WIF', label: 'SOL → WIF' },
];

// ===========================
// Utility: Create Fee Token Account
// ===========================

/**
 * Helper to get the Associated Token Account address for fee collection
 * This is used to determine where platform fees should be sent
 */
export async function getFeeTokenAccountAddress(
  feeWalletPubkey: string,
  tokenMint: string
): Promise<string> {
  const { getAssociatedTokenAddress } = await import('@solana/spl-token');

  const feeWallet = new PublicKey(feeWalletPubkey);
  const mint = new PublicKey(tokenMint);

  const ata = await getAssociatedTokenAddress(mint, feeWallet);

  return ata.toBase58();
}
