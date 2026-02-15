/**
 * Initialize Environment Variables
 * Sets up API keys from Supabase environment in the browser
 */

// Declare global type
declare global {
  interface Window {
    ENV?: {
      HELIUS_API_KEY?: string;
      ALCHEMY_API_KEY?: string;
    };
    ENV_INITIALIZED?: boolean;
    ENV_ERROR?: string;
  }
}

// Timeout for fetch requests (10 seconds)
const FETCH_TIMEOUT = 10000;

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Initialize environment variables from backend
 */
export async function initializeEnvironment(): Promise<void> {
  // Skip if already initialized
  if (window.ENV_INITIALIZED) {
    console.log('[ENV] Already initialized, skipping...');
    return;
  }

  // API keys are no longer fetched from the server (security: keys must not be sent to clients).
  // The app works with public/fallback RPC endpoints.
  window.ENV = {};
  window.ENV_INITIALIZED = true;
  console.log('[ENV] ✅ Environment initialized (using public RPC endpoints)');
}

/**
 * Check if environment is ready (initialized, even if with errors)
 */
export function isEnvironmentReady(): boolean {
  return window.ENV_INITIALIZED === true;
}

/**
 * Get environment error if any
 */
export function getEnvironmentError(): string | undefined {
  return window.ENV_ERROR;
}
