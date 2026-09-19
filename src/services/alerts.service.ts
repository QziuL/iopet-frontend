import { api } from './api';
import type { Alert, AlertType, AlertSeverity } from '@/types/alert.types';

export interface BackendAlertDTO {
  id: number;
  petId: string;
  petName: string;
  petAvatarUrl?: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const alertsService = {
  async getAlerts(): Promise<Alert[]> {
    const { data } = await api.get<BackendAlertDTO[]>('/alertas');
    return data.map(item => ({
      id: String(item.id),
      petId: item.petId || '',
      petName: item.petName || 'Pet',
      petAvatarUrl: item.petAvatarUrl,
      type: (item.type as AlertType) || 'geofence_exit',
      severity: (item.severity as AlertSeverity) || 'critical',
      title: item.title || 'Alerta de Segurança',
      message: item.message,
      timestamp: item.timestamp,
      read: item.read,
    }));
  },

  async markAsRead(alertId: string): Promise<void> {
    await api.put(`/alertas/${alertId}/visualizar`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/alertas/visualizar-todos');
  },
};
