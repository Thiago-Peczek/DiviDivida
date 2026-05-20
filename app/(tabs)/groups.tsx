import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { listarMeusGrupos } from "@/services/grupoService";
import { useFocusEffect } from "@react-navigation/native";

import GroupCard from "../../components/groupCard";

import type { Grupo } from "@/types/database";

export default function GroupsScreen() {
  const { userId } = useAuth();
  const { logout } = useAuth();

  const [groups, setGroups] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        carregarGrupos();
      } else {
        setLoading(false);
      }
    }, [userId]),
  );

  const carregarGrupos = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const data = await listarMeusGrupos(userId);

      setGroups(data);
    } catch (err) {
      console.log("ERRO:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GroupCard
            nome={item.nome}
            imagem={item.imagem_grupo_url ?? ""}
            onPress={() => {
              console.log(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>
              Você ainda não participa de nenhum grupo
            </Text>
            <TouchableOpacity
              style={styles.buttonEmpty}
              onPress={() => router.push("../group/create")}
            >
              <Text style={styles.buttonText}>Crie um Grupo</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../group/create")}
      >
        <Text style={styles.buttonText}>+ Novo Grupo</Text>
      </TouchableOpacity>
      <Button title="Sair" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a3c267",
  },

  list: {
    paddingTop: 40,
    padding: 20,
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a3c267",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    textAlign: "center",
    padding: 20,
    marginTop: 40,
    fontSize: 18,
    color: "#303329",
    fontWeight: "600",
  },

  button: {
    position: "absolute",
    bottom: 24,
    right: 24,

    backgroundColor: "#597317",

    paddingVertical: 14,
    paddingHorizontal: 20,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    elevation: 4,
  },
  buttonEmpty: {
    backgroundColor: "#597317",

    padding: 14,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    elevation: 4,
  },
  buttonText: {
    color: "#303329",
    fontWeight: "bold",
    fontSize: 16,
  },

  error: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
