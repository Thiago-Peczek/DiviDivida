import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CreateGroupMapProps {
  onPress: (event: any) => void;
  latitude: number | null;
  longitude: number | null;
  style: any;
}

export default function CreateGroupMap({
  onPress,
  latitude,
  longitude,
  style,
}: CreateGroupMapProps) {
  const handleSimulateSelectLocation = () => {
    onPress({
      nativeEvent: {
        coordinate: {
          latitude: -25.4295963 + (Math.random() - 0.5) * 0.01,
          longitude: -49.2712724 + (Math.random() - 0.5) * 0.01,
        },
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleSimulateSelectLocation}
      style={[style, styles.webMapPlaceholder]}
    >
      <Ionicons name="map-outline" size={40} color="#303329" />
      <Text style={styles.webMapText}>
        {latitude && longitude
          ? "Localização Selecionada (Web)"
          : "Clique aqui para simular a seleção de local"}
      </Text>
      {latitude && longitude ? (
        <Text style={styles.webMapCoords}>
          Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webMapPlaceholder: {
    backgroundColor: "#D7E4B3",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#597317",
  },
  webMapText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#303329",
    marginTop: 6,
    textAlign: "center",
  },
  webMapCoords: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
  },
});
