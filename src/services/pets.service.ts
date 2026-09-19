import { api } from './api';
import type { Pet, CreatePetPayload, PetSpecies, PetSize } from '@/types/pet.types';

export interface BackendPetDTO {
  idPublico: string;
  idPublicoTutor?: string;
  nome: string;
  raca: string;
  sexo?: string;
  especie: string;
  porte: string;
  urlFoto?: string;
  dataNascimento?: string;
  descricao?: string;
  enderecoMac?: string;
  bateriaNivel?: number;
  dispositivoAtivo?: boolean;
  ultimaComunicacao?: string;
  temZonaSeguranca?: boolean;
}

export function mapBackendPetToPet(dto: BackendPetDTO): Pet {
  let age = 1;
  if (dto.dataNascimento) {
    const birthYear = new Date(dto.dataNascimento).getFullYear();
    const currentYear = new Date().getFullYear();
    age = Math.max(1, currentYear - birthYear);
  }

  let species: PetSpecies = 'other';
  const esp = dto.especie?.toLowerCase() || '';
  if (esp.includes('dog') || esp.includes('cachorro') || esp.includes('cão')) species = 'dog';
  else if (esp.includes('cat') || esp.includes('gato')) species = 'cat';
  else if (esp.includes('bird') || esp.includes('pássaro') || esp.includes('passaro')) species = 'bird';
  else if (esp.includes('rabbit') || esp.includes('coelho')) species = 'rabbit';

  let size: PetSize = 'medium';
  const p = dto.porte?.toLowerCase() || '';
  if (p.includes('small') || p.includes('pequeno')) size = 'small';
  else if (p.includes('large') || p.includes('grande')) size = 'large';
  else if (p.includes('giant') || p.includes('gigante')) size = 'giant';
  else size = 'medium';

  return {
    id: dto.idPublico,
    name: dto.nome,
    species,
    breed: dto.raca,
    size,
    age,
    weight: 15,
    description: dto.descricao,
    avatarUrl: dto.urlFoto,
    ownerId: dto.idPublicoTutor || '',
    deviceId: dto.enderecoMac,
    createdAt: new Date().toISOString(),
  };
}

export const petsService = {
  async getPets(): Promise<Pet[]> {
    const { data } = await api.get<BackendPetDTO[]>('/pets');
    return data.map(mapBackendPetToPet);
  },

  async getPet(id: string): Promise<Pet> {
    const { data } = await api.get<BackendPetDTO>(`/pets/${id}`);
    return mapBackendPetToPet(data);
  },

  async createPet(payload: CreatePetPayload): Promise<Pet> {
    const birthYear = new Date().getFullYear() - (payload.age || 1);
    const birthDate = `${birthYear}-01-01`;

    const { data } = await api.post<BackendPetDTO>('/pets', {
      nome: payload.name,
      raca: payload.breed,
      sexo: 'M',
      especie: payload.species,
      porte: payload.size,
      urlFoto: payload.avatarUrl,
      dataNascimento: birthDate,
      descricao: payload.description,
    });

    return mapBackendPetToPet(data);
  },

  async updatePet(id: string, payload: Partial<CreatePetPayload>): Promise<Pet> {
    const body: any = {};
    if (payload.name) body.nome = payload.name;
    if (payload.breed) body.raca = payload.breed;
    if (payload.species) body.especie = payload.species;
    if (payload.size) body.porte = payload.size;
    if (payload.avatarUrl !== undefined) body.urlFoto = payload.avatarUrl;
    if (payload.description !== undefined) body.descricao = payload.description;
    if (payload.age) {
      const birthYear = new Date().getFullYear() - payload.age;
      body.dataNascimento = `${birthYear}-01-01`;
    }

    const { data } = await api.put<BackendPetDTO>(`/pets/${id}`, body);
    return mapBackendPetToPet(data);
  },

  async deletePet(id: string): Promise<void> {
    await api.delete(`/pets/${id}`);
  },

  async linkDevice(payload: { petId: string; deviceCode: string }): Promise<void> {
    await api.put('/pets/vincular-dispositivo', {
      idPublicoPet: payload.petId,
      enderecoMac: payload.deviceCode,
    });
  },
};
