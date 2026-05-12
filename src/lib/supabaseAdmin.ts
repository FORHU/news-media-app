import { createClient } from '@supabase/supabase-js';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      // During build, we don't want to throw. We only throw if it's actually used and still missing.
      if (process.env.NEXT_PHASE === "phase-production-build") {
        return null as any;
      }
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

// Keep the export for backward compatibility, but it will be a getter
export const supabaseAdmin = (function() {
  return new Proxy({}, {
    get(_, prop) {
      const instance = getSupabaseAdmin();
      return (instance as any)[prop];
    }
  }) as ReturnType<typeof createClient>;
})();
