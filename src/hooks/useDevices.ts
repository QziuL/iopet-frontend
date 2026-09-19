import { useQuery } from '@tanstack/react-query';
import { devicesService } from '@/services/devices.service';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesService.getDevices(),
  });
}
