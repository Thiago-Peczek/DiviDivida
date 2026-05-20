import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function limparValorEnv(valor?: string) {
  if (!valor) return '';
  return valor.replace(/^\uFEFF/, '').trim();
}

const SUPABASE_URL = limparValorEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
const SUPABASE_PUBLIC_KEY = limparValorEnv(
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
  throw new Error(
    'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou EXPO_PUBLIC_SUPABASE_ANON_KEY) no .env.',
  );
}

const AdaptadorStorage = {
  getItem: (chave: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return Promise.resolve(window.localStorage.getItem(chave));
    }

    if (Platform.OS === 'web') {
      return Promise.resolve(null);
    }

    return SecureStore.getItemAsync(chave);
  },
  setItem: (chave: string, valor: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(chave, valor);
      return Promise.resolve();
    }

    if (Platform.OS === 'web') {
      return Promise.resolve();
    }

    return SecureStore.setItemAsync(chave, valor);
  },
  removeItem: (chave: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(chave);
      return Promise.resolve();
    }

    if (Platform.OS === 'web') {
      return Promise.resolve();
    }

    return SecureStore.deleteItemAsync(chave);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    storage: AdaptadorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
