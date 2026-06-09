import React from "react";
import MapView, { Marker } from "react-native-maps";

interface MapWrapperProps {
  mapRef: React.RefObject<any>;
  mapExpanded: boolean;
  initialRegion: any;
  latitude: number;
  longitude: number;
  style: any;
}

export default function MapWrapper({
  mapRef,
  mapExpanded,
  initialRegion,
  latitude,
  longitude,
  style,
}: MapWrapperProps) {
  return (
    <MapView
      scrollEnabled={mapExpanded}
      zoomEnabled={mapExpanded}
      rotateEnabled={mapExpanded}
      pitchEnabled={mapExpanded}
      style={style}
      ref={mapRef}
      initialRegion={initialRegion}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
      />
    </MapView>
  );
}
