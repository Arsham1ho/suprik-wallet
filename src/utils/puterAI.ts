// Puter.com AI integration - free AI proxy (no API key needed)
// Provides access to Grok 4, GPT-4o, Claude, Gemini via puter.ai.chat()

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

  window._puterLoading = new Promise<void>((resolve, reject) => {
    if (window.puter?.ai) {
      puterReady = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => {
      // Poll for puter.ai to become available
      let attempts = 0;
      const check = () => {
        if (window.puter?.ai) {
          puterReady = true;
          resolve();
        } else if (attempts < 50) {
          attempts++;
          setTimeout(check, 100);
        } else {
          reject(new Error('Puter.js loaded but puter.ai not available'));
        }
      };
      check();
    };
    script.onerror = () => reject(new Error('Failed to load Puter AI'));
    document.head.appendChild(script);
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
    role: 'Stock Picker',
    emoji: '🎯',
    initial: 'A',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=transparent',
    gradientFrom: '#3b82f6',
    gradientTo: '#6366f1',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    aliases: ['alex', 'stock', 'pick', 'general'],
    keywords: ['stock', 'pick', 'recommend', 'buy', 'sell', 'what should', 'which stock', 'best stock', 'opinion', 'think about'],
    systemPrompt: `You are Alex, a stock analyst AI assistant inside Suprik Wallet. You help users discover stocks, understand market trends, and make informed investment decisions. Be concise and helpful. Use bullet points and **bold** for key terms. Keep answers under 200 words. Always end with a brief disclaimer that this is not financial advice.`,
  },
  {
    id: 'warren',
    name: 'Warren',
    role: 'Value Investor',
    emoji: '📊',
    initial: 'W',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Warren&backgroundColor=transparent',
    gradientFrom: '#22c55e',
    gradientTo: '#16a34a',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    aliases: ['warren', 'value', 'buffett'],
    keywords: ['p/e', 'pe ratio', 'intrinsic value', 'margin of safety', 'undervalued', 'overvalued', 'earnings', 'book value', 'dividend', 'moat', 'competitive advantage', 'value investing', 'dcf', 'cash flow'],
    systemPrompt: `You are Warren, a value investing AI assistant inspired by Warren Buffett's philosophy. Focus on fundamental analysis: P/E ratios, intrinsic value, margin of safety, competitive moats, earnings quality, and long-term compounding. Be concise, use bullet points and **bold** for key metrics. Keep answers under 200 words. Not financial advice.`,
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
    aliases: ['cathie', 'growth', 'ark', 'innovation'],
    keywords: ['growth', 'disruption', 'innovation', 'tam', 'total addressable market', 'revenue growth', 'scalability', 'ark', 'disruptive', 'exponential', 'ai stock', 'tech stock'],
    systemPrompt: `You are Cathie, a growth investing AI analyst inspired by disruptive innovation themes. Focus on: TAM expansion, revenue growth rates, scalability, platform effects, and technological disruption. Be enthusiastic but data-driven. Use bullet points and **bold**. Keep answers under 200 words. Not financial advice.`,
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
    keywords: ['rsi', 'macd', 'support', 'resistance', 'moving average', 'sma', 'ema', 'fibonacci', 'bollinger', 'pattern', 'breakout', 'head and shoulders', 'double top', 'double bottom', 'trend', 'volume', 'overbought', 'oversold', 'candlestick'],
    systemPrompt: `You are Linda, a technical analysis AI assistant. Focus on chart patterns, RSI, MACD, moving averages, support/resistance levels, Fibonacci retracements, and volume analysis. Describe what the technicals typically suggest for a given setup. Use bullet points and **bold**. Keep answers under 200 words. Not financial advice.`,
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
    keywords: ['interest rate', 'fed', 'inflation', 'gdp', 'economic', 'cycle', 'recession', 'monetary', 'fiscal', 'treasury', 'bond', 'yield', 'forex', 'fx', 'currency', 'central bank', 'cpi', 'unemployment', 'tariff'],
    systemPrompt: `You are Ray, a macroeconomic strategist AI inspired by Ray Dalio's principles. Focus on: interest rate cycles, inflation trends, economic indicators, credit cycles, currency dynamics, and how macro forces affect stock markets. Use bullet points and **bold**. Keep answers under 200 words. Not financial advice.`,
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
    keywords: ['risk', 'volatility', 'drawdown', 'black swan', 'tail risk', 'antifragile', 'hedge', 'beta', 'correlation', 'var', 'sharpe', 'max drawdown', 'portfolio risk', 'diversification', 'crash'],
    systemPrompt: `You are Nassim, a risk analysis AI inspired by Nassim Taleb's philosophy. Focus on: tail risk, volatility, drawdowns, antifragility, convexity, and protecting portfolios from black swan events. Be skeptical of naive forecasting. Use bullet points and **bold**. Keep answers under 200 words. Not financial advice.`,
  },
];

export const DEFAULT_AGENT = AGENTS[0]; // Alex

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

// --- Chat Message Type ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  timestamp: number;
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
        model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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
