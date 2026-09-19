export type Language = 'en' | 'hi';

export type CheckKind =
  | 'bill'
  | 'bank'
  | 'government'
  | 'medical'
  | 'delivery'
  | 'family'
  | 'other';

export type RiskLevel = 'safe' | 'careful' | 'scam';

export interface JargonItem {
  term: string;
  meaning: string;
}

export interface ReminderItem {
  title: string;
  dueDate: string | null;
  note: string;
}

export interface MedicineActionItem {
  name: string;
  timing: string;
}

export interface UnifiedCheckResponse {
  kind: CheckKind;
  title: string;
  summary: string;
  steps: string[];
  risk: RiskLevel;
  riskReason: string;
  redFlags: string[];
  amountDue: string | null;
  dueDate: string | null;
  jargon: JargonItem[];
  reminder: ReminderItem | null;
  medicine: MedicineActionItem | null;
  helpline: string | null;
  source: 'ai' | 'fallback';
}

export interface CheckRequest {
  text?: string;
  image?: string;
  language?: Language;
  userName?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role?: 'user' | 'model';
    sender?: 'user' | 'saarthi';
    text: string;
  }>;
  language?: Language;
  userName?: string;
  stream?: boolean;
}

export interface ChatResponse {
  reply: string;
  source: 'ai' | 'fallback';
}

export interface MedicineExplainerRequest {
  medicineName: string;
  dosage?: string;
  instructions?: string;
  language?: Language;
  userName?: string;
}

export interface MedicineExplainerResponse {
  simpleName: string;
  whatItDoes: string;
  bestTimeToTake: string;
  foodGuidance: string;
  simplePrecautions: string[];
  missedDoseAdvice: string;
  storageTip: string;
  disclaimer: string;
  source: 'ai' | 'fallback';
}

export interface PlanDayRequest {
  routinesOrNotes?: string;
  language?: Language;
  userName?: string;
}

export interface DayPlanSlot {
  time: string;
  activity: string;
  tip: string;
}

export interface PlanDayResponse {
  greeting: string;
  summary: string;
  schedule: DayPlanSlot[];
  wellnessNote: string;
  source: 'ai' | 'fallback';
}

export interface VisitPrepRequest {
  medicineNames: string[];
  language?: Language;
  userName?: string;
}

export interface VisitPrepResponse {
  questions: string[];
  disclaimer: string;
  source: 'ai' | 'fallback';
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
