import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { AppHeader, InputField, PrimaryButton, CardInfo } from '@/components';
import { useCreatePet } from '@/hooks/usePets';
import { usePetsStore } from '@/store/pets.store';
import type { PetSpecies, PetSize } from '@/types/pet.types';
import { pickProfileImage } from '@/utils/image.utils';

type SpeciesOption = { key: PetSpecies; label: string; emoji: string };
type SizeOption = { key: PetSize; label: string };

const SPECIES: SpeciesOption[] = [
  { key: 'dog', label: 'Cachorro', emoji: '🐶' },
  { key: 'cat', label: 'Gato', emoji: '🐱' },
  { key: 'bird', label: 'Pássaro', emoji: '🐦' },
  { key: 'rabbit', label: 'Coelho', emoji: '🐰' },
  { key: 'other', label: 'Outro', emoji: '🐾' },
];

const SIZES: SizeOption[] = [
  { key: 'small', label: 'Pequeno' },
  { key: 'medium', label: 'Médio' },
  { key: 'large', label: 'Grande' },
  { key: 'giant', label: 'Gigante' },
];

export default function NewPetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createPet = useCreatePet();
  const addPet = usePetsStore(s => s.addPet);

  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [size, setSize] = useState<PetSize>('medium');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handlePickImage() {
    try {
      const uri = await pickProfileImage();
      if (uri) {
        setAvatarUri(uri);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert('Permissão necessária: Permita acesso à galeria para adicionar foto.');
      } else {
        Alert.alert('Permissão necessária', 'Permita acesso à galeria para adicionar foto.');
      }
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome é obrigatório';
    if (!breed.trim()) e.breed = 'Raça é obrigatória';
    if (!age || isNaN(Number(age)) || Number(age) <= 0) e.age = 'Idade inválida';
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) e.weight = 'Peso inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      const pet = await createPet.mutateAsync({
        name: name.trim(),
        species,
        breed: breed.trim(),
        size,
        age: Number(age),
        weight: Number(weight),
        description: description.trim() || undefined,
        avatarUrl: avatarUri,
      });
      addPet(pet);
      if (Platform.OS === 'web') {
        window.alert(`Pet cadastrado!\n\n${pet.name} foi adicionado com sucesso.`);
        router.back();
      } else {
        Alert.alert('Pet cadastrado!', `${pet.name} foi adicionado com sucesso.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Erro: Não foi possível cadastrar o pet.');
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar o pet.');
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          title="Cadastrar novo pet"
          subtitle="Informe os dados do seu pet"
          showBack
        />

        <View style={styles.body}>
          {/* Photo picker */}
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <>
                <View style={styles.avatarIconWrapper}>
                  <Ionicons name="camera-outline" size={28} color={Colors.text.secondary} />
                </View>
                <Text style={styles.avatarLabel}>Adicionar foto</Text>
              </>
            )}
            {avatarUri && (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <InputField
            label="Nome do pet"
            placeholder="Ex: Thor"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          {/* Species selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Espécie</Text>
            <View style={styles.speciesGrid}>
              {SPECIES.map(s => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setSpecies(s.key)}
                  style={[
                    styles.speciesChip,
                    species === s.key && styles.speciesChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.speciesEmoji}>{s.emoji}</Text>
                  <Text
                    style={[
                      styles.speciesLabel,
                      species === s.key && styles.speciesLabelActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Breed + Size row */}
          <View style={styles.rowFields}>
            <View style={styles.rowField}>
              <InputField
                label="Raça"
                placeholder="Ex: Golden Retriever"
                value={breed}
                onChangeText={setBreed}
                error={errors.breed}
              />
            </View>
            <View style={styles.rowFieldSm}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Porte</Text>
                <View style={styles.sizeGrid}>
                  {SIZES.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setSize(s.key)}
                      style={[
                        styles.sizeChip,
                        size === s.key && styles.sizeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeLabel,
                          size === s.key && styles.sizeLabelActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Age + Weight */}
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Idade (anos)"
                placeholder="Ex: 3"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                error={errors.age}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Peso (kg)"
                placeholder="Ex: 28"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                error={errors.weight}
              />
            </View>
          </View>

          {/* Description */}
          <InputField
            label="Descrição (opcional)"
            placeholder="Características, cor, comportamento..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />

          {/* Save */}
          <PrimaryButton
            label="Salvar"
            onPress={handleSave}
            loading={createPet.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background.primary },
  container: { gap: Spacing[5] },
  body: { paddingHorizontal: Spacing[5], gap: Spacing[5] },

  avatarBtn: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'visible',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarIconWrapper: { alignItems: 'center' },
  avatarLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.secondary,
  },

  fieldGroup: { gap: Spacing[2] },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1] + 2,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  speciesChipActive: {
    backgroundColor: Colors.primary.subtle,
    borderColor: Colors.primary.default,
  },
  speciesEmoji: { fontSize: 16 },
  speciesLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  speciesLabelActive: { color: Colors.primary.light },

  rowFields: { flexDirection: 'row', gap: Spacing[3] },
  rowField: { flex: 2 },
  rowFieldSm: { flex: 1 },

  sizeGrid: { gap: Spacing[1] + 2 },
  sizeChip: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    alignItems: 'center',
  },
  sizeChipActive: {
    backgroundColor: Colors.primary.subtle,
    borderColor: Colors.primary.default,
  },
  sizeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  sizeLabelActive: { color: Colors.primary.light },

  textarea: { minHeight: 80, textAlignVertical: 'top' } as any,
});
