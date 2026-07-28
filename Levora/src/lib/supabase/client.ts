// Browser-side Supabase client. Used in client components (login form, user
// menu) for auth calls. Reads the public env vars — never a service key.
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when both public env vars are set. The UI uses this to show a
// friendly "not configured yet" state instead of crashing when the project
// hasn't been wired to a Supabase instance.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function createClient() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
