import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { listarExtrato, type ItemExtrato } from '@/services/extratoService';

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

export default function ExtratoScreen() {
  const [despesas, setDespesas] = useState<ItemExtrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const total = useMemo(
    () => despesas.reduce((soma, despesa) => soma + Number(despesa.valor_total), 0),
    [despesas],
  );

  const carregarExtrato = useCallback(async (modoAtualizacao = false) => {
    try {
      if (modoAtualizacao) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro(null);
      const dados = await listarExtrato();
      setDespesas(dados);
    } catch (error: any) {
      setErro(error?.message ?? 'Nao foi possivel carregar o extrato.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarExtrato();
  }, [carregarExtrato]);

  const abrirRecibo = async (url: string) => {
    const podeAbrir = await Linking.canOpenURL(url);

    if (podeAbrir) {
      await Linking.openURL(url);
    }
  };

  const renderItem = ({ item }: { item: ItemExtrato }) => {
    const nomePagador = item.usuario_pagador?.nome ?? 'Usuario';
    const avatar = item.usuario_pagador?.imagem_url;

    return (
      <View style={styles.item}>
        <View style={styles.avatarArea}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={18} color="#445" />
            </View>
          )}
        </View>

        <View style={styles.itemConteudo}>
          <View style={styles.itemTopo}>
            <Text style={styles.descricao} numberOfLines={1}>
              {item.descricao}
            </Text>
            <Text style={styles.valor}>{formatadorMoeda.format(Number(item.valor_total))}</Text>
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            Pago por {nomePagador}
          </Text>
          <Text style={styles.data}>{formatadorData.format(new Date(item.criado_em))}</Text>

          {item.recibo_url ? (
            <TouchableOpacity style={styles.reciboBotao} onPress={() => abrirRecibo(item.recibo_url!)}>
              <Ionicons name="receipt-outline" size={16} color="#176B52" />
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

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Extrato</Text>
        <Text style={styles.subtitulo}>Despesas registradas nos seus grupos</Text>
      </View>

      <View style={styles.resumo}>
        <View>
          <Text style={styles.resumoLabel}>Total listado</Text>
          <Text style={styles.resumoValor}>{formatadorMoeda.format(total)}</Text>
        </View>
        <View style={styles.contador}>
          <Ionicons name="list" size={18} color="#176B52" />
          <Text style={styles.contadorTexto}>{despesas.length}</Text>
        </View>
      </View>

      {erro ? (
        <View style={styles.erroBox}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <TouchableOpacity onPress={() => carregarExtrato()}>
            <Text style={styles.tentarNovamente}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={despesas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={despesas.length ? styles.lista : styles.listaVazia}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => carregarExtrato(true)} />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="receipt-outline" size={34} color="#7A827D" />
            <Text style={styles.vazioTitulo}>Nenhuma despesa ainda</Text>
            <Text style={styles.vazioTexto}>
              Quando voce registrar despesas em um grupo, elas aparecem aqui.
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
    backgroundColor: '#F5F7F2',
  },
  cabecalho: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#F5F7F2',
  },
  titulo: {
    color: '#17221C',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#5F6B63',
    fontSize: 14,
    marginTop: 4,
  },
  resumo: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE4DD',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
  },
  resumoLabel: {
    color: '#68736B',
    fontSize: 13,
    marginBottom: 4,
  },
  resumoValor: {
    color: '#17221C',
    fontSize: 24,
    fontWeight: '800',
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
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 10,
  },
  listaVazia: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE7E1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
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
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#E7ECE8',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    color: '#17221C',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  valor: {
    color: '#176B52',
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: '#58635D',
    fontSize: 13,
    marginTop: 3,
  },
  data: {
    color: '#7B857E',
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
    color: '#176B52',
    fontSize: 13,
    fontWeight: '700',
  },
  estadoCentralizado: {
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  estadoTexto: {
    color: '#5F6B63',
    marginTop: 12,
  },
  erroBox: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F0C3C3',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
  },
  erroTexto: {
    color: '#9A1D1D',
    fontSize: 13,
  },
  tentarNovamente: {
    color: '#176B52',
    fontWeight: '700',
    marginTop: 8,
  },
  vazio: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  vazioTitulo: {
    color: '#17221C',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  vazioTexto: {
    color: '#68736B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
