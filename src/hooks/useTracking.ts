import { useQuery } from '@tanstack/react-query';
import { trackingService, type HistoryFilterParams } from '@/services/tracking.service';

export function useTracking(petId: string | null | undefined, hasDevice: boolean = true) {
  return useQuery({
    queryKey: ['tracking', petId],
    queryFn: () => trackingService.getTracking(petId!),
    enabled: !!petId && hasDevice,
    refetchInterval: 15_000,
  });
}

export function useLocationHistory(
  petId: string | null | undefined,
  hasDevice: boolean = true,
  params?: HistoryFilterParams
) {
  return useQuery({
    queryKey: ['history', petId, params],
    queryFn: () => trackingService.getLocationHistory(petId!, params),
    enabled: !!petId && hasDevice,
    refetchInterval: 20_000,
  });
}
