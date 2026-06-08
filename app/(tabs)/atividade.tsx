import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { listarMeusGrupos } from "@/services/grupoService";
import { listarDespesas } from "@/services/despesaService";
import type { Grupo } from "@/types/database";
import type { DespesaComPagador } from "@/services/despesaService";

type AtividadeItem = DespesaComPagador & { grupoNome: string };

export default function Atividade() {
  const { userId } = useAuth();

  const [atividades, setAtividades] = useState<AtividadeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAtividades = useCallback(async () => {
    if (!userId) return;
    try {
      const grupos = await listarMeusGrupos(userId);
      const todasDespesas: AtividadeItem[] = [];

      for (const g of grupos) {
        const despesas = await listarDespesas(g.id);
        for (const d of despesas) {
          todasDespesas.push({ ...d, grupoNome: g.nome });
        }
      }

      todasDespesas.sort(
        (a, b) =>
          new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      );

      setAtividades(todasDespesas);
    } catch (err: any) {
      console.error("Erro ao carregar atividades:", err.message);
    }
  }, [userId]);

  useEffect(() => {
    fetchAtividades().finally(() => setLoading(false));
  }, [fetchAtividades]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAtividades();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const renderItem = ({ item }: { item: AtividadeItem }) => {
    const isPayer = item.pago_por_usuario_id === userId;

    return (
      <View style={styles.card}>
        <View
          style={[
            styles.cardIndicator,
            { backgroundColor: isPayer ? "#597317" : "#DC2626" },
          ]}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {item.descricao}
            </Text>
            <Text
              style={[
                styles.cardValue,
                { color: isPayer ? "#597317" : "#DC2626" },
              ]}
            >
              {isPayer ? "+" : "-"} {formatCurrency(item.valor_total)}
            </Text>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.cardGroup}>
              <Ionicons name="people" size={12} color="#35401A" />{" "}
              {item.grupoNome}
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.criado_em)}</Text>
          </View>
          <Text style={styles.cardPayer}>
            Pago por {item.pagador?.nome ?? "—"}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Sem atividades</Text>
      <Text style={styles.emptySubtitle}>
        Despesas criadas nos seus grupos aparecerão aqui.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#597317" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atividade</Text>

      <FlatList
        data={atividades}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          atividades.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#597317"]}
            tintColor="#597317"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a3c267",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#303329",
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a3c267",
  },
  list: {
    paddingBottom: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#d6e6b3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#597317",
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
  },
  cardIndicator: {
    width: 6,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDesc: {
    fontSize: 15,
    fontWeight: "700",
    color: "#303329",
    flex: 1,
    marginRight: 8,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "bold",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  cardGroup: {
    fontSize: 13,
    color: "#35401A",
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 12,
    color: "#55603A",
  },
  cardPayer: {
    fontSize: 12,
    color: "#55603A",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#303329",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#35401A",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
