/**
 * Utility for managing custom tokens added by users
 */

export interface CustomToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  mint?: string;
  network?: string;
}

const STORAGE_KEY = 'saturn_custom_tokens';

/**
 * Get all custom tokens from localStorage
 */
export function getCustomTokens(): CustomToken[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading custom tokens:', error);
    return [];
  }
}

/**
 * Add a custom token
 */
export function addCustomToken(token: CustomToken): boolean {
  try {
    const tokens = getCustomTokens();
    
    // Check if already exists
    const exists = tokens.some(t => 
      t.id === token.id || 
      (t.symbol.toLowerCase() === token.symbol.toLowerCase() && t.name === token.name)
    );
    
    if (exists) {
      console.log('Token already exists:', token.symbol);
      return false;
    }
    
    tokens.push(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    console.log('Custom token added:', token.symbol);
    return true;
  } catch (error) {
    console.error('Error adding custom token:', error);
    return false;
  }
}

/**
 * Remove a custom token
 */
export function removeCustomToken(tokenId: string): boolean {
  try {
    const tokens = getCustomTokens();
    const filtered = tokens.filter(t => t.id !== tokenId);
    
    if (filtered.length === tokens.length) {
      console.log('Token not found:', tokenId);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('Custom token removed:', tokenId);
    return true;
  } catch (error) {
    console.error('Error removing custom token:', error);
    return false;
  }
}

/**
 * Check if a token is already added
 */
export function isTokenAdded(tokenId: string): boolean {
  const tokens = getCustomTokens();
  return tokens.some(t => t.id === tokenId);
}

/**
 * Clear all custom tokens
 */
export function clearCustomTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('All custom tokens cleared');
  } catch (error) {
    console.error('Error clearing custom tokens:', error);
  }
}

/**
 * Remove duplicate PARAI tokens (cleanup function)
 * This removes the old PARAI symbol and keeps only PAI
 */
export function removeDuplicateParabolic(): boolean {
  try {
    const tokens = getCustomTokens();
    const filtered = tokens.filter(t => 
      // Remove any token with symbol PARAI
      t.symbol !== 'PARAI'
    );
    
    if (filtered.length < tokens.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Removed duplicate PARAI token');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing duplicate PARAI:', error);
    return false;
  }
}