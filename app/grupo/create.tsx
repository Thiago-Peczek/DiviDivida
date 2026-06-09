import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { criarGrupo } from "@/services/grupoService";
import { router } from "expo-router";

import CreateGroupMap from "@/components/CreateGroupMap";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateGroupScreen() {
  const [nome, setNome] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { userId } = useAuth();

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Permissão para acessar a galeria é necessária");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImagem(result.assets[0].uri);
    }
  };

  const selecionarLocal = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setLatitude(latitude);
    setLongitude(longitude);
  };

  const handleCriarGrupo = async () => {
    try {
      if (!nome.trim()) {
        Alert.alert("Erro", "Digite o nome do grupo");
        return;
      }

      if (latitude === null || longitude === null) {
        Alert.alert("Erro", "Selecione um local no mapa");
        return;
      }

      if (!userId) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      setLoading(true);

      await criarGrupo(
        nome.trim(),
        userId,
        latitude,
        longitude,
        locationName.trim() || null,
        imagem,
      );

      Alert.alert("Sucesso", "Grupo criado com sucesso");

      router.back();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={handlePickImage}
          disabled={loading}
        >
          {imagem ? (
            <Image source={{ uri: imagem }} style={styles.image} />
          ) : (
            <Text style={styles.imageText}>Selecionar imagem</Text>
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Nome do grupo"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          editable={!loading}
        />

        <Text style={styles.mapLabel}>Selecione o local do encontro</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome do local"
          value={locationName}
          onChangeText={setLocationName}
          editable={!loading}
        />

        <View style={styles.mapContainer}>
          <CreateGroupMap
            style={styles.map}
            onPress={(event) => {
              if (!loading) {
                selecionarLocal(event);
              }
            }}
            latitude={latitude}
            longitude={longitude}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCriarGrupo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#303329" />
          ) : (
            <Text style={styles.buttonText}>Criar Grupo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a3c267",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  cancelButton: {
    marginTop: 14,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#35401A",
  },

  cancelButtonText: {
    color: "#35401A",
    fontWeight: "bold",
    fontSize: 16,
  },

  error: {
    color: "#B00020",
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "bold",
  },

  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#597317",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    overflow: "hidden",
    marginBottom: 24,
    marginTop: 20,
  },

  imageText: {
    color: "#303329",
    fontWeight: "bold",
    textAlign: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  input: {
    borderWidth: 1,
    borderColor: "#303329",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  mapLabel: {
    color: "#303329",
    fontWeight: "bold",
    marginBottom: 8,
  },
  mapContainer: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#597317",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#303329",
    fontWeight: "bold",
    fontSize: 16,
  },
});
