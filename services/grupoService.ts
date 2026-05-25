import { supabase } from "@/lib/supabase";
import type { Grupo } from "@/types/database";

export async function criarGrupo(
  nome: string,
  criadorId: string,
  latitude?: number | null,
  longitude?: number | null,
  encontroNome?: string | null,
  imagemGrupoUrl?: string | null,
): Promise<Grupo> {
  const { data: grupo, error: erroGrupo } = await supabase
    .from("grupos")
    .insert({
      nome,
      criado_por_usuario_id: criadorId,
      encontro_latitude: latitude ?? null,
      encontro_longitude: longitude ?? null,
      encontro_nome: encontroNome ?? null,
      imagem_grupo_url: imagemGrupoUrl ?? null,
    })
    .select()
    .single();

  if (erroGrupo) throw erroGrupo;

  const { error: erroMembro } = await supabase
    .from("membros_grupo")
    .insert({ grupo_id: (grupo as Grupo).id, usuario_id: criadorId });

  if (erroMembro) throw erroMembro;
  return grupo as Grupo;
}

export async function listarMeusGrupos(usuarioId: string): Promise<Grupo[]> {
  const { data: membros, error: erroMembros } = await supabase
    .from("membros_grupo")
    .select("grupo_id")
    .eq("usuario_id", usuarioId);

  if (erroMembros) throw erroMembros;
  if (!membros || membros.length === 0) return [];

  const grupoIds = membros.map((m) => m.grupo_id);

  const { data, error } = await supabase
    .from("grupos")
    .select("*")
    .in("id", grupoIds)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Grupo[];
}

export async function obterGrupo(grupoId: string): Promise<Grupo> {
  const { data, error } = await supabase
    .from("grupos")
    .select("*")
    .eq("id", grupoId)
    .single();

  if (error) throw error;
  return data as Grupo;
}

export async function atualizarGrupo(
  grupoId: string,
  campos: Partial<
    Pick<
      Grupo,
      "nome" | "imagem_grupo_url" | "encontro_latitude" | "encontro_longitude"
    >
  >,
): Promise<Grupo> {
  const { data, error } = await supabase
    .from("grupos")
    .update(campos)
    .eq("id", grupoId)
    .select()
    .single();

  if (error) throw error;
  return data as Grupo;
}

export async function excluirGrupo(grupoId: string): Promise<void> {
  const { error } = await supabase.from("grupos").delete().eq("id", grupoId);

  if (error) throw error;
}
