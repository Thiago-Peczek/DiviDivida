import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { calcularBalanco } from '@/services/despesaService';
import { listarExtrato, type ItemExtrato } from '@/services/extratoService';
import { listarMeusGrupos } from '@/services/grupoService';
import { listarMembros, type MembroComPerfil } from '@/services/membroService';
import type { Grupo } from '@/types/database';

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const LIMITE_BALANCO = 0.01;

type SaldoApresentacao = {
  usuarioId: string;
  nome: string;
  imagemUrl: string | null;
  totalPago: number;
  cotaJusta: number;
  balanco: number;
};

type TransferenciaApresentacao = {
  deUsuarioId: string;
  deNome: string;
  paraUsuarioId: string;
  paraNome: string;
  valor: number;
};

export default function ExtratoScreen() {
  const { userId } = useAuth();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string | null>(null);
  const [membros, setMembros] = useState<MembroComPerfil[]>([]);
  const [despesas, setDespesas] = useState<ItemExtrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const grupoSelecionado = useMemo(
    () => grupos.find((grupo) => grupo.id === grupoSelecionadoId) ?? null,
    [grupoSelecionadoId, grupos],
  );

  const total = useMemo(
    () => despesas.reduce((soma, despesa) => soma + Number(despesa.valor_total), 0),
    [despesas],
  );

  const quantidade = despesas.length;

  const maiorDespesa = useMemo(
    () =>
      despesas.reduce<ItemExtrato | null>(
        (maior, atual) =>
          !maior || Number(atual.valor_total) > Number(maior.valor_total) ? atual : maior,
        null,
      ),
    [despesas],
  );

  const membrosPorId = useMemo(() => {
    return new Map(
      membros.map((membro) => [
        membro.usuario_id,
        {
          nome: membro.usuario?.nome ?? 'Participante',
          imagemUrl: membro.usuario?.imagem_url ?? null,
        },
      ]),
    );
  }, [membros]);

  const resultadoBalanco = useMemo(
    () => calcularBalanco(despesas, membros.map((membro) => membro.usuario_id)),
    [despesas, membros],
  );

  const saldosApresentacao = useMemo<SaldoApresentacao[]>(() => {
    return resultadoBalanco.saldos
      .map((saldo) => ({
        ...saldo,
        nome: membrosPorId.get(saldo.usuarioId)?.nome ?? 'Participante',
        imagemUrl: membrosPorId.get(saldo.usuarioId)?.imagemUrl ?? null,
      }))
      .sort((a, b) => b.balanco - a.balanco);
  }, [membrosPorId, resultadoBalanco.saldos]);

  const transferenciasApresentacao = useMemo<TransferenciaApresentacao[]>(() => {
    return resultadoBalanco.transferencias.map((transferencia) => ({
      ...transferencia,
      deNome: membrosPorId.get(transferencia.deUsuarioId)?.nome ?? 'Participante',
      paraNome: membrosPorId.get(transferencia.paraUsuarioId)?.nome ?? 'Participante',
    }));
  }, [membrosPorId, resultadoBalanco.transferencias]);

  const totaisPorPagador = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number }>();

    for (const item of despesas) {
      const nome = item.usuario_pagador?.nome ?? 'Usuario';
      const atual = mapa.get(nome);
      const valor = Number(item.valor_total);

      if (atual) {
        atual.total += valor;
      } else {
        mapa.set(nome, { nome, total: valor });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [despesas]);

  const totalDevidoGrupo = useMemo(() => {
    return saldosApresentacao
      .filter((saldo) => saldo.balanco < -LIMITE_BALANCO)
      .reduce((acc, saldo) => acc + Math.abs(saldo.balanco), 0);
  }, [saldosApresentacao]);

  const saldoDoUsuario = useMemo(
    () => saldosApresentacao.find((saldo) => saldo.usuarioId === userId) ?? null,
    [saldosApresentacao, userId],
  );

  const carregarExtrato = useCallback(
    async (modoAtualizacao = false) => {
      if (!userId) {
        setGrupos([]);
        setGrupoSelecionadoId(null);
        setMembros([]);
        setDespesas([]);
        setErro(null);
        setCarregando(false);
        setAtualizando(false);
        return;
      }

      try {
        if (modoAtualizacao) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        setErro(null);

        const gruposDoUsuario = await listarMeusGrupos(userId);
        setGrupos(gruposDoUsuario);

        if (!gruposDoUsuario.length) {
          setGrupoSelecionadoId(null);
          setMembros([]);
          setDespesas([]);
          return;
        }

        let proximoGrupoId = grupoSelecionadoId;

        if (!proximoGrupoId || !gruposDoUsuario.some((grupo) => grupo.id === proximoGrupoId)) {
          proximoGrupoId = gruposDoUsuario[0].id;
          setGrupoSelecionadoId(proximoGrupoId);
        }

        const [despesasDoGrupo, membrosDoGrupo] = await Promise.all([
          listarExtrato(proximoGrupoId),
          listarMembros(proximoGrupoId),
        ]);

        setDespesas(despesasDoGrupo);
        setMembros(membrosDoGrupo);
      } catch (error: any) {
        setErro(error?.message ?? 'Nao foi possivel carregar o extrato.');
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [grupoSelecionadoId, userId],
  );

  useEffect(() => {
    carregarExtrato();
  }, [carregarExtrato]);

  const abrirGrupo = (grupoId: string) => {
    if (grupoId === grupoSelecionadoId) return;
    setGrupoSelecionadoId(grupoId);
  };

  const abrirTelaDoGrupo = (grupoId: string) => {
    router.push({
      pathname: '/group/[id]',
      params: { id: grupoId },
    });
  };

  const textoSaldoUsuario = useMemo(() => {
    if (!saldoDoUsuario) {
      return {
        titulo: 'Sua posicao',
        valor: 'Sem dados ainda',
        detalhe: 'Entre nas despesas do grupo para comecar a fechar as contas.',
        destaque: styles.neutroValor,
      };
    }

    if (saldoDoUsuario.balanco > LIMITE_BALANCO) {
      return {
        titulo: 'Seu saldo neste grupo',
        valor: formatadorMoeda.format(saldoDoUsuario.balanco),
        detalhe: 'Voce pagou mais do que sua parte e tem valor para receber.',
        destaque: styles.positivoValor,
      };
    }

    if (saldoDoUsuario.balanco < -LIMITE_BALANCO) {
      return {
        titulo: 'Seu saldo neste grupo',
        valor: formatadorMoeda.format(Math.abs(saldoDoUsuario.balanco)),
        detalhe: 'Esse e o valor pendente para voce acertar neste grupo.',
        destaque: styles.negativoValor,
      };
    }

    return {
      titulo: 'Seu saldo neste grupo',
      valor: formatadorMoeda.format(0),
      detalhe: 'Seu saldo esta equilibrado com as despesas do grupo.',
      destaque: styles.neutroValor,
    };
  }, [saldoDoUsuario]);

  const renderItem = ({ item }: { item: ItemExtrato }) => {
    const nomePagador = item.usuario_pagador?.nome ?? 'Usuario';
    const avatarGrupo = grupoSelecionado?.imagem_grupo_url ?? null;

    return (
      <View style={styles.item}>
        <View style={styles.avatarArea}>
          {avatarGrupo ? (
            <Image source={{ uri: avatarGrupo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={18} color="#445" />
            </View>
          )}
        </View>

        <View style={styles.itemConteudo}>
          <View style={styles.itemTopo}>
            <Text style={styles.descricao} numberOfLines={1}>
              {grupoSelecionado?.nome ?? 'Grupo'}
            </Text>
            <Text style={styles.valor}>{formatadorMoeda.format(Number(item.valor_total))}</Text>
          </View>

          <Text style={styles.subdescricao} numberOfLines={1}>
            {item.descricao}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            Pago por {nomePagador}
          </Text>
          <Text style={styles.data}>{formatadorData.format(new Date(item.criado_em))}</Text>

          {item.recibo_url ? (
            <TouchableOpacity style={styles.reciboBotao} onPress={() => abrirTelaDoGrupo(item.grupo_id)}>
              <Text style={styles.reciboTexto}>Ver recibo</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  if (carregando) {
    return (
      <View style={styles.estadoCentralizado}>
        <ActivityIndicator size="large" color="#176B52" />
        <Text style={styles.estadoTexto}>Carregando extrato...</Text>
      </View>
    );
  }

  if (!grupos.length && !erro) {
    return (
      <View style={styles.container}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>Extrato</Text>
          <Text style={styles.subtitulo}>Escolha um grupo para acompanhar despesas e acertos</Text>
        </View>

        <View style={styles.estadoVazioTela}>
          <Ionicons name="people-outline" size={42} color="#7A827D" />
          <Text style={styles.vazioTitulo}>Voce ainda nao participa de nenhum grupo</Text>
          <Text style={styles.vazioTexto}>
            Quando entrar em um grupo, o extrato passa a mostrar despesas, saldos e acertos.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={despesas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={despesas.length ? styles.lista : styles.listaVazia}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => carregarExtrato(true)} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.cabecalho}>
              <Text style={styles.titulo}>Extrato</Text>
              <Text style={styles.subtitulo}>
                {grupoSelecionado
                  ? `Despesas e acertos do grupo ${grupoSelecionado.nome}`
                  : 'Escolha um grupo para acompanhar despesas e acertos'}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gruposScroll}
            >
              {grupos.map((grupo) => {
                const selecionado = grupo.id === grupoSelecionadoId;

                return (
                  <TouchableOpacity
                    key={grupo.id}
                    style={[styles.grupoChip, selecionado && styles.grupoChipAtivo]}
                    onPress={() => abrirGrupo(grupo.id)}
                  >
                    <Text style={[styles.grupoChipTexto, selecionado && styles.grupoChipTextoAtivo]}>
                      {grupo.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.resumo}>
              <View>
                <Text style={styles.resumoLabel}>TOTAL DO GRUPO</Text>
                <Text style={styles.resumoValor}>{formatadorMoeda.format(total)}</Text>
                <Text style={styles.resumoAuxiliar}>
                  Valor total que esta pendente neste grupo: {formatadorMoeda.format(totalDevidoGrupo)}
                </Text>
              </View>
            </View>

            <View style={styles.dashboardGrid}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Maior despesa</Text>
                <Text style={styles.kpiValueCompact}>
                  {maiorDespesa
                    ? formatadorMoeda.format(Number(maiorDespesa.valor_total))
                    : formatadorMoeda.format(0)}
                </Text>
                <Text style={styles.kpiAuxiliar} numberOfLines={1}>
                  {maiorDespesa?.descricao ?? 'Sem despesas ainda'}
                </Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Total por pagador</Text>
                <Text style={styles.kpiValueCompact}>
                  {totaisPorPagador[0]
                    ? formatadorMoeda.format(totaisPorPagador[0].total)
                    : formatadorMoeda.format(0)}
                </Text>
                <Text style={styles.kpiAuxiliar} numberOfLines={1}>
                  {totaisPorPagador[0]?.nome ?? 'Sem pagadores ainda'}
                </Text>
              </View>
            </View>

            <View style={styles.dashboardBloco}>
              <Text style={styles.blocoTitulo}>SUA POSICAO NO GRUPO</Text>
              <Text style={[styles.blocoValorGrande, textoSaldoUsuario.destaque]}>
                {textoSaldoUsuario.valor}
              </Text>
              <Text style={styles.blocoAuxiliar}>{textoSaldoUsuario.detalhe}</Text>
            </View>

            {erro ? (
              <View style={styles.erroBox}>
                <Text style={styles.erroTexto}>{erro}</Text>
                <TouchableOpacity onPress={() => carregarExtrato()}>
                  <Text style={styles.tentarNovamente}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.historicoTitulo}>Historico de despesas</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="receipt-outline" size={34} color="#7A827D" />
            <Text style={styles.vazioTitulo}>Nenhuma despesa ainda</Text>
            <Text style={styles.vazioTexto}>
              {grupoSelecionado
                ? `Quando voces registrarem despesas em ${grupoSelecionado.nome}, elas aparecem aqui.`
                : 'Quando voce registrar despesas em um grupo, elas aparecem aqui.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A3C267',
  },
  cabecalho: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#A3C267',
  },
  titulo: {
    color: '#303329',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#4F5F2B',
    fontSize: 14,
    marginTop: 4,
  },
  gruposScroll: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  grupoChip: {
    alignItems: 'center',
    backgroundColor: '#C7DA97',
    borderColor: '#597317',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  grupoChipAtivo: {
    backgroundColor: '#597317',
    borderColor: '#597317',
  },
  grupoChipTexto: {
    color: '#4F5F2B',
    fontSize: 13,
    fontWeight: '600',
  },
  grupoChipTextoAtivo: {
    color: '#EAF3D1',
  },
  resumo: {
    backgroundColor: '#D7E8AE',
    borderColor: '#597317',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  kpi: {
    flex: 1,
    backgroundColor: '#D7E8AE',
    borderColor: '#597317',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  kpiLabel: {
    color: '#4F5F2B',
    fontSize: 12,
  },
  kpiValue: {
    color: '#303329',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  dashboardBloco: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#D7E8AE',
    borderColor: '#597317',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  blocoTitulo: {
    color: '#4F5F2B',
    fontSize: 12,
    marginBottom: 8,
  },
  blocoValor: {
    color: '#303329',
    fontSize: 15,
    fontWeight: '700',
  },
  blocoValorGrande: {
    fontSize: 24,
    fontWeight: '800',
  },
  blocoAuxiliar: {
    color: '#4F5F2B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  linhaPagador: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pagadorNome: {
    color: '#303329',
    fontSize: 13,
  },
  pagadorValor: {
    color: '#597317',
    fontSize: 13,
    fontWeight: '700',
  },
  linhaSaldo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 10,
  },
  linhaSaldoPessoa: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  linhaSaldoTexto: {
    flex: 1,
  },
  linhaSaldoAuxiliar: {
    color: '#4F5F2B',
    fontSize: 12,
    marginTop: 2,
  },
  saldoStatus: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  linhaTransferencia: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
  },
  transferenciaTextoArea: {
    flex: 1,
  },
  transferenciaTexto: {
    color: '#303329',
    fontSize: 13,
    lineHeight: 18,
  },
  transferenciaValor: {
    color: '#597317',
    fontSize: 13,
    fontWeight: '800',
  },
  positivoValor: {
    color: '#597317',
  },
  negativoValor: {
    color: '#3F4F20',
  },
  neutroValor: {
    color: '#4F5F2B',
  },
  resumoLabel: {
    color: '#4F5F2B',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  resumoValor: {
    color: '#303329',
    fontSize: 30,
    fontWeight: '800',
  },
  resumoAuxiliar: {
    color: '#4F5F2B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  contador: {
    alignItems: 'center',
    backgroundColor: '#E7F4ED',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  contadorTexto: {
    color: '#176B52',
    fontSize: 15,
    fontWeight: '700',
  },
  historicoTitulo: {
    color: '#303329',
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  lista: {
    paddingBottom: 28,
    gap: 10,
  },
  listaVazia: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  item: {
    backgroundColor: '#D7E8AE',
    borderColor: '#597317',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
  },
  avatarArea: {
    marginRight: 12,
  },
  avatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  avatarPequeno: {
    borderRadius: 16,
    height: 32,
    width: 32,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#B9CF82',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarPlaceholderPequeno: {
    alignItems: 'center',
    backgroundColor: '#B9CF82',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  itemConteudo: {
    flex: 1,
    minWidth: 0,
  },
  itemTopo: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  descricao: {
    color: '#303329',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  subdescricao: {
    color: '#4F5F2B',
    fontSize: 13,
    marginTop: 3,
  },
  valor: {
    color: '#597317',
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: '#4F5F2B',
    fontSize: 13,
    marginTop: 3,
  },
  data: {
    color: '#6B7D40',
    fontSize: 12,
    marginTop: 2,
  },
  reciboBotao: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    marginTop: 9,
  },
  reciboTexto: {
    color: '#597317',
    fontSize: 13,
    fontWeight: '700',
  },
  estadoCentralizado: {
    alignItems: 'center',
    backgroundColor: '#A3C267',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  estadoVazioTela: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  estadoTexto: {
    color: '#4F5F2B',
    marginTop: 12,
  },
  erroBox: {
    backgroundColor: '#D7E8AE',
    borderColor: '#597317',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
  },
  erroTexto: {
    color: '#303329',
    fontSize: 13,
  },
  tentarNovamente: {
    color: '#597317',
    fontWeight: '700',
    marginTop: 8,
  },
  vazio: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  vazioTitulo: {
    color: '#303329',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  vazioTexto: {
    color: '#4F5F2B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
