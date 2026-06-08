import React from "react";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

interface CreateGroupMapProps {
  onPress: (event: MapPressEvent) => void;
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
  return (
    <MapView
      style={style}
      onPress={onPress}
      initialRegion={{
        latitude: -25.4633,
        longitude: -49.2353,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {latitude !== null && longitude !== null && (
        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
        />
      )}
    </MapView>
  );
}
