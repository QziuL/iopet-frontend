import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '@/services/alerts.service';
import type { Alert } from '@/types/alert.types';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAlerts(),
    refetchInterval: 30000,
  });
}

export function useMarkAlertAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => alertsService.markAsRead(alertId),
    onMutate: async (alertId) => {
      await qc.cancelQueries({ queryKey: ['alerts'] });
      const previousAlerts = qc.getQueryData<Alert[]>(['alerts']);

      if (previousAlerts) {
        qc.setQueryData<Alert[]>(
          ['alerts'],
          previousAlerts.map(a => (a.id === alertId ? { ...a, read: true } : a)),
        );
      }
      return { previousAlerts };
    },
    onError: (err, alertId, context) => {
      if (context?.previousAlerts) {
        qc.setQueryData(['alerts'], context.previousAlerts);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alertsService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
