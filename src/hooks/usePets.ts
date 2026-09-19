import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { petsService } from '@/services/pets.service';
import type { Pet, CreatePetPayload } from '@/types/pet.types';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => petsService.getPets(),
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: ['pets', id],
    queryFn: () => petsService.getPet(id),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePetPayload) => petsService.createPet(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

export function useUpdatePet(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreatePetPayload>) => petsService.updatePet(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pets'] });
      qc.invalidateQueries({ queryKey: ['pets', id] });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => petsService.deletePet(id),
    onSuccess: (_, deletedId) => {
      qc.setQueryData<Pet[]>(['pets'], old => {
        return old ? old.filter(p => p.id !== deletedId) : [];
      });
      qc.removeQueries({ queryKey: ['pets', deletedId] });
      qc.removeQueries({ queryKey: ['tracking', deletedId] });
      qc.removeQueries({ queryKey: ['geofences', deletedId] });
      qc.invalidateQueries({ queryKey: ['pets'] });
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useLinkDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { petId: string; deviceCode: string }) => petsService.linkDevice(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pets'] });
      qc.invalidateQueries({ queryKey: ['pets', vars.petId] });
      qc.invalidateQueries({ queryKey: ['tracking', vars.petId] });
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
