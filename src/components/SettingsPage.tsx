import React, { Suspense, lazy, useState } from "react";
import { getApiKey } from "../lib/ai";
import { DEFAULT_AVERAGES, type DiaryEntry, type MoodEntry, type UserAverages } from "../types";
import type { AppMode } from "../lib/theme";
import { downloadLifeData } from "../lib/exportData";
import SectionHeading from "./SectionHeading";

const LifeExpectancyCalculator = lazy(() => import("./LifeExpectancyCalculator"));

interface SettingsPageProps {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  preferredName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  averages: UserAverages;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onBirthdateChange: (v: string) => void;
  onLifeExpectancyChange: (v: number) => void;
  onDisplayNameChange: (v: string) => void;
  onPreferredNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onAvatarChange: (file: File) => Promise<void>;
  onApiKeyChange: (key: string) => void;
  onAveragesChange: (patch: Partial<UserAverages>) => void;
  onSignOut: () => void;
  diaryEntries: DiaryEntry[];
  moods: MoodEntry[];
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <label className="text-xs text-text-muted uppercase tracking-wider w-full sm:w-40 shrink-0">{label}</label>
      <div className="w-full">{children}</div>
    </div>
  );
}

const INPUT_CLS = "h-10 w-full rounded-lg border border-box-border bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all";
const NUM_CLS = "h-10 w-24 rounded-lg border border-box-border bg-transparent px-3 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none [-moz-appearance:textfield]";

interface AvgField {
  key: keyof UserAverages;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
}

const AVG_FIELDS: AvgField[] = [
  { key: "avg_heartbeats_per_min", label: "Heart Rate",    unit: "bpm",       min: 40,  max: 200 },
  { key: "avg_breaths_per_min",    label: "Breathing Rate", unit: "per min",   min: 5,   max: 40 },
  { key: "avg_blinks_per_min",     label: "Blink Rate",    unit: "per min",   min: 5,   max: 30 },
  { key: "meals_per_day",          label: "Meals",         unit: "per day",   min: 1,   max: 10, step: 0.5 },
  { key: "avg_steps_per_day",      label: "Steps",         unit: "per day",   min: 0,   max: 30000, step: 500 },
  { key: "avg_sleep_hours",        label: "Sleep",         unit: "hrs/day",   min: 3,   max: 14, step: 0.5 },
  { key: "avg_screen_hours",       label: "Screen Time",   unit: "hrs/day",   min: 0,   max: 18, step: 0.5 },
  { key: "avg_words_per_day",      label: "Words Spoken",  unit: "per day",   min: 0,   max: 50000, step: 1000 },
  { key: "avg_laughs_per_day",     label: "Laughs",        unit: "per day",   min: 0,   max: 100 },
];

const SettingsPage: React.FC<SettingsPageProps> = ({
  birthdate, lifeExpectancy, displayName, preferredName, email, phone, avatarUrl, averages, mode, onModeChange,
  onBirthdateChange, onLifeExpectancyChange, onDisplayNameChange, onPreferredNameChange,
  onPhoneChange, onAvatarChange, onApiKeyChange, onAveragesChange, onSignOut, diaryEntries, moods,
}) => {
  const [apiKeyValue, setApiKeyValue] = useState(() => getApiKey());
  const [saved, setSaved] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  }

  function handleExportData() {
    downloadLifeData({
      exportedAt: new Date().toISOString(),
      app: "Life in Weeks",
      version: 1,
      profile: {
        birthdate,
        lifeExpectancy,
        displayName,
        preferredName,
        email,
        averages,
      },
      diaryEntries,
      moods,
    });
    flash("Life data exported");
  }

  const calculatorFallback = <div className="text-xs text-white/40 text-center py-4">Loading estimator...</div>;

  return (
    <div className="flex flex-col gap-8 sm:gap-10 w-full max-w-2xl mx-auto animate-fade-in">
      {saved && (
        <div
          className="fixed top-4 right-4 z-50 bg-[#4caf50]/20 text-[#4caf50] border border-[#4caf50]/30 px-4 py-2 rounded-lg text-sm"
          style={{ animation: "fadeIn 0.2s ease-out forwards" }}
        >
          {saved}
        </div>
      )}

      {/* ── Profile ──────────────────────────────────────────── */}
      <section className="animate-fade-in" style={{ animationDelay: "0s" }}>
        <SectionHeading title="Profile" />
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-2 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-box-border/30">
            <label className="cursor-pointer group relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-box-border group-hover:border-primary transition-colors" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-box-border group-hover:border-primary transition-colors flex items-center justify-center text-3xl text-primary">
                  {(preferredName || displayName || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">📷 Upload</div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onAvatarChange(f); flash("Profile photo updated"); } }} />
            </label>
            <div>
              <div className="text-sm text-white font-medium mb-1">Profile Photo</div>
              <div className="text-xs text-text-muted">Click the circle to upload. Supports JPG, PNG.</div>
            </div>
          </div>
          <FieldRow label="Full Name">
            <input
              type="text"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="Your full name"
              className={INPUT_CLS}
            />
          </FieldRow>
          <FieldRow label="Preferred Name">
            <input
              type="text"
              value={preferredName}
              onChange={(e) => onPreferredNameChange(e.target.value)}
              placeholder="What should we call you?"
              className={INPUT_CLS}
            />
          </FieldRow>
          <FieldRow label="Email">
            <input type="email" value={email} disabled className={`${INPUT_CLS} opacity-50 cursor-not-allowed`} />
          </FieldRow>
          <FieldRow label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={INPUT_CLS}
            />
          </FieldRow>
          <FieldRow label="Birthdate">
            <input
              type="date"
              value={birthdate}
              onChange={(e) => onBirthdateChange(e.target.value)}
              className={INPUT_CLS}
            />
          </FieldRow>
          <FieldRow label="Life Expectancy">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={lifeExpectancy}
                onChange={(e) => onLifeExpectancyChange(Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 80)))}
                min={1} max={120}
                className={NUM_CLS}
              />
              <span className="text-xs text-text-muted">years</span>
              <button
                onClick={() => setShowCalculator(true)}
                className="h-9 px-3 rounded-lg bg-gemini-button-bg/20 text-[#c39bd3] border border-[#8e44ad]/30 text-xs font-medium hover:bg-gemini-button-bg/30 transition-colors flex items-center gap-1.5 shrink-0"
              >
                ✨ AI Estimate
              </button>
            </div>
          </FieldRow>
        </div>
      </section>

      {/* ── AI Configuration ─────────────────────────────────── */}
      <section className="animate-fade-in" style={{ animationDelay: "0.06s" }}>
        <SectionHeading title="AI Configuration" />
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4">
          <FieldRow label="Gemini API Key">
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Paste your key (free at aistudio.google.com)"
                className={`${INPUT_CLS} flex-1`}
              />
              <button
                onClick={() => { onApiKeyChange(apiKeyValue); flash("API key saved"); }}
                className="h-10 px-4 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors border border-primary/30 shrink-0"
              >
                Save
              </button>
            </div>
          </FieldRow>
          <div className="ml-0 sm:ml-44 space-y-2">
            <p className="text-[0.65rem] text-white/40">
              Your key is stored securely and never shared. It powers horoscope, diary AI, and famous birthdays.
            </p>
            <details className="text-[0.65rem] text-white/30">
              <summary className="text-[#00d4ff] cursor-pointer hover:text-[#00d4ff]/80 transition-colors font-semibold">
                📘 How to get a free Gemini API key
              </summary>
              <ol className="mt-2 ml-4 space-y-1.5 text-white/50 list-decimal">
                <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] underline">aistudio.google.com/apikey</a></li>
                <li>Sign in with your Google account</li>
                <li>Click <strong className="text-white/70">"Create API Key"</strong></li>
                <li>Copy the key and paste it above</li>
                <li>That's it — it's completely free for personal use!</li>
              </ol>
            </details>
          </div>
        </div>
      </section>

      {/* ── Dashboard Averages ───────────────────────────────── */}
      <section className="animate-fade-in" style={{ animationDelay: "0.12s" }}>
        <SectionHeading title="Customize Your Averages" />
        <p className="text-xs text-text-muted/70 text-center -mt-4 mb-4">
          Adjust these to personalize your dashboard statistics. Changes apply instantly.
        </p>
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4">
          {AVG_FIELDS.map((f) => (
            <FieldRow key={f.key} label={f.label}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={averages[f.key]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= f.min && val <= f.max) {
                      onAveragesChange({ [f.key]: val });
                    }
                  }}
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  className={NUM_CLS}
                />
                <span className="text-xs text-text-muted">{f.unit}</span>
                {averages[f.key] !== DEFAULT_AVERAGES[f.key] && (
                  <button
                    onClick={() => onAveragesChange({ [f.key]: DEFAULT_AVERAGES[f.key] })}
                    className="text-[0.6rem] text-text-muted/50 hover:text-accent transition-colors"
                    title="Reset to default"
                  >
                    reset
                  </button>
                )}
              </div>
            </FieldRow>
          ))}
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.18s" }}>
        <SectionHeading title="Data & Privacy" />
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4">
          <p className="text-sm text-white/65 leading-relaxed">
            Export everything currently stored for your account so you can keep a personal backup or move your reflections elsewhere.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportData}
              className="h-10 px-4 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors border border-primary/30"
            >
              Download My Life Data
            </button>
            <span className="text-[0.65rem] text-text-muted/70">
              Includes profile settings, averages, mood history, and diary entries as JSON.
            </span>
          </div>
        </div>
      </section>

      {/* ── Display Mode ────────────────────────────────────── */}
      <section className="animate-fade-in" style={{ animationDelay: "0.24s" }}>
        <SectionHeading title="Display Mode" />
        <div className="glass rounded-xl p-5 sm:p-6">
          <div className="flex gap-3">
            {([
              { id: "zen" as AppMode, label: "Zen Mode", desc: "Cosmic gradients, soft glows, breathing animations", icon: "🌌" },
              { id: "focus" as AppMode, label: "Focus Mode", desc: "High contrast, zero distractions, binary clarity", icon: "⚡" },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                  mode === m.id
                    ? "border-primary bg-primary/10"
                    : "border-box-border/50 hover:border-primary/30"
                }`}
              >
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className={`text-sm font-semibold mb-1 ${mode === m.id ? "text-primary" : "text-white"}`}>{m.label}</div>
                <div className="text-[0.6rem] text-text-muted leading-relaxed">{m.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-[0.55rem] text-text-muted/40 text-center mt-3">
            Zen is ideal for relaxed exploration. Focus is designed for ADHD, OCD, and sensory sensitivity.
          </p>
        </div>
      </section>

      {/* ── Contact Us ────────────────────────────────────────── */}
      <section className="animate-fade-in" style={{ animationDelay: "0.30s" }}>
        <SectionHeading title="Contact Us" />
        <div className="card-base p-5 sm:p-6 space-y-3">
          <p className="text-white/70 text-sm leading-relaxed">
            Found a bug? Have an idea? We'd love to hear from you.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">📧</span>
              <a href="mailto:support@lifeinweeks.app" className="text-[#00d4ff] hover:underline">support@lifeinweeks.app</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">💬</span>
              <span className="text-white/50">DM us on X (Twitter): <a href="https://twitter.com/lifeinweeksapp" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:underline">@lifeinweeksapp</a></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">🐛</span>
              <span className="text-white/50">Report bugs: <a href="https://github.com/Anderson413366/life-in-weeks/issues" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:underline">GitHub Issues</a></span>
            </div>
          </div>
          <p className="text-white/25 text-xs pt-2">
            We typically respond within 24 hours. Your feedback directly shapes this app.
          </p>
        </div>
      </section>

      {/* ── Account ──────────────────────────────────────────── */}
      <section className="animate-fade-in" style={{ animationDelay: "0.36s" }}>
        <SectionHeading title="Account" />
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4 items-center">
          <button
            onClick={onSignOut}
            className="h-10 px-6 rounded-lg bg-accent/10 text-accent border border-accent/20 text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            Sign Out
          </button>
          <p className="text-[0.6rem] text-text-muted/40">All your data syncs across devices when online, and journal/mood updates queue locally if you go offline.</p>
        </div>
      </section>

      {showCalculator && (
        <Suspense fallback={calculatorFallback}>
          <LifeExpectancyCalculator
            isOpen={showCalculator}
            onClose={() => setShowCalculator(false)}
            onAccept={(years) => { onLifeExpectancyChange(years); flash(`Life expectancy updated to ${years} years`); }}
            currentAge={birthdate ? Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 86400000)) : 30}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SettingsPage;
