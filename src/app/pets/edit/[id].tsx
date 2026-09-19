import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '@/theme';
import { AppHeader, InputField, PrimaryButton, LoadingState, EmptyState } from '@/components';
import { usePet, useUpdatePet, useDeletePet } from '@/hooks/usePets';
import { usePetsStore } from '@/store/pets.store';
import type { PetSpecies, PetSize } from '@/types/pet.types';

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

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: pet, isLoading } = usePet(id!);
  const updatePet = useUpdatePet(id!);
  const deletePet = useDeletePet();
  const removePetFromStore = usePetsStore(s => s.removePet);
  const updatePetInStore = usePetsStore(s => s.updatePet);

  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [size, setSize] = useState<PetSize>('medium');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pet) {
      setName(pet.name ?? '');
      setSpecies(pet.species ?? 'dog');
      setBreed(pet.breed ?? '');
      setSize(pet.size ?? 'medium');
      setAge(pet.age != null ? String(pet.age) : '');
      setWeight(pet.weight != null ? String(pet.weight) : '');
      setDescription(pet.description ?? '');
      setAvatarUri(pet.avatarUrl);
    }
  }, [pet]);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        window.alert('Permissão necessária: Permita acesso à galeria para alterar foto.');
      } else {
        Alert.alert('Permissão necessária', 'Permita acesso à galeria para alterar foto.');
      }
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
    if (!validate() || !id) return;

    try {
      const updated = await updatePet.mutateAsync({
        name: name.trim(),
        species,
        breed: breed.trim(),
        size,
        age: Number(age),
        weight: Number(weight),
        description: description.trim() || undefined,
        avatarUrl: avatarUri,
      });
      updatePetInStore(id, updated);

      if (Platform.OS === 'web') {
        window.alert('Sucesso: Pet atualizado com sucesso.');
        router.back();
      } else {
        Alert.alert('Sucesso', 'Pet atualizado com sucesso.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Erro: Não foi possível atualizar o pet.');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o pet.');
      }
    }
  }

  function handleDelete() {
    if (!id) return;

    const doDelete = async () => {
      try {
        await deletePet.mutateAsync(id);
        removePetFromStore(id);
        if (Platform.OS === 'web') {
          window.alert('Pet removido com sucesso.');
          router.replace('/(tabs)' as any);
        } else {
          Alert.alert('Pet removido', 'Pet removido com sucesso.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
          ]);
        }
      } catch {
        if (Platform.OS === 'web') {
          window.alert('Erro: Não foi possível remover o pet.');
        } else {
          Alert.alert('Erro', 'Não foi possível remover o pet.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Remover ${pet?.name ?? 'pet'}?\n\nEsta ação não poderá ser desfeita.`);
      if (confirmed) doDelete();
    } else {
      Alert.alert(
        `Remover ${pet?.name ?? 'pet'}`,
        'Esta ação não poderá ser desfeita. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: doDelete },
        ],
      );
    }
  }

  if (isLoading) return <LoadingState />;
  if (!pet) return <EmptyState icon="paw-outline" title="Pet não encontrado" />;

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
          title="Editar pet"
          subtitle="Atualize as informações do seu pet"
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
            label="Salvar alterações"
            onPress={handleSave}
            loading={updatePet.isPending}
          />

          {/* Delete Pet */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deletePet.isPending}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.state.error} />
            <Text style={styles.deleteBtnText}>Remover este pet</Text>
          </TouchableOpacity>
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

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    marginTop: Spacing[2],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.state.error,
    backgroundColor: `${Colors.state.error}10`,
  },
  deleteBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.state.error,
  },
});
