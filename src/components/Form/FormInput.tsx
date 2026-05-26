import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

/**
 * Input reutilizable integrado con React Hook Form
 * 
 * Características:
 * - Manejo automático de errores
 * - Estilos consistentes
 * - Tipos TypeScript estrictos
 * - Accesibilidad (labels, aria-attributes)
 */

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url';
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
  className = '',
  helpText,
  min,
  max,
  step,
}) => {
  const inputId = `input-${name}`;
  
  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`
          form-input
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className}
        `}
        {...register(name, { valueAsNumber: type === 'number' })}
      />
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
      
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600 mt-1" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};