import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using the service role key.
 * Use ONLY in server-side code (Server Actions, API routes).
 * Never expose this to the client.
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
