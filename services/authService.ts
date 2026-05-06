import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export async function cadastrar(
  nome: string,
  email: string,
  senha: string,
  imagem_url?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  });

  if (error) throw error;

  const user = data.user;

  if (!user) {
    throw new Error("Usuário não foi criado");
  }

  const { error: dbError } = await supabase.from("usuarios").insert({
    id: user.id,
    nome,
    imagem_url: imagem_url || null,
  });

  if (dbError) throw dbError;

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
