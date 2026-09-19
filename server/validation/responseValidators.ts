import { UnifiedCheckResponse, CheckKind, RiskLevel } from '../types';

const VALID_KINDS: CheckKind[] = [
  'bill',
  'bank',
  'government',
  'medical',
  'delivery',
  'family',
  'other',
];

const VALID_RISKS: RiskLevel[] = ['safe', 'careful', 'scam'];

export function validateUnifiedCheckResponse(obj: any): {
  isValid: boolean;
  data?: UnifiedCheckResponse;
  errors?: string[];
} {
  if (!obj || typeof obj !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  const errors: string[] = [];

  // kind
  const kind = VALID_KINDS.includes(obj.kind) ? (obj.kind as CheckKind) : 'other';

  // title
  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    errors.push('title must be a non-empty string');
  }

  // summary
  if (typeof obj.summary !== 'string' || !obj.summary.trim()) {
    errors.push('summary must be a non-empty string');
  }

  // steps
  if (!Array.isArray(obj.steps) || obj.steps.length === 0) {
    errors.push('steps must be a non-empty array of strings');
  } else if (!obj.steps.every((s: any) => typeof s === 'string' && s.trim().length > 0)) {
    errors.push('every step must be a non-empty string');
  }

  // risk
  if (!VALID_RISKS.includes(obj.risk)) {
    errors.push(`risk must be one of: ${VALID_RISKS.join(', ')}`);
  }

  // riskReason
  if (typeof obj.riskReason !== 'string' || !obj.riskReason.trim()) {
    errors.push('riskReason must be a non-empty string');
  }

  // redFlags
  const redFlags: string[] = Array.isArray(obj.redFlags)
    ? obj.redFlags.filter((f: any) => typeof f === 'string' && f.trim().length > 0)
    : [];

  // amountDue
  const amountDue =
    typeof obj.amountDue === 'string' && obj.amountDue.trim().length > 0
      ? obj.amountDue.trim()
      : null;

  // dueDate
  const dueDate =
    typeof obj.dueDate === 'string' && obj.dueDate.trim().length > 0
      ? obj.dueDate.trim()
      : null;

  // jargon
  const jargon: Array<{ term: string; meaning: string }> = [];
  if (Array.isArray(obj.jargon)) {
    for (const j of obj.jargon) {
      if (
        j &&
        typeof j.term === 'string' &&
        j.term.trim() &&
        typeof j.meaning === 'string' &&
        j.meaning.trim()
      ) {
        jargon.push({ term: j.term.trim(), meaning: j.meaning.trim() });
      }
    }
  }

  // reminder
  let reminder = null;
  if (obj.reminder && typeof obj.reminder === 'object') {
    if (typeof obj.reminder.title === 'string' && obj.reminder.title.trim()) {
      reminder = {
        title: obj.reminder.title.trim(),
        dueDate:
          typeof obj.reminder.dueDate === 'string' && obj.reminder.dueDate.trim()
            ? obj.reminder.dueDate.trim()
            : null,
        note:
          typeof obj.reminder.note === 'string'
            ? obj.reminder.note.trim()
            : '',
      };
    }
  }

  // medicine
  let medicine = null;
  if (obj.medicine && typeof obj.medicine === 'object') {
    if (typeof obj.medicine.name === 'string' && obj.medicine.name.trim()) {
      medicine = {
        name: obj.medicine.name.trim(),
        timing:
          typeof obj.medicine.timing === 'string' && obj.medicine.timing.trim()
            ? obj.medicine.timing.trim()
            : 'As prescribed',
      };
    }
  }

  // helpline
  const helpline =
    typeof obj.helpline === 'string' && obj.helpline.trim()
      ? obj.helpline.trim()
      : obj.risk === 'scam'
      ? '1930'
      : null;

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitized: UnifiedCheckResponse = {
    kind,
    title: obj.title.trim(),
    summary: obj.summary.trim(),
    steps: obj.steps.map((s: string) => s.trim()),
    risk: obj.risk as RiskLevel,
    riskReason: obj.riskReason.trim(),
    redFlags,
    amountDue,
    dueDate,
    jargon,
    reminder,
    medicine,
    helpline,
    source: obj.source === 'fallback' ? 'fallback' : 'ai',
  };

  return { isValid: true, data: sanitized };
}

export function validateMedicineResponse(obj: any): {
  isValid: boolean;
  data?: Omit<import('../types').MedicineExplainerResponse, 'source'>;
  errors?: string[];
} {
  if (!obj || typeof obj !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  const errors: string[] = [];

  if (typeof obj.simpleName !== 'string' || !obj.simpleName.trim()) {
    errors.push('simpleName must be a non-empty string');
  }
  if (typeof obj.whatItDoes !== 'string' || !obj.whatItDoes.trim()) {
    errors.push('whatItDoes must be a non-empty string');
  }
  if (typeof obj.bestTimeToTake !== 'string' || !obj.bestTimeToTake.trim()) {
    errors.push('bestTimeToTake must be a non-empty string');
  }
  if (typeof obj.foodGuidance !== 'string' || !obj.foodGuidance.trim()) {
    errors.push('foodGuidance must be a non-empty string');
  }
  if (!Array.isArray(obj.simplePrecautions)) {
    errors.push('simplePrecautions must be an array of strings');
  }
  if (typeof obj.missedDoseAdvice !== 'string' || !obj.missedDoseAdvice.trim()) {
    errors.push('missedDoseAdvice must be a non-empty string');
  }
  if (typeof obj.storageTip !== 'string' || !obj.storageTip.trim()) {
    errors.push('storageTip must be a non-empty string');
  }
  if (typeof obj.disclaimer !== 'string' || !obj.disclaimer.trim()) {
    errors.push('disclaimer must be a non-empty string');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const simplePrecautions = (obj.simplePrecautions as any[])
    .filter((p) => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim());

  return {
    isValid: true,
    data: {
      simpleName: obj.simpleName.trim(),
      whatItDoes: obj.whatItDoes.trim(),
      bestTimeToTake: obj.bestTimeToTake.trim(),
      foodGuidance: obj.foodGuidance.trim(),
      simplePrecautions,
      missedDoseAdvice: obj.missedDoseAdvice.trim(),
      storageTip: obj.storageTip.trim(),
      disclaimer: obj.disclaimer.trim(),
    },
  };
}

export function validatePlanDayResponse(obj: any): {
  isValid: boolean;
  data?: Omit<import('../types').PlanDayResponse, 'source'>;
  errors?: string[];
} {
  if (!obj || typeof obj !== 'object') {
    return { isValid: false, errors: ['Response is not an object'] };
  }

  const errors: string[] = [];

  if (typeof obj.greeting !== 'string' || !obj.greeting.trim()) {
    errors.push('greeting must be a non-empty string');
  }
  if (typeof obj.summary !== 'string' || !obj.summary.trim()) {
    errors.push('summary must be a non-empty string');
  }
  if (!Array.isArray(obj.schedule) || obj.schedule.length === 0) {
    errors.push('schedule must be a non-empty array');
  }
  if (typeof obj.wellnessNote !== 'string' || !obj.wellnessNote.trim()) {
    errors.push('wellnessNote must be a non-empty string');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const schedule: Array<{ time: string; activity: string; tip: string }> = [];
  for (const slot of obj.schedule) {
    if (slot && typeof slot.time === 'string' && typeof slot.activity === 'string') {
      schedule.push({
        time: slot.time.trim(),
        activity: slot.activity.trim(),
        tip: typeof slot.tip === 'string' ? slot.tip.trim() : '',
      });
    }
  }

  return {
    isValid: true,
    data: {
      greeting: obj.greeting.trim(),
      summary: obj.summary.trim(),
      schedule,
      wellnessNote: obj.wellnessNote.trim(),
    },
  };
}
