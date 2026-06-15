// src/components/Inventory/AssignmentDocumentManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  FileText, Send, CheckCircle, AlertCircle,
  Loader2, Bell, BellOff, ShieldAlert, ExternalLink,
  Clock,
} from 'lucide-react';
import { assignmentDocumentService } from '../../services/assignmentDocumentService';
import type { AssetAssignment } from '../../types/inventory';
import type { HumandSendStatus } from '../../types/inventory';
import toast from 'react-hot-toast';

interface AssignmentDocumentManagerProps {
  assignment: AssetAssignment;
  onDocumentSent?: () => void;
}

type ActionState = 'idle' | 'previewing' | 'sending' | 'polling';


const POLL_INTERVAL_MS = 3000;  // consulta cada 3 segundos
const POLL_MAX_ATTEMPTS = 20;   // máximo 60 segundos de polling

export const AssignmentDocumentManager: React.FC<AssignmentDocumentManagerProps> = ({
  assignment,
  onDocumentSent,
}) => {
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  // Estado local del envío — se actualiza durante el polling
  // sin necesitar refetch completo de la asignación
  const [localSendStatus, setLocalSendStatus] = useState<HumandSendStatus>(
    assignment.humand_send_status ?? null
  );
  const [localDocumentSent, setLocalDocumentSent] = useState(
    assignment.document_sent_to_humand ?? false
  );
  const [localSentAt, setLocalSentAt] = useState(
    assignment.document_sent_at ?? null
  );
  const [localDocumentName, setLocalDocumentName] = useState(
    assignment.humand_document_name ?? null
  );
  const [localErrorDetail, setLocalErrorDetail] = useState<string | null>(null);
 
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derivado del prop — sin fetch extra innecesario
  const documentSent = localDocumentSent;
  const hasNoDni = !assignment.assigned_to_has_dni;
  const isLoading = actionState !== 'idle';
  const isPending = localSendStatus === 'PENDING';

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Si al montar el componente hay un PENDING en curso (por ej. recarga de página),
  // retomar el polling automáticamente
  useEffect(() => {
    if (assignment.humand_send_status === 'PENDING') {
      setActionState('polling');
      schedulePoll(assignment.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // Polling 
 
  const schedulePoll = (assignmentId: number) => {
    pollTimerRef.current = setTimeout(() => poll(assignmentId), POLL_INTERVAL_MS);
  };
 
  const poll = async (assignmentId: number) => {
    pollAttemptsRef.current += 1;
 
    try {
      const status = await assignmentDocumentService.getDocumentStatus(assignmentId);
      setLocalSendStatus(status.send_status);
 
      if (status.send_status === 'SENT') {
        // Éxito
        setLocalDocumentSent(true);
        setLocalSentAt(status.sent_at);
        setLocalDocumentName(status.document_name);
        setLocalErrorDetail(null);
        setActionState('idle');
        setSendDialogOpen(false);
        pollAttemptsRef.current = 0;
        toast.success('¡Documento enviado a Humand exitosamente!');
        onDocumentSent?.();
 
      } else if (status.send_status === 'FAILED') {
        // Fallo controlado — el backend tiene el detalle
        const detail = status.error_detail ?? 'Error desconocido al enviar a Humand.';
        setLocalErrorDetail(detail);
        setActionState('idle');
        pollAttemptsRef.current = 0;
        toast.error(`Error al enviar a Humand: ${detail}`);
 
      } else if (status.send_status === 'PENDING') {
        // Todavía procesando
        if (pollAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
          // Timeout de polling — no sabemos el resultado
          setActionState('idle');
          setLocalSendStatus(null);
          pollAttemptsRef.current = 0;
          setError(
            'El envío está tardando más de lo esperado. ' +
            'Revisá el estado manualmente en unos minutos.'
          );
          toast.error('Timeout esperando respuesta de Humand.');
        } else {
          schedulePoll(assignmentId);
        }
      }
    } catch {
      // Error de red durante el polling — reintentamos igual
      if (pollAttemptsRef.current < POLL_MAX_ATTEMPTS) {
        schedulePoll(assignmentId);
      } else {
        setActionState('idle');
        pollAttemptsRef.current = 0;
        setError('No se pudo verificar el estado del envío. Revisá tu conexión.');
      }
    }
  };

  // Handlers
  const handlePreview = async () => {
    if (hasNoDni) {
      toast.error('El empleado no tiene DNI registrado. Cargalo desde Gestión de Usuarios.');
      return;
    }

    setActionState('previewing');
    setError(null);

    try {
      await assignmentDocumentService.openPreviewInNewTab(assignment.id);
      toast.success('PDF abierto en nueva pestaña');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el preview';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionState('idle');
    }
  };

  const handleSendToHumand = async () => {
    setActionState('sending');
    setError(null);
    setLocalErrorDetail(null);

    try {
      // El backend responde 202 inmediatamente con status PENDING
      await assignmentDocumentService.sendToHumand(assignment.id, sendNotification);
       // Iniciar polling
      setLocalSendStatus('PENDING');
      pollAttemptsRef.current = 0;
      setActionState('polling');
      schedulePoll(assignment.id);

      toast('Procesando envío a Humand...', { icon: '⏳' });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar a Humand';
      setError(msg);
      setActionState('idle');
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-5 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-semibold text-gray-900">
                Documento de Asignación
              </h3>
            </div>
            <StatusBadge
              sent={documentSent}
              sendStatus={localSendStatus}
            />
          </div>

          {documentSent && localSentAt && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
              <p className="text-xs text-emerald-800">
                Enviado el{' '}
                <strong>
                  {new Date(localSentAt).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </strong>
              </p>
              {localDocumentName && (
                <p className="text-xs text-emerald-700 mt-1 truncate">
                  📄 {localDocumentName}
                </p>
              )}
            </div>
          )}

          {/* Estado: envío en curso (polling) */}
          {isPending && actionState === 'polling' && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-md p-3">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-800">
                  Enviando a Humand...
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Esto puede tardar unos segundos. No cierres esta ventana.
                </p>
              </div>
            </div>
          )}

          {/* Estado: falló */}
          {localSendStatus === 'FAILED' && localErrorDetail && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-800">El envío falló</p>
                <p className="text-xs text-red-700 mt-0.5">{localErrorDetail}</p>
              </div>
            </div>
          )}

          {/* Advertencia sin DNI — bloqueo proactivo */}
          {hasNoDni && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
              <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">DNI requerido</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {assignment.assigned_to_name} no tiene DNI registrado.{' '}
                  Cargalo en{' '}
                  <a href="/users" className="underline font-medium hover:text-amber-900">
                    Gestión de Usuarios
                  </a>{' '}
                  antes de generar el documento.
                </p>
              </div>
            </div>
          )}

          {/* Error de operación */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Acciones — no enviado o falló (permite reintentar) */}
          {!documentSent && actionState !== 'polling' && (
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={isLoading || hasNoDni}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionState === 'previewing'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ExternalLink className="h-4 w-4" />
                }
                {actionState === 'previewing' ? 'Generando...' : 'Ver Preview'}
              </button>
 
              <button
                onClick={() => { setError(null); setSendDialogOpen(true); }}
                disabled={isLoading || hasNoDni}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                {localSendStatus === 'FAILED' ? 'Reintentar envío' : 'Enviar a Humand'}
              </button>
            </div>
          )}

          {/* Ya enviado — opción de re-preview */}
          {documentSent && (
            <button
              onClick={handlePreview}
              disabled={isLoading || hasNoDni}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionState === 'previewing'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ExternalLink className="h-4 w-4" />
              }
              Ver copia del documento
            </button>
          )}

          {/* Info */}
          <p className="text-xs text-gray-500">
            El documento incluye datos del activo, empleado y las políticas de uso para firma en Humand.
          </p>
        </div>
      </div>

      {/* Modal de confirmación de envío */}
      {sendDialogOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => !isLoading && setSendDialogOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">
                  Confirmar envío a Humand
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-gray-700">
                  Se generará y enviará el documento al legajo de{' '}
                  <strong>{assignment.assigned_to_name}</strong> en Humand para su firma.
                  Esta acción no se puede deshacer.
                </p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    {sendNotification
                      ? <><Bell className="h-4 w-4 text-emerald-600" /> Notificar al empleado por email</>
                      : <><BellOff className="h-4 w-4 text-gray-400" /> No notificar al empleado</>
                    }
                  </span>
                </label>

                {/* Estado polling dentro del modal */}
                {actionState === 'polling' && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                    <p className="text-xs text-blue-700">
                      Enviando a Humand... Esto puede tardar unos segundos.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setSendDialogOpen(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendToHumand}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {(actionState === 'sending' || actionState === 'polling') && (<Loader2 className="h-4 w-4 animate-spin" />)}
                  {actionState === 'sending' && 'Iniciando...'}
                  {actionState === 'polling' && 'Enviando...'}
                  {actionState === 'idle' && 'Confirmar envío'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Sub-componente: badge de estado 
 
const StatusBadge: React.FC<{
  sent: boolean;
  sendStatus: HumandSendStatus;
}> = ({ sent, sendStatus }) => {
  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
        <CheckCircle className="h-3.5 w-3.5" />
        Enviado a Humand
      </span>
    );
  }
  if (sendStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
        <Clock className="h-3.5 w-3.5 animate-pulse" />
        Enviando...
      </span>
    );
  }
  if (sendStatus === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
        <AlertCircle className="h-3.5 w-3.5" />
        Falló
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
      Pendiente
    </span>
  );
};