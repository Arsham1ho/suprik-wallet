/**
 * Environment Variables Configuration
 * 
 * Suprik Wallet reads API keys from environment variables
 * In development: from .env.local
 * In production: from Vercel Environment Variables
 */

/**
 * Get Helius API key from environment
 */
export function getHeliusApiKey(): string | undefined {
  // Try Vite env variable first (local development)
  const viteKey = import.meta.env?.VITE_HELIUS_API_KEY;
  if (viteKey) return viteKey;
  
  // Fallback to window.ENV (server-side rendered)
  if (typeof window !== 'undefined') {
    const windowKey = (window as any).ENV?.HELIUS_API_KEY;
    if (windowKey) return windowKey;
  }
  
  // Return undefined silently (no warning needed - it's optional)
  return undefined;
}

/**
 * Get Alchemy API key from environment
 */
export function getAlchemyApiKey(): string | undefined {
  // Try Vite env variable first (local development)
  const viteKey = import.meta.env?.VITE_ALCHEMY_API_KEY;
  if (viteKey) return viteKey;
  
  // Fallback to window.ENV (server-side rendered)
  if (typeof window !== 'undefined') {
    const windowKey = (window as any).ENV?.ALCHEMY_API_KEY;
    if (windowKey) return windowKey;
  }
  
  // Return undefined silently (no warning needed - it's optional)
  return undefined;
}

/**
 * Helper to check if APIs are configured
 */
export function areApiKeysConfigured(): {
  helius: boolean;
  alchemy: boolean;
  allConfigured: boolean;
} {
  const helius = !!getHeliusApiKey();
  const alchemy = !!getAlchemyApiKey();
  
  return {
    helius,
    alchemy,
    allConfigured: helius && alchemy
  };
}