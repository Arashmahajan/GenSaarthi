import {
  AccessibilitySettings,
  DailyCheckinRecord,
  DoctorVisitPrepData,
  DoseLog,
  EmergencyContact,
  GeneralReminder,
  IncidentNote,
  MedicineItem,
  MoodType,
} from '../types';
import {
  DEFAULT_MEDICINES,
  DEMO_CONTACTS,
  DEMO_MEDICINES,
  DEMO_REMINDERS,
} from '../data/saarthiData';

const SCHEMA_VERSION_KEY = 'saarthi_schema_version';
const CURRENT_SCHEMA_VERSION = '2';

export const STORAGE_KEYS = {
  SETTINGS: 'saarthi_accessibility_settings',
  USER_NAME: 'saarthi_user_name',
  MEDICINES: 'saarthi_medicines',
  REMINDERS: 'saarthi_reminders',
  DOSE_LOG: 'saarthi_dose_log',
  CONTACTS: 'saarthi_emergency_contacts',
  PRIVACY_SEEN: 'saarthi_photo_privacy_seen',
  IS_DEMO: 'saarthi_is_demo_loaded',
  ONBOARDING_COMPLETED: 'saarthi_onboarding_completed',
  SIMPLE_MODE: 'saarthi_simple_mode',
  DAILY_CHECKINS: 'saarthi_daily_checkins',
  CHECKIN_ENABLED: 'saarthi_checkin_enabled',
  CHECKIN_NUDGE_DISMISSED: 'saarthi_checkin_nudge_dismissed',
  INCIDENT_NOTES: 'saarthi_incident_notes',
  VISIT_PREP_DATA: 'saarthi_visit_prep_data',
} as const;

// In-memory fallback if localStorage is unavailable (Safari private mode, quota exceeded, or disabled)
const memoryStorage: Record<string, string> = {};

function isLocalStorageSupported(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__saarthi_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = isLocalStorageSupported();

export function getRawItem(key: string): string | null {
  try {
    if (hasLocalStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn(`[storage] Could not read ${key} from localStorage:`, err);
  }
  return memoryStorage[key] || null;
}

export function setRawItem(key: string, value: string): boolean {
  try {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (err) {
    console.warn(`[storage] Could not write ${key} to localStorage (falling back to memory):`, err);
  }
  memoryStorage[key] = value;
  return false;
}

export function removeRawItem(key: string): void {
  try {
    if (hasLocalStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[storage] Could not remove ${key} from localStorage:`, err);
  }
  delete memoryStorage[key];
}

export function getTypedItem<T>(key: string, defaultValue: T): T {
  const raw = getRawItem(key);
  if (raw === null || raw === undefined) {
    return defaultValue;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[storage] Corrupt data detected for key "${key}". Resetting to default.`, err);
    // Corrupt data reset
    setTypedItem(key, defaultValue);
    return defaultValue;
  }
}

export function setTypedItem<T>(key: string, value: T): boolean {
  try {
    const raw = JSON.stringify(value);
    return setRawItem(key, raw);
  } catch (err) {
    console.error(`[storage] Failed to serialize item for key "${key}":`, err);
    return false;
  }
}

// Check and initialize schema version migration
export function initStorage(): void {
  try {
    const version = getRawItem(SCHEMA_VERSION_KEY);
    if (!version) {
      // First initialization or migration to v2
      setRawItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
    }
  } catch (e) {
    console.warn('[storage] Could not check schema version', e);
  }
}

// User Name
export function getUserName(): string {
  return getTypedItem<string>(STORAGE_KEYS.USER_NAME, '').trim();
}

export function setUserName(name: string): void {
  setTypedItem(STORAGE_KEYS.USER_NAME, name.trim());
}

// Accessibility Settings
export const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'normal',
  highContrast: false,
  darkMode: false,
  speechRate: 0.85,
  language: 'en',
  soundEnabled: true,
};

export function getStoredSettings(): AccessibilitySettings {
  const settings = getTypedItem<AccessibilitySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    language: settings.language === 'hi' ? 'hi' : 'en',
  };
}

export function setStoredSettings(settings: AccessibilitySettings): void {
  setTypedItem(STORAGE_KEYS.SETTINGS, settings);
}

// Medicines
export function getStoredMedicines(): MedicineItem[] {
  const items = getTypedItem<MedicineItem[]>(STORAGE_KEYS.MEDICINES, DEFAULT_MEDICINES);
  if (!Array.isArray(items)) {
    setTypedItem(STORAGE_KEYS.MEDICINES, []);
    return [];
  }
  return items;
}

export function setStoredMedicines(medicines: MedicineItem[]): void {
  setTypedItem(STORAGE_KEYS.MEDICINES, medicines);
}

// Reminders
export function getStoredReminders(): GeneralReminder[] {
  const items = getTypedItem<GeneralReminder[]>(STORAGE_KEYS.REMINDERS, []);
  if (!Array.isArray(items)) {
    setTypedItem(STORAGE_KEYS.REMINDERS, []);
    return [];
  }
  return items;
}

export function setStoredReminders(reminders: GeneralReminder[]): void {
  setTypedItem(STORAGE_KEYS.REMINDERS, reminders);
}

// Dose Log: doseLog[medicineId][YYYY-MM-DD][doseSlot] = { takenAt, timestamp }
export function getStoredDoseLog(): DoseLog {
  const log = getTypedItem<DoseLog>(STORAGE_KEYS.DOSE_LOG, {});
  if (typeof log !== 'object' || log === null || Array.isArray(log)) {
    setTypedItem(STORAGE_KEYS.DOSE_LOG, {});
    return {};
  }
  return log;
}

export function setStoredDoseLog(log: DoseLog): void {
  setTypedItem(STORAGE_KEYS.DOSE_LOG, log);
}

// Emergency Contacts
export function getStoredContacts(): EmergencyContact[] {
  const contacts = getTypedItem<EmergencyContact[]>(STORAGE_KEYS.CONTACTS, []);
  if (!Array.isArray(contacts)) {
    setTypedItem(STORAGE_KEYS.CONTACTS, []);
    return [];
  }
  return contacts;
}

export function setStoredContacts(contacts: EmergencyContact[]): void {
  setTypedItem(STORAGE_KEYS.CONTACTS, contacts);
}

// Privacy notice seen
export function getPrivacyNoticeSeen(): boolean {
  return getTypedItem<boolean>(STORAGE_KEYS.PRIVACY_SEEN, false);
}

export function setPrivacyNoticeSeen(seen: boolean): void {
  setTypedItem(STORAGE_KEYS.PRIVACY_SEEN, seen);
}

// Demo data management
export function isDemoDataLoaded(): boolean {
  return getTypedItem<boolean>(STORAGE_KEYS.IS_DEMO, false);
}

export function loadDemoData(): {
  medicines: MedicineItem[];
  reminders: GeneralReminder[];
  contacts: EmergencyContact[];
} {
  setStoredMedicines(DEMO_MEDICINES);
  setStoredReminders(DEMO_REMINDERS);
  setStoredContacts(DEMO_CONTACTS);
  setTypedItem(STORAGE_KEYS.IS_DEMO, true);
  return {
    medicines: DEMO_MEDICINES,
    reminders: DEMO_REMINDERS,
    contacts: DEMO_CONTACTS,
  };
}

export function clearDemoData(): {
  medicines: MedicineItem[];
  reminders: GeneralReminder[];
  contacts: EmergencyContact[];
} {
  setStoredMedicines([]);
  setStoredReminders([]);
  setStoredContacts([]);
  setStoredDoseLog({});
  setTypedItem(STORAGE_KEYS.IS_DEMO, false);
  return {
    medicines: [],
    reminders: [],
    contacts: [],
  };
}

// Onboarding
export function isOnboardingCompleted(): boolean {
  return getTypedItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
}

export function setOnboardingCompleted(completed: boolean): void {
  setTypedItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
}

// Simple Mode
export function isSimpleMode(): boolean {
  return getTypedItem<boolean>(STORAGE_KEYS.SIMPLE_MODE, false);
}

export function setSimpleMode(enabled: boolean): void {
  setTypedItem(STORAGE_KEYS.SIMPLE_MODE, enabled);
}

// Daily Check-ins: Local-only, NEVER sent to any server/AI
export function getStoredCheckins(): DailyCheckinRecord[] {
  const records = getTypedItem<DailyCheckinRecord[]>(STORAGE_KEYS.DAILY_CHECKINS, []);
  if (!Array.isArray(records)) {
    setTypedItem(STORAGE_KEYS.DAILY_CHECKINS, []);
    return [];
  }
  return records;
}

export function setStoredCheckin(date: string, mood: MoodType): DailyCheckinRecord[] {
  const records = getStoredCheckins();
  // If entry exists for date, update it; otherwise append
  const existingIdx = records.findIndex((r) => r.date === date);
  let updated: DailyCheckinRecord[];
  if (existingIdx >= 0) {
    updated = [...records];
    updated[existingIdx] = { date, mood };
  } else {
    updated = [...records, { date, mood }];
  }
  // Keep sorted by date
  updated.sort((a, b) => a.date.localeCompare(b.date));
  setTypedItem(STORAGE_KEYS.DAILY_CHECKINS, updated);
  return updated;
}

export function deleteCheckinHistory(): void {
  setTypedItem(STORAGE_KEYS.DAILY_CHECKINS, []);
  removeRawItem(STORAGE_KEYS.CHECKIN_NUDGE_DISMISSED);
}

export function isCheckinEnabled(): boolean {
  return getTypedItem<boolean>(STORAGE_KEYS.CHECKIN_ENABLED, true);
}

export function setCheckinEnabled(enabled: boolean): void {
  setTypedItem(STORAGE_KEYS.CHECKIN_ENABLED, enabled);
}

export function getCheckinNudgeDismissedDate(): string | null {
  return getTypedItem<string | null>(STORAGE_KEYS.CHECKIN_NUDGE_DISMISSED, null);
}

export function setCheckinNudgeDismissedDate(date: string): void {
  setTypedItem(STORAGE_KEYS.CHECKIN_NUDGE_DISMISSED, date);
}

// Incident Notes (Offline & device only)
export function getStoredIncidentNotes(): IncidentNote[] {
  const notes = getTypedItem<IncidentNote[]>(STORAGE_KEYS.INCIDENT_NOTES, []);
  if (!Array.isArray(notes)) {
    setTypedItem(STORAGE_KEYS.INCIDENT_NOTES, []);
    return [];
  }
  return notes;
}

export function saveIncidentNote(note: IncidentNote): IncidentNote[] {
  const notes = getStoredIncidentNotes();
  const existingIdx = notes.findIndex((n) => n.id === note.id);
  let updated: IncidentNote[];
  if (existingIdx >= 0) {
    updated = [...notes];
    updated[existingIdx] = note;
  } else {
    updated = [note, ...notes];
  }
  setTypedItem(STORAGE_KEYS.INCIDENT_NOTES, updated);
  return updated;
}

export function deleteIncidentNote(id: string): IncidentNote[] {
  const notes = getStoredIncidentNotes();
  const updated = notes.filter((n) => n.id !== id);
  setTypedItem(STORAGE_KEYS.INCIDENT_NOTES, updated);
  return updated;
}

// Doctor Visit Prep Data
export function getStoredVisitPrep(): DoctorVisitPrepData | null {
  return getTypedItem<DoctorVisitPrepData | null>(STORAGE_KEYS.VISIT_PREP_DATA, null);
}

export function setStoredVisitPrep(data: DoctorVisitPrepData): void {
  setTypedItem(STORAGE_KEYS.VISIT_PREP_DATA, data);
}

// Convenient aliases for AppContext
export const getDailyCheckins = getStoredCheckins;
export const saveDailyCheckin = setStoredCheckin;
export const clearCheckinHistory = deleteCheckinHistory;
export const dismissCheckinNudge = setCheckinNudgeDismissedDate;
export const getIncidentNotes = getStoredIncidentNotes;
export const getDoctorVisitData = getStoredVisitPrep;
export const saveDoctorVisitData = setStoredVisitPrep;


