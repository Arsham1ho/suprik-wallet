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
  }
}

/**
 * Initialize environment variables from backend
 */
export async function initializeEnvironment(): Promise<void> {
  try {
    console.log('[ENV] 🔧 Initializing environment variables...');
    
    // Import Supabase info
    const { projectId, publicAnonKey } = await import('./supabase/info');
    
    // Fetch API keys from server
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/api-keys`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // Set environment variables on window object
      window.ENV = {
        HELIUS_API_KEY: data.heliusKey,
        ALCHEMY_API_KEY: data.alchemyKey,
      };
      
      console.log('[ENV] ✅ Environment initialized successfully');
      console.log('[ENV] Helius API:', data.heliusKey ? '✓ Available' : '✗ Missing');
      console.log('[ENV] Alchemy API:', data.alchemyKey ? '✓ Available' : '✗ Missing');
    } else {
      console.error('[ENV] ❌ Failed to fetch API keys:', response.status);
      
      // Set empty environment
      window.ENV = {};
    }
  } catch (error) {
    console.error('[ENV] ❌ Error initializing environment:', error);
    
    // Set empty environment
    window.ENV = {};
  }
}
