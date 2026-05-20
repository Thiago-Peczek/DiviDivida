import { supabase } from '@/lib/supabase';
import type { Despesa, Usuario } from '@/types/database';

type UsuarioPagador = Pick<Usuario, 'id' | 'nome' | 'imagem_url'>;

type ItemExtratoResposta = Despesa & {
  usuario_pagador: UsuarioPagador | UsuarioPagador[] | null;
};

export type ItemExtrato = Despesa & {
  usuario_pagador: UsuarioPagador | null;
};

export async function listarExtrato(grupoId?: string): Promise<ItemExtrato[]> {
  let consulta = supabase
    .from('despesas')
    .select(
      `
        id,
        grupo_id,
        pago_por_usuario_id,
        valor_total,
        descricao,
        recibo_url,
        criado_em,
        usuario_pagador:usuarios!despesas_pago_por_usuario_id_fkey (
          id,
          nome,
          imagem_url
        )
      `,
    )
    .order('criado_em', { ascending: false });

  if (grupoId) {
    consulta = consulta.eq('grupo_id', grupoId);
  }

  const { data, error } = await consulta;

  if (error) throw error;

  return ((data ?? []) as ItemExtratoResposta[]).map((item) => ({
    ...item,
    usuario_pagador: Array.isArray(item.usuario_pagador)
      ? item.usuario_pagador[0] ?? null
      : item.usuario_pagador,
  }));
}
