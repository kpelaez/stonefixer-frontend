/**
 * overtimeService.ts
 *
 * USA la instancia `api` de src/lib/axios.ts — NO importar axios directamente.
 * Token JWT, manejo de 401/403/500 y baseURL son responsabilidad del interceptor.
 */

import api from '../lib/axios';
import type {
  OvertimeEntryRead,
  OvertimeBalanceRead,
  OvertimeEntryCreate,
  OvertimeEntryReview,
  OvertimeStatus,
  OvertimeType,
} from '../types/overtime';

const BASE = '/api/v1/overtime';

class OvertimeService {

  async createEntry(payload: OvertimeEntryCreate): Promise<OvertimeEntryRead> {
    const { data } = await api.post<OvertimeEntryRead>(`${BASE}/`, payload);
    return data;
  }

  async reviewEntry(id: number, payload: OvertimeEntryReview): Promise<OvertimeEntryRead> {
    const { data } = await api.patch<OvertimeEntryRead>(`${BASE}/${id}/review`, payload);
    return data;
  }

  async cancelEntry(id: number): Promise<OvertimeEntryRead> {
    const { data } = await api.patch<OvertimeEntryRead>(`${BASE}/${id}/cancel`);
    return data;
  }

  async getBalance(userId: number): Promise<OvertimeBalanceRead> {
    const { data } = await api.get<OvertimeBalanceRead>(`${BASE}/balance/${userId}`);
    return data;
  }

  async listEntries(params?: {
    user_id?:    number;
    status?:     OvertimeStatus;
    entry_type?: OvertimeType;
    limit?:      number;
    offset?:     number;
  }): Promise<OvertimeEntryRead[]> {
    const { data } = await api.get<OvertimeEntryRead[]>(`${BASE}/`, { params });
    return data;
  }
}

export default new OvertimeService();