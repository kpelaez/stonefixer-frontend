import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
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
    InventoryMetrics,
    Notification
} from '../types/inventory';
import inventoryApi from '../services/inventoryApi';

interface InventoryState {
    // Estados de carga
    isLoading: boolean;
    error: string | null;

    // Datos
    techAssets: TechAsset[];
    totalAssets: number;
    currentPage: number;
    itemsPerPage: number;
    assignments: AssetAssignment[];
    totalAssignments: number;
    assignmentsCurrentPage: number;
    assignmentsPageSize: number;
    assignmentSearchTerm: string;
    maintenances: AssetMaintenance[];
    myAssignments: AssetAssignment[];
    dashboardMetrics: InventoryMetrics | null;

    // Término de búsqueda
    searchTerm: string;

    // Filtros
    assetFilters: AssetFilters;
    assignmentFilters: AssignmentFilters;
    maintenanceFilters: MaintenanceFilters;

    // Notificaciones
    notifications: Notification[];

    // Acciones para Tech Assets
    fetchTechAssets: (page?: number, pageSize?: number) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    setSearchTerm: (term: string) => void;  // ← NUEVA acción
    createTechAsset: (asset: TechAssetCreate) => Promise<TechAsset>;
    updateTechAsset: (id: number, asset: TechAssetUpdate) => Promise<TechAsset>;
    deleteTechAsset: (id: number) => Promise<void>;
    clearAssetFilters: () => void;

    // Acciones para Assignments
    fetchAssignments: (page?: number, pageSize?: number) => Promise<void>;
    setAssignmentPage: (page: number) => void;
    setAssignmentPageSize: (pageSize: number) => void;
    setAssignmentSearchTerm: (term: string) => void;
    fetchMyAssignments: () => Promise<void>;
    createAssignment: (assignment: AssetAssignmentCreate) => Promise<AssetAssignment>;
    returnAsset: (assignmentId: number, returnData: any) => Promise<AssetAssignment>;
    transferAsset: (assignmentId: number, newUserId: number, notes?: string) => Promise<AssetAssignment>;
    setAssignmentFilters: (filters: AssignmentFilters) => void;
    clearAssignmentFilters: () => void;

    // Acciones para Maintenace
    fetchMaintenances: () => Promise<void>;
    createMaintenance: (maintenance: AssetMaintenanceCreate) => Promise<AssetMaintenance>;
    updateMaintenance: (id: number, maintenance: Partial<AssetMaintenanceCreate>) => Promise<AssetMaintenance>;
    startMaintenance: (id: number, notes?: string) => Promise<AssetMaintenance>;
    completeMaintenance: (id: number, completionData: any) => Promise<AssetMaintenance>;
    cancelMaintenance: (id: number, reason?: string) => Promise<AssetMaintenance>;
    setMaintenanceFilters: (filters: MaintenanceFilters) => void;
    clearMaintenanceFilters: () => void;

    // Acciones para Dashboard
    fetchDashboardMetrics: () => Promise<void>;

    // Acciones para notificaciones
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;

    // utilidades
    clearError: ()=> void;
    setLoading: (loading: boolean) => void;
}

export const useInventoryStore = create<InventoryState>()(
    devtools(
        (set,get) =>({
            // Estados iniciales
            isLoading: false,
            error: null,
            techAssets: [],
            totalAssets: 0,
            currentPage: 1,
            itemsPerPage: 10,
            searchTerm: '',
            assignments: [],
            totalAssignments: 0,
            assignmentsCurrentPage: 1,
            assignmentsPageSize: 10,
            assignmentSearchTerm: '',
            maintenances: [],
            myAssignments: [],
            dashboardMetrics: null,
            assetFilters: {},
            assignmentFilters: {},
            maintenanceFilters: {},
            notifications: [],

            // Tech Assets
            fetchTechAssets: async (page?: number, pageSize?: number) => {
                set({ isLoading: true, error: null });
                try {
                    // Leer siempre del estado actual del store para tener la info más reciente
                    // Los parámetros opcionales permiten override explícito si es necesario
                    const currentPage = page ?? get().currentPage;
                    const currentLimit = pageSize ?? get().itemsPerPage;
                    const { assetFilters, searchTerm } = get();

                    const response = await inventoryApi.getTechAssets({
                        ...assetFilters,
                        page: currentPage,
                        page_size: currentLimit,
                        search: searchTerm || undefined,
                    });

                    set({
                        techAssets: response?.items ?? [],
                        totalAssets: response?.total ?? 0,
                        currentPage: response?.page ?? currentPage,
                        itemsPerPage: currentLimit,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: inventoryApi.handleApiError(error),
                        techAssets: [],
                        totalAssets: 0,
                        isLoading: false,
                    });
                }
            },

            setPage: (page: number) => {
                set({ currentPage: page });
            },

            setPageSize: (pageSize: number) => {
                set({ itemsPerPage: pageSize, currentPage: 1 });
            },

            setSearchTerm: (term: string) => {
                set({ searchTerm: term, currentPage: 1 });  // Resetear a página 1 al buscar
            },

            createTechAsset: async (asset: TechAssetCreate) => {
                set({ isLoading: true, error: null });
                try {
                    const newAsset = await inventoryApi.createTechAsset(asset);
                    set(state => ({
                        techAssets: [...state.techAssets, newAsset],
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Activo creado',
                        message: `El activo "${newAsset.name}" ha sido creado exitosamente.`
                    });
                    
                    return newAsset;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al crear activo',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            updateTechAsset: async (id: number, asset: TechAssetUpdate) => {
                set({ isLoading: true, error: null });
                try {
                    const updatedAsset = await inventoryApi.updateTechAsset(id, asset);
                    set(state => ({
                        techAssets: state.techAssets.map(a => a.id === id ? updatedAsset : a),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Activo actualizado',
                        message: `El activo "${updatedAsset.name}" ha sido actualizado exitosamente.`
                    });
                    
                    return updatedAsset;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al actualizar activo',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },
            deleteTechAsset: async (id: number) => {
                set({ isLoading: true, error: null });
                try {
                    await inventoryApi.deleteTechAsset(id);
                    set(state => ({
                        techAssets: state.techAssets.filter(a => a.id !== id),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Activo eliminado',
                        message: 'El activo ha sido eliminado exitosamente.'
                    });
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al eliminar activo',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },
            setAssetFilters: (filters: AssetFilters) => {
                set({ assetFilters: filters });
            },

            clearAssetFilters: () => {
                set({ assetFilters: {} });
            },

            // === ASSIGNMENTS ===
            fetchAssignments: async (page?: number, pageSize?: number) => {
                set({ isLoading: true, error: null });
                try {
                    const currentPage = page ?? get().assignmentsCurrentPage;
                    const currentLimit = pageSize ?? get().assignmentsPageSize;
                    const { assignmentSearchTerm, assignmentFilters } = get();

                    const response = await inventoryApi.getAssignments({
                        page: currentPage,
                        page_size: currentLimit,
                        search: assignmentSearchTerm || undefined,
                        status: assignmentFilters?.status || undefined,
                        user_id: assignmentFilters?.user_id || undefined,
                        asset_id: assignmentFilters?.asset_id || undefined,
                    });

                    set({
                        assignments: response?.items ?? [],
                        totalAssignments: response?.total ?? 0,
                        assignmentsCurrentPage: response?.page ?? currentPage,
                        assignmentsPageSize: currentLimit,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Error al cargar asignaciones',
                        assignments: [],
                        totalAssignments: 0,
                        isLoading: false,
                    });
                }
            },
            setAssignmentPage: (page: number) => {
                set({ assignmentsCurrentPage: page });
            },

            setAssignmentPageSize: (pageSize: number) => {
                set({ assignmentsPageSize: pageSize, assignmentsCurrentPage: 1 });
            },

            setAssignmentSearchTerm: (term: string) => {
                set({ assignmentSearchTerm: term, assignmentsCurrentPage: 1 });
            },

            fetchMyAssignments: async () => {
                set({ isLoading: true, error: null });
                try {
                    const myAssignments = await inventoryApi.getMyAssignments();
                    set({ myAssignments, isLoading: false });
                } catch (error) {
                    set({ 
                        error: inventoryApi.handleApiError(error), 
                        isLoading: false 
                    });
                }
            },

            createAssignment: async (assignment: AssetAssignmentCreate) => {
                set({ isLoading: true, error: null });
                try {
                    const newAssignment = await inventoryApi.createAssignment(assignment);
                    set(state => ({
                        assignments: [...state.assignments, newAssignment],
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Asignación creada',
                        message: 'El activo ha sido asignado exitosamente.'
                    });
                    
                    return newAssignment;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al crear asignación',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            returnAsset: async (assignmentId: number, returnData: any) => {
                set({ isLoading: true, error: null });
                    try {
                    const updatedAssignment = await inventoryApi.returnAsset(assignmentId, returnData);
                    set(state => ({
                        assignments: state.assignments.map(a => a.id === assignmentId ? updatedAssignment : a),
                        myAssignments: state.myAssignments.map(a => a.id === assignmentId ? updatedAssignment : a),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Activo devuelto',
                        message: 'El activo ha sido devuelto exitosamente.'
                    });
                    
                    return updatedAssignment;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al devolver activo',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            transferAsset: async (assignmentId: number, newUserId: number, notes?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const newAssignment = await inventoryApi.transferAsset(assignmentId, newUserId, notes);
                    
                    // Refrescar las asignaciones
                    await get().fetchAssignments();
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Activo transferido',
                        message: 'El activo ha sido transferido exitosamente.'
                    });
                    
                    return newAssignment;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al transferir activo',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            setAssignmentFilters: (filters: AssignmentFilters) => {
                set({ assignmentFilters: filters });
            },

            clearAssignmentFilters: () => {
                set({ assignmentFilters: {} });
            },

            // === MAINTENANCE ===
            fetchMaintenances: async () => {
                set({ isLoading: true, error: null });
                try {
                    const { maintenanceFilters } = get();
                    const maintenances = await inventoryApi.getMaintenances(maintenanceFilters);
                    set({ maintenances, isLoading: false });
                } catch (error) {
                    set({ 
                        error: inventoryApi.handleApiError(error), 
                        isLoading: false 
                    });
                }
            },

            createMaintenance: async (maintenance: AssetMaintenanceCreate) => {
                set({ isLoading: true, error: null });
                try {
                    const newMaintenance = await inventoryApi.createMaintenance(maintenance);
                    set(state => ({
                        maintenances: [...state.maintenances, newMaintenance],
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Mantenimiento programado',
                        message: `El mantenimiento "${newMaintenance.title}" ha sido programado exitosamente.`
                    });
                    
                    return newMaintenance;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al programar mantenimiento',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            updateMaintenance: async (id: number, maintenance: Partial<AssetMaintenanceCreate>) => {
                set({ isLoading: true, error: null });
                try {
                    const updatedMaintenance = await inventoryApi.updateMaintenance(id, maintenance);
                    set(state => ({
                        maintenances: state.maintenances.map(m => m.id === id ? updatedMaintenance : m),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Mantenimiento actualizado',
                        message: 'El mantenimiento ha sido actualizado exitosamente.'
                    });
                    
                    return updatedMaintenance;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al actualizar mantenimiento',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            startMaintenance: async (id: number, notes?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const updatedMaintenance = await inventoryApi.startMaintenance(id, notes);
                    set(state => ({
                        maintenances: state.maintenances.map(m => m.id === id ? updatedMaintenance : m),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Mantenimiento iniciado',
                        message: 'El mantenimiento ha sido iniciado exitosamente.'
                    });
                    
                    return updatedMaintenance;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al iniciar mantenimiento',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            completeMaintenance: async (id: number, completionData: any) => {
                set({ isLoading: true, error: null });
                try {
                    const updatedMaintenance = await inventoryApi.completeMaintenance(id, completionData);
                    set(state => ({
                        maintenances: state.maintenances.map(m => m.id === id ? updatedMaintenance : m),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'success',
                        title: 'Mantenimiento completado',
                        message: 'El mantenimiento ha sido completado exitosamente.'
                    });
                    
                    return updatedMaintenance;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al completar mantenimiento',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            cancelMaintenance: async (id: number, reason?: string) => {
                set({ isLoading: true, error: null });
                try {
                    const updatedMaintenance = await inventoryApi.cancelMaintenance(id, reason);
                    set(state => ({
                        maintenances: state.maintenances.map(m => m.id === id ? updatedMaintenance : m),
                        isLoading: false
                    }));
                    
                    get().addNotification({
                        type: 'warning',
                        title: 'Mantenimiento cancelado',
                        message: 'El mantenimiento ha sido cancelado.'
                    });
                    
                    return updatedMaintenance;
                } catch (error) {
                    const errorMessage = inventoryApi.handleApiError(error);
                    set({ error: errorMessage, isLoading: false });
                    
                    get().addNotification({
                        type: 'error',
                        title: 'Error al cancelar mantenimiento',
                        message: errorMessage
                    });
                    
                    throw error;
                }
            },

            setMaintenanceFilters: (filters: MaintenanceFilters) => {
                set({ maintenanceFilters: filters });
            },

            clearMaintenanceFilters: () => {
                set({ maintenanceFilters: {} });
            },

            // === DASHBOARD ===
            fetchDashboardMetrics: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await inventoryApi.getDashboardData();
                    if (response.success && response.data) {
                        set({ 
                        dashboardMetrics: response.data,
                        isLoading: false 
                        });
                    } else {
                        throw new Error(response.error || 'Error al cargar métricas');
                    }
                } catch (error) {
                    set({ 
                        error: inventoryApi.handleApiError(error), 
                        isLoading: false 
                    });
                }
            },

            // === NOTIFICACIONES ===
            addNotification: (notification: Omit<Notification, 'id'>) => {
                const id = Date.now().toString();
                const newNotification: Notification = {
                ...notification,
                id,
                duration: notification.duration || 5000
                };
                
                set(state => ({
                notifications: [...state.notifications, newNotification]
                }));

                // Auto-remover después del tiempo especificado
                if (newNotification.duration && newNotification.duration > 0) {
                setTimeout(() => {
                    get().removeNotification(id);
                }, newNotification.duration);
                }
            },

            removeNotification: (id: string) => {
                set(state => ({
                notifications: state.notifications.filter(n => n.id !== id)
                }));
            },

            clearNotifications: () => {
                set({ notifications: [] });
            },

            // === UTILIDADES ===
            clearError: () => {
                set({ error: null });
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },
        }),
        {
        name: 'inventory-store'
        }
    )
);

export default useInventoryStore;
     