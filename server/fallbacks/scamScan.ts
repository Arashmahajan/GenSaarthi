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

  const safeText = text || '';

  // Filter out benign usages like "cardiac arrest" and "arrested development"
  const textWithoutBenignArrest = safeText
    .replace(/\bcardiac arrest\b/gi, '___')
    .replace(/\barrested development\b/gi, '___');

  // 1. Utility disconnection threat
  const hasUtility =
    matchesRegex(safeText, /\b(?:electricity|power|bijli|gas|water|vidyut|urja)\b/i) ||
    /बिजली|गैस|पानी|विद्युत|ऊर्जा/.test(safeText);
  const hasCut =
    matchesRegex(safeText, /\b(?:disconnect(?:ed|ing|ion)?|cut|cutoff|cut-off|will be cut)\b/i) ||
    /कट जाएग|कट जाएग़|काट दिया|बंद कर दिया|काटा जाएग|कटेगा|कटेगी|बंद हो जाएग|बिजली कट/.test(safeText);
  const hasDisconnUrgency =
    matchesRegex(safeText, /\b(?:tonight|today|immediately|now|within\s+\d+\s+hours?)\b/i) ||
    matchesRegex(safeText, /\bcall\b.*?\b\d{10}\b/i) ||
    /\b\d{10}\b/.test(safeText) ||
    /आज रात|आज|तुरंत|फ़ौरन|तत्काल|कॉल करें|संपर्क करें/.test(safeText);

  let utilityDisconnectionFired = false;
  if (hasUtility && hasCut && hasDisconnUrgency) {
    utilityDisconnectionFired = true;
    strongMatches.push('utility_disconnection');
    redFlags.push(
      language === 'hi'
        ? 'बिजली या यूटिलिटी कनेक्शन तुरंत काटने की धमकी'
        : 'Threat of electricity or utility disconnection with urgency'
    );
  }

  // 2. Arrest / digital arrest threat
  const hasArrest =
    matchesRegex(textWithoutBenignArrest, /\b(?:arrest(?:ed|ing)?|digital arrest)\b/i) ||
    /गिरफ्तार|गिरफ़्तार|डिजिटल अरेस्ट/.test(textWithoutBenignArrest);
  const hasAgency =
    matchesRegex(textWithoutBenignArrest, /\b(?:cbi|ed|customs|narcotics|ncb|police|court)\b/i) ||
    /सीबीआई|ईडी|कस्टम्स?|पुलिस|अदालत|नारकोटिक्स/.test(textWithoutBenignArrest);
  const hasArrestContext =
    matchesRegex(
      textWithoutBenignArrest,
      /\b(?:parcel|drugs?|illegal|money laundering|transfer|verification|video call|penalty|fine|crime|seized)\b/i
    ) ||
    /पार्सल|ड्रग्स|ड्रग|अवैध|मनी लॉन्ड्रिंग|ट्रांसफर|वेरिफिकेशन|वीडियो कॉल|जुर्माना|दंड|अपराध/.test(
      textWithoutBenignArrest
    );

  let arrestFired = false;
  if (
    (hasArrest && (hasAgency || hasArrestContext)) ||
    (hasAgency && hasArrestContext) ||
    matchesRegex(textWithoutBenignArrest, /\bdigital arrest\b/i) ||
    /डिजिटल अरेस्ट/.test(textWithoutBenignArrest)
  ) {
    arrestFired = true;
    strongMatches.push('arrest_extortion');
    redFlags.push(
      language === 'hi'
        ? 'डिजिटल अरेस्ट, पुलिस या सीबीआई द्वारा गिरफ्तारी की धमकी'
        : 'Arrest, digital arrest, or law enforcement extortion threat'
    );
  }

  // 3. Demand to move money urgently / verification / fees
  const hasMoneyAction =
    matchesRegex(safeText, /\b(?:transfer|send|pay|deposit)\b/i) ||
    /भेजें|भेजो|ट्रांसफर|भुगतान|डिपॉजिट|जमा करें|पे करें|पैसे भेजें/.test(safeText);
  const hasUrgencyOrFee =
    matchesRegex(safeText, /\b(?:urgent(?:ly)?|immediately|now|verification|processing fee|security deposit|safe account)\b/i) ||
    /तुरंत|फ़ौरन|अभी|तत्काल|वेरिफिकेशन|प्रोसेसिंग फीस|सिक्योरिटी डिपॉजिट|turant/i.test(safeText);

  let moveMoneyFired = false;
  if (hasMoneyAction && hasUrgencyOrFee) {
    moveMoneyFired = true;
    strongMatches.push('move_money_demand');
    redFlags.push(
      language === 'hi'
        ? 'तुरंत पैसे भेजने या फीस चुकाने का दबाव'
        : 'Urgent demand to transfer money or pay fees'
    );
  }

  // 4. New-number family emergency
  const hasNewNumber =
    matchesRegex(safeText, /\b(?:new number|lost my phone|phone broke|phone lost)\b/i) ||
    /naya number|phone toot gaya|phone kho gaya/i.test(safeText) ||
    /नया नंबर|फोन खो गया|फोन टूट गया|फ़ोन खो गया/.test(safeText);
  const hasEmergencyMoney =
    matchesRegex(safeText, /\b(?:send|transfer|pay|upi|money|cash)\b/i) ||
    /paise|bhejo/i.test(safeText) ||
    /पैसे|भेजें|भेजो|रुपये|ट्रांसफर|यूपीआई/.test(safeText);

  if (hasNewNumber && hasEmergencyMoney) {
    strongMatches.push('family_impersonation');
    redFlags.push(
      language === 'hi'
        ? 'नए नंबर से परिवार का सदस्य बनकर पैसे मांगने का झांसा'
        : 'Impersonation of family member with new number asking for money'
    );
  }

  // 5. Part-time job / daily earning task scam
  const hasEarn =
    matchesRegex(safeText, /\b(?:earn|income|daily|per day|salary)\b/i) ||
    /kamao|kamayein/i.test(safeText) ||
    /कमाएं|कमाई|प्रतिदिन|रोजाना|रुपये रोज/.test(safeText);
  const hasTask =
    matchesRegex(safeText, /\b(?:like|likes|subscribe|telegram|whatsapp group|task|review|rating)\b/i) ||
    /यूट्यूब लाइक|टेलीग्राम|व्हाट्सएप ग्रुप|टास्क|रिव्यू/.test(safeText);

  if (hasEarn && hasTask) {
    strongMatches.push('job_task_scam');
    redFlags.push(
      language === 'hi'
        ? 'घर बैठे लाइक या रिव्यू करके रोज़ाना पैसे कमाने का झांसा'
        : 'Part-time job or daily earning task scam'
    );
  }

  // 6. OTP requests
  if (matchesWord(safeText, 'otp') || matchesRegex(safeText, /\bone[- ]time password\b/i) || /ओटीपी/.test(safeText)) {
    strongMatches.push('otp_request');
    redFlags.push(
      language === 'hi'
        ? 'ओटीपी (OTP) मांगने का प्रयास (बैंक कभी ओटीपी नहीं मांगते)'
        : 'Request for OTP / One-Time Password'
    );
  }

  // 7. Remote access apps
  if (
    matchesWord(safeText, 'anydesk') ||
    matchesWord(safeText, 'teamviewer') ||
    matchesWord(safeText, 'quicksupport') ||
    matchesWord(safeText, 'rustdesk')
  ) {
    strongMatches.push('remote_access');
    redFlags.push(
      language === 'hi'
        ? 'स्क्रीन शेयरिंग ऐप (AnyDesk / TeamViewer) डाउनलोड करने का दबाव'
        : 'Request to install remote screen-sharing software (AnyDesk / TeamViewer)'
    );
  }

  // 8. KYC / Account block / PAN / Aadhaar update
  const hasKycPan =
    matchesRegex(safeText, /\b(?:kyc|pan|aadhaar)\b/i) ||
    /केवाईसी|पैन कार्ड|पैन|आधार/.test(safeText);
  const hasAccountOrBank =
    matchesRegex(safeText, /\b(?:account|acct|bank|sbi|hdfc|icici|axis|pnb)\b/i) ||
    /खाता|बैंक|एसबीआई/.test(safeText);
  const hasBlock =
    matchesRegex(safeText, /\b(?:blocked?|suspended?|deactivated?|expired?)\b/i) ||
    /बंद|ब्लॉक|खाता बंद/.test(safeText);
  const hasAction =
    matchesRegex(
      safeText,
      /\b(?:click\s+(?:the\s+)?link|https?:\/\/|verify\s+now|share\s+otp|update\s+your\s+kyc|update\s+now|update\s+kyc)\b/i
    ) || /ओटीपी|लिंक|अपडेट/.test(safeText);

  if ((hasKycPan || hasAccountOrBank) && hasBlock) {
    strongMatches.push('account_block_threat');
    redFlags.push(
      language === 'hi'
        ? 'बैंक खाता या सेवा बंद होने की धमकी'
        : 'Threat of bank account or service blockage'
    );
  }
  if (hasKycPan && hasAction) {
    strongMatches.push('kyc_link_prompt');
    redFlags.push(
      language === 'hi'
        ? 'लिंक पर क्लिक करके केवाईसी या विवरण अपडेट करने का दबाव'
        : 'Urges updating KYC/PAN via link or unverified channel'
    );
  }

  // 9. Lottery, prize, winner, gift cards
  if (
    matchesWord(safeText, 'lottery') ||
    matchesWord(safeText, 'prize') ||
    matchesWord(safeText, 'winner') ||
    matchesWord(safeText, 'kbc') ||
    matchesRegex(safeText, /\bgift\s*card\b/i) ||
    /लॉटरी|इनाम|विजेता|केबीसी/.test(safeText)
  ) {
    strongMatches.push('lottery_lure');
    redFlags.push(
      language === 'hi'
        ? 'बिना किसी लॉटरी के इनाम या उपहार का लालच'
        : 'Unearned lottery, prize, or gift card promise'
    );
  }

  // 10. Sensitive credentials: UPI PIN, CVV
  if (
    matchesRegex(safeText, /\b(?:upi\s*pin|card\s*pin|cvv|atm\s*pin)\b/i) ||
    /यूपीआई पिन|सीवीवी/.test(safeText)
  ) {
    strongMatches.push('banking_pin_request');
    redFlags.push(
      language === 'hi'
        ? 'यूपीआई पिन (UPI PIN) या कार्ड सीवीवी (CVV) की मांग'
        : 'Request for UPI PIN or card CVV'
    );
  }

  // 11. Fake refund
  if (
    matchesWord(safeText, 'refund') &&
    (hasAction || matchesWord(safeText, 'otp') || /ओटीपी|रिफंड/.test(safeText))
  ) {
    strongMatches.push('fake_refund');
    redFlags.push(
      language === 'hi'
        ? 'फर्जी रिफंड के नाम पर लिंक या जानकारी मांगने का प्रयास'
        : 'Unverified refund promise requiring link or OTP'
    );
  }

  // Weak signals
  if (/(?:bit\.ly|tinyurl\.com|tinyurl|cutt\.ly|t\.co|\.xyz\b|\.top\b)/i.test(safeText)) {
    weakMatches.push('shortened_link');
  }
  if (matchesRegex(safeText, /\b(?:urgent|urgently|jaldi|turant)\b/i) || /तुरंत|जल्दी/.test(safeText)) {
    weakMatches.push('urgency_language');
  }
  if (matchesRegex(safeText, /\b(?:immediately|right now|now)\b/i) || /तत्काल|फ़ौरन|अभी/.test(safeText)) {
    weakMatches.push('immediate_action');
  }
  if (matchesRegex(safeText, /\b(?:parcel|courier|delivery)\b/i) || /पार्सल|कूरियर/.test(safeText)) {
    weakMatches.push('parcel_delivery');
  }
  if (matchesRegex(safeText, /\b(?:bank|sbi|hdfc|icici|axis|pnb)\b/i) || /बैंक|एसबीआई/.test(safeText)) {
    weakMatches.push('bank_name');
  }
  if (matchesRegex(safeText, /\b(?:click\s+(?:the\s+)?link|click here|tap here)\b/i) || /लिंक पर क्लिक/.test(safeText)) {
    weakMatches.push('click_link');
  }
  if (matchesRegex(safeText, /\b(?:verify\s+now|verification)\b/i) || /वेरिफाई|पुष्टि/.test(safeText)) {
    weakMatches.push('verify_prompt');
  }
  if (
    matchesRegex(textWithoutBenignArrest, /\b(?:police|customs|cbi|ed|ncb|court)\b/i) ||
    /पुलिस|सीबीआई/.test(textWithoutBenignArrest)
  ) {
    weakMatches.push('agency_name');
  }
  if (matchesRegex(safeText, /\b(?:telegram|whatsapp group|join|channel)\b/i) || /टेलीग्राम|व्हाट्सएप/.test(safeText)) {
    weakMatches.push('messaging_platform');
  }

  // Special rule:
  // A single strong signal from utility disconnection, arrest, or move money alone is enough for "scam"
  // when a phone number, link or "immediately/tonight" also appears.
  const hasPhoneLinkOrImmediate =
    /\b(?:\+?91[\-\s]?)?[6-9]\d{9}\b/.test(safeText) ||
    /https?:\/\/|\b(?:bit\.ly|tinyurl|cutt\.ly|t\.co|\.xyz|\.top)\b/i.test(safeText) ||
    /\b(?:immediately|tonight|today|now)\b/i.test(safeText) ||
    /आज रात|तुरंत|फ़ौरन|तत्काल/.test(safeText);

  const specialSingleStrong =
    (utilityDisconnectionFired || arrestFired || moveMoneyFired) && hasPhoneLinkOrImmediate;

  let risk: RiskLevel = 'safe';
  let riskReason = '';

  // Scoring:
  // 2+ strong signals => 'scam'
  // 1 strong + 1+ weak => 'scam'
  // 1 strong alone (utility/arrest/moveMoney) + phone/link/immediate => 'scam'
  // 1 strong alone => 'careful'
  // 2+ weak => 'careful'
  // 0 signals => 'safe'
  if (strongMatches.length >= 2 || (strongMatches.length >= 1 && weakMatches.length >= 1) || specialSingleStrong) {
    risk = 'scam';
    riskReason =
      language === 'hi'
        ? 'यह संदेश धोखाधड़ी (स्कैम) का गंभीर खतरा है। बैंक या परिवार से आधिकारिक नंबर पर पुष्टि किए बिना कुछ न करें।'
        : 'Multiple strong fraud indicators or extortion patterns detected. Never transfer money or share credentials.';
  } else if (strongMatches.length === 1 || weakMatches.length >= 2) {
    risk = 'careful';
    riskReason =
      language === 'hi'
        ? 'इस संदेश में कुछ संदिग्ध बातें हैं। किसी भी लिंक या नंबर पर जाने से पहले परिवार या बैंक से जांचें।'
        : 'This message contains unverified requests or urgency. Please confirm with your bank or family via official contacts.';
  } else {
    // If input is longer than ~60 chars and contains no recognizable words at all
    const commonWords =
      /\b(?:the|is|are|was|were|to|in|at|on|of|for|with|by|and|or|you|your|my|this|that|from|have|has|not|will|can|dear|please|call|account|bill|due|payment|date|bank|doctor|hospital|daily|take|safe|sir|madam|order|delivery|service|message|namaste|pranam|aap|apna|apne|apni|hai|hain|ho|ka|ki|ke|se|ko|me|mein|par|aur|ya|nahi)\b/i;
    const devanagariWords = /कृपया|का|की|के|है|हैं|में|से|को|पर|और|या|नहीं|नमस्ते|प्रणाम|आप|अपना|अपनी|अपने/;

    if (safeText.length > 60 && !commonWords.test(safeText) && !devanagariWords.test(safeText)) {
      risk = 'careful';
      riskReason =
        language === 'hi'
          ? 'संदेश में कोई स्पष्ट या पहचानने योग्य शब्द नहीं मिले। सावधानी बरतें।'
          : 'The message contains unrecognisable text or characters. Please be careful before trusting it.';
    } else {
      risk = 'safe';
      riskReason =
        language === 'hi'
          ? 'प्राथमिक सुरक्षा जांच में कोई बड़ा खतरा नहीं मिला (यह सीमित ऑफ़लाइन जांच है)।'
          : 'No obvious scam patterns detected in this limited offline check. Always verify with official sources.';
    }
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
