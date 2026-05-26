import api from '../lib/axios';
import { AxiosError } from 'axios';
import type {
  AssignmentDocumentStatus,
  SendToHumandResponse
} from '../types/inventory';

// const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

// Helper para extraer mensaje de error legible desde respuestas de FastAPI
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 401) return 'Tu sesión expiró. Por favor iniciá sesión nuevamente.';
    if (status === 403) return 'No tenés permisos para realizar esta acción.';
    if (status === 400 && detail) return detail; // Incluye "Usuario sin DNI registrado"
    if (status === 404 && detail) return detail;
    if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
};

/**
 * Servicio para manejar documentos de asignación
 */
export const assignmentDocumentService = {
  
  /**
   * Generar preview del PDF de asignación
   */
  generatePreview: async (assignmentId: number): Promise<Blob> => {
    try {
      const response = await api.post(
        `/api/v1/assignments/${assignmentId}/generate-preview`,
        {},
        { responseType: 'blob' }  // sin getAuthHeaders() — el interceptor lo inyecta
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },


  /**
   * Enviar documento a Humand
   */
  sendToHumand: async (assignmentId: number, sendNotification = true): Promise<SendToHumandResponse> => {
    try {
      const response = await api.post(
        `/api/v1/assignments/${assignmentId}/send-to-humand`,
        {},
        { params: { send_notification: sendNotification } }
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Obtener estado del documento
   */
  getDocumentStatus: async (assignmentId: number): Promise<AssignmentDocumentStatus> => {
    try {
      const response = await api.get(`/api/v1/assignments/${assignmentId}/document-status`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  openPreviewInNewTab: async (assignmentId: number): Promise<void> => {
    const blob = await assignmentDocumentService.generatePreview(assignmentId);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  },

  /**
   * Descargar PDF (helper para abrir en nueva pestaña)
   */
  downloadPreview: async (assignmentId: number): Promise<void> => {
    const blob = await assignmentDocumentService.generatePreview(assignmentId);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Limpiar después de un delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }
};