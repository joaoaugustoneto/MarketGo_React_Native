import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!rawUrl || !rawKey) {
  throw new Error(
    'Variáveis do Supabase ausentes. Confira o .env e reinicie com: npx expo start -c',
  );
}

// Higienização defensiva: remove espaços, corrige eventuais "hhttps://" e remove sufixos acidentais como "/rest/v1"
const url = rawUrl
  .trim()
  .replace(/^h+ttps?:\/\//i, (m) => (m.toLowerCase().includes('http:') ? 'http://' : 'https://'))
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const key = rawKey.trim();

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renova o token só enquanto o app está em primeiro plano.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
