/**
 * RFC 5545 iCalendar (.ics) generator.
 * Fully compliant with:
 * - CRLF line endings (\r\n)
 * - 75-octet folding without breaking multi-byte UTF-8 sequences (Hindi-safe)
 * - RFC 5545 text escaping (\, ;, ,, \n)
 * - VEVENT with UID, DTSTAMP, VALARM, TZID=Asia/Kolkata
 * - Timed events, All-day events, Daily recurring medicine doses (RRULE:FREQ=DAILY)
 */

export interface CalendarEventInput {
  id: string;
  title: string;
  description?: string;
  date?: string | null; // "YYYY-MM-DD"
  time?: string | null; // "HH:mm" e.g. "09:30" or "14:00"
  isAllDay?: boolean;
  recurrence?: 'daily' | 'none';
  endDate?: string | null; // "YYYY-MM-DD"
  category?: 'reminder' | 'bill' | 'medicine';
}

/**
 * Escapes text for RFC 5545 TEXT values:
 * backslash -> \\
 * semicolon -> \;
 * comma -> \,
 * newline -> \n
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\n/g, '\\n');
}

/**
 * Folds a single line at 75 octets (bytes).
 * Uses TextEncoder to measure exact UTF-8 byte length.
 * Does not split multi-byte characters. Continuation lines start with a single space.
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const characters = Array.from(line);
  let result = '';
  let currentLineBytes = 0;
  let isFirstLine = true;

  for (const char of characters) {
    const charBytes = encoder.encode(char).length;
    const maxBytes = isFirstLine ? 75 : 74; // 74 because continuation line begins with 1 space byte

    if (currentLineBytes + charBytes > maxBytes) {
      result += '\r\n ';
      currentLineBytes = 1 + charBytes; // 1 space + char
      isFirstLine = false;
    } else {
      currentLineBytes += charBytes;
    }
    result += char;
  }

  return result;
}

/**
 * Formats a Date object to UTC timestamp format: YYYYMMDDTHHMMSSZ
 */
export function formatIcsUtcTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Builds RFC 5545 iCalendar content for one or more events.
 * Throws a plain-language error if an item has no parseable date.
 */
export function generateIcsCalendar(events: CalendarEventInput[]): string {
  if (!events || events.length === 0) {
    throw new Error('No events provided for calendar export.');
  }

  const dtstamp = formatIcsUtcTimestamp();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saarthi//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    if (!ev.date || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date.trim())) {
      throw new Error(
        `Cannot export "${ev.title || 'event'}": no valid date specified. Please set a date first.`
      );
    }

    const cleanDate = ev.date.trim().replace(/-/g, ''); // YYYYMMDD
    const escapedSummary = escapeIcsText(ev.title || 'Saarthi Reminder');
    const escapedDesc = escapeIcsText(ev.description || 'Created via Saarthi Companion');
    const uid = `${ev.id || 'event-' + Date.now()}@saarthi.local`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:${escapedSummary}`);
    lines.push(`DESCRIPTION:${escapedDesc}`);

    const hasTime = !!(ev.time && /^\d{1,2}:\d{2}$/.test(ev.time.trim()));

    if (hasTime && !ev.isAllDay) {
      const [hStr, mStr] = ev.time!.trim().split(':');
      const hh = hStr.padStart(2, '0');
      const mm = mStr.padStart(2, '0');
      const dtstart = `${cleanDate}T${hh}${mm}00`;

      lines.push(`DTSTART;TZID=Asia/Kolkata:${dtstart}`);

      // If daily recurrence (e.g. medicines)
      if (ev.recurrence === 'daily') {
        if (ev.endDate && /^\d{4}-\d{2}-\d{2}$/.test(ev.endDate.trim())) {
          const endClean = ev.endDate.trim().replace(/-/g, '');
          lines.push(`RRULE:FREQ=DAILY;UNTIL=${endClean}T235959Z`);
        } else {
          lines.push('RRULE:FREQ=DAILY');
        }

        // Alarm at dose time
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapedSummary}`);
        lines.push('TRIGGER:-PT0M');
        lines.push('END:VALARM');
      } else {
        // Timed reminder/bill: Alarm at the time AND 1 day before
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapedSummary}`);
        lines.push('TRIGGER:-PT0M');
        lines.push('END:VALARM');

        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:Upcoming: ${escapedSummary}`);
        lines.push('TRIGGER:-P1D');
        lines.push('END:VALARM');
      }
    } else {
      // All-day event
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      lines.push(`DTEND;VALUE=DATE:${cleanDate}`);

      // Alarm at 9:00 AM the day before (start 00:00 - 15 hours = 09:00 AM previous day)
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Reminder for tomorrow: ${escapedSummary}`);
      lines.push('TRIGGER:-PT15H');
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // Fold every line to <= 75 octets and join with CRLF
  const foldedLines = lines.map(foldIcsLine);
  return foldedLines.join('\r\n') + '\r\n';
}

/**
 * Generates an SEO / safe slug for filenames (e.g. "dr-appointment" from "Dr. Appointment")
 */
export function slugifyTitle(title: string): string {
  const clean = (title || 'reminder')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean.slice(0, 24) || 'item';
}

/**
 * Triggers a browser download of an .ics file via a Blob.
 * Returns true if download was triggered, false if blocked/failed.
 */
export function downloadIcsFile(filename: string, content: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.document || !window.URL) {
      return false;
    }
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 200);
    return true;
  } catch (err) {
    console.warn('[ics] Download blocked or failed:', err);
    return false;
  }
}

// Alias for RemindersManager and other components
export const buildIcsCalendar = generateIcsCalendar;

