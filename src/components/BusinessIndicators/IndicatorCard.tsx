import React from 'react';
import { BusinessIndicator, IndicatorTrend, IndicatorFormat, IndicatorColor } from '../../types/businessIndicators';
import { TrendingUp, TrendingDown, Minus, DollarSign, CreditCard, Clock, RotateCcw, Building } from 'lucide-react';

interface IndicatorCardProps { 
    indicator: BusinessIndicator;
    onClick?: () => void;
}


const IndicatorCard: React.FC<IndicatorCardProps> = ({indicator, onClick}) => {
  
  const formatValue = (value: number | string, format: IndicatorFormat, _unit?: string): string => {
    if(typeof value === 'string') return value;

    switch(format) {
        case IndicatorFormat.CURRENCY:
            return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        case IndicatorFormat.PERCENTAGE:
            return `${value.toFixed(1)}%`;
        case IndicatorFormat.DAYS:
            return `${value} dias`;
        case IndicatorFormat.DECIMAL:
            return value.toFixed(2);
        case IndicatorFormat.NUMBER:
        default:
            return new Intl.NumberFormat('es-AR').format(value);
    }
  };

  // Funcion para obtener el icono segun el Id del indicador
  const getIcon = (indicatorId: string) => {
    const iconClass = "w-5 h-5 md:w-6 md:h-6";
    
    switch (indicatorId) {
      case 'ventas':
        return <DollarSign className={iconClass} />;
      case 'cobranzas':
        return <CreditCard className={iconClass} />;
      case 'cta_cte':
        return <Building className={iconClass} />;
      case 'dias_cobro':
        return <Clock className={iconClass} />;
      case 'giro_negocio':
        return <RotateCcw className={iconClass} />;
      default:
        return <DollarSign className={iconClass} />;
    }
  };
  
  // Función para obtener el icono de tendencia
  const getTrendIcon = (trend?: IndicatorTrend) => {
    const iconClass = "w-3 h-3 md:w-4 md:h-4";
    
    switch (trend) {
      case IndicatorTrend.UP:
        return <TrendingUp className={`${iconClass} text-green-500`} />;
      case IndicatorTrend.DOWN:
        return <TrendingDown className={`${iconClass} text-red-500`} />;
      case IndicatorTrend.NEUTRAL:
        return <Minus className={`${iconClass} text-gray-500`} />;
      default:
        return null;
    }
  };

  // Función para obtener los colores según el color del indicador
  const getColorClasses = (color?: IndicatorColor) => {
    switch (color) {
      case IndicatorColor.GREEN:
        return {
          bg: 'bg-green-50 hover:bg-green-100',
          border: 'border-green-200',
          icon: 'text-green-600',
          text: 'text-green-800'
        };
      case IndicatorColor.RED:
        return {
          bg: 'bg-red-50 hover:bg-red-100',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800'
        };
      case IndicatorColor.BLUE:
        return {
          bg: 'bg-blue-50 hover:bg-blue-100',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800'
        };
      case IndicatorColor.YELLOW:
        return {
          bg: 'bg-yellow-50 hover:bg-yellow-100',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800'
        };
      case IndicatorColor.PURPLE:
        return {
          bg: 'bg-purple-50 hover:bg-purple-100',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          text: 'text-purple-800'
        };
      default:
        return {
          bg: 'bg-gray-50 hover:bg-gray-100',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          text: 'text-gray-800'
        };
    }
  };

  const colors = getColorClasses(indicator.color);
  return (
    <div 
      className={`
        ${colors.bg} ${colors.border} 
        border-2 rounded-xl p-4 md:p-6 
        transition-all duration-200 
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        transform hover:scale-[1.02]
        h-full flex flex-col justify-between
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon}`}>
          {getIcon(indicator.id)}
        </div>
        
        {indicator.trend && (
          <div className="flex items-center gap-1">
            {getTrendIcon(indicator.trend)}
            {indicator.trendPercentage !== undefined && (
              <span className={`text-xs md:text-sm font-medium ${
                indicator.trend === IndicatorTrend.UP ? 'text-green-600' :
                indicator.trend === IndicatorTrend.DOWN ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {Math.abs(indicator.trendPercentage)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className={`text-sm md:text-base font-medium ${colors.text} mb-1 md:mb-2`}>
          {indicator.name}
        </h3>
        
        <div className="mb-2">
          <span className={`text-xl md:text-2xl lg:text-3xl font-bold ${colors.text} block`}>
            {formatValue(indicator.value, indicator.format, indicator.unit)}
          </span>
        </div>

        {/* Previous value comparison */}
        {indicator.previousValue !== undefined && (
          <div className="text-xs md:text-sm text-gray-600 mb-2">
            Anterior: {formatValue(indicator.previousValue, indicator.format, indicator.unit)}
          </div>
        )}

        {/* Description */}
        {indicator.description && (
          <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
            {indicator.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default IndicatorCard;