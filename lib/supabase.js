import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton pattern — prevents multiple instances competing for the auth lock
// Required for Next.js with React Strict Mode
let supabaseInstance = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  });
  return supabaseInstance;
}

export const supabase = getSupabase();
