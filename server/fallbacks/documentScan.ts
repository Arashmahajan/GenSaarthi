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
  if (!text || typeof text !== 'string') return null;

  const nilRegex =
    /(?:total\s+due|amount\s+due|net\s+amount|bill\s+amount|payable|total|देय\s+राशि|कुल\s+राशि)\s*[:\-]?\s*(?:nil|zero|no\s+dues|शून्य|कोई\s+बकाया\s+नहीं)/i;
  if (nilRegex.test(text)) {
    return 'Rs 0';
  }

  const lines = text.split(/\r?\n/);
  const targetLabel =
    /(?:total\s+due|amount\s+due|net\s+amount|bill\s+amount|payable|total|कुल\s+देय|देय\s+राशि|कुल\s+राशि)/i;

  // 1. Line-by-line matching where target label exists
  for (const line of lines) {
    if (targetLabel.test(line)) {
      if (/(?:nil|zero|no\s+dues|शून्य)/i.test(line)) {
        return 'Rs 0';
      }
      const match = line.match(
        /(?:₹|Rs\.?|INR)\s*[0-9]{1,3}(?:(?:,[0-9]{2,3})+|[0-9]*)(?:\.[0-9]{1,2})?|[0-9]{1,3}(?:(?:,[0-9]{2,3})+|[0-9]*)(?:\.[0-9]{1,2})?\s*(?:₹|Rs\.?|INR)/i
      );
      if (match) {
        const raw = match[0].trim();
        const numOnly = raw.replace(/[^0-9]/g, '');
        // Reject 10-digit mobile numbers or timestamps
        if (numOnly.length === 10 && /^[6-9]/.test(numOnly)) continue;
        return raw;
      }
    }
  }

  // 2. Search anywhere in text near the label (within 35 chars)
  const labeledMatch = text.match(
    /(?:total\s+due|amount\s+due|net\s+amount|bill\s+amount|payable|total|कुल\s+देय|देय\s+राशि|कुल\s+राशि)\s*[:\-]?\s*((?:₹|Rs\.?|INR)\s*[0-9]{1,3}(?:(?:,[0-9]{2,3})+|[0-9]*)(?:\.[0-9]{1,2})?|[0-9]{1,3}(?:(?:,[0-9]{2,3})+|[0-9]*)(?:\.[0-9]{1,2})?\s*(?:₹|Rs\.?|INR))/i
  );
  if (labeledMatch && labeledMatch[1]) {
    const raw = labeledMatch[1].trim();
    const numOnly = raw.replace(/[^0-9]/g, '');
    if (!(numOnly.length === 10 && /^[6-9]/.test(numOnly))) {
      return raw;
    }
  }

  return null;
}

export function extractLiteralDueDate(text: string): string | null {
  if (!text || typeof text !== 'string') return null;

  // Reject explicit "no due date"
  if (/\bno\s+due\s+date\b/i.test(text)) {
    return null;
  }

  const datePatternStr =
    '(?:[0-9०-९]{1,2}(?:st|nd|rd|th)?[-./\\s]+(?:[0-9०-९]{1,2}|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्टूबर|नवंबर|दिसंबर)[-./\\s]+[0-9०-९]{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-./\\s]+[0-9०-९]{1,2}(?:st|nd|rd|th)?(?:,)?[-./\\s]+[0-9०-९]{2,4}|[0-9०-९]{4}[-./][0-9०-९]{1,2}[-./][0-9०-९]{1,2})';

  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    const matchDue = trimmed.match(
      new RegExp(
        '(?:due(?:\\s+date)?|pay\\s+(?:by|before)|\\bbefore\\b|last\\s+date|देय\\s+तिथि|अंतिम\\s+तिथि|भुगतान\\s+तिथि)\\s*[:\\-]?\\s*(' +
          datePatternStr +
          ')',
        'i'
      )
    );
    if (matchDue && matchDue[1]) {
      return matchDue[1].trim();
    }
  }

  const textMatch = text.match(
    new RegExp(
      '(?:due(?:\\s+date)?|pay\\s+(?:by|before)|\\bbefore\\b|last\\s+date|देय\\s+तिथि|अंतिम\\s+तिथि|भुगतान\\s+तिथि)\\s*[:\\-]?\\s*(' +
        datePatternStr +
        ')',
      'i'
    )
  );
  if (textMatch && textMatch[1]) {
    return textMatch[1].trim();
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

  // If the fallback ran with NO text (image-only request), never return "safe"
  if (!text) {
    return {
      kind: 'other',
      title: language === 'hi' ? 'फोटो पढ़ी नहीं जा सकी' : 'I could not read this photo',
      summary:
        language === 'hi'
          ? 'यह फोटो ऑफ़लाइन पढ़ी नहीं जा सकी। कृपया संदेश का पाठ (text) लिखकर या कॉपी करके यहां जांचें।'
          : 'The photo could not be read offline. Please type or paste the message text here to check it safely.',
      steps: [
        language === 'hi'
          ? 'जांच करने के लिए संदेश का टेक्स्ट यहां टाइप या पेस्ट करें'
          : 'Type or paste the message text here to check it',
        language === 'hi'
          ? 'जांच होने तक इसमें दिए गए किसी भी लिंक या नंबर पर न जाएं'
          : 'Do not click links or call numbers in it until checked',
      ],
      risk: 'careful',
      riskReason:
        language === 'hi'
          ? 'फोटो का पाठ ऑफ़लाइन नहीं पढ़ा जा सका। बिना जांचे किसी लिंक या नंबर पर भरोसा न करें।'
          : 'I could not read this photo offline. Please verify via text before taking action.',
      redFlags: [
        language === 'hi'
          ? 'फोटो का विवरण ऑफ़लाइन उपलब्ध नहीं है।'
          : 'Photo text could not be extracted offline.',
      ],
      amountDue: null,
      dueDate: null,
      jargon: [],
      reminder: null,
      medicine: null,
      helpline: null,
      source: 'fallback',
    };
  }

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
