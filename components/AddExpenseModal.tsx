import { useState } from "react";

import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";

import { criarDespesa } from "@/services/despesaService";
import { enviarRecibo } from "@/services/storageService";

type Props = {
  visible: boolean;
  grupoId: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export default function ExpenseModal({
  visible,
  grupoId,
  onClose,
  onCreated,
}: Props) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const [imagem, setImagem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { userId } = useAuth();

  const escolherImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      alert("Permissão necessária");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      setImagem(result.assets[0].uri);
    }
  };
  const handleCreateExpense = async () => {
    try {
      setSaving(true);
      setError("");

      let reciboUrl: string | null = null;

      if (imagem && userId) {
        reciboUrl = await enviarRecibo(grupoId, userId, imagem);
      }

      await criarDespesa(grupoId, userId!, Number(valor), descricao, reciboUrl);

      console.log("DESPESA CRIADA");

      setDescricao("");
      setValor("");
      setImagem(null);

      await onCreated();
    } catch (err: any) {
      console.log("ERRO CREATE", err);

      Alert.alert("Erro", err.message || "Erro ao criar despesa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Nova Despesa</Text>

          <TextInput
            style={styles.input}
            placeholder="Descrição"
            value={descricao}
            onChangeText={setDescricao}
          />

          <TextInput
            style={styles.input}
            placeholder="Valor"
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
          />

          <TouchableOpacity
            style={styles.imageButton}
            onPress={escolherImagem}
            disabled={saving}
          >
            {imagem ? (
              <Image source={{ uri: imagem }} style={styles.preview} />
            ) : (
              <Text style={styles.imageButtonText}>Selecionar recibo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateExpense}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#303329" />
            ) : (
              <Text style={styles.buttonText}>Salvar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={saving} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#597317" />
            <Text style={styles.loadingTitle}>Criando despesa...</Text>
            <Text style={styles.loadingText}>
              Aguarde enquanto salvamos sua despesa e guardamos o recibo...
            </Text>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(48, 51, 41, 0.35)",
    padding: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#d6e6b3",
    borderWidth: 1,
    borderColor: "#597317",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#303329",
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#35401A",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  container: {
    backgroundColor: "#a3c267",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#303329",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#303329",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#597317",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#303329",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#35401A",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  imageButton: {
    height: 150,
    borderWidth: 1,
    borderColor: "#303329",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  imageButtonText: {
    color: "#303329",
    fontWeight: "bold",
  },
});
