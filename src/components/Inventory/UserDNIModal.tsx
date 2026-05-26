// src/components/inventory/UserDNIModal.tsx (NUEVO)

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import inventoryApi from '../../services/inventoryApi';

interface UserDNIModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  onSuccess?: () => void;
}

export const UserDNIModal: React.FC<UserDNIModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onSuccess
}) => {
  const [dni, setDni] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validaciones
    if (!dni.trim()) {
      setError('El DNI es requerido');
      return;
    }
    
    if (dni.length < 7 || dni.length > 8) {
      setError('El DNI debe tener 7 u 8 dígitos');
      return;
    }
    
    if (!consent) {
      setError('Debe aceptar el consentimiento para continuar');
      return;
    }

    setLoading(true);

    try {
      await inventoryApi.updateUserDNI(userId, {
        dni: dni.trim(),
        consent: true
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el DNI');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDni('');
    setConsent(false);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Agregar DNI a {userName}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Alerts */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <p className="ml-3 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <p className="ml-3 text-sm text-green-700">
                      DNI actualizado exitosamente
                    </p>
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-900 font-medium">
                      Importante
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      El DNI será encriptado y almacenado de forma segura cumpliendo 
                      con la Ley 25.326 de Protección de Datos Personales.
                    </p>
                  </div>
                </div>
              </div>

              {/* DNI Input */}
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                  DNI (sin puntos ni guiones)
                </label>
                <input
                  id="dni"
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345678"
                  disabled={loading || success}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                  maxLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Solo números, 7 u 8 dígitos
                </p>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={loading || success}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="consent" className="ml-3 text-sm text-gray-700">
                  Confirmo que tengo el consentimiento explícito del empleado 
                  para almacenar su DNI con fines de gestión de activos tecnológicos
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || success || !consent}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {success ? 'Guardado' : 'Guardar DNI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};