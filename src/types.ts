export type Language = 'en' | 'hi';

export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  darkMode: boolean;
  speechRate: number; // 0.8 for slow elder-friendly speech, 1.0 normal
  language: Language;
  soundEnabled: boolean;
  userName?: string;
}

export type RiskLevel = 'safe' | 'careful' | 'scam';

export interface UnifiedCheckResult {
  kind: 'bill' | 'bank' | 'government' | 'medical' | 'delivery' | 'family' | 'other';
  title: string;
  summary: string;
  steps: string[];
  risk: RiskLevel;
  riskReason: string;
  redFlags: string[];
  amountDue: string | null;
  dueDate: string | null;
  jargon: Array<{ term: string; meaning: string }>;
  reminder: null | { title: string; dueDate: string | null; note: string };
  medicine: null | { name: string; timing: string };
  helpline: string | null;
  source: 'ai' | 'fallback';
}

export interface GeneralReminder {
  id: string;
  title: string;
  dueDate: string | null; // e.g. "YYYY-MM-DD"
  dueTime?: string | null; // e.g. "09:30"
  dueTimestamp?: string | null; // ISO timestamp
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  note: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string | null;
}

export type DoseSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface DoseRecord {
  takenAt: string; // e.g. "08:30 AM"
  timestamp: number; // epoch ms
}

// doseLog[medicineId][YYYY-MM-DD][doseSlot] = { takenAt, timestamp }
export type DoseLog = Record<string, Record<string, Partial<Record<DoseSlot, DoseRecord>>>>;

export interface DayPlanSlot {
  time: string;
  activity: string;
  tip?: string;
  notes?: string;
}

export interface DayPlanResult {
  greeting: string;
  summary: string;
  schedule: DayPlanSlot[];
  wellnessNote: string;
  source: 'ai' | 'fallback';
}

export type FoodTiming = 'before_food' | 'after_food' | 'with_food' | 'anytime' | 'not_specified';

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  timing: DoseSlot;
  timeLabel: string;
  withFood: FoodTiming;
  purpose: string;
  colorBadge: string;
  pillIconType: 'tablet' | 'capsule' | 'syrup' | 'drops';
  remainingPills?: number | null;
  initialPills?: number | null;
  doctorNotes?: string;
  isSample?: boolean;
}

export interface SeniorScheme {
  id: string;
  name: string;
  hindiName?: string;
  category: 'health' | 'pension' | 'savings' | 'travel' | 'legal';
  shortDesc: string;
  benefits: string[];
  eligibility: string[];
  minAge: number;
  documentsNeeded: string[];
  howToApply: string;
  officialPortalUrl?: string;
  helpline?: string;
  checkedOn?: string;
}

export interface DigitalGuide {
  id: string;
  title: string;
  hindiTitle: string;
  category: 'payment' | 'communication' | 'travel' | 'government' | 'health';
  icon: string;
  estimatedMinutes: number;
  difficulty: 'Very Easy' | 'Easy' | 'Moderate';
  summary: string;
  steps: Array<{
    stepNumber: number;
    heading: string;
    instruction: string;
    proTip?: string;
    warning?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'saarthi';
  text: string;
  timestamp: string;
  audioSpoken?: boolean;
  source?: 'ai' | 'fallback';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  isDemo?: boolean;
  isSample?: boolean;
}
