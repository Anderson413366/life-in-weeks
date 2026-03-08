import React, { useState } from "react";
import { motion } from "framer-motion";
import { getApiKey } from "../lib/ai";
import { DEFAULT_AVERAGES, type UserAverages } from "../types";
import SectionHeading from "./SectionHeading";
import LifeExpectancyCalculator from "./LifeExpectancyCalculator";

interface SettingsPageProps {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  preferredName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  averages: UserAverages;
  onBirthdateChange: (v: string) => void;
  onLifeExpectancyChange: (v: number) => void;
  onDisplayNameChange: (v: string) => void;
  onPreferredNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onAvatarChange: (file: File) => Promise<void>;
  onApiKeyChange: (key: string) => void;
  onAveragesChange: (patch: Partial<UserAverages>) => void;
  onSignOut: () => void;
}

const section = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

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
  birthdate, lifeExpectancy, displayName, preferredName, email, phone, avatarUrl, averages,
  onBirthdateChange, onLifeExpectancyChange, onDisplayNameChange, onPreferredNameChange,
  onPhoneChange, onAvatarChange, onApiKeyChange, onAveragesChange, onSignOut,
}) => {
  const [apiKeyValue, setApiKeyValue] = useState(() => getApiKey());
  const [saved, setSaved] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <motion.div
      className="flex flex-col gap-8 sm:gap-10 w-full max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {saved && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-[#4caf50]/20 text-[#4caf50] border border-[#4caf50]/30 px-4 py-2 rounded-lg text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {saved}
        </motion.div>
      )}

      {/* ── Profile ──────────────────────────────────────────── */}
      <motion.section custom={0} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Profile" />
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-2">
            <label className="cursor-pointer group relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-box-border group-hover:border-primary transition-colors" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-box-border group-hover:border-primary transition-colors flex items-center justify-center text-2xl text-primary">
                  {(preferredName || displayName || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">📷</div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatarChange(f); }} />
            </label>
            <div className="text-xs text-text-muted">Click to upload a profile photo</div>
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
      </motion.section>

      {/* ── AI Configuration ─────────────────────────────────── */}
      <motion.section custom={1} initial="hidden" animate="visible" variants={section}>
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
          <p className="text-[0.65rem] text-text-muted/60 ml-0 sm:ml-44">
            Your key is stored securely in your account. It powers diary reflection prompts and entry analysis. Get a free key at aistudio.google.com.
          </p>
        </div>
      </motion.section>

      {/* ── Dashboard Averages ───────────────────────────────── */}
      <motion.section custom={2} initial="hidden" animate="visible" variants={section}>
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
      </motion.section>

      {/* ── Account ──────────────────────────────────────────── */}
      <motion.section custom={3} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Account" />
        <div className="glass rounded-xl p-5 sm:p-6 flex flex-col gap-4 items-center">
          <button
            onClick={onSignOut}
            className="h-10 px-6 rounded-lg bg-accent/10 text-accent border border-accent/20 text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            Sign Out
          </button>
          <p className="text-[0.6rem] text-text-muted/40">All your data is stored securely in the cloud and syncs across devices.</p>
        </div>
      </motion.section>

      <LifeExpectancyCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onAccept={(years) => { onLifeExpectancyChange(years); flash(`Life expectancy updated to ${years} years`); }}
        currentAge={birthdate ? Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 86400000)) : 30}
      />
    </motion.div>
  );
};

export default SettingsPage;
