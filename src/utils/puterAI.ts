// AI integration — supports multiple providers:
// 1. Puter.com (free proxy, GPT-4o) — primary
// 2. Cloudflare Workers AI (free tier, Llama 3.1 8B) — fallback
// 3. Ollama (self-hosted, Llama 3.2 3B) — private server

import { SYMBOL_TO_COINGECKO, fetchCoinGeckoPrices } from './coingecko';

const AI_MODEL = 'gpt-4o';
// --- AI Provider Toggle ---
export type AIProvider = 'puter' | 'cloudflare' | 'ollama';

// Default Cloudflare Worker URL (can be overridden in Settings > API Keys)
const CLOUDFLARE_WORKER_URL = localStorage.getItem('suprik_cf_worker_url') || 'https://suprik-ai.arsham7hosseini10.workers.dev';

// Ollama server URL — stored in localStorage (no hardcoded IP in source code)
const DEFAULT_OLLAMA_URL = '';

let currentProvider: AIProvider = (localStorage.getItem('suprik_ai_provider') as AIProvider) || 'cloudflare';

export function getAIProvider(): AIProvider {
  return currentProvider;
}

export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider;
  try { localStorage.setItem('suprik_ai_provider', provider); } catch {}
}

export function getCloudflareWorkerURL(): string {
  try { return localStorage.getItem('suprik_cf_worker_url') || ''; } catch { return ''; }
}

export function setCloudflareWorkerURL(url: string): void {
  try { localStorage.setItem('suprik_cf_worker_url', url); } catch {}
}

export function getOllamaURL(): string {
  try { return localStorage.getItem('suprik_ollama_url') || DEFAULT_OLLAMA_URL; } catch { return DEFAULT_OLLAMA_URL; }
}

export function setOllamaURL(url: string): void {
  try { localStorage.setItem('suprik_ollama_url', url); } catch {}
}

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          messages: Array<{ role: string; content: string }>,
          options: { model: string; stream: boolean }
        ) => Promise<any>;
        txt2speech: (
          text: string,
          options?: {
            provider?: string;
            model?: string;
            voice?: string;
            instructions?: string;
            response_format?: string;
            language?: string;
          }
        ) => Promise<HTMLAudioElement>;
      };
    };
    _puterLoading?: Promise<void>;
  }
}

// --- Puter balance/credits guard ---
// Persisted: once Puter fails with "Low Balance", skip all Puter API calls to avoid popups
let puterDisabled = false;
try { puterDisabled = localStorage.getItem('suprik_puter_disabled') === 'true'; } catch {}

function disablePuter() {
  puterDisabled = true;
  try { localStorage.setItem('suprik_puter_disabled', 'true'); } catch {}
}

export function resetPuter(): void {
  puterDisabled = false;
  try { localStorage.removeItem('suprik_puter_disabled'); } catch {}
}

export function isPuterDisabled(): boolean {
  return puterDisabled;
}

// --- Puter popup blocker ---
// Puter SDK injects "Low Balance" popups into the DOM (possibly via iframe/shadow DOM).
// This aggressively finds and removes them using multiple strategies.
let popupBlockerSetup = false;

function setupPuterPopupBlocker(): void {
  if (popupBlockerSetup || typeof document === 'undefined') return;
  popupBlockerSetup = true;

  function dismissPuterPopup(el: Element): void {
    // Try clicking Close button first
    const buttons = el.querySelectorAll('button');
    for (const btn of buttons) {
      const t = btn.textContent?.trim().toLowerCase() || '';
      if (t === 'close' || t === '×' || t === 'x') {
        btn.click();
        disablePuter();
        return;
      }
    }
    // Fallback: remove the element
    el.remove();
    disablePuter();
  }

  function scanAndDismiss(): void {
    // Scan all direct children of body for Puter popups
    const candidates = document.querySelectorAll('body > div, body > iframe');
    for (const el of candidates) {
      const text = el.textContent || '';
      if (text.includes('Low Balance') || text.includes('not enough funding') || text.includes('Upgrade Now')
        || text.includes('usage limit') || text.includes('insufficient_funds') || text.includes('please upgrade')) {
        dismissPuterPopup(el);
        return;
      }
      // Check for iframes containing the popup
      if (el instanceof HTMLIFrameElement) {
        try {
          const iframeText = el.contentDocument?.body?.textContent || '';
          if (iframeText.includes('Low Balance') || iframeText.includes('not enough funding')
            || iframeText.includes('usage limit') || iframeText.includes('please upgrade')) {
            el.remove();
            disablePuter();
            return;
          }
        } catch { /* cross-origin iframe, can't access */ }
      }
    }
    // Also check for any fixed-position overlays with very high z-index
    for (const el of document.querySelectorAll('div[style]')) {
      const style = (el as HTMLElement).style;
      if (style.position === 'fixed' && parseInt(style.zIndex || '0') > 99000) {
        const text = el.textContent || '';
        if (text.includes('Low Balance') || text.includes('Upgrade') || text.includes('usage limit')) {
          dismissPuterPopup(el);
          return;
        }
      }
    }
  }

  // Strategy 1: MutationObserver for immediate detection
  const observer = new MutationObserver(() => scanAndDismiss());
  observer.observe(document.body, { childList: true, subtree: true });

  // Strategy 2: Periodic scan (catches iframes, shadow DOM, delayed injections)
  let scanCount = 0;
  const scanInterval = setInterval(() => {
    scanAndDismiss();
    scanCount++;
    if (scanCount > 150) clearInterval(scanInterval); // Stop after 30s
  }, 200);
}

// --- Puter auth popup guard ---
// The Puter SDK opens a popup to puter.com on first use for authentication.
// This guard intercepts window.open during puter.ai.chat() calls, blocking the
// auth popup when Cloudflare fallback is available. Already-authenticated users
// (who have a valid Puter session) are unaffected since no popup is triggered.

let puterAuthNeeded = false;
try { puterAuthNeeded = localStorage.getItem('suprik_puter_auth_needed') === 'true'; } catch {}

function markPuterAuthNeeded(): void {
  puterAuthNeeded = true;
  try { localStorage.setItem('suprik_puter_auth_needed', 'true'); } catch {}
}

export function clearPuterAuthNeeded(): void {
  puterAuthNeeded = false;
  try { localStorage.removeItem('suprik_puter_auth_needed'); } catch {}
}

/**
 * Call puter.ai.chat() with a guard that intercepts auth popups.
 * If the SDK tries to open puter.com for auth, block it and throw a
 * recognizable error so the caller can fall back to Cloudflare.
 */
function callPuterChatGuarded(
  apiMessages: Array<{ role: string; content: string }>,
  options: { model: string; stream: boolean },
): Promise<any> {
  // If we already know Puter needs auth, skip the attempt entirely
  if (puterAuthNeeded && isCloudflareConfigured()) {
    return Promise.reject(new Error('__PUTER_AUTH_NEEDED__'));
  }

  const origOpen = window.open;
  let popupIntercepted = false;
  let restored = false;

  function restoreOpen() {
    if (!restored) { restored = true; window.open = origOpen; }
  }

  // Temporarily intercept window.open to catch Puter auth popups
  window.open = function (...args: any[]) {
    const url = String(args[0] || '');
    if (url.includes('puter.com') || url.includes('puter.site') || url === '') {
      popupIntercepted = true;
      markPuterAuthNeeded();
      restoreOpen();
      // Return a fake window to avoid SDK errors
      return { closed: true, close: () => {} } as any;
    }
    // Non-Puter popups pass through
    return origOpen.apply(window, args);
  };

  // Safety: restore window.open after 8s regardless
  const safetyTimer = setTimeout(restoreOpen, 8000);

  return window.puter!.ai.chat(apiMessages, options).then((result: any) => {
    clearTimeout(safetyTimer);
    restoreOpen();
    if (popupIntercepted) {
      throw new Error('__PUTER_AUTH_NEEDED__');
    }
    // Auth succeeded — clear any previous auth-needed flag
    if (puterAuthNeeded) clearPuterAuthNeeded();
    return result;
  }).catch((err: any) => {
    clearTimeout(safetyTimer);
    restoreOpen();
    if (popupIntercepted) {
      throw new Error('__PUTER_AUTH_NEEDED__');
    }
    throw err;
  });
}

// --- Cloudflare Workers AI (free tier, Llama 3.1 8B) ---

function isCloudflareConfigured(): boolean {
  try { return !!(localStorage.getItem('suprik_cf_worker_url') || CLOUDFLARE_WORKER_URL); } catch { return false; }
}

async function callCloudflareAI(
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const workerUrl = localStorage.getItem('suprik_cf_worker_url') || CLOUDFLARE_WORKER_URL;
  if (!workerUrl) {
    throw new Error('Cloudflare Worker URL not configured. Go to Settings > API Keys to set it up.');
  }

  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Cloudflare AI error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        const content = parsed.response || text;
        onChunk(content);
        return content;
      } catch {
        onChunk(text);
        return text;
      }
    }
    throw new Error('No response from Cloudflare AI.');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) { reader.cancel(); break; }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        // Cloudflare Workers AI format: { response: "text" }
        const delta = parsed.response;
        if (delta) {
          fullText += delta;
          onChunk(fullText);
        }
      } catch {
        // Skip unparseable
      }
    }
  }

  if (!fullText) {
    throw new Error('No response from Cloudflare AI.');
  }

  return fullText;
}

// --- Ollama (self-hosted, Llama 3.2 3B) ---

async function callOllamaAI(
  messages: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const ollamaUrl = getOllamaURL();
  if (!ollamaUrl) {
    throw new Error('Ollama server URL not configured. Go to Settings > API Keys to set it up.');
  }

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'voice-fast',
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Ollama error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        const content = parsed.message?.content || '';
        onChunk(content);
        return content;
      } catch {
        onChunk(text);
        return text;
      }
    }
    throw new Error('No response from Ollama.');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) { reader.cancel(); break; }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        // Ollama streaming format: { message: { content: "text" }, done: false }
        const delta = parsed.message?.content;
        if (delta) {
          fullText += delta;
          onChunk(fullText);
        }
      } catch {
        // Skip unparseable
      }
    }
  }

  if (!fullText) {
    throw new Error('No response from Ollama.');
  }

  return fullText;
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

  // Set up popup blocker as soon as SDK starts loading
  setupPuterPopupBlocker();

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

export function buildRoundtablePrompt(agent: Agent): string {
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

// --- News Context ---

const NEWS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const newsMemoryCache = new Map<string, { headlines: string[]; timestamp: number }>();

export async function fetchNewsContext(message: string): Promise<string> {
  const tickers = extractTickers(message);
  if (tickers.length === 0) return '';

  const symbols = tickers.slice(0, 2);
  const allHeadlines: string[] = [];

  for (const symbol of symbols) {
    const cacheKey = symbol.toLowerCase();

    // Check memory cache
    const memCached = newsMemoryCache.get(cacheKey);
    if (memCached && Date.now() - memCached.timestamp < NEWS_CACHE_DURATION) {
      allHeadlines.push(...memCached.headlines);
      continue;
    }

    // Check localStorage cache
    try {
      const stored = localStorage.getItem('suprik_news_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[cacheKey] && Date.now() - parsed[cacheKey].timestamp < NEWS_CACHE_DURATION) {
          newsMemoryCache.set(cacheKey, parsed[cacheKey]);
          allHeadlines.push(...parsed[cacheKey].headlines);
          continue;
        }
      }
    } catch { /* ignore */ }

    // CryptoPanic API is CORS-blocked from browsers — skip the fetch
    // TODO: Proxy news through Cloudflare Worker to restore this feature
  }

  if (allHeadlines.length === 0) return '';

  const uniqueHeadlines = [...new Set(allHeadlines)].slice(0, 5);
  const numbered = uniqueHeadlines.map((h, i) => `${i + 1}. ${h}`).join(' ');
  return `\n\n[Recent News: ${numbered}]`;
}

// --- Puter AI Call (Streaming) ---

export async function callPuterAI(
  messages: ChatMessage[],
  agent: Agent,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  // Build API messages with system prompt + last 10 messages for context
  const recentMessages = messages.slice(-10);
  const apiMessages = [
    { role: 'system', content: agent.systemPrompt },
    ...recentMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  ];

  // --- Provider routing: if user selected non-Puter provider, use it directly ---
  if (currentProvider === 'cloudflare') {
    console.log('[AI] Using Cloudflare Workers AI');
    return callCloudflareAI(apiMessages, onChunk, signal);
  }
  if (currentProvider === 'ollama') {
    console.log('[AI] Using Ollama (self-hosted)');
    return callOllamaAI(apiMessages, onChunk, signal);
  }

  // --- Puter path (default) ---

  // If Puter is disabled (credits exhausted), try Cloudflare; if not configured, reset & retry Puter
  if (puterDisabled) {
    if (isCloudflareConfigured()) {
      console.log('[AI] Puter disabled, using Cloudflare AI fallback');
      return callCloudflareAI(apiMessages, onChunk, signal);
    }
    // No Cloudflare configured — reset Puter flag and retry (credits may have refreshed)
    console.log('[AI] Puter disabled but Cloudflare not configured, resetting Puter and retrying');
    resetPuter();
  }

  // Try loading Puter SDK — if it fails, fall back to Cloudflare (or throw)
  try {
    await loadPuterSDK();
  } catch {
    if (isCloudflareConfigured()) {
      console.warn('[AI] Puter SDK unavailable, using Cloudflare AI fallback');
      return callCloudflareAI(apiMessages, onChunk, signal);
    }
    throw new Error('AI unavailable. Please configure Cloudflare Worker in Settings > API Keys.');
  }

  if (!window.puter?.ai) {
    if (isCloudflareConfigured()) {
      console.warn('[AI] Puter AI not available, using Cloudflare AI fallback');
      return callCloudflareAI(apiMessages, onChunk, signal);
    }
    throw new Error('AI unavailable. Please configure Cloudflare Worker in Settings > API Keys.');
  }

  // Helper: detect Puter balance/credit errors in response objects
  function checkPuterError(resp: any): void {
    if (resp && typeof resp === 'object' && resp.success === false) {
      const errMsg = resp.error?.message || resp.error?.code || JSON.stringify(resp.error || '');
      if (errMsg.includes('balance') || errMsg.includes('funding') || errMsg.includes('credit') || errMsg.includes('limit')) {
        disablePuter();
      }
      // Always disable on {success: false} — Puter is not usable
      disablePuter();
      throw new Error('AI credits exhausted. Puter free tier limit reached.');
    }
  }

  // Try streaming first, fall back to non-streaming.
  // Uses callPuterChatGuarded() to intercept auth popups — if Puter tries to
  // open puter.com for auth, the guard blocks it and we fall back to Cloudflare.
  let fullText = '';

  try {
    const response = await Promise.race([
      callPuterChatGuarded(apiMessages, {
        model: AI_MODEL,
        stream: true,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 30000)
      ),
    ]);

    // Check for error response (e.g. {success: false, error: {...}})
    checkPuterError(response);

    if (response && Symbol.asyncIterator in Object(response)) {
      for await (const chunk of response as any) {
        if (signal?.aborted) break;
        checkPuterError(chunk);
        const text = chunk?.text || chunk?.message?.content || '';
        if (text) {
          fullText += text;
          onChunk(fullText);
        }
      }
    } else {
      // Non-streaming response
      const resp = response as any;
      fullText = resp?.message?.content || resp?.text || '';
      if (!fullText && resp) checkPuterError(resp);
      if (fullText) onChunk(fullText);
    }
  } catch (streamError: any) {
    if (signal?.aborted) throw streamError;

    // Check if Puter needs auth (popup was blocked by guard)
    const isAuthNeeded = streamError?.message?.includes('__PUTER_AUTH_NEEDED__');
    if (isAuthNeeded) {
      if (isCloudflareConfigured()) {
        console.log('[AI] Puter needs auth, using Cloudflare AI seamlessly');
        return callCloudflareAI(apiMessages, onChunk, signal);
      }
      // No Cloudflare — clear flag so next attempt allows the popup
      clearPuterAuthNeeded();
      throw new Error('AI requires authentication. Please try again — a sign-in popup will appear.');
    }

    // Check if Puter returned a credits/balance error
    const isCreditsError = streamError?.message?.includes('credits exhausted')
      || (streamError && typeof streamError === 'object' && streamError.success === false);

    if (isCreditsError) {
      disablePuter();
      if (isCloudflareConfigured()) {
        console.warn('[AI] Puter credits exhausted, falling back to Cloudflare AI');
        return callCloudflareAI(apiMessages, onChunk, signal);
      }
      // No Cloudflare — reset and let user retry
      resetPuter();
      throw new Error('AI credits temporarily exhausted. Please try again in a moment.');
    }

    console.warn('[PuterAI] Streaming failed, trying non-streaming:', streamError.message);

    try {
      const response = await Promise.race([
        callPuterChatGuarded(apiMessages, {
          model: AI_MODEL,
          stream: false,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out')), 30000)
        ),
      ]) as any;

      checkPuterError(response);
      fullText = response?.message?.content || response?.text || '';
      if (fullText) onChunk(fullText);
    } catch (nonStreamError: any) {
      // Puter completely failed — fall back to Cloudflare if configured
      if (signal?.aborted) throw nonStreamError;

      // Auth needed on non-streaming retry
      if (nonStreamError?.message?.includes('__PUTER_AUTH_NEEDED__')) {
        if (isCloudflareConfigured()) {
          console.log('[AI] Puter needs auth (non-stream), using Cloudflare AI');
          return callCloudflareAI(apiMessages, onChunk, signal);
        }
        clearPuterAuthNeeded();
        throw new Error('AI requires authentication. Please try again.');
      }

      disablePuter();
      if (isCloudflareConfigured()) {
        console.warn('[AI] Puter failed completely, falling back to Cloudflare AI:', nonStreamError.message);
        return callCloudflareAI(apiMessages, onChunk, signal);
      }
      resetPuter();
      throw new Error('AI temporarily unavailable. Please try again.');
    }
  }

  if (!fullText) {
    if (isCloudflareConfigured()) {
      console.warn('[AI] Puter returned empty, trying Cloudflare AI fallback');
      return callCloudflareAI(apiMessages, onChunk, signal);
    }
    throw new Error('AI returned an empty response. Please try again.');
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
  // No need to check puterDisabled here — callPuterAI handles fallback to Cloudflare
  if (!puterDisabled) {
    try {
      await loadPuterSDK();
    } catch {
      // Puter SDK unavailable — callPuterAI will fall back to Cloudflare
    }
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
