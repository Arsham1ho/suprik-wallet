// Puter.com AI integration - free AI proxy (no API key needed)
// Provides access to Grok 4, GPT-4o, Claude, Gemini via puter.ai.chat()

import { SYMBOL_TO_COINGECKO, fetchCoinGeckoPrices } from './coingecko';

const AI_MODEL = 'gpt-4o';

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          messages: Array<{ role: string; content: string }>,
          options: { model: string; stream: boolean }
        ) => Promise<any>;
      };
    };
    _puterLoading?: Promise<void>;
  }
}

// --- Puter CDN Loader ---

let puterReady = false;

export async function loadPuterSDK(): Promise<void> {
  if (puterReady && window.puter?.ai) return;
  if (window._puterLoading) return window._puterLoading;

  // SDK is loaded via <script> tag in index.html to avoid CORS issues.
  // Just poll until window.puter.ai becomes available.
  window._puterLoading = new Promise<void>((resolve, reject) => {
    if (window.puter?.ai) {
      if (typeof window.puter.ai.chat !== 'function') {
        reject(new Error('Puter SDK loaded but API shape is invalid'));
        return;
      }
      puterReady = true;
      resolve();
      return;
    }

    let attempts = 0;
    const check = () => {
      if (window.puter?.ai) {
        if (typeof window.puter.ai.chat !== 'function') {
          reject(new Error('Puter SDK loaded but API shape is invalid'));
          return;
        }
        puterReady = true;
        resolve();
      } else if (attempts < 100) {
        attempts++;
        setTimeout(check, 100);
      } else {
        reject(new Error('Puter AI SDK not available. Check your internet connection.'));
      }
    };
    check();
  });

  return window._puterLoading;
}

// --- Agent Definitions ---

export interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  initial: string;
  avatar: string;
  gradientFrom: string;
  gradientTo: string;
  color: string;
  bgColor: string;
  aliases: string[];
  keywords: string[];
  systemPrompt: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Market Analyst',
    emoji: '🎯',
    initial: 'A',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=transparent',
    gradientFrom: '#3b82f6',
    gradientTo: '#6366f1',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    aliases: ['alex', 'stock', 'pick', 'general', 'crypto'],
    keywords: ['stock', 'pick', 'recommend', 'buy', 'sell', 'what should', 'which stock', 'best stock', 'opinion', 'think about', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto', 'token', 'coin', 'altcoin', 'memecoin', 'nft'],
    systemPrompt: `You are Alex, a market analyst AI assistant inside Suprik Wallet. You help users analyze stocks AND crypto assets — tokens, coins, DeFi protocols, and market trends. Be concise and helpful. Use bullet points and **bold** for key terms. Keep answers under 200 words.`,
  },
  {
    id: 'warren',
    name: 'Warren',
    role: 'Value Analyst',
    emoji: '📊',
    initial: 'W',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Warren&backgroundColor=transparent',
    gradientFrom: '#22c55e',
    gradientTo: '#16a34a',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    aliases: ['warren', 'value', 'buffett', 'fundamental'],
    keywords: ['p/e', 'pe ratio', 'intrinsic value', 'margin of safety', 'undervalued', 'overvalued', 'earnings', 'book value', 'dividend', 'moat', 'competitive advantage', 'value investing', 'dcf', 'cash flow', 'tokenomics', 'tvl', 'total value locked', 'revenue', 'protocol revenue', 'fdv', 'fully diluted', 'market cap', 'mcap'],
    systemPrompt: `You are Warren, a value-focused AI analyst inspired by Warren Buffett's philosophy. For stocks: focus on P/E ratios, intrinsic value, margin of safety, competitive moats, and earnings quality. For crypto: focus on tokenomics, TVL, protocol revenue, FDV-to-revenue ratios, token supply mechanics, and real yield. Be concise, use bullet points and **bold** for key metrics. Keep answers under 200 words.`,
  },
  {
    id: 'cathie',
    name: 'Cathie',
    role: 'Growth Analyst',
    emoji: '🚀',
    initial: 'C',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Cathie&backgroundColor=transparent',
    gradientFrom: '#ec4899',
    gradientTo: '#f43f5e',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    aliases: ['cathie', 'growth', 'ark', 'innovation', 'defi'],
    keywords: ['growth', 'disruption', 'innovation', 'tam', 'total addressable market', 'revenue growth', 'scalability', 'ark', 'disruptive', 'exponential', 'ai stock', 'tech stock', 'defi', 'layer 2', 'l2', 'adoption', 'users', 'dau', 'tps', 'ecosystem', 'web3', 'dapp'],
    systemPrompt: `You are Cathie, a growth-focused AI analyst inspired by disruptive innovation themes. For stocks: focus on TAM expansion, revenue growth, scalability, and platform effects. For crypto: focus on ecosystem growth, developer activity, TVL growth, user adoption (DAU), layer-2 scaling, and DeFi innovation. Be enthusiastic but data-driven. Use bullet points and **bold**. Keep answers under 200 words.`,
  },
  {
    id: 'linda',
    name: 'Linda',
    role: 'Technical Analyst',
    emoji: '📈',
    initial: 'L',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Linda&backgroundColor=transparent',
    gradientFrom: '#eab308',
    gradientTo: '#f59e0b',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    aliases: ['linda', 'technical', 'ta', 'chart', 'charts'],
    keywords: ['rsi', 'macd', 'support', 'resistance', 'moving average', 'sma', 'ema', 'fibonacci', 'bollinger', 'pattern', 'breakout', 'head and shoulders', 'double top', 'double bottom', 'trend', 'volume', 'overbought', 'oversold', 'candlestick', 'price action', 'chart', 'pump', 'dump', 'ath', 'all time high'],
    systemPrompt: `You are Linda, a technical analysis AI assistant. You analyze chart patterns for both stocks and crypto assets. Focus on RSI, MACD, moving averages, support/resistance levels, Fibonacci retracements, volume analysis, and price action. For crypto, also consider on-chain volume, exchange flows, and liquidation levels. Use bullet points and **bold**. Keep answers under 200 words.`,
  },
  {
    id: 'ray',
    name: 'Ray',
    role: 'Macro Strategist',
    emoji: '🌍',
    initial: 'R',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ray&backgroundColor=transparent',
    gradientFrom: '#06b6d4',
    gradientTo: '#0ea5e9',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    aliases: ['ray', 'macro', 'economy', 'dalio'],
    keywords: ['interest rate', 'fed', 'inflation', 'gdp', 'economic', 'cycle', 'recession', 'monetary', 'fiscal', 'treasury', 'bond', 'yield', 'forex', 'fx', 'currency', 'central bank', 'cpi', 'unemployment', 'tariff', 'regulation', 'sec', 'etf', 'halving', 'stablecoin', 'cbdc', 'liquidity'],
    systemPrompt: `You are Ray, a macroeconomic strategist AI inspired by Ray Dalio's principles. For stocks: focus on interest rate cycles, inflation, economic indicators, and credit cycles. For crypto: focus on global liquidity, regulation (SEC, MiCA), Bitcoin halving cycles, stablecoin flows, ETF inflows, and how macro forces drive crypto markets. Use bullet points and **bold**. Keep answers under 200 words.`,
  },
  {
    id: 'nassim',
    name: 'Nassim',
    role: 'Risk Analyst',
    emoji: '⚡',
    initial: 'N',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Nassim&backgroundColor=transparent',
    gradientFrom: '#ef4444',
    gradientTo: '#dc2626',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    aliases: ['nassim', 'risk', 'taleb', 'volatility'],
    keywords: ['risk', 'volatility', 'drawdown', 'black swan', 'tail risk', 'antifragile', 'hedge', 'beta', 'correlation', 'var', 'sharpe', 'max drawdown', 'portfolio risk', 'diversification', 'crash', 'rug pull', 'exploit', 'hack', 'depeg', 'impermanent loss', 'smart contract risk'],
    systemPrompt: `You are Nassim, a risk analysis AI inspired by Nassim Taleb's philosophy. For stocks: focus on tail risk, volatility, drawdowns, and antifragility. For crypto: also consider smart contract risk, rug pulls, exchange counterparty risk, depeg scenarios, impermanent loss, and regulatory risk. Be skeptical of hype. Use bullet points and **bold**. Keep answers under 200 words.`,
  },
];

export const DEFAULT_AGENT = AGENTS[0]; // Alex

// --- Roundtable Configuration ---

export const ROUNDTABLE_ORDER = AGENTS; // All 6 agents in order

export const MODERATOR_AGENT: Agent = {
  id: 'moderator',
  name: 'Moderator',
  role: 'Summary',
  emoji: '⚖️',
  initial: 'M',
  avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Moderator&backgroundColor=transparent',
  gradientFrom: '#a855f7',
  gradientTo: '#7c3aed',
  color: 'text-purple-400',
  bgColor: 'bg-purple-500/20',
  aliases: [],
  keywords: [],
  systemPrompt: `You are the Moderator synthesizing a panel discussion about a stock or crypto asset. Summarize ALL analyst opinions into a brief verdict. Include: **Consensus Score** (average of all scores, X/10), top **Bull Points**, top **Bear Points**, and a **Final Verdict** (Strong Buy / Buy / Hold / Sell / Strong Sell). Use bullet points and **bold**. Keep under 120 words.`,
};

const ROUNDTABLE_DELAY = 300; // ms between agent calls

function buildRoundtablePrompt(agent: Agent): string {
  return `You are ${agent.name}, a ${agent.role.toLowerCase()} in a roundtable discussion about a stock or crypto asset. You MUST reference at least one prior analyst by name — say whether you agree or disagree with their take and why. Then add your own unique insight from your specialty. Give a **Score: X/10** at the end. Keep under 100 words.`;
}

// --- Agent Routing ---

export function resolveAgent(userMessage: string): Agent {
  const lowerMsg = userMessage.toLowerCase();

  // 1. Check for explicit @mention
  const mentionMatch = lowerMsg.match(/@(\w+)/);
  if (mentionMatch) {
    const mention = mentionMatch[1];
    const found = AGENTS.find(a => a.aliases.includes(mention));
    if (found) return found;
  }

  // 2. Keyword-based auto-selection (score by keyword length for specificity)
  let bestAgent = DEFAULT_AGENT;
  let bestScore = 0;

  for (const agent of AGENTS) {
    let score = 0;
    for (const kw of agent.keywords) {
      if (lowerMsg.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  return bestAgent;
}

export function stripMention(message: string): string {
  return message.replace(/@\w+\s*/g, '').trim();
}

export function isRoundtableRequest(message: string): boolean {
  return /@all\b/i.test(message);
}

export function hasExplicitMention(message: string): boolean {
  const match = message.toLowerCase().match(/@(\w+)/);
  if (!match) return false;
  const mention = match[1];
  if (mention === 'all') return false;
  return AGENTS.some(a => a.aliases.includes(mention));
}

// --- Chat Message Type ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  timestamp: number;
}

// --- Live Price Context ---

// Common crypto names → symbol for natural language detection
const NAME_TO_SYMBOL: Record<string, string> = {
  'bitcoin': 'BTC', 'ethereum': 'ETH', 'solana': 'SOL', 'bonk': 'BONK',
  'dogecoin': 'DOGE', 'cardano': 'ADA', 'polkadot': 'DOT', 'chainlink': 'LINK',
  'uniswap': 'UNI', 'avalanche': 'AVAX', 'polygon': 'MATIC', 'litecoin': 'LTC',
  'shiba': 'SHIB', 'pepe': 'PEPE', 'jupiter': 'JUP', 'raydium': 'RAY',
  'render': 'RENDER', 'helium': 'HNT', 'wormhole': 'W', 'pyth': 'PYTH',
  'jito': 'JTO', 'orca': 'ORCA', 'popcat': 'POPCAT', 'sui': 'SUI',
  'arbitrum': 'ARB', 'optimism': 'OP', 'cosmos': 'ATOM', 'near': 'NEAR',
  'aptos': 'APT', 'celestia': 'TIA', 'injective': 'INJ', 'aave': 'AAVE',
  'maker': 'MKR', 'bittensor': 'TAO',
};

// Words that are common English but also ticker symbols — skip them
const TICKER_BLOCKLIST = new Set(['A', 'I', 'AT', 'AM', 'AN', 'AS', 'BE', 'BY', 'DO', 'GO',
  'IF', 'IN', 'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'OK', 'ON', 'OR', 'SO', 'TO', 'UP', 'US',
  'WE', 'ALL', 'AND', 'ARE', 'BUT', 'CAN', 'FOR', 'HAS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOT',
  'NOW', 'OLD', 'ONE', 'OUR', 'OUT', 'OWN', 'SAY', 'THE', 'TOO', 'TWO', 'WAY', 'WHO', 'WHY',
  'YOU', 'WHAT', 'WILL', 'GOOD', 'HOLD', 'LONG', 'BEST', 'RISK', 'SAFE', 'HIGH', 'LOW']);

export function extractTickers(message: string): string[] {
  const tickers = new Set<string>();
  const words = message.replace(/[?!.,;:()'"\[\]]/g, ' ').split(/\s+/);

  for (const word of words) {
    if (!word) continue;
    const upper = word.toUpperCase();
    const lower = word.toLowerCase();

    // Check symbol match (e.g., "SOL", "BTC") — skip blocklisted common words
    if (SYMBOL_TO_COINGECKO[upper] && !TICKER_BLOCKLIST.has(upper)) {
      tickers.add(upper);
    }

    // Check name match (e.g., "bitcoin", "solana")
    if (NAME_TO_SYMBOL[lower]) {
      tickers.add(NAME_TO_SYMBOL[lower]);
    }
  }

  return Array.from(tickers).slice(0, 5); // Limit to 5 tickers per query
}

export async function fetchPriceContext(message: string): Promise<string> {
  const tickers = extractTickers(message);
  if (tickers.length === 0) return '';

  try {
    const coinGeckoIds = tickers
      .map(t => SYMBOL_TO_COINGECKO[t])
      .filter(Boolean);

    if (coinGeckoIds.length === 0) return '';

    const prices = await fetchCoinGeckoPrices(coinGeckoIds);

    const parts: string[] = [];
    for (const ticker of tickers) {
      const cgId = SYMBOL_TO_COINGECKO[ticker];
      if (cgId && prices[cgId]) {
        const { price, change24h, marketCap } = prices[cgId];
        const priceStr = price >= 1
          ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
          : `$${price.toPrecision(4)}`;
        const changeStr = change24h >= 0 ? `+${change24h.toFixed(1)}%` : `${change24h.toFixed(1)}%`;
        const mcStr = marketCap > 1e9
          ? `$${(marketCap / 1e9).toFixed(1)}B`
          : marketCap > 1e6
            ? `$${(marketCap / 1e6).toFixed(0)}M`
            : '';
        parts.push(`${ticker}: ${priceStr} (24h: ${changeStr}${mcStr ? `, MC: ${mcStr}` : ''})`);
      }
    }

    if (parts.length === 0) return '';
    return `\n\n[Live Market Data: ${parts.join(' | ')}]`;
  } catch (err) {
    console.warn('[PuterAI] Failed to fetch price context:', err);
    return '';
  }
}

// --- Puter AI Call (Streaming) ---

export async function callPuterAI(
  messages: ChatMessage[],
  agent: Agent,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  await loadPuterSDK();

  if (!window.puter?.ai) {
    throw new Error('AI service is not available. Please try again.');
  }

  // Build API messages with system prompt + last 10 messages for context
  const recentMessages = messages.slice(-10);
  const apiMessages = [
    { role: 'system', content: agent.systemPrompt },
    ...recentMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  ];

  // Try streaming first, fall back to non-streaming
  let fullText = '';

  try {
    const response = await Promise.race([
      window.puter.ai.chat(apiMessages, {
        model: AI_MODEL,
        stream: true,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 30000)
      ),
    ]);

    if (response && Symbol.asyncIterator in Object(response)) {
      for await (const chunk of response as any) {
        if (signal?.aborted) break;
        const text = chunk?.text || chunk?.message?.content || '';
        if (text) {
          fullText += text;
          onChunk(fullText);
        }
      }
    } else {
      // Non-streaming response
      const resp = response as any;
      fullText = resp?.message?.content || resp?.text || String(resp || '');
      onChunk(fullText);
    }
  } catch (streamError: any) {
    // If streaming failed, try non-streaming as fallback
    if (signal?.aborted) throw streamError;
    console.warn('[PuterAI] Streaming failed, trying non-streaming:', streamError.message);

    const response = await Promise.race([
      window.puter.ai.chat(apiMessages, {
        model: AI_MODEL,
        stream: false,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 30000)
      ),
    ]) as any;

    fullText = response?.message?.content || response?.text || String(response || '');
    onChunk(fullText);
  }

  if (!fullText) {
    throw new Error('No response from AI. Please try again.');
  }

  return fullText;
}

// --- Roundtable Orchestration ---

interface RoundtableCallbacks {
  onAgentStart: (agent: Agent) => string; // returns placeholder message ID
  onChunk: (msgId: string, text: string) => void;
  onAgentDone: (msgId: string, finalText: string) => void;
  onProgress: (current: number, total: number, agent: Agent) => void;
}

export async function callRoundtable(
  userMessage: string,
  callbacks: RoundtableCallbacks,
  signal: AbortSignal,
): Promise<void> {
  await loadPuterSDK();

  if (!window.puter?.ai) {
    throw new Error('AI service is not available. Please try again.');
  }

  const cleanMessage = stripMention(userMessage);
  const agents = ROUNDTABLE_ORDER;
  const totalSteps = agents.length + 1; // agents + moderator
  const conversationHistory: Array<{ agentName: string; agentRole: string; content: string }> = [];

  // Run each agent sequentially
  for (let i = 0; i < agents.length; i++) {
    if (signal.aborted) return;

    const agent = agents[i];
    callbacks.onProgress(i + 1, totalSteps, agent);

    // Build context: roundtable prompt + user question + prior agents' responses
    const priorContext = conversationHistory
      .map(h => `${h.agentName} (${h.agentRole}): ${h.content}`)
      .join('\n\n');

    const contextMessage = priorContext
      ? `User question: ${cleanMessage}\n\nPrevious analyst opinions:\n${priorContext}`
      : cleanMessage;

    const apiMessages: ChatMessage[] = [
      { id: 'ctx', role: 'user', content: contextMessage, timestamp: Date.now() },
    ];

    const msgId = callbacks.onAgentStart(agent);

    try {
      const overrideAgent: Agent = { ...agent, systemPrompt: buildRoundtablePrompt(agent) };

      const finalText = await callPuterAI(
        apiMessages,
        overrideAgent,
        (text) => callbacks.onChunk(msgId, text),
        signal,
      );

      callbacks.onAgentDone(msgId, finalText);
      conversationHistory.push({ agentName: agent.name, agentRole: agent.role, content: finalText });
    } catch (err: any) {
      if (signal.aborted) return;
      callbacks.onAgentDone(msgId, `*${agent.name} was unable to respond.*`);
      conversationHistory.push({ agentName: agent.name, agentRole: agent.role, content: '(no response)' });
    }

    // Delay between agents
    if (i < agents.length - 1 && !signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, ROUNDTABLE_DELAY));
    }
  }

  // Run Moderator to synthesize
  if (signal.aborted) return;

  callbacks.onProgress(totalSteps, totalSteps, MODERATOR_AGENT);

  const summaryContext = conversationHistory
    .map(h => `${h.agentName} (${h.agentRole}): ${h.content}`)
    .join('\n\n');

  const summaryMessages: ChatMessage[] = [
    { id: 'summary', role: 'user', content: `User question: ${cleanMessage}\n\nAnalyst discussion:\n${summaryContext}`, timestamp: Date.now() },
  ];

  const summaryMsgId = callbacks.onAgentStart(MODERATOR_AGENT);

  try {
    const summaryText = await callPuterAI(
      summaryMessages,
      MODERATOR_AGENT,
      (text) => callbacks.onChunk(summaryMsgId, text),
      signal,
    );

    callbacks.onAgentDone(summaryMsgId, summaryText);
  } catch {
    if (!signal.aborted) {
      callbacks.onAgentDone(summaryMsgId, '*Unable to generate summary.*');
    }
  }
}
