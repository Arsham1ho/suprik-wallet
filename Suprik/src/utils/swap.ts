/**
 * Saturn Wallet - Swap Utilities
 * Now uses Jupiter for Solana swaps (best DEX aggregator)
 */

// Re-export everything from jupiterSwap
export {
  getJupiterSwapQuote,
  executeJupiterSwap,
  getTokenMint,
  getTokenDecimals,
  POPULAR_SWAP_PAIRS,
  type SwapQuote,
  type SwapResult,
} from './jupiterSwap';

// Keep old function names for backward compatibility
import {
  getJupiterSwapQuote,
  executeJupiterSwap,
  type SwapQuote,
} from './jupiterSwap';

/**
 * Get swap quote (uses Jupiter)
 */
export async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage?: number;
  isTestnet?: boolean;
}): Promise<SwapQuote | null> {
  return getJupiterSwapQuote(params);
}

/**
 * Execute swap (uses Jupiter)
 */
export async function executeSwap(params: {
  mnemonic: string;
  quoteResponse: any;
  accountIndex?: number;
  isTestnet?: boolean;
}) {
  return executeJupiterSwap(params);
}

// Helper functions for formatting amounts
export function formatAmountForSwap(amount: number, decimals: number): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

export function formatAmountFromSwap(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals);
}
