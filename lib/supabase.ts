import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ──────────────────────────────────────────────────────────
// PARA QUEM FOR TESTAR: IMPORTANTE!
// Credenciais carregadas do .env via prefixo EXPO_PUBLIC_ do Expo.
// Crie um arquivo .env na raiz do projeto com:
//   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
// ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const AdaptadorSecureStore = {
  getItem: (chave: string) => SecureStore.getItemAsync(chave),
  setItem: (chave: string, valor: string) => SecureStore.setItemAsync(chave, valor),
  removeItem: (chave: string) => SecureStore.deleteItemAsync(chave),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AdaptadorSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
