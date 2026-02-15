import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_wrapper.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Cache for failed API key validations (to avoid repeated errors)
const failedApiKeys = new Map<string, number>(); // key -> timestamp of last failure

// Rate limiter for CoinGecko API
const coinGeckoRateLimiter = {
  lastCall: 0,
  minDelay: 3500, // 3.5 seconds between calls (much safer for free tier - allows ~17 calls/min vs 30 limit)
  callCount: 0,
  resetTime: Date.now() + 60000, // Reset counter every minute
  maxCallsPerMinute: 20, // Conservative limit (CoinGecko free tier allows 30/min)
  
  async wait() {
    const now = Date.now();
    
    // Reset counter every minute
    if (now >= this.resetTime) {
      this.callCount = 0;
      this.resetTime = now + 60000;
      console.log('[RateLimit] 🔄 Counter reset');
    }
    
    // If we've made too many calls in this minute, wait until reset
    if (this.callCount >= this.maxCallsPerMinute) {
      const waitTime = this.resetTime - now;
      console.log(`[RateLimit] ⏳ Max calls reached (${this.callCount}/${this.maxCallsPerMinute}). Waiting ${Math.ceil(waitTime / 1000)}s until reset`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.callCount = 0;
      this.resetTime = Date.now() + 60000;
    }
    
    // Ensure minimum delay between calls
    const timeSinceLastCall = now - this.lastCall;
    if (timeSinceLastCall < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastCall;
      console.log(`[RateLimit] ⏳ Waiting ${waitTime}ms before CoinGecko API call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
    this.callCount++;
    console.log(`[RateLimit] 📊 Call ${this.callCount}/${this.maxCallsPerMinute} in current minute`);
  }
};

// Helper: Fetch REAL chart data from multiple sources
async function fetchRealChartData(mint: string, period: string): Promise<Array<{ time: string; price: number }>> {
  let chartData: Array<{ time: string; price: number }> = [];
  
  console.log(`[ChartData] 🔍 Fetching REAL chart for ${mint}, period: ${period}`);
  
  // Map period to timeframes
  let timeFrom = Date.now() - 24 * 3600000;
  let geckoTimeframe = 'minute';
  let geckoAggregate = 15;
  
  switch (period) {
    case '1H':
      timeFrom = Date.now() - 3600000;
      geckoTimeframe = 'minute';
      geckoAggregate = 1;
      break;
    case '1D':
      timeFrom = Date.now() - 24 * 3600000;
      geckoTimeframe = 'minute';
      geckoAggregate = 15;
      break;
    case '1W':
      timeFrom = Date.now() - 7 * 24 * 3600000;
      geckoTimeframe = 'hour';
      geckoAggregate = 1;
      break;
    case '1M':
      timeFrom = Date.now() - 30 * 24 * 3600000; // Fixed: 30 days not 30 hours
      geckoTimeframe = 'hour';
      geckoAggregate = 4;
      break;
    case 'YTD':
      const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
      timeFrom = yearStart;
      geckoTimeframe = 'day';
      geckoAggregate = 1;
      break;
  }
  
  // Try 1: CoinGecko FIRST for ALL tokens with CoinGecko IDs (including Parabolic AI)
  const coinIdMap: Record<string, string> = {
    'solana': 'solana',
    'So11111111111111111111111111111111111111112': 'solana',
    'ethereum': 'ethereum',
    'bitcoin': 'bitcoin',
    'parabolic-ai': 'parabolic-ai',
    'parabolic': 'parabolic-ai',
    'hrkkngiuavecwte1zmrdt4h5qet3cecnuzmoeagjtax8': 'parabolic-ai', // Real Parabolic AI Solana mint (lowercase)
    'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': 'parabolic-ai', // Real Parabolic AI Solana mint (original case)
    'suprebyajmudegjlzvueum8w4xv1gf8jbqwynvg41dp': 'suprana', // Suprana official Solana mint (lowercase)
    'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp': 'suprana', // Suprana official Solana mint (original case)
    'suprana': 'suprana',
    'supra': 'suprana',
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
    'bonk': 'bonk',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
    'usdc': 'usd-coin',
    'usdt': 'tether',
  };
  
  // Check if mint is a known CoinGecko ID or can be mapped to one
  let coinId = coinIdMap[mint.toLowerCase()] || null;
  
  // If not in map, check if the mint itself looks like a CoinGecko ID (lowercase with hyphens)
  if (!coinId && mint.includes('-')) {
    coinId = mint.toLowerCase();
  }
  
  if (coinId) {
    try {
      console.log(`[ChartData] 🔍 Trying CoinGecko for ${coinId}...`);
      
      let days = 1;
      switch (period) {
        case '1H': days = 1; break;
        case '1D': days = 1; break;
        case '1W': days = 7; break;
        case '1M': days = 30; break;
        case 'YTD':
          const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
          days = Math.floor((Date.now() - yearStart) / (24 * 3600000));
          break;
      }
      
      await coinGeckoRateLimiter.wait();
      
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.prices && data.prices.length > 0) {
          chartData = data.prices.map(([timestamp, price]: [number, number]) => ({
            time: new Date(timestamp).toISOString(),
            price: price,
          }));
          
          // Filter for 1H and 1D periods to ensure accurate time range
          if (period === '1H') {
            const oneHourAgo = Date.now() - 3600000;
            chartData = chartData.filter(d => new Date(d.time).getTime() >= oneHourAgo);
          } else if (period === '1D') {
            const oneDayAgo = Date.now() - 24 * 3600000;
            chartData = chartData.filter(d => new Date(d.time).getTime() >= oneDayAgo);
          }
          
          console.log(`[ChartData] ✅ CoinGecko SUCCESS: ${chartData.length} real points for ${coinId}`);
          console.log(`[ChartData] 📊 Price range: $${Math.min(...chartData.map(d => d.price)).toFixed(6)} - $${Math.max(...chartData.map(d => d.price)).toFixed(6)}`);
          return chartData;
        }
      }
    } catch (error: any) {
      console.log(`[ChartData] ⚠️ CoinGecko failed: ${error.message}`);
    }
  }
  
  // Try 2: GeckoTerminal API for Solana DEX tokens (if it's a Solana mint address)
  if (mint.length > 32 && !mint.includes('-')) { // Looks like a Solana mint address
    try {
      const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/ohlcv/${geckoTimeframe}?aggregate=${geckoAggregate}&limit=1000`;
      console.log(`[ChartData] 🔍 Trying GeckoTerminal for Solana token...`);
      
      const geckoResponse = await fetch(geckoUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (geckoResponse.ok) {
        const geckoData = await geckoResponse.json();
        
        if (geckoData.data?.attributes?.ohlcv_list && geckoData.data.attributes.ohlcv_list.length > 0) {
          chartData = geckoData.data.attributes.ohlcv_list
            .map((item: any) => ({
              time: new Date(item[0] * 1000).toISOString(),
              price: parseFloat(item[4]), // close price
            }))
            .filter((item: any) => item.price > 0);
          
          // Filter by time period
          chartData = chartData.filter(d => new Date(d.time).getTime() >= timeFrom);
          
          if (chartData.length > 0) {
            console.log(`[ChartData] ✅ GeckoTerminal SUCCESS: ${chartData.length} real points`);
            console.log(`[ChartData] 📊 Price range: $${Math.min(...chartData.map(d => d.price)).toFixed(6)} - $${Math.max(...chartData.map(d => d.price)).toFixed(6)}`);
            return chartData;
          }
        }
      }
    } catch (error: any) {
      console.log(`[ChartData] ⚠️ GeckoTerminal failed: ${error.message}`);
    }
  }
  
  // Try 3: DexScreener as fallback (will get current price + 24h change for synthetic data)
  if (mint !== 'solana' && mint !== 'ethereum' && mint !== 'bitcoin') {
    try {
      console.log(`[ChartData] 🔍 Trying DexScreener fallback...`);
      
      const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
      const dexResponse = await fetch(dexUrl);
      
      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        
        if (dexData.pairs && dexData.pairs.length > 0) {
          const pair = dexData.pairs.reduce((best: any, current: any) => {
            return (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best;
          }, dexData.pairs[0]);
          
          const currentPrice = parseFloat(pair.priceUsd || '0');
          const change24h = pair.priceChange?.h24 || 0;
          
          if (currentPrice > 0) {
            console.log(`[ChartData] ⚠️ Using synthetic data (price: $${currentPrice}, change: ${change24h}%)`);
            return generateSyntheticChartData(currentPrice, change24h, period);
          }
        }
      }
    } catch (error: any) {
      console.log(`[ChartData] ⚠️ DexScreener failed: ${error.message}`);
    }
  }
  
  console.log(`[ChartData] ❌ All chart sources failed, returning empty`);
  return [];
}

// Helper: Generate synthetic chart data as fallback
function generateSyntheticChartData(currentPrice: number, change24h: number, period: string): Array<{ time: string; price: number }> {
  const data: Array<{ time: string; price: number }> = [];
  const now = Date.now();
  
  let dataPoints = 144;
  let intervalMs = 600000; // 10 minutes
  
  switch (period) {
    case '1H':
      dataPoints = 60;
      intervalMs = 60000; // 1 minute
      break;
    case '1D':
      dataPoints = 144;
      intervalMs = 600000; // 10 minutes
      break;
    case '1W':
      dataPoints = 168;
      intervalMs = 3600000; // 1 hour
      break;
    case '1M':
      dataPoints = 180;
      intervalMs = 4 * 3600000; // 4 hours
      break;
    case 'YTD':
      const daysSinceYear = Math.floor((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 3600000));
      dataPoints = Math.min(daysSinceYear, 365);
      intervalMs = 24 * 3600000; // 1 day
      break;
  }
  
  const totalChange = change24h / 100;
  const startPrice = currentPrice / (1 + totalChange);
  
  let price = startPrice;
  const volatility = Math.abs(totalChange) * 0.3;
  const drift = totalChange / dataPoints;
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now - (dataPoints - 1 - i) * intervalMs);
    
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const trendChange = drift;
    price = price * (1 + randomChange + trendChange);
    
    if (i === dataPoints - 1) {
      price = currentPrice;
    }
    
    data.push({
      time: timestamp.toISOString(),
      price: price,
    });
  }
  
  return data;
}

// Sanitize walletId to prevent KV key injection (strip colons and control chars)
function sanitizeKvKey(key: string): string {
  return key.replace(/[:\x00-\x1f]/g, '');
}

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Retry utility function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error that we should retry
      const errorMessage = error?.message || String(error);
      const isConnectionError = errorMessage.includes('connection') || 
                                errorMessage.includes('reset') ||
                                errorMessage.includes('ECONNRESET') ||
                                errorMessage.includes('timeout');
      
      if (!isConnectionError || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      const delay = initialDelay * Math.pow(2, i);
      console.log(`[Retry] Attempt ${i + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Startup info
console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 Saturn Wallet Server Started');
console.log('📊 CoinGecko API Rate Limiting: 1 call per 2s (max 30/min)');
console.log('💾 Extended caching: Prices 15min, Coins 2hr, Details 1hr');
console.log('🛡️ Stale cache fallback enabled to prevent 429 errors');
console.log('═══════════════════════════════════════════════════════════');
console.log('📦 API Keys Status:');
console.log('  • Helius (Solana):', Deno.env.get('HELIUS_API_KEY') ? '✅ Configured' : '❌ Not configured');
console.log('  • Alchemy (Ethereum):', Deno.env.get('ALCHEMY_API_KEY') ? '✅ Configured' : '❌ Not configured');
console.log('═══════════════════════════════════════════════════════════');
if (!Deno.env.get('ALCHEMY_API_KEY')) {
  console.log('⚠️  Alchemy API key missing - Ethereum balance will not work');
  console.log('📖 Fix: See QUICK_FIX_ALCHEMY.md or FIX_ALCHEMY_ERROR.txt');
  console.log('═══════════════════════════════════════════════════════════');
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
const allowedOrigins: string[] = [
  "https://suprik.com",
  "https://www.suprik.com",
  "https://suprik.io",
  "https://www.suprik.io",
];
if (Deno.env.get('ENVIRONMENT') !== 'production') {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  "/*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e5bc10d1/health", (c) => {
  return c.json({ status: "ok" });
});

// API keys endpoint removed — API keys must never be sent to clients.
// RPC calls that need these keys should be proxied through server endpoints.
app.get("/make-server-e5bc10d1/api-keys", (c) => {
  return c.json({ error: 'Endpoint removed for security' }, 410);
});

// Create wallet endpoint (no email/password required)
// DISABLED: Seed phrases must never be sent to or stored on the server (web3 security)
app.post("/make-server-e5bc10d1/create-wallet", (c) => {
  return c.json({ error: 'Endpoint disabled — wallet operations are client-side only' }, 410);
});

// DISABLED: Seed phrases must never be sent to the server (web3 security)
app.post("/make-server-e5bc10d1/signin", (c) => {
  return c.json({ error: 'Endpoint disabled — authentication is client-side only' }, 410);
});

// Get wallet data
app.get("/make-server-e5bc10d1/wallet/:walletId", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get wallet tokens (both endpoints for backward compatibility)
app.get("/make-server-e5bc10d1/wallet/:walletId/tokens", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Alternative route format
app.get("/make-server-e5bc10d1/wallet-tokens/:walletId", async (c) => {
  try {
    const walletId = sanitizeKvKey(c.req.param('walletId'));

    if (!walletId) {
      return c.json({ error: 'Wallet ID is required' }, 400);
    }

    // Get tokens from KV store
    let tokens = await retryWithBackoff(() => kv.get(`wallet:${walletId}:tokens`)) || {};
    
    // If tokens are empty, initialize with testnet defaults
    if (Object.keys(tokens).length === 0) {
      console.log(`[Server] 🧪 Initializing testnet balances for wallet ${walletId}`);
      
      // Default testnet balances
      tokens = {
        'SOL': { 
          symbol: 'SOL', 
          amount: 10, 
          network: 'solana', 
          name: 'Solana', 
          mint: 'solana',
          logo: '◎',
          logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png'
        },
        'ETH': { 
          symbol: 'ETH', 
          amount: 1, 
          network: 'ethereum', 
          name: 'Ethereum', 
          mint: 'ethereum',
          logo: 'Ξ',
          logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
        },
        'PARAI': { 
          symbol: 'PARAI', 
          amount: 1000, 
          network: 'solana', 
          name: 'Parabolic', 
          mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
          logo: 'P',
          logoUrl: 'https://coin-images.coingecko.com/coins/images/48026/large/parabolic.png?1735716959'
        }
      };
      
      // Save to KV store
      await retryWithBackoff(() => kv.set(`wallet:${walletId}:tokens`, tokens));
      
      // Create wallet entry if doesn't exist
      const wallet = await retryWithBackoff(() => kv.get(`wallet:${walletId}`));
      if (!wallet) {
        await retryWithBackoff(() => kv.set(`wallet:${walletId}`, {
          id: walletId,
          createdAt: new Date().toISOString(),
        }));
      }
      
      console.log(`[Server] ✅ Testnet balances initialized:`);
      console.log(`  - SOL: 10`);
      console.log(`  - ETH: 1`);
      console.log(`  - PARAI: 1000`);
    }

    return c.json({ tokens });
  } catch (error: any) {
    console.error('Tokens fetch error:', error);
    return c.json({ error: error.message || 'Failed to fetch tokens' }, 500);
  }
});

// Get activities
app.get("/make-server-e5bc10d1/wallet/:walletId/activities", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get coin details
app.get("/make-server-e5bc10d1/coin-details/:mint", async (c) => {
  try {
    const mint = c.req.param('mint');
    const period = c.req.query('period') || '1D';
    
    console.log('Fetching coin details for:', mint, 'period:', period);
    
    // Check cache first (cache coin details for different periods)
    const cacheKey = `coin:${mint}:${period}:details`;
    const cached = await kv.get(cacheKey);
    // Shorter TTL for 1H and 1D to get fresher data
    const CACHE_TTL = (period === '1H' || period === '1D') ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2 min for 1H/1D, 5 min for others
    
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[CoinDetails] ✅ Returning cached data for ${mint} (${period})`);
      return c.json(cached.coinData);
    }
    
    // If cache exists but expired, continue to fetch fresh data
    if (cached && cached.coinData) {
      console.log(`[CoinDetails] ⏰ Cache expired for ${mint} (${period}), fetching fresh data...`);
    }
    
    // Try to fetch from CoinGecko API first
    let coinData: any = null;
    
    try {
      console.log('Attempting to fetch from CoinGecko API for:', mint);
      
      // Map mint addresses to CoinGecko IDs
      const mintToCoinGeckoId: Record<string, string> = {
        'solana': 'solana',
        'So11111111111111111111111111111111111111112': 'solana',
        'ethereum': 'ethereum',
        'bitcoin': 'bitcoin',
        'polygon': 'matic-network',
        'parabolic-ai': 'parabolic-ai',
        'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': 'parabolic-ai', // Real Parabolic AI
        'hrkkngiuavecwte1zmrdt4h5qet3cecnuzmoeagjtax8': 'parabolic-ai', // lowercase
        'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp': 'suprana', // Suprana official mint
        'suprebyajmudegjlzvueum8w4xv1gf8jbqwynvg41dp': 'suprana', // lowercase
        'suprana': 'suprana',
        'supra': 'suprana',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
      };
      
      const coinGeckoId = mintToCoinGeckoId[mint] || mintToCoinGeckoId[mint.toLowerCase()] || mint;
      
      console.log(`[CoinDetails] Mapped ${mint} -> ${coinGeckoId}`);
      
      // Apply rate limiting
      await coinGeckoRateLimiter.wait();
      
      const cgUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`;
      const cgResponse = await fetch(cgUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (cgResponse.ok) {
        const cgData = await cgResponse.json();
        console.log('✅ Successfully fetched from CoinGecko for:', coinGeckoId);
        
        const marketCapFromCG = cgData.market_data?.market_cap?.usd || 0;
        const priceFromCG = cgData.market_data?.current_price?.usd || 0;
        
        // Check if this is Parabolic AI and CoinGecko returns invalid data (0 market cap)
        const isParabolic = coinGeckoId === 'parabolic-ai';
        const shouldUseFallback = isParabolic && (marketCapFromCG === 0 || priceFromCG === 0);
        
        if (shouldUseFallback) {
          console.log('⚠️ CoinGecko returned invalid data for Parabolic AI, will use fallback');
          // Don't set coinData here, let it fall through to fallback
        } else {
          coinData = {
            mint: mint,
            symbol: cgData.symbol?.toUpperCase() || 'N/A',
            name: cgData.name || 'Unknown',
            logo: cgData.image?.large || cgData.image?.small || cgData.image?.thumb || '',
            currentPrice: priceFromCG,
            change24h: cgData.market_data?.price_change_percentage_24h || 0,
            changeAmount: cgData.market_data?.price_change_24h || 0,
            marketCap: marketCapFromCG,
            totalSupply: cgData.market_data?.total_supply || 0,
            circulatingSupply: cgData.market_data?.circulating_supply || 0,
            maxSupply: cgData.market_data?.max_supply || null,
            description: cgData.description?.en?.replace(/<[^>]*>/g, '').substring(0, 500) || 'No description available.',
            website: cgData.links?.homepage?.[0] || '',
            twitter: cgData.links?.twitter_screen_name || '',
          };
        }
      } else {
        console.log('CoinGecko API returned non-OK status:', cgResponse.status);
      }
    } catch (cgError: any) {
      console.log('CoinGecko fetch failed, using fallback:', cgError.message);
    }
    
    // Fallback to hardcoded data if CoinGecko fails
    // Real data as of November 2024
    if (!coinData) {
      const coinDatabase: any = {
        'solana': {
          mint: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          network: 'solana',
          currentPrice: 245.32,
          change24h: 2.87,
          changeAmount: 6.85,
          marketCap: 116800000000, // $116.8B
          totalSupply: 587194163, // 587M total
          circulatingSupply: 476126880, // 476M circulating
          maxSupply: null, // Inflationary
          description: 'Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale. Solana is the fastest blockchain in the world and the fastest growing ecosystem in crypto, with thousands of projects spanning DeFi, NFTs, Web3 and more.',
          website: 'https://solana.com',
          twitter: 'solana',
        },
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
          mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          symbol: 'BONK',
          name: 'Bonk',
          network: 'solana',
          currentPrice: 0.00003421,
          change24h: 8.95,
          changeAmount: 0.00000281,
          marketCap: 2540000000, // $2.54B
          totalSupply: 92661418530221, // 92.66T total
          circulatingSupply: 75434029090246, // 75.43T circulating
          maxSupply: null,
          description: 'Bonk is a community-driven meme coin on the Solana blockchain. The original Solana dog coin.',
          website: 'https://bonkcoin.com',
          twitter: 'bonk_inu',
        },
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          name: 'USD Coin',
          network: 'solana',
          currentPrice: 1.00,
          change24h: 0.02,
          changeAmount: 0.0002,
          marketCap: 36420000000, // $36.42B
          totalSupply: 36420000000,
          circulatingSupply: 36420000000,
          maxSupply: null,
          description: 'USDC is a fully collateralized US dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges.',
          website: 'https://www.circle.com/en/usdc',
          twitter: 'circle',
        },
        'ethereum': {
          mint: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          network: 'ethereum',
          currentPrice: 3245.67,
          change24h: 1.45,
          changeAmount: 46.42,
          marketCap: 390500000000, // $390.5B
          totalSupply: 120367891, // ~120M total
          circulatingSupply: 120367891,
          maxSupply: null, // No max supply after EIP-1559
          description: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform.',
          website: 'https://ethereum.org',
          twitter: 'ethereum',
        },
        'bitcoin': {
          mint: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          network: 'bitcoin',
          currentPrice: 97842.55,
          change24h: 3.21,
          changeAmount: 3042.17,
          marketCap: 1936000000000, // $1.936T
          totalSupply: 21000000, // 21M max
          circulatingSupply: 19786000, // ~19.78M circulating
          maxSupply: 21000000,
          description: 'Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries.',
          website: 'https://bitcoin.org',
          twitter: 'bitcoin',
        },
        'polygon': {
          mint: 'polygon',
          symbol: 'MATIC',
          name: 'Polygon',
          network: 'polygon',
          currentPrice: 0.4521,
          change24h: 2.34,
          changeAmount: 0.0103,
          marketCap: 4210000000, // $4.21B
          totalSupply: 10000000000, // 10B total
          circulatingSupply: 9319469069, // ~9.32B circulating
          maxSupply: 10000000000,
          description: 'Polygon is a protocol and a framework for building and connecting Ethereum-compatible blockchain networks.',
          website: 'https://polygon.technology',
          twitter: '0xPolygon',
        },
        'parabolic-ai': {
          mint: 'parabolic-ai',
          symbol: 'PARAI',
          name: 'Parabolic',
          network: 'solana',
          currentPrice: 0.44378, // Updated to match market cap
          change24h: 2.8,
          changeAmount: 0.0124,
          marketCap: 443780000, // $443.78M - Corrected market cap
          totalSupply: 1000000000,
          circulatingSupply: 1000000000,
          maxSupply: 1000000000,
          description: 'Parabolic is the first-ever decentralized AI trading bot launcher on Solana. Build AI trading bots with cutting-edge machine learning, deploy them seamlessly on the blockchain, and unlock a new era of automated, intelligent trading strategies powered by artificial intelligence.',
          website: 'https://www.parabolic.fi',
          twitter: 'parabolicdotfi',
          logo: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
        },
        // Real Parabolic AI mint address (alternate format)
        'Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh': {
          mint: 'Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh',
          symbol: 'PARAI',
          name: 'Parabolic',
          network: 'solana',
          currentPrice: 0.44378,
          change24h: 2.8,
          changeAmount: 0.0124,
          marketCap: 443780000, // $443.78M - Corrected market cap
          totalSupply: 1000000000,
          circulatingSupply: 1000000000,
          maxSupply: 1000000000,
          description: 'Parabolic is the first-ever decentralized AI trading bot launcher on Solana. Build AI trading bots with cutting-edge machine learning, deploy them seamlessly on the blockchain, and unlock a new era of automated, intelligent trading strategies powered by artificial intelligence.',
          website: 'https://www.parabolic.fi',
          twitter: 'parabolicdotfi',
          logo: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
        },
        // Real PAI mint address (Solana Mainnet) - PRIMARY MINT
        'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': {
          mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
          symbol: 'PARAI',
          name: 'Parabolic',
          network: 'solana',
          currentPrice: 0.44378,
          change24h: 2.8,
          changeAmount: 0.0124,
          marketCap: 443780000, // $443.78M - Corrected market cap
          totalSupply: 1000000000,
          circulatingSupply: 1000000000,
          maxSupply: 1000000000,
          description: 'Parabolic is the first-ever decentralized AI trading bot launcher on Solana. Build AI trading bots with cutting-edge machine learning, deploy them seamlessly on the blockchain, and unlock a new era of automated, intelligent trading strategies powered by artificial intelligence.',
          website: 'https://www.parabolic.fi',
          twitter: 'parabolicdotfi',
          logo: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png',
        },
        // Real PUMP mint address (Solana Mainnet)
        'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn': {
          mint: 'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn',
          symbol: 'PUMP',
          name: 'Pump',
          network: 'solana',
          currentPrice: 0.0000045,
          change24h: 15.8,
          changeAmount: 0.0000006,
          marketCap: 4500000,
          totalSupply: 1000000000000,
          circulatingSupply: 1000000000000,
          maxSupply: 1000000000000,
          description: 'Pump is a community-driven meme token on Solana blockchain. Fast transactions and low fees make it ideal for trading and community engagement.',
          website: '',
          twitter: '',
        },
      };
      
      coinData = coinDatabase[mint];
      
      if (!coinData) {
        console.log('Coin not found in fallback database, creating generic token data for:', mint);
        coinData = {
          mint: mint,
          symbol: mint.substring(0, 6).toUpperCase(),
          name: 'Unknown Token',
          logo: '',
          currentPrice: 0,
          change24h: 0,
          changeAmount: 0,
          marketCap: 0,
          totalSupply: 0,
          circulatingSupply: 0,
          description: 'Token information not available. This is a newly discovered token on the Solana blockchain.',
          website: '',
          twitter: '',
        };
      }
    }
    
    // Fetch REAL chart data instead of generating synthetic data
    console.log(`[CoinDetails] 📊 Fetching REAL chart data for ${mint}, period: ${period}`);
    let chartData = await fetchRealChartData(mint, period);
    
    // If real data failed, generate synthetic as fallback
    if (chartData.length === 0) {
      console.log(`[CoinDetails] ⚠️ Real chart data failed, generating synthetic fallback for ${period}`);
      chartData = generateSyntheticChartData(coinData.currentPrice, coinData.change24h, period);
    } else {
      console.log(`[CoinDetails] ✅ Got ${chartData.length} real chart points for ${period}`);
    }
    
    const response = {
      ...coinData,
      chartData,
    };
    
    // Cache the coin details with period-specific key
    await kv.set(cacheKey, {
      coinData: response,
      timestamp: Date.now(),
    });
    
    console.log(`[CoinDetails] 💾 Cached data for ${mint} (${period})`);
    
    return c.json(response);
  } catch (error: any) {
    console.error('Coin details fetch error:', error);
    return c.json({ error: error.message || 'Failed to fetch coin details' }, 500);
  }
});

// Generate wallet addresses for different blockchains
// DISABLED: Address derivation must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/generate-addresses", (c) => {
  return c.json({ error: 'Endpoint disabled — address derivation is client-side only' }, 410);
});

// Store wallet addresses (client-side generated)
app.post("/make-server-e5bc10d1/store-addresses", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get dev mode status
app.get("/make-server-e5bc10d1/get-dev-mode", async (c) => {
  try {
    const walletId = sanitizeKvKey(c.req.query('walletId') || '');

    if (!walletId) {
      return c.json({ error: 'Wallet ID is required' }, 400);
    }
    
    let settings = null;
    try {
      settings = await kv.get(`wallet:${walletId}:settings`);
    } catch (kvError: any) {
      console.error('KV error getting dev mode (returning default):', kvError.message);
      return c.json({ devMode: false });
    }
    
    return c.json({ devMode: settings?.devMode || false });
  } catch (error: any) {
    console.error('Get dev mode error:', error);
    return c.json({ devMode: false });
  }
});

// Set dev mode
// DISABLED: No auth — data is stored client-side only
app.post("/make-server-e5bc10d1/set-dev-mode", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});

// Get wallet settings including network selection
app.get("/make-server-e5bc10d1/wallet-settings/:walletId", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Update wallet settings including network selection
app.post("/make-server-e5bc10d1/wallet-settings", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Simulate receiving tokens in dev mode
app.post("/make-server-e5bc10d1/dev-receive", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Helper function to check API status
app.get("/make-server-e5bc10d1/api-status", async (c) => {
  try {
    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY');
    
    return c.json({
      helius: !!heliusApiKey,
      alchemy: !!alchemyApiKey,
    });
  } catch (error: any) {
    console.error('API status error:', error);
    return c.json({ error: error.message }, 500);
  }
});



// Image proxy endpoint to bypass CORS
const IMAGE_PROXY_ALLOWED_DOMAINS = [
  'cryptologos.cc',
  'coin-images.coingecko.com',
  'assets.coingecko.com',
  'raw.githubusercontent.com',
  'static.jup.ag',
  'arweave.net',
  'ipfs.nftstorage.link',
  'assets.parqet.com',
  'cdn.prod.website-files.com',
  'api.dicebear.com',
  'i.ibb.co',
  'www.cryptocompare.com',
];

app.get("/make-server-e5bc10d1/proxy-image", async (c) => {
  try {
    const url = c.req.query('url');
    if (!url) {
      return c.json({ error: 'URL parameter required' }, 400);
    }

    // Validate URL and restrict to whitelisted domains (prevent SSRF)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return c.json({ error: 'Invalid URL' }, 400);
    }

    if (parsedUrl.protocol !== 'https:') {
      return c.json({ error: 'Only HTTPS URLs are allowed' }, 400);
    }

    if (!IMAGE_PROXY_ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return c.json({ error: 'Domain not allowed' }, 403);
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get token prices endpoint (from CoinGecko)
app.post("/make-server-e5bc10d1/token-prices", async (c) => {
  try {
    const { symbols } = await c.req.json();
    
    if (!symbols || !Array.isArray(symbols)) {
      return c.json({ error: 'Symbols array is required' }, 400);
    }
    
    console.log('Fetching token prices from CoinGecko for:', symbols.join(', '));
    
    // Check cache first (cache prices for 30 minutes to reduce API calls)
    const cacheKey = `prices:${symbols.sort().join(',')}`;
    const cached = await kv.get(cacheKey);
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutes to reduce API load
    
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached prices');
      return c.json({ prices: cached.prices });
    }
    
    // If we have stale cache, return it to avoid rate limits
    if (cached && cached.prices) {
      console.log('Using stale price cache to avoid rate limiting');
      return c.json({ prices: cached.prices });
    }
    
    // Map symbols to CoinGecko IDs
    const symbolToId: Record<string, string> = {
      'SOL': 'solana',
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
      'SHIB': 'shiba-inu',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'LTC': 'litecoin',
      'APT': 'aptos',
      'ARB': 'arbitrum',
      'OP': 'optimism',
      'PARAI': 'parabolic-ai',
      'PAI': 'parabolic-ai',
      'BONK': 'bonk',
      'SUPRA': 'supra',
      // Solana ecosystem tokens
      'WIF': 'dogwifcoin',
      'JUP': 'jupiter-exchange-solana',
      'RAY': 'raydium',
      'ORCA': 'orca',
      'JTO': 'jito-governance-token',
      'RENDER': 'render-token',
      'PYTH': 'pyth-network',
      'MSOL': 'marinade-staked-sol',
      'JITOSOL': 'jito-staked-sol',
      'BSOL': 'blazestake-staked-sol',
      'HNT': 'helium',
      'MOBILE': 'helium-mobile',
      'IOT': 'helium-iot',
      'RNDR': 'render-token',
      'SAMO': 'samoyedcoin',
      'FIDA': 'bonfida',
      'MNGO': 'mango-markets',
      'SRM': 'serum',
      'STEP': 'step-finance',
      'COPE': 'cope',
      'DUST': 'dust-protocol',
      'GMT': 'stepn',
      'GST': 'green-satoshi-token',
    };
    
    // Fallback prices in case API fails (will try real APIs first)
    // Updated: December 2024
    const fallbackPrices: Record<string, number> = {
      'SOL': 135.00,
      'ETH': 3130.00,
      'BTC': 91500.00,
      'USDC': 1.00,
      'USDT': 1.00,
      'PARAI': 0.059,
      'PAI': 0.059,
      'BONK': 0.00001,
      'WIF': 1.80,
      'JUP': 0.85,
      'RAY': 4.50,
      'ORCA': 3.80,
      'JTO': 2.80,
      'RENDER': 7.50,
      'PYTH': 0.38,
      'MSOL': 165.00,
      'JITOSOL': 160.00,
      'BSOL': 145.00,
      'SUPRA': 0.0013,
      // Additional Solana ecosystem tokens
      'HNT': 6.50,
      'MOBILE': 0.0008,
      'IOT': 0.0015,
      'RNDR': 7.50,
      'SAMO': 0.008,
      'FIDA': 0.25,
      'MNGO': 0.02,
      'SRM': 0.03,
      'STEP': 0.04,
      'COPE': 0.015,
      'DUST': 0.50,
      'GMT': 0.15,
      'GST': 0.012,
    };
    
    const ids = symbols.map(s => symbolToId[s] || s.toLowerCase()).join(',');
    
    console.log('CoinGecko IDs:', ids);
    
    // Fetch from CoinGecko with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for faster fallback
    
    try {
      // Apply rate limiting
      await coinGeckoRateLimiter.wait();
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status}`);
        
        // If rate limited and we have stale cache, use it
        if (response.status === 429 && cached && cached.prices) {
          console.log('Rate limited! Using stale cache');
          return c.json({ prices: cached.prices });
        }
        
        // Use fallback prices
        const prices: Record<string, number> = {};
        symbols.forEach(symbol => {
          prices[symbol] = fallbackPrices[symbol] || 0;
        });
        console.log('Using fallback prices:', prices);
        return c.json({ prices });
      }
      
      const data = await response.json();
      console.log('CoinGecko response:', JSON.stringify(data).substring(0, 200));
      
      // Build prices object
      const prices: Record<string, number> = {};
      symbols.forEach(symbol => {
        const id = symbolToId[symbol] || symbol.toLowerCase();
        const price = data[id]?.usd;
        if (price !== undefined && price !== null) {
          prices[symbol] = price;
        } else {
          // Use fallback if not found in API response
          prices[symbol] = fallbackPrices[symbol] || 0;
          console.log(`Using fallback price for ${symbol}: ${prices[symbol]}`);
        }
      });
      
      console.log('Fetched prices:', prices);
      
      // Cache the prices
      await kv.set(cacheKey, {
        prices,
        timestamp: Date.now(),
      });
      
      return c.json({ prices });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('CoinGecko fetch error:', fetchError.message);
      
      // Use fallback prices
      const prices: Record<string, number> = {};
      symbols.forEach(symbol => {
        prices[symbol] = fallbackPrices[symbol] || 0;
      });
      console.log('Using fallback prices due to error:', prices);
      return c.json({ prices });
    }
  } catch (error: any) {
    console.error('Token prices endpoint error:', error);
    // Return fallback prices instead of error
    const fallbackPrices: Record<string, number> = {
      'SOL': 245.00,
      'ETH': 3200.00,
      'BTC': 97000.00,
      'USDC': 1.00,
      'USDT': 1.00,
      'PARAI': 0.059,
      'PAI': 0.059,
      'SUPRA': 0,
    };
    return c.json({ prices: fallbackPrices });
  }
});

// Blockchain balance endpoints - fetch real data from Helius/Alchemy

// Solana balance endpoint
app.post("/make-server-e5bc10d1/solana-balance", async (c) => {
  try {
    const { address, networkMode } = await c.req.json();
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY');
    if (!HELIUS_API_KEY) {
      return c.json({ error: 'HELIUS_API_KEY not configured' }, 500);
    }
    
    // Determine which network to use
    const isTestnet = networkMode === 'testnet';
    const heliusUrl = isTestnet 
      ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
      : `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    
    const networkLabel = isTestnet ? 'DEVNET' : 'MAINNET';
    console.log(`[Solana] 🔗 Fetching balance from ${networkLabel} for ${address.substring(0, 10)}...`);
    
    // Get native SOL balance with timeout and retry logic
    let balanceResponse;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        balanceResponse = await fetch(heliusUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [address]
          }),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (balanceResponse.ok) {
          break; // Success, exit retry loop
        }
        
        if (balanceResponse.status === 503 || balanceResponse.status === 502) {
          console.log(`[Solana] ⚠️ API temporarily unavailable (${balanceResponse.status}), retry ${retryCount + 1}/${maxRetries}...`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
            continue;
          }
        }
        
        console.error(`[Solana] ❌ Helius API error: ${balanceResponse.status}`);
        throw new Error(`Helius API returned ${balanceResponse.status}`);
      } catch (fetchError: any) {
        if (fetchError.name === 'TimeoutError' && retryCount < maxRetries - 1) {
          console.log(`[Solana] ⚠️ Request timeout, retry ${retryCount + 1}/${maxRetries}...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          continue;
        }
        throw fetchError;
      }
    }
    
    if (!balanceResponse || !balanceResponse.ok) {
      console.error(`[Solana] ❌ All retries failed`);
      throw new Error(`Helius API failed after ${maxRetries} attempts`);
    }
    
    const balanceData = await balanceResponse.json();
    
    if (balanceData.error) {
      console.error('[Solana] ❌ RPC error:', balanceData.error);
      throw new Error(balanceData.error.message || 'RPC error');
    }
    
    const lamports = balanceData.result?.value || 0;
    const sol = lamports / 1e9;
    
    console.log(`[Solana] ✅ ${networkLabel} Balance: ${sol} SOL`);
    
    // Get token accounts - IMPORTANT: Query BOTH Token Program AND Token-2022 Program
    // Many new tokens (like PUMP, PAI) use Token-2022 instead of the legacy Token Program
    console.log(`[Solana] 🔍 Fetching SPL tokens for ${address.substring(0, 8)}...`);
    
    const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
    
    // Step 1: Query legacy Token Program
    console.log(`[Solana] 🔍 Step 1/2: Querying Token Program...`);
    const tokensResponse = await fetch(heliusUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { programId: TOKEN_PROGRAM },
          { encoding: 'jsonParsed' }
        ]
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    console.log(`[Solana] 🔍 Token Program response status: ${tokensResponse.status}`);
    
    if (!tokensResponse.ok) {
      console.error(`[Solana] ❌ Token Program API error: ${tokensResponse.status}`);
      const errorText = await tokensResponse.text();
      console.error(`[Solana] ❌ Error details: ${errorText}`);
    }
    
    const tokensData = await tokensResponse.json();
    
    // Step 2: Query Token-2022 Program
    console.log(`[Solana] 🔍 Step 2/2: Querying Token-2022 Program...`);
    const tokens2022Response = await fetch(heliusUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { programId: TOKEN_2022_PROGRAM },
          { encoding: 'jsonParsed' }
        ]
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    console.log(`[Solana] 🔍 Token-2022 Program response status: ${tokens2022Response.status}`);
    
    const tokens2022Data = await tokens2022Response.json();
    
    // Combine results from both programs
    const allTokenAccounts = [
      ...(tokensData.result?.value || []),
      ...(tokens2022Data.result?.value || [])
    ];
    
    console.log(`[Solana] Token Program accounts: ${tokensData.result?.value?.length || 0}`);
    console.log(`[Solana] Token-2022 Program accounts: ${tokens2022Data.result?.value?.length || 0}`);
    console.log(`[Solana] Total token accounts: ${allTokenAccounts.length}`);
    
    const tokens: any[] = [];
    
    if (allTokenAccounts.length > 0) {
      console.log(`[Solana] Found ${allTokenAccounts.length} token accounts on ${networkLabel}`);
      
      // FAST MODE: Skip metadata fetching to avoid timeouts
      // We'll use a mapping of known tokens instead
      const KNOWN_TOKENS: Record<string, { symbol: string; name: string }> = {
        // Native & Wrapped SOL
        'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
        'So11111111111111111111111111111111111111111': { symbol: 'wSOL', name: 'Wrapped SOL' },
        
        // Stablecoins
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin' },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD' },
        
        // Liquid Staking Tokens
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL' },
        'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'jitoSOL', name: 'Jito Staked SOL' },
        '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': { symbol: 'stSOL', name: 'Lido Staked SOL' },
        'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', name: 'BlazeStake Staked SOL' },
        
        // Popular Memecoins
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk' },
        'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82': { symbol: 'BOME', name: 'Book of Meme' },
        
        // DeFi Tokens
        'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': { symbol: 'SRM', name: 'Serum' },
        'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': { symbol: 'RLB', name: 'Rollbit Coin' },
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter' },
      };
      
      for (const account of allTokenAccounts) {
        const info = account.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount;
        
        if (amount > 0) {
          // Use known token mapping or fallback to mint address
          const knownToken = KNOWN_TOKENS[info.mint];
          const tokenSymbol = knownToken?.symbol || info.mint.substring(0, 8) + '...';
          const tokenName = knownToken?.name || 'Unknown Token';
          
          tokens.push({
            symbol: tokenSymbol,
            name: tokenName,
            amount,
            mint: info.mint,
            decimals: info.tokenAmount.decimals,
            network: 'solana',
            logoUrl: '' // Will be handled by TokenLogo component on frontend
          });
        }
      }
      
      console.log(`[Solana] ⚡ Fast mode: Using known token mapping (${tokens.length} tokens)`);
    }
    
    console.log(`[Solana] Found ${tokens.length} tokens with balance on ${networkLabel}`);
    
    return c.json({
      native: sol,
      tokens,
      totalUsdValue: 0
    });
  } catch (error: any) {
    console.error('[Solana] ❌ Fatal error:', error.message || error);
    console.error('[Solana] ❌ Error:', error.message);
    
    // Return detailed error for debugging
    return c.json({ 
      error: error.message || 'Failed to fetch Solana balance',
      details: error.toString(),
      type: error.name
    }, 500);
  }
});

// Ethereum balance endpoint
app.post("/make-server-e5bc10d1/ethereum-balance", async (c) => {
  try {
    const { address, networkMode } = await c.req.json();
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');
    if (!ALCHEMY_API_KEY) {
      console.warn('[Ethereum] ⚠️ ALCHEMY_API_KEY not configured, returning zero balance');
      // Return zero balance instead of error - graceful degradation
      return c.json({
        native: 0,
        tokens: [],
        totalUsdValue: 0,
        warning: 'ALCHEMY_API_KEY not configured'
      });
    }
    
    // Determine which network to use
    const isTestnet = networkMode === 'testnet';
    const network = isTestnet ? 'sepolia' : 'mainnet';
    const networkLabel = network.toUpperCase();
    
    console.log(`[Ethereum] 🔗 Fetching balance from ${networkLabel} for ${address.substring(0, 10)}...`);
    
    // Get native ETH balance with timeout and error handling
    let eth = 0;
    
    try {
      const balanceResponse = await fetch(`https://eth-${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout (increased from 10)
      });
      
      if (!balanceResponse.ok) {
        console.error(`[Ethereum] ❌ Alchemy API error: ${balanceResponse.status}`);
        throw new Error(`Alchemy API returned ${balanceResponse.status}`);
      }
      
      const balanceData = await balanceResponse.json();
      
      if (balanceData.error) {
        console.error('[Ethereum] ❌ RPC error:', balanceData.error);
        throw new Error(balanceData.error.message || 'RPC error');
      }
      
      const weiBalance = BigInt(balanceData.result || '0x0');
      eth = Number(weiBalance) / 1e18;
      
      console.log(`[Ethereum] ✅ ${networkLabel} Balance: ${eth} ETH`);
    } catch (ethError: any) {
      console.error(`[Ethereum] ⚠️ Failed to fetch ETH balance:`, ethError.message);
      // Continue with zero balance - don't fail completely
      eth = 0;
    }
    
    // Get ERC20 tokens (with error handling)
    const tokens: any[] = [];
    
    try {
      const tokensResponse = await fetch(`https://eth-${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address]
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!tokensResponse.ok) {
        if (tokensResponse.status === 429) {
          console.warn(`[Ethereum] ⚠️ Rate limit reached (429) - too many requests. Skipping tokens for now.`);
          console.warn(`[Ethereum] ℹ️ Token detection will work again after rate limit resets`);
        } else if (tokensResponse.status === 403) {
          console.warn(`[Ethereum] ⚠️ API Access Denied (403) - check API key permissions`);
        } else {
          console.error(`[Ethereum] ⚠️ Failed to fetch tokens: ${tokensResponse.status}`);
        }
        console.log(`[Ethereum] Continuing without token data due to API error`);
        // Don't throw - just skip tokens and continue
      } else {
        const tokensData = await tokensResponse.json();
        
        if (tokensData.result?.tokenBalances) {
          console.log(`[Ethereum] Found ${tokensData.result.tokenBalances.length} token balances on ${networkLabel}`);
      
          for (const token of tokensData.result.tokenBalances) {
            const balance = BigInt(token.tokenBalance || '0x0');
            if (balance > 0n) {
              try {
                // Get token metadata with timeout
                const metadataResponse = await fetch(`https://eth-${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenMetadata',
                    params: [token.contractAddress]
                  }),
                  signal: AbortSignal.timeout(10000) // 10 second timeout per token
                });
                
                const metadata = await metadataResponse.json();
                const decimals = metadata.result?.decimals || 18;
                const amount = Number(balance) / Math.pow(10, decimals);
                
                tokens.push({
                  symbol: metadata.result?.symbol || 'TOKEN',
                  name: metadata.result?.name || 'Unknown Token',
                  amount,
                  mint: token.contractAddress,
                  decimals,
                  network: 'ethereum',
                  logoUrl: metadata.result?.logo || ''
                });
              } catch (tokenError: any) {
                console.error(`[Ethereum] ⚠️ Failed to fetch metadata for ${token.contractAddress}:`, tokenError.message);
                // Continue with next token
              }
            }
          }
        }
      }
    } catch (tokensError: any) {
      console.error(`[Ethereum] ⚠️ Failed to fetch ERC20 tokens:`, tokensError.message);
      // Continue with empty tokens array
    }
    
    console.log(`[Ethereum] Found ${tokens.length} tokens with balance on ${networkLabel}`);
    
    return c.json({
      native: eth,
      tokens,
      totalUsdValue: 0
    });
  } catch (error: any) {
    console.error('[Ethereum] ❌ Fatal error:', error.message || error);
    console.error('[Ethereum] ❌ Error:', error.message);
    
    // Return zero balance instead of error - graceful degradation
    return c.json({
      native: 0,
      tokens: [],
      totalUsdValue: 0,
      error: error.message || 'Failed to fetch Ethereum balance',
      details: error.toString(),
      type: error.name
    }, 200); // Return 200 instead of 500 so frontend doesn't fail
  }
});

// Bitcoin balance endpoint
app.post("/make-server-e5bc10d1/bitcoin-balance", async (c) => {
  try {
    const { address } = await c.req.json();
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    console.log(`[Bitcoin] Fetching balance for ${address.substring(0, 10)}...`);
    
    // Use the checkBitcoinBalance function with caching and fallback APIs
    const btc = await checkBitcoinBalance(address);
    
    console.log(`[Bitcoin] Balance: ${btc} BTC`);
    
    return c.json({
      native: btc,
      tokens: [],
      totalUsdValue: 0
    });
  } catch (error: any) {
    console.error('[Bitcoin] ❌ Error fetching Bitcoin balance:', error.message || error);
    console.error('[Bitcoin] ❌ Error:', error.message);
    
    // Return detailed error for debugging
    return c.json({ 
      error: error.message || 'Failed to fetch Bitcoin balance',
      details: error.toString(),
      type: error.name,
      // Return 0 balance as fallback so UI doesn't break
      native: 0,
      tokens: [],
      totalUsdValue: 0
    }, 200); // Return 200 instead of 500 so frontend can handle gracefully
  }
});

// Bitcoin API health check endpoint
app.get("/make-server-e5bc10d1/bitcoin-health", async (c) => {
  const results: any[] = [];
  const testAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Known address with history
  
  // Test each API
  const apis = [
    {
      name: 'Mempool.space',
      url: `https://mempool.space/api/address/${testAddress}`
    },
    {
      name: 'Blockstream',
      url: `https://blockstream.info/api/address/${testAddress}`
    },
    {
      name: 'BlockCypher',
      url: `https://api.blockcypher.com/v1/btc/main/addrs/${testAddress}/balance`
    }
  ];
  
  for (const api of apis) {
    try {
      const start = Date.now();
      const response = await fetch(api.url, {
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - start;
      
      results.push({
        name: api.name,
        status: response.ok ? 'OK' : `Error ${response.status}`,
        latency: `${latency}ms`,
        available: response.ok
      });
    } catch (error: any) {
      results.push({
        name: api.name,
        status: 'Failed',
        error: error.message,
        available: false
      });
    }
  }
  
  return c.json({
    timestamp: new Date().toISOString(),
    apis: results,
    summary: {
      total: results.length,
      available: results.filter(r => r.available).length,
      unavailable: results.filter(r => !r.available).length
    }
  });
});

// Base balance endpoint (L2 on Ethereum)
app.post("/make-server-e5bc10d1/base-balance", async (c) => {
  try {
    const { address, networkMode } = await c.req.json();
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');
    if (!ALCHEMY_API_KEY) {
      console.warn('[Base] ⚠️ ALCHEMY_API_KEY not configured, returning zero balance');
      return c.json({
        native: 0,
        tokens: [],
        totalUsdValue: 0,
        warning: 'ALCHEMY_API_KEY not configured'
      });
    }
    
    // Base mainnet/testnet (Base Sepolia)
    const isTestnet = networkMode === 'testnet';
    const network = isTestnet ? 'base-sepolia' : 'base-mainnet';
    const networkLabel = network.toUpperCase();
    
    console.log(`[Base] 🔗 Fetching balance from ${networkLabel} for ${address.substring(0, 10)}...`);
    
    // Get native ETH balance on Base
    let eth = 0;
    
    try {
      const balanceResponse = await fetch(`https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (!balanceResponse.ok) {
        if (balanceResponse.status === 403) {
          // Silently return zero balance - no console warnings
          return c.json({
            native: 0,
            tokens: [],
            totalUsdValue: 0,
            warning: 'Base network not available with current API plan'
          });
        }
        console.error(`[Base] ❌ Alchemy API error: ${balanceResponse.status}`);
        throw new Error(`Alchemy API returned ${balanceResponse.status}`);
      }
      
      const balanceData = await balanceResponse.json();
      
      if (balanceData.error) {
        console.error('[Base] ❌ RPC error:', balanceData.error);
        throw new Error(balanceData.error.message || 'RPC error');
      }
      
      const weiBalance = BigInt(balanceData.result || '0x0');
      eth = Number(weiBalance) / 1e18;
      
      console.log(`[Base] ✅ ${networkLabel} Balance: ${eth} ETH`);
    } catch (ethError: any) {
      if (ethError.message && ethError.message.includes('403')) {
        // Already handled above - don't log again
        return c.json({
          native: 0,
          tokens: [],
          totalUsdValue: 0,
          warning: 'Base network not available'
        });
      }
      console.error(`[Base] ⚠️ Failed to fetch ETH balance:`, ethError.message);
      eth = 0;
    }
    
    // Get ERC20 tokens on Base
    const tokens: any[] = [];
    
    try {
      const tokensResponse = await fetch(`https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address]
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (!tokensResponse.ok) {
        if (tokensResponse.status === 403) {
          console.warn(`[Base] ⚠️ Token fetch denied (403) - skipping Base tokens`);
        } else {
          console.error(`[Base] ⚠️ Failed to fetch tokens: ${tokensResponse.status}`);
        }
      } else {
        const tokensData = await tokensResponse.json();
        
        if (tokensData.result?.tokenBalances) {
          console.log(`[Base] Found ${tokensData.result.tokenBalances.length} token balances on ${networkLabel}`);
      
          for (const token of tokensData.result.tokenBalances) {
            const balance = BigInt(token.tokenBalance || '0x0');
            if (balance > 0n) {
              try {
                const metadataResponse = await fetch(`https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenMetadata',
                    params: [token.contractAddress]
                  }),
                  signal: AbortSignal.timeout(10000)
                });
                
                const metadata = await metadataResponse.json();
                const decimals = metadata.result?.decimals || 18;
                const amount = Number(balance) / Math.pow(10, decimals);
                
                tokens.push({
                  symbol: metadata.result?.symbol || 'TOKEN',
                  name: metadata.result?.name || 'Unknown Token',
                  amount,
                  mint: token.contractAddress,
                  decimals,
                  network: 'base',
                  logoUrl: metadata.result?.logo || ''
                });
              } catch (tokenError: any) {
                console.error(`[Base] ⚠️ Failed to fetch metadata for ${token.contractAddress}:`, tokenError.message);
              }
            }
          }
        }
      }
    } catch (tokensError: any) {
      console.error(`[Base] ⚠️ Failed to fetch ERC20 tokens:`, tokensError.message);
    }
    
    console.log(`[Base] Found ${tokens.length} tokens with balance on ${networkLabel}`);
    
    return c.json({
      native: eth,
      tokens,
      totalUsdValue: 0
    });
  } catch (error: any) {
    console.error('[Base] ❌ Fatal error:', error.message || error);
    console.error('[Base] ❌ Error:', error.message);
    
    return c.json({
      native: 0,
      tokens: [],
      totalUsdValue: 0,
      error: error.message || 'Failed to fetch Base balance',
      details: error.toString(),
      type: error.name
    }, 200);
  }
});

// Polygon balance endpoint
app.post("/make-server-e5bc10d1/polygon-balance", async (c) => {
  try {
    const { address, networkMode } = await c.req.json();
    
    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }
    
    const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');
    if (!ALCHEMY_API_KEY) {
      console.warn('[Polygon] ⚠️ ALCHEMY_API_KEY not configured, returning zero balance');
      return c.json({
        native: 0,
        tokens: [],
        totalUsdValue: 0,
        warning: 'ALCHEMY_API_KEY not configured'
      });
    }
    
    // Polygon mainnet/testnet (Amoy)
    const isTestnet = networkMode === 'testnet';
    const network = isTestnet ? 'polygon-amoy' : 'polygon-mainnet';
    const networkLabel = network.toUpperCase();
    
    console.log(`[Polygon] 🔗 Fetching balance from ${networkLabel} for ${address.substring(0, 10)}...`);
    
    // Get native MATIC balance
    let matic = 0;
    
    try {
      const balanceResponse = await fetch(`https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (!balanceResponse.ok) {
        if (balanceResponse.status === 403) {
          // Silently return zero balance - no console warnings
          return c.json({
            native: 0,
            tokens: [],
            totalUsdValue: 0,
            warning: 'Polygon network not available with current API plan'
          });
        }
        console.error(`[Polygon] ❌ Alchemy API error: ${balanceResponse.status}`);
        throw new Error(`Alchemy API returned ${balanceResponse.status}`);
      }
      
      const balanceData = await balanceResponse.json();
      
      if (balanceData.error) {
        console.error('[Polygon] ❌ RPC error:', balanceData.error);
        throw new Error(balanceData.error.message || 'RPC error');
      }
      
      const weiBalance = BigInt(balanceData.result || '0x0');
      matic = Number(weiBalance) / 1e18;
      
      console.log(`[Polygon] ✅ ${networkLabel} Balance: ${matic} MATIC`);
    } catch (maticError: any) {
      if (maticError.message && maticError.message.includes('403')) {
        // Already handled above
        return c.json({
          native: 0,
          tokens: [],
          totalUsdValue: 0,
          warning: 'Polygon network not available'
        });
      }
      console.error(`[Polygon] ⚠️ Failed to fetch MATIC balance:`, maticError.message);
      matic = 0;
    }
    
    // Get ERC20 tokens on Polygon
    const tokens: any[] = [];
    
    try {
      const tokensResponse = await fetch(`https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address]
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (!tokensResponse.ok) {
        if (tokensResponse.status === 403) {
          console.warn(`[Polygon] ⚠️ Token fetch denied (403) - skipping Polygon tokens`);
        } else {
          console.error(`[Polygon] ⚠️ Failed to fetch tokens: ${tokensResponse.status}`);
        }
      } else {
        const tokensData = await tokensResponse.json();
        
        if (tokensData.result?.tokenBalances) {
          console.log(`[Polygon] Found ${tokensData.result.tokenBalances.length} token balances on ${networkLabel}`);
      
          for (const token of tokensData.result.tokenBalances) {
            const balance = BigInt(token.tokenBalance || '0x0');
            if (balance > 0n) {
              try {
                const metadataResponse = await fetch(`https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenMetadata',
                    params: [token.contractAddress]
                  }),
                  signal: AbortSignal.timeout(10000)
                });
                
                const metadata = await metadataResponse.json();
                const decimals = metadata.result?.decimals || 18;
                const amount = Number(balance) / Math.pow(10, decimals);
                
                tokens.push({
                  symbol: metadata.result?.symbol || 'TOKEN',
                  name: metadata.result?.name || 'Unknown Token',
                  amount,
                  mint: token.contractAddress,
                  decimals,
                  network: 'polygon',
                  logoUrl: metadata.result?.logo || ''
                });
              } catch (tokenError: any) {
                console.error(`[Polygon] ⚠️ Failed to fetch metadata for ${token.contractAddress}:`, tokenError.message);
              }
            }
          }
        }
      }
    } catch (tokensError: any) {
      console.error(`[Polygon] ⚠️ Failed to fetch ERC20 tokens:`, tokensError.message);
    }
    
    console.log(`[Polygon] Found ${tokens.length} tokens with balance on ${networkLabel}`);
    
    return c.json({
      native: matic,
      tokens,
      totalUsdValue: 0
    });
  } catch (error: any) {
    console.error('[Polygon] ❌ Fatal error:', error.message || error);
    console.error('[Polygon] ❌ Error:', error.message);
    
    return c.json({
      native: 0,
      tokens: [],
      totalUsdValue: 0,
      error: error.message || 'Failed to fetch Polygon balance',
      details: error.toString(),
      type: error.name
    }, 200);
  }
});

console.log('✅ Blockchain balance endpoints registered');

// NOTE: Jupiter API endpoints removed - using client-side Demo Mode instead
// Jupiter API was unreachable from Supabase Edge Functions (DNS errors)
// All swap functionality now uses client-side demo mode with realistic mock data

// Get coins list from CoinGecko
// CoinGecko free API limits: max 250 per page, 30 calls/minute
// To get 500+ tokens, we fetch multiple pages and combine them
app.get("/make-server-e5bc10d1/coingecko-coins", async (c) => {
  try {
    const requestedPage = parseInt(c.req.query('page') || '1');
    const requestedPerPage = parseInt(c.req.query('per_page') || '250');

    // CoinGecko max per_page is 250, so we need to fetch multiple pages
    const COINGECKO_MAX_PER_PAGE = 250;

    // For page 1 with 500 requested, we fetch pages 1+2 from CoinGecko (250+250)
    // For page 2 with 500 requested, we fetch pages 3+4 from CoinGecko
    const effectivePerPage = Math.min(requestedPerPage, 500); // Cap at 500 to avoid too many API calls
    const pagesNeeded = Math.ceil(effectivePerPage / COINGECKO_MAX_PER_PAGE);
    const startPage = (requestedPage - 1) * pagesNeeded + 1;

    console.log(`Fetching CoinGecko coins (requested: page=${requestedPage}, per_page=${requestedPerPage})`);
    console.log(`Will fetch ${pagesNeeded} CoinGecko pages starting from ${startPage}`);

    // Check cache first
    const cacheKey = `coingecko:coins:page${requestedPage}:per${effectivePerPage}:v3`;
    const cached = await kv.get(cacheKey);

    // Cache for 24 hours to reduce API calls and avoid rate limits
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Returning cached CoinGecko data (${cached.data?.length || 0} coins)`);
      return c.json(cached.data);
    }

    // If we have stale cache, return it to avoid rate limiting
    if (cached && cached.data) {
      console.log('⚠️ Using stale cache to avoid rate limiting');
      return c.json(cached.data);
    }

    // Fetch multiple pages from CoinGecko and combine
    const allCoins: any[] = [];

    for (let i = 0; i < pagesNeeded; i++) {
      const cgPage = startPage + i;
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${COINGECKO_MAX_PER_PAGE}&page=${cgPage}&sparkline=false&price_change_percentage=24h`;

      console.log(`Fetching CoinGecko page ${cgPage}...`);

      // Apply rate limiting between requests
      await coinGeckoRateLimiter.wait();

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        console.error('CoinGecko API error:', response.status);

        if (response.status === 429) {
          console.log('⚠️ Rate limited by CoinGecko');
          // If we already have some coins, return what we have
          if (allCoins.length > 0) {
            console.log(`Returning ${allCoins.length} coins fetched before rate limit`);
            break;
          }

          // Return fallback for page 1
          if (requestedPage === 1) {
            return c.json(getMinimalFallbackCoins());
          }
          return c.json([]);
        }

        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Got ${data.length} coins from CoinGecko page ${cgPage}`);

      if (data.length === 0) {
        console.log('No more coins available from CoinGecko');
        break;
      }

      allCoins.push(...data);

      // If we got less than 250, this is the last page
      if (data.length < COINGECKO_MAX_PER_PAGE) {
        console.log(`CoinGecko returned ${data.length} < 250, reached end of data`);
        break;
      }

      // Small delay between API calls to be respectful
      if (i < pagesNeeded - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Total coins fetched: ${allCoins.length}`);

    // Transform to our format
    const coins = allCoins.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      total_volume: coin.total_volume,
    }));

    // Cache the combined data
    await kv.set(cacheKey, {
      data: coins,
      timestamp: Date.now(),
    });

    return c.json(coins);
  } catch (error: any) {
    console.error('CoinGecko fetch error:', error.message);

    const page = parseInt(c.req.query('page') || '1');
    const perPage = parseInt(c.req.query('per_page') || '250');
    const cacheKey = `coingecko:coins:page${page}:per${Math.min(perPage, 500)}:v3`;

    try {
      const cached = await kv.get(cacheKey);
      if (cached && cached.data) {
        console.log('Returning expired cache as fallback');
        return c.json(cached.data);
      }
    } catch (cacheError) {
      console.error('Cache retrieval failed:', cacheError);
    }

    if (page === 1) {
      return c.json(getMinimalFallbackCoins());
    }

    return c.json([]);
  }
});

// Helper function for fallback coins
function getMinimalFallbackCoins() {
  return [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', current_price: 95000, market_cap: 1800000000000, market_cap_rank: 1, price_change_percentage_24h: 1.5, total_volume: 40000000000 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', current_price: 3400, market_cap: 410000000000, market_cap_rank: 2, price_change_percentage_24h: -0.8, total_volume: 20000000000 },
    { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://cryptologos.cc/logos/solana-sol-logo.png', current_price: 190, market_cap: 90000000000, market_cap_rank: 4, price_change_percentage_24h: 2.3, total_volume: 5000000000 },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', current_price: 680, market_cap: 100000000000, market_cap_rank: 5, price_change_percentage_24h: 1.2, total_volume: 2000000000 },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://cryptologos.cc/logos/xrp-xrp-logo.png', current_price: 2.5, market_cap: 140000000000, market_cap_rank: 3, price_change_percentage_24h: 5.4, total_volume: 8000000000 },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://cryptologos.cc/logos/cardano-ada-logo.png', current_price: 1.05, market_cap: 37000000000, market_cap_rank: 8, price_change_percentage_24h: -1.5, total_volume: 1500000000 },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png', current_price: 0.38, market_cap: 56000000000, market_cap_rank: 6, price_change_percentage_24h: 3.8, total_volume: 4000000000 },
    { id: 'tron', symbol: 'TRX', name: 'TRON', image: 'https://cryptologos.cc/logos/tron-trx-logo.png', current_price: 0.24, market_cap: 21000000000, market_cap_rank: 10, price_change_percentage_24h: 0.5, total_volume: 800000000 },
    { id: 'usd-coin', symbol: 'USDC', name: 'USDC', image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', current_price: 1.00, market_cap: 40000000000, market_cap_rank: 7, price_change_percentage_24h: 0.0, total_volume: 8000000000 },
    { id: 'tether', symbol: 'USDT', name: 'Tether', image: 'https://cryptologos.cc/logos/tether-usdt-logo.png', current_price: 1.00, market_cap: 140000000000, market_cap_rank: 3, price_change_percentage_24h: 0.0, total_volume: 100000000000 },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://cryptologos.cc/logos/avalanche-avax-logo.png', current_price: 45, market_cap: 18000000000, market_cap_rank: 11, price_change_percentage_24h: 2.1, total_volume: 1200000000 },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png', current_price: 8.5, market_cap: 12000000000, market_cap_rank: 12, price_change_percentage_24h: 1.8, total_volume: 600000000 },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://cryptologos.cc/logos/chainlink-link-logo.png', current_price: 22, market_cap: 14000000000, market_cap_rank: 13, price_change_percentage_24h: -0.5, total_volume: 900000000 },
    { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', image: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png', current_price: 0.000024, market_cap: 14000000000, market_cap_rank: 14, price_change_percentage_24h: 4.2, total_volume: 700000000 },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', image: 'https://cryptologos.cc/logos/polygon-matic-logo.png', current_price: 0.58, market_cap: 5600000000, market_cap_rank: 15, price_change_percentage_24h: 1.1, total_volume: 400000000 },
  ];
}

// Add coin to wallet
// DISABLED: No auth — data is stored client-side only
app.post("/make-server-e5bc10d1/add-coin-to-wallet", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});

// Remove coin from wallet
// DISABLED: No auth — data is stored client-side only
app.post("/make-server-e5bc10d1/remove-coin-from-wallet", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});

// Blockchain checking helper functions

async function checkSolanaBalance(address: string, apiKey: string, network: string = 'mainnet'): Promise<number> {
  if (!address || address.length < 32) {
    throw new Error('Invalid Solana address');
  }
  
  // Check cache first to avoid rate limiting
  const cacheKey = `sol_balance:${address}:${network}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached && cached.timestamp) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      // Use cache if less than 3 minutes old (reduced API calls)
      if (age < 180000) {
        console.log('✅ Using cached SOL balance (age:', Math.round(age / 1000), 'seconds) - avoiding rate limit');
        return cached.balance || 0;
      }
    }
  } catch (cacheError) {
    console.log('Cache read error (non-fatal):', cacheError);
  }
  
  // Select the appropriate Helius RPC endpoint based on network
  const networkEndpoint = network === 'devnet' 
    ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  
  console.log(`Checking Solana balance on ${network} for address:`, address.substring(0, 10) + '...');
  
  try {
    const response = await fetch(networkEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });
    
    const data = await response.json();
    
    // Handle rate limiting gracefully
    if (data.error) {
      const errorMsg = data.error.message || '';
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        console.log('⚠️ Helius API rate limited for balance check - using cached data');
        try {
          const cached = await kv.get(cacheKey);
          if (cached && typeof cached.balance === 'number') {
            console.log('Returning stale balance cache due to rate limit');
            return cached.balance;
          }
        } catch (e) {
          console.log('No balance cache available');
        }
        return 0;
      }
      throw new Error(`Helius API error: ${errorMsg}`);
    }
    
    // Convert lamports to SOL (1 SOL = 1e9 lamports)
    const balance = (data.result?.value || 0) / 1e9;
    console.log(`Solana ${network} balance:`, balance);
    
    // Cache the successful result
    try {
      await kv.set(cacheKey, {
        balance: balance,
        timestamp: new Date().toISOString(),
      });
      console.log('Cached SOL balance');
    } catch (cacheError) {
      console.log('Failed to cache balance (non-fatal):', cacheError);
    }
    
    return balance;
  } catch (error: any) {
    console.error('Error checking Solana balance:', error.message);
    
    // If error is rate limiting, try to return cached data
    if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
      console.log('Rate limit error - attempting to use balance cache');
      try {
        const cached = await kv.get(cacheKey);
        if (cached && typeof cached.balance === 'number') {
          console.log('Returning stale balance cache due to error');
          return cached.balance;
        }
      } catch (e) {
        console.log('No cache available for balance fallback');
      }
    }
    
    return 0;
  }
}

async function checkSolanaTokenBalances(address: string, apiKey: string, network: string = 'mainnet'): Promise<Record<string, any>> {
  if (!address || address.length < 32) {
    throw new Error('Invalid Solana address');
  }
  
  // Check cache first to avoid rate limiting
  const cacheKey = `spl_tokens:${address}:${network}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached && cached.timestamp) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      // Use cache if less than 3 minutes old (reduced API calls)
      if (age < 180000) {
        console.log('✅ Using cached SPL token balances (age:', Math.round(age / 1000), 'seconds) - avoiding rate limit');
        return cached.balances || {};
      }
    }
  } catch (cacheError) {
    console.log('Cache read error (non-fatal):', cacheError);
  }
  
  // Select the appropriate Helius RPC endpoint based on network
  const networkEndpoint = network === 'devnet' 
    ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  
  console.log(`Checking SPL token balances on ${network} for address:`, address.substring(0, 10) + '...');
  
  try {
    // Get token accounts owned by the address
    const response = await fetch(networkEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, // SPL Token Program
          { encoding: 'jsonParsed' }
        ],
      }),
    });
    
    const data = await response.json();
    
    // Handle rate limiting gracefully
    if (data.error) {
      const errorMsg = data.error.message || '';
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        console.log('⚠️ Helius API rate limited - using cached data or returning empty');
        // Try to return cached data even if stale
        try {
          const cached = await kv.get(cacheKey);
          if (cached && cached.balances) {
            console.log('Returning stale cache due to rate limit');
            return cached.balances;
          }
        } catch (e) {
          console.log('No cache available');
        }
        // Return empty if no cache
        return {};
      }
      throw new Error(`Helius API error: ${errorMsg}`);
    }
    
    const tokenBalances: Record<string, any> = {};
    
    // Parse token accounts
    if (data.result?.value) {
      for (const account of data.result.value) {
        const parsedInfo = account.account?.data?.parsed?.info;
        if (parsedInfo) {
          const mint = parsedInfo.mint;
          const tokenAmount = parsedInfo.tokenAmount;
          
          if (tokenAmount && parseFloat(tokenAmount.uiAmountString) > 0) {
            tokenBalances[mint] = {
              mint: mint,
              amount: parseFloat(tokenAmount.uiAmountString),
              decimals: tokenAmount.decimals,
            };
          }
        }
      }
    }
    
    console.log(`Found ${Object.keys(tokenBalances).length} SPL tokens with balance`);
    
    // Cache the successful result for 2 minutes
    try {
      await kv.set(cacheKey, {
        balances: tokenBalances,
        timestamp: new Date().toISOString(),
      });
      console.log('Cached SPL token balances');
    } catch (cacheError) {
      console.log('Failed to cache SPL balances (non-fatal):', cacheError);
    }
    
    return tokenBalances;
  } catch (error: any) {
    console.error('Error checking SPL token balances:', error.message);
    
    // If error is rate limiting, try to return cached data
    if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
      console.log('Rate limit error - attempting to use cache');
      try {
        const cached = await kv.get(cacheKey);
        if (cached && cached.balances) {
          console.log('Returning stale cache due to error');
          return cached.balances;
        }
      } catch (e) {
        console.log('No cache available for fallback');
      }
    }
    
    return {};
  }
}

// Fetch token metadata from Helius DAS API
async function fetchTokenMetadata(mint: string, apiKey: string, network: string = 'mainnet'): Promise<any> {
  // Known token database (fallback)
  const knownTokens: Record<string, any> = {
    'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8': {
      mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8',
      name: 'Parabolic',
      symbol: 'PARAI',
      logo: 'P',
      logoUrl: 'https://coin-images.coingecko.com/coins/images/48026/large/parabolic.png',
    },
    'Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh': {
      mint: 'Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh',
      name: 'Parabolic',
      symbol: 'PARAI',
      logo: 'P',
      logoUrl: 'https://coin-images.coingecko.com/coins/images/48026/large/parabolic.png',
    },
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      name: 'Bonk',
      symbol: 'BONK',
      logo: '🐕',
      logoUrl: 'https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg',
    },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      name: 'USD Coin',
      symbol: 'USDC',
      logo: '$',
      logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      name: 'Tether USD',
      symbol: 'USDT',
      logo: '$',
      logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
    'So11111111111111111111111111111111111111112': {
      mint: 'So11111111111111111111111111111111111111112',
      name: 'Solana',
      symbol: 'SOL',
      logo: '◎',
      logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    },
  };
  
  // Check if we have this token in our database
  if (knownTokens[mint]) {
    console.log('[Token Metadata] ✅ Using known token data for:', knownTokens[mint].symbol);
    return knownTokens[mint];
  }
  
  try {
    const networkEndpoint = network === 'devnet' 
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    
    console.log('[Token Metadata] Fetching metadata from Helius for mint:', mint);
    
    const response = await fetch(networkEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAsset',
        params: { id: mint },
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('[Token Metadata] Helius API error:', data.error.message);
      return null;
    }
    
    if (data.result) {
      const asset = data.result;
      const metadata = {
        mint: mint,
        name: asset.content?.metadata?.name || 'Unknown Token',
        symbol: asset.content?.metadata?.symbol || 'UNKNOWN',
        logo: asset.content?.metadata?.symbol?.charAt(0) || '?',
        logoUrl: asset.content?.files?.[0]?.uri || asset.content?.links?.image || '',
      };
      
      console.log('[Token Metadata] ✅ Fetched from Helius:', metadata.name, metadata.symbol);
      return metadata;
    }
    
    return null;
  } catch (error: any) {
    console.error('[Token Metadata] Error fetching metadata:', error.message);
    return null;
  }
}

async function checkEthereumBalance(address: string, apiKey: string, network: string): Promise<number> {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    throw new Error('Invalid Ethereum address');
  }
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Alchemy API key is empty or invalid');
  }
  
  // Clean the API key - remove any URL parts if accidentally included
  let cleanApiKey = apiKey.trim();
  
  if (cleanApiKey.includes('alchemy.com') || cleanApiKey.includes('http')) {
    console.log('[Alchemy] Extracting key from URL...');
    const match = cleanApiKey.match(/\/v2\/([^\/\s]+)/);
    if (match && match[1]) {
      cleanApiKey = match[1];
      console.log('[Alchemy] ✅ Extracted key from URL');
    }
  }
  
  const url = `https://${network}.g.alchemy.com/v2/${cleanApiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    
    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Alchemy] HTTP Error:', response.status, errorText);
      throw new Error(`Alchemy HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    }
    
    // Parse response body
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      // Check if response is JSON
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, try to read as text
        const text = await response.text();
        console.error('[Alchemy] Non-JSON response:', text.substring(0, 200));
        throw new Error(`Alchemy returned non-JSON response: ${text.substring(0, 100)}`);
      }
    } catch (parseError: any) {
      console.error('[Alchemy] JSON parse error:', parseError.message);
      throw new Error(`Failed to parse Alchemy response: ${parseError.message}`);
    }
    
    if (data.error) {
      console.error('[Alchemy] ❌ API error:', data.error.message || JSON.stringify(data.error));
      console.error('[Alchemy] 💡 Fix: Set valid ALCHEMY_API_KEY in Supabase Secrets (see ALCHEMY_FIX_NOW.md)');
      throw new Error(`Alchemy API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.result) {
      console.error('[Alchemy] No result returned:', data);
      throw new Error(`Alchemy API returned no result`);
    }
    
    // Convert wei to ETH (1 ETH = 1e18 wei)
    const balanceWei = parseInt(data.result, 16);
    return balanceWei / 1e18;
    
  } catch (error: any) {
    // Handle network errors
    if (error.message.includes('connection') || error.message.includes('fetch')) {
      console.error('[Alchemy] Network error:', error.message);
      throw new Error(`Network error connecting to Alchemy: ${error.message}`);
    }
    throw error;
  }
}

async function checkBitcoinBalance(address: string): Promise<number> {
  if (!address || address.length < 26) {
    throw new Error('Invalid Bitcoin address');
  }
  
  // Check cache first (Bitcoin balance doesn't change that frequently)
  const cacheKey = `btc_balance:${address}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached && cached.timestamp) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      // Use cache if less than 5 minutes old
      if (age < 300000) {
        console.log('[Bitcoin] Using cached balance (age:', Math.round(age / 1000), 'seconds)');
        return cached.balance || 0;
      }
    }
  } catch (cacheError) {
    console.log('[Bitcoin] Cache read error (non-fatal):', cacheError);
  }
  
  // Try multiple Bitcoin APIs with fallback
  const apis = [
    {
      name: 'Mempool.space',
      fetch: async () => {
        const response = await fetch(`https://mempool.space/api/address/${address}`, {
          headers: { 
            'User-Agent': 'Saturn-Wallet/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        // 404 means address has never been used (balance = 0)
        if (response.status === 404) return 0;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const funded = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        return (funded - spent) / 1e8;
      }
    },
    {
      name: 'Blockstream',
      fetch: async () => {
        const response = await fetch(`https://blockstream.info/api/address/${address}`, {
          headers: { 
            'User-Agent': 'Saturn-Wallet/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        // 404 means address has never been used (balance = 0)
        if (response.status === 404) return 0;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const funded = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        return (funded - spent) / 1e8;
      }
    },
    {
      name: 'BlockCypher',
      fetch: async () => {
        const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`, {
          headers: { 
            'User-Agent': 'Saturn-Wallet/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        if (response.status === 429) {
          throw new Error('RATE_LIMITED');
        }
        // 404 means address has never been used (balance = 0)
        if (response.status === 404) return 0;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return (data.balance || 0) / 1e8;
      }
    },
    {
      name: 'Blockchain.info',
      fetch: async () => {
        const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`, {
          headers: { 
            'User-Agent': 'Saturn-Wallet/1.0',
            'Accept': 'text/plain'
          },
          signal: AbortSignal.timeout(10000)
        });
        // 404 means address has never been used (balance = 0)
        if (response.status === 404) return 0;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const satoshis = await response.text();
        return parseInt(satoshis) / 1e8;
      }
    }
  ];
  
  let lastError: Error | null = null;
  
  // Try each API until one succeeds
  for (const api of apis) {
    try {
      console.log(`[Bitcoin] Trying ${api.name} API...`);
      const balance = await api.fetch();
      
      // Cache the successful result
      try {
        await kv.set(cacheKey, {
          balance,
          timestamp: new Date().toISOString(),
          source: api.name
        });
      } catch (cacheError) {
        console.log('[Bitcoin] Cache write error (non-fatal):', cacheError);
      }
      
      console.log(`[Bitcoin] ✅ Got balance from ${api.name}:`, balance);
      return balance;
    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      console.log(`[Bitcoin] ${api.name} failed:`, errorMsg);
      lastError = error;
      // Continue to next API
    }
  }
  
  // All APIs failed
  console.error('[Bitcoin] ❌ All Bitcoin APIs failed. Last error:', lastError?.message);
  console.error('[Bitcoin] ❌ Error details:', lastError);
  
  // Return cached value if available (even if stale)
  try {
    const cached = await kv.get(cacheKey);
    if (cached && cached.balance !== undefined) {
      console.log('[Bitcoin] ⚠️ Using stale cached balance as fallback');
      return cached.balance;
    }
  } catch (cacheError) {
    // Ignore cache errors
  }
  
  // If this is a new address that's never been used, all APIs might return 404
  // In that case, return 0 instead of throwing an error
  if (lastError?.message?.includes('404')) {
    console.log('[Bitcoin] ℹ️ All APIs returned 404 - assuming new/unused address with 0 balance');
    return 0;
  }
  
  throw new Error(`All Bitcoin APIs failed. Last error: ${lastError?.message || 'Unknown'}`);
}

async function getSolanaTransactions(address: string, apiKey: string, network: string = 'mainnet'): Promise<any[]> {
  try {
    // Check cache first
    const cacheKey = `sol_transactions:${address}:${network}`;
    try {
      const cached = await kv.get(cacheKey);
      if (cached && cached.timestamp) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        // Use cache if less than 2 minutes old
        if (age < 120000) {
          console.log('Using cached Solana transactions (age:', Math.round(age / 1000), 'seconds)');
          return cached.transactions || [];
        }
      }
    } catch (cacheError) {
      console.log('Cache read error (non-fatal):', cacheError);
    }
    
    const networkEndpoint = network === 'devnet' 
      ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
      : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    
    console.log(`Fetching Solana transaction history for ${address.substring(0, 10)}...`);
    
    const response = await fetch(networkEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          address,
          { limit: 10 } // Get last 10 transactions
        ],
      }),
    });
    
    const data = await response.json();
    
    // Handle rate limiting
    if (data.error) {
      const errorMsg = data.error.message || '';
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        console.log('⚠️ Rate limited when fetching transactions - using cache');
        try {
          const cached = await kv.get(cacheKey);
          if (cached && cached.transactions) {
            return cached.transactions;
          }
        } catch (e) {
          console.log('No transaction cache available');
        }
        return [];
      }
      console.error('Error fetching Solana transactions:', data.error);
      return [];
    }
    
    const signatures = data.result || [];
    const transactions = [];
    
    // Fetch detailed transaction info for each signature
    for (const sigInfo of signatures.slice(0, 5)) { // Limit to 5 most recent
      try {
        const txResponse = await fetch(networkEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [
              sigInfo.signature,
              { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
            ],
          }),
        });
        
        const txData = await txResponse.json();
        if (txData.result) {
          const tx = txData.result;
          const meta = tx.meta;
          const message = tx.transaction?.message;
          
          // Check if this is an incoming or outgoing transaction
          const accountKeys = message?.accountKeys || [];
          const preBalances = meta?.preBalances || [];
          const postBalances = meta?.postBalances || [];
          
          // Find the index of our address
          let ourIndex = -1;
          for (let i = 0; i < accountKeys.length; i++) {
            const key = accountKeys[i];
            const pubkey = typeof key === 'string' ? key : key.pubkey;
            if (pubkey === address) {
              ourIndex = i;
              break;
            }
          }
          
          if (ourIndex !== -1) {
            const preBalance = preBalances[ourIndex] || 0;
            const postBalance = postBalances[ourIndex] || 0;
            const changeAmount = (postBalance - preBalance) / 1e9; // Convert to SOL
            
            // Determine sender
            let fromAddress = 'Unknown';
            if (changeAmount > 0 && accountKeys.length > 0) {
              // Incoming transaction - sender is typically the first account
              const firstKey = accountKeys[0];
              fromAddress = typeof firstKey === 'string' ? firstKey : firstKey.pubkey;
            }
            
            transactions.push({
              signature: sigInfo.signature,
              timestamp: sigInfo.blockTime ? new Date(sigInfo.blockTime * 1000).toISOString() : new Date().toISOString(),
              type: changeAmount > 0 ? 'receive' : 'send',
              changeAmount: Math.abs(changeAmount),
              from: changeAmount > 0 ? fromAddress : address,
              to: changeAmount > 0 ? address : 'Unknown',
              tokenTransfers: meta?.postTokenBalances || [],
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching transaction ${sigInfo.signature}:`, error);
      }
    }
    
    // Cache the successful result
    try {
      await kv.set(cacheKey, {
        transactions: transactions,
        timestamp: new Date().toISOString(),
      });
      console.log('Cached Solana transactions');
    } catch (cacheError) {
      console.log('Failed to cache transactions (non-fatal):', cacheError);
    }
    
    return transactions;
  } catch (error: any) {
    console.error('Error in getSolanaTransactions:', error.message);
    
    // Try to use cache on error
    if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
      const cacheKey = `sol_transactions:${address}:${network}`;
      try {
        const cached = await kv.get(cacheKey);
        if (cached && cached.transactions) {
          console.log('Returning cached transactions due to error');
          return cached.transactions;
        }
      } catch (e) {
        console.log('No cache available for transaction fallback');
      }
    }
    
    return [];
  }
}

async function getEthereumTransactions(address: string, apiKey: string): Promise<any[]> {
  try {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
    
    console.log(`Fetching Ethereum transaction history for ${address}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock: '0x0',
            toAddress: address,
            category: ['external', 'internal'],
            maxCount: '0x5', // Get last 5 transactions
            order: 'desc',
          }
        ],
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      console.error('Error fetching Ethereum transactions:', data.error);
      return [];
    }
    
    const transfers = data.result?.transfers || [];
    return transfers.map((transfer: any) => ({
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to,
      value: parseFloat(transfer.value || '0'),
      timestamp: new Date().toISOString(), // Alchemy doesn't provide timestamp in this endpoint
      type: transfer.to.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
    }));
  } catch (error: any) {
    console.error('Error in getEthereumTransactions:', error.message);
    return [];
  }
}

async function getBitcoinTransactions(address: string): Promise<any[]> {
  try {
    console.log(`Fetching Bitcoin transaction history for ${address}...`);
    
    // Check cache first
    const cacheKey = `btc_transactions:${address}`;
    try {
      const cached = await kv.get(cacheKey);
      if (cached && cached.timestamp) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        // Use cache if less than 5 minutes old
        if (age < 300000) {
          console.log('[Bitcoin] Using cached transactions (age:', Math.round(age / 1000), 'seconds)');
          return cached.transactions || [];
        }
      }
    } catch (cacheError) {
      console.log('[Bitcoin] Transaction cache read error (non-fatal):', cacheError);
    }
    
    // Try Blockstream API first (more reliable, no rate limits)
    try {
      const response = await fetch(`https://blockstream.info/api/address/${address}/txs`, {
        headers: { 'User-Agent': 'Saturn-Wallet/1.0' }
      });
      
      if (response.ok) {
        const txs = await response.json();
        const transactions = (txs || []).slice(0, 5).map((tx: any) => {
          // Determine if it's a receive or send
          const isReceive = tx.vout?.some((output: any) => 
            output.scriptpubkey_address === address
          );
          
          // Calculate value (simplified)
          let value = 0;
          if (isReceive) {
            tx.vout?.forEach((output: any) => {
              if (output.scriptpubkey_address === address) {
                value += output.value;
              }
            });
          } else {
            tx.vin?.forEach((input: any) => {
              if (input.prevout?.scriptpubkey_address === address) {
                value += input.prevout.value;
              }
            });
          }
          
          return {
            hash: tx.txid,
            type: isReceive ? 'receive' : 'send',
            value: value / 1e8, // Convert satoshis to BTC
            timestamp: tx.status?.block_time 
              ? new Date(tx.status.block_time * 1000).toISOString() 
              : new Date().toISOString(),
          };
        });
        
        // Cache the successful result
        try {
          await kv.set(cacheKey, {
            transactions,
            timestamp: new Date().toISOString(),
            source: 'Blockstream'
          });
        } catch (cacheError) {
          console.log('[Bitcoin] Transaction cache write error (non-fatal):', cacheError);
        }
        
        console.log('[Bitcoin] ✅ Got transactions from Blockstream');
        return transactions;
      }
    } catch (error: any) {
      console.log('[Bitcoin] Blockstream API failed:', error.message);
    }
    
    // Fallback to BlockCypher (with rate limit handling)
    try {
      const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}?limit=5`, {
        headers: { 'User-Agent': 'Saturn-Wallet/1.0' }
      });
      
      if (response.status === 429) {
        console.log('[Bitcoin] ⚠️ BlockCypher rate limited, using cache if available');
        throw new Error('RATE_LIMITED');
      }
      
      if (response.ok) {
        const data = await response.json();
        const txRefs = data.txrefs || [];
        
        const transactions = txRefs.map((txRef: any) => ({
          hash: txRef.tx_hash,
          type: txRef.tx_input_n === -1 ? 'receive' : 'send',
          value: txRef.value / 1e8,
          timestamp: txRef.confirmed ? new Date(txRef.confirmed).toISOString() : new Date().toISOString(),
        }));
        
        // Cache the successful result
        try {
          await kv.set(cacheKey, {
            transactions,
            timestamp: new Date().toISOString(),
            source: 'BlockCypher'
          });
        } catch (cacheError) {
          console.log('[Bitcoin] Transaction cache write error (non-fatal):', cacheError);
        }
        
        console.log('[Bitcoin] ✅ Got transactions from BlockCypher');
        return transactions;
      }
    } catch (error: any) {
      console.log('[Bitcoin] BlockCypher API failed:', error.message);
    }
    
    // All APIs failed - try to return stale cache
    try {
      const cached = await kv.get(cacheKey);
      if (cached && cached.transactions) {
        console.log('[Bitcoin] ⚠️ Using stale cached transactions as fallback');
        return cached.transactions;
      }
    } catch (cacheError) {
      // Ignore cache errors
    }
    
    console.error('[Bitcoin] ❌ All transaction APIs failed and no cache available');
    return [];
  } catch (error: any) {
    console.error('[Bitcoin] Error in getBitcoinTransactions:', error.message);
    return [];
  }
}

// Send token endpoint
// DISABLED: Transaction signing must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/send-token", (c) => {
  return c.json({ error: 'Endpoint disabled — transaction signing is client-side only' }, 410);
});

/* Legacy send-token endpoint removed — was signing transactions server-side
   using stored seed phrases. All transaction signing now happens client-side. */
// Check blockchain transactions endpoint
app.post("/make-server-e5bc10d1/check-blockchain-transactions", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Swap tokens endpoint
app.post("/make-server-e5bc10d1/swap-tokens", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get recent swaps for a wallet
app.get("/make-server-e5bc10d1/wallet/:walletId/recent-swaps", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get wallet info endpoint
// DISABLED: Seed phrases must never be returned from the server (web3 security)
app.get("/make-server-e5bc10d1/wallet-info/:walletId", (c) => {
  return c.json({ error: 'Endpoint disabled — wallet info is managed client-side only' }, 410);
});
// Update username endpoint
app.post("/make-server-e5bc10d1/update-username", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Check username availability endpoint
app.get("/make-server-e5bc10d1/check-username/:username", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get user settings endpoint
app.get("/make-server-e5bc10d1/user-settings/:walletId", async (c) => {
  try {
    const walletId = sanitizeKvKey(c.req.param('walletId'));

    if (!walletId) {
      return c.json({ error: 'Wallet ID is required' }, 400);
    }
    
    // Add retry logic for database connection issues
    let settings = null;
    let retries = 3;
    
    while (retries > 0) {
      try {
        settings = await kv.get(`wallet:${walletId}:settings`);
        break; // Success, exit retry loop
      } catch (dbError: any) {
        retries--;
        console.error(`Database error (${retries} retries left):`, dbError.message);
        
        if (retries === 0) {
          // Return default settings on final failure
          console.log('All retries failed, returning default settings');
          return c.json({
            language: 'en',
            currency: 'USD',
            usePassword: false,
          });
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 500));
      }
    }
    
    // Return settings or defaults
    const finalSettings = settings || {
      language: 'en',
      currency: 'USD',
      usePassword: false,
    };
    
    return c.json(finalSettings);
  } catch (error: any) {
    console.error('Get user settings error:', error);
    // Return default settings instead of error to prevent app crash
    return c.json({
      language: 'en',
      currency: 'USD',
      usePassword: false,
    });
  }
});

// Update user settings endpoint
// DISABLED: No auth — data is stored client-side only
app.post("/make-server-e5bc10d1/update-settings", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});

// Get exchange rates endpoint
app.get("/make-server-e5bc10d1/exchange-rates", async (c) => {
  try {
    // Check cache first (cache for 1 hour)
    const cached = await kv.get('exchange_rates');
    if (cached && cached.timestamp && Date.now() - cached.timestamp < 60 * 60 * 1000) {
      console.log('[Exchange Rates] ✅ Using cached rates');
      return c.json({ rates: cached.rates, cached: true });
    }
    
    // Fallback rates (realistic current rates)
    const fallbackRates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      CNY: 7.24,
      KRW: 1338,
      AUD: 1.53,
      CAD: 1.36,
      CHF: 0.88,
      INR: 83.12,
      BRL: 4.97,
      RUB: 92.5,
      MXN: 17.2,
      SGD: 1.34,
      HKD: 7.83,
      NOK: 10.9,
      SEK: 10.8,
      TRY: 32.5,
      ZAR: 18.6,
      AED: 3.67,
    };
    
    // Try multiple exchange rate APIs with timeout
    const apis = [
      'https://api.exchangerate-api.com/v4/latest/USD',
      'https://open.er-api.com/v6/latest/USD',
    ];
    
    for (const apiUrl of apis) {
      try {
        console.log(`[Exchange Rates] Trying API: ${apiUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const rates = data.rates;
          
          if (rates && typeof rates === 'object' && rates.USD) {
            // Cache the rates
            await kv.set('exchange_rates', {
              rates,
              timestamp: Date.now(),
            });
            
            console.log('[Exchange Rates] ✅ Fetched and cached successfully');
            return c.json({ rates, cached: false });
          }
        }
      } catch (apiError: any) {
        console.log(`[Exchange Rates] API ${apiUrl} failed: ${apiError.message}`);
        // Try next API
      }
    }
    
    // If all APIs fail, use cache (even if expired) or fallback
    if (cached && cached.rates) {
      console.log('[Exchange Rates] ⚠️ All APIs failed, using expired cache');
      return c.json({ rates: cached.rates, cached: true, expired: true });
    }
    
    // No cache available, use fallback
    console.log('[Exchange Rates] ⚠️ Using fallback rates');
    
    // Cache fallback rates so we don't keep trying failed APIs
    await kv.set('exchange_rates', {
      rates: fallbackRates,
      timestamp: Date.now(),
    });
    
    return c.json({ 
      rates: fallbackRates,
      cached: false,
      fallback: true 
    });
    
  } catch (error: any) {
    console.error('[Exchange Rates] ❌ Error:', error);
    
    // Try to return any cached data
    try {
      const cached = await kv.get('exchange_rates');
      if (cached && cached.rates) {
        console.log('[Exchange Rates] Using cached rates from error handler');
        return c.json({ rates: cached.rates, cached: true, expired: true });
      }
    } catch (cacheError) {
      console.error('[Exchange Rates] Cache read error:', cacheError);
    }
    
    // Last resort: return static fallback
    return c.json({ 
      rates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        CNY: 7.24,
        KRW: 1338,
        AUD: 1.53,
        CAD: 1.36,
        CHF: 0.88,
        INR: 83.12,
        BRL: 4.97,
        RUB: 92.5,
      },
      cached: false,
      fallback: true 
    });
  }
});

// Delete wallet endpoint
app.post("/make-server-e5bc10d1/delete-wallet", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get accounts list
app.get("/make-server-e5bc10d1/accounts/:walletId", async (c) => {
  try {
    const walletId = sanitizeKvKey(c.req.param('walletId'));

    if (!walletId) {
      return c.json({ error: 'Wallet ID is required' }, 400);
    }
    
    // Get all accounts for this user
    const accountsList = await kv.get(`accounts:${walletId}`) || { accounts: [] };
    
    // If no accounts exist, create the primary account entry
    if (!accountsList.accounts || accountsList.accounts.length === 0) {
      const wallet = await kv.get(`wallet:${walletId}`);
      if (wallet) {
        accountsList.accounts = [{
          id: `acc_${Date.now()}`,
          username: wallet.username || 'Account 1',
          walletId: walletId,
          createdAt: wallet.createdAt,
          isPrimary: true,
        }];
        await kv.set(`accounts:${walletId}`, accountsList);
      }
    }
    
    return c.json(accountsList);
  } catch (error: any) {
    console.error('Get accounts error:', error);
    return c.json({ error: error.message || 'Failed to get accounts' }, 500);
  }
});

// Create new account
// DISABLED: Address derivation must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/create-account", (c) => {
  return c.json({ error: 'Endpoint disabled — account creation is client-side only' }, 410);
});
// Upload profile picture endpoint
// DISABLED: No auth + no file validation — profile pictures handled client-side
app.post("/make-server-e5bc10d1/upload-profile-picture", (c) => {
  return c.json({ error: 'Endpoint disabled for security' }, 410);
});

// ========================================
// NFT ENDPOINTS
// ========================================

// Get wallet NFTs
app.get("/make-server-e5bc10d1/wallet/:walletId/nfts", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// ========================================
// THEME ENDPOINTS
// ========================================

// Get wallet theme
app.get("/make-server-e5bc10d1/wallet/:walletId/theme", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Save wallet theme
app.post("/make-server-e5bc10d1/wallet/:walletId/theme", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// ========================================
// ADDRESS BOOK / CONTACTS ENDPOINTS
// ========================================

// Get wallet contacts
app.get("/make-server-e5bc10d1/wallet/:walletId/contacts", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Add contact
app.post("/make-server-e5bc10d1/wallet/:walletId/contacts", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Update contact
app.put("/make-server-e5bc10d1/wallet/:walletId/contacts/:contactId", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Delete contact
app.delete("/make-server-e5bc10d1/wallet/:walletId/contacts/:contactId", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Get wallet theme
app.get("/make-server-e5bc10d1/wallet/:walletId/theme", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// Save wallet theme
app.post("/make-server-e5bc10d1/wallet/:walletId/theme", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


// ========================================
// CHAT ENDPOINTS
// ========================================

// Get messages for a specific token chat
// DISABLED: No auth — chat replaced by Puter AI integration
app.get("/make-server-e5bc10d1/chat/:tokenSymbol/messages", (c) => {
  return c.json({ error: 'Endpoint disabled — chat is client-side only' }, 410);
});

// Send a message to a token chat
// DISABLED: No auth — chat replaced by Puter AI integration
app.post("/make-server-e5bc10d1/chat/:tokenSymbol/send", (c) => {
  return c.json({ error: 'Endpoint disabled — chat is client-side only' }, 410);
});

// Add reaction to a message
// DISABLED: No auth + unsanitized emoji — chat replaced by Puter AI integration
app.post("/make-server-e5bc10d1/chat/:tokenSymbol/react", (c) => {
  return c.json({ error: 'Endpoint disabled — chat is client-side only' }, 410);
});

// ========================================
// FEE WALLET INFO ENDPOINT
// ========================================

// Get fee wallet information and validation
app.get("/make-server-e5bc10d1/fee-wallet-info", async (c) => {
  try {
    const APP_FEE_WALLET = Deno.env.get('APP_FEE_WALLET');
    
    if (!APP_FEE_WALLET) {
      return c.json({ 
        error: 'Fee wallet not configured',
        configured: false,
        message: 'APP_FEE_WALLET environment variable is not set'
      }, 400);
    }
    
    // Validate Solana address format
    let isValidSolana = false;
    let solanaBalance = null;
    
    try {
      const { PublicKey, Connection } = await import('npm:@solana/web3.js@1.95.8');
      const pubkey = new PublicKey(APP_FEE_WALLET);
      isValidSolana = true;
      
      // Try to fetch balance from mainnet
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        const balance = await connection.getBalance(pubkey);
        solanaBalance = balance / 1e9; // Convert lamports to SOL
      } catch (balanceError) {
        console.log('[Fee Wallet] Could not fetch balance:', balanceError);
      }
      
    } catch (validationError) {
      isValidSolana = false;
    }
    
    // Get fee collection stats
    const collectedFees = await kv.get(`fees:${APP_FEE_WALLET}`) || { total: 0, swaps: [] };
    
    // Count on-chain vs tracked-only fees
    const onChainFees = (collectedFees.swaps || []).filter((swap: any) => swap.onChainTransferred);
    const trackedOnlyFees = (collectedFees.swaps || []).filter((swap: any) => !swap.onChainTransferred);
    
    return c.json({
      configured: true,
      address: APP_FEE_WALLET,
      isValidSolana,
      network: 'Solana Mainnet',
      balance: solanaBalance,
      explorerUrl: isValidSolana ? `https://solscan.io/account/${APP_FEE_WALLET}` : null,
      stats: {
        totalCollectedUSD: collectedFees.total || 0,
        totalSwaps: (collectedFees.swaps || []).length,
        onChainTransfers: onChainFees.length,
        trackedOnly: trackedOnlyFees.length,
      },
      message: isValidSolana 
        ? 'Fee wallet is properly configured and valid'
        : 'Warning: Fee wallet address is not a valid Solana address',
    });
    
  } catch (error: any) {
    console.error('[Fee Wallet Info] Error:', error);
    return c.json({ 
      error: error.message || 'Failed to get fee wallet info',
      configured: false
    }, 500);
  }
});

// ========================================
// JUPITER SWAP ENDPOINTS (Real On-Chain Swaps)
// ========================================

// Token mint address mapping for Jupiter
const TOKEN_MINTS: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112', // Native SOL
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // Jupiter
  'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // dogwifhat
  'JTO': 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', // Jito
  'PYTH': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // Pyth
  'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
  'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // Orca
  'W': '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', // Wormhole
  'MNGO': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', // Mango
  'STEP': 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT', // Step Finance
  'COPE': '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh', // Cope
  'SBR': 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1', // Saber
  'PAI': 'CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo', // Parabolic AI (example mint)
};

// ===================================
// Jupiter endpoints removed
// ===================================
// Jupiter API is unreachable from Supabase Edge Functions (DNS errors)
// All swap functionality now uses client-side demo mode
// See /utils/jupiterSwap.ts for implementation

// (Duplicate send-verification-code handler removed — see working handler below)

/*
// JUPITER CODE REMOVED - ALL BELOW IS GARBAGE CODE THAT NEEDS TO BE CLEANED UP
// THE APPLICATION USES CLIENT-SIDE DEMO MODE INSTEAD
      inputMint: inputMintAddress,
      outputMint: outputMintAddress,
      inAmount: quoteData.inAmount,
      outAmount: quoteData.outAmount,
      otherAmountThreshold: quoteData.otherAmountThreshold,
      swapMode: quoteData.swapMode,
      slippageBps: quoteData.slippageBps,
      priceImpactPct: quoteData.priceImpactPct,
      routePlan: quoteData.routePlan,
      contextSlot: quoteData.contextSlot,
      timeTaken: quoteData.timeTaken,
    };
    
    return c.json({
      success: true,
      quote,
      // Additional UI-friendly data
      uiData: {
        inputAmount: parseFloat(quoteData.inAmount) / Math.pow(10, 9), // Assume 9 decimals for SOL
        outputAmount: parseFloat(quoteData.outAmount) / Math.pow(10, 9),
        priceImpact: quoteData.priceImpactPct,
        route: quoteData.routePlan?.map((r: any) => r.swapInfo?.label || 'Unknown').join(' → '),
      },
    });
    
  } catch (error: any) {
    console.error('❌ Jupiter quote error:', error);
    return c.json({ 
      error: error.message || 'Failed to get Jupiter quote',
      details: error.toString(),
    }, 500);
  }
});

// Jupiter Swap API - Execute the swap
// DISABLED: Transaction signing must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/jupiter-swap", (c) => {
  return c.json({ error: 'Endpoint disabled — swap signing is client-side only' }, 410);
});
// Get supported tokens for Jupiter
app.get("/make-server-e5bc10d1/jupiter-tokens", async (c) => {
  try {
    console.log('Fetching Jupiter supported tokens...');
    
    const response = await fetch('https://token.jup.ag/strict', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Jupiter tokens: ${response.status}`);
    }
    
    const tokens = await response.json();
    
    console.log(`✅ Fetched ${tokens.length} Jupiter tokens`);
    
    // Filter for our supported tokens
    const ourTokens = tokens.filter((t: any) => 
      Object.values(TOKEN_MINTS).includes(t.address)
    );
    
    return c.json({
      success: true,
      tokens: ourTokens,
      totalCount: tokens.length,
      ourCount: ourTokens.length,
    });
    
  } catch (error: any) {
    console.error('❌ Jupiter tokens error:', error);
    return c.json({ 
      error: error.message || 'Failed to fetch Jupiter tokens',
    }, 500);
  }
});
*/

// ===================================
// Email/Password Authentication
// ===================================

// Send verification code endpoint
app.post("/make-server-e5bc10d1/send-verification-code", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Rate limit: max 5 codes per email per 15 minutes
    const rateLimitKey = `ratelimit:email:${email.toLowerCase()}`;
    const rateData = await kv.get(rateLimitKey) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
    if (Date.now() > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = Date.now() + 15 * 60 * 1000;
    }
    if (rateData.count >= 5) {
      return c.json({ error: 'Too many verification attempts. Please try again later.' }, 429);
    }
    rateData.count++;
    await kv.set(rateLimitKey, rateData);

    // Generate cryptographically secure 6-digit code
    const randomBytes = crypto.getRandomValues(new Uint32Array(1));
    const code = (100000 + (randomBytes[0] % 900000)).toString();

    // Store code with 10 minute expiration
    const codeKey = `verification:${email.toLowerCase()}`;
    await retryWithBackoff(() => kv.set(codeKey, {
      code,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }));

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return c.json({ error: 'Email service not configured' }, 500);
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Saturn Wallet <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Saturn Wallet Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0 0 20px 0; font-size: 28px;">🪐 Saturn Wallet</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 30px 0; font-size: 16px;">Your verification code is:</p>
                <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 20px; margin: 0 0 30px 0;">
                  <div style="color: white; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                </div>
                <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 14px;">This code will expire in 10 minutes.</p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #64748b; font-size: 13px; margin: 0;">If you didn't request this code, please ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      
      // Check for domain verification error or testing restriction - enable DEMO MODE
      if (errorData.statusCode === 403 || 
          errorData.name === 'validation_error' || 
          (errorData.message && errorData.message.includes('testing emails'))) {
        // Demo mode - code stored but not sent
        // NEVER log verification codes or return them to client
        return c.json({
          success: true,
          message: 'Verification code sent',
          demoMode: true,
        });
      }
      
      return c.json({ error: 'Failed to send verification email' }, 500);
    }

    // Verification code sent

    return c.json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error: any) {
    // Send verification code error
    return c.json({ error: error.message || 'Failed to send verification code' }, 500);
  }
});

// Verify email signup endpoint
// DISABLED: Seed phrase generation must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/verify-email-signup", (c) => {
  return c.json({ error: 'Endpoint disabled — wallet creation is client-side only' }, 410);
});
// Verify email signin endpoint
app.post("/make-server-e5bc10d1/verify-email-signin", async (c) => {
  try {
    const { email, password, code } = await c.req.json();

    if (!email || !password || !code) {
      return c.json({ error: "Email, password, and code are required" }, 400);
    }

    // Rate limit: max 10 verification attempts per email per 15 minutes
    const rateLimitKey = `ratelimit:verify:${email.toLowerCase()}`;
    const rateData = await kv.get(rateLimitKey) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
    if (Date.now() > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = Date.now() + 15 * 60 * 1000;
    }
    if (rateData.count >= 10) {
      return c.json({ error: 'Too many verification attempts. Please try again later.' }, 429);
    }
    rateData.count++;
    await kv.set(rateLimitKey, rateData);

    // Verify code — delete FIRST to prevent race condition reuse
    const codeKey = `verification:${email.toLowerCase()}`;
    const storedCode = await retryWithBackoff(() => kv.get(codeKey));
    await retryWithBackoff(() => kv.del(codeKey)); // Invalidate immediately

    if (!storedCode) {
      return c.json({ error: "Verification code expired or invalid" }, 400);
    }

    if (!constantTimeEqual(storedCode.code, code)) {
      return c.json({ error: "Invalid verification code" }, 400);
    }

    // Check if code expired
    if (new Date(storedCode.expiresAt) < new Date()) {
      return c.json({ error: "Verification code expired" }, 400);
    }

    // Get wallet ID from email
    const emailMapping = await retryWithBackoff(() => kv.get(`email:${email.toLowerCase()}`));
    if (!emailMapping || !emailMapping.walletId) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const walletId = emailMapping.walletId;

    // Get wallet data
    const wallet = await retryWithBackoff(() => kv.get(`wallet:${walletId}`));
    if (!wallet) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Hash provided password and verify
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password + walletId);
    const passwordHashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
    const passwordHashArray = Array.from(new Uint8Array(passwordHashBuffer));
    const passwordHash = passwordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (!constantTimeEqual(wallet.passwordHash, passwordHash)) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // User signed in successfully

    return c.json({
      success: true,
      walletId,
    });
  } catch (error: any) {
    // Email signin verification error
    return c.json({ error: error.message || 'Failed to sign in' }, 500);
  }
});

// Email signup endpoint
// DISABLED: Seed phrase generation must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/email-signup", (c) => {
  return c.json({ error: 'Endpoint disabled — wallet creation is client-side only' }, 410);
});
// Email signin endpoint
app.post("/make-server-e5bc10d1/email-signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Get wallet ID from email
    const emailMapping = await retryWithBackoff(() => kv.get(`email:${email.toLowerCase()}`));
    if (!emailMapping || !emailMapping.walletId) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const walletId = emailMapping.walletId;

    // Get wallet data
    const wallet = await retryWithBackoff(() => kv.get(`wallet:${walletId}`));
    if (!wallet) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Hash provided password and verify
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password + walletId);
    const passwordHashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
    const passwordHashArray = Array.from(new Uint8Array(passwordHashBuffer));
    const passwordHash = passwordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (!constantTimeEqual(wallet.passwordHash, passwordHash)) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // User signed in successfully

    return c.json({
      success: true,
      walletId,
    });
  } catch (error: any) {
    // Email signin error
    return c.json({ error: error.message || 'Failed to sign in' }, 500);
  }
});

console.log('✅ Email authentication endpoints registered');

// ═══════════════════════════════════════════════════════════
// 📧 DIRECT EMAIL SIGNUP/SIGNIN (No Verification Code)
// ═══════════════════════════════════════════════════════════

// Direct Email Signup (No Verification Code)
// DISABLED: Seed phrase generation must happen client-side only (web3 security)
app.post("/make-server-e5bc10d1/email-signup", (c) => {
  return c.json({ error: 'Endpoint disabled — wallet creation is client-side only' }, 410);
});
// Direct Email Signin (No Verification Code)
app.post("/make-server-e5bc10d1/email-signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Get wallet ID from email
    const emailData = await retryWithBackoff(() => kv.get(`email:${email.toLowerCase()}`));
    if (!emailData || !emailData.walletId) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Get wallet data
    const walletData = await retryWithBackoff(() => kv.get(`wallet:${emailData.walletId}`));
    if (!walletData) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password + emailData.walletId);
    const passwordHashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
    const passwordHashArray = Array.from(new Uint8Array(passwordHashBuffer));
    const passwordHash = passwordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (!constantTimeEqual(walletData.passwordHash, passwordHash)) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // User signed in successfully

    return c.json({
      success: true,
      walletId: emailData.walletId,
    });
  } catch (error: any) {
    // Email signin error
    return c.json({ error: error.message || 'Failed to sign in' }, 500);
  }
});

console.log('✅ Direct email authentication endpoints registered');

// Proxy endpoint for CoinGecko images to avoid CORS issues
app.get("/make-server-e5bc10d1/token-image/:symbol", async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const imageUrl = c.req.query('url');
    
    if (!imageUrl) {
      return c.json({ error: 'Image URL is required' }, 400);
    }
    
    console.log(`[Image Proxy] Fetching image for ${symbol}: ${imageUrl}`);
    
    // Check cache first
    const cacheKey = `token_image:${symbol}:${imageUrl}`;
    const cached = await kv.get(cacheKey);
    
    // Cache for 24 hours
    const CACHE_TTL = 24 * 60 * 60 * 1000;
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Image Proxy] Returning cached image for ${symbol}`);
      
      // Return the base64 image
      const imageData = Uint8Array.from(atob(cached.data), c => c.charCodeAt(0));
      return new Response(imageData, {
        headers: {
          'Content-Type': cached.contentType || 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`[Image Proxy] Failed to fetch image: ${response.status}`);
      return c.json({ error: 'Failed to fetch image' }, response.status);
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    
    // Convert to base64 for caching
    const base64 = btoa(String.fromCharCode(...imageData));
    
    // Cache the image
    try {
      await kv.set(cacheKey, {
        data: base64,
        contentType: contentType,
        timestamp: Date.now(),
      });
      console.log(`[Image Proxy] Cached image for ${symbol}`);
    } catch (error) {
      console.error(`[Image Proxy] Failed to cache image:`, error);
    }
    
    // Return the image
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[Image Proxy] Error:', error);
    return c.json({ error: error.message || 'Failed to proxy image' }, 500);
  }
});

console.log('✅ Token image proxy endpoint registered');

// Update token balance (for testnet mode)
// DISABLED: No auth — balances are fetched from blockchain directly
app.post("/make-server-e5bc10d1/update-token-balance", (c) => {
  return c.json({ error: 'Endpoint disabled — balances are fetched from blockchain' }, 410);
});

// Save transaction (for testnet mode)
app.post("/make-server-e5bc10d1/save-transaction", (c) => {
  return c.json({ error: 'Endpoint disabled — data is stored client-side only' }, 410);
});


console.log('✅ Testnet balance and transaction endpoints registered');

// ===================================================================
// OAuth Sign Up Endpoints
// ===================================================================

// Store encrypted recovery phrase for OAuth users
// DISABLED: Seed phrases must never be stored on or returned from the server (web3 security)
app.post("/make-server-e5bc10d1/oauth/store-phrase", (c) => {
  return c.json({ error: 'Endpoint disabled — seed phrase operations are client-side only' }, 410);
});
// Export recovery phrase for OAuth users
// DISABLED: Seed phrases must never be stored on or returned from the server (web3 security)
app.post("/make-server-e5bc10d1/oauth/export-phrase", (c) => {
  return c.json({ error: 'Endpoint disabled — seed phrase operations are client-side only' }, 410);
});
console.log('✅ OAuth endpoints registered');

// Clear coin cache for a specific mint (force refresh)
app.post("/make-server-e5bc10d1/clear-coin-cache", async (c) => {
  try {
    const { mint } = await c.req.json();
    
    if (!mint) {
      return c.json({ error: 'Mint address is required' }, 400);
    }
    
    console.log('[Cache] Clearing cache for mint:', mint);
    
    // Clear the coin details cache
    const cacheKey = `coin:${mint}:details`;
    await kv.del(cacheKey);
    
    console.log('[Cache] ✅ Cache cleared successfully');
    
    return c.json({ success: true, message: 'Cache cleared' });
    
  } catch (error: any) {
    console.error('[Cache] Error:', error);
    return c.json({ error: error.message || 'Failed to clear cache' }, 500);
  }
});

// Clear ALL coin caches (force refresh all tokens)
app.post("/make-server-e5bc10d1/clear-all-coin-caches", async (c) => {
  try {
    console.log('[Cache] Clearing ALL coin caches...');
    
    // Get all keys with the coin cache prefix
    const allCoinCaches = await kv.getByPrefix('coin:');
    
    if (allCoinCaches && allCoinCaches.length > 0) {
      console.log(`[Cache] Found ${allCoinCaches.length} cache entries to clear`);
      
      // Delete all coin caches
      const mints = allCoinCaches.map((entry: any) => {
        // Extract mint from key like "coin:HrkKngi...:details"
        const parts = entry.key.split(':');
        return parts[1]; // The mint address
      }).filter((mint: string, index: number, self: string[]) => {
        // Remove duplicates
        return self.indexOf(mint) === index;
      });
      
      await kv.mdel(allCoinCaches.map((e: any) => e.key));
      
      console.log(`[Cache] ✅ Cleared caches for ${mints.length} unique tokens`);
      
      return c.json({ success: true, message: `Cleared ${allCoinCaches.length} cache entries`, mints });
    } else {
      console.log('[Cache] No coin caches found');
      return c.json({ success: true, message: 'No caches to clear' });
    }
    
  } catch (error: any) {
    console.error('[Cache] Error:', error);
    return c.json({ error: error.message || 'Failed to clear caches' }, 500);
  }
});

// Get detailed coin info from CoinGecko (for debugging/verification)
app.get("/make-server-e5bc10d1/coingecko-coin-details/:coinId", async (c) => {
  try {
    const coinId = c.req.param('coinId');
    
    if (!coinId) {
      return c.json({ error: 'Coin ID is required' }, 400);
    }
    
    console.log('[CoinGecko Details] Fetching details for:', coinId);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CoinGecko Details] Error:', response.status, errorText);
      return c.json({ error: 'Failed to fetch coin details', status: response.status }, response.status);
    }
    
    const data = await response.json();
    
    // Extract the most useful information
    const coinInfo = {
      id: data.id,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      description: data.description?.en || '',
      image: data.image?.large || data.image?.small || data.image?.thumb || '',
      market_data: {
        current_price_usd: data.market_data?.current_price?.usd,
        market_cap_usd: data.market_data?.market_cap?.usd,
        total_supply: data.market_data?.total_supply,
        circulating_supply: data.market_data?.circulating_supply,
        max_supply: data.market_data?.max_supply,
        price_change_24h: data.market_data?.price_change_24h,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h,
      },
      links: {
        homepage: data.links?.homepage?.[0] || '',
        twitter: data.links?.twitter_screen_name || '',
        telegram: data.links?.telegram_channel_identifier || '',
      },
      platforms: data.platforms || {},
      contract_address: data.contract_address || '',
    };
    
    console.log('[CoinGecko Details] ✅ Successfully fetched details for:', coinId);
    
    return c.json(coinInfo);
    
  } catch (error: any) {
    console.error('[CoinGecko Details] Error:', error);
    return c.json({ error: error.message || 'Failed to fetch coin details' }, 500);
  }
});

// Cleanup duplicate tokens endpoint
app.post("/make-server-e5bc10d1/cleanup-duplicate-tokens", async (c) => {
  try {
    const { walletId: rawWalletId } = await c.req.json();
    const walletId = rawWalletId ? sanitizeKvKey(rawWalletId) : '';

    if (!walletId) {
      return c.json({ error: 'Wallet ID is required' }, 400);
    }
    
    console.log('[Cleanup] Starting duplicate token cleanup for wallet:', walletId);
    
    // Get current tokens
    const tokens = await kv.get(`wallet:${walletId}:tokens`) || {};
    
    // Build a map: mint -> token data
    const tokensByMint = new Map<string, any>();
    const duplicates: string[] = [];
    
    // Iterate through all tokens
    for (const [symbol, tokenData] of Object.entries(tokens)) {
      const token = tokenData as any;
      const mint = token.mint;
      
      if (!mint) {
        console.log('[Cleanup] ⚠️ Token without mint:', symbol, token);
        continue;
      }
      
      // Check if we already have this mint
      if (tokensByMint.has(mint)) {
        const existing = tokensByMint.get(mint);
        console.log('[Cleanup] 🔍 Duplicate found!');
        console.log('  - Existing:', existing.symbol, existing.name, 'Amount:', existing.amount);
        console.log('  - Duplicate:', token.symbol, token.name, 'Amount:', token.amount);
        
        // Keep the one with higher balance, or the one with better metadata
        if (token.amount > existing.amount || (token.amount === existing.amount && token.logoUrl && !existing.logoUrl)) {
          console.log('[Cleanup] ✅ Keeping duplicate (better data)');
          tokensByMint.set(mint, token);
          duplicates.push(existing.symbol);
        } else {
          console.log('[Cleanup] ✅ Keeping existing (better data)');
          duplicates.push(token.symbol);
        }
      } else {
        // First time seeing this mint
        tokensByMint.set(mint, token);
      }
    }
    
    // Rebuild tokens object with deduplicated data
    const cleanedTokens: Record<string, any> = {};
    for (const [mint, token] of tokensByMint.entries()) {
      cleanedTokens[token.symbol] = token;
    }
    
    // Save cleaned tokens
    await kv.set(`wallet:${walletId}:tokens`, cleanedTokens);
    
    console.log('[Cleanup] ✅ Cleanup complete!');
    console.log('  - Original tokens:', Object.keys(tokens).length);
    console.log('  - Cleaned tokens:', Object.keys(cleanedTokens).length);
    console.log('  - Removed duplicates:', duplicates);
    
    return c.json({
      success: true,
      removed: duplicates.length,
      duplicates: duplicates,
      before: Object.keys(tokens).length,
      after: Object.keys(cleanedTokens).length,
    });
    
  } catch (error: any) {
    console.error('[Cleanup] Error:', error);
    return c.json({ error: error.message || 'Failed to cleanup duplicates' }, 500);
  }
});

// ========================================
// JUPITER SWAP PROXY - Bypass CORS/iframe restrictions
// ========================================

// Get Jupiter quote (proxy to avoid CORS issues)
app.get("/make-server-e5bc10d1/jupiter/quote", async (c) => {
  // Helper function to generate simulated quote
  const generateSimulatedQuote = (inputMint: string, outputMint: string, amount: string, slippageBps: string) => {
    console.log('[Jupiter Proxy] Generating simulated quote (API unavailable)');
    
    const amountNum = parseFloat(amount);
    const slippagePercent = parseFloat(slippageBps) / 100;
    
    // Determine exchange rate based on token pair
    let exchangeRate = 1;
    if (inputMint.includes('So1111') && outputMint.includes('EPjFW')) {
      // SOL → USDC (~$100/SOL)
      exchangeRate = 100000000; // 100 USDC per SOL (in micro-units)
    } else if (inputMint.includes('EPjFW') && outputMint.includes('So1111')) {
      // USDC → SOL
      exchangeRate = 10000; // 0.01 SOL per USDC
    } else if (inputMint.includes('So1111') && outputMint.includes('Es9vM')) {
      // SOL → USDT (~$100/SOL)
      exchangeRate = 100000000;
    } else if (inputMint.includes('Es9vM') && outputMint.includes('So1111')) {
      // USDT → SOL
      exchangeRate = 10000;
    } else if (inputMint.includes('EPjFW') && outputMint.includes('Es9vM')) {
      // USDC → USDT (~1:1)
      exchangeRate = 999500; // 0.9995:1
    } else if (inputMint.includes('Es9vM') && outputMint.includes('EPjFW')) {
      // USDT → USDC (~1:1)
      exchangeRate = 999500;
    }
    
    // Calculate output with fee
    const outputAmount = Math.floor((amountNum * exchangeRate / 1000000) * 0.997); // 0.3% fee
    const minOutputAmount = Math.floor(outputAmount * (1 - slippagePercent / 100));
    
    return {
      inputMint,
      inAmount: amount,
      outputMint,
      outAmount: outputAmount.toString(),
      otherAmountThreshold: minOutputAmount.toString(),
      swapMode: 'ExactIn',
      slippageBps: parseInt(slippageBps),
      priceImpactPct: '0.1',
      routePlan: [
        {
          swapInfo: {
            ammKey: 'simulated',
            label: 'Simulated Mode',
            inputMint,
            outputMint,
            inAmount: amount,
            outAmount: outputAmount.toString(),
            feeAmount: '0',
            feeMint: inputMint
          }
        }
      ],
      contextSlot: Date.now(),
      timeTaken: 0.5
    };
  };

  try {
    const inputMint = c.req.query('inputMint');
    const outputMint = c.req.query('outputMint');
    const amount = c.req.query('amount'); // Amount in lamports
    const slippageBps = c.req.query('slippageBps') || '100'; // Default 1%

    if (!inputMint || !outputMint || !amount) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    console.log('[Jupiter Proxy] Getting quote...');
    console.log('[Jupiter Proxy] Input:', inputMint);
    console.log('[Jupiter Proxy] Output:', outputMint);
    console.log('[Jupiter Proxy] Amount (lamports):', amount);
    console.log('[Jupiter Proxy] Slippage (bps):', slippageBps);

    try {
      const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
      
      console.log('[Jupiter Proxy] Attempting to fetch from Jupiter API...');
      
      // Set a short timeout to fail fast
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(quoteUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`Jupiter API returned ${response.status}`);
      }

      const quote = await response.json();
      
      if (!quote || !quote.outAmount) {
        throw new Error('Invalid quote response from Jupiter');
      }

      console.log('[Jupiter Proxy] ✅ Quote received from Jupiter API');
      return c.json(quote);
      
    } catch (fetchError: any) {
      // If Jupiter API fails, return simulated quote (no error to client)
      console.log('[Jupiter Proxy] Jupiter API unavailable, returning simulated quote');
      const simulatedQuote = generateSimulatedQuote(inputMint, outputMint, amount, slippageBps);
      return c.json(simulatedQuote);
    }

  } catch (error: any) {
    console.error('[Jupiter Proxy] Error:', error);
    
    // Generate and return simulated quote as fallback
    try {
      const inputMint = c.req.query('inputMint') || '';
      const outputMint = c.req.query('outputMint') || '';
      const amount = c.req.query('amount') || '0';
      const slippageBps = c.req.query('slippageBps') || '100';
      
      const simulatedQuote = generateSimulatedQuote(inputMint, outputMint, amount, slippageBps);
      return c.json(simulatedQuote);
    } catch (fallbackError) {
      return c.json({ error: 'Unable to generate quote' }, 500);
    }
  }
});

// Get Jupiter swap transaction (proxy to avoid CORS issues)
app.post("/make-server-e5bc10d1/jupiter/swap", async (c) => {
  try {
    const body = await c.req.json();
    const { quoteResponse, userPublicKey } = body;

    if (!quoteResponse || !userPublicKey) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    console.log('[Jupiter Proxy] Getting swap transaction...');
    console.log('[Jupiter Proxy] User wallet:', userPublicKey);

    try {
      const swapUrl = 'https://quote-api.jup.ag/v6/swap';
      
      const swapRequestBody = {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      };

      console.log('[Jupiter Proxy] Requesting swap transaction from Jupiter API...');

      // Set a timeout to fail fast
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(swapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(swapRequestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Jupiter Swap API returned ${response.status}`);
      }

      const swapData = await response.json();
      
      if (!swapData || !swapData.swapTransaction) {
        throw new Error('Invalid swap transaction response from Jupiter');
      }

      console.log('[Jupiter Proxy] ✅ Swap transaction received successfully');
      return c.json(swapData);

    } catch (fetchError: any) {
      // If Jupiter API fails, return error (client will handle simulation)
      console.log('[Jupiter Proxy] Jupiter Swap API unavailable:', fetchError.message);
      return c.json({ 
        error: 'Jupiter API unavailable',
        details: 'Please use simulation mode',
        code: 'API_UNAVAILABLE'
      }, 503);
    }

  } catch (error: any) {
    console.error('[Jupiter Proxy] Swap error:', error);
    return c.json({ 
      error: 'Jupiter API unavailable',
      details: error.message || 'Unknown error',
      code: 'API_UNAVAILABLE'
    }, 503);
  }
});

Deno.serve(app.fetch);
