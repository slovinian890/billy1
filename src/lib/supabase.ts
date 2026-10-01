import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True once real Supabase credentials are present. The app falls back to
 * local mock data (see `src/lib/mock`) everywhere this is false, so it
 * keeps running in Expo Go before `.env` is filled in.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set — " +
      "running on local mock data only. See README.md for setup steps."
  );
}

// AsyncStorage's web shim reads `window.localStorage`, which doesn't exist
// during server-side rendering (Expo Router's web static export runs the
// root layout — and therefore this client — once in Node). Fall back to a
// no-op store there so SSR doesn't crash; real browsers and native always
// have `window`, so they're unaffected.
const isServer = typeof window === "undefined";
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: isServer ? noopStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
