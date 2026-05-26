// src/pages/ShiftSchedulePage/ShiftSchedulePage.tsx
import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths} from 'date-fns';
import CalendarView from './components/CalendarView';
import StatsPanel from './components/StatsPanel';
import AlertsBanner from './components/AlertsBanner';
import shiftScheduleService from '../../services/shiftScheduleService';
import { ShiftSchedule, ShiftScheduleStats, ShiftAlert } from '../../types/shiftSchedule';

const ShiftSchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [stats, setStats] = useState<ShiftScheduleStats[]>([]);
  const [alerts, setAlerts] = useState<ShiftAlert[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true); // ← Separado
  const [loadingStats, setLoadingStats] = useState(true);   // ← Separado
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Cargar datos
  const loadData = useCallback(async (month: Date) => {
    const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

    // === Cargar shifts ===
    setLoadingShifts(true);
    setShiftsError(null);

    try {
      const data = await shiftScheduleService.getShiftSchedules(startDate, endDate);
      setShifts(data);
    } catch (err) {
      // FIX: antes el error era silencioso (solo console.error).
      // Ahora se muestra en pantalla para que el usuario sepa qué pasó.
      const message = err instanceof Error ? err.message : 'Error al cargar los turnos';
      console.error('Error loading shifts:', err);
      setShiftsError(message);
    } finally {
      setLoadingShifts(false);
    }

    // === Cargar stats y alertas en paralelo (no crítico) ===
    setLoadingStats(true);
    setStatsError(null);

    try {
      const [statsData, alertsData] = await Promise.all([
        shiftScheduleService.getStats(startDate, endDate),
        shiftScheduleService.getAlerts(),
      ]);
      setStats(statsData);
      setAlerts(alertsData.alerts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      console.error('Error loading stats/alerts:', err);
      setStatsError(message);
    } finally {
      setLoadingStats(false);
    }
  }, []);


  useEffect(() => {
    loadData(currentMonth);
  }, [currentMonth, loadData]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  // FIX: navegación a "Hoy" sin window.location.reload()
  const handleGoToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleShiftCreated = () => loadData(currentMonth);
  const handleShiftUpdated = () => loadData(currentMonth);
  const handleShiftDeleted = () => loadData(currentMonth);

  return (
    <div>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Calendario de Turnos - Stock
            </h1>
            <p className="text-gray-600 mt-1">
              Organiza y visualiza los turnos del equipo
            </p>
          </div>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <AlertsBanner alerts={alerts} />
        )}

        {/* Error de turnos — visible para el usuario */}
        {shiftsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium"> Error al cargar turnos</p>
            <p className="text-red-600 text-sm mt-1">{shiftsError}</p>
            <button
              onClick={() => loadData(currentMonth)}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Error de estadísticas — no bloquea el calendario */}
        {statsError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">⚠️ No se pudieron cargar las estadísticas</p>
          </div>
        )}
        {/* Estadísticas */}
        {loadingStats ? (
          <div className="bg-gray-100 rounded-lg h-32 animate-pulse" />
        ) : stats.length > 0 ? (
          <StatsPanel stats={stats} currentMonth={currentMonth} />
        ) : null}

        {/* Calendario */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {loadingShifts && shifts.length === 0 ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <CalendarView
              shifts={shifts}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              onGoToToday={handleGoToToday}
              onShiftCreated={handleShiftCreated}
              onShiftUpdated={handleShiftUpdated}
              onShiftDeleted={handleShiftDeleted}
            />
          )}

          {/* Indicador de carga superpuesto */}
          {loadingShifts && shifts.length > 0 && (
            <div className="absolute top-4 right-4">
              <div className="bg-white rounded-full p-2 shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftSchedulePage;