import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

const sessionStorage = new Map<string, string>();

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: {
        getItem: async (key) => sessionStorage.get(key) ?? null,
        setItem: async (key, value) => {
          sessionStorage.set(key, value);
        },
        removeItem: async (key) => {
          sessionStorage.delete(key);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
