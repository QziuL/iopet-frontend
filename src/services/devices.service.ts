import { api } from './api';
import type { Device } from '@/types/tracking.types';

export interface BackendDeviceDTO {
  enderecoMac: string;
  petUuid?: string;
  petNome?: string;
  petFoto?: string;
  bateriaNivel: number;
  ativo: boolean;
  ultimaComunicacao?: string;
  status: 'online' | 'offline';
}

export const devicesService = {
  async getDevices(): Promise<Device[]> {
    const { data } = await api.get<BackendDeviceDTO[]>('/dispositivos');
    return data.map(dto => ({
      id: dto.enderecoMac,
      deviceCode: dto.enderecoMac,
      petId: dto.petUuid ?? '',
      petName: dto.petNome ?? 'Sem pet vinculado',
      status: dto.ativo ? 'online' : 'offline',
      battery: dto.bateriaNivel ?? 0,
      linkedAt: dto.ultimaComunicacao ?? new Date().toISOString(),
      ativo: dto.ativo,
    }));
  },
};
