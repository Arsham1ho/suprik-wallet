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

  try {
    console.log('[ENV] 🔧 Initializing environment variables...');

    // Import Supabase info
    const { projectId, publicAnonKey } = await import('./supabase/info');

    // Fetch API keys from server with timeout
    const response = await fetchWithTimeout(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/api-keys`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      },
      FETCH_TIMEOUT
    );

    if (response.ok) {
      const data = await response.json();

      // Set environment variables on window object
      window.ENV = {
        HELIUS_API_KEY: data.heliusKey,
        ALCHEMY_API_KEY: data.alchemyKey,
      };
      window.ENV_INITIALIZED = true;

      console.log('[ENV] ✅ Environment initialized successfully');
      console.log('[ENV] Helius API:', data.heliusKey ? '✓ Available' : '✗ Missing');
      console.log('[ENV] Alchemy API:', data.alchemyKey ? '✓ Available' : '✗ Missing');
    } else {
      console.warn('[ENV] ⚠️ Failed to fetch API keys:', response.status);

      // Set empty environment - app can still work with public RPC
      window.ENV = {};
      window.ENV_INITIALIZED = true;
      window.ENV_ERROR = `Server returned ${response.status}`;
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.warn('[ENV] ⚠️ Error initializing environment:', errorMessage);

    // Set empty environment - app can still work with public RPC
    window.ENV = {};
    window.ENV_INITIALIZED = true;
    window.ENV_ERROR = errorMessage;

    // Don't throw - allow app to continue with fallback RPC
    console.log('[ENV] 📡 App will use fallback public RPC endpoints');
  }
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
