import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { entrarGrupoPorCodigo } from "@/services/membroService";

export default function JoinGroupScreen() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const codigoNormalizado = codigo.trim().toUpperCase();

    if (!codigoNormalizado) {
      Alert.alert("Erro", "Informe o código do grupo");
      return;
    }

    try {
      setLoading(true);

      const grupoId = await entrarGrupoPorCodigo(codigoNormalizado);

      Alert.alert("Sucesso", "Você entrou no grupo");

      router.replace({
        pathname: "/grupo/[id]",
        params: { id: grupoId },
      });
    } catch (err: any) {
      console.error("Erro ao entrar no grupo:", err);

      Alert.alert(
        "Erro",
        err.message || "Código inválido ou grupo não encontrado",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar em um grupo</Text>

      <TextInput
        style={styles.input}
        placeholder="Código do grupo"
        value={codigo}
        onChangeText={setCodigo}
        autoCapitalize="characters"
      />

      <TouchableOpacity style={styles.button} onPress={handleJoin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A3C267",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#303329",
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: "#303329",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#597317",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#303329",
    fontWeight: "bold",
  },
});
