import { supabase } from "@/lib/supabase";
import type { Grupo } from "@/types/database";
import { adicionarMembro } from "./membroService";
import { enviarImagemGrupo } from "./storageService";

export async function criarGrupo(
  nome: string,
  criadorId: string,
  latitude?: number | null,
  longitude?: number | null,
  encontroNome?: string | null,
  imagemGrupoUri?: string | null,
): Promise<Grupo> {
  console.log("CRIANDO GRUPO");
  const codigoConvite = gerarCodigoConvite();
  const { data: grupo, error: erroGrupo } = await supabase
    .from("grupos")
    .insert({
      nome,
      criado_por_usuario_id: criadorId,
      encontro_latitude: latitude ?? null,
      encontro_longitude: longitude ?? null,
      encontro_nome: encontroNome ?? null,
      codigo_convite: codigoConvite,
      imagem_grupo_url: null,
    })
    .select()
    .single();

  if (erroGrupo) throw erroGrupo;

  console.log("RESULTADO GRUPO:", grupo, erroGrupo);
  console.log("ADICIONANDO CRIADOR COMO MEMBRO");

  const { error: erroMembro } = await supabase.from("membros_grupo").insert({
    grupo_id: grupo.id,
    usuario_id: criadorId,
    ativo: true,
  });

  if (erroMembro) throw erroMembro;

  if (!imagemGrupoUri) {
    return grupo as Grupo;
  }

  const imagemUrl = await enviarImagemGrupo(grupo.id, imagemGrupoUri);
  console.log("ATUALIZANDO IMAGEM DO GRUPO");
  const { data: grupoAtualizado, error: erroImagem } = await supabase
    .from("grupos")
    .update({
      imagem_grupo_url: imagemUrl,
    })
    .eq("id", grupo.id)
    .select()
    .single();

  if (erroImagem) throw erroImagem;

  return grupoAtualizado as Grupo;
}

function gerarCodigoConvite() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
  const { data, error } = await supabase
    .from("grupos")
    .delete()
    .eq("id", grupoId)
    .select("id");

  if (error) {
    console.error("Erro ao excluir grupo:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "O grupo não foi excluído. Verifique a permissão RLS e se você é o criador.",
    );
  }
}

export async function entrarGrupo(codigo: string, usuarioId: string) {
  const { data: grupo, error } = await supabase
    .from("grupos")
    .select("id")
    .eq("codigo_convite", codigo)
    .single();

  if (error) throw error;

  await adicionarMembro(grupo.id, usuarioId);
}
