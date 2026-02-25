import { createClient } from "@supabase/supabase-js";
import env from "./env";

const supabaseUrl = env.supabaseUrl ?? "https://example.supabase.co";
const supabaseAnonKey = env.supabaseAnonKey ?? "public-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
