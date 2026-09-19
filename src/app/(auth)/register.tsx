import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/theme';
import { InputField, PasswordField, PrimaryButton } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(s => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome é obrigatório';
    if (!email.includes('@')) e.email = 'E-mail inválido';
    if (password.length < 6) e.password = 'Mínimo de 6 caracteres';
    if (confirm !== password) e.confirm = 'As senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setAuth(res.user, res.token);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message ?? 'Não foi possível criar a conta.'}`);
      } else {
        Alert.alert('Erro', err.message ?? 'Não foi possível criar a conta.');
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
          { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[8] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            {/* Avatar placeholder */}
            <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={28} color={Colors.text.secondary} />
              <Text style={styles.avatarLabel}>Adicionar foto</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Nome completo"
              placeholder="Seu nome"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              error={errors.name}
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.text.secondary}
                />
              }
            />

            <InputField
              label="E-mail"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.text.secondary}
                />
              }
            />

            <PasswordField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.text.secondary}
                />
              }
            />

            <PasswordField
              label="Confirmar senha"
              placeholder="Repita sua senha"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.text.secondary}
                />
              }
            />

            <PrimaryButton
              label="Cadastrar"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
              <Text style={styles.loginLink}> Entrar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    justifyContent: 'center',
  },
  animatedContainer: {
    gap: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing[2],
  },
  header: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  avatarBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: Spacing[3],
  },
  avatarLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  form: { gap: Spacing[4] },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  loginText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  loginLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },
});

