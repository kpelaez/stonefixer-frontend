import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

/**
Select reutilizable integrado con React Hook Form
*/

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  options: SelectOption[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  helpText?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  options,
  register,
  error,
  required = false,
  disabled = false,
  placeholder = 'Seleccione una opción',
  className = '',
  helpText,
}) => {
  const selectId = `select-${name}`;
  
  return (
    <div className="form-group">
      <label htmlFor={selectId} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={selectId}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`
          form-select
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className}
        `}
        {...register(name)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
      
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-600 mt-1" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};