import { RiskLevel, Language } from '../types';

export interface ScamScanResult {
  risk: RiskLevel;
  riskReason: string;
  redFlags: string[];
  helpline: string | null;
  detectedSignals: {
    strong: string[];
    weak: string[];
  };
}

// Word-boundary helper to ensure "panel" never matches "pan", "this" never matches "hi", "table" never matches "tab"
function matchesWord(text: string, pattern: string): boolean {
  const regex = new RegExp(`\\b${pattern}\\b`, 'i');
  return regex.test(text);
}

function matchesRegex(text: string, regex: RegExp): boolean {
  return regex.test(text);
}

export function scanTextForScamSignals(text: string, language: Language = 'en'): ScamScanResult {
  const strongMatches: string[] = [];
  const weakMatches: string[] = [];
  const redFlags: string[] = [];

  // Strong signals
  // 1. OTP requests
  if (matchesWord(text, 'otp') || matchesRegex(text, /\bone[- ]time password\b/i)) {
    strongMatches.push('Request for OTP / One-Time Password');
    redFlags.push('Mentions or asks for an OTP (banks never ask for OTPs)');
  }

  // 2. Remote screen-sharing apps
  if (
    matchesWord(text, 'anydesk') ||
    matchesWord(text, 'teamviewer') ||
    matchesWord(text, 'quicksupport') ||
    matchesWord(text, 'rustdesk')
  ) {
    strongMatches.push('Remote access software mention');
    redFlags.push('Asks to download screen-sharing tools (AnyDesk/TeamViewer/QuickSupport)');
  }

  // 3. Arrest or Digital Arrest / Police / CBI threats with demands
  const hasArrest = matchesWord(text, 'arrest') || matchesRegex(text, /\bdigital arrest\b/i);
  const hasAgency = matchesWord(text, 'cbi') || matchesWord(text, 'customs') || matchesWord(text, 'police');
  if (hasArrest || (hasAgency && (matchesWord(text, 'illegal') || matchesWord(text, 'drugs') || matchesWord(text, 'penalty') || matchesWord(text, 'court')))) {
    strongMatches.push('Arrest / law enforcement extortion threat');
    redFlags.push('Claims of arrest, CBI, customs seizure, or legal action');
  }

  // 4. KYC / Account block / PAN / Aadhaar update coupled with urgency or links
  const hasKycOrPan =
    matchesWord(text, 'kyc') ||
    matchesWord(text, 'pan') ||
    matchesRegex(text, /\baadhaar update\b/i) ||
    matchesRegex(text, /\bpan card\b/i);

  const hasBlockOrSuspended =
    matchesWord(text, 'blocked') ||
    matchesWord(text, 'suspended') ||
    matchesWord(text, 'deactivated') ||
    matchesRegex(text, /\bwill be cut\b/i) ||
    matchesRegex(text, /\bdisconnected\b/i);

  const hasLinkOrAction =
    matchesRegex(text, /\bclick\s+(?:the\s+)?link\b/i) ||
    matchesRegex(text, /\bhttps?:\/\//i) ||
    matchesRegex(text, /\bverify\s+now\b/i) ||
    matchesRegex(text, /\bcall\s+(?:immediately|\d{10})\b/i);

  if (hasKycOrPan && (hasBlockOrSuspended || hasLinkOrAction)) {
    strongMatches.push('KYC/PAN account block pressure');
    redFlags.push('Pressures to update KYC/PAN under threat of account block');
  }

  // 5. Lottery, prize, winner, gift cards
  if (
    matchesWord(text, 'lottery') ||
    matchesWord(text, 'prize') ||
    matchesWord(text, 'winner') ||
    matchesRegex(text, /\bgift\s+card\b/i)
  ) {
    strongMatches.push('Lottery or unearned prize lure');
    redFlags.push('Claims of unearned lottery, prize, or gift card');
  }

  // 6. Sensitive credentials: UPI PIN, CVV
  if (
    matchesRegex(text, /\bupi\s*pin\b/i) ||
    matchesWord(text, 'cvv') ||
    matchesRegex(text, /\bcard\s*pin\b/i)
  ) {
    strongMatches.push('Sensitive banking credential request (UPI PIN / CVV)');
    redFlags.push('Demands entry of UPI PIN or CVV (UPI PIN is ONLY for paying, never for receiving)');
  }

  // 7. Fake refund lure
  if (matchesWord(text, 'refund') && (hasLinkOrAction || matchesWord(text, 'otp'))) {
    strongMatches.push('Fake refund requiring action');
    redFlags.push('Promises refund if you click a link or share details');
  }

  // Weak signals
  if (matchesWord(text, 'urgent') || matchesWord(text, 'urgently')) {
    weakMatches.push('Urgent language');
  }
  if (matchesWord(text, 'immediately')) {
    weakMatches.push('Immediate action demanded');
  }
  if (matchesWord(text, 'parcel') || matchesWord(text, 'courier') || matchesWord(text, 'delivery')) {
    weakMatches.push('Parcel or delivery mention');
  }
  if (matchesWord(text, 'bank') || matchesWord(text, 'sbi') || matchesWord(text, 'hdfc') || matchesWord(text, 'icici')) {
    weakMatches.push('Bank name mention');
  }
  if (matchesRegex(text, /\bclick\s+(?:the\s+)?link\b/i)) {
    weakMatches.push('Link click prompt');
  }
  if (matchesRegex(text, /\bverify\s+now\b/i)) {
    weakMatches.push('Verify now prompt');
  }
  if (matchesWord(text, 'police') || matchesWord(text, 'customs') || matchesWord(text, 'cbi')) {
    weakMatches.push('Official agency mention');
  }

  // Scoring system:
  // 2+ strong signals -> scam
  // 1 strong signal OR 2+ weak signals -> careful
  // 0 strong, 0-1 weak -> safe
  let risk: RiskLevel = 'safe';
  let riskReason = '';

  if (strongMatches.length >= 2) {
    risk = 'scam';
    riskReason =
      language === 'hi'
        ? 'यह संदेश धोखाधड़ी (स्कैम) का बड़ा खतरा है। आधिकारिक बैंक या पुलिस नंबर से पुष्टि किए बिना कुछ न करें।'
        : 'Multiple strong fraud indicators detected. Confirm with your bank or family using an official number before taking any action.';
  } else if (strongMatches.length === 1 || weakMatches.length >= 2) {
    risk = 'careful';
    riskReason =
      language === 'hi'
        ? 'इस संदेश में कुछ संदिग्ध बातें हैं। कृपया किसी भी लिंक या नंबर पर क्लिक करने से पहले परिवार या बैंक से जांचें।'
        : 'This message contains unverified requests or urgency. Please confirm with your bank or family via official contacts.';
  } else {
    risk = 'safe';
    riskReason =
      language === 'hi'
        ? 'प्राथमिक सुरक्षा जांच में कोई बड़ा खतरा नहीं मिला, लेकिन सामान्य सावधानी हमेशा रखें।'
        : 'No obvious scam patterns detected in this limited check. Always verify with official sources.';
  }

  return {
    risk,
    riskReason,
    redFlags,
    helpline: risk === 'scam' ? '1930' : null,
    detectedSignals: {
      strong: strongMatches,
      weak: weakMatches,
    },
  };
}
