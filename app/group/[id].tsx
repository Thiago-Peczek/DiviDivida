import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import { obterGrupo } from "@/services/grupoService";

import type { Grupo } from "@/types/database";
import MapView, { Marker } from "react-native-maps";

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [group, setGroup] = useState<Grupo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapExpanded, setMapExpanded] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  useEffect(() => {
    carregarGrupo();
  }, [id]);

  const carregarGrupo = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await obterGrupo(id);

      setGroup(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar grupo");
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

  if (error || !group) {
    return (
      <View style={styles.center}>
        <Text>{error || "Grupo não encontrado"}</Text>
      </View>
    );
  }

  const latitude = group.encontro_latitude ?? -25.4295963;

  const longitude = group.encontro_longitude ?? -49.2712724;

  const initialRegion = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: group.imagem_grupo_url || "https://via.placeholder.com/400",
          }}
          style={styles.image}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{group.nome}</Text>
        </View>
      </View>
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
      <View style={styles.content}>{/* conteúdo futuro */}</View>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#597317",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#a3c267",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#303329",
  },
  content: {
    flex: 1,
    padding: 20,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#303329",
  },
});
