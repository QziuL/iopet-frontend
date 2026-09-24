import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { AppHeader, InputField, PrimaryButton, CardInfo } from '@/components';
import { usePetsStore } from '@/store/pets.store';
import { useLinkDevice } from '@/hooks/usePets';

export default function DeviceLinkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pets = usePetsStore(s => s.pets);
  const activePetId = usePetsStore(s => s.activePetId);
  const activePet = pets.find(p => p.id === activePetId) ?? null;
  const linkDevice = useLinkDevice();

  const [deviceCode, setDeviceCode] = useState('');
  const [linkKey, setLinkKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

  function validate() {
    const e: Record<string, string> = {};
    const code = deviceCode.trim();
    if (!code) {
      e.deviceCode = 'Endereço MAC é obrigatório';
    } else if (!MAC_REGEX.test(code)) {
      e.deviceCode = 'Formato inválido. Use o padrão MAC: AA:BB:CC:DD:EE:FF';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLink() {
    if (!validate()) return;
    if (!activePet) {
      if (Platform.OS === 'web') {
        window.alert('Atenção: Selecione um pet antes de vincular um dispositivo.');
      } else {
        Alert.alert('Atenção', 'Selecione um pet antes de vincular um dispositivo.');
      }
      return;
    }

    try {
      await linkDevice.mutateAsync({
        petId: activePet.id,
        deviceCode: deviceCode.trim().toUpperCase(),
      });
      if (Platform.OS === 'web') {
        window.alert(`Dispositivo vinculado!\n\nO dispositivo ${deviceCode.toUpperCase()} foi vinculado a ${activePet.name} com sucesso.`);
        router.back();
      } else {
        Alert.alert(
          'Dispositivo vinculado! 🎉',
          `O dispositivo ${deviceCode.toUpperCase()} foi vinculado a ${activePet.name} com sucesso.`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message ?? 'Não foi possível vincular o dispositivo.'}`);
      } else {
        Alert.alert('Erro', err.message ?? 'Não foi possível vincular o dispositivo.');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing[8] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="Vincular dispositivo"
          subtitle="Conecte um rastreador IoT ao seu pet"
          showBack
        />

        <View style={styles.body}>
          {/* Illustration card */}
          <CardInfo glow style={styles.illustrationCard}>
            <View style={styles.illustrationIcon}>
              <Ionicons name="hardware-chip-outline" size={48} color={Colors.primary.light} />
            </View>
            <View style={styles.illustrationText}>
              <Text style={styles.illustrationTitle}>Rastreador ESP32 GPS</Text>
              <Text style={styles.illustrationSub}>
                Insira o endereço MAC físico do seu protótipo (exibido no monitor serial ao ligar).
              </Text>
            </View>
          </CardInfo>

          {/* Selected pet indicator */}
          {activePet ? (
            <CardInfo style={styles.petIndicator}>
              <View style={styles.petRow}>
                <View style={styles.petIconWrapper}>
                  <Ionicons name="paw-outline" size={20} color={Colors.primary.light} />
                </View>
                <View style={styles.petTextBlock}>
                  <Text style={styles.petLabel}>Vinculando a</Text>
                  <Text style={styles.petName}>{activePet.name}</Text>
                </View>
                <View style={styles.petStatusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.state.success} />
                </View>
              </View>
            </CardInfo>
          ) : (
            <CardInfo style={styles.noPetWarning}>
              <View style={styles.petRow}>
                <Ionicons name="warning-outline" size={20} color={Colors.state.warning} />
                <Text style={styles.noPetText}>
                  Nenhum pet selecionado. Acesse Meus Pets e selecione um pet primeiro.
                </Text>
              </View>
            </CardInfo>
          )}

          {/* Form */}
          <InputField
            label="Endereço MAC do dispositivo"
            placeholder="Ex: 94:B5:55:2C:14:02"
            value={deviceCode}
            onChangeText={text => setDeviceCode(text.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.deviceCode}
            leftIcon={
              <Ionicons name="qr-code-outline" size={18} color={Colors.text.secondary} />
            }
          />

          {/* Steps guide */}
          <CardInfo style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Como vincular</Text>
            {[
              { n: '1', text: 'Ligue o protótipo ESP32-C3.' },
              { n: '2', text: 'Copie o MAC Address exibido no Monitor Serial (ou na etiqueta).' },
              { n: '3', text: 'Cole o endereço no campo acima (formato AA:BB:CC:DD:EE:FF).' },
              { n: '4', text: 'Toque em "Vincular dispositivo" para associar ao seu pet.' },
            ].map(step => (
              <View key={step.n} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.n}</Text>
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </CardInfo>

          <PrimaryButton
            label="Vincular dispositivo"
            onPress={handleLink}
            loading={linkDevice.isPending}
            disabled={!activePet}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: { gap: Spacing[5] },
  body: { paddingHorizontal: Spacing[5], gap: Spacing[4] },

  illustrationCard: {
    alignItems: 'center',
    gap: Spacing[4],
    paddingVertical: Spacing[6],
  },
  illustrationIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
  illustrationText: { alignItems: 'center', gap: Spacing[1] + 2 },
  illustrationTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  illustrationSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
  },

  petIndicator: { padding: Spacing[4] },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  petIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petTextBlock: { flex: 1 },
  petLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
  petName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  petStatusBadge: { alignItems: 'center', justifyContent: 'center' },

  noPetWarning: {
    backgroundColor: Colors.state.warningSubtle,
    borderColor: Colors.state.warning,
    padding: Spacing[4],
  },
  noPetText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.state.warning,
    lineHeight: FontSize.sm * 1.5,
  },

  stepsCard: { gap: Spacing[3] },
  stepsTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.primary.light,
  },
  stepText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: FontSize.sm * 1.6,
  },
});
