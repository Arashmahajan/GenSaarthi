import {
  UnifiedCheckResponse,
  CheckKind,
  Language,
  JargonItem,
  ReminderItem,
  MedicineActionItem,
} from '../types';
import { scanTextForScamSignals } from './scamScan';

export function extractLiteralRupeeAmount(text: string): string | null {
  const match = text.match(/(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i);
  if (match && match[1]) {
    return `₹ ${match[1]}`;
  }
  return null;
}

export function extractLiteralDueDate(text: string): string | null {
  // Pattern matching: e.g. "Due Date: 25 Oct 2024" or "due: 25/10/2024" or "25-10-2024"
  const duePrefixMatch = text.match(
    /(?:due(?:\s+date)?|last\s+date|pay\s+before|valid\s+till|expiry)\s*[:\-]?\s*([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}(?:\s+[0-9]{4})?|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i
  );
  if (duePrefixMatch && duePrefixMatch[1]) {
    return duePrefixMatch[1].trim();
  }

  // General date pattern if accompanied by keywords
  const generalDateMatch = text.match(
    /\b([0-9]{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+[0-9]{4})?)\b/i
  );
  if (generalDateMatch && generalDateMatch[1] && (text.toLowerCase().includes('due') || text.toLowerCase().includes('pay') || text.toLowerCase().includes('bill'))) {
    return generalDateMatch[1].trim();
  }

  return null;
}

function detectDocumentKind(text: string): CheckKind {
  const lower = text.toLowerCase();

  if (/\b(?:bill|electricity|bescom|tata power|bses|discom|kwh|units|water bill|gas bill|recharge|invoice)\b/i.test(text)) {
    return 'bill';
  }
  if (/\b(?:bank|sbi|hdfc|icici|axis|account|acct|credited|debited|balance|fd|cheque)\b/i.test(text)) {
    return 'bank';
  }
  if (/\b(?:pension|jeevan pramaan|aadhaar|pan card|income tax|epfo|ppo|govt|government|ayushman)\b/i.test(text)) {
    return 'government';
  }
  if (/\b(?:dr\.|doctor|hospital|clinic|prescription|rx|tablet|capsule|mg|mcg|syrup|dosage|clinic)\b/i.test(text)) {
    return 'medical';
  }
  if (/\b(?:courier|parcel|delivery|tracking|bluedart|delhivery|amazon|flipkart|post)\b/i.test(text)) {
    return 'delivery';
  }
  if (/\b(?:beta|beti|bhai|didi|family|papa|mummy|dadi|baba)\b/i.test(text)) {
    return 'family';
  }
  return 'other';
}

function extractLiteralMedicine(text: string): MedicineActionItem | null {
  const match = text.match(/\b(?:Tab|Tablet|Cap|Capsule|Syrup)?\s*([A-Za-z0-9-]{3,20}\s*(?:[0-9]{1,4}\s*(?:mg|mcg|ml)))\b/i);
  if (match && match[1]) {
    return {
      name: match[1].trim(),
      timing: 'As advised by doctor',
    };
  }
  return null;
}

export function generateHonestFallbackCheck(
  rawText: string = '',
  language: Language = 'en'
): UnifiedCheckResponse {
  const text = rawText.trim();
  const scamScan = scanTextForScamSignals(text, language);
  const kind = detectDocumentKind(text);
  const amountDue = extractLiteralRupeeAmount(text);
  const dueDate = extractLiteralDueDate(text);
  const medicine = extractLiteralMedicine(text);

  const fallbackNotice =
    language === 'hi'
      ? 'सारथी ने यह जांच सामान्य सुरक्षा नियमों के आधार पर की है। विस्तृत जानकारी के लिए कृपया बैंक या परिवार से पुष्टि करें।'
      : 'I could not read this fully, so this is a general safety check only. Please confirm with your bank, doctor, or family.';

  let title = 'Document & Message Check';
  let steps: string[] = [];

  if (scamScan.risk === 'scam') {
    title = language === 'hi' ? 'संदिग्ध संदेश - धोखाधड़ी की संभावना' : 'Warning: Suspected Fraud Message';
    steps = [
      language === 'hi'
        ? 'इस संदेश में दिए गए किसी भी लिंक या फ़ोन नंबर पर क्लिक या कॉल न करें।'
        : 'Do NOT click any link or call back any number mentioned in this message.',
      language === 'hi'
        ? 'अपना बैंक ओटीपी, यूपीआई पिन या व्यक्तिगत जानकारी कभी साझा न करें।'
        : 'Never share any OTP, UPI PIN, password, or bank details with anyone.',
      language === 'hi'
        ? 'यदि कोई संदेह हो, तो राष्ट्रीय साइबर हेल्पलाइन 1930 पर संपर्क करें।'
        : 'If in doubt or money was deducted, call the National Cyber Crime Helpline on 1930 immediately.',
    ];
  } else if (kind === 'bill') {
    title = language === 'hi' ? 'बिल सूचना' : 'Utility Bill Notice';
    steps = [
      amountDue
        ? (language === 'hi' ? `राशि ${amountDue} की पुष्टि करें।` : `Confirm the amount of ${amountDue} on your authorized bill portal.`)
        : (language === 'hi' ? 'अपने आधिकारिक बिल खाते पर राशि की जांच करें।' : 'Check the official portal for exact amount details.'),
      dueDate
        ? (language === 'hi' ? `अंतिम तिथि ${dueDate} से पहले भुगतान करें।` : `Pay on or before ${dueDate} to prevent late surcharges.`)
        : (language === 'hi' ? 'अंतिम तिथि का ध्यान रखें।' : 'Verify payment due date through official utility customer support.'),
      language === 'hi'
        ? 'भुगतान केवल आधिकारिक ऐप या काउंटर पर ही करें।'
        : 'Pay only through genuine utility apps or authorized service counters.',
    ];
  } else if (kind === 'medical') {
    title = language === 'hi' ? 'दवा या स्वास्थ्य पर्ची' : 'Medical Prescription or Health Note';
    steps = [
      language === 'hi'
        ? 'डॉक्टर की लिखी पर्ची के अनुसार ही दवा लें।'
        : 'Always follow the exact prescription given by your consulting doctor.',
      language === 'hi'
        ? 'दवा के समय या खुराक में खुद कोई बदलाव न करें।'
        : 'Do not adjust medicine timing or dosage without speaking to your doctor or pharmacist.',
    ];
  } else {
    title = language === 'hi' ? 'सामान्य संदेश जांच' : 'General Message Safety Check';
    steps = [
      language === 'hi'
        ? 'संदेश को ध्यान से पढ़ें और किसी भी अज्ञात लिंक पर क्लिक न करें।'
        : 'Read the message carefully and avoid clicking unknown links.',
      language === 'hi'
        ? 'संदेह होने पर परिवार के किसी सदस्य से सलाह लें।'
        : 'When in doubt, verify the sender through a known, trusted phone number.',
    ];
  }

  // Jargon extraction only if explicitly present
  const jargon: JargonItem[] = [];
  if (/\bkwh\b/i.test(text) || /\bunits\b/i.test(text)) {
    jargon.push({
      term: 'KWh / Units',
      meaning: language === 'hi' ? 'बिजली की खपत मापने की इकाई।' : 'Kilowatt hour; unit measuring electrical energy consumed in the month.',
    });
  }
  if (/\btds\b/i.test(text)) {
    jargon.push({
      term: 'TDS',
      meaning: language === 'hi' ? 'टैक्स कटौती (Tax Deducted at Source)।' : 'Tax Deducted at Source, withheld before interest or pension credit.',
    });
  }

  // Reminder only if genuine dueDate or title exists
  let reminder: ReminderItem | null = null;
  if (kind === 'bill' && (amountDue || dueDate)) {
    reminder = {
      title: 'Pay Utility Bill',
      dueDate: dueDate,
      note: amountDue ? `Amount: ${amountDue}` : 'Review and pay through official bill app',
    };
  }

  return {
    kind,
    title,
    summary: fallbackNotice,
    steps,
    risk: scamScan.risk,
    riskReason: scamScan.riskReason,
    redFlags: scamScan.redFlags,
    amountDue,
    dueDate,
    jargon,
    reminder,
    medicine,
    helpline: scamScan.helpline,
    source: 'fallback',
  };
}
