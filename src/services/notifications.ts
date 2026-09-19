import { GeneralReminder, MedicineItem, DoseLog } from '../types';
import { getTodayDateString } from '../utils/dates';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.warn('[notifications] Failed to request permission:', err);
    return 'denied';
  }
}

// Track what has been notified today to avoid alerting repeatedly
const notifiedSet = new Set<string>();

export function checkAndTriggerAlerts(
  reminders: GeneralReminder[],
  medicines: MedicineItem[],
  doseLog: DoseLog
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const todayStr = getTodayDateString();
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // 1. Check reminders for today
  reminders.forEach((rem) => {
    if (rem.isCompleted) return;
    if (rem.dueDate === todayStr) {
      const key = `rem-${rem.id}-${todayStr}`;
      if (!notifiedSet.has(key)) {
        notifiedSet.add(key);
        try {
          new Notification('Saarthi Reminder', {
            body: `Today's Reminder: ${rem.title}${rem.note ? ` - ${rem.note}` : ''}`,
            icon: '/favicon.ico',
          });
        } catch (e) {
          console.warn('[notifications] Notification display failed:', e);
        }
      }
    }
  });

  // 2. Check medicine dose times for today
  // Approximate timing slots if exact time not set
  // morning: 8-10, afternoon: 13-15, evening: 18-20, night: 21-23
  const slotHours: Record<string, number> = {
    morning: 9,
    afternoon: 14,
    evening: 19,
    night: 21,
  };

  medicines.forEach((med) => {
    const alreadyTaken = !!doseLog[med.id]?.[todayStr]?.[med.timing];
    if (alreadyTaken) return;

    const expectedHour = slotHours[med.timing] || 9;
    // If current time is past or around the dose hour
    if (currentHours >= expectedHour) {
      const key = `med-${med.id}-${todayStr}-${med.timing}`;
      if (!notifiedSet.has(key)) {
        notifiedSet.add(key);
        try {
          new Notification('Saarthi Medicine Alert', {
            body: `Time for your medicine: ${med.name} (${med.timeLabel || med.timing}). Please take with care.`,
            icon: '/favicon.ico',
          });
        } catch (e) {
          console.warn('[notifications] Medicine notification failed:', e);
        }
      }
    }
  });
}
