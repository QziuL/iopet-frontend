import { useQuery } from '@tanstack/react-query';
import { trackingService } from '@/services/tracking.service';

export function useTracking(petId: string | null | undefined, hasDevice: boolean = true) {
  return useQuery({
    queryKey: ['tracking', petId],
    queryFn: () => trackingService.getTracking(petId!),
    enabled: !!petId && hasDevice,
    refetchInterval: 15_000,
  });
}

export function useLocationHistory(petId: string | null | undefined, hasDevice: boolean = true) {
  return useQuery({
    queryKey: ['history', petId],
    queryFn: () => trackingService.getLocationHistory(petId!),
    enabled: !!petId && hasDevice,
    refetchInterval: 30_000,
  });
}
