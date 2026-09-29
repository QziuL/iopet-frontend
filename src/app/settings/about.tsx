import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { AppHeader, CardInfo } from '@/components';

interface FeatureHighlight {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FEATURES: FeatureHighlight[] = [
  {
    icon: 'navigate-circle-outline',
    title: 'Rastreamento Contínuo',
    description:
      'Captura e processa coordenadas geográficas enviadas pelo hardware vestível em tempo real.',
  },
  {
    icon: 'scan-outline',
    title: 'Cerca Virtual (Geofencing)',
    description:
      'Delimitação intuitiva de perímetros seguros no mapa com validação espacial PostGIS.',
  },
  {
    icon: 'notifications-outline',
    title: 'Alertas Proativos',
    description:
      'Disparo automático de notificações para emergências de fuga e níveis críticos de bateria (<= 20%).',
  },
  {
    icon: 'time-outline',
    title: 'Histórico e Telemetria',
    description:
      'Auditoria de rotas, movimentação cronológica e monitoramento de saúde do dispositivo.',
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <AppHeader title="Sobre o IoPet" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Hero Card */}
        <CardInfo glow style={styles.heroCard}>
          <View style={styles.logoBadge}>
            <Ionicons name="paw" size={38} color={Colors.white} />
          </View>
          <Text style={styles.appName}>IoPet</Text>
          <Text style={styles.appTagline}>
            Sistema de Monitoramento e Rastreamento Inteligente de Pets
          </Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Versão 1.0.0 (Release)</Text>
          </View>
        </CardInfo>

        {/* Overview text */}
        <Text style={styles.sectionTitle}>VISÃO GERAL</Text>
        <CardInfo style={styles.textCard}>
          <Text style={styles.paragraph}>
            O <Text style={styles.bold}>IoPet</Text> é uma plataforma integrada de Internet das Coisas (IoT)
            e inteligência geoespacial concebida para garantir a segurança, localização em tempo real e bem-estar
            de animais de estimação.
          </Text>
          <Text style={styles.paragraph}>
            Unindo dispositivos vestíveis (coleiras inteligentes com microcontrolador ESP32-C3),
            mensageria assíncrona orientada a eventos e processamento espacial avançado, o ecossistema permite que
            tutores monitorem com precisão a localização de seus animais e recebam alertas instantâneos de emergência.
          </Text>
        </CardInfo>

        {/* Pillars / Features */}
        <Text style={styles.sectionTitle}>DESTAQUES TECNOLÓGICOS</Text>
        <View style={styles.featuresList}>
          {FEATURES.map((item, index) => (
            <CardInfo key={index} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureIconCircle}>
                  <Ionicons name={item.icon} size={22} color={Colors.primary.light} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDescription}>{item.description}</Text>
                </View>
              </View>
            </CardInfo>
          ))}
        </View>

        {/* Architecture details */}
        <Text style={styles.sectionTitle}>ARQUITETURA DO SISTEMA</Text>
        <CardInfo style={styles.techCard}>
          <View style={styles.techRow}>
            <Ionicons name="hardware-chip-outline" size={18} color={Colors.primary.light} />
            <Text style={styles.techLabel}>
              Hardware IoT:{' '}
              <Text style={styles.techValue}>ESP32-C3 + GPS GNSS</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.techRow}>
            <Ionicons name="repeat-outline" size={18} color={Colors.primary.light} />
            <Text style={styles.techLabel}>
              Mensageria:{' '}
              <Text style={styles.techValue}>RabbitMQ (Protocolo MQTT/AMQP)</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.techRow}>
            <Ionicons name="server-outline" size={18} color={Colors.primary.light} />
            <Text style={styles.techLabel}>
              Backend API:{' '}
              <Text style={styles.techValue}>Java 21 · Spring Boot 3 · Spring Security</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.techRow}>
            <Ionicons name="earth-outline" size={18} color={Colors.primary.light} />
            <Text style={styles.techLabel}>
              Banco de Dados Espacial:{' '}
              <Text style={styles.techValue}>PostgreSQL + PostGIS</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.techRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary.light} />
            <Text style={styles.techLabel}>
              Frontend Mobile:{' '}
              <Text style={styles.techValue}>React Native · Expo 57 · TypeScript</Text>
            </Text>
          </View>
        </CardInfo>

        {/* Academic / Author info */}
        <Text style={styles.sectionTitle}>CRÉDITOS</Text>
        <CardInfo style={styles.creditsCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>LQ</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>Luiz Fernando Quinholi Mendes</Text>
              <Text style={styles.authorDegree}>
                Trabalho de Conclusão de Curso (TCC)
              </Text>
              <Text style={styles.authorSub}>
                Tecnologia em Análise e Desenvolvimento de Sistemas (TADS)
              </Text>
            </View>
          </View>
        </CardInfo>

        <Text style={styles.copyright}>
          © 2026 IoPet. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    gap: Spacing[2],
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
    ...Shadows.glowPrimary,
  },
  appName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
    lineHeight: 20,
  },
  versionPill: {
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  versionText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary.light,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    letterSpacing: 1,
    marginTop: Spacing[2],
  },
  textCard: {
    gap: Spacing[3],
  },
  paragraph: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  bold: {
    fontFamily: FontFamily.bold,
    color: Colors.text.primary,
  },
  featuresList: {
    gap: Spacing[3],
  },
  featureCard: {
    padding: Spacing[4],
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.subtle,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureInfo: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  featureDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  techCard: {
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[1],
  },
  techLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  techValue: {
    fontFamily: FontFamily.semiBold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
  },
  creditsCard: {
    padding: Spacing[4],
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary.light,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.white,
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  authorDegree: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary.light,
  },
  authorSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
  copyright: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing[2],
  },
});
