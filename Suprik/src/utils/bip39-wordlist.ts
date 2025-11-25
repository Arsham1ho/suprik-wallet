/**
 * BIP39 Wordlist Loader
 * This module provides a workaround for Vite's subpath import issues
 */

let cachedWordlist: string[] | null = null;

/**
 * Load the English wordlist with fallback
 */
export async function loadWordlist(): Promise<string[]> {
  if (cachedWordlist) {
    return cachedWordlist;
  }

  try {
    // Try to import from @scure/bip39
    const module = await import('@scure/bip39/wordlists/english.js');
    cachedWordlist = module.wordlist;
    console.log('[loadWordlist] ✅ Loaded wordlist from @scure/bip39');
    return cachedWordlist;
  } catch (error) {
    console.warn('[loadWordlist] ⚠️ Failed to load from @scure/bip39, using inline wordlist');
    
    // Fallback to inline wordlist
    const { englishWordlist } = await import('./wordlist');
    cachedWordlist = englishWordlist as unknown as string[];
    return cachedWordlist;
  }
}

/**
 * Get wordlist synchronously (must be loaded first)
 */
export function getWordlist(): string[] {
  if (!cachedWordlist) {
    throw new Error('Wordlist not loaded. Call loadWordlist() first.');
  }
  return cachedWordlist;
}
