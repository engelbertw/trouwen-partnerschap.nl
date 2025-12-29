'use client';

import type { JSX } from 'react';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BabsCalendar, CalendarLegend, type CalendarEvent } from '@/components/BabsCalendar';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LocatieData {
  id: string;
  naam: string;
  code: string;
  type: string;
  actief: boolean;
  beschikbaarVanaf?: string;
  beschikbaarTot?: string;
  opmerkingBeschikbaarheid?: string;
}

interface RecurringRule {
  id: string;
  ruleType: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  weekOfMonth?: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil?: string;
  description?: string;
}

interface BlockedDate {
  id: string;
  blockedDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export default function LocatieCalendarPage({ params }: { params: Promise<{ locatieId: string }> }): JSX.Element {
  // Unwrap params Promise using React.use() (Next.js 15 requirement)
  const resolvedParams = use(params);
  const router = useRouter();
  const [locatie, setLocatie] = useState<LocatieData | null>(null);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [showQuickAvailable, setShowQuickAvailable] = useState(false);
  const [showQuickBlock, setShowQuickBlock] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Quick available form
  const [quickAvailableReason, setQuickAvailableReason] = useState('');
  const [quickAvailableAllDay, setQuickAvailableAllDay] = useState(true);
  const [quickAvailableStartTime, setQuickAvailableStartTime] = useState('09:00');
  const [quickAvailableEndTime, setQuickAvailableEndTime] = useState('17:00');
  
  // Quick block form
  const [quickBlockReason, setQuickBlockReason] = useState('');
  const [quickBlockAllDay, setQuickBlockAllDay] = useState(true);
  
  // Add rule form
  const [ruleForm, setRuleForm] = useState({
    ruleType: 'weekly',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    weekOfMonth: 1,
    intervalWeeks: 2,
    startTime: '09:00',
    endTime: '17:00',
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validUntil: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, [resolvedParams.locatieId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch locatie data
      const locatieRes = await fetch(`/api/gemeente/lookup/locaties`);
      const locatieData = await locatieRes.json();
      
      if (locatieData.success) {
        const currentLocatie = locatieData.data.find((l: LocatieData) => l.id === resolvedParams.locatieId);
        if (currentLocatie) {
          setLocatie(currentLocatie);
        } else {
          setError('Locatie niet gevonden');
          return;
        }
      }

      // Fetch recurring rules
      const rulesRes = await fetch(`/api/gemeente/locaties/${resolvedParams.locatieId}/recurring-rules`);
      const rulesData = await rulesRes.json();
      if (rulesData.success) {
        setRules(rulesData.data);
      }

      // Fetch blocked dates
      const blockedRes = await fetch(`/api/gemeente/locaties/${resolvedParams.locatieId}/blocked-dates`);
      const blockedData = await blockedRes.json();
      if (blockedData.success) {
        setBlockedDates(blockedData.data);
      }

      // Build calendar events
      buildCalendarEvents(rulesData.data || [], blockedData.data || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Er ging iets mis bij het ophalen van gegevens');
    } finally {
      setIsLoading(false);
    }
  };

  const buildCalendarEvents = (rulesList: RecurringRule[], blockedList: BlockedDate[]) => {
    const calendarEvents: CalendarEvent[] = [];
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    // Add blocked dates as red events
    blockedList.forEach((block) => {
      const date = parseISO(block.blockedDate);
      calendarEvents.push({
        id: `block-${block.id}`,
        title: block.reason || 'Geblokkeerd',
        start: block.allDay ? date : new Date(`${block.blockedDate}T${block.startTime}`),
        end: block.allDay ? date : new Date(`${block.blockedDate}T${block.endTime}`),
        type: 'blocked',
        description: block.reason,
        allDay: block.allDay,
      });
    });

    // Expand recurring rules into actual calendar events
    rulesList.forEach((rule) => {
      const description = rule.description || getRuleDescription(rule);
      const validFrom = parseISO(rule.validFrom);
      const validUntil = rule.validUntil ? parseISO(rule.validUntil) : threeMonthsLater;
      
      // Generate events for each matching date
      const currentDate = new Date(Math.max(validFrom.getTime(), today.getTime()));
      const endDate = new Date(Math.min(validUntil.getTime(), threeMonthsLater.getTime()));
      
      while (currentDate <= endDate) {
        let shouldAddEvent = false;
        
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        switch (rule.ruleType) {
          case 'weekly':
            shouldAddEvent = dayOfWeek === rule.dayOfWeek;
            break;
          case 'workdays':
            // Monday (1) through Friday (5)
            shouldAddEvent = dayOfWeek >= 1 && dayOfWeek <= 5;
            break;
          case 'biweekly':
            shouldAddEvent = dayOfWeek === rule.dayOfWeek;
            // TODO: Add proper biweekly logic with interval tracking
            break;
          case 'monthly_day':
            shouldAddEvent = currentDate.getDate() === rule.dayOfMonth;
            break;
          case 'monthly_weekday':
            // TODO: Implement proper monthly weekday logic
            shouldAddEvent = false;
            break;
        }
        
        if (shouldAddEvent) {
          const eventStart = new Date(currentDate);
          eventStart.setHours(parseInt(rule.startTime.split(':')[0]), parseInt(rule.startTime.split(':')[1]));
          const eventEnd = new Date(currentDate);
          eventEnd.setHours(parseInt(rule.endTime.split(':')[0]), parseInt(rule.endTime.split(':')[1]));
          
          calendarEvents.push({
            id: `rule-${rule.id}-${format(currentDate, 'yyyy-MM-dd')}`,
            title: description,
            start: eventStart,
            end: eventEnd,
            type: 'available',
            description: `${rule.startTime} - ${rule.endTime}`,
            allDay: false,
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    setEvents(calendarEvents);
  };

  const getRuleDescription = (rule: RecurringRule): string => {
    const dagen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    
    switch (rule.ruleType) {
      case 'weekly':
        return `Elke ${dagen[rule.dayOfWeek || 0]}`;
      case 'workdays':
        return 'Elke werkdag (ma-vr)';
      case 'biweekly':
        return `Om de week op ${dagen[rule.dayOfWeek || 0]}`;
      case 'monthly_day':
        return `Elke maand op de ${rule.dayOfMonth}e`;
      case 'monthly_weekday':
        return `${rule.weekOfMonth}e ${dagen[rule.dayOfWeek || 0]} vd maand`;
      default:
        return 'Custom regel';
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action: string }) => {
    setSelectedDate(slotInfo.start);
    setShowQuickAvailable(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'blocked') {
      // Allow unblocking
      const blockId = event.id.replace('block-', '');
      if (confirm(`Blokkering "${event.title}" verwijderen?`)) {
        handleUnblock(blockId);
      }
    } else if (event.type === 'available') {
      // Show rule details
      alert(`Regel: ${event.title}\n${event.description}`);
    }
  };

  const handleQuickAvailable = async () => {
    if (!selectedDate) return;

    // Validate against beschikbaarheid periode
    const validFrom = format(selectedDate, 'yyyy-MM-dd');
    if (locatie?.beschikbaarVanaf && validFrom < locatie.beschikbaarVanaf) {
      if (!confirm(
        `Let op: Deze datum (${format(selectedDate, 'dd MMMM yyyy', { locale: nl })}) ` +
        `is vóór de beschikbaarheidsperiode (vanaf ${format(parseISO(locatie.beschikbaarVanaf), 'dd MMMM yyyy', { locale: nl })}). ` +
        `Wilt u toch doorgaan?`
      )) {
        return;
      }
    }
    if (locatie?.beschikbaarTot && validFrom > locatie.beschikbaarTot) {
      if (!confirm(
        `Let op: Deze datum (${format(selectedDate, 'dd MMMM yyyy', { locale: nl })}) ` +
        `is ná de beschikbaarheidsperiode (tot ${format(parseISO(locatie.beschikbaarTot), 'dd MMMM yyyy', { locale: nl })}). ` +
        `Wilt u toch doorgaan?`
      )) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/gemeente/locaties/${resolvedParams.locatieId}/recurring-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: 'weekly',
          dayOfWeek: selectedDate.getDay(),
          startTime: quickAvailableAllDay ? '08:00' : quickAvailableStartTime,
          endTime: quickAvailableAllDay ? '17:00' : quickAvailableEndTime,
          validFrom: validFrom,
          description: quickAvailableReason || `Beschikbaar op ${format(selectedDate, 'EEEE', { locale: nl })}`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowQuickAvailable(false);
        setQuickAvailableReason('');
        setQuickAvailableAllDay(true);
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error making available:', err);
      alert('Er ging iets mis');
    }
  };

  const handleQuickBlock = async () => {
    if (!selectedDate) return;

    try {
      const response = await fetch(`/api/gemeente/locaties/${resolvedParams.locatieId}/blocked-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedDate: format(selectedDate, 'yyyy-MM-dd'),
          allDay: quickBlockAllDay,
          reason: quickBlockReason || 'Geblokkeerd',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowQuickBlock(false);
        setQuickBlockReason('');
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error blocking date:', err);
      alert('Er ging iets mis');
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      const response = await fetch(
        `/api/gemeente/locaties/${resolvedParams.locatieId}/blocked-dates/${blockId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error unblocking:', err);
      alert('Er ging iets mis');
    }
  };

  const handleAddRule = async () => {
    // Validate against beschikbaarheid periode
    if (locatie?.beschikbaarVanaf && ruleForm.validFrom < locatie.beschikbaarVanaf) {
      if (!confirm(
        `Let op: Deze regel begint (${format(parseISO(ruleForm.validFrom), 'dd MMMM yyyy', { locale: nl })}) ` +
        `vóór de beschikbaarheidsperiode (vanaf ${format(parseISO(locatie.beschikbaarVanaf), 'dd MMMM yyyy', { locale: nl })}). ` +
        `Wilt u toch doorgaan?`
      )) {
        return;
      }
    }
    if (locatie?.beschikbaarTot && ruleForm.validUntil && ruleForm.validUntil > locatie.beschikbaarTot) {
      if (!confirm(
        `Let op: Deze regel eindigt (${format(parseISO(ruleForm.validUntil), 'dd MMMM yyyy', { locale: nl })}) ` +
        `ná de beschikbaarheidsperiode (tot ${format(parseISO(locatie.beschikbaarTot), 'dd MMMM yyyy', { locale: nl })}). ` +
        `Wilt u toch doorgaan?`
      )) {
        return;
      }
    }

    try {
      const url = editingRule
        ? `/api/gemeente/locaties/${resolvedParams.locatieId}/recurring-rules/${editingRule.id}`
        : `/api/gemeente/locaties/${resolvedParams.locatieId}/recurring-rules`;
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: ruleForm.ruleType,
          dayOfWeek: ruleForm.ruleType.includes('weekly') || ruleForm.ruleType === 'monthly_weekday' 
            ? ruleForm.dayOfWeek 
            : null,
          dayOfMonth: ruleForm.ruleType === 'monthly_day' ? ruleForm.dayOfMonth : null,
          weekOfMonth: ruleForm.ruleType === 'monthly_weekday' ? ruleForm.weekOfMonth : null,
          intervalWeeks: ruleForm.ruleType === 'biweekly' ? ruleForm.intervalWeeks : null,
          startTime: ruleForm.startTime,
          endTime: ruleForm.endTime,
          validFrom: ruleForm.validFrom,
          validUntil: ruleForm.validUntil || null,
          description: ruleForm.description || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowAddRule(false);
        setEditingRule(null);
        // Reset form
        setRuleForm({
          ruleType: 'weekly',
          dayOfWeek: 1,
          dayOfMonth: 1,
          weekOfMonth: 1,
          intervalWeeks: 2,
          startTime: '09:00',
          endTime: '17:00',
          validFrom: format(new Date(), 'yyyy-MM-dd'),
          validUntil: '',
          description: '',
        });
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error adding/updating rule:', err);
      alert('Er ging iets mis');
    }
  };

  const handleEditRule = (rule: RecurringRule) => {
    setEditingRule(rule);
    setRuleForm({
      ruleType: rule.ruleType,
      dayOfWeek: rule.dayOfWeek || 1,
      dayOfMonth: rule.dayOfMonth || 1,
      weekOfMonth: rule.weekOfMonth || 1,
      intervalWeeks: 2, // TODO: get from rule if stored
      startTime: rule.startTime,
      endTime: rule.endTime,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil || '',
      description: rule.description || '',
    });
    setShowAddRule(true);
  };

  const handleCancelEditRule = () => {
    setEditingRule(null);
    setShowAddRule(false);
    // Reset form
    setRuleForm({
      ruleType: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      weekOfMonth: 1,
      intervalWeeks: 2,
      startTime: '09:00',
      endTime: '17:00',
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validUntil: '',
      description: '',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !locatie) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Locatie niet gevonden'}</p>
          <Link
            href="/gemeente/beheer/lookup?tab=locaties"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-sans text-lg font-normal">
            📅 Beschikbaarheid: {locatie?.naam}
          </h1>
          <Link
            href="/gemeente/beheer/lookup?tab=locaties"
            className="text-white hover:text-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded px-3 py-2 text-sm"
          >
            ← Terug naar Locaties overzicht
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Locatie Status Info */}
        {locatie && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Locatie informatie</p>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Type:</span> {locatie.type}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={locatie.actief ? 'text-green-700 font-medium' : 'text-gray-700'}>
                      {locatie.actief ? '✓ Actief' : '✗ Inactief'}
                    </span>
                  </p>
                  {locatie.beschikbaarVanaf && (
                    <p>
                      <span className="font-medium">Beschikbaar voor ceremonies:</span>{' '}
                      {format(parseISO(locatie.beschikbaarVanaf), 'dd MMMM yyyy', { locale: nl })}
                      {locatie.beschikbaarTot && ` - ${format(parseISO(locatie.beschikbaarTot), 'dd MMMM yyyy', { locale: nl })}`}
                    </p>
                  )}
                  {locatie.opmerkingBeschikbaarheid && (
                    <p>
                      <span className="font-medium">Opmerking:</span> {locatie.opmerkingBeschikbaarheid}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => setShowQuickAvailable(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-sans text-sm font-medium"
          >
            ✓ Snel beschikbaar maken
          </button>
          <button
            onClick={() => setShowAddRule(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
          >
            ➕ Terugkerende regel toevoegen
          </button>
          <button
            onClick={() => setShowQuickBlock(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-sans text-sm font-medium"
          >
            🚫 Datum blokkeren
          </button>
        </div>

        {/* Legend */}
        <CalendarLegend />

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8" style={{ height: '600px' }}>
          <BabsCalendar
            events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Current Rules Summary */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          {/* Recurring Rules */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              Terugkerende beschikbaarheid ({rules.length})
            </h3>
            {rules.length === 0 ? (
              <p className="text-gray-500 text-sm">Geen beschikbaarheid ingesteld</p>
            ) : (
              <ul className="space-y-2">
                {rules.map((rule) => (
                  <li key={rule.id} className="flex justify-between items-start text-sm border-b pb-2">
                    <div>
                      <div className="font-medium text-gray-900">{getRuleDescription(rule)}</div>
                      <div className="text-gray-500">{rule.startTime} - {rule.endTime}</div>
                      <div className="text-xs text-gray-400">
                        {format(parseISO(rule.validFrom), 'dd MMM yyyy', { locale: nl })}
                        {rule.validUntil && ` - ${format(parseISO(rule.validUntil), 'dd MMM yyyy', { locale: nl })}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="text-blue-600 hover:text-blue-900 font-bold"
                        title="Bewerken"
                      >
                        ✎
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Beschikbaarheid verwijderen?')) {
                            await fetch(
                              `/api/gemeente/locaties/${resolvedParams.locatieId}/recurring-rules/${rule.id}`,
                              { method: 'DELETE' }
                            );
                            await fetchData();
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Verwijderen"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Blocked Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              Geblokkeerde datums ({blockedDates.length})
            </h3>
            {blockedDates.length === 0 ? (
              <p className="text-gray-500 text-sm">Geen geblokkeerde datums</p>
            ) : (
              <ul className="space-y-2">
                {blockedDates.map((block) => (
                  <li key={block.id} className="flex justify-between items-start text-sm border-b pb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {format(parseISO(block.blockedDate), 'dd MMMM yyyy', { locale: nl })}
                      </div>
                      <div className="text-gray-500">
                        {block.allDay ? 'Hele dag' : `${block.startTime} - ${block.endTime}`}
                      </div>
                      {block.reason && <div className="text-xs text-gray-400">{block.reason}</div>}
                    </div>
                    <button
                      onClick={() => handleUnblock(block.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Quick Available Modal */}
      {showQuickAvailable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              ✓ Snel beschikbaar maken
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Er wordt een regel aangemaakt voor deze weekdag
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving (optioneel)
                </label>
                <input
                  type="text"
                  value={quickAvailableReason}
                  onChange={(e) => setQuickAvailableReason(e.target.value)}
                  placeholder="bijv. Beschikbaar voor ceremonies"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={quickAvailableAllDay}
                    onChange={(e) => setQuickAvailableAllDay(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Hele dag beschikbaar (08:00 - 17:00)</span>
                </label>
                {!quickAvailableAllDay && (
                  <div className="grid grid-cols-2 gap-3 ml-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Van
                      </label>
                      <input
                        type="time"
                        value={quickAvailableStartTime}
                        onChange={(e) => setQuickAvailableStartTime(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tot
                      </label>
                      <input
                        type="time"
                        value={quickAvailableEndTime}
                        onChange={(e) => setQuickAvailableEndTime(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleQuickAvailable}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Beschikbaar maken
              </button>
              <button
                onClick={() => setShowQuickAvailable(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Block Modal */}
      {showQuickBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              🚫 Datum blokkeren
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reden
                </label>
                <input
                  type="text"
                  value={quickBlockReason}
                  onChange={(e) => setQuickBlockReason(e.target.value)}
                  placeholder="bijv. Onderhoud, Gesloten"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={quickBlockAllDay}
                    onChange={(e) => setQuickBlockAllDay(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Hele dag blokkeren</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleQuickBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Blokkeren
              </button>
              <button
                onClick={() => setShowQuickBlock(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              {editingRule ? '✎ Terugkerende beschikbaarheid bewerken' : '➕ Terugkerende beschikbaarheid toevoegen'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type regel *
                </label>
                <select
                  value={ruleForm.ruleType}
                  onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="weekly">Wekelijks (elke week zelfde dag)</option>
                  <option value="workdays">Elke werkdag (maandag t/m vrijdag)</option>
                  <option value="biweekly">Om de week</option>
                  <option value="monthly_day">Maandelijks op datum (bijv. 15e)</option>
                  <option value="monthly_weekday">Maandelijks op weekdag (bijv. 2e zondag)</option>
                </select>
              </div>

              {(ruleForm.ruleType === 'weekly' || ruleForm.ruleType === 'biweekly' || ruleForm.ruleType === 'monthly_weekday') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dag van de week *
                  </label>
                  <select
                    value={ruleForm.dayOfWeek}
                    onChange={(e) => setRuleForm({ ...ruleForm, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value={0}>Zondag</option>
                    <option value={1}>Maandag</option>
                    <option value={2}>Dinsdag</option>
                    <option value={3}>Woensdag</option>
                    <option value={4}>Donderdag</option>
                    <option value={5}>Vrijdag</option>
                    <option value={6}>Zaterdag</option>
                  </select>
                </div>
              )}

              {ruleForm.ruleType === 'workdays' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    📅 Deze regel geldt automatisch voor <strong>maandag t/m vrijdag</strong>
                  </p>
                </div>
              )}

              {ruleForm.ruleType === 'monthly_day' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dag van de maand (1-31) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={ruleForm.dayOfMonth}
                    onChange={(e) => setRuleForm({ ...ruleForm, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              )}

              {ruleForm.ruleType === 'monthly_weekday' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week van de maand *
                  </label>
                  <select
                    value={ruleForm.weekOfMonth}
                    onChange={(e) => setRuleForm({ ...ruleForm, weekOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value={1}>Eerste</option>
                    <option value={2}>Tweede</option>
                    <option value={3}>Derde</option>
                    <option value={4}>Vierde</option>
                    <option value={5}>Laatste</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starttijd *
                  </label>
                  <input
                    type="time"
                    value={ruleForm.startTime}
                    onChange={(e) => setRuleForm({ ...ruleForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eindtijd *
                  </label>
                  <input
                    type="time"
                    value={ruleForm.endTime}
                    onChange={(e) => setRuleForm({ ...ruleForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geldig vanaf *
                  </label>
                  <input
                    type="date"
                    value={ruleForm.validFrom}
                    onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geldig tot (optioneel)
                  </label>
                  <input
                    type="date"
                    value={ruleForm.validUntil}
                    onChange={(e) => setRuleForm({ ...ruleForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving (optioneel)
                </label>
                <input
                  type="text"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="bijv. Beschikbaar voor ceremonies"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddRule}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {editingRule ? 'Beschikbaarheid bijwerken' : 'Beschikbaarheid toevoegen'}
              </button>
              <button
                onClick={handleCancelEditRule}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

