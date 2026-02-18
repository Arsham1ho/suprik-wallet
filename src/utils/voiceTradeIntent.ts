// Voice AI Trade Intent - Parsing and execution helpers
// Extracts structured trade intents from AI responses and resolves tokens

import { resolveMintAddress, resolveMintAddressAsync, getDecimalsForMint } from './jupiterSwap';
import { TOKEN_BY_SYMBOL, TOKEN_REGISTRY } from './tokenRegistry';
import { AccountManager } from './accountManager';
import type { SwapQuote } from './jupiterSwap';
import type { Token } from '../components/pages/Home';

export interface TradeIntent {
  action: 'swap' | 'send';
  fromToken: string;
  toToken: string;
  amount: number;
  amountType: 'exact' | 'percentage' | 'all' | 'usd';
  amountSide: 'from' | 'to'; // 'to' for "buy 1 USDC" (amount = output wanted)
  confidence: number;
  destination?: string; // For send: address or account reference ("account 1", "first account")
}

export interface ResolvedTrade {
  inputMint: string;
  outputMint: string;
  amount: number;
  inputDecimals: number;
  outputDecimals: number;
  swapMode: 'ExactIn' | 'ExactOut';
}

export const TRADE_SYSTEM_PROMPT = `You are a voice trading assistant for Suprik Wallet (Solana blockchain).
When the user explicitly asks to buy, sell, swap, or send tokens, include a JSON trade intent block at the END of your response in this exact format:

For swaps (selling/swapping — amount refers to what you spend):
\`\`\`trade
{
  "action": "swap",
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 0.5,
  "amountType": "exact",
  "amountSide": "from",
  "confidence": 0.95
}
\`\`\`

For buys (amount refers to what you want to RECEIVE):
\`\`\`trade
{
  "action": "swap",
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 1,
  "amountType": "exact",
  "amountSide": "to",
  "confidence": 0.95
}
\`\`\`

For sends:
\`\`\`trade
{
  "action": "send",
  "fromToken": "SOL",
  "toToken": "SOL",
  "amount": 1.0,
  "amountType": "exact",
  "amountSide": "from",
  "confidence": 0.95,
  "destination": "account 1"
}
\`\`\`

Rules:
- ALWAYS use ticker symbols in the trade block, NOT full names (e.g. "SOL" not "Solana", "BTC" not "Bitcoin", "ETH" not "Ethereum")
- "buy [amount] [token]" (e.g. "buy 1 USDC", "buy 5 ETH") ALWAYS means swap SOL → token. Set fromToken to "SOL", toToken to the token, amountSide to "to", and amount to the number of tokens the user wants to RECEIVE. This is a Solana wallet — all buys use SOL.
- "buy $[amount] of [token]" (dollar amounts) — set amountType to "usd", amountSide to "from". The dollar amount refers to how much SOL to spend.
- "sell X" means swap X → USDC. Set amountSide to "from".
- "swap X for Y" or "swap X to Y" means swap X → Y. Set amountSide to "from".
- "send X TOKEN to ADDRESS/ACCOUNT" means action "send". Set fromToken to the token, toToken to the same token, and destination to the target.
- For send destination: if user says "my first account" set destination to "account 1", "my second account" to "account 2", "third account" to "account 3", etc. If user provides a wallet address, set destination to that address string. If user says "send" without specifying where, set destination to "ask".
- If user says "all" or "everything", set amountType to "all" and amount to 0
- If user says "half", set amountType to "percentage" and amount to 50
- If user specifies a DOLLAR amount (e.g. "$1 of TRUMP", "5 dollars worth of SOL", "$10 USDC to BTC", "buy me $20 of ETH"), set amountType to "usd" and amount to the dollar value. Do NOT try to convert the dollar amount to a token amount yourself.
- Set confidence 0.0-1.0 based on clarity of intent
- ONLY include the trade block when user EXPLICITLY wants to execute a trade or send
- Do NOT include trade block for analysis, opinions, or questions about tokens
- Keep your spoken response brief (2-3 sentences max) since it will be read aloud

Portfolio access:
- The user's current portfolio balances are appended to their messages in a [User's Portfolio: ...] block
- When the user asks about their balance, holdings, or portfolio, READ this data and respond with the actual numbers
- You DO have access to their balances — never say you don't
- If the portfolio block is missing or empty, say "Your portfolio appears empty or is still loading"`;

/**
 * Check if the user's message actually requests a trade/send action.
 * Prevents false positives from less capable models (e.g. Llama) that generate
 * trade blocks for price queries or general questions.
 */
export function userRequestedTrade(userMessage: string): boolean {
  const msg = userMessage.toLowerCase();
  // Explicit trade keywords
  return /\b(buy|sell|swap|send|transfer|exchange|convert|trade|spend)\b/.test(msg);
}

/**
 * Parse a trade intent from an AI response.
 * Looks for a ```trade JSON block.
 */
export function parseTradeIntent(aiResponse: string): TradeIntent | null {
  const match = aiResponse.match(/```trade\s*\n?([\s\S]*?)```/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());

    // Validate required fields
    if (!parsed.action || !parsed.fromToken) return null;
    if (parsed.action === 'swap' && !parsed.toToken) return null;
    if (typeof parsed.confidence !== 'number') return null;
    if (!['swap', 'send'].includes(parsed.action)) return null;

    return {
      action: parsed.action,
      fromToken: parsed.fromToken.toUpperCase(),
      toToken: parsed.toToken?.toUpperCase() || parsed.fromToken.toUpperCase(),
      amount: Number(parsed.amount) || 0,
      amountType: parsed.amountType || 'exact',
      amountSide: parsed.amountSide === 'to' ? 'to' : 'from',
      confidence: parsed.confidence,
      ...(parsed.destination ? { destination: parsed.destination } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve trade intent tokens to mint addresses and calculate actual amounts.
 */
export async function resolveTradeTokens(
  intent: TradeIntent,
  userTokens: Token[],
): Promise<ResolvedTrade | null> {
  try {
    // Resolve mint addresses — pass as `symbol` (3rd arg), not `mint` (1st arg)
    let inputMint = resolveMintAddress(undefined, undefined, intent.fromToken);
    let outputMint = resolveMintAddress(undefined, undefined, intent.toToken);

    // Try async resolution if sync failed
    if (!inputMint) {
      const asyncMint = await resolveMintAddressAsync(undefined, undefined, intent.fromToken);
      if (asyncMint) inputMint = asyncMint;
    }
    if (!outputMint) {
      const asyncMint = await resolveMintAddressAsync(undefined, undefined, intent.toToken);
      if (asyncMint) outputMint = asyncMint;
    }

    if (!inputMint || !outputMint) return null;

    // Get decimals — prefer TOKEN_REGISTRY (has all tokens) over getDecimalsForMint (static map)
    const inputRegistryEntry = TOKEN_REGISTRY.find(
      t => t.mint === inputMint || t.symbol.toUpperCase() === intent.fromToken.toUpperCase()
    );
    const outputRegistryEntry = TOKEN_REGISTRY.find(
      t => t.mint === outputMint || t.symbol.toUpperCase() === intent.toToken.toUpperCase()
    );
    const inputDecimals = inputRegistryEntry?.decimals ?? getDecimalsForMint(inputMint);
    const outputDecimals = outputRegistryEntry?.decimals ?? getDecimalsForMint(outputMint);

    // Resolve amount and swap mode
    let amount = intent.amount;
    let swapMode: 'ExactIn' | 'ExactOut' = 'ExactIn';

    // ExactOut: "buy 1 USDC" — amount is the desired output, let Jupiter calculate input
    if (intent.amountSide === 'to' && intent.amountType === 'exact') {
      swapMode = 'ExactOut';
      // amount stays as-is (desired output amount)
      if (amount <= 0) return null;
      return { inputMint, outputMint, amount, inputDecimals, outputDecimals, swapMode };
    }

    // ExactIn: amount refers to the input token
    if (intent.amountType === 'usd') {
      // Convert USD dollar amount to fromToken amount using current prices
      const fromTokenData = userTokens.find(
        t => t.symbol.toUpperCase() === intent.fromToken.toUpperCase()
      );
      if (!fromTokenData || !fromTokenData.price || fromTokenData.price <= 0) return null;

      amount = intent.amount / fromTokenData.price;

      // Reserve some SOL for fees + don't exceed balance
      if (intent.fromToken.toUpperCase() === 'SOL') {
        const maxAmount = Math.max(0, (fromTokenData.amount || 0) - 0.01);
        amount = Math.min(amount, maxAmount);
      } else {
        amount = Math.min(amount, fromTokenData.amount || 0);
      }
    } else if (intent.amountType === 'all' || intent.amountType === 'percentage') {
      // Find user's balance for fromToken
      const userToken = userTokens.find(
        t => t.symbol.toUpperCase() === intent.fromToken.toUpperCase()
      );

      if (!userToken || userToken.amount <= 0) return null;

      if (intent.amountType === 'all') {
        // Reserve some SOL for fees if swapping SOL
        if (intent.fromToken.toUpperCase() === 'SOL') {
          amount = Math.max(0, userToken.amount - 0.01);
        } else {
          amount = userToken.amount;
        }
      } else {
        // Percentage
        const pct = intent.amount / 100;
        amount = userToken.amount * pct;
        if (intent.fromToken.toUpperCase() === 'SOL') {
          amount = Math.max(0, amount - 0.005);
        }
      }
    }

    if (amount <= 0) return null;

    return { inputMint, outputMint, amount, inputDecimals, outputDecimals, swapMode };
  } catch (error) {
    console.error('[voiceTradeIntent] Failed to resolve tokens:', error);
    return null;
  }
}

/**
 * Build a speakable summary of a trade + quote for TTS.
 */
export function buildTradeSummary(intent: TradeIntent, quote: SwapQuote, resolvedAmount?: number): string {
  // ExactOut: "Buy 1 USDC for approximately 0.012 SOL"
  if (intent.amountSide === 'to' && intent.amountType === 'exact') {
    const outputAmt = resolvedAmount || intent.amount;
    const inputAmt = quote.inputAmount;
    const inputStr = inputAmt >= 1 ? inputAmt.toFixed(4) : inputAmt.toFixed(6);
    return `Buy ${outputAmt} ${intent.toToken} for approximately ${inputStr} ${intent.fromToken}. Fee: ${quote.feePercent.toFixed(1)}%`;
  }

  // ExactIn: "Swap X SOL for approximately Y USDC"
  let fromAmt: string;
  if (intent.amountType === 'all') {
    fromAmt = `all your ${intent.fromToken}`;
  } else if (intent.amountType === 'usd') {
    const tokenAmt = resolvedAmount || 0;
    fromAmt = `$${intent.amount} worth of ${intent.fromToken} (${tokenAmt.toFixed(tokenAmt >= 1 ? 2 : 6)} ${intent.fromToken})`;
  } else {
    fromAmt = `${resolvedAmount || intent.amount} ${intent.fromToken}`;
  }

  const toAmt = quote.outputAmount.toFixed(
    quote.outputAmount >= 1 ? 2 : 4
  );

  return `Swap ${fromAmt} for approximately ${toAmt} ${intent.toToken}. Fee: ${quote.feePercent.toFixed(1)}%`;
}

// --- Send support ---

const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
};

/**
 * Resolve a send destination string to a Solana address.
 * Handles: "account 1", "first account", raw Solana address, "ask".
 */
export function resolveDestination(dest?: string): string | null {
  if (!dest || dest === 'ask') return null;

  const d = dest.trim().toLowerCase();

  // "account N" pattern
  const accountNumMatch = d.match(/account\s*(\d+)/);
  if (accountNumMatch) {
    const idx = parseInt(accountNumMatch[1], 10) - 1; // 1-based → 0-based
    const account = AccountManager.getAccountByIndex(idx);
    return account?.addresses?.solana || null;
  }

  // "first account", "second account", etc.
  for (const [word, num] of Object.entries(ORDINALS)) {
    if (d.includes(word)) {
      const account = AccountManager.getAccountByIndex(num - 1);
      return account?.addresses?.solana || null;
    }
  }

  // Raw Solana address (base58, 32-44 chars, only alphanumeric)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(dest.trim())) {
    return dest.trim();
  }

  return null;
}

/**
 * Resolve send amount from a TradeIntent using portfolio balances.
 * Returns the token amount to send, its mint address, and decimals.
 */
export function resolveSendAmount(
  intent: TradeIntent,
  userTokens: Token[],
): { amount: number; mint: string; decimals: number } | null {
  const tokenData = userTokens.find(
    t => t.symbol.toUpperCase() === intent.fromToken.toUpperCase()
  );
  if (!tokenData || tokenData.amount <= 0) return null;

  // Resolve mint
  const registryEntry = TOKEN_REGISTRY.find(
    t => t.symbol.toUpperCase() === intent.fromToken.toUpperCase()
  );
  const mint = registryEntry?.mint || tokenData.mint || '';
  if (!mint) return null;

  const decimals = registryEntry?.decimals ?? getDecimalsForMint(mint);

  let amount = intent.amount;

  if (intent.amountType === 'usd') {
    if (!tokenData.price || tokenData.price <= 0) return null;
    amount = intent.amount / tokenData.price;
  } else if (intent.amountType === 'all') {
    amount = intent.fromToken.toUpperCase() === 'SOL'
      ? Math.max(0, tokenData.amount - 0.01)
      : tokenData.amount;
  } else if (intent.amountType === 'percentage') {
    const pct = intent.amount / 100;
    amount = tokenData.amount * pct;
    if (intent.fromToken.toUpperCase() === 'SOL') {
      amount = Math.max(0, amount - 0.005);
    }
  }

  // Cap at balance
  if (intent.fromToken.toUpperCase() === 'SOL') {
    amount = Math.min(amount, Math.max(0, tokenData.amount - 0.005));
  } else {
    amount = Math.min(amount, tokenData.amount);
  }

  if (amount <= 0) return null;

  return { amount, mint, decimals };
}
