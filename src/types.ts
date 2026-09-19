export type Language = 'en' | 'hi' | 'hinglish' | 'bn' | 'mr' | 'ta' | 'te' | 'gu';

export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  speechRate: number; // 0.8 for slow elder-friendly speech, 1.0 normal
  language: Language;
  soundEnabled: boolean;
}

export interface DocumentAnalysisResult {
  title: string;
  documentType: 'electricity_bill' | 'water_gas_bill' | 'bank_sms' | 'pension_letter' | 'prescription' | 'other';
  simplifiedSummary: string;
  amountDue?: string;
  dueDate?: string;
  keyDates?: string[];
  actionRequired: string[];
  isUrgent: boolean;
  warnings?: string[];
  jargonBuster: Array<{
    term: string;
    simpleMeaning: string;
  }>;
  safetyNote?: string;
}

export interface ScamCheckResult {
  verdict: 'DANGER_SCAM' | 'SUSPICIOUS' | 'SAFE';
  riskScore: number; // 0 - 100
  scamType: string;
  verdictTitle: string;
  summaryExplanation: string;
  redFlags: string[];
  whatScammersWant: string[];
  recommendedSteps: string[];
  helplineToCall: string;
  safeAlternatives: string[];
}

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'night';
  timeLabel: string;
  withFood: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  purpose: string; // e.g. "Controls Blood Pressure"
  takenToday: boolean;
  takenAt?: string;
  colorBadge: string;
  pillIconType: 'tablet' | 'capsule' | 'syrup' | 'drops';
  remainingPills: number;
  doctorNotes?: string;
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
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}
