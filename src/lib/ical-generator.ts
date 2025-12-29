import { createEvents, EventAttributes } from 'ics';

export interface CeremonyEvent {
  id: string;
  datum: string; // YYYY-MM-DD
  startTijd: string; // HH:mm
  eindTijd: string; // HH:mm
  locatieNaam: string;
  locatieAdres?: string;
}

/**
 * Parse date and time strings into ICS format arrays
 */
function parseDateTime(dateStr: string, timeStr: string): [number, number, number, number, number] {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  return [year, month, day, hours, minutes];
}

/**
 * Generate iCal feed from ceremony events
 * Privacy-first: Only includes date, time, and location (no personal data)
 */
export function generateICalFeed(
  ceremonies: CeremonyEvent[],
  babsNaam: string
): string | null {
  const events: EventAttributes[] = ceremonies.map(ceremony => {
    const start = parseDateTime(ceremony.datum, ceremony.startTijd);
    const end = parseDateTime(ceremony.datum, ceremony.eindTijd);
    
    // If end time is before start time, it's the next day
    if (end[3] < start[3] || (end[3] === start[3] && end[4] < start[4])) {
      const [year, month, day] = start;
      const nextDay = new Date(year, month - 1, day + 1);
      end[0] = nextDay.getFullYear();
      end[1] = nextDay.getMonth() + 1;
      end[2] = nextDay.getDate();
    }
    
    return {
      uid: `ceremony-${ceremony.id}@huwelijk.app`,
      start,
      end,
      title: 'Trouwceremonie', // Privacy: geen namen van bruidspaar
      location: ceremony.locatieAdres 
        ? `${ceremony.locatieNaam}, ${ceremony.locatieAdres}`
        : ceremony.locatieNaam,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      categories: ['Ceremonie'],
      calName: `BABS Agenda - ${babsNaam}`,
    };
  });

  const { error, value } = createEvents(events);
  
  if (error) {
    console.error('Error generating iCal feed:', error);
    return null;
  }
  
  return value || null;
}

/**
 * Generate iCal feed for a single ceremony (for download)
 */
export function generateSingleCeremonyICal(ceremony: CeremonyEvent): string | null {
  return generateICalFeed([ceremony], 'BABS');
}

