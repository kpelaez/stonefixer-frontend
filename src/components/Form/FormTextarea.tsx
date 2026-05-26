import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

/**
Textarea reutilizable integrado con React Hook Form
*/


interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
  helpText?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  className = '',
  helpText,
}) => {
  const textareaId = `textarea-${name}`;
  
  return (
    <div className="form-group">
      <label htmlFor={textareaId} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={textareaId}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={`
          form-textarea
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className}
        `}
        {...register(name)}
      />
      
      {maxLength && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          Máximo {maxLength} caracteres
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
      
      {error && (
        <p id={`${textareaId}-error`} className="text-sm text-red-600 mt-1" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};