'use client';

import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useCallback, useMemo } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  nl: nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: nl }),
  getDay,
  locales,
});

// Custom event types for the calendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'available' | 'blocked' | 'booked' | 'ceremony';
  description?: string;
  allDay?: boolean;
}

interface BabsCalendarProps {
  events: CalendarEvent[];
  onSelectSlot: (slotInfo: { start: Date; end: Date; action: string }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  defaultView?: View;
}

export function BabsCalendar({
  events,
  onSelectSlot,
  onSelectEvent,
  defaultView = 'month',
}: BabsCalendarProps) {
  const [view, setView] = useState<View>(defaultView);
  const [date, setDate] = useState(new Date());

  // Event styling based on type
  const eventStyleGetter = useCallback(
    (event: Event) => {
      const calendarEvent = event as CalendarEvent;
      let backgroundColor = '#3b82f6'; // blue-600 default
      let color = 'white';

      switch (calendarEvent.type) {
        case 'available':
          backgroundColor = '#10b981'; // green-500
          break;
        case 'blocked':
          backgroundColor = '#ef4444'; // red-500
          break;
        case 'booked':
          backgroundColor = '#f59e0b'; // amber-500
          break;
        case 'ceremony':
          backgroundColor = '#8b5cf6'; // purple-500 - geboekte ceremonie
          break;
      }

      return {
        style: {
          backgroundColor,
          color,
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.875rem',
          padding: '2px 6px',
        },
      };
    },
    []
  );

  // Custom messages in Dutch
  const messages = useMemo(
    () => ({
      date: 'Datum',
      time: 'Tijd',
      event: 'Gebeurtenis',
      allDay: 'Hele dag',
      week: 'Week',
      work_week: 'Werkweek',
      day: 'Dag',
      month: 'Maand',
      previous: 'Vorige',
      next: 'Volgende',
      yesterday: 'Gisteren',
      tomorrow: 'Morgen',
      today: 'Vandaag',
      agenda: 'Agenda',
      noEventsInRange: 'Geen gebeurtenissen in deze periode',
      showMore: (total: number) => `+ ${total} meer`,
    }),
    []
  );

  const handleNavigate = useCallback(
    (newDate: Date, newView: View, action: string) => {
      setDate(newDate);
    },
    []
  );

  return (
    <div className="h-[600px] bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <style jsx global>{`
        .rbc-calendar {
          font-family: 'Noto Sans', sans-serif;
        }
        .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }
        .rbc-today {
          background-color: #eff6ff;
        }
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        .rbc-event {
          padding: 2px 6px;
        }
        .rbc-event-label {
          font-size: 0.75rem;
        }
        .rbc-toolbar {
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .rbc-toolbar button {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        .rbc-toolbar button.rbc-active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
        .rbc-month-view,
        .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .rbc-date-cell {
          padding: 4px;
        }
        .rbc-date-cell.rbc-now {
          font-weight: 700;
        }
        .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events as Event[]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={handleNavigate}
        onSelectSlot={onSelectSlot}
        onSelectEvent={(event: Event) => {
          // Ensure event has required properties before casting
          if (event.start && event.end) {
            onSelectEvent(event as CalendarEvent);
          }
        }}
        eventPropGetter={eventStyleGetter}
        selectable
        popup
        messages={messages}
        culture="nl"
        views={['month', 'week', 'day', 'agenda']}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 8, 0, 0)} // 08:00
        max={new Date(0, 0, 0, 18, 0, 0)} // 18:00
      />
    </div>
  );
}

// Legend component to show event types
export function CalendarLegend() {
  return (
    <div className="flex gap-4 items-center text-sm mb-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-green-500"></div>
        <span className="text-gray-700">Beschikbaar</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-red-500"></div>
        <span className="text-gray-700">Geblokkeerd</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-purple-500"></div>
        <span className="text-gray-700">Geboekte Ceremonie</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-amber-500"></div>
        <span className="text-gray-700">Geboekt</span>
      </div>
    </div>
  );
}

