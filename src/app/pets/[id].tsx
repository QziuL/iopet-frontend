import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { CardInfo, ProfileAvatar, LoadingState, EmptyState, AppHeader } from '@/components';
import { usePet } from '@/hooks/usePets';
import { useTracking } from '@/hooks/useTracking';

const { width } = Dimensions.get('window');

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const PET_SIZE_LABELS: Record<string, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  giant: 'Gigante',
};

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  bird: 'Pássaro',
  rabbit: 'Coelho',
  other: 'Outro',
};

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: pet, isLoading } = usePet(id!);
  const { data: tracking } = useTracking(id, !!pet?.deviceId);

  const device = pet?.deviceId
    ? {
        id: pet.deviceId,
        deviceCode: pet.deviceId,
        petId: pet.id,
        petName: pet.name,
        status: tracking?.signalStatus ?? 'online',
        battery: tracking?.battery ?? 100,
      }
    : null;


  if (isLoading) return <LoadingState />;
  if (!pet) return (
    <EmptyState icon="paw-outline" title="Pet não encontrado" />
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <View style={[styles.hero, { paddingTop: insets.top + Spacing[2] }]}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + Spacing[3] }]}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Edit button */}
        <TouchableOpacity
          onPress={() => router.push(`/pets/edit/${id}` as any)}
          style={[styles.editBtn, { top: insets.top + Spacing[3] }]}
        >
          <Ionicons name="pencil-outline" size={18} color={Colors.primary.light} />
        </TouchableOpacity>

        {/* Avatar */}
        <ProfileAvatar
          uri={pet.avatarUrl}
          name={pet.name}
          size={100}
          online={tracking?.signalStatus === 'online'}
        />

        <Text style={styles.petName}>{pet.name}</Text>

        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  tracking?.signalStatus === 'online'
                    ? Colors.state.success
                    : Colors.state.offline,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {tracking?.signalStatus === 'online' ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Device status card */}
        {device && (
          <CardInfo glow style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIconWrapper}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={22}
                  color={Colors.primary.light}
                />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.deviceCode}</Text>
                <Text style={styles.deviceSub}>IoPet Tracker</Text>
              </View>
              <View style={styles.batteryPill}>
                <Ionicons
                  name="battery-half-outline"
                  size={16}
                  color={
                    device.battery > 50
                      ? Colors.battery.high
                      : device.battery > 20
                      ? Colors.battery.medium
                      : Colors.battery.low
                  }
                />
                <Text
                  style={[
                    styles.batteryText,
                    {
                      color:
                        device.battery > 50
                          ? Colors.battery.high
                          : device.battery > 20
                          ? Colors.battery.medium
                          : Colors.battery.low,
                    },
                  ]}
                >
                  {device.battery}%
                </Text>
              </View>
            </View>

            {/* Battery bar */}
            <View style={styles.batteryBar}>
              <View
                style={[
                  styles.batteryFill,
                  {
                    width: `${device.battery}%`,
                    backgroundColor:
                      device.battery > 50
                        ? Colors.battery.high
                        : device.battery > 20
                        ? Colors.battery.medium
                        : Colors.battery.low,
                  },
                ]}
              />
            </View>
          </CardInfo>
        )}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'location-outline' as const, label: 'Ver no mapa', onPress: () => router.push('/map' as any) },
            { icon: 'scan-outline' as const, label: 'Cerca virtual', onPress: () => router.push(`/geofencing/${id}` as any) },
            { icon: 'time-outline' as const, label: 'Histórico', onPress: () => router.push('/map' as any) },
          ].map(action => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color={Colors.primary.light} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Last location */}
        {tracking && (
          <CardInfo style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={18} color={Colors.primary.default} />
              <Text style={styles.locationTitle}>Última localização</Text>
            </View>
            <Text style={styles.locationAddr} numberOfLines={2}>
              {tracking.currentLocation.address ??
                `${tracking.currentLocation.latitude.toFixed(5)}, ${tracking.currentLocation.longitude.toFixed(5)}`}
            </Text>
            <View style={styles.locationMeta}>
              <Text style={styles.locationMetaText}>
                Precisão: {tracking.precision}m
              </Text>
              <Text style={styles.locationMetaText}>
                {new Date(tracking.currentLocation.timestamp).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </CardInfo>
        )}

        {/* Pet data */}
        <CardInfo>
          <Text style={styles.sectionLabel}>DADOS DO PET</Text>
          <InfoRow label="Espécie" value={SPECIES_LABELS[pet.species] ?? pet.species} />
          <View style={styles.divider} />
          <InfoRow label="Raça" value={pet.breed} />
          <View style={styles.divider} />
          <InfoRow label="Porte" value={PET_SIZE_LABELS[pet.size] ?? pet.size} />
          <View style={styles.divider} />
          <InfoRow label="Idade" value={`${pet.age} ano${pet.age !== 1 ? 's' : ''}`} />
          <View style={styles.divider} />
          <InfoRow label="Peso" value={`${pet.weight} kg`} />
          {pet.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.descBlock}>
                <Text style={styles.infoLabel}>Descrição</Text>
                <Text style={styles.description}>{pet.description}</Text>
              </View>
            </>
          )}
        </CardInfo>

        {/* Device section */}
        {!device && (
          <TouchableOpacity
            style={styles.linkDeviceBtn}
            onPress={() => router.push('/settings/device-link' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary.light} />
            <Text style={styles.linkDeviceText}>Vincular dispositivo IoT</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  hero: {
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    paddingBottom: Spacing[8],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: Spacing[3],
    ...Shadows.glowPrimary,
  },
  backBtn: {
    position: 'absolute',
    left: Spacing[5],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  editBtn: {
    position: 'absolute',
    right: Spacing[5],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  petName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    marginTop: Spacing[2],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1] + 2,
    backgroundColor: Colors.surface.elevated,
    paddingVertical: Spacing[1] + 2,
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  content: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    gap: Spacing[4],
  },

  deviceCard: { gap: Spacing[3] },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  deviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  deviceSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface.elevated,
    paddingVertical: 4,
    paddingHorizontal: Spacing[2] + 2,
    borderRadius: BorderRadius.full,
  },
  batteryText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },
  batteryBar: {
    height: 5,
    backgroundColor: Colors.surface.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },

  quickActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: Spacing[4],
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  locationCard: { gap: Spacing[3] },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  locationTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  locationAddr: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: FontSize.sm * 1.5,
  },
  locationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },

  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: Spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  infoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  descBlock: { paddingTop: Spacing[3], gap: Spacing[2] },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    lineHeight: FontSize.base * 1.6,
  },
  divider: { height: 1, backgroundColor: Colors.border.subtle },

  linkDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.primary.subtle,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    padding: Spacing[4],
  },
  linkDeviceText: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary.light,
  },
});
