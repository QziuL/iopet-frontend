import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { CardInfo, LoadingState, EmptyState } from '@/components';
import { usePetsStore } from '@/store/pets.store';
import { usePets } from '@/hooks/usePets';
import { useTracking, useLocationHistory } from '@/hooks/useTracking';
import { useGeofences } from '@/hooks/useGeofencing';
import { useRouter } from 'expo-router';
import type { LocationPoint } from '@/types/tracking.types';

const { height } = Dimensions.get('window');

/**
 * Generates a self-contained Leaflet HTML page using OpenStreetMap tiles.
 * Renders the current pet location, route history, and a geofence polygon.
 */
function buildLeafletHTML(
  center: { lat: number; lng: number },
  routePoints: { lat: number; lng: number }[],
  geofencePoints: { lat: number; lng: number }[] = [],
): string {
  const routeJson = JSON.stringify(routePoints);
  const geofenceJson = JSON.stringify(geofencePoints);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0D0D14; }
    .leaflet-tile-pane { filter: brightness(0.7) saturate(0.6) hue-rotate(200deg); }
    .pet-marker {
      background: #7A3FFF;
      border: 3px solid #fff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 0 16px #7A3FFFaa;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      center: [${center.lat}, ${center.lng}],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Route polyline (purple)
    const route = ${routeJson};
    if (route.length > 1) {
      L.polyline(route.map(p => [p.lat, p.lng]), {
        color: '#9B6BFF',
        weight: 3,
        opacity: 0.85,
        dashArray: '6 4',
      }).addTo(map);
    }

    // Geofence polygon (purple border)
    const geofence = ${geofenceJson};
    if (geofence.length > 2) {
      L.polygon(geofence.map(p => [p.lat, p.lng]), {
        color: '#7A3FFF',
        weight: 2.5,
        opacity: 0.9,
        fillColor: '#7A3FFF',
        fillOpacity: 0.1,
      }).addTo(map);
    }

    // Pet marker
    const petIcon = L.divIcon({
      html: '<div class="pet-marker">🐾</div>',
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    L.marker([${center.lat}, ${center.lng}], { icon: petIcon })
      .addTo(map);

    // Past location dots
    route.slice(1).forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: 4,
        color: '#7A3FFF',
        fillColor: '#7A3FFF',
        fillOpacity: 0.5,
        weight: 1,
      }).addTo(map);
    });
  </script>
</body>
</html>
`;
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const petsStore = usePetsStore(s => s.pets);
  const activePetId = usePetsStore(s => s.activePetId);
  const setPets = usePetsStore(s => s.setPets);

  const { data: petsData } = usePets();

  React.useEffect(() => {
    if (petsData) setPets(petsData);
  }, [petsData, setPets]);

  const pets = petsData ?? petsStore;
  const activePet = pets.find(p => p.id === activePetId) ?? pets[0] ?? null;

  const { data: tracking, isLoading: loadingTracking, refetch } = useTracking(
    activePet?.id,
    !!activePet?.deviceId,
  );

  const { data: history } = useLocationHistory(
    activePet?.id,
    !!activePet?.deviceId,
  );

  const { data: geofences } = useGeofences(activePet?.id ?? '');

  if (!activePet) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing[4] }]}>
        <EmptyState
          icon="paw-outline"
          title="Nenhum pet selecionado"
          description="Selecione ou cadastre um pet para visualizar no mapa."
          action={
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => router.push('/pets/new' as any)}
            >
              <Text style={styles.refreshLabel}>+ Cadastrar pet</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  if (!activePet.deviceId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing[4] }]}>
        <EmptyState
          icon="hardware-chip-outline"
          title="Sem dispositivo vinculado"
          description={`Vincule um rastreador IoT ao pet ${activePet.name} para visualizar a localização em tempo real.`}
          action={
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => router.push('/settings/device-link' as any)}
            >
              <Text style={styles.refreshLabel}>Vincular dispositivo</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  if (loadingTracking || !tracking) {
    return <LoadingState message="Carregando rastreamento..." />;
  }

  const center = {
    lat: tracking.currentLocation.latitude,
    lng: tracking.currentLocation.longitude,
  };

  const routePoints = (history ?? []).map((p: LocationPoint) => ({
    lat: p.latitude,
    lng: p.longitude,
  }));

  const geofencePoints = (geofences?.[0]?.points ?? []).map(p => ({
    lat: p.latitude,
    lng: p.longitude,
  }));

  const html = buildLeafletHTML(center, routePoints, geofencePoints);

  return (
    <View style={styles.container}>
      {/* Map */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Leaflet Map"
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
        />
      )}

      {/* Floating header */}
      <View style={[styles.floatingHeader, { top: insets.top + Spacing[3] }]}>
        <CardInfo style={styles.petInfoCard}>
          <Text style={styles.petName}>{activePet?.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: tracking.signalStatus === 'online' ? Colors.state.success : Colors.state.offline },
              ]}
            />
            <Text style={styles.statusText}>
              {tracking.signalStatus === 'online' ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.battery}>{tracking.battery}% 🔋</Text>
          </View>
        </CardInfo>
      </View>

      {/* Bottom card */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <Text style={styles.timeLabel}>Agora</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color={Colors.primary.default} />
          <Text style={styles.address} numberOfLines={2}>
            {tracking.currentLocation.address ?? `${tracking.currentLocation.latitude.toFixed(4)}, ${tracking.currentLocation.longitude.toFixed(4)}`}
          </Text>
        </View>

        <View style={styles.bottomMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="radio-outline" size={14} color={Colors.text.tertiary} />
            <Text style={styles.metaText}>Precisão: {tracking.precision}m</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary.light} />
            <Text style={styles.refreshLabel}>Atualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zoom controls */}
      <View style={[styles.zoomControls, { bottom: 180 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => webViewRef.current?.injectJavaScript('map.zoomIn(); true;')}
        >
          <Ionicons name="add" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => webViewRef.current?.injectJavaScript('map.zoomOut(); true;')}
        >
          <Ionicons name="remove" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  map: { flex: 1 },

  floatingHeader: {
    position: 'absolute',
    left: Spacing[5],
    right: Spacing[5],
  },
  petInfoCard: {
    padding: Spacing[3] + 2,
    gap: Spacing[1],
  },
  petName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  battery: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    gap: Spacing[3],
    ...Shadows.lg,
  },
  timeLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  address: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    flex: 1,
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.primary.default,
  },
  refreshLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },

  zoomControls: {
    position: 'absolute',
    right: Spacing[5],
    gap: Spacing[2],
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.glass,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});
