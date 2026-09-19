import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { CardInfo, ProfileAvatar, SectionTitle, LoadingState } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { usePetsStore } from '@/store/pets.store';
import { usePets } from '@/hooks/usePets';
import { useTracking } from '@/hooks/useTracking';
import { useAlerts } from '@/hooks/useAlerts';
import type { Alert } from '@/types/alert.types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  
  const petsStore = usePetsStore(s => s.pets);
  const activePetId = usePetsStore(s => s.activePetId);
  const setPets = usePetsStore(s => s.setPets);
  const setActivePet = usePetsStore(s => s.setActivePet);

  // Fetch pets via hook
  const { data: petsData, isLoading: loadingPets } = usePets();

  useEffect(() => {
    if (petsData) setPets(petsData);
  }, [petsData, setPets]);

  const pets = petsData ?? petsStore;
  const activePet = pets.find(p => p.id === activePetId) ?? pets[0] ?? null;

  // Fetch tracking for active pet
  const { data: tracking } = useTracking(activePet?.id, !!activePet?.deviceId);

  const { data: alerts } = useAlerts();
  const unreadCount = alerts?.filter((a: Alert) => !a.read).length ?? 0;


  if (loadingPets) return <LoadingState />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + Spacing[5], paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </Text>
          <Text style={styles.headerSub}>Aqui está o resumo do seu pet.</Text>
        </View>
        <ProfileAvatar
          uri={user?.avatarUrl}
          name={user?.name}
          size={44}
          online
        />
      </View>

      {/* Pet selector (if multiple pets) */}
      {pets.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsRow}>
          {pets.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setActivePet(p.id)}
              style={[
                styles.petChip,
                activePet?.id === p.id && styles.petChipActive,
              ]}
            >
              <ProfileAvatar uri={p.avatarUrl} name={p.name} size={28} />
              <Text style={[styles.petChipLabel, activePet?.id === p.id && styles.petChipLabelActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Pet Summary Card */}
      {activePet ? (
        <CardInfo glow style={styles.petCard}>
          <View style={styles.petCardHeader}>
            <ProfileAvatar
              uri={activePet.avatarUrl}
              name={activePet.name}
              size={60}
              online={tracking?.signalStatus === 'online'}
            />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{activePet.name}</Text>
              <View style={styles.statusRow}>
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
            {/* Battery */}
            {tracking && (
              <View style={styles.batteryBlock}>
                <Ionicons
                  name="battery-half-outline"
                  size={20}
                  color={
                    tracking.battery > 50
                      ? Colors.battery.high
                      : tracking.battery > 20
                      ? Colors.battery.medium
                      : Colors.battery.low
                  }
                />
                <Text style={styles.batteryText}>{tracking.battery}%</Text>
              </View>
            )}
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            {[
              { id: 'map', icon: 'location-outline' as const, label: 'Ver no mapa', route: '/map' },
              { id: 'geo', icon: 'scan-outline' as const, label: 'Cerca virtual', route: `/geofencing/${activePet.id}` },
              { id: 'history', icon: 'time-outline' as const, label: 'Histórico', route: '/map' },
              { id: 'alerts', icon: 'notifications-outline' as const, label: 'Alertas', route: '/alerts' },
            ].map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionItem}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={20} color={Colors.primary.light} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardInfo>
      ) : (
        // No pets yet
        <CardInfo style={styles.noPetCard}>
          <Text style={styles.noPetText}>Nenhum pet cadastrado.</Text>
          <TouchableOpacity
            style={styles.addPetBtn}
            onPress={() => router.push('/pets/new' as any)}
          >
            <Text style={styles.addPetBtnText}>+ Adicionar pet</Text>
          </TouchableOpacity>
        </CardInfo>
      )}

      {/* Last location */}
      {tracking && (
        <>
          <SectionTitle title="Última localização" />
          <CardInfo>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={Colors.primary.default} />
              </View>
              <View style={styles.locationText}>
                <Text style={styles.locationAddr} numberOfLines={2}>
                  {tracking.currentLocation.address ?? 'Localização disponível'}
                </Text>
                <Text style={styles.locationMeta}>
                  Precisão: {tracking.precision}m · Hoje,{' '}
                  {new Date(tracking.currentLocation.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </CardInfo>
        </>
      )}

      {/* Unread alerts */}
      {unreadCount > 0 && (
        <>
          <SectionTitle
            title="Alertas recentes"
            action={
              <TouchableOpacity onPress={() => router.push('/alerts' as any)}>
                <Text style={styles.seeAll}>Ver todos</Text>
              </TouchableOpacity>
            }
          />
          <CardInfo style={styles.alertBanner}>
            <View style={styles.alertRow}>
              <View style={styles.alertIconWrapper}>
                <Ionicons name="warning" size={20} color={Colors.state.warning} />
              </View>
              <Text style={styles.alertText}>
                Você tem {unreadCount} alerta{unreadCount > 1 ? 's' : ''} não lido{unreadCount > 1 ? 's' : ''}.
              </Text>
            </View>
          </CardInfo>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: { paddingHorizontal: Spacing[5], gap: Spacing[5] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  petsRow: { marginHorizontal: -Spacing[5] },

  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.surface.elevated,
    marginLeft: Spacing[5],
  },
  petChipActive: {
    borderColor: Colors.primary.default,
    backgroundColor: Colors.primary.subtle,
  },
  petChipLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  petChipLabelActive: { color: Colors.primary.light },

  petCard: { gap: Spacing[5] },
  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  petInfo: { flex: 1 },
  petName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] + 2, marginTop: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  batteryBlock: { alignItems: 'center', gap: 2 },
  batteryText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: { alignItems: 'center', gap: Spacing[2], flex: 1 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  noPetCard: { alignItems: 'center', gap: Spacing[4], paddingVertical: Spacing[8] },
  noPetText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  addPetBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[5],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.primary.default,
  },
  addPetBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1 },
  locationAddr: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  locationMeta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 3,
  },

  alertBanner: { backgroundColor: Colors.state.warningSubtle, borderColor: Colors.state.warning },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  alertIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.state.warningSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },

  seeAll: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },
});
