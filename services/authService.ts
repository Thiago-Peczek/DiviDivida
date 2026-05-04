import { supabase } from '@/lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export async function cadastrar(email: string, senha: string) {
  const { data, error } = await supabase.auth.signUp({ email, password: senha });
  if (error) throw error;
  return data;
}

export async function entrar(email: string, senha: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw error;
  return data;
}

export async function sair() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function obterSessao() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function aoMudarEstadoAuth(
  callback: (evento: AuthChangeEvent, sessao: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}
