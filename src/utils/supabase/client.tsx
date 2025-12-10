import { projectId, publicAnonKey } from './info';
import { createClient } from '@supabase/supabase-js';

// Create a singleton Supabase client for the browser
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const createSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = `https://${projectId}.supabase.co`;
  
  supabaseClient = createClient(supabaseUrl, publicAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  return supabaseClient;
};