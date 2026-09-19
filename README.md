# Saarthi (सारथी) • Daily GenAI Companion for Senior Citizens

**Saarthi** is an accessible, empathetic, and trustworthy GenAI-powered daily companion crafted specifically for senior citizens in India. Designed to bridge the digital divide, Saarthi helps elders navigate modern technology, understand complex bills, detect fraudulent SMS and calls, track medicines, and plan peaceful days with confidence and independence.

---

## Key Capabilities

1. **Unified Document & Scam Checker (`/api/check`)**
   - **Bill & Letter Simplification**: Clarifies utility bills (electricity, water, gas, broadband), pension statements, and official correspondence into clear, bite-sized Hindi or English.
   - **ScamShield Defense**: Detects urgent disconnection threats, fake digital arrest extortion, KYC/PAN card traps (using strict word-boundary matching to eliminate false positives), and remote screen-sharing fraud (AnyDesk, RustDesk).
   - **Honest Fallbacks**: Strictly avoids hallucinating amounts, due dates, or arrears. If an amount or date is missing, it explicitly notes that information is not present.

2. **Medicine Reminder & Explainer (`/api/medicine`)**
   - Explains medications in plain, respectful terms (what health aspect it helps with, whether to take before or after food, and crucial precautions).
   - Daily medication schedule with streak counters, remaining pill trackers, and morning/afternoon/evening doses.
   - Strict medical safety disclaimers: Saarthi explains general knowledge, but never prescribes or alters doctor dosages.

3. **Plan My Day (`/api/plan`)**
   - Generates gentle, unhurried schedules tailored to senior daily rhythms (early morning walks, warm water, prayer/puja, meals, afternoon rest, family calls).
   - Instant presets for "Peaceful Day at Home", "Doctor Appointment Day", and "Temple & Family Evening".

4. **Senior Companion Chat (`/api/chat`)**
   - Respectful, patient conversational partner speaking fluent English and Hindi.
   - Voice-first design with built-in text-to-speech audio playback and microphone speech recognition.

5. **Emergency SOS Modal**
   - One-tap quick dialing for essential Indian emergency services: National Emergency (112), Medical Ambulance (108), Elder Line (14567), and Cyber Crime Helpline (1930).
   - **"Not Feeling Well"** immediate guided breathing exercise with step-by-step calming instructions.

6. **Senior-First Accessibility & Ergonomics**
   - **Typography**: Minimum 19px base font with multi-step zoom controls (Normal, Large, Extra Large).
   - **Touch Targets**: Minimum 48px interactive target areas across all buttons, tabs, and list items.
   - **Visual Comfort**: High contrast toggle, dark mode support, and warm, calming earth tones (amber, stone, emerald).
   - **Bilingual**: Seamless one-click switching between English and Hindi.

---

## Technical Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Motion animations.
- **Backend**: Node.js, Express, Helmet (CSP & security headers), Express Rate Limiter, TypeScript via `tsx` (dev) and `esbuild` (production CJS bundle).
- **Generative AI**: `@google/genai` TypeScript SDK with centralized model configuration (`process.env.GEMINI_MODEL || 'gemini-2.5-flash'`).
- **Testing**: Vitest, `@testing-library/react`, `@testing-library/jest-dom`, and Supertest.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- GEMINI_API_KEY (configured in environment or `.env`)

### Installation & Scripts

```bash
# Install dependencies
npm install

# Run development server (accessible at http://localhost:3000)
npm run dev

# Run full test suite (API endpoints + React components)
npm test

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## Security & Privacy Highlights

- **Server-Side AI**: All Gemini API interactions occur on the Express backend; API keys and secrets are never exposed to the client browser.
- **Safe Error Handling**: Internal error stacks and server exceptions are never returned in client API payloads; safe, human-friendly JSON error messages are returned instead.
- **Rate Limiting**: API routes are protected by rate limiters to prevent accidental flooding or denial of service.
- **Prompt Injection Defense**: User document inputs are bounded within `<user_content>` delimiters with explicit instructions to evaluate text as data rather than instructions.
