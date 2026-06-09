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

export type Transferencia = {
  deUsuarioId: string;
  paraUsuarioId: string;
  valor: number;
};

/**
 * Calcula o balanco financeiro de um grupo.
 * Retorna o saldo individual de cada membro e a lista simplificada
 * de transferencias necessarias para quitar todas as dividas.
 */
export function calcularBalanco(
  despesas: Despesa[],
  membrosIds: string[],
): { saldos: Saldo[]; transferencias: Transferencia[] } {
  if (membrosIds.length === 0) return { saldos: [], transferencias: [] };

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

  // Algoritmo ganancioso para simplificar transferencias
  const devedores: { id: string; valor: number }[] = [];
  const credores: { id: string; valor: number }[] = [];

  for (const s of saldos) {
    if (s.balanco < -0.01)
      devedores.push({ id: s.usuarioId, valor: -s.balanco });
    if (s.balanco > 0.01) credores.push({ id: s.usuarioId, valor: s.balanco });
  }

  // Ordena do maior para o menor para minimizar numero de transferencias
  devedores.sort((a, b) => b.valor - a.valor);
  credores.sort((a, b) => b.valor - a.valor);

  const transferencias: Transferencia[] = [];
  let i = 0;
  let j = 0;

  while (i < devedores.length && j < credores.length) {
    const valor = Math.min(devedores[i].valor, credores[j].valor);

    if (valor > 0.01) {
      transferencias.push({
        deUsuarioId: devedores[i].id,
        paraUsuarioId: credores[j].id,
        valor: Math.round(valor * 100) / 100,
      });
    }

    devedores[i].valor -= valor;
    credores[j].valor -= valor;

    if (devedores[i].valor < 0.01) i++;
    if (credores[j].valor < 0.01) j++;
  }

  return { saldos, transferencias };
}
