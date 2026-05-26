import { 
  BusinessIndicator, 
  BusinessIndicatorsResponse,
  BusinessIndicatorsRequest,
  IndicatorHistory
} from '../types/businessIndicators';


// Base URL de la API - configuración dinámica
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

class BusinessIndicatorService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada');
      }
      
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Obtener todos los indicadores de negocio
   */
  async getBusinessIndicators(params?: BusinessIndicatorsRequest): Promise<BusinessIndicator[]> {

    try {
      const queryParams = new URLSearchParams();
      
      if (params?.dateFrom) {
        queryParams.append('date_from', params.dateFrom);
      }
      if (params?.dateTo) {
        queryParams.append('date_to', params.dateTo);
      }
      if (params?.period) {
        queryParams.append('period', params.period);
      }
      if (params?.includeHistory) {
        queryParams.append('include_history', params.includeHistory.toString());
      }

      const url = `/api/business-indicators${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: BusinessIndicatorsResponse = await this.fetchWithAuth(url);
      
      return response.indicators;
    } catch (error) {
      console.error('Error fetching business indicators:', error);
      throw error;
    }
  }

  /**
   * Obtener un indicador específico por ID
   */
  async getIndicatorById(indicatorId: string, params?: BusinessIndicatorsRequest): Promise<BusinessIndicator> {

    try {
      const queryParams = new URLSearchParams();
      
      if (params?.dateFrom) {
        queryParams.append('date_from', params.dateFrom);
      }
      if (params?.dateTo) {
        queryParams.append('date_to', params.dateTo);
      }
      if (params?.period) {
        queryParams.append('period', params.period);
      }

      const url = `/api/business-indicators/${indicatorId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error(`Error fetching indicator ${indicatorId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener el histórico de un indicador específico
   */
  async getIndicatorHistory(
    indicatorId: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<IndicatorHistory[]> {

    try {
      const queryParams = new URLSearchParams();
      
      if (dateFrom) {
        queryParams.append('date_from', dateFrom);
      }
      if (dateTo) {
        queryParams.append('date_to', dateTo);
      }

      const url = `/api/business-indicators/${indicatorId}/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error(`Error fetching history for indicator ${indicatorId}:`, error);
      throw error;
    }
  }

  /**
   * Forzar actualización de indicadores (trigger manual del proceso)
   */
  async refreshIndicators(): Promise<{ message: string; status: string }> {

    try {
      return await this.fetchWithAuth('/api/business-indicators/refresh', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error refreshing indicators:', error);
      throw error;
    }
  }

  /**
   * Obtener el estado de salud de los indicadores
   */
  async getIndicatorsHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    lastUpdate: string;
    issues: string[];
  }> {

    try {
      return await this.fetchWithAuth('/api/business-indicators/health');
    } catch (error) {
      console.error('Error getting indicators health:', error);
      throw error;
    }
  }
}

// Exportar una instancia del servicio
const businessIndicatorService = new BusinessIndicatorService();

// Funciones de conveniencia para usar directamente
export const getBusinessIndicators = (params?: BusinessIndicatorsRequest) => 
  businessIndicatorService.getBusinessIndicators(params);

export const getIndicatorById = (indicatorId: string, params?: BusinessIndicatorsRequest) => 
  businessIndicatorService.getIndicatorById(indicatorId, params);

export const getIndicatorHistory = (indicatorId: string, dateFrom?: string, dateTo?: string) => 
  businessIndicatorService.getIndicatorHistory(indicatorId, dateFrom, dateTo);

export const refreshIndicators = () => 
  businessIndicatorService.refreshIndicators();

export const getIndicatorsHealth = () => 
  businessIndicatorService.getIndicatorsHealth();

export default businessIndicatorService;