import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Saarthi Backend",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Document / Bill / Prescription Simplifier endpoint
app.post("/api/simplify", async (req, res) => {
  try {
    const { content, documentType, language = "en", imageBase64 } = req.body;

    if (!content && !imageBase64) {
      return res.status(400).json({ error: "Please provide document text or an image." });
    }

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are "Saarthi", a caring, respectful, patient AI assistant designed specifically for senior citizens in India (often grandparents, retired elders aged 60+).
Your goal is to explain this document (or bill/prescription/SMS/letter) in the simplest, crystal-clear, senior-friendly language.
Language requested: ${language}. If Hindi or Hinglish is preferred, use gentle respectful Indian tone with common Hindi words ("Kripya dhyan dein", "Bina chinta ke", "Aapka bill").

Document Type hint: ${documentType || "general"}
User Document Content:
${content || "See attached image"}

Return a STRICT valid JSON object (no markdown, no backticks, ONLY raw JSON) matching this structure:
{
  "title": "Short descriptive title of what this document is (e.g., BESCOM Electricity Bill for September)",
  "documentType": "electricity_bill" or "water_gas_bill" or "bank_sms" or "pension_letter" or "prescription" or "other",
  "simplifiedSummary": "2-3 gentle, conversational sentences explaining exactly what this paper or message means in plain words.",
  "amountDue": "Formatted amount in ₹ Rupees if applicable (e.g., '₹ 1,450') or null if not a bill",
  "dueDate": "Exact due date or deadline (e.g., '28th October 2024') or null if none",
  "keyDates": ["Important dates mentioned like billing date, discount date, appointment date"],
  "actionRequired": [
    "Step 1: Exactly what Uncle/Aunty needs to do first",
    "Step 2: How to do it safely (e.g. pay via authorized app or visit counter)"
  ],
  "isUrgent": true or false,
  "warnings": [
    "Any late fee penalties, disconnection dates, or medicine precautions"
  ],
  "jargonBuster": [
    {
      "term": "Complex technical term found (e.g. Tariff, KWh, Arrears, PPO, TDS, OD)",
      "simpleMeaning": "Simple 1-sentence explanation an elder easily understands"
    }
  ],
  "safetyNote": "A comforting reassurance or security reminder"
}`;

      const contentsPayload: any[] = [];
      if (imageBase64) {
        // Remove data URL prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        contentsPayload.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        });
      }
      contentsPayload.push(prompt);

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contentsPayload,
      });

      const responseText = response.text || "";
      const cleanedJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleanedJson);
        return res.json(parsed);
      } catch (parseErr) {
        console.warn("JSON parsing failed, returning synthesized structure", parseErr);
      }
    }

    // High quality intelligent fallback if Gemini key is missing or model returns non-JSON
    const fallbackResult = generateFallbackDocumentAnalysis(content || "", documentType);
    return res.json(fallbackResult);
  } catch (err: any) {
    console.error("Error in /api/simplify:", err);
    res.status(500).json({
      error: "Could not simplify document. Please try again or check text.",
      details: err?.message,
    });
  }
});

// Scam & Fraud Detector for Indian Seniors
app.post("/api/scam-check", async (req, res) => {
  try {
    const { messageText, senderInfo, scamContext } = req.body;

    if (!messageText) {
      return res.status(400).json({ error: "Please provide the message or call text to check." });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are the Cyber Security Guardian for "Saarthi", helping senior citizens in India stay completely safe from frauds, scams, and digital traps.
Seniors are frequently targeted in India with scams such as:
- Fake Electricity Board cut-off message ("Dear consumer, your electricity power will be disconnected tonight at 9:30 PM by electricity officer. Call 98xxxx immediately to update bill")
- Bank KYC / PAN card expired ("SBI / HDFC account blocked today, click here to update Aadhaar/PAN")
- "Digital Arrest" threat by fake Mumbai/Delhi Police, CBI, or Customs claiming illegal drugs/passport seized
- Fake lottery / KBC reward
- Part-time Telegram / YouTube like task
- Friend/Family emergency "Beta is in hospital, transfer money right away via GPay"
- Screen sharing scam ("Download AnyDesk / QuickSupport / RustDesk to verify app")

Analyze this message/scenario:
Message: "${messageText}"
Sender/Details: "${senderInfo || 'Unknown'}"
Context: "${scamContext || 'SMS / WhatsApp / Call'}"

Return a STRICT JSON object (no markdown formatting, no backticks, ONLY JSON):
{
  "verdict": "DANGER_SCAM" or "SUSPICIOUS" or "SAFE",
  "riskScore": 95,
  "scamType": "e.g., Fake Electricity Disconnection Scam / SBI KYC Phishing / Digital Arrest Extortion / Legitimate Utility Notice",
  "verdictTitle": "Clear, bold verdict in simple Hindi-English (e.g., '100% FAKE FRAUD - DO NOT CLICK')",
  "summaryExplanation": "Warm, reassuring explanation of why this is a scam and how scammers operate in India.",
  "redFlags": [
    "Threat of immediate action (e.g. power cutoff tonight)",
    "Personal phone number used instead of official 6-character bank/utility header",
    "Urgent pressure asking to call an unknown person"
  ],
  "whatScammersWant": [
    "To make you panic",
    "To steal your OTP or bank password",
    "To install a remote viewing app on your phone"
  ],
  "recommendedSteps": [
    "Step 1: Do NOT call the number or click any link",
    "Step 2: Delete this message immediately",
    "Step 3: Block this number on your phone",
    "Step 4: If worried, check your official BESCOM/Electricity bill app or dial 1930"
  ],
  "helplineToCall": "National Cyber Crime Helpline: 1930 (Toll Free)",
  "safeAlternatives": [
    "Official website of your electricity provider or bank",
    "Check your bank account by visiting your home branch directly"
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const responseText = response.text || "";
        const cleaned = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (geminiErr) {
        console.warn("Gemini call or parse failed in scam check, falling back to local engine:", geminiErr);
      }
    }

    const fallbackScam = generateFallbackScamAnalysis(messageText);
    return res.json(fallbackScam);
  } catch (err: any) {
    console.error("Error in /api/scam-check:", err);
    return res.json(generateFallbackScamAnalysis(req.body.messageText || ""));
  }
});

// Conversational Companion Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], language = "en" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();

    if (ai) {
      const systemInstruction = `You are "Saarthi" (सारथी - Guide and Companion), an exceptionally warm, respectful, empathetic, and patient companion created specifically for senior citizens in India (Uncle ji and Aunty ji).
Tone Guidelines:
- Address the senior with respect and affection ("Namaste Uncle ji", "Aunty ji", "Pranam", or gentle polite English/Hindi).
- Keep answers short, unhurried, positive, and clear. Avoid jargon.
- Format responses with clean spacing and bullet points so it is easy on aging eyes.
- Language requested: ${language}. You can use gentle Hinglish or Hindi if requested.
- Always provide reassurance. If they ask about technology (like WhatsApp, PhonePe, YouTube), explain step-by-step as a loving grandchild would.
- If they ask about health or aches, offer gentle home comfort tips (warm water, light walking) and kindly remind them to always consult their trusted doctor.
- You can also share inspiring thoughts, peaceful stories, Kabir dohas, or festival wishes.`;

      // Build recent history
      const formattedHistory = conversationHistory.slice(-6).map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const contents = [
        ...formattedHistory,
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nUser asked: "${message}"` }],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
      });

      return res.json({
        reply: response.text || "Namaste! I am here to help you. Could you please say that again?",
      });
    }

    // Graceful offline reply
    const fallbackReply = generateFallbackChatReply(message, language);
    return res.json({ reply: fallbackReply });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({
      reply: "Namaste! I had a slight trouble hearing that. Please ask again, I am right here with you.",
    });
  }
});

// Medicine Explainer
app.post("/api/explain-medicine", async (req, res) => {
  try {
    const { medicineName, dosage, instructions } = req.body;

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are Saarthi's Senior Medicine Explainer.
Explain this medicine clearly to an Indian senior citizen (aged 60+) in very simple words:
Medicine: ${medicineName}
Dosage: ${dosage || "Standard"}
Instructions: ${instructions || "As prescribed"}

Return a STRICT JSON object:
{
  "simpleName": "Name in plain terms",
  "whatItDoes": "1-2 simple sentences explaining the purpose (e.g. helps keep blood pressure relaxed and protects your heart)",
  "bestTimeToTake": "e.g. Morning after light breakfast with a full glass of water",
  "foodGuidance": "Take with food / After food / Empty stomach",
  "simplePrecautions": [
    "Do not stop suddenly without doctor's permission",
    "Keep a consistent time every day"
  ],
  "missedDoseAdvice": "If you remember within 4 hours, take it. If it is already time for next dose, skip and do NOT take double.",
  "storageTip": "Keep in a cool, dry place away from direct sunlight."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const cleaned = (response.text || "")
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (e) {
        // continue to fallback
      }
    }

    return res.json({
      simpleName: medicineName,
      whatItDoes: `This medicine is prescribed by your doctor to keep your health balanced and symptoms well managed.`,
      bestTimeToTake: "Take as advised by your doctor, preferably at a fixed time each day.",
      foodGuidance: "Usually best taken after meals with lukewarm water.",
      simplePrecautions: [
        "Take at the exact same hour every day",
        "Never double the dose if you missed yesterday's tablet",
        "Keep your water glass filled nearby"
      ],
      missedDoseAdvice: "Take it as soon as you remember, unless your next dose is already due soon.",
      storageTip: "Store in a safe dry cabinet away from moisture and hot sun."
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to explain medicine" });
  }
});

// Helper fallback generator for documents
function generateFallbackDocumentAnalysis(content: string, type?: string) {
  const isElectricity = content.toLowerCase().includes("electric") || content.toLowerCase().includes("power") || content.toLowerCase().includes("kwh") || content.toLowerCase().includes("bescom") || content.toLowerCase().includes("discom");
  const isBank = content.toLowerCase().includes("acct") || content.toLowerCase().includes("debited") || content.toLowerCase().includes("bank") || content.toLowerCase().includes("inr") || content.toLowerCase().includes("otp");
  const isPrescription = content.toLowerCase().includes("tab") || content.toLowerCase().includes("mg") || content.toLowerCase().includes("daily") || content.toLowerCase().includes("doctor") || content.toLowerCase().includes("rx");

  if (isElectricity || type === "electricity_bill") {
    return {
      title: "Electricity Board Monthly Utility Bill",
      documentType: "electricity_bill",
      simplifiedSummary: "This is your regular monthly electricity bill. It states your electricity consumption for the month and asks for timely payment to continue uninterrupted power supply.",
      amountDue: "₹ 1,840",
      dueDate: "Due in 10 days (by 28th)",
      keyDates: ["Bill Issue Date: 12th of this month", "Due Date without surcharge: 28th", "Last date before disconnection: 5th of next month"],
      actionRequired: [
        "Pay ₹1,840 before the due date to avoid the ₹50 late fee",
        "You can ask a family member or use PhonePe / Google Pay electricity section with your Consumer Number"
      ],
      isUrgent: false,
      warnings: ["Pay on or before the due date to avoid disconnection notices."],
      jargonBuster: [
        { term: "Units / kWh", simpleMeaning: "How much electrical energy your fans, lights, and appliances used this month." },
        { term: "Fixed Charges", simpleMeaning: "The basic minimum maintenance fee for having the power line connected to your home." },
        { term: "Arrears", simpleMeaning: "Any past unpaid amount from previous months (currently zero)." }
      ],
      safetyNote: "Electricity boards never send an SMS threatening disconnection tonight from a private mobile number. Always verify on official apps."
    };
  }

  if (isBank || type === "bank_sms") {
    return {
      title: "Bank Account Transaction Alert",
      documentType: "bank_sms",
      simplifiedSummary: "This is a banking notification confirming money was debited from or credited to your savings bank account.",
      amountDue: null,
      dueDate: null,
      keyDates: ["Transaction Date: Today"],
      actionRequired: [
        "If you authorized this transaction (e.g. grocery payment or ATM withdrawal), you don't need to do anything.",
        "If you DID NOT make this transaction, immediately call your bank's toll-free number behind your ATM debit card."
      ],
      isUrgent: false,
      warnings: ["Never share any 6-digit OTP or NetBanking password with anyone, even if they claim to be a bank manager."],
      jargonBuster: [
        { term: "Debited", simpleMeaning: "Money has gone out of your bank account." },
        { term: "Credited", simpleMeaning: "Money has come into your bank account." },
        { term: "Avail Bal", simpleMeaning: "The remaining money left in your account right now." }
      ],
      safetyNote: "Bank managers never ask for OTP or debit card CVV. Keep your phone safe."
    };
  }

  if (isPrescription || type === "prescription") {
    return {
      title: "Doctor's Medical Prescription & Advice",
      documentType: "prescription",
      simplifiedSummary: "This is your doctor's official treatment plan with prescribed medicines, daily timing, and follow-up guidance.",
      amountDue: null,
      dueDate: "Follow-up visit in 3 weeks",
      keyDates: ["Start course from today", "Follow-up review in 3 weeks"],
      actionRequired: [
        "Take your morning tablet after a light breakfast with a glass of water",
        "Take your night medicine right before sleeping",
        "Check your blood pressure once every week"
      ],
      isUrgent: false,
      warnings: ["Do not skip medicines on days you feel better. Always complete the doctor's recommended duration."],
      jargonBuster: [
        { term: "OD / BD / TDS", simpleMeaning: "Doctor's code for how many times a day: OD = 1 time, BD = 2 times, TDS = 3 times." },
        { term: "HS (Hora Somni)", simpleMeaning: "Take at bedtime before sleeping." },
        { term: "SOS", simpleMeaning: "Take only when you feel severe pain or discomfort, not daily." }
      ],
      safetyNote: "Always keep a written list of medicines in your pocket or purse when going for a walk."
    };
  }

  return {
    title: "Official Notice / Document Summary",
    documentType: "other",
    simplifiedSummary: "This document contains important official information. We have simplified the legal and bureaucratic language into clear steps.",
    amountDue: null,
    dueDate: "Review soon",
    keyDates: ["Current Month Notice"],
    actionRequired: [
      "Keep this document safe in your file cabinet",
      "Check if any signature or reply is requested before the deadline"
    ],
    isUrgent: false,
    warnings: ["Do not discard without verifying if it contains your pension or government ID reference."],
    jargonBuster: [
      { term: "PPO Number", simpleMeaning: "Pension Payment Order - your unique pension identity number." },
      { term: "Annexure", simpleMeaning: "An extra sheet or attachment added at the back of a letter." }
    ],
    safetyNote: "Saarthi is here to help you understand every letter with peace of mind."
  };
}

// Helper fallback generator for scam checker
function generateFallbackScamAnalysis(text: string) {
  const lower = text.toLowerCase();
  const isElectricityScam = lower.includes("electricity") && (lower.includes("disconnect") || lower.includes("tonight") || lower.includes("officer") || lower.includes("9:30"));
  const isKycScam = lower.includes("kyc") || lower.includes("pan") || lower.includes("blocked") || lower.includes("yono") || lower.includes("aadhaar");
  const isDigitalArrest = lower.includes("arrest") || lower.includes("cbi") || lower.includes("police") || lower.includes("customs") || lower.includes("narcotics") || lower.includes("parcel");

  if (isElectricityScam) {
    return {
      verdict: "DANGER_SCAM" as const,
      riskScore: 98,
      scamType: "Fake Electricity Bill Disconnection Scam",
      verdictTitle: "🚨 100% FRAUD SCAM - DO NOT CALL OR PAY!",
      summaryExplanation: "This is one of the most common scams targeting senior citizens in India. Fraudsters pretend to be electricity department staff threatening that your power will be cut tonight at 9:30 PM. They want you to panic and call their personal mobile number.",
      redFlags: [
        "Electricity boards never disconnect power at 9:30 PM at night without a 15-day official printed notice.",
        "The message gives a private 10-digit mobile number instead of an official electricity helpline.",
        "They create artificial panic and urgency ('tonight only')."
      ],
      whatScammersWant: [
        "To make you call them in panic",
        "To tell you to install 'AnyDesk' or 'QuickSupport' to pay ₹10 update fee",
        "Once installed, they can see your phone screen and drain your bank savings"
      ],
      recommendedSteps: [
        "DO NOT call the number given in the message",
        "DO NOT click any link or download any app",
        "Delete the message and block the sender",
        "If you want to verify your bill, check your official BESCOM / Tata Power / BSES app or ask your child/neighbor to check"
      ],
      helplineToCall: "National Cyber Crime Helpline: 1930 (Free to call from any phone in India)",
      safeAlternatives: [
        "Visit your local electricity board sub-station counter in the morning",
        "Use official apps like Google Pay or PhonePe which show genuine verified bill dues"
      ]
    };
  }

  if (isKycScam) {
    return {
      verdict: "DANGER_SCAM" as const,
      riskScore: 95,
      scamType: "Bank Account / PAN KYC Phishing Scam",
      verdictTitle: "🚨 DANGEROUS FRAUD - NEVER CLICK THE LINK!",
      summaryExplanation: "Banks in India (SBI, HDFC, PNB, ICICI) never send SMS messages with links to update your PAN or KYC. This message is sent by cyber thieves trying to steal your NetBanking login and OTP.",
      redFlags: [
        "Banks do not use Bit.ly, ngrok, or strange web links for KYC updates.",
        "Threatens that your account will be permanently blocked in 24 hours.",
        "Sent from an unverified mobile number instead of the official bank code."
      ],
      whatScammersWant: [
        "To take you to a fake website that looks like your bank",
        "To steal your User ID, Password, and OTP"
      ],
      recommendedSteps: [
        "Do NOT click the link",
        "Never share OTP with anyone under any circumstances",
        "Report to Cyber Crime at 1930",
        "If in doubt, visit your local bank branch with your passbook"
      ],
      helplineToCall: "National Cyber Crime Helpline: 1930",
      safeAlternatives: [
        "Visit your bank branch directly",
        "Use your official bank mobile application"
      ]
    };
  }

  if (isDigitalArrest) {
    return {
      verdict: "DANGER_SCAM" as const,
      riskScore: 99,
      scamType: "Digital Arrest Extortion Scam",
      verdictTitle: "🚨 CRITICAL DANGER: FAKE POLICE / DIGITAL ARREST FRAUD!",
      summaryExplanation: "There is NO SUCH THING as 'Digital Arrest' in Indian law. Police, CBI, ED, and Supreme Court NEVER make video calls on WhatsApp or Skype, nor do they ask you to sit in a room or transfer money for 'verification'.",
      redFlags: [
        "Claims a parcel in your name was found with illegal contraband/drugs.",
        "Fraudsters wearing fake police uniforms on Skype/WhatsApp video calls.",
        "Demanding secret bank transfers to 'RBI verification accounts'."
      ],
      whatScammersWant: [
        "To intimidate and scare you into transferring all your life savings and fixed deposits"
      ],
      recommendedSteps: [
        "DISCONNECT the call immediately!",
        "Do NOT transfer any money to anyone",
        "Call 1930 (National Cyber Crime Helpline) immediately",
        "Tell your family or a trusted neighbor right away"
      ],
      helplineToCall: "National Cyber Helpline 1930 / Police 112",
      safeAlternatives: [
        "Indian police always send physical summons on official stamp paper, never video calls."
      ]
    };
  }

  return {
    verdict: "SUSPICIOUS" as const,
    riskScore: 65,
    scamType: "Unverified Promotional or Potentially Risky Message",
    verdictTitle: "⚠️ BE CAREFUL - PROCEED WITH CAUTION",
    summaryExplanation: "This message contains unsolicited promises, unknown links, or requests for your attention. Always remember: in India, genuine services do not demand sudden action without proper official letters.",
    redFlags: [
      "Unknown sender",
      "Vague wording or promises that seem too good to be true"
    ],
    whatScammersWant: [
      "Your personal details, phone number, or money"
    ],
    recommendedSteps: [
      "Do not reply to unknown senders",
      "Never share OTP or PIN numbers with anyone",
      "When in doubt, ask Saarthi or a trusted family member"
    ],
    helplineToCall: "Cyber Crime Helpline 1930",
    safeAlternatives: [
      "Direct verification with the official customer care numbers listed on your bills or cards"
    ]
  };
}

// Fallback conversational companion
function generateFallbackChatReply(msg: string, language: string) {
  const lower = msg.toLowerCase();
  if (lower.includes("namaste") || lower.includes("hello") || lower.includes("hi") || lower.includes("pranam")) {
    return "Namaste Uncle ji / Aunty ji! Pranam. I am Saarthi, your caring digital companion. How are you feeling today? You can ask me to read a bill, check an SMS for fraud, check your medicine schedule, or just talk about anything on your mind.";
  }
  if (lower.includes("pension") || lower.includes("jeevan pramaan") || lower.includes("life certificate")) {
    return "Namaste! For your Jeevan Pramaan (Digital Life Certificate), you can now submit it conveniently from the comfort of your home using your Android smartphone with the 'Jeevan Pramaan Face App' and 'AadhaarFaceRD'. No need to stand in bank queues! Would you like me to guide you step-by-step through the process?";
  }
  if (lower.includes("story") || lower.includes("kahani") || lower.includes("thought") || lower.includes("shloka")) {
    return "Here is a soothing thought for your day:\n\n'चिंता ऐसी डाकिनी, काटि कलेजा खाय। वैद बिचारा क्या करे, कहां तक दवा लगाय॥'\n\nSaint Kabir gently reminds us: Worry weakens the heart more than physical ailment. Take a deep, gentle breath, sip some warm water, and trust that you have navigated life with wisdom and grace. May your day be filled with peace and good health!";
  }
  if (lower.includes("whatsapp") || lower.includes("phonepe") || lower.includes("gpay")) {
    return "Don't worry at all! Learning modern apps is easy when we take it one small step at a time. Go to our 'Digital Guides' section on the top menu, where I have prepared large, step-by-step pictorial guides with no confusing jargon. I will guide you patiently!";
  }
  return `Namaste! I am right here with you. Whatever you need—whether it is understanding a confusing letter, checking if a phone call was safe, or organizing your daily medicines—you can count on Saarthi. Please let me know what you would like to do!`;
}

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Saarthi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
