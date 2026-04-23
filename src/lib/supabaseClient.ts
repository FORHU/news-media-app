import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient stores auth tokens in cookies instead of localStorage,
// eliminating the stale refresh token issue and aligning with @supabase/ssr.
// All existing imports of `supabase` across the codebase continue to work unchanged.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
