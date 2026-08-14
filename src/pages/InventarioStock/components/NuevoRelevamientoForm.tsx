// src/pages/InventarioStock/components/NuevoRelevamientoForm.tsx
/**
 * Formulario para crear un nuevo relevamiento de ciclo.
 * Usa React Hook Form + Zod igual que el resto del proyecto.
 *
 * Al confirmar:
 *   1. Crea el relevamiento (POST /)
 *   2. Lanza el scraping (POST /{id}/ejecutar-scraping)
 *   3. Notifica a la página para ir a ScrapingStatus
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { useInventarioStockStore } from '../../../stores/inventarioStockStore';
import type { Relevamiento } from '../../../types/inventarioStock';

// Proveedores configurados (los 14 del ciclo)
// En el futuro esto podría venir de la API
const PROVEEDORES = [
  'ARGENTINA MEDICAL PRODUCTS SRL',
  'BIOSUD',
  'UNIFARMA',
  'Dongguan',
  'Numed Inc.',
  'Numed Canada inc',
  'St. Jude',
  'Barraca Acher',
  'Corpo Medica',
  'Tecnology',
  'Taewoong',
  'INSPIRE MD',
  ''
  // Agregar el resto de los 14 proveedores del ciclo
];

const schema = z.object({
  proveedor: z.string().min(1, 'Seleccioná un proveedor'),
  mes_ciclo: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Formato inválido')
    .min(1, 'Seleccioná el mes del ciclo'),
});

type FormData = z.infer<typeof schema>;

interface NuevoRelevamientoFormProps {
  onCreado: (rel: Relevamiento) => void;
  onCancelar: () => void;
}

const NuevoRelevamientoForm = ({ onCreado, onCancelar }: NuevoRelevamientoFormProps) => {
  const { crearRelevamiento, ejecutarScraping } = useInventarioStockStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Mes actual como default
      mes_ciclo: format(new Date(), 'yyyy-MM'),
    },
  });

  const onSubmit = async (data: FormData) => {
    // 1. Crear relevamiento
    const nuevo = await crearRelevamiento({
      proveedor: data.proveedor,
      mes_ciclo: data.mes_ciclo,
    });

    if (!nuevo) return; // El store ya muestra el toast de error

    // 2. Lanzar scraping inmediatamente
    await ejecutarScraping(nuevo.id);

    // 3. Pasar a la vista de status (el scraping corre en background)
    onCreado(nuevo);
  };

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        {/* Info del flujo */}
        <div className="flex gap-3 p-4 bg-teal-50 rounded-lg border border-teal-100">
          <Info size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-teal-700">
            <p className="font-medium mb-1">¿Qué va a pasar?</p>
            <ol className="space-y-0.5 list-decimal list-inside text-teal-600">
              <li>StoneFixer extrae las series de Omnimedica</li>
              <li>En paralelo, consulta las cantidades en Finnegans</li>
              <li>Genera la planilla Excel para el conteo físico</li>
            </ol>
            <p className="mt-2 text-teal-600">El proceso tarda entre 2 y 5 minutos según el proveedor.</p>
          </div>
        </div>

        {/* Proveedor */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Proveedor <span className="text-red-500">*</span>
          </label>
          <select
            {...register('proveedor')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
          >
            <option value="">Seleccioná un proveedor...</option>
            {PROVEEDORES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.proveedor && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm">
              <AlertCircle size={14} />
              <span>{errors.proveedor.message}</span>
            </div>
          )}
        </div>

        {/* Mes del ciclo */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Mes del ciclo <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            {...register('mes_ciclo')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
          />
          {errors.mes_ciclo && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm">
              <AlertCircle size={14} />
              <span>{errors.mes_ciclo.message}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Iniciando...
              </>
            ) : (
              'Iniciar relevamiento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoRelevamientoForm;