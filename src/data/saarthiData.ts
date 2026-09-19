import { DocumentAnalysisResult, MedicineItem, SeniorScheme, DigitalGuide, ScamCheckResult } from '../types';

export const SAMPLE_DOCUMENTS = [
  {
    id: 'bescom-bill',
    title: 'BESCOM Electricity Bill (Bangalore)',
    category: 'Electricity Bill',
    snippet: `BANGALORE ELECTRICITY SUPPLY COMPANY LIMITED (BESCOM)
Consumer ID: 7492019482 | RR No: E3-4921
Billing Period: 01-Sep-2024 to 30-Sep-2024
Units Consumed: 184 kWh (LT-2 Domestic Tariff)
Energy Charges: ₹ 1,288.00
Fixed Minimum Charges: ₹ 220.00
Fuel Adjustment Charge (FAC): ₹ 84.50
Electricity Duty (9%): ₹ 143.32
Arrears: ₹ 0.00
Interest on Arrears: ₹ 0.00
Total Net Payable Amount: ₹ 1,735.82 (Rounded: ₹ 1,736.00)
Due Date for Payment: 24-Oct-2024
Disconnection Notice Date: 08-Nov-2024 if unpaid.
Late Payment Surcharge: ₹ 50.00 after due date.
Payment Mode: Online portal bescom.karnataka.gov.in or BBPS apps.`,
  },
  {
    id: 'doctor-prescription',
    title: 'Dr. Sharma Clinic - Health Prescription',
    category: 'Doctor Prescription',
    snippet: `DR. A.K. SHARMA, MD (Medicine), Senior Consultant Physician
Patient: Ramesh Chandra Gupta, Age: 68 Yrs, Male
Diagnosis: Essential Hypertension, Type-2 Diabetes Mellitus (Controlled)
Vitals: BP: 138/86 mmHg | Fasting Sugar: 122 mg/dL | Weight: 71 kg

Rx (Prescription):
1. Tab. TELMA 40 (Telmisartan 40mg) - 1 tab OD (Morning after breakfast) x 30 days
2. Tab. GLYCOMET 500 SR (Metformin 500mg) - 1 tab BD (After lunch & dinner) x 30 days
3. Tab. ATORVA 10 (Atorvastatin 10mg) - 1 tab HS (Bedtime) x 30 days
4. Tab. SHELCAL 500 (Calcium + Vit D3) - 1 tab OD (Afternoon after lunch) x 30 days

Diet & Advice:
- Brisk 30-minute morning walk in open sunlight.
- Low salt diet (less than 1 teaspoon/day). Avoid deep fried snacks.
- Adequate hydration: 2 to 2.5 litres lukewarm water daily.
- Review after 1 month with fasting sugar and home BP log.`,
  },
  {
    id: 'bank-sms',
    title: 'State Bank of India - Debit SMS Alert',
    category: 'Bank Notification',
    snippet: `Dear Customer, A/C No. ending with XX4921 has been debited by INR 3,450.00 on 14-Oct-24 11:42 AM via UPI/P2M to D-MART SUPERMARKET BLR Ref No 428819201948.
Available Balance in A/C: INR 64,820.50.
If not done by you, immediately forward this SMS to 9223008333 or call 18001234 to block your UPI and NetBanking. - SBI`,
  },
  {
    id: 'pension-ppo',
    title: 'Central Pension Accounting Office (CPAO) Notice',
    category: 'Pension Notice',
    snippet: `CENTRAL PENSION ACCOUNTING OFFICE, GOVT OF INDIA
To: Pensioner Shri V. Ramanathan | PPO Number: 249018204918
Subject: Dearness Relief (DR) revision and Annual Life Certificate Submission 2024.
1. Dearness Relief for Central Government pensioners enhanced by 3% from 50% to 53% effective 01-July-2024.
2. Pensioners aged 80 years and above are permitted to submit Life Certificate from 01-October-2024.
3. Other pensioners (60 to 79 years) must submit Jeevan Pramaan during the period 01-November-2024 to 30-November-2024 to ensure non-stoppage of monthly pension from December.
4. Submission can be done via Face Authentication App on mobile phone without visiting bank branch.`,
  },
];

export const SAMPLE_SCAMS = [
  {
    id: 'electricity-scam',
    title: 'Fake Electricity Cut-off SMS',
    category: 'Utility Threat Scam',
    sampleText: `Dear consumer, your electricity power will be disconnected tonight at 9.30 PM from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer Mr. R.K. Verma at 9811452910. Thanks.`,
    verdict: 'DANGER_SCAM' as const,
    riskScore: 99,
  },
  {
    id: 'sbi-kyc-scam',
    title: 'SBI YONO / PAN Expired Phishing',
    category: 'Banking Phishing',
    sampleText: `Dear SBI User, your YONO account and debit card has been blocked today because your PAN Card is not linked. Please click on http://sbi-pan-kyc-update.online/login to update your Aadhaar within 24 hours to avoid permanent account closure.`,
    verdict: 'DANGER_SCAM' as const,
    riskScore: 98,
  },
  {
    id: 'digital-arrest-scam',
    title: 'Fake Police / Digital Arrest Extortion',
    category: 'Digital Arrest Threat',
    sampleText: `This is Inspector Sharma from Mumbai Crime Branch and Narcotics Control Bureau. A parcel sent in your name to Cambodia has been seized with 5 fake passports and 140 grams of MDMA drugs. You are placed under Digital Arrest. You must stay on WhatsApp video call in a locked room and transfer verification deposit to RBI safety locker account.`,
    verdict: 'DANGER_SCAM' as const,
    riskScore: 100,
  },
  {
    id: 'kbc-lottery-scam',
    title: 'KBC ₹25 Lakh WhatsApp Lottery',
    category: 'Fake Lottery',
    sampleText: `Congratulations! Your WhatsApp mobile number has won ₹25,00,000 in Kaun Banega Crorepati lucky draw 2024. To claim your prize money in your bank account, call KBC Manager Rana Pratap Singh at +92-301-4458921 and pay ₹12,500 government tax certificate fees.`,
    verdict: 'DANGER_SCAM' as const,
    riskScore: 99,
  },
];

export const DEFAULT_MEDICINES: MedicineItem[] = [
  {
    id: 'med-1',
    name: 'Telmisartan (Telma 40)',
    dosage: '40 mg (1 Tablet)',
    timing: 'morning',
    timeLabel: 'Morning (8:00 AM)',
    withFood: 'after_food',
    purpose: 'Keeps Blood Pressure safe and protects heart',
    takenToday: true,
    takenAt: '08:15 AM',
    colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pillIconType: 'tablet',
    remainingPills: 22,
    doctorNotes: 'Take after a light breakfast with plain water. Do not skip even if BP feels normal.',
  },
  {
    id: 'med-2',
    name: 'Pantoprazole (Pan 40)',
    dosage: '40 mg (1 Capsule)',
    timing: 'morning',
    timeLabel: 'Early Morning (7:00 AM)',
    withFood: 'before_food',
    purpose: 'Prevents acidity and protects stomach lining',
    takenToday: true,
    takenAt: '07:05 AM',
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    pillIconType: 'capsule',
    remainingPills: 18,
    doctorNotes: 'Take 30 minutes before your morning tea or breakfast.',
  },
  {
    id: 'med-3',
    name: 'Calcium + Vitamin D3 (Shelcal 500)',
    dosage: '500 mg (1 Tablet)',
    timing: 'afternoon',
    timeLabel: 'Afternoon (1:30 PM)',
    withFood: 'after_food',
    purpose: 'Strengthens bones and knee joints',
    takenToday: false,
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    pillIconType: 'tablet',
    remainingPills: 14,
    doctorNotes: 'Take after lunch with lukewarm water.',
  },
  {
    id: 'med-4',
    name: 'Metformin (Glycomet 500 SR)',
    dosage: '500 mg (1 Tablet)',
    timing: 'night',
    timeLabel: 'Night (8:30 PM)',
    withFood: 'after_food',
    purpose: 'Maintains healthy blood sugar levels',
    takenToday: false,
    colorBadge: 'bg-purple-100 text-purple-800 border-purple-300',
    pillIconType: 'tablet',
    remainingPills: 26,
    doctorNotes: 'Take immediately after dinner.',
  },
  {
    id: 'med-5',
    name: 'Atorvastatin (Atorva 10)',
    dosage: '10 mg (1 Tablet)',
    timing: 'night',
    timeLabel: 'Bedtime (10:00 PM)',
    withFood: 'anytime',
    purpose: 'Prevents cholesterol build-up in arteries',
    takenToday: false,
    colorBadge: 'bg-rose-100 text-rose-800 border-rose-300',
    pillIconType: 'tablet',
    remainingPills: 20,
    doctorNotes: 'Take with half a glass of water right before sleeping.',
  },
];

export const SENIOR_SCHEMES: SeniorScheme[] = [
  {
    id: 'ayushman-70-plus',
    name: 'Ayushman Bharat PM-JAY (Senior 70+ Vaya Vandana)',
    hindiName: 'आयुष्मान भारत वरिष्ठ नागरिक वय वंदना योजना',
    category: 'health',
    minAge: 70,
    shortDesc: 'Free cashless medical treatment up to ₹5 Lakh every year for all Indian citizens aged 70 and above, regardless of income.',
    benefits: [
      '₹5,00,000 annual health cover for hospital treatment',
      'No income ceiling or wealth criteria - available to all seniors 70+',
      'Covers pre-existing conditions from Day 1',
      'Accepted in over 29,000 empanelled private and government hospitals nationwide',
      'Separate card (Ayushman Vaya Vandana Card) linked to Aadhaar'
    ],
    eligibility: [
      'Must be an Indian citizen aged 70 years or older (based on Aadhaar DOB)',
      'No income bar (both rich and poor elders are eligible)'
    ],
    documentsNeeded: [
      'Aadhaar Card with correct date of birth',
      'Active mobile number linked to Aadhaar for OTP',
      'Recent passport photo'
    ],
    howToApply: 'Download Ayushman App on mobile or visit beneficiary.nha.gov.in. Complete e-KYC using Aadhaar OTP or Face Authentication.',
    officialPortalUrl: 'https://beneficiary.nha.gov.in',
    helpline: '14555 (Toll Free National Health Authority)',
  },
  {
    id: 'scss',
    name: 'Senior Citizen Savings Scheme (SCSS)',
    hindiName: 'वरिष्ठ नागरिक बचत योजना',
    category: 'savings',
    minAge: 60,
    shortDesc: 'Highest government-guaranteed interest rate (8.2% p.a.) with quarterly interest payout directly to your savings bank account.',
    benefits: [
      'Attractive 8.2% annual interest backed by Govt of India',
      'Regular quarterly pension-like payout in Jan, April, July, Oct',
      'Investment limit up to ₹30,00,000 (30 Lakhs)',
      '5-year tenure with option to extend for another 3 years',
      'Tax deduction under Section 80C up to ₹1.5 Lakh'
    ],
    eligibility: [
      'Any individual aged 60 years or above',
      'Retired civilian employees aged 55-60 who invest within 1 month of retirement',
      'Retired defense personnel aged 50+ without age restriction'
    ],
    documentsNeeded: [
      'Aadhaar Card & PAN Card',
      'Proof of Age (Passport, Voter ID, Birth Certificate)',
      '2 Passport size photographs',
      'Cheque for initial deposit'
    ],
    howToApply: 'Visit any Post Office or authorized bank (SBI, PNB, Canara, Bank of Baroda, ICICI, HDFC) and fill Form-A.',
    helpline: '1800-266-6868 (India Post)',
  },
  {
    id: 'jeevan-pramaan',
    name: 'Jeevan Pramaan (Digital Life Certificate)',
    hindiName: 'जीवन प्रमाण (डिजिटल जीवन प्रमाण पत्र)',
    category: 'pension',
    minAge: 60,
    shortDesc: 'Submit your mandatory annual life certificate for pension from home using just a smartphone camera with Face Authentication.',
    benefits: [
      'No need to stand in long bank or treasury queues in cold winter months',
      'Instant digital acknowledgment delivered by SMS',
      'Directly sent to your Pension Disbursing Agency (Bank/Post Office/DPDO)',
      'Free of cost when done via mobile phone'
    ],
    eligibility: [
      'All Central, State, Railway, Defense, and PSU pensioners with valid PPO'
    ],
    documentsNeeded: [
      'Aadhaar Number',
      'PPO (Pension Payment Order) Number',
      'Pension Bank Account Number and Bank Name',
      'Mobile Phone with front camera'
    ],
    howToApply: 'Install "AadhaarFaceRD" and "Jeevan Pramaan" app from Google Play Store. Enter Aadhaar and PPO, then look into the front camera and blink for face match.',
    officialPortalUrl: 'https://jeevanpramaan.gov.in',
    helpline: '1800-111-555 (Jeevan Pramaan Helpdesk)',
  },
  {
    id: 'tax-80ttb',
    name: 'Section 80TTB Tax Relief on Bank Interest',
    hindiName: 'धारा 80TTB - ₹50,000 तक ब्याज पर टैक्स छूट',
    category: 'savings',
    minAge: 60,
    shortDesc: 'Senior citizens get full tax deduction up to ₹50,000 on interest earned from savings accounts and Fixed Deposits (FDs).',
    benefits: [
      'No tax on bank and post office interest income up to ₹50,000 per year',
      'No TDS deducted by bank if interest is under ₹50,000 (submit Form 15H)',
      'Applicable to both Savings Accounts and Fixed Deposits'
    ],
    eligibility: [
      'Resident senior citizen aged 60 years or above during the financial year'
    ],
    documentsNeeded: [
      'PAN Card',
      'Form 15H submitted to your bank branch or NetBanking annually in April'
    ],
    howToApply: 'Submit Form 15H at the beginning of each financial year to your bank so they do not deduct TDS.',
    helpline: '1800-180-1961 (Income Tax Department)',
  },
  {
    id: 'railway-lower-berth',
    name: 'Indian Railways Lower Berth & Senior Facilities',
    hindiName: 'भारतीय रेलवे वरिष्ठ नागरिक लोअर बर्थ सुविधा',
    category: 'travel',
    minAge: 60,
    shortDesc: 'Automatic allocation of comfortable lower berths for senior men (60+) and senior women (45+ or 58+), plus battery car wheelchair access at stations.',
    benefits: [
      'Priority automatic lower berth booking without extra fee',
      'Dedicated wheelchair and battery-operated car assistance at all major stations (Dial 139)',
      'Special reservation counters for senior citizens at railway booking offices',
      'Separate helpdesk for senior passengers'
    ],
    eligibility: [
      'Men aged 60 years and above',
      'Women aged 45 years and above (when travelling alone) or 58+'
    ],
    documentsNeeded: [
      'Original Govt Photo ID showing Date of Birth during travel (Aadhaar, Senior ID, Voter Card)'
    ],
    howToApply: 'When booking on IRCTC app, select the "Lower Berth / Senior Citizen" reservation choice option.',
    officialPortalUrl: 'https://irctc.co.in',
    helpline: '139 (Rail Madad Helpline)',
  },
];

export const DIGITAL_GUIDES: DigitalGuide[] = [
  {
    id: 'guide-phonepe-bill',
    title: 'How to Pay Electricity Bill on PhonePe / Google Pay',
    hindiTitle: 'फ़ोनपे या गूगल पे से बिजली का बिल कैसे भरें',
    category: 'payment',
    icon: 'Zap',
    estimatedMinutes: 3,
    difficulty: 'Easy',
    summary: 'Never stand in the hot sun or line at the electricity office again. Pay your bill safely in 4 taps.',
    steps: [
      {
        stepNumber: 1,
        heading: 'Open PhonePe or Google Pay',
        instruction: 'Unlock your phone and tap on the purple PhonePe icon or the multi-color Google Pay icon.',
        proTip: 'Make sure your internet or Wi-Fi is switched ON.',
      },
      {
        stepNumber: 2,
        heading: 'Look for "Electricity" Icon',
        instruction: 'Scroll down slightly to the "Recharge & Pay Bills" section. Look for the yellow light bulb icon labeled "Electricity" and tap it.',
      },
      {
        stepNumber: 3,
        heading: 'Select Your Electricity Board',
        instruction: 'Type your provider name (e.g., BESCOM, BSES, Mahavitaran, Tata Power) and choose it from the list.',
      },
      {
        stepNumber: 4,
        heading: 'Enter Your Consumer Number (RR No / CA No)',
        instruction: 'Find the Consumer ID or Account Number printed on your old paper bill. Type it in and tap "Confirm".',
        proTip: 'The app will automatically show your exact name and bill amount. Check that your name matches!',
      },
      {
        stepNumber: 5,
        heading: 'Enter Your UPI PIN Safely',
        instruction: 'Tap "Pay Bill" and enter your private 4 or 6-digit UPI PIN.',
        warning: 'NEVER show your UPI PIN to anyone or write it on the back of your phone.',
      },
    ],
  },
  {
    id: 'guide-whatsapp-call',
    title: 'How to Make a Video Call to Family on WhatsApp',
    hindiTitle: 'व्हाट्सएप पर बच्चों और पोते-पोतियों को वीडियो कॉल कैसे करें',
    category: 'communication',
    icon: 'Video',
    estimatedMinutes: 2,
    difficulty: 'Very Easy',
    summary: 'See the smiling faces of your children and grandchildren across town or abroad in crystal clear video.',
    steps: [
      {
        stepNumber: 1,
        heading: 'Open WhatsApp',
        instruction: 'Tap the green WhatsApp icon with the speech bubble and telephone receiver.',
      },
      {
        stepNumber: 2,
        heading: 'Find Your Family Member',
        instruction: 'Tap on their chat name (e.g. "Beta", "Gudiya", "Rohan") or tap the magnifying glass at the top right to search their name.',
      },
      {
        stepNumber: 3,
        heading: 'Look at the Top Right Corner',
        instruction: 'At the very top right of their chat window, you will see a small camera icon next to a telephone icon.',
      },
      {
        stepNumber: 4,
        heading: 'Tap the Camera Icon',
        instruction: 'Tap the small camera icon. The phone will start ringing with video.',
        proTip: 'Hold the phone at eye level in good room lighting so your family can see your warm smile clearly.',
      },
    ],
  },
  {
    id: 'guide-jeevan-pramaan',
    title: 'How to Submit Digital Life Certificate (Face RD)',
    hindiTitle: 'घर बैठे मोबाइल से डिजिटल जीवन प्रमाण पत्र कैसे जमा करें',
    category: 'government',
    icon: 'Award',
    estimatedMinutes: 5,
    difficulty: 'Moderate',
    summary: 'Submit your annual pension life certificate from the comfort of your sofa using your phone camera.',
    steps: [
      {
        stepNumber: 1,
        heading: 'Install the Two Official Govt Apps',
        instruction: 'From Google Play Store, install: 1) "AadhaarFaceRD" (Govt of India) and 2) "Jeevan Pramaan" app.',
        proTip: 'Ask your child or a trusted neighbor to help install these two apps once.',
      },
      {
        stepNumber: 2,
        heading: 'Enter Pensioner Details',
        instruction: 'Open Jeevan Pramaan. Enter your Aadhaar Number, Pension Account Number, and PPO Number carefully.',
      },
      {
        stepNumber: 3,
        heading: 'Face Scan Verification',
        instruction: 'Sit in a well-lit room facing a window. Hold the phone still in front of your face. Look into the camera lens and gently blink your eyes when the circle turns green.',
      },
      {
        stepNumber: 4,
        heading: 'Save the Pramaan ID SMS',
        instruction: 'Once face match succeeds, you will receive an instant SMS with your Pramaan ID. Your bank will automatically receive it!',
      },
    ],
  },
  {
    id: 'guide-uber-auto',
    title: 'How to Book an Auto Safely on Uber / Ola',
    hindiTitle: 'उबर या ओला से सुरक्षित ऑटो कैसे बुक करें',
    category: 'travel',
    icon: 'Navigation',
    estimatedMinutes: 3,
    difficulty: 'Easy',
    summary: 'No need to haggle or wait on the road. Get an auto right at your doorstep with meter pricing.',
    steps: [
      {
        stepNumber: 1,
        heading: 'Open Uber or Ola App',
        instruction: 'Tap the Uber (black icon) or Ola (green/black icon) on your home screen.',
      },
      {
        stepNumber: 2,
        heading: 'Tap "Where to?" (Destination)',
        instruction: 'Type where you want to go (e.g. "Apollo Hospital", "Central Park", "City Railway Station").',
      },
      {
        stepNumber: 3,
        heading: 'Choose "Auto"',
        instruction: 'From the list of vehicles, tap on the green-and-yellow Auto icon. It will clearly display the exact fixed fare.',
      },
      {
        stepNumber: 4,
        heading: 'Tap "Confirm Auto"',
        instruction: 'The app will find an auto nearby. When booked, note down the 4-digit PIN number shown on your screen.',
      },
      {
        stepNumber: 5,
        heading: 'Board Safely and Share PIN',
        instruction: 'When the auto arrives, check the vehicle number plate. Tell the driver your 4-digit PIN so the ride begins.',
        warning: 'Never pay cash if you already paid via UPI inside the app. Keep your bag safe between your feet.',
      },
    ],
  },
];

export const DAILY_SATSANG_MESSAGES = [
  {
    quote: "जो बीत गया उसे सोचा नहीं करते, जो मिल गया उसे खोया नहीं करते। सफलता भी उन्हें ही मिलती है, जो वक्त और हालात पर रोया नहीं करते।",
    meaning: "Focus on the blessings of today. Each morning brings fresh grace, calm, and quiet joy.",
    source: "Ancient Wisdom",
    routineTip: "Drink a warm glass of water with lemon or tulsi, sit in gentle morning sunlight for 15 minutes, and take 5 deep breaths.",
  },
  {
    quote: "मन के हारे हार है, मन के जीते जीत। कहे कबीर हरि पाइए, मन ही की परतीत।",
    meaning: "True strength comes from a peaceful and steady mind. Sant Kabir reminds us to trust our inner calm.",
    source: "Sant Kabir",
    routineTip: "Do light ankle rotations and gentle shoulder shrugs while sitting comfortably in your chair.",
  },
  {
    quote: "वृक्ष कबहुँ नहिं फल भखै, नदी न संचै नीर। परमारथ के कारने, साधुन धरा सरीर॥",
    meaning: "Just as trees never eat their own fruit and rivers do not drink their own water, the wisdom of elders enriches everyone around them.",
    source: "Sant Rahim",
    routineTip: "Share a loving story or word of blessing with someone younger in your family or building today.",
  },
];

export const EMERGENCY_NUMBERS = [
  {
    name: 'National Emergency Helpline',
    number: '112',
    description: 'Police, Fire, and Immediate Crisis response across all states in India',
    badgeColor: 'bg-red-600 text-white',
    icon: 'ShieldAlert',
  },
  {
    name: 'Elderline - Senior Citizen Helpline',
    number: '14567',
    description: 'Ministry of Social Justice & Empowerment - Elder emotional support, abuse rescue, legal guidance',
    badgeColor: 'bg-amber-600 text-white',
    icon: 'HeartHandshake',
  },
  {
    name: 'National Cyber Crime Helpline',
    number: '1930',
    description: 'Immediate financial fraud reporting to freeze stolen funds in bank accounts',
    badgeColor: 'bg-blue-600 text-white',
    icon: 'AlertTriangle',
  },
  {
    name: 'Ambulance Emergency',
    number: '108',
    description: 'Government 24x7 Emergency Medical and Ambulance response',
    badgeColor: 'bg-emerald-600 text-white',
    icon: 'Activity',
  },
];
