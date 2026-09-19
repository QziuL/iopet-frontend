import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/theme';
import { AppHeader, InputField, PrimaryButton, ProfileAvatar } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAuth } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Permita o acesso à galeria para alterar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erro: Nome é obrigatório.');
      } else {
        Alert.alert('Erro', 'Nome é obrigatório.');
      }
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUri || undefined,
      });
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        setAuth(updatedUser, currentToken);
      }
      if (Platform.OS === 'web') {
        window.alert('Perfil atualizado com sucesso.');
        router.back();
      } else {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message ?? 'Falha ao atualizar perfil.'}`);
      } else {
        Alert.alert('Erro', err.message ?? 'Falha ao atualizar perfil.');
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
        <AppHeader title="Editar Perfil" showBack />

        <View style={styles.body}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.8}>
            <ProfileAvatar uri={avatarUri} name={name} size={100} />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <InputField
            label="Nome completo"
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
          />

          <InputField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@exemplo.com"
            keyboardType="email-address"
          />

          <PrimaryButton label="Salvar alterações" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: { flexGrow: 1, gap: Spacing[5] },
  body: { paddingHorizontal: Spacing[5], gap: Spacing[5] },
  avatarContainer: { alignSelf: 'center', marginVertical: Spacing[4] },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary.default,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
});
