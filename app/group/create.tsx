import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { criarGrupo } from "@/services/grupoService";
import { router } from "expo-router";

import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

export default function CreateGroupScreen() {
  const [nome, setNome] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState("");

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

  const selecionarLocal = (event: MapPressEvent) => {
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

      if (!latitude || !longitude) {
        Alert.alert("Erro", "Selecione um local no mapa");
        return;
      }

      if (!userId) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      await criarGrupo(nome, userId, latitude, longitude, imagem);

      Alert.alert("Sucesso", "Grupo criado com sucesso");

      router.back();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao criar grupo");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
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
      />

      <Text style={styles.mapLabel}>Selecione o local do encontro</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          onPress={selecionarLocal}
          initialRegion={{
            latitude: -25.4295963,
            longitude: -49.2712724,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {latitude && longitude && (
            <Marker
              coordinate={{
                latitude,
                longitude,
              }}
            />
          )}
        </MapView>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCriarGrupo}>
        <Text style={styles.buttonText}>Criar Grupo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a3c267",
    padding: 20,
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
    marginTop: 40,
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
