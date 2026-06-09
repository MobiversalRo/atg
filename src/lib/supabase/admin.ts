import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Service-role Supabase client — bypasses RLS and can use the Auth admin API.
 * SERVER-ONLY: never import this from a Client Component. The key lives in a
 * non-public env var, and every caller must verify the requester is an admin.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
