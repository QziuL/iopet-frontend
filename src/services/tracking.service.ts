import { api } from './api';
import type { TrackingState, LocationPoint, SignalStatus } from '@/types/tracking.types';

export interface BackendTrackingDTO {
  petId: string;
  deviceId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
    address?: string;
  };
  battery: number;
  signalStatus: string;
  precision: number;
  lastUpdated: string;
}

export interface BackendLocationPointDTO {
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}

export interface HistoryFilterParams {
  data?: string;       // Formato: YYYY-MM-DD
  inicio?: string;     // ISO ou YYYY-MM-DDTHH:mm:ss
  fim?: string;        // ISO ou YYYY-MM-DDTHH:mm:ss
  limite?: number;
}

export const trackingService = {
  async getTracking(petId: string): Promise<TrackingState> {
    const { data } = await api.get<BackendTrackingDTO>(`/pets/${petId}/tracking`);
    return {
      petId: data.petId,
      deviceId: data.deviceId,
      currentLocation: {
        latitude: data.currentLocation.latitude,
        longitude: data.currentLocation.longitude,
        timestamp: data.currentLocation.timestamp,
        address: data.currentLocation.address,
      },
      battery: data.battery ?? 100,
      signalStatus: (data.signalStatus === 'online' ? 'online' : 'offline') as SignalStatus,
      precision: data.precision ?? 10,
      lastUpdated: data.lastUpdated,
    };
  },

  async getLocationHistory(petId: string, params?: HistoryFilterParams): Promise<LocationPoint[]> {
    const { data } = await api.get<BackendLocationPointDTO[]>(`/pets/${petId}/historico`, { params });
    return data.map(item => ({
      latitude: item.latitude,
      longitude: item.longitude,
      timestamp: item.timestamp,
      address: item.address,
    }));
  },
};
