import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { AppHeader, CardInfo, EmptyState, LoadingState } from '@/components';
import { usePet } from '@/hooks/usePets';
import { useLocationHistory } from '@/hooks/useTracking';
import { distanceBetween } from '@/utils/geofencing.utils';
import type { LocationPoint } from '@/types/tracking.types';

const { width } = Dimensions.get('window');

type TimeIntervalKey = 'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT';

interface TimeIntervalOption {
  key: TimeIntervalKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  startHour: number;
  endHour: number;
}

const INTERVAL_OPTIONS: TimeIntervalOption[] = [
  { key: 'ALL', label: 'Dia todo', icon: 'time-outline', startHour: 0, endHour: 23 },
  { key: 'MORNING', label: 'Manhã', icon: 'sunny-outline', startHour: 6, endHour: 12 },
  { key: 'AFTERNOON', label: 'Tarde', icon: 'partly-sunny-outline', startHour: 12, endHour: 18 },
  { key: 'NIGHT', label: 'Noite', icon: 'moon-outline', startHour: 18, endHour: 23 },
];

/**
 * Builds self-contained Leaflet HTML page tailored for trajectory display
 */
function buildTrajectoryMapHTML(
  points: { lat: number; lng: number; time: string; index: number }[],
  activeIndex: number | null
): string {
  if (points.length === 0) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #0D0D14; color: #A89DC0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
  </style>
</head>
<body>
  <p>Nenhum percurso registrado para este intervalo.</p>
</body>
</html>`;
  }

  const centerLat = points[0].lat;
  const centerLng = points[0].lng;
  const pointsJson = JSON.stringify(points);

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
    .leaflet-tile-pane { filter: brightness(0.65) saturate(0.65) hue-rotate(200deg); }
    
    .start-marker {
      background: #22C55E;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.8);
      color: #fff;
    }

    .end-marker {
      background: #EF4444;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.8);
      color: #fff;
    }

    .active-pet-marker {
      background: #7A3FFF;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 0 16px #9B6BFF;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); box-shadow: 0 0 22px #9B6BFF; }
      100% { transform: scale(1); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const points = ${pointsJson};
    const activeIdx = ${activeIndex !== null ? activeIndex : -1};

    const map = L.map('map', {
      center: [${centerLat}, ${centerLng}],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    if (points.length > 1) {
      // Background glow line
      L.polyline(points.map(p => [p.lat, p.lng]), {
        color: 'rgba(122, 63, 255, 0.4)',
        weight: 8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Main route polyline
      const routeLine = L.polyline(points.map(p => [p.lat, p.lng]), {
        color: '#9B6BFF',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Fit map bounds to encompass the entire trajectory
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    }

    // Intermediate markers (dots)
    points.forEach((p, idx) => {
      if (idx === 0 || idx === points.length - 1) return;
      L.circleMarker([p.lat, p.lng], {
        radius: 4,
        color: '#7A3FFF',
        fillColor: '#B57CFF',
        fillOpacity: 0.8,
        weight: 1.5,
      }).bindTooltip(p.time, { direction: 'top', offset: [0, -5] }).addTo(map);
    });

    // Start marker (First point)
    if (points.length > 0) {
      const start = points[0];
      const startIcon = L.divIcon({
        html: '<div class="start-marker">A</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([start.lat, start.lng], { icon: startIcon })
        .bindPopup('<b>Partida</b><br>' + start.time)
        .addTo(map);
    }

    // End marker (Last point)
    if (points.length > 1) {
      const end = points[points.length - 1];
      const endIcon = L.divIcon({
        html: '<div class="end-marker">B</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([end.lat, end.lng], { icon: endIcon })
        .bindPopup('<b>Chegada / Última</b><br>' + end.time)
        .addTo(map);
    }

    // Active playback marker (if playing or selected)
    if (activeIdx >= 0 && activeIdx < points.length) {
      const activePt = points[activeIdx];
      const activeIcon = L.divIcon({
        html: '<div class="active-pet-marker">🐾</div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([activePt.lat, activePt.lng], { icon: activeIcon, zIndexOffset: 1000 })
        .bindTooltip('Posição (' + activePt.time + ')', { permanent: true, direction: 'top' })
        .addTo(map);
    }
  </script>
</body>
</html>`;
}

export default function PetHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  const webViewRef = useRef<WebView>(null);

  // Date selection state (default: today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedInterval, setSelectedInterval] = useState<TimeIntervalKey>('ALL');

  // Trajectory playback animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);
  const [showPointsList, setShowPointsList] = useState<boolean>(false);

  // Fetch pet metadata
  const { data: pet, isLoading: loadingPet } = usePet(petId);

  // Date navigation helpers
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  }, [selectedDate]);

  function handlePrevDay() {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
    setPlaybackIndex(null);
    setIsPlaying(false);
  }

  function handleNextDay() {
    if (isToday) return;
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
    setPlaybackIndex(null);
    setIsPlaying(false);
  }

  function handleSetToday() {
    setSelectedDate(new Date());
    setPlaybackIndex(null);
    setIsPlaying(false);
  }

  function handleSetYesterday() {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setSelectedDate(y);
    setPlaybackIndex(null);
    setIsPlaying(false);
  }

  // Compute query filter parameters
  const queryParams = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const opt = INTERVAL_OPTIONS.find(o => o.key === selectedInterval);
    if (!opt || opt.key === 'ALL') {
      return {
        data: dateStr,
        inicio: `${dateStr}T00:00:00`,
        fim: `${dateStr}T23:59:59`,
        limite: 500,
      };
    }

    const startH = String(opt.startHour).padStart(2, '0');
    const endH = String(opt.endHour).padStart(2, '0');

    return {
      data: dateStr,
      inicio: `${dateStr}T${startH}:00:00`,
      fim: `${dateStr}T${endH}:59:59`,
      limite: 500,
    };
  }, [selectedDate, selectedInterval]);

  // Fetch location history for this pet and filter window
  const { data: rawHistory, isLoading: loadingHistory, refetch } = useLocationHistory(
    petId,
    !!pet?.deviceId,
    queryParams
  );

  // Normalize points (ensure sorted from oldest to newest)
  const trajectoryPoints = useMemo(() => {
    if (!rawHistory || rawHistory.length === 0) return [];

    const sorted = [...rawHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sorted.map((p, idx) => {
      const d = new Date(p.timestamp);
      const timeStr = !isNaN(d.getTime())
        ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '00:00';
      return {
        lat: p.latitude,
        lng: p.longitude,
        time: timeStr,
        timestamp: p.timestamp,
        address: p.address,
        index: idx,
      };
    });
  }, [rawHistory]);

  // Calculate metrics (total distance, duration, avg speed)
  const metrics = useMemo(() => {
    if (trajectoryPoints.length < 2) {
      return {
        distanceKm: 0,
        distanceFormatted: '0 m',
        durationFormatted: '0 min',
        avgSpeed: '0 km/h',
        totalPoints: trajectoryPoints.length,
      };
    }

    let meters = 0;
    for (let i = 0; i < trajectoryPoints.length - 1; i++) {
      meters += distanceBetween(
        { latitude: trajectoryPoints[i].lat, longitude: trajectoryPoints[i].lng },
        { latitude: trajectoryPoints[i + 1].lat, longitude: trajectoryPoints[i + 1].lng }
      );
    }

    const startTime = new Date(trajectoryPoints[0].timestamp).getTime();
    const endTime = new Date(trajectoryPoints[trajectoryPoints.length - 1].timestamp).getTime();
    const diffMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    const distanceKm = meters / 1000;
    const distanceFormatted = distanceKm >= 1 ? `${distanceKm.toFixed(2)} km` : `${Math.round(meters)} m`;

    const hoursDecimal = diffMinutes / 60;
    const speed = hoursDecimal > 0 ? (distanceKm / hoursDecimal).toFixed(1) : '0';

    return {
      distanceKm,
      distanceFormatted,
      durationFormatted,
      avgSpeed: `${speed} km/h`,
      totalPoints: trajectoryPoints.length,
    };
  }, [trajectoryPoints]);

  // Trajectory playback effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && trajectoryPoints.length > 1) {
      timer = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev === null || prev >= trajectoryPoints.length - 1) {
            setIsPlaying(false);
            return trajectoryPoints.length - 1;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlaying, trajectoryPoints.length]);

  function handleTogglePlay() {
    if (trajectoryPoints.length <= 1) return;
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (playbackIndex === null || playbackIndex >= trajectoryPoints.length - 1) {
        setPlaybackIndex(0);
      }
      setIsPlaying(true);
    }
  }

  // Format date display label
  const formattedDateLabel = useMemo(() => {
    if (isToday) return 'Hoje';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      selectedDate.getFullYear() === yesterday.getFullYear() &&
      selectedDate.getMonth() === yesterday.getMonth() &&
      selectedDate.getDate() === yesterday.getDate();
    if (isYesterday) return 'Ontem';

    return selectedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [selectedDate, isToday]);

  const html = useMemo(
    () => buildTrajectoryMapHTML(trajectoryPoints, playbackIndex),
    [trajectoryPoints, playbackIndex]
  );

  if (loadingPet) return <LoadingState message="Carregando histórico do pet..." />;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <AppHeader
        title="Histórico de Percurso"
        subtitle={pet ? `Trajeto de ${pet.name}` : undefined}
        showBack
      />

      {/* Date Navigation & Presets Bar */}
      <View style={styles.dateBar}>
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={[styles.presetChip, isToday && styles.presetChipActive]}
            onPress={handleSetToday}
          >
            <Text style={[styles.presetChipText, isToday && styles.presetChipTextActive]}>
              Hoje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetChip, formattedDateLabel === 'Ontem' && styles.presetChipActive]}
            onPress={handleSetYesterday}
          >
            <Text style={[styles.presetChipText, formattedDateLabel === 'Ontem' && styles.presetChipTextActive]}>
              Ontem
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateNavigator}>
          <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevDay}>
            <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.dateDisplay}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary.light} />
            <Text style={styles.dateText}>
              {formattedDateLabel} ({selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navArrowBtn, isToday && styles.navArrowBtnDisabled]}
            onPress={handleNextDay}
            disabled={isToday}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isToday ? Colors.text.tertiary : Colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Interval Tabs */}
      <View style={styles.intervalsRow}>
        {INTERVAL_OPTIONS.map(opt => {
          const active = selectedInterval === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.intervalTab, active && styles.intervalTabActive]}
              onPress={() => {
                setSelectedInterval(opt.key);
                setPlaybackIndex(null);
                setIsPlaying(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={14}
                color={active ? Colors.primary.light : Colors.text.tertiary}
              />
              <Text style={[styles.intervalLabel, active && styles.intervalLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Map Content */}
      <View style={styles.mapContainer}>
        {loadingHistory ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary.default} />
            <Text style={styles.loadingText}>Carregando trajeto do período...</Text>
          </View>
        ) : trajectoryPoints.length === 0 ? (
          <View style={styles.emptyMapContainer}>
            <EmptyState
              icon="map-outline"
              title="Sem trajeto registrado"
              description={`Nenhuma localização foi gravada para ${pet?.name ?? 'o pet'} no intervalo selecionado.`}
              action={
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                  <Ionicons name="refresh-outline" size={18} color={Colors.primary.light} />
                  <Text style={styles.retryBtnText}>Verificar novamente</Text>
                </TouchableOpacity>
              }
            />
          </View>
        ) : Platform.OS === 'web' ? (
          <iframe
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Trajetória do Pet"
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

        {/* Floating Zoom & Center Buttons */}
        {trajectoryPoints.length > 0 && (
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => webViewRef.current?.injectJavaScript('map.zoomIn(); true;')}
            >
              <Ionicons name="add" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => webViewRef.current?.injectJavaScript('map.zoomOut(); true;')}
            >
              <Ionicons name="remove" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Trajectory Metrics & Playback Panel */}
      {trajectoryPoints.length > 0 && (
        <CardInfo glow style={[styles.bottomCard, { paddingBottom: insets.bottom + Spacing[3] }] as any}>
          {/* Summary metrics header */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="navigate-outline" size={16} color={Colors.primary.light} />
              <Text style={styles.metricValue}>{metrics.distanceFormatted}</Text>
              <Text style={styles.metricLabel}>Distância</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={16} color={Colors.accent.cyan} />
              <Text style={styles.metricValue}>{metrics.durationFormatted}</Text>
              <Text style={styles.metricLabel}>Duração</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons name="speedometer-outline" size={16} color={Colors.state.warning} />
              <Text style={styles.metricValue}>{metrics.avgSpeed}</Text>
              <Text style={styles.metricLabel}>Vel. Média</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons name="location-outline" size={16} color={Colors.state.success} />
              <Text style={styles.metricValue}>{metrics.totalPoints}</Text>
              <Text style={styles.metricLabel}>Pontos</Text>
            </View>
          </View>

          {/* Interactive Playback bar */}
          <View style={styles.playbackRow}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={handleTogglePlay}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={Colors.white}
              />
            </TouchableOpacity>

            <View style={styles.playbackInfo}>
              <Text style={styles.playbackTitle}>
                {playbackIndex !== null
                  ? `Ponto ${playbackIndex + 1} de ${trajectoryPoints.length} · ${trajectoryPoints[playbackIndex]?.time}`
                  : 'Reproduzir trajeto no mapa'}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        playbackIndex !== null
                          ? ((playbackIndex + 1) / trajectoryPoints.length) * 100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.listToggleBtn}
              onPress={() => setShowPointsList(v => !v)}
            >
              <Ionicons
                name={showPointsList ? 'map-outline' : 'list-outline'}
                size={18}
                color={Colors.primary.light}
              />
              <Text style={styles.listToggleText}>
                {showPointsList ? 'Mapa' : 'Lista'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Points list expandable */}
          {showPointsList && (
            <ScrollView style={styles.pointsListScroll} showsVerticalScrollIndicator>
              {trajectoryPoints.map((pt, index) => {
                const isSelected = playbackIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.pointListItem, isSelected && styles.pointListItemActive]}
                    onPress={() => {
                      setPlaybackIndex(index);
                      setIsPlaying(false);
                      webViewRef.current?.injectJavaScript(`map.setView([${pt.lat}, ${pt.lng}], 17); true;`);
                    }}
                  >
                    <View style={styles.pointTimeBadge}>
                      <Text style={styles.pointTimeText}>{pt.time}</Text>
                    </View>
                    <View style={styles.pointCoordinates}>
                      <Text style={styles.coordText}>
                        {pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}
                      </Text>
                      {pt.address && (
                        <Text style={styles.addressText} numberOfLines={1}>
                          {pt.address}
                        </Text>
                      )}
                    </View>
                    {index === 0 && <Text style={styles.startBadge}>Início</Text>}
                    {index === trajectoryPoints.length - 1 && (
                      <Text style={styles.endBadge}>Fim</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </CardInfo>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  dateBar: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
    gap: Spacing[2],
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  presetChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  presetChipActive: {
    backgroundColor: Colors.primary.subtle,
    borderColor: Colors.primary.default,
  },
  presetChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  presetChipTextActive: {
    color: Colors.primary.light,
    fontFamily: FontFamily.semiBold,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.3,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  dateText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  intervalsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  intervalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  intervalTabActive: {
    backgroundColor: Colors.primary.subtle,
    borderColor: Colors.primary.default,
  },
  intervalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  intervalLabelActive: {
    color: Colors.primary.light,
    fontFamily: FontFamily.semiBold,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background.primary,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  loadingText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  emptyMapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    marginTop: Spacing[3],
  },
  retryBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },
  mapControls: {
    position: 'absolute',
    right: Spacing[4],
    top: Spacing[4],
    gap: Spacing[2],
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
  bottomCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    gap: Spacing[3],
    marginHorizontal: 0,
    borderBottomWidth: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  metricValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    marginTop: 2,
  },
  metricLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border.default,
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[1],
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
  playbackInfo: {
    flex: 1,
    gap: 6,
  },
  playbackTitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface.elevated,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.light,
    borderRadius: 3,
  },
  listToggleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: Spacing[2],
  },
  listToggleText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.primary.light,
  },
  pointsListScroll: {
    maxHeight: 180,
    marginTop: Spacing[2],
  },
  pointListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.md,
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  pointListItemActive: {
    backgroundColor: Colors.primary.subtle,
  },
  pointTimeBadge: {
    backgroundColor: Colors.surface.elevated,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  pointTimeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary.light,
  },
  pointCoordinates: {
    flex: 1,
  },
  coordText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
  },
  addressText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  startBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.state.success,
    backgroundColor: `${Colors.state.success}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  endBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.state.error,
    backgroundColor: `${Colors.state.error}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
