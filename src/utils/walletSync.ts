import { createSupabaseClient } from './supabase/client';

const TABLE = 'wallet_backups';
const PBKDF2_ITERATIONS = 600000;

/**
 * Encrypt mnemonic using the Supabase user.id as the key.
 * This allows any device with a valid Google/Apple auth session to decrypt.
 * The user.id is a UUID that's only available after successful OAuth — it's
 * not guessable and not stored alongside the encrypted data.
 */
async function encryptForSync(mnemonic: string, userId: string): Promise<object> {
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(userId), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    version: 2,
  };
}

/**
 * Decrypt mnemonic using the Supabase user.id as the key.
 */
async function decryptForSync(encryptedData: { encrypted: string; salt: string; iv: string }, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const encryptedArray = new Uint8Array(atob(encryptedData.encrypted).split('').map(c => c.charCodeAt(0)));
  const salt = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)));
  const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(userId), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedArray);
  return decoder.decode(new Uint8Array(decrypted));
}

/**
 * Upload the wallet mnemonic to Supabase for cross-device sync.
 * Encrypts the plaintext mnemonic with the user's auth ID before uploading.
 * The server never sees the plaintext mnemonic or any user-chosen password.
 */
export async function uploadWalletBackup(walletId: string, mnemonic: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[walletSync] No authenticated user, skipping upload');
    return;
  }

  const encryptedData = await encryptForSync(mnemonic, user.id);

  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: user.id,
        wallet_id: walletId,
        encrypted_data: encryptedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,wallet_id' }
    );

  if (error) {
    console.error('[walletSync] Upload failed:', error.message);
    throw error;
  }

  console.log('[walletSync] Wallet backup uploaded successfully');
}

/**
 * Download wallet backup for the current authenticated user.
 * Looks up by user_id (not wallet_id) so it works on a new device
 * where we don't know the wallet_id yet.
 * Returns { walletId, mnemonic } or null if no backup exists.
 */
export async function downloadWalletBackup(): Promise<{ walletId: string; mnemonic: string } | null> {
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[walletSync] No authenticated user, skipping download');
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('wallet_id, encrypted_data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.log('[walletSync] No backup found for user');
    return null;
  }

  try {
    const mnemonic = await decryptForSync(data.encrypted_data, user.id);
    return { walletId: data.wallet_id, mnemonic };
  } catch (err) {
    console.error('[walletSync] Failed to decrypt backup:', err);
    return null;
  }
}

/**
 * Delete wallet backup from Supabase.
 */
export async function deleteWalletBackup(walletId: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', user.id)
    .eq('wallet_id', walletId);

  if (error) {
    console.error('[walletSync] Delete failed:', error.message);
  }
}
