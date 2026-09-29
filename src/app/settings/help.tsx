import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/theme';
import { AppHeader, CardInfo, InputField, PrimaryButton } from '@/components';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'Como funciona o rastreamento em tempo real?',
    answer:
      'A coleira inteligente com ESP32-C3 obtém coordenadas GPS e as transmite via telemetria assíncrona. O sistema processa os dados e exibe a localização exata do seu pet no mapa.',
  },
  {
    id: '2',
    question: 'O que é a Cerca Virtual (Geofencing)?',
    answer:
      'A cerca virtual é um perímetro delimitado por você no mapa. Sempre que o pet sair da área segura configurada, você receberá um alerta automático imediato.',
  },
  {
    id: '3',
    question: 'Quando o dispositivo é considerado Offline?',
    answer:
      'O dispositivo é marcado como Offline quando não envia telemetria há mais de 30 minutos ou quando estiver desligado/sem conexão de sinal.',
  },
  {
    id: '4',
    question: 'Como vincular um novo dispositivo?',
    answer:
      'No menu Perfil, acesse "Vincular novo dispositivo", selecione o pet desejado e informe o endereço MAC gravado na coleira inteligente (ex: AA:BB:CC:DD:EE:FF).',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleOpenWhatsApp() {
    const url = 'https://wa.me/5541999999999?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20IoPet.';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showAlert('Aviso', 'Não foi possível abrir o WhatsApp neste dispositivo.');
      }
    } catch {
      showAlert('Erro', 'Ocorreu um erro ao tentar abrir o WhatsApp.');
    }
  }

  async function handleOpenEmail() {
    const emailUrl = 'mailto:suporte@iopet.com.br?subject=Suporte%20IoPet';
    try {
      await Linking.openURL(emailUrl);
    } catch {
      showAlert('Erro', 'Não foi possível abrir o cliente de e-mail.');
    }
  }

  function showAlert(title: string, msg: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  }

  function handleSendMessage() {
    if (!subject.trim() || !message.trim()) {
      showAlert('Atenção', 'Preencha o assunto e a mensagem antes de enviar.');
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubject('');
      setMessage('');
      showAlert('Mensagem enviada!', 'Recebemos seu contato e nossa equipe responderá em breve.');
    }, 600);
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <AppHeader title="Ajuda e Contato" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact direct buttons */}
        <Text style={styles.sectionTitle}>FALE CONOSCO</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleOpenEmail}
            activeOpacity={0.8}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: `${Colors.primary.default}20` }]}>
              <Ionicons name="mail-outline" size={24} color={Colors.primary.light} />
            </View>
            <Text style={styles.contactLabel}>E-mail</Text>
            <Text style={styles.contactValue}>suporte@iopet.com.br</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleOpenWhatsApp}
            activeOpacity={0.8}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: `${Colors.state.success}20` }]}>
              <Ionicons name="logo-whatsapp" size={24} color={Colors.state.success} />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>(41) 99999-9999</Text>
          </TouchableOpacity>
        </View>

        {/* Message form */}
        <Text style={styles.sectionTitle}>ENVIAR MENSAGEM</Text>
        <CardInfo style={styles.formCard}>
          <Text style={styles.formSubtitle}>
            Dúvidas, sugestões ou problemas técnicos? Envie-nos uma mensagem direta.
          </Text>

          <InputField
            label="Assunto"
            placeholder="Ex: Dúvida sobre conexão da coleira"
            value={subject}
            onChangeText={setSubject}
          />

          <InputField
            label="Mensagem"
            placeholder="Descreva detalhadamente o ocorrido ou sua dúvida..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />

          <PrimaryButton
            label="Enviar mensagem"
            onPress={handleSendMessage}
            loading={sending}
          />
        </CardInfo>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>PERGUNTAS FREQUENTES</Text>
        <CardInfo style={styles.faqCard}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <View key={faq.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.primary.light}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </View>
            );
          })}
        </CardInfo>
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
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    letterSpacing: 1,
    marginTop: Spacing[2],
  },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
  },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  contactValue: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    gap: Spacing[4],
  },
  formSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  faqCard: {
    paddingVertical: Spacing[2],
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  faqQuestion: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  faqAnswer: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
    paddingBottom: Spacing[3],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
  },
});
