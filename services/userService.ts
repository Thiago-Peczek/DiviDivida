import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/database';

export async function criarPerfil(
  id: string,
  nome: string,
  email: string,
  imagemUrl?: string | null,
): Promise<Usuario> {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      id,
      nome,
      email,
      imagem_url: imagemUrl ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Usuario;
}

export async function obterPerfil(id: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = nenhuma linha retornada — perfil ainda nao existe
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Usuario;
}

export async function atualizarPerfil(
  id: string,
  campos: Partial<Pick<Usuario, 'nome' | 'email' | 'imagem_url'>>,
): Promise<Usuario> {
  const { data, error } = await supabase
    .from('usuarios')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Usuario;
}
