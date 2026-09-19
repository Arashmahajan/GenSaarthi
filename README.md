# Saarthi

**A GenAI-powered daily companion for senior citizens.**

*Saarthi* is Hindi for a guide, someone who helps you along the way. This app helps older adults read confusing messages, spot scams, remember their medicines and reach the right person quickly, without needing to be "good with technology".

> Built for the PromptWars warm-up challenge (Google for Developers, Build with AI).

<!-- Add a screenshot or short GIF here, for example: -->
<!-- ![Saarthi home screen](docs/screenshots/home.png) -->

**Live demo:** `<add your deployed link here>`

---

## The problem

Most digital tools are built for younger, tech-savvy users. Seniors often feel excluded, overwhelmed or vulnerable online. Bank messages, bills and forms are written in jargon, and scam messages use urgency ("verify now", "your account will be blocked") to push people into mistakes.

The challenge: build a GenAI-powered website that works as an intelligent, accessible and trustworthy daily companion, one that goes beyond a chatbot by simplifying complex information, anticipating needs and giving proactive help.

## What Saarthi does

| Feature | What it does |
|---|---|
| **Ask me anything** | Chat by voice or text. Answers are short and in simple words, can be read aloud, and can be re-explained more simply. |
| **Is this message safe?** | Paste text or take a photo of an SMS, bill, letter or medicine strip. Saarthi explains it, labels it *safe*, *careful* or *scam*, and lists what to do next. |
| **Reminders** | Add reminders by hand, or straight from a message that contains a deadline or appointment. |
| **Medicines** | Keep a list of medicines, tap **Taken** for each dose and see a simple week view. |
| **Plan my day** | Builds a short, kind plan from today's reminders and doses. |
| **Help** | One-tap calls to 112 (emergency), 14567 (Elderline) and 1930 (cyber crime helpline), saved family contacts, and an "I'm not feeling well" message that opens ready to send. |
| **Comfort settings** | Adjustable text size, high contrast, dark mode, and English or Hindi. |

The features are connected on purpose. A scam result leads to Help and a family message. A bill can become a reminder. Medicines feed the daily plan.

## How GenAI is used

- **Simplify:** turns bills, letters and bank messages into plain language.
- **Protect:** classifies messages as safe, careful or scam and explains why.
- **Anticipate:** finds deadlines, appointments and medicine details and offers to save them.
- **Guide:** writes a short daily plan from the person's own reminders.
- **Adapt:** replies in the chosen language, in short sentences.

The Check feature uses structured JSON output from Gemini so the app always gets the same fields (kind, summary, steps, risk, reason, reminder, medicine). If the AI is unavailable, a local keyword check still warns about common scam wording and the app says plainly that its help is limited.

## Tech stack

- React + TypeScript (Vite)
- Plain CSS with design tokens
- Google Gen AI SDK with a Gemini model, called through a small server route
- Web Speech API for voice input and read-aloud
- Vitest and React Testing Library, with axe for accessibility checks
- localStorage for on-device data

<!-- Edit this list to match what was actually built. -->

## Project structure

```
src/
  components/   reusable UI (Button, Card, RiskBanner, ReminderRow, ...)
  screens/      Home, Ask, Check, Reminders, Help
  services/     ai, speech, notifications, storage
  lib/          fallback scam scan, time helpers, validation, sanitising
  state/        app state (user, reminders, medicines, contacts, preferences)
  styles/       tokens.css, base.css
  tests/
server/         Gemini proxy with validation and rate limiting
```

## Getting started

**Prerequisites:** Node.js 18 or newer, and a Gemini API key from [Google AI Studio](https://aistudio.google.com/).

```bash
# 1. Clone
git clone https://github.com/<your-username>/saarthi.git
cd saarthi

# 2. Install
npm install

# 3. Add your API key (never commit this file)
cp .env.example .env
# then edit .env and set GEMINI_API_KEY

# 4. Run
npm run dev
```

### Environment variables

| Name | Purpose |
|---|---|
| `GEMINI_API_KEY` | Key used by the server route to call Gemini. Never exposed to the browser. |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in development mode |
| `npm run build` | Create a production build |
| `npm test` | Run unit, component and accessibility tests |
| `npm run lint` | Check code style |

## Security

- The API key stays on the server and is never in the browser code.
- All user input and all AI output is rendered as plain text, never as HTML.
- The server checks message length, image type and image size, and rate-limits AI requests.
- A Content Security Policy and other security headers are set.
- Messages and photos are sent to Gemini only for the single request and are not stored or logged.
- The app never asks for OTPs, PINs, passwords or card numbers, and tells users never to share them.
- Text inside a message or image is treated as data, not as instructions to the AI.

## Accessibility

- Large text by default (about 19px), scalable up to about 160%, with tap targets of at least 48px
- Atkinson Hyperlegible font, designed for readability
- Risk levels shown with text and icons, never colour alone
- Full keyboard support, visible focus, skip link, and screen-reader friendly labels and live regions
- Light, dark and high-contrast modes, and support for reduced motion
- Voice input and read-aloud in English and Hindi where the browser supports them

## Testing

Tests cover the fallback scam check, response validation, time and sorting helpers, phone number and input validation, storage handling, the Check flow with a mocked AI service (safe, scam, error and fallback paths), the Reminders, Medicines and Help screens, and automated accessibility checks on each screen.

```bash
npm test
```

## Limitations

- AI judgement can be wrong in both directions. Scam results are guidance, not proof, and the app always suggests confirming with the bank or a family member using an official number.
- Saarthi records medicines but gives no medical advice and no dose changes.
- Data is stored on one device in the browser.
- Voice features depend on browser support.
- Languages supported today: English and Hindi.

## Roadmap

- Family circle: a trusted person is alerted when a scam is detected or a dose is missed
- Notifications through WhatsApp or push
- Step-by-step guides for tasks like UPI payments and video calls
- Daily "How are you today?" check-in
- More Indian languages
- Government scheme and pension help

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and `npm test` before opening a pull request.

## License

`<choose a license, for example MIT, and add a LICENSE file>`

## Acknowledgements

Made for PromptWars, part of Google for Developers Build with AI. Thanks to the organisers and mentors.
