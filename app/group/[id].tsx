//imports dependências
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

//imports componentes
import AddExpenseModal from "@/components/AddExpenseModal";

//imports serviços
import { excluirGrupo, obterGrupo } from "@/services/grupoService";
import { listarMembros, removerMembro } from "@/services/membroService";

//imports tipos
import type { MembroComPerfil } from "@/services/membroService";
import type { Grupo } from "@/types/database";

//imports ícones
import ExpenseCard from "@/components/ExpenseCard";
import GroupMenuModal from "@/components/GroupMenuModal";
import { useAuth } from "@/contexts/AuthContext";
import { DespesaComPagador, listarDespesas } from "@/services/despesaService";
import { Ionicons } from "@expo/vector-icons";

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [group, setGroup] = useState<Grupo | null>(null);

  const [members, setMembers] = useState<MembroComPerfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapExpanded, setMapExpanded] = useState(false);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [expenses, setExpenses] = useState<DespesaComPagador[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { userId } = useAuth();
  const isCreator = group?.criado_por_usuario_id === userId;

  const mapRef = useRef<MapView | null>(null);
  useEffect(() => {
    carregarTudo();
  }, [id]);

  const carregarGrupo = async () => {
    const data = await obterGrupo(id);

    setGroup(data);
  };

  const carregarMembros = async () => {
    if (!id) return;

    const data = await listarMembros(id);

    setMembers(data);
  };

  const carregarDespesas = async () => {
    if (!id) return;

    const data = await listarDespesas(id);

    setExpenses(data);
  };

  const carregarTudo = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        carregarGrupo(),
        carregarDespesas(),
        carregarMembros(),
      ]);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar grupo");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      await carregarTudo();
    } finally {
      setRefreshing(false);
    }
  };

  const handleExpenseCreated = async () => {
    await carregarDespesas();

    setExpenseModalVisible(false);
  };

  const handleInvite = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Entre no meu grupo no DiviDívida!

Código do grupo:
${group.codigo_convite}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removerMembro(id, memberId);

      await carregarMembros();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await excluirGrupo(id);

      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  const latitude = group?.encontro_latitude ?? -25.4295963;

  const longitude = group?.encontro_longitude ?? -49.2712724;

  const initialRegion = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    [latitude, longitude],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.center}>
        <Text>{error || "Grupo não encontrado"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#303329" />
          </TouchableOpacity>
          <Image
            source={{
              uri: group.imagem_grupo_url || "https://via.placeholder.com/400",
            }}
            style={styles.image}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.title}>{group.nome}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#303329" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <View style={styles.mapContainer}>
        <TouchableOpacity
          style={styles.mapName}
          activeOpacity={0.9}
          onPress={() => {
            if (!mapExpanded) {
              setMapExpanded(true);
            }
          }}
        >
          <MapView
            scrollEnabled={mapExpanded}
            zoomEnabled={mapExpanded}
            rotateEnabled={mapExpanded}
            pitchEnabled={mapExpanded}
            style={[styles.map, mapExpanded && styles.mapExpanded]}
            ref={mapRef}
            initialRegion={initialRegion}
          >
            <Marker
              coordinate={{
                latitude: group.encontro_latitude ?? -25.4295963,
                longitude: group.encontro_longitude ?? -49.2712724,
              }}
            />
          </MapView>

          {!mapExpanded && (
            <Text style={styles.location}>
              📍 {group.encontro_nome || "Local não informado"}
            </Text>
          )}
        </TouchableOpacity>
        {mapExpanded && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              mapRef.current?.animateToRegion(initialRegion, 500);

              setMapExpanded(false);
            }}
          >
            <Text style={styles.closeButtonText}>Fechar mapa</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <ExpenseCard
            descricao={item.descricao}
            valor={Number(item.valor_total)}
            nomePagador={item.pagador.nome}
            avatarPagador={item.pagador.imagem_url}
            recibo={item.recibo_url}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma despesa cadastrada</Text>
        }
      />
      <TouchableOpacity
        style={styles.addExpenseButton}
        onPress={() => setExpenseModalVisible(true)}
      >
        <Text style={styles.addExpenseButtonText}>
          + Adicionar Nova Despesa
        </Text>
      </TouchableOpacity>
      <AddExpenseModal
        visible={expenseModalVisible}
        onClose={() => setExpenseModalVisible(false)}
        onCreated={handleExpenseCreated}
        grupoId={id}
      />
      <GroupMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        members={members}
        currentUserId={userId ?? undefined}
        isCreator={isCreator}
        onInvite={handleInvite}
        onRemoveMember={handleRemoveMember}
        onDeleteGroup={handleDeleteGroup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a3c267",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a3c267",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#597317",
  },
  safeHeader: {
    backgroundColor: "#597317",
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#303329",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#303329",
  },
  mapContainer: {
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    backgroundColor: "#597317",
    marginBottom: 20,
  },
  mapName: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  map: {
    height: 96,
    width: 160,
  },
  mapExpanded: {
    width: "100%",
    height: 300,
  },
  closeButton: {
    backgroundColor: "#597317",
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#303329",
    fontWeight: "bold",
  },
  location: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "600",
    color: "#303329",
  },
  backButton: {
    marginRight: 16,
  },
  addExpenseButton: {
    backgroundColor: "#597317",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 36,
    marginTop: 12,
    width: "70%",
    alignSelf: "center",
  },
  addExpenseButtonText: {
    color: "#303329",
    fontWeight: "bold",
    fontSize: 16,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
  },
  menuButton: {
    padding: 8,
    alignSelf: "flex-end",
  },
});
