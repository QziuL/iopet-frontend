import { api } from './api';
import type { LoginPayload, RegisterPayload, AuthResponse, User } from '@/types/auth.types';

export interface BackendTutorDTO {
  uuid: string;
  nome: string;
  email: string;
  telefone?: string;
  urlFoto?: string;
}

export interface BackendAuthResponseDTO {
  token: string;
  tutor: BackendTutorDTO;
}

export function mapTutorToUser(tutor: BackendTutorDTO): User {
  return {
    id: tutor.uuid,
    name: tutor.nome,
    email: tutor.email,
    avatarUrl: tutor.urlFoto,
    createdAt: new Date().toISOString(),
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<BackendAuthResponseDTO>('/auth/login', {
      email: payload.email,
      senha: payload.password,
    });
    return {
      token: data.token,
      user: mapTutorToUser(data.tutor),
    };
  },

  async register(payload: RegisterPayload & { phone?: string }): Promise<AuthResponse> {
    const { data } = await api.post<BackendAuthResponseDTO>('/auth/register', {
      nome: payload.name,
      email: payload.email,
      senha: payload.password,
      telefone: payload.phone || '11999999999',
      urlFoto: payload.avatarUrl,
    });
    return {
      token: data.token,
      user: mapTutorToUser(data.tutor),
    };
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<BackendTutorDTO>('/tutores/me');
    return mapTutorToUser(data);
  },

  async updateProfile(payload: { name: string; phone?: string; avatarUrl?: string }): Promise<User> {
    const { data } = await api.put<BackendTutorDTO>('/tutores/me', {
      nome: payload.name,
      telefone: payload.phone,
      urlFoto: payload.avatarUrl,
    });
    return mapTutorToUser(data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/tutores/senha', {
      senhaAtual: currentPassword,
      novaSenha: newPassword,
    });
  },
};
