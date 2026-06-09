import { supabase } from "@/lib/supabase";
import type { Despesa, Usuario } from "@/types/database";

export type DespesaComPagador = Despesa & {
  pagador: Usuario | null;
};

export async function criarDespesa(
  grupoId: string,
  pagoPorUsuarioId: string,
  valorTotal: number,
  descricao: string,
  reciboUrl?: string | null,
): Promise<Despesa> {
  const { data, error } = await supabase
    .from("despesas")
    .insert({
      grupo_id: grupoId,
      pago_por_usuario_id: pagoPorUsuarioId,
      valor_total: valorTotal,
      descricao,
      recibo_url: reciboUrl ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Despesa;
}

export async function listarDespesas(
  grupoId: string,
): Promise<DespesaComPagador[]> {
  const { data, error } = await supabase
    .from("despesas")
    .select("*, pagador:usuarios!despesas_pago_por_usuario_id_fkey(*)")
    .eq("grupo_id", grupoId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as DespesaComPagador[];
}

export async function obterDespesa(despesaId: string): Promise<Despesa> {
  const { data, error } = await supabase
    .from("despesas")
    .select("*")
    .eq("id", despesaId)
    .single();

  if (error) throw error;
  return data as Despesa;
}

export async function atualizarDespesa(
  despesaId: string,
  campos: Partial<Pick<Despesa, "valor_total" | "descricao" | "recibo_url">>,
): Promise<Despesa> {
  const { data, error } = await supabase
    .from("despesas")
    .update(campos)
    .eq("id", despesaId)
    .select()
    .single();

  if (error) throw error;
  return data as Despesa;
}

export async function excluirDespesa(despesaId: string): Promise<void> {
  const { error } = await supabase
    .from("despesas")
    .delete()
    .eq("id", despesaId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Logica de calculo de saldo / balanco do grupo
// ---------------------------------------------------------------------------

export type Saldo = {
  usuarioId: string;
  totalPago: number;
  cotaJusta: number;
  balanco: number; // positivo = pagou a mais, negativo = deve
};

/**
 * Calcula o balanco financeiro de um grupo.
 * Retorna o saldo individual de cada membro.
 */
export function calcularBalanco(
  despesas: Despesa[],
  membrosIds: string[],
): { saldos: Saldo[] } {
  if (membrosIds.length === 0) return { saldos: [] };

  // Total gasto no grupo
  const totalGeral = despesas.reduce(
    (acc, d) => acc + Number(d.valor_total),
    0,
  );
  const cotaJusta = totalGeral / membrosIds.length;

  // Quanto cada membro pagou
  const pagoPor: Record<string, number> = {};
  for (const id of membrosIds) pagoPor[id] = 0;
  for (const d of despesas) {
    pagoPor[d.pago_por_usuario_id] =
      (pagoPor[d.pago_por_usuario_id] ?? 0) + Number(d.valor_total);
  }

  const saldos: Saldo[] = membrosIds.map((id) => ({
    usuarioId: id,
    totalPago: pagoPor[id],
    cotaJusta,
    balanco: pagoPor[id] - cotaJusta,
  }));

  return { saldos };
}
