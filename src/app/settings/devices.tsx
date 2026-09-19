import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { AppHeader, CardInfo, EmptyState, LoadingState, GlowIconButton } from '@/components';
import { useDevices } from '@/hooks/useDevices';
import type { Device } from '@/types/tracking.types';

function DeviceCard({ device }: { device: Device }) {
  const router = useRouter();
  const isAtivo = device.ativo ?? (device.status === 'online');

  const batteryColor =
    device.battery > 50
      ? Colors.battery.high
      : device.battery > 20
      ? Colors.battery.medium
      : Colors.battery.low;

  const batteryIcon =
    device.battery > 80
      ? 'battery-full-outline'
      : device.battery > 30
      ? 'battery-half-outline'
      : 'battery-dead-outline';

  const formattedDate = device.linkedAt
    ? new Date(device.linkedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Nunca';

  return (
    <CardInfo glow style={styles.deviceCard}>
      {/* Top row: Icon + MAC + Status badge */}
      <View style={styles.topRow}>
        <View style={styles.deviceIdent}>
          <View style={styles.iconCircle}>
            <Ionicons name="hardware-chip-outline" size={20} color={Colors.primary.light} />
          </View>
          <View>
            <Text style={styles.macAddress}>{device.deviceCode}</Text>
            <Text style={styles.deviceSubtitle}>Rastreador ESP32</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, isAtivo ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
          <View style={[styles.statusDot, isAtivo ? styles.statusDotActive : styles.statusDotInactive]} />
          <Text style={[styles.statusText, isAtivo ? styles.statusTextActive : styles.statusTextInactive]}>
            {isAtivo ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Middle row: Linked Pet & Battery */}
      <View style={styles.infoRow}>
        <View style={styles.petInfo}>
          <Ionicons name="paw-outline" size={16} color={Colors.text.tertiary} />
          <Text style={styles.petLabel}>
            Pet: <Text style={styles.petName}>{device.petName || 'Sem pet vinculado'}</Text>
          </Text>
        </View>

        <View style={styles.batteryPill}>
          <Ionicons name={batteryIcon} size={16} color={batteryColor} />
          <Text style={[styles.batteryText, { color: batteryColor }]}>
            {device.battery}%
          </Text>
        </View>
      </View>

      {/* Bottom row: Last seen & link action */}
      <View style={styles.bottomRow}>
        <View style={styles.lastSeenRow}>
          <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
          <Text style={styles.lastSeenText}>Última comunicação: {formattedDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.relinkBtn}
          onPress={() => router.push('/settings/device-link' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.relinkBtnText}>Gerenciar</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary.light} />
        </TouchableOpacity>
      </View>
    </CardInfo>
  );
}

export default function DevicesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: devices, isLoading, refetch, isRefetching } = useDevices();

  if (isLoading) return <LoadingState />;

  const count = devices?.length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="Meus Dispositivos"
        subtitle={count ? `${count} dispositivo${count > 1 ? 's' : ''} registrado${count > 1 ? 's' : ''}` : undefined}
        showBack
        rightSlot={
          <GlowIconButton
            icon={<Ionicons name="add" size={22} color={Colors.white} />}
            size={38}
            onPress={() => router.push('/settings/device-link' as any)}
          />
        }
      />

      {!devices?.length ? (
        <EmptyState
          icon="hardware-chip-outline"
          title="Nenhum dispositivo cadastrado"
          description="É necessário cadastrar um dispositivo para monitorar seus pets em tempo real."
          action={
            <TouchableOpacity
              style={styles.cadastrarBtn}
              onPress={() => router.push('/settings/device-link' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary.light} />
              <Text style={styles.cadastrarBtnText}>Cadastrar dispositivo</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DeviceCard device={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + Spacing[6] },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary.default}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  list: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  deviceCard: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceIdent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macAddress: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  deviceSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: `${Colors.state.success}18`,
    borderColor: Colors.state.success,
  },
  statusBadgeInactive: {
    backgroundColor: `${Colors.state.offline}18`,
    borderColor: Colors.state.offline,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: Colors.state.success,
  },
  statusDotInactive: {
    backgroundColor: Colors.state.offline,
  },
  statusText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  statusTextActive: {
    color: Colors.state.success,
  },
  statusTextInactive: {
    color: Colors.state.offline,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  petLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  petName: {
    fontFamily: FontFamily.semiBold,
    color: Colors.text.primary,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface.elevated,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  batteryText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[1],
  },
  lastSeenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastSeenText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
  relinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  relinkBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary.light,
  },
  cadastrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    marginTop: Spacing[2],
  },
  cadastrarBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },
});
