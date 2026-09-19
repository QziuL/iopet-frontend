import { create } from 'zustand';
import type { Pet } from '@/types/pet.types';

interface PetsStore {
  pets: Pet[];
  activePetId: string | null;

  setPets: (pets: Pet[]) => void;
  addPet: (pet: Pet) => void;
  updatePet: (id: string, data: Partial<Pet>) => void;
  removePet: (id: string) => void;
  setActivePet: (id: string | null) => void;
  getActivePet: () => Pet | null;
}

export const usePetsStore = create<PetsStore>((set, get) => ({
  pets: [],
  activePetId: null,

  setPets: (pets) =>
    set(state => {
      const activeExists = pets.some(p => p.id === state.activePetId);
      return {
        pets,
        activePetId: activeExists ? state.activePetId : (pets[0]?.id ?? null),
      };
    }),
  addPet: (pet) => set(state => ({ pets: [...state.pets, pet] })),
  updatePet: (id, data) =>
    set(state => ({ pets: state.pets.map(p => (p.id === id ? { ...p, ...data } : p)) })),
  removePet: (id) =>
    set(state => {
      const remaining = state.pets.filter(p => p.id !== id);
      return {
        pets: remaining,
        activePetId:
          state.activePetId === id ? (remaining[0]?.id ?? null) : state.activePetId,
      };
    }),
  setActivePet: (id) => set({ activePetId: id }),
  getActivePet: () => {
    const { pets, activePetId } = get();
    return pets.find(p => p.id === activePetId) ?? pets[0] ?? null;
  },
}));
