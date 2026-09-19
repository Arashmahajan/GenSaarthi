import { Language } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseAnyDateToISO(dateStr: string | null | undefined): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Check direct YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return trimmed;
  }

  // Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try standard JS Date parsing
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

export function formatDisplayDate(isoDate: string | null | undefined, language: Language = 'en'): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;

  return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDisplayTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export interface WeekDayInfo {
  dateStr: string; // YYYY-MM-DD
  dayNameEn: string;
  dayNameHi: string;
  dayNum: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export function getCurrentWeekDays(): WeekDayInfo[] {
  const todayStr = getTodayDateString();
  const now = new Date();
  // Monday is 1, Sunday is 0 in JS
  const currentDay = now.getDay();
  // We want Monday as start (distance from Monday)
  const distanceToMonday = (currentDay + 6) % 7;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const days: WeekDayInfo[] = [];
  const namesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const namesHi = ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    days.push({
      dateStr,
      dayNameEn: namesEn[i],
      dayNameHi: namesHi[i],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  return days;
}
