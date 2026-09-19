import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/theme';
import { CardInfo, ProfileAvatar, ToggleSwitchCard } from '@/components';
import { useAuthStore } from '@/store/auth.store';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingRow({ icon, label, onPress, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? Colors.state.error : Colors.primary.light}
        />
      </View>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {!destructive && (
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [metricSystem, setMetricSystem] = React.useState(true);

  function handleLogout() {
    const doLogout = () => {
      clearAuth();
      router.replace('/(auth)/login' as any);
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Sair da conta\n\nTem certeza que deseja sair?');
      if (confirmLogout) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Sair da conta',
        'Tem certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: doLogout,
          },
        ],
      );
    }
  }


  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + Spacing[5], paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile card */}
      <CardInfo glow style={styles.profileCard}>
        <View style={styles.profileRow}>
          <ProfileAvatar uri={user?.avatarUrl} name={user?.name} size={68} online />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/settings/edit-profile' as any)}>
            <Ionicons name="pencil-outline" size={18} color={Colors.primary.light} />
          </TouchableOpacity>
        </View>
      </CardInfo>

      {/* Conta */}
      <Text style={styles.sectionLabel}>CONTA</Text>
      <CardInfo>
        <SettingRow icon="person-outline" label="Editar perfil" onPress={() => router.push('/settings/edit-profile' as any)} />
        <View style={styles.divider} />
        <SettingRow icon="lock-closed-outline" label="Alterar senha" onPress={() => router.push('/settings/change-password' as any)} />
        <View style={styles.divider} />
        <SettingRow icon="shield-outline" label="Segurança" />
      </CardInfo>

      {/* Dispositivos */}
      <Text style={styles.sectionLabel}>DISPOSITIVOS</Text>
      <CardInfo>
        <SettingRow
          icon="hardware-chip-outline"
          label="Meus dispositivos"
          onPress={() => router.push('/settings/devices' as any)}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="add-circle-outline"
          label="Vincular novo dispositivo"
          onPress={() => router.push('/settings/device-link' as any)}
        />
      </CardInfo>

      {/* Preferências */}
      <Text style={styles.sectionLabel}>PREFERÊNCIAS</Text>
      <CardInfo style={{ padding: 0 }}>
        <ToggleSwitchCard
          label="Notificações push"
          description="Alertas de fuga e bateria"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          icon={<Ionicons name="notifications-outline" size={18} color={Colors.primary.light} />}
          style={{ paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[2] }}
        />
        <View style={styles.divider} />
        <ToggleSwitchCard
          label="Sistema métrico"
          description={metricSystem ? "Usando kg e km" : "Usando lb e milhas"}
          value={metricSystem}
          onValueChange={setMetricSystem}
          icon={<Ionicons name="resize-outline" size={18} color={Colors.primary.light} />}
          style={{ paddingHorizontal: Spacing[4], paddingBottom: Spacing[4], paddingTop: Spacing[2] }}
        />
      </CardInfo>

      {/* Sobre */}
      <Text style={styles.sectionLabel}>SOBRE</Text>
      <CardInfo>
        <SettingRow icon="help-circle-outline" label="Ajuda" />
        <View style={styles.divider} />
        <SettingRow icon="information-circle-outline" label="Sobre o IoPet" />
      </CardInfo>

      {/* Logout */}
      <CardInfo style={styles.logoutCard}>
        <SettingRow
          icon="log-out-outline"
          label="Sair da conta"
          onPress={handleLogout}
          destructive
        />
      </CardInfo>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: { paddingHorizontal: Spacing[5], gap: Spacing[4] },

  profileCard: { padding: Spacing[5] },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  profileInfo: { flex: 1 },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
  },
  email: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: -Spacing[1],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: Colors.state.errorSubtle,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  rowLabelDestructive: { color: Colors.state.error },
  divider: { height: 1, backgroundColor: Colors.border.subtle },
  logoutCard: { marginTop: Spacing[2] },
});
