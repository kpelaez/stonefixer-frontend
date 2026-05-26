/**
 * Schemas de validación con Zod para el módulo de inventario
 * Compatible con Zod v3
 */

import { z } from 'zod';
import { AssetCategory, AssetStatus } from '../types/inventory';

// VALIDACIONES COMUNES (reutilizables)

const requiredString = (fieldName: string) =>
  z.string({
    message: `${fieldName} es requerido`,
  })
  .min(1, `${fieldName} no puede estar vacío`)
  .trim();

const optionalString = z.string().trim().optional().or(z.literal(''));

const dateString = (fieldName: string) =>
  z.string({
    message: `${fieldName} es requerida`,
  })
  .refine((date) => {
    if (!date || date === '') return false;
    return !isNaN(Date.parse(date + 'T00:00:00Z'));
  }, {
    message: `${fieldName} debe ser una fecha válida`,
  })
  .transform((date) => new Date(date + 'T00:00:00Z').toISOString());

// SCHEMA: CREAR ACTIVO TECNOLÓGICO

export const techAssetBaseSchema = z.object({
  // Campos obligatorios
  name: requiredString('Nombre'),
  brand: requiredString('Marca'),
  model: requiredString('Modelo'),
  serial_number: requiredString('Número de serie')
    .min(3, 'El número de serie debe tener al menos 3 caracteres')
    .max(100, 'El número de serie es demasiado largo'),
  
  category: z.enum(AssetCategory, {
    message: 'Debe seleccionar una categoría válida',
  }),
  
  purchase_date: dateString('Fecha de compra')
    .refine((date) => {
      const purchaseDate = new Date(date);
      const today = new Date();
      return purchaseDate <= today;
    }, {
      message: 'La fecha de compra no puede ser futura',
    }),
  
  // Campos opcionales
  description: optionalString,
  asset_tag: optionalString,
  status: z.enum(AssetStatus, {message: 'Debe seleccionar un estado valido'}),
  
  // Información de compra
  purchase_price: z.number()
    .nonnegative('El precio debe ser mayor a 0')
    .max(10000000, 'El precio es demasiado alto')
    .optional(),
  
  supplier: optionalString,
  invoice: z.string()
  .optional()
  .refine((invoice) => {
    if (!invoice || invoice === '') return true;
    return /^[A-Z]-\d{4}-\d{8}$/.test(invoice);
  }, {
    message: 'Formato de factura inválido. Use: A-0000-00000000',
  }),
  
  // Garantía
  warranty_expiry: dateString('Fecha de garantia')
    .optional()
    .refine((date) => {
      if (!date) return true; // Si es opcional y está vacío, OK
      return !isNaN(Date.parse(date));
    }, {
      message: 'Debe ser una fecha válida',
    }),
  
  warranty_provider: optionalString,
  
  // Ubicación
  location: optionalString,
  department: optionalString,
  
  // Información técnica
  specifications: optionalString
    .refine((specs) => {
      if (!specs) return true;
      return specs.length <= 2000;
    }, {
      message: 'Las especificaciones son demasiado largas (máx 2000 caracteres)',
    }),
  
  notes: optionalString
    .refine((notes) => {
      if (!notes) return true;
      return notes.length <= 1000;
    }, {
      message: 'Las notas son demasiado largas (máx 1000 caracteres)',
    }),
})

// Schema de CREACIÓN = base + validación cruzada
export const techAssetCreateSchema = techAssetBaseSchema.refine((data) => {
  // Validación: Si hay precio, debe haber fecha de compra
  if (data.purchase_price && data.purchase_price > 0 && !data.purchase_date) {
    return false;
  }
  return true;
}, {
  message: 'Si especifica un precio, debe incluir la fecha de compra',
  path: ['purchase_date'],
});

// Inferir el tipo TypeScript desde el schema
export type TechAssetCreateFormData = z.infer<typeof techAssetCreateSchema>;

// SCHEMA: ACTUALIZAR ACTIVO TECNOLÓGICO

export const techAssetUpdateSchema = techAssetBaseSchema.partial();
export type TechAssetUpdateFormData = z.infer<typeof techAssetUpdateSchema>;

// SCHEMA: ASIGNAR ACTIVO

export const assetAssignmentCreateSchema = z.object({  
  // Campo requerido: se setea programáticamente cuando el usuario selecciona
  // un activo en la lista. Se valida con setValue + trigger.
  tech_asset_id: z.number({
    message: 'Debe seleccionar un activo',
  }).positive('ID de activo inválido'),

  
  assigned_to_user_id: z.number({
    message: 'Debe seleccionar un usuario',
  }).positive('ID de usuario inválido'),
    
  expected_return_date: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      return !isNaN(Date.parse(date));
    }, {
      message: 'Debe ser una fecha válida',
    })
    .refine((date) => {
      if (!date) return true;
      const returnDate = new Date(date);
      const today = new Date();
      return returnDate >= today;
    }, {
      message: 'La fecha de devolución no puede ser pasada',
    }),
  
  assignment_reason: requiredString('Razón de asignacion'),
  location_of_use: requiredString('Ubicación de uso')
    .min(2, 'La ubicación debe tener al menos 2 caracteres'),
  condition_at_assignment: optionalString,
  assignment_notes: optionalString,
  accessories: z.string().optional(),
});

export type AssetAssignmentCreateFormData = z.infer<typeof assetAssignmentCreateSchema>;

// SCHEMA: DEVOLVER ACTIVO

export const assetReturnSchema = z.object({
  actual_return_date: dateString('Fecha de devolución')
    .refine((date) => {
      const returnDate = new Date(date);
      const today = new Date();
      return returnDate <= today;
    }, {
      message: 'La fecha de devolución no puede ser futura',
    }),
  
  condition_at_return: requiredString('Condición del activo')
    .min(5, 'Describe la condición con al menos 5 caracteres'),
  
  return_notes: optionalString,
});

export type AssetReturnFormData = z.infer<typeof assetReturnSchema>;

// SCHEMA: MANTENIMIENTO

export const maintenanceCreateSchema = z.object({
  tech_asset_id: z.coerce.number({
    message: 'Debe seleccionar un activo',
  }).positive(),
  
  maintenance_type: requiredString('Tipo de mantenimiento'),
  description: requiredString('Descripción')
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  
  scheduled_date: dateString('Fecha programada'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    message: 'Seleccione una prioridad válida',
  }),
  
  estimated_cost: z.coerce.number()
    .nonnegative('El costo no puede ser negativo')
    .optional(),
  
  notes: optionalString,
});

export type MaintenanceCreateFormData = z.infer<typeof maintenanceCreateSchema>;

// UTILIDADES DE VALIDACIÓN

/**
 * Valida un schema y retorna errores formateados
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Formatear errores de Zod a un objeto simple
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
}