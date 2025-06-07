import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// אייקון אדום (כטב"ם)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// אייקון כחול (מטוס אזרחי)
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ThreatMap({ droneCoords, flightCoords }) {
  if (!droneCoords || !droneCoords.latitude || !droneCoords.longitude) {
    return null;
  }

  const { latitude, longitude, radius } = droneCoords;

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={5}
      style={{
        height: '100%',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* מעגל רדיוס */}
      <Circle center={[latitude, longitude]} radius={radius * 1000} color="red" />

      {/* כטב"ם (אדום) */}
      <Marker position={[latitude, longitude]} icon={redIcon}>
        <Popup>📍 מיקום הכטב״ם (איום)</Popup>
      </Marker>

      {/* מטוס אזרחי (כחול) */}
      {flightCoords?.latitude && flightCoords?.longitude && (
        <Marker position={[flightCoords.latitude, flightCoords.longitude]} icon={blueIcon}>
          <Popup>✈️ מיקום המטוס הידידותי</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default ThreatMap;
