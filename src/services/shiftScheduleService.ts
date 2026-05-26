/**
 * shiftScheduleService.ts
 *
 * USA la instancia `api` de src/lib/axios.ts — NO importar axios directamente.
 * Token JWT, manejo de 401/403/500 y baseURL son responsabilidad del interceptor.
 */

import api from '../lib/axios';
import type {
  ShiftSchedule,
  ShiftScheduleCreate,
  ShiftScheduleUpdate,
  ShiftScheduleStats,
  ShiftAlertsResponse,
} from '../types/shiftSchedule';

const BASE = '/api/v1/shift-schedules';

class ShiftScheduleService {

  /**
   * Obtener turnos en un rango de fechas
   */
  async getShiftSchedules(
    startDate: string,
    endDate: string,
    userId?: number,
    shiftType?: string
  ): Promise<ShiftSchedule[]> {
    const params: Record<string, string | number> = {
      start_date: startDate,
      end_date:   endDate,
      department: 'stock',
    };
    if (userId)    params.user_id    = userId;
    if (shiftType) params.shift_type = shiftType;

    const { data } = await api.get<ShiftSchedule[]>(`${BASE}/`, { params });
    return data;
  }

  /**
   * Crear un nuevo turno
   */
  async createShiftSchedule(payload: ShiftScheduleCreate): Promise<ShiftSchedule> {
    const { data } = await api.post<ShiftSchedule>(`${BASE}/`, payload);
    return data;
  }

  /**
   * Actualizar un turno
   */
  async updateShiftSchedule(id: number, payload: ShiftScheduleUpdate): Promise<ShiftSchedule> {
    const { data } = await api.patch<ShiftSchedule>(`${BASE}/${id}`, payload);
    return data;
  }

  /**
   * Eliminar un turno
   */
  async deleteShiftSchedule(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  }

  /**
   * Obtener estadísticas
   */
  async getStats(startDate: string, endDate: string): Promise<ShiftScheduleStats[]> {
    const { data } = await api.get<ShiftScheduleStats[]>(`${BASE}/stats`, {
      params: { start_date: startDate, end_date: endDate, department: 'stock' },
    });
    return data;
  }

  /**
   * Obtener alertas
   */
  async getAlerts(): Promise<ShiftAlertsResponse> {
    const { data } = await api.get<ShiftAlertsResponse>(`${BASE}/alerts`, {
      params: { department: 'stock' },
    });
    return data;
  }
}

export default new ShiftScheduleService();