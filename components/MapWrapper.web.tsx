import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MapWrapperProps {
  mapRef: React.RefObject<any>;
  mapExpanded: boolean;
  initialRegion: any;
  latitude: number;
  longitude: number;
  style: any;
}

export default function MapWrapper({
  style,
  latitude,
  longitude,
}: MapWrapperProps) {
  return (
    <View style={[style, styles.webMapPlaceholder]}>
      <Ionicons name="map-outline" size={32} color="#303329" />
      <Text style={styles.webMapText}>Mapa (Web Preview)</Text>
      <Text style={styles.webMapCoords}>
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapPlaceholder: {
    backgroundColor: "#D7E4B3",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#597317",
  },
  webMapText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#303329",
    marginTop: 4,
  },
  webMapCoords: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 2,
  },
});
