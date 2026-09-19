import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AccessibilitySettings,
  DoseLog,
  DoseSlot,
  EmergencyContact,
  GeneralReminder,
  MedicineItem,
} from '../types';
import * as storage from '../services/storage';
import {
  checkAndTriggerAlerts,
  getNotificationPermissionStatus,
  NotificationPermissionStatus,
  requestNotificationPermission,
} from '../services/notifications';
import { getTodayDateString } from '../utils/dates';
import { SaarthiVoiceService } from '../utils/speech';

interface AppContextType {
  userName: string;
  setUserName: (name: string) => void;
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  medicines: MedicineItem[];
  addMedicine: (item: Omit<MedicineItem, 'id'>) => MedicineItem;
  updateMedicine: (id: string, updates: Partial<MedicineItem>) => void;
  deleteMedicine: (id: string) => void;
  reminders: GeneralReminder[];
  addReminder: (item: Omit<GeneralReminder, 'id' | 'createdAt'>) => GeneralReminder;
  updateReminder: (id: string, updates: Partial<GeneralReminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminderDone: (id: string) => void;
  doseLog: DoseLog;
  markDoseTaken: (medicineId: string, slot: DoseSlot) => void;
  undoDoseTaken: (medicineId: string, slot: DoseSlot) => void;
  contacts: EmergencyContact[];
  addContact: (c: Omit<EmergencyContact, 'id'>) => EmergencyContact;
  deleteContact: (id: string) => void;
  privacySeen: boolean;
  setPrivacySeen: (seen: boolean) => void;
  isDemo: boolean;
  loadDemo: () => void;
  clearDemo: () => void;
  notificationStatus: NotificationPermissionStatus;
  requestAlerts: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSOSOpen: boolean;
  setIsSOSOpen: (open: boolean) => void;
  sosTargetNumber?: string;
  setSOSTargetNumber: (num?: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  storage.initStorage();

  const [userName, setUserNameState] = useState<string>(() => storage.getUserName());
  const [settings, setSettingsState] = useState<AccessibilitySettings>(() => storage.getStoredSettings());
  const [medicines, setMedicinesState] = useState<MedicineItem[]>(() => storage.getStoredMedicines());
  const [reminders, setRemindersState] = useState<GeneralReminder[]>(() => storage.getStoredReminders());
  const [doseLog, setDoseLogState] = useState<DoseLog>(() => storage.getStoredDoseLog());
  const [contacts, setContactsState] = useState<EmergencyContact[]>(() => storage.getStoredContacts());
  const [privacySeen, setPrivacySeenState] = useState<boolean>(() => storage.getPrivacyNoticeSeen());
  const [isDemo, setIsDemoState] = useState<boolean>(() => storage.isDemoDataLoaded());
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermissionStatus>(() =>
    getNotificationPermissionStatus()
  );

  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      if (['home', 'ask', 'chat', 'check', 'reminders', 'medicines', 'help', 'more', 'plan', 'schemes', 'guides'].includes(hash)) {
        if (hash === 'chat') return 'ask';
        if (hash === 'medicines') return 'reminders';
        return hash;
      }
    }
    return 'home';
  });

  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [sosTargetNumber, setSOSTargetNumber] = useState<string | undefined>(undefined);

  // Hash change routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        if (hash === 'chat') setActiveTabState('ask');
        else if (hash === 'medicines') setActiveTabState('reminders');
        else setActiveTabState(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`;
      // Move focus to main heading and announce to screen readers
      setTimeout(() => {
        const heading = document.querySelector('h1');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }
      }, 50);
    }
  }, []);

  // Sync DOM side-effects and speech service whenever settings change (Requirement 8 & 9)
  useEffect(() => {
    // 1. Root class changes
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 2. HTML lang tag
    root.setAttribute('lang', settings.language === 'hi' ? 'hi' : 'en');

    // 3. Root font size CSS variable for clean accessible scaling (Requirement 9)
    // Normal: 19px, Large: 22px, Extra Large: 26px (~137% - 160% scale)
    let baseFontSize = '19px';
    if (settings.textSize === 'large') {
      baseFontSize = '22px';
    } else if (settings.textSize === 'extra-large') {
      baseFontSize = '26px';
    }
    root.style.setProperty('--base-font-size', baseFontSize);
    root.style.fontSize = baseFontSize;

    // 4. Speech rate
    if (settings.speechRate) {
      SaarthiVoiceService.defaultRate = settings.speechRate;
    }
  }, [settings]);

  // Periodic notification check while app is open (Requirement 4)
  useEffect(() => {
    const checkAlerts = () => {
      checkAndTriggerAlerts(reminders, medicines, doseLog);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [reminders, medicines, doseLog]);

  // User name
  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim();
    setUserNameState(trimmed);
    storage.setUserName(trimmed);
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      storage.setStoredSettings(updated);
      return updated;
    });
  }, []);

  // Medicines
  const addMedicine = useCallback((item: Omit<MedicineItem, 'id'>): MedicineItem => {
    const newMed: MedicineItem = {
      ...item,
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setMedicinesState((prev) => {
      const updated = [newMed, ...prev];
      storage.setStoredMedicines(updated);
      return updated;
    });
    return newMed;
  }, []);

  const updateMedicine = useCallback((id: string, updates: Partial<MedicineItem>) => {
    setMedicinesState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      storage.setStoredMedicines(updated);
      return updated;
    });
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setMedicinesState((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      storage.setStoredMedicines(updated);
      return updated;
    });
  }, []);

  // Reminders
  const addReminder = useCallback((item: Omit<GeneralReminder, 'id' | 'createdAt'>): GeneralReminder => {
    const newRem: GeneralReminder = {
      ...item,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setRemindersState((prev) => {
      const updated = [newRem, ...prev];
      storage.setStoredReminders(updated);
      return updated;
    });
    return newRem;
  }, []);

  const updateReminder = useCallback((id: string, updates: Partial<GeneralReminder>) => {
    setRemindersState((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      storage.setStoredReminders(updated);
      return updated;
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setRemindersState((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      storage.setStoredReminders(updated);
      return updated;
    });
  }, []);

  const toggleReminderDone = useCallback((id: string) => {
    setRemindersState((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          const nextCompleted = !r.isCompleted;
          return {
            ...r,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return r;
      });
      storage.setStoredReminders(updated);
      return updated;
    });
  }, []);

  // Dose Log (Requirement 3: doseLog[medicineId][YYYY-MM-DD][doseSlot] = { takenAt })
  const markDoseTaken = useCallback((medicineId: string, slot: DoseSlot) => {
    const todayStr = getTodayDateString();
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setDoseLogState((prev) => {
      const updated: DoseLog = { ...prev };
      if (!updated[medicineId]) {
        updated[medicineId] = {};
      }
      if (!updated[medicineId][todayStr]) {
        updated[medicineId][todayStr] = {};
      }
      updated[medicineId][todayStr][slot] = {
        takenAt: formattedTime,
        timestamp: Date.now(),
      };
      storage.setStoredDoseLog(updated);
      return updated;
    });

    // Deduct pill count ONLY if initial/remaining pills was provided by user
    setMedicinesState((prev) => {
      const updated = prev.map((m) => {
        if (m.id === medicineId && m.remainingPills !== null && m.remainingPills !== undefined && m.remainingPills > 0) {
          return { ...m, remainingPills: Math.max(0, m.remainingPills - 1) };
        }
        return m;
      });
      storage.setStoredMedicines(updated);
      return updated;
    });
  }, []);

  const undoDoseTaken = useCallback((medicineId: string, slot: DoseSlot) => {
    const todayStr = getTodayDateString();

    setDoseLogState((prev) => {
      const updated: DoseLog = { ...prev };
      if (updated[medicineId]?.[todayStr]?.[slot]) {
        delete updated[medicineId][todayStr][slot];
        storage.setStoredDoseLog(updated);
      }
      return updated;
    });

    // Restore pill count if remaining pills was provided
    setMedicinesState((prev) => {
      const updated = prev.map((m) => {
        if (m.id === medicineId && m.remainingPills !== null && m.remainingPills !== undefined) {
          return { ...m, remainingPills: m.remainingPills + 1 };
        }
        return m;
      });
      storage.setStoredMedicines(updated);
      return updated;
    });
  }, []);

  // Contacts
  const addContact = useCallback((c: Omit<EmergencyContact, 'id'>): EmergencyContact => {
    const newContact: EmergencyContact = {
      ...c,
      id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setContactsState((prev) => {
      const updated = [...prev, newContact];
      storage.setStoredContacts(updated);
      return updated;
    });
    return newContact;
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContactsState((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      storage.setStoredContacts(updated);
      return updated;
    });
  }, []);

  // Privacy notice
  const setPrivacySeen = useCallback((seen: boolean) => {
    setPrivacySeenState(seen);
    storage.setPrivacyNoticeSeen(seen);
  }, []);

  // Demo data
  const loadDemo = useCallback(() => {
    const data = storage.loadDemoData();
    setMedicinesState(data.medicines);
    setRemindersState(data.reminders);
    setContactsState(data.contacts);
    setIsDemoState(true);
  }, []);

  const clearDemo = useCallback(() => {
    const data = storage.clearDemoData();
    setMedicinesState(data.medicines);
    setRemindersState(data.reminders);
    setContactsState(data.contacts);
    setDoseLogState({});
    setIsDemoState(false);
  }, []);

  // Alerts
  const requestAlerts = useCallback(async () => {
    const res = await requestNotificationPermission();
    setNotificationStatus(res);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userName,
        setUserName,
        settings,
        updateSettings,
        medicines,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminderDone,
        doseLog,
        markDoseTaken,
        undoDoseTaken,
        contacts,
        addContact,
        deleteContact,
        privacySeen,
        setPrivacySeen,
        isDemo,
        loadDemo,
        clearDemo,
        notificationStatus,
        requestAlerts,
        activeTab,
        setActiveTab,
        isSOSOpen,
        setIsSOSOpen,
        sosTargetNumber,
        setSOSTargetNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
