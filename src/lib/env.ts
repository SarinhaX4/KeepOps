/**
 * Public runtime config. Expo inlines EXPO_PUBLIC_* variables at build time,
 * so they must be read with the full `process.env.NAME` expression.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Configuração ausente: crie o arquivo .env.local (veja .env.example) e reinicie com `npx expo start -c`.',
  );
}

export const env = { supabaseUrl, supabaseKey } as const;
