import { api } from './api';
import type { Geofence, CreateGeofencePayload, GeoPoint } from '@/types/geofencing.types';

export interface BackendGeofenceDTO {
  id: string;
  petId: string;
  name: string;
  points: GeoPoint[];
  area?: number;
  active: boolean;
}

export const geofencingService = {
  async getGeofences(petId: string): Promise<Geofence[]> {
    const { data } = await api.get<BackendGeofenceDTO>(`/pets/${petId}/geofence`);
    if (!data || !data.points || data.points.length === 0) {
      return [];
    }
    return [
      {
        id: data.id,
        petId: data.petId,
        name: data.name || 'Área Segura',
        points: data.points,
        area: data.area,
        active: data.active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async saveGeofence(payload: CreateGeofencePayload): Promise<Geofence> {
    const { data } = await api.put<BackendGeofenceDTO>(`/pets/${payload.petId}/geofence`, {
      name: payload.name,
      points: payload.points,
      active: payload.active,
    });
    return {
      id: data.id,
      petId: data.petId,
      name: data.name,
      points: data.points,
      area: data.area,
      active: data.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
