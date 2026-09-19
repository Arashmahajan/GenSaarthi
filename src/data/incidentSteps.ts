import { Language } from '../types';

export type IncidentChoiceKey =
  | 'clicked_link'
  | 'shared_otp'
  | 'sent_money'
  | 'installed_app'
  | 'shared_aadhaar'
  | 'called_back'
  | 'not_sure';

export interface IncidentChoiceOption {
  key: IncidentChoiceKey;
  labelEn: string;
  labelHi: string;
}

export const INCIDENT_CHOICES: IncidentChoiceOption[] = [
  {
    key: 'clicked_link',
    labelEn: 'I clicked a link',
    labelHi: 'मैंने किसी लिंक पर क्लिक कर दिया',
  },
  {
    key: 'shared_otp',
    labelEn: 'I shared an OTP, PIN, password or card details',
    labelHi: 'मैंने OTP, पिन, पासवर्ड या कार्ड की जानकारी साझा कर दी',
  },
  {
    key: 'sent_money',
    labelEn: 'I sent or paid money',
    labelHi: 'मैंने पैसे भेज दिए या भुगतान कर दिया',
  },
  {
    key: 'installed_app',
    labelEn: 'I installed an app (for example AnyDesk or TeamViewer) or let someone see my screen',
    labelHi: 'मैंने कोई ऐप (जैसे AnyDesk या TeamViewer) इंस्टॉल किया या स्क्रीन दिखाई',
  },
  {
    key: 'shared_aadhaar',
    labelEn: 'I shared my Aadhaar or PAN',
    labelHi: 'मैंने आधार या पैन कार्ड साझा कर दिया',
  },
  {
    key: 'called_back',
    labelEn: 'I called the number back',
    labelHi: 'मैंने उस अनजान नंबर पर वापस कॉल किया',
  },
  {
    key: 'not_sure',
    labelEn: 'I am not sure',
    labelHi: 'मुझे ठीक से पक्का नहीं पता',
  },
];

export interface IncidentStep {
  id: string;
  titleEn: string;
  titleHi: string;
  detailEn: string;
  detailHi: string;
  actionPhone?: string;
  actionUrl?: string;
  priority: number;
}

export const OFFICIAL_HELPLINES = {
  CYBER_CRIME: '1930',
  EMERGENCY: '112',
  ELDERLINE: '14567',
  CYBER_PORTAL: 'https://cybercrime.gov.in',
  UIDAI_PORTAL: 'https://myaadhaar.uidai.gov.in',
} as const;

/**
 * Deterministically builds a prioritized, deduplicated list of immediate steps.
 * Does NOT use AI — safety steps must be reliable and predictable offline.
 */
export function buildIncidentSteps(choices: IncidentChoiceKey[]): IncidentStep[] {
  const steps: IncidentStep[] = [];
  const addedIds = new Set<string>();

  const addStep = (step: IncidentStep) => {
    if (!addedIds.has(step.id)) {
      addedIds.add(step.id);
      steps.push(step);
    }
  };

  const hasSentMoney = choices.includes('sent_money');
  const hasSharedOtp = choices.includes('shared_otp');
  const hasInstalledApp = choices.includes('installed_app');
  const hasClickedLink = choices.includes('clicked_link');
  const hasSharedAadhaar = choices.includes('shared_aadhaar');
  const hasCalledBack = choices.includes('called_back');
  const isNotSure = choices.includes('not_sure') && choices.length === 1;

  // 1. If money was sent OR OTP/PIN/card was shared: Bank + 1930 top priority
  if (hasSentMoney || hasSharedOtp) {
    addStep({
      id: 'call_bank_immediately',
      priority: 1,
      titleEn: 'Call your bank right now',
      titleHi: 'तुरंत अपने बैंक को कॉल करें',
      detailEn:
        'Call your bank now on the official number printed on your card or passbook. Ask them to block the card or UPI and stop the payment.',
      detailHi:
        'तुरंत अपने कार्ड या पासबुक पर लिखे आधिकारिक नंबर पर बैंक को कॉल करें। उनसे कार्ड या UPI ब्लॉक करने और भुगतान रोकने का अनुरोध करें।',
    });

    addStep({
      id: 'call_1930_immediately',
      priority: 2,
      actionPhone: OFFICIAL_HELPLINES.CYBER_CRIME,
      titleEn: 'Call National Cyber Helpline 1930',
      titleHi: 'राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें',
      detailEn:
        'Call the National Cyber Crime Helpline 1930 as soon as you can. Reporting quickly gives the best chance of stopping the money.',
      detailHi:
        'जितनी जल्दी हो सके राष्ट्रीय साइबर अपराध हेल्पलाइन 1930 पर कॉल करें। तुरंत सूचना देने से पैसे रुकने की संभावना सबसे अधिक होती है।',
    });
  }

  // 2. If an app was installed or screen shared: Airplane mode + uninstall
  if (hasInstalledApp) {
    addStep({
      id: 'airplane_mode_uninstall',
      priority: 3,
      titleEn: 'Turn on Airplane Mode & remove the app',
      titleHi: 'फ़ोन में एयरप्लेन मोड लगाएं और ऐप हटाएं',
      detailEn:
        'Turn on airplane mode, then uninstall the app. Do not open your bank app until you have done this.',
      detailHi:
        'फ़ोन में एयरप्लेन मोड चालू करें, फिर उस ऐप को अनइंस्टॉल करें। ऐसा करने से पहले अपना बैंक ऐप बिल्कुल न खोलें।',
    });
  }

  // 3. If a link was clicked
  if (hasClickedLink) {
    addStep({
      id: 'close_link_do_not_reopen',
      priority: 4,
      titleEn: 'Close the page and do not click again',
      titleHi: 'उस वेब पेज को बंद करें और दोबारा न खोलें',
      detailEn:
        'Do not enter anything on the page. Close it. Do not click the link again.',
      detailHi:
        'उस पेज पर कोई भी जानकारी न भरें। तुरंत बंद कर दें और उस लिंक पर दोबारा क्लिक न करें।',
    });
  }

  // 4. If OTP, PIN, password or card details were shared: Change passwords
  if (hasSharedOtp) {
    addStep({
      id: 'change_pins_and_passwords',
      priority: 5,
      titleEn: 'Change bank & UPI passwords',
      titleHi: 'बैंक और UPI पिन तुरंत बदलें',
      detailEn:
        'Change your bank and UPI PIN and passwords from a safe device or ask your bank to.',
      detailHi:
        'किसी सुरक्षित डिवाइस से अपना बैंक पासवर्ड और UPI पिन बदलें या बैंक से बदलने को कहें।',
    });
  }

  // 5. If Aadhaar or PAN was shared
  if (hasSharedAadhaar) {
    addStep({
      id: 'lock_aadhaar_biometrics',
      priority: 6,
      actionUrl: OFFICIAL_HELPLINES.UIDAI_PORTAL,
      titleEn: 'Protect your Aadhaar & inform bank',
      titleHi: 'आधार बायोमेट्रिक्स सुरक्षित करें और बैंक को बताएं',
      detailEn:
        'Do not share more documents. Tell your bank. You can lock your Aadhaar biometrics on the official UIDAI website or app, or ask a family member to help.',
      detailHi:
        'अब कोई अन्य दस्तावेज़ साझा न करें। अपने बैंक को सूचित करें। आप UIDAI की आधिकारिक वेबसाइट या ऐप पर बायोमेट्रिक्स लॉक कर सकते हैं, या परिवार के सदस्य से मदद लें।',
    });
  }

  // 6. If a number was called back
  if (hasCalledBack) {
    addStep({
      id: 'block_fraud_number',
      priority: 7,
      titleEn: 'Block that phone number',
      titleHi: 'उस नंबर को तुरंत ब्लॉक करें',
      detailEn: 'Do not answer that number again. Block it.',
      detailHi: 'उस नंबर का दोबारा कोई जवाब न दें। उसे अपने फ़ोन में ब्लॉक कर दें।',
    });
  }

  // If user only selected "not sure", provide 1930 helpline guidance
  if (isNotSure) {
    addStep({
      id: 'call_1930_general',
      priority: 2,
      actionPhone: OFFICIAL_HELPLINES.CYBER_CRIME,
      titleEn: 'Call National Cyber Helpline 1930',
      titleHi: 'राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें',
      detailEn:
        'If you suspect anything suspicious, calling 1930 can help protect your account right away.',
      detailHi:
        'यदि आपको कोई भी संदेह है, तो 1930 पर कॉल करने से आपके खाते की तत्काल सुरक्षा हो सकती है।',
    });
  }

  // Always: Do not send any more money, tell family, report online
  addStep({
    id: 'do_not_send_more_money',
    priority: 8,
    titleEn: 'Do not send any more money',
    titleHi: 'आगे कोई भी पैसा न भेजें',
    detailEn:
      'Do not send any more money, even if they promise a refund.',
    detailHi:
      'आगे कोई पैसा न भेजें, चाहे वे पैसे वापस लौटाने का कितना भी वादा करें।',
  });

  addStep({
    id: 'tell_family_now',
    priority: 9,
    titleEn: 'Tell a family member now',
    titleHi: 'परिवार के किसी सदस्य को तुरंत बताएं',
    detailEn: 'Tell a family member now. This can happen to anyone.',
    detailHi: 'परिवार के किसी सदस्य को अभी बताएं। यह बात किसी के भी साथ हो सकती है, इसमें आपकी कोई गलती नहीं है।',
  });

  addStep({
    id: 'report_cybercrime_portal',
    priority: 10,
    actionUrl: OFFICIAL_HELPLINES.CYBER_PORTAL,
    titleEn: 'Report online at cybercrime.gov.in',
    titleHi: 'cybercrime.gov.in पर ऑनलाइन शिकायत दर्ज करें',
    detailEn:
      'Report it online at cybercrime.gov.in when you are ready. A family member can help.',
    detailHi:
      'जब आप शांत हों, तब cybercrime.gov.in पर ऑनलाइन रिपोर्ट दर्ज करें। इसमें परिवार का सदस्य आपकी मदद कर सकता है।',
  });

  // Sort by priority ascending
  return steps.sort((a, b) => a.priority - b.priority);
}

export interface IncidentNoteRecord {
  id: string;
  dateTime: string;
  amountLost?: string;
  transactionId?: string;
  senderContact?: string;
  notes?: string;
  choices: IncidentChoiceKey[];
  createdAt: string;
}
