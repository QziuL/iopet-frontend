/** Geofencing types */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Geofence {
  id: string;
  petId: string;
  name: string;
  /** Array of polygon vertices */
  points: GeoPoint[];
  /** Area in m² (calculated) */
  area?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGeofencePayload {
  petId: string;
  name: string;
  points: GeoPoint[];
  active: boolean;
  area?: number;
}

export interface UpdateGeofencePayload extends Partial<CreateGeofencePayload> {
  id: string;
}
