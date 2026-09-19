import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geofencingService } from '@/services/geofencing.service';
import type { CreateGeofencePayload } from '@/types/geofencing.types';

export function useGeofences(petId: string) {
  return useQuery({
    queryKey: ['geofences', petId],
    queryFn: () => geofencingService.getGeofences(petId),
    enabled: !!petId,
  });
}

export function useSaveGeofence() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGeofencePayload) =>
      geofencingService.saveGeofence(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['geofences', data.petId] });
      qc.invalidateQueries({ queryKey: ['pets', data.petId] });
    },
  });
}
