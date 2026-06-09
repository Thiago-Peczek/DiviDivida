import { supabase } from "@/lib/supabase";
import type { MembroGrupo, Usuario } from "@/types/database";

export type MembroComPerfil = MembroGrupo & {
  usuario: Usuario;
};

export async function adicionarMembro(
  grupoId: string,
  usuarioId: string,
): Promise<MembroGrupo> {
  const { data: membroExistente, error: erroBusca } = await supabase
    .from("membros_grupo")
    .select("*")
    .eq("grupo_id", grupoId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (erroBusca) throw erroBusca;

  if (membroExistente) {
    const { data, error } = await supabase
      .from("membros_grupo")
      .update({
        ativo: true,
        removido_em: null,
      })
      .eq("grupo_id", grupoId)
      .eq("usuario_id", usuarioId)
      .select()
      .single();

    if (error) throw error;

    return data as MembroGrupo;
  }

  const { data, error } = await supabase
    .from("membros_grupo")
    .insert({
      grupo_id: grupoId,
      usuario_id: usuarioId,
      ativo: true,
    })
    .select()
    .single();

  if (error) throw error;

  return data as MembroGrupo;
}

export async function adicionarMembroPorEmail(grupoId: string, email: string) {
  const usuario = await buscarUsuarioPorEmail(email);

  if (!usuario) {
    throw new Error("Usuário não encontrado");
  }

  return adicionarMembro(grupoId, usuario.id);
}

export async function removerMembro(
  grupoId: string,
  usuarioId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("membros_grupo")
    .update({
      ativo: false,
      removido_em: new Date().toISOString(),
    })
    .eq("grupo_id", grupoId)
    .eq("usuario_id", usuarioId)
    .select("grupo_id, usuario_id");

  if (error) {
    console.error("Erro ao remover membro:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "O membro não foi removido. Verifique sua permissão de administrador.",
    );
  }
}
export async function listarMembros(
  grupoId: string,
): Promise<MembroComPerfil[]> {
  const { data, error } = await supabase
    .from("membros_grupo")
    .select("*, usuario:usuarios(*)")
    .eq("grupo_id", grupoId)
    .eq("ativo", true);

  if (error) throw error;

  return (data ?? []) as unknown as MembroComPerfil[];
}

export async function verificarMembro(
  grupoId: string,
  usuarioId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("membros_grupo")
    .select("grupo_id")
    .eq("grupo_id", grupoId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function buscarUsuarioPorEmail(
  email: string,
): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data as Usuario | null;
}

export async function entrarGrupoPorCodigo(codigo: string): Promise<string> {
  const codigoNormalizado = codigo.trim().toUpperCase();

  const { data, error } = await supabase.rpc("entrar_em_grupo_por_codigo", {
    p_codigo: codigoNormalizado,
  });

  if (error) throw error;

  if (!data) {
    throw new Error("Não foi possível entrar no grupo");
  }

  return data as string;
}
