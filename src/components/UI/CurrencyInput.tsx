import React, { useEffect, useState } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';

interface CurrencyInputProps {
    id: string;
    name: string;
    value: number;
    onChange: (name: string, value: number) => void;
    error?: string | number;
    placeholder?: string;
    className?: string;
    label?: string;
    required?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({id, name, value, onChange, error, placeholder = "0.00", className = "", label, required = false}) => {

  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Funcion para formatear numero a moneda
  const formatCurrency = (num: number): string => {
    if (num == 0 || isNaN(num)) return '';

    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  };

  // Funcion para limpiar el valor y convertir a numero
  const parseCurrency = (str: string): number =>{
    if (!str || str.trim() == ' ') return 0;

    // Remover todos los separadores y caracteres no numeros excepto el punto decimal
    const cleaned = str.replace(/[^\d,]/g, '').replace(',','.');
    const parsed = parseFloat(cleaned)

    return isNaN(parsed) ? 0 : parsed;
  };

  //Actualizar el valor mostrado cuando cambia el valor externo
  useEffect(()=>{
    if(!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  },[value, isFocused])

  // Inicializar el valor mostrado
  useEffect(() =>{
    setDisplayValue(formatCurrency(value))
  }, []);

  const handleFocus = () =>{
    setIsFocused(true);
    //Al hacer focus, mostrar el valor sin formato para facilitar la edicion
    if ( value > 0 ) {
      setDisplayValue(CSSMathValue.toString().replace('.',','));
    } else {
      setDisplayValue('');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseCurrency(displayValue);
    onChange(name, numericValue);
    setDisplayValue(formatCurrency(numericValue));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir solo números, comas y puntos
    const validInput = inputValue.replace(/[^\d,\.]/g, '');
    
    setDisplayValue(validInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de control
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    
    if (controlKeys.includes(e.key)) return;
    
    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
    
    // Solo permitir números, coma y punto
    if (!/[\d,\.]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
      )}
      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            block w-full pl-10 pr-3 py-2 
            rounded-md border-gray-300 shadow-sm 
            focus:ring-emerald-500 focus:border-emerald-500
            [appearance:textfield] 
            [&::-webkit-outer-spin-button]:appearance-none 
            [&::-webkit-inner-spin-button]:appearance-none
            ${error ? 'border-red-300 ring-red-500' : ''}
            ${className}
          `}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CurrencyInput;