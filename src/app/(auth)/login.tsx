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
import { InputField, PasswordField, PrimaryButton, SecondaryButton } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(s => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
    const e: typeof errors = {};
    if (!email) e.email = 'E-mail é obrigatório';
    else if (!email.includes('@')) e.email = 'E-mail inválido';
    if (!password) e.password = 'Senha é obrigatória';
    else if (password.length < 6) e.password = 'Mínimo de 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      setAuth(res.user, res.token);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${err.message ?? 'Não foi possível fazer login.'}`);
      } else {
        Alert.alert('Erro', err.message ?? 'Não foi possível fazer login.');
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
          {/* Header with glowing Paw Logo */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Text style={styles.pawEmoji}>🐾</Text>
            </View>
            <Text style={styles.appName}>
              Io<Text style={styles.accent}>Pet</Text>
            </Text>
            <Text style={styles.title}>Bem-vindo de volta! 👋</Text>
            <Text style={styles.subtitle}>Entre para continuar</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <PrimaryButton
              label="Entrar"
              onPress={handleLogin}
              loading={loading}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>ou</Text>
              <View style={styles.line} />
            </View>

            <SecondaryButton
              label="Cadastrar nova conta"
              onPress={() => router.push('/(auth)/register' as any)}
            />
          </View>

          {/* Footer */}
          <Text style={styles.terms}>
            Ao continuar, você concorda com os{' '}
            <Text style={styles.link}>Termos de Uso</Text>
            {' '}e{' '}
            <Text style={styles.link}>Política de Privacidade</Text>
          </Text>
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
    gap: Spacing[6],
    paddingVertical: Spacing[4],
  },
  header: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: Spacing[2],
  },
  pawEmoji: {
    fontSize: 34,
  },
  appName: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing[2],
  },
  accent: { color: Colors.primary.default },
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
  form: { gap: Spacing[5] },
  forgotBtn: { alignSelf: 'flex-start', marginTop: -Spacing[2] },
  forgotText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary.light,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  line: { flex: 1, height: 1, backgroundColor: Colors.border.default },
  orText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
  },
  terms: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.6,
    marginTop: Spacing[4],
  },
  link: { color: Colors.primary.light },
});

