declare module 'react-big-calendar' {
  import { Component, CSSProperties } from 'react';
  import { Locale } from 'date-fns';

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

  export interface Event {
    title?: string;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    resource?: any;
    [key: string]: any;
  }

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: 'select' | 'click' | 'doubleClick';
  }

  export interface CalendarProps {
    localizer: any;
    events?: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    defaultDate?: Date;
    defaultView?: View;
    date?: Date;
    view?: View;
    onView?: (view: View) => void;
    onNavigate?: (date: Date, view: View, action: string) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    onSelectEvent?: (event: Event) => void;
    eventPropGetter?: (event: Event) => { style?: CSSProperties; className?: string };
    selectable?: boolean;
    popup?: boolean;
    messages?: Record<string, string | ((total: number) => string)>;
    culture?: string;
    views?: View[];
    step?: number;
    timeslots?: number;
    min?: Date;
    max?: Date;
    style?: CSSProperties;
    className?: string;
    [key: string]: any;
  }

  export class Calendar extends Component<CalendarProps> {}

  export interface DateLocalizer {
    format(value: Date | string, format: string, culture?: string): string;
    parse(value: string, format: string, culture?: string): Date | null;
    startOfWeek(date: Date, culture?: string): Date;
    endOfWeek(date: Date, culture?: string): Date;
    startOfDay(date: Date): Date;
    endOfDay(date: Date): Date;
    getDay(date: Date): number;
    getTimezone(): string;
  }

  export interface DateFnsLocalizerConfig {
    format: (date: Date, format: string, options?: { locale?: Locale }) => string;
    parse: (str: string, format: string, referenceDate: Date, options?: { locale?: Locale }) => Date;
    startOfWeek: (date: Date, options?: { locale?: Locale }) => Date;
    getDay: (date: Date) => number;
    locales?: Record<string, Locale>;
  }

  export function dateFnsLocalizer(config: DateFnsLocalizerConfig): DateLocalizer;

  export default Calendar;
}

