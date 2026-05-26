import api from '../lib/axios';
import type { AxiosRequestConfig } from 'axios';

import type {
    TechAsset,
    TechAssetCreate,
    TechAssetUpdate,
    AssetAssignment,
    AssetAssignmentCreate,
    AssetMaintenance,
    AssetMaintenanceCreate,
    AssetFilters,
    AssignmentFilters,
    MaintenanceFilters,
    DashboardData,
    AssetStatistics,
    AssignmentStatistics,
    MaintenanceMetrics,
    AssetCategory,
    AssetStatus,
    PaginatedResponse,
    UserDNIUpdate,
} from '../types/inventory';

// ─── Helper interno para construir query strings limpiamente 

function buildParams(obj: Record<string, unknown>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    }
    return params;
}

// ─── Servicio 
class InventoryApiService {

    /**
     * Wrapper genérico sobre axios.
     * Extrae `data` de la respuesta y deja que el interceptor maneje los errores HTTP.
     */
    private async request<T>(
        method: 'get' | 'post' | 'patch' | 'put' | 'delete',
        endpoint: string,
        config?: AxiosRequestConfig
    ): Promise<T> {
        const response = await api.request<T>({ method, url: endpoint, ...config });
        return response.data;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TECH ASSETS


    async getTechAssets(
        filters?: AssetFilters & { page?: number; page_size?: number; search?: string }
    ): Promise<PaginatedResponse<TechAsset>> {
        const params = buildParams({
            page:      filters?.page,
            page_size: filters?.page_size,
            category:  filters?.category,
            status:    filters?.status,
            search:    filters?.search,
            location:  filters?.location,
        });

        const response = await this.request<PaginatedResponse<TechAsset>>(
            'get',
            `/api/v1/inventory/tech-assets/`,
            { params }
        );

        return {
            items:       response?.items       ?? [],
            total:       response?.total       ?? 0,
            page:        response?.page        ?? 1,
            total_pages: response?.total_pages ?? 1,
        };
    }

    async getTechAsset(id: number): Promise<TechAsset> {
        return this.request<TechAsset>('get', `/api/v1/inventory/tech-assets/${id}`);
    }

    async createTechAsset(asset: TechAssetCreate): Promise<TechAsset> {
        return this.request<TechAsset>('post', '/api/v1/inventory/tech-assets/', { data: asset });
    }

    async updateTechAsset(id: number, asset: TechAssetUpdate): Promise<TechAsset> {
        return this.request<TechAsset>('patch', `/api/v1/inventory/tech-assets/${id}`, { data: asset });
    }

    async deleteTechAsset(id: number): Promise<void> {
        return this.request<void>('delete', `/api/v1/inventory/tech-assets/${id}`);
    }

    async generateAssetTag(category: AssetCategory): Promise<{ asset_tag: string; category: string }> {
        return this.request('post', '/api/v1/inventory/tech-assets/generate-tag', { data: { category } });
    }

    async updateAssetStatus(id: number, status: AssetStatus): Promise<TechAsset> {
        return this.request<TechAsset>('patch', `/api/v1/inventory/tech-assets/${id}/status`, { data: { status } });
    }

    async getAssetCategories(): Promise<{ value: string; label: string }[]> {
        return this.request('get', '/api/v1/inventory/tech-assets/categories/list');
    }

    async getAssetStatuses(): Promise<{ value: string; label: string }[]> {
        return this.request('get', '/api/v1/inventory/tech-assets/status/list');
    }

    async getAssetsWarrantyExpiring(daysAhead = 30): Promise<{
        days_ahead: number;
        count: number;
        assets: TechAsset[];
    }> {
        return this.request('get', '/api/v1/inventory/tech-assets/warranty/expiring', {
            params: { days_ahead: daysAhead },
        });
    }

    async getAssetStatistics(): Promise<AssetStatistics> {
        return this.request<AssetStatistics>('get', '/api/v1/inventory/tech-assets/statistics/overview');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ASSIGNMENTS


    async getAssignments(
        filters?: AssignmentFilters & { page?: number; page_size?: number; search?: string; status?: string }
    ): Promise<PaginatedResponse<AssetAssignment>> {
        const params = buildParams({
            page:      filters?.page,
            page_size: filters?.page_size,
            user_id:   filters?.user_id,
            asset_id:  filters?.asset_id,
            status:    filters?.status,
            search:    filters?.search,
        });

        return this.request<PaginatedResponse<AssetAssignment>>(
            'get',
            '/api/v1/inventory/assignments/',
            { params }
        );
    }

    async getAssignment(id: number): Promise<AssetAssignment> {
        return this.request<AssetAssignment>('get', `/api/v1/inventory/assignments/${id}`);
    }

    async createAssignment(assignment: AssetAssignmentCreate): Promise<AssetAssignment> {
        const data = {
            tech_asset_id:          assignment.tech_asset_id,
            assigned_to_user_id:    assignment.assigned_to_user_id,
            expected_return_date:   assignment.expected_return_date   || null,
            assignment_reason:      assignment.assignment_reason      || null,
            location_of_use:        assignment.location_of_use        || null,
            condition_at_assignment: assignment.condition_at_assignment || 'good',
            assignment_notes:       assignment.assignment_notes       || null,
        };
        return this.request<AssetAssignment>('post', '/api/v1/inventory/assignments/', { data });
    }

    async returnAsset(
        assignmentId: number,
        returnData: { actual_return_date?: string; condition_at_return?: string; return_notes?: string }
    ): Promise<AssetAssignment> {
        return this.request<AssetAssignment>(
            'post',
            `/api/v1/inventory/assignments/${assignmentId}/return`,
            { data: returnData }
        );
    }

    async transferAsset(assignmentId: number, newUserId: number, transferNotes?: string): Promise<AssetAssignment> {
        return this.request<AssetAssignment>(
            'post',
            `/api/v1/inventory/assignments/${assignmentId}/transfer`,
            { params: buildParams({ new_user_id: newUserId, transfer_notes: transferNotes }) }
        );
    }

    async deleteAssignment(id: number): Promise<void> {
        return this.request<void>('delete', `/api/v1/inventory/assignments/${id}`);
    }

    async getUserAssignments(userId: number, activeOnly = true): Promise<AssetAssignment[]> {
        return this.request<AssetAssignment[]>(
            'get',
            `/api/v1/inventory/assignments/user/${userId}`,
            { params: { active_only: activeOnly } }
        );
    }

    async getAssetAssignmentHistory(assetId: number): Promise<AssetAssignment[]> {
        return this.request<AssetAssignment[]>('get', `/api/v1/inventory/assignments/asset/${assetId}/history`);
    }

    async getMyAssignments(): Promise<AssetAssignment[]> {
        return this.request<AssetAssignment[]>('get', '/api/v1/inventory/assignments/my-assets');
    }

    async getAssignmentStatistics(): Promise<AssignmentStatistics> {
        return this.request<AssignmentStatistics>('get', '/api/v1/inventory/assignments/statistics/overview');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAINTENANCE


    async getMaintenances(filters?: MaintenanceFilters): Promise<AssetMaintenance[]> {
        const params = filters ? buildParams(filters as Record<string, unknown>) : undefined;
        return this.request<AssetMaintenance[]>('get', '/api/v1/inventory/maintenance', { params });
    }

    async getMaintenance(id: number): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>('get', `/api/v1/inventory/maintenance/${id}`);
    }

    async createMaintenance(maintenance: AssetMaintenanceCreate): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>('post', '/api/v1/inventory/maintenance', { data: maintenance });
    }

    async updateMaintenance(id: number, maintenance: Partial<AssetMaintenanceCreate>): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>('patch', `/api/v1/inventory/maintenance/${id}`, { data: maintenance });
    }

    async startMaintenance(id: number, notes?: string): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>('post', `/api/v1/inventory/maintenance/${id}/start`, { data: { notes } });
    }

    async completeMaintenance(
        id: number,
        completionData: {
            procedures_performed?: string;
            parts_replaced?: string;
            tools_used?: string;
            labor_cost?: number;
            parts_cost?: number;
            external_service_cost?: number;
            follow_up_required?: boolean;
            follow_up_date?: string;
            notes?: string;
        }
    ): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>(
            'post',
            `/api/v1/inventory/maintenance/${id}/complete`,
            { data: completionData }
        );
    }

    async cancelMaintenance(id: number, reason?: string): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>(
            'post',
            `/api/v1/inventory/maintenance/${id}/cancel`,
            { params: buildParams({ reason }) }
        );
    }

    async deleteMaintenance(id: number): Promise<void> {
        return this.request<void>('delete', `/api/v1/inventory/maintenance/${id}`); // bug corregido
    }

    async getAssetMaintenanceHistory(assetId: number): Promise<AssetMaintenance[]> {
        return this.request<AssetMaintenance[]>('get', `/api/v1/inventory/maintenance/asset/${assetId}/history`);
    }

    async getUpcomingMaintenances(daysAhead = 30): Promise<AssetMaintenance[]> {
        return this.request<AssetMaintenance[]>(
            'get',
            '/api/v1/inventory/maintenance/upcoming/schedule',
            { params: { days_ahead: daysAhead } }
        );
    }

    async getOverdueMaintenances(): Promise<AssetMaintenance[]> {
        return this.request<AssetMaintenance[]>('get', '/api/v1/inventory/maintenance/overdue/list');
    }

    async getMyAssignedMaintenances(): Promise<AssetMaintenance[]> {
        return this.request<AssetMaintenance[]>('get', '/api/v1/inventory/maintenance/my-assigned');
    }

    async getMaintenanceMetrics(dateFrom?: string, dateTo?: string): Promise<MaintenanceMetrics> {
        return this.request<MaintenanceMetrics>(
            'get',
            '/api/v1/inventory/maintenance/metrics/overview',
            { params: buildParams({ date_from: dateFrom, date_to: dateTo }) }
        );
    }

    async schedulePreventiveMaintenance(assetId: number, intervalDays = 90): Promise<AssetMaintenance> {
        return this.request<AssetMaintenance>(
            'post',
            `/api/v1/inventory/maintenance/asset/${assetId}/schedule-preventive`,
            { data: { maintenance_interval_days: intervalDays } }
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USERS

    async getUsers(): Promise<any[]> {
        return this.request<any[]>('get', '/api/v1/users/');
    }

    async updateUserDNI(userId: number, dniData: UserDNIUpdate): Promise<{ message: string }> {
        return this.request<{ message: string }>('patch', `/api/v1/users/${userId}/dni`, { data: dniData });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD

    async getDashboardData(): Promise<DashboardData> {
        return this.request<DashboardData>('get', '/api/v1/dashboard/inventory');
    }

    async getAssetUtilizationData(): Promise<any> {
        return this.request('get', '/api/v1/dashboard/assets/utilization');
    }

    async getMaintenanceDashboardData(): Promise<any> {
        return this.request('get', '/api/v1/dashboard/maintenance');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILS

    handleApiError(error: unknown): string {
        if (error instanceof Error) return error.message;
        return 'Ha ocurrido un error inesperado';
    }
}

// Singleton
export const inventoryApi = new InventoryApiService();
export default inventoryApi;