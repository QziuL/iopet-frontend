/** Tracking & IoT payload types */

export type EventType =
  | 'location_update'
  | 'geofence_exit'
  | 'geofence_enter'
  | 'battery_low'
  | 'device_reconnected'
  | 'device_disconnected';

export type SignalStatus = 'online' | 'offline' | 'weak';

/** Raw IoT device payload — matches section 9 of IoPet_Instrucoes.md */
export interface IoTPayload {
  deviceId: string;
  petId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  battery: number;         // 0–100 (%)
  signalStatus: SignalStatus;
  precision: number;       // meters
  eventType: EventType;
}

/** A single location data point in history */
export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}

/** Latest tracking state for a pet */
export interface TrackingState {
  petId: string;
  deviceId: string;
  currentLocation: LocationPoint;
  battery: number;
  signalStatus: SignalStatus;
  precision: number;
  lastUpdated: string;
}

/** Device linked to a pet */
export interface Device {
  id: string;
  deviceCode: string;
  petId: string;
  petName: string;
  status: SignalStatus;
  battery: number;
  linkedAt: string;
  ativo?: boolean;
}

export interface LinkDevicePayload {
  deviceCode: string;
  linkKey: string;
  petId: string;
}
