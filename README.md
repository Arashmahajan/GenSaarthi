# Saarthi (सारथी) • GenAI Daily Companion for Senior Citizens in India

![Saarthi Banner](public/saarthi-banner.svg)

India is home to over 140 million elders who face a rapidly digitizing world filled with complex banking portals, confusing utility bills, urgent online fraud, and isolated daily routines. **Saarthi** (सारथी — *guide and trusted charioteer*) is an accessible, empathetic, and resilient web companion designed specifically for senior citizens. It bridges the digital divide through clear voice and text interactions, simplifies intimidating documents, defends against common Indian scams with zero-hallucination guarantees, tracks daily medicines and bills, and arranges unhurried daily schedules with utmost dignity and care.

---

## 6 Core Features & User-Facing Value

1. **Unified Document & Scam Checker (`#check`)**
   - *Value for Seniors*: Safely scans bills, SMS messages, pension notices, and bank letters. Detects electricity disconnection traps, fake "digital arrest" extortion, KYC panic scams, and remote app takeovers (AnyDesk, TeamViewer).
   - *Senior Trust*: Never invents or assumes amounts, due dates, or arrears. If an amount or date is not in the text, it explicitly states "Not mentioned" rather than guessing.

2. **Respectful Voice & Text Companion Chat (`#ask`)**
   - *Value for Seniors*: A patient, bilingual conversational partner available 24/7. Responds with warm, unhurried Hindi or English speech tailored to senior comprehension.
   - *Explain It Again*: If an explanation is unclear, a single tap simplifies the answer further using everyday analogies.

3. **Medicine Schedule & Refill Tracker (`#reminders`)**
   - *Value for Seniors*: Organizes daily doses across morning, afternoon, evening, and bedtime with clear food instructions (*before food*, *after food*).
   - *Dose Logging & Refill Alerts*: Tracks taken doses with single-tap checkmarks and alerts elders when their pill strips are running low, preventing missed prescriptions.

4. **Calm Day Planner (`#plan`)**
   - *Value for Seniors*: Creates gentle, unhurried daily schedules that naturally blend today's pending medicines, bill deadlines, gentle morning walks, meals, and afternoon rest into a peaceful routine.

5. **Integrated Emergency Help & Family SOS (`#help`)**
   - *Value for Seniors*: Instant, one-tap connection to national emergency services: **Elderline (14567)**, **National Cyber Crime (1930)**, and **Universal Emergency (112)**.
   - *Family SOS & Health Alerts*: Rapid "I'm not feeling well" pre-composed WhatsApp and SMS drafting for verified family contacts with transparent message previews.

6. **Government Senior Schemes & Step-by-Step Digital Guides (`#more`)**
   - *Value for Seniors*: Verified, dated information on Ayushman Bharat 70+ (₹5 Lakh free health cover), Senior Citizen Savings Scheme (SCSS 8.2%), and Jeevan Pramaan digital life certificates, plus illustrated guides for UPI payments and WhatsApp calling.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                      │
│   React 19 + TypeScript + Vite + Tailwind v4 + Lucide      │
│   • AppContext: Single source of truth (localStorage)      │
│   • Hash Routing (#home, #ask, #check, #reminders, #help)   │
│   • SaarthiVoiceService: Speech synthesis & recognition    │
│   • Accessible UI: 48px targets, WCAG AA, 16/18/20px zoom  │
└────────────────────────────┬───────────────────────────────┘
                             │
                      REST / SSE APIs
                             │
┌────────────────────────────▼───────────────────────────────┐
│                    Node.js / Express                       │
│   server.ts & server/ (Security, Helmet, Rate Limiter)     │
│   • POST /api/check    • POST /api/chat & SSE streaming    │
│   • POST /api/medicine • POST /api/plan                    │
└──────────────┬──────────────────────────────┬──────────────┘
               │                              │
    Online (Primary Route)          Offline / API Error
               │                              │
┌──────────────▼─────────────┐ ┌──────────────▼──────────────┐
│       Google Gemini        │ │   Deterministic Fallbacks    │
│   @google/genai TypeScript │ │   • scamScan (word boundary) │
│   gemini-2.5-flash / 3.5   │ │   • documentScan (regexes)   │
│   Strict prompts & JSON    │ │   • chatReply, medicineReply │
│   <user_content> isolation │ │   • planReply fallback engine│
└────────────────────────────┘ └─────────────────────────────┘
```

- **Frontend**: Clean React 19 SPA with single source of truth (`AppContext`), URL hash routing for history navigation, and zero fake default data for fresh users (optional demo data button available).
- **Backend**: Express server running on port 3000 with Helmet CSP security headers, IP rate limiting, input sanitization, and structured JSON validation.
- **Gemini AI**: Server-side `@google/genai` integration keeping API keys safe from the browser.
- **Deterministic Fallbacks**: Offline-capable fallback engines that guarantee reliable scam detection, bill extraction, and medical safety checks even if network or AI quotas fail.

---

## Quickstart & Commands

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- `GEMINI_API_KEY` set in your `.env` file (see `.env.example`)

```bash
# 1. Install dependencies
npm install

# 2. Run the development server (Express backend + Vite on port 3000)
npm run dev

# 3. Run the automated test suite (31 Vitest tests across API, security & UI)
npm test

# 4. Typecheck and lint codebase (Zero warnings or errors)
npm run lint

# 5. Production build
npm run build

# 6. Start production server
npm start
```

---

## Accessibility & Senior-Centric Design (WCAG AA)

Saarthi was built from the ground up for aging eyes, motor differences, and varying digital literacy:

- **Typography & Font Scaling**: Default base font size of 16px with 3 discrete user-selectable sizes (Regular 16px, Large 18px, Extra Large 20px) configured in root attributes. Pairings use Atkinson Hyperlegible and Lexend for maximum character distinction.
- **Touch & Tap Ergonomics**: All interactive elements (buttons, inputs, navigation links, tabs) maintain a strict minimum target size of **48×48px** with clear visual states (`hover:`, `focus-visible:`).
- **Color Contrast & Themes**: Warm amber and earthy stone palette meeting WCAG AA contrast (≥ 4.5:1). Includes a dedicated **High Contrast Mode** (pure black with vivid yellow text) and full dark mode support.
- **Tone & Respectful Language**: Zero generic or patronizing labels. Clean personalized name greeting or neutral respectful tone.
- **Cognitive Ease**: No dense multi-nested cards, no all-caps body text, transparent confirmation before saving reminders or medicines, and clear distinction between real user data and optional sample demo data.

---

## License

This project is licensed under the [MIT License](LICENSE).
