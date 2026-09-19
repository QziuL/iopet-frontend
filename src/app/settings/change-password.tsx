import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/theme';
import { AppHeader, PasswordField, PrimaryButton } from '@/components';
import { authService } from '@/services';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!currentPassword) e.currentPassword = 'Senha atual é obrigatória';
    if (newPassword.length < 6) e.newPassword = 'Mínimo de 6 caracteres';
    if (confirmPassword !== newPassword) e.confirmPassword = 'As senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      if (Platform.OS === 'web') {
        window.alert('Senha alterada com sucesso.');
        router.back();
      } else {
        Alert.alert('Sucesso', 'Senha alterada com sucesso.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message ?? 'Falha ao alterar senha.'}`);
      } else {
        Alert.alert('Erro', err.message ?? 'Falha ao alterar senha.');
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="Alterar Senha" showBack />

        <View style={styles.body}>
          <PasswordField
            label="Senha atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            error={errors.currentPassword}
          />

          <View style={styles.divider} />

          <PasswordField
            label="Nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            error={errors.newPassword}
          />

          <PasswordField
            label="Confirmar nova senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

          <View style={styles.mt}>
            <PrimaryButton label="Atualizar senha" onPress={handleSave} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flexGrow: 1, gap: Spacing[5] },
  body: { paddingHorizontal: Spacing[5], gap: Spacing[4] },
  divider: { height: Spacing[4] },
  mt: { marginTop: Spacing[2] },
});
