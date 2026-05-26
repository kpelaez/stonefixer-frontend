// src/pages/ShiftSchedulePage/components/CalendarView.tsx
import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './calendar-styles.css';
import { ShiftSchedule } from '../../../types/shiftSchedule';
import ShiftDialog from './ShiftDialog';

interface CalendarViewProps {
  shifts: ShiftSchedule[];
  currentMonth: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onShiftCreated: () => void;
  onShiftUpdated: () => void;
  onShiftDeleted: () => void;
}

const CalendarView = ({
  shifts,
  currentMonth,
  onMonthChange,
  onGoToToday,
  onShiftCreated,
  onShiftUpdated,
  onShiftDeleted,
}: CalendarViewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftSchedule | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Convertir shifts a eventos de FullCalendar
  const events = shifts.map((shift) => ({
    id: shift.id.toString(),
    title: `🌅  ${shift.user_full_name || 'Usuario'}`,
    start: shift.date,
    allDay: true,
    backgroundColor: '#f97316',
    borderColor: '#ea580c',
    extendedProps: {
      shift: shift,
    },
  }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const clickedDate = selectInfo.startStr;
    const today = new Date().toISOString().split('T')[0];

    // No permitir seleccionar fechas pasadas
    if (clickedDate < today) {
      alert('No puedes crear turnos en fechas pasadas');
      return;
    }

    setSelectedDate(clickedDate);
    setSelectedShift(null);
    setDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const shift = clickInfo.event.extendedProps.shift as ShiftSchedule;
    setSelectedShift(shift);
    setSelectedDate(shift.date);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    setSelectedShift(null);
  };

  const handleGoToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
    onGoToToday();
  };

  const handlePrevMonth = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
      onMonthChange('prev');
    }
  };

  const handleNextMonth = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
      onMonthChange('next');
    }
  };

  return (
    <>
      {/* Controles personalizados */}
      <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            ◀ Anterior
          </button>
          
          <button
            onClick={handleGoToToday}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            📅 Hoy
          </button>
          
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            Siguiente ▶
          </button>
        </div>

        <div className="text-2xl font-bold text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </div>
      </div>

      {/* Calendario */}
      <div className="fullcalendar-wrapper">
        <FullCalendar
          key={currentMonth.toISOString()}
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={false}
          initialDate={currentMonth}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          editable={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          selectConstraint={{
            start: new Date().toISOString().split('T')[0],
          }}
        />
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-gray-700">🌅 Turno Early (7:00 AM)</span>
        </div>
      </div>

      {/* Dialog para crear/editar turno */}
      {dialogOpen && (
        <ShiftDialog
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          selectedDate={selectedDate}
          existingShift={selectedShift}
          onShiftCreated={onShiftCreated}
          onShiftUpdated={onShiftUpdated}
          onShiftDeleted={onShiftDeleted}
        />
      )}

      {/* Estilos para FullCalendar */}
      <style>{`
        .fullcalendar-wrapper {
          font-family: inherit;
        }

        .fc {
          font-size: 0.9rem;
        }

        .fc-daygrid-day {
          cursor: pointer;
        }

        .fc-daygrid-day:hover {
          background-color: #f0fdf4;
        }

        .fc-event {
          cursor: pointer;
          font-size: 0.85rem;
          padding: 2px 4px;
        }

        .fc-event:hover {
          opacity: 0.8;
        }

        .fc-toolbar-title {
          text-transform: capitalize;
          font-size: 1.5rem !important;
          font-weight: 700;
        }

        .fc-button {
          background-color: #059669 !important;
          border-color: #059669 !important;
          text-transform: capitalize;
        }

        .fc-button:hover {
          background-color: #047857 !important;
        }

        .fc-button:disabled {
          opacity: 0.5;
        }

        .fc-day-today {
          background-color: #ecfdf5 !important;
        }
      `}</style>
    </>
  );
};

export default CalendarView;