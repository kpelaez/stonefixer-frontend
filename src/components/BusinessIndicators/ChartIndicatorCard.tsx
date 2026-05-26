import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { BusinessIndicator, IndicatorTrend, IndicatorFormat, IndicatorColor } from '../../types/businessIndicators';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  CreditCard,
  Clock,
  RotateCcw,
  Building
} from 'lucide-react';

interface ChartIndicatorCardProps {
  indicator: BusinessIndicator;
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'mini-line';
  historicalData?: Array<{ date: string; value: number }>;
  onClick?: () => void;
}

const ChartIndicatorCard: React.FC<ChartIndicatorCardProps> = ({ 
  indicator, 
  chartType = 'mini-line',
  historicalData,
  onClick 
}) => {
  
  // Función para formatear el valor según el tipo
  const formatValue = (value: number | string, format: IndicatorFormat, _unit?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
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
        return `${value} días`;
      
      case IndicatorFormat.DECIMAL:
        return value.toFixed(2);
      
      case IndicatorFormat.NUMBER:
      default:
        return new Intl.NumberFormat('es-AR').format(value);
    }
  };

  // Función para obtener el icono según el ID del indicador
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
          text: 'text-green-800',
          chart: '#10b981'
        };
      case IndicatorColor.RED:
        return {
          bg: 'bg-red-50 hover:bg-red-100',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          chart: '#ef4444'
        };
      case IndicatorColor.BLUE:
        return {
          bg: 'bg-blue-50 hover:bg-blue-100',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
          chart: '#3b82f6'
        };
      case IndicatorColor.YELLOW:
        return {
          bg: 'bg-yellow-50 hover:bg-yellow-100',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          chart: '#f59e0b'
        };
      case IndicatorColor.PURPLE:
        return {
          bg: 'bg-purple-50 hover:bg-purple-100',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          text: 'text-purple-800',
          chart: '#8b5cf6'
        };
      default:
        return {
          bg: 'bg-gray-50 hover:bg-gray-100',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          text: 'text-gray-800',
          chart: '#6b7280'
        };
    }
  };

  // Generar datos mock si no hay historical data
  const generateMockData = () => {
    const data = [];
    const baseValue = typeof indicator.value === 'number' ? indicator.value : 1000000;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.3;
      const value = Math.max(0, baseValue * (1 + variation));
      
      data.push({
        date: date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
        value: Math.round(value),
        displayValue: formatValue(value, indicator.format)
      });
    }
    return data;
  };

  const chartData = historicalData || generateMockData();
  const colors = getColorClasses(indicator.color);

  // Componente de gráfico según el tipo
  const renderChart = () => {
    const chartHeight = chartType === 'mini-line' ? 60 : 120;
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.chart}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: colors.chart }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={colors.chart}
                fill={`${colors.chart}20`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData.slice(-7)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide />
              <Bar dataKey="value" fill={colors.chart} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'mini-line':
      default:
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData.slice(-14)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.chart}
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

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
          <div className="text-xs md:text-sm text-gray-600 mb-3">
            Anterior: {formatValue(indicator.previousValue, indicator.format, indicator.unit)}
          </div>
        )}

        {/* Chart */}
        <div className="mb-3">
          {renderChart()}
        </div>
        {/* Description */}
        {indicator.description && (
          <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
            {indicator.description}
          </p>
        )}
      </div>
    
    </div>
  );
};

export default ChartIndicatorCard;