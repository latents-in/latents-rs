import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Warn if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env files.');
}

// Create a single supabase client for interacting with your database
// Using PKCE flow to prevent Gmail link pre-scanning from invalidating magic links.
// With implicit flow, Gmail's security scanner clicks the link and consumes the
// single-use token before the user sees it. PKCE uses a code instead, so scanning
// the link doesn't invalidate it.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            flowType: 'pkce',
        }
    }
);
