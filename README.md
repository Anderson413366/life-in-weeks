# Life in Weeks

**Your life, visualized.** A visual life dashboard that shows your entire existence as a grid of weeks — with rich statistics, mood tracking, AI-powered journaling, and deep personal insights.

Built for neurodivergent minds (ADHD, dyslexia, depression) with a warm, calming, high-contrast design that empowers rather than overwhelms.

**Live**: [life-in-weeks-seven-silk.vercel.app](https://life-in-weeks-seven-silk.vercel.app)

---

## Features

### Dashboard
- Breathing SVG progress ring (pulses at your configured heart rate)
- Daily mood check-in with 5 emotions, personalized AI responses per mood
- Birthday countdown, exact age ticker (Y/M/D/H/M/S live)
- 14 collapsible data sections: body stats, cosmic perspective, life in numbers, planets, and more
- Personal horoscope (Today/Week/Year) powered by Gemini AI
- Famous people born on your day
- Life expectancy calculator (12-question health questionnaire)
- iPhone-style life battery bar (green → yellow → red)
- Shareable "Legacy Snapshot" poster

### Life Grid
- Your entire life as a grid — one cell per week, month, or year
- Three view modes with unique colors: Weeks (cyan), Months (green), Years (purple)
- Click any past cell to open a diary entry
- Year labels on every row, week numbers across the top

### Diary
- Voice-to-text journaling (browser native Speech API — free)
- Photo uploads with camera capture
- AI reflection prompts and entry analysis
- "On this day" historical facts
- Quick prompts: Win, Gratitude, Lesson, Goal, Highlight
- List/card view with search, year filter, sort

### Time Mirror
- Upload your photo → AI generates your face at every decade of life
- Horizontal film strip with past/present/future overlays
- AI-generated poetic life reflection

### Settings
- Profile: name, preferred name, email, phone, avatar
- Customizable averages (heart rate, steps, sleep, etc.)
- Focus Mode (black/white, zero animation) / Zen Mode (warm gradients)
- Life expectancy AI estimator
- Gemini API key with step-by-step setup guide
- Contact us section

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS (CDN), Framer Motion |
| Auth | Supabase (email/password + Google OAuth) |
| Database | Supabase PostgreSQL with RLS |
| Storage | Supabase Storage (photos, avatars) |
| AI | Google Gemini 2.5 Flash (BYOK) |
| Hosting | Vercel (auto-deploy on push) |
| PWA | Service worker + web manifest |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Local Development

```bash
git clone https://github.com/Anderson413366/life-in-weeks.git
cd life-in-weeks
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Deploy

```bash
npm run build
vercel deploy --prod
```

## Auth Recovery

Life in Weeks now supports password reset end-to-end inside the SPA:

- Request reset from the auth gate "Forgot your password?" action
- Supabase returns to `https://life-in-weeks-seven-silk.vercel.app/?reset=1`
- The app exchanges the auth code, enters recovery mode, and prompts for a new password in-place

Because this app shares a Supabase project with GleamOps and AnchorLife, reset emails from Life in Weeks must continue to pass `redirectTo` explicitly.

---

## Environment

No `.env` file needed. The Supabase URL and anon key are configured in `lib/supabase.ts`. Users provide their own Gemini API key via Settings (stored in their Supabase profile).

---

## Design Philosophy

- **Warm dark theme** with subtle purple undertones (not cold blue)
- **High contrast** for ADHD/neurodivergent accessibility
- **Progressive disclosure** — only hero ring + mood check visible on load
- **Cards use `.card-base`** — warm gradient backgrounds with purple-tinted borders
- **Every interactive element at 100% opacity** — never dimmed by default
- **Focus Mode** for sensory sensitivity — pure black, zero animations
- **WCAG 2.2 AA compliant** — reduced motion, focus-visible, 44px touch targets

---

## License

All rights reserved. © 2026 Life in Weeks.
