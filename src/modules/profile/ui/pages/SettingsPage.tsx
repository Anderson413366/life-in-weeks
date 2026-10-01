import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { getApiKey } from "@/modules/ai/service/ai.service";
import type { AppMode } from "@/modules/preferences";
import { Button, InfoCard, LinkButton, SectionHeading, Surface } from "@/shared/ui/components";
import { clearLifeInWeeksLocalData, IMAGE_ACCEPT_ATTRIBUTE, parseStoredDate, validateImageFile } from "@/shared/lib";

import { downloadLifeData } from "../../service/export.service";
import { DEFAULT_AVERAGES, type DiaryEntry, type MoodEntry, type UserAverages } from "../../types/profile.types";

const LifeExpectancyCalculator = lazy(() => import("../components/LifeExpectancyCalculator"));

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
  onProfileSave: (draft: {
    birthdate: string;
    lifeExpectancy: number;
    displayName: string;
    preferredName: string;
    phone: string;
  }) => Promise<boolean>;
  onAvatarChange: (file: File) => Promise<boolean>;
  onApiKeyChange: (key: string) => Promise<boolean>;
  onAveragesSave: (averages: UserAverages) => Promise<boolean>;
  onSignOut: () => void;
  diaryEntries: DiaryEntry[];
  moods: MoodEntry[];
}

type NoticeTone = "success" | "error";

interface ProfileDraft {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  preferredName: string;
  phone: string;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <label className="w-full shrink-0 text-xs uppercase tracking-wider text-text-muted sm:w-40">{label}</label>
      <div className="w-full">{children}</div>
    </div>
  );
}

function SectionFooter({
  dirty,
  saving,
  onReset,
  onSave,
  saveLabel = "Save changes",
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => Promise<void>;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-box-border/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-text-muted/70">
        {dirty ? "You have unsaved changes in this section." : "This section is up to date."}
      </p>
      <div className="flex items-center gap-2">
        <Button onClick={onReset} disabled={!dirty || saving} size="sm" variant="quiet">
          Reset
        </Button>
        <Button onClick={() => void onSave()} disabled={!dirty || saving} size="sm" variant="primary">
          {saving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </div>
  );
}

const INPUT_CLS = "app-field";
const NUM_CLS = "app-field app-field--number";

interface AvgField {
  key: keyof UserAverages;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
}

const AVG_FIELDS: AvgField[] = [
  { key: "avg_heartbeats_per_min", label: "Heart Rate", unit: "bpm", min: 40, max: 200 },
  { key: "avg_breaths_per_min", label: "Breathing Rate", unit: "per min", min: 5, max: 40 },
  { key: "avg_blinks_per_min", label: "Blink Rate", unit: "per min", min: 5, max: 30 },
  { key: "meals_per_day", label: "Meals", unit: "per day", min: 1, max: 10, step: 0.5 },
  { key: "avg_steps_per_day", label: "Steps", unit: "per day", min: 0, max: 30000, step: 500 },
  { key: "avg_sleep_hours", label: "Sleep", unit: "hrs/day", min: 3, max: 14, step: 0.5 },
  { key: "avg_screen_hours", label: "Screen Time", unit: "hrs/day", min: 0, max: 18, step: 0.5 },
  { key: "avg_words_per_day", label: "Words Spoken", unit: "per day", min: 0, max: 50000, step: 1000 },
  { key: "avg_laughs_per_day", label: "Laughs", unit: "per day", min: 0, max: 100 },
];

const SettingsPage: React.FC<SettingsPageProps> = ({
  birthdate,
  lifeExpectancy,
  displayName,
  preferredName,
  email,
  phone,
  avatarUrl,
  averages,
  mode,
  onModeChange,
  onProfileSave,
  onAvatarChange,
  onApiKeyChange,
  onAveragesSave,
  onSignOut,
  diaryEntries,
  moods,
}) => {
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    birthdate,
    lifeExpectancy,
    displayName,
    preferredName,
    phone,
  });
  const [averagesDraft, setAveragesDraft] = useState<UserAverages>(averages);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAverages, setSavingAverages] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const noticeTimerRef = useRef<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileDraft({ birthdate, lifeExpectancy, displayName, preferredName, phone });
  }, [birthdate, displayName, lifeExpectancy, phone, preferredName]);

  useEffect(() => {
    setAveragesDraft(averages);
  }, [averages]);

  useEffect(() => {
    setApiKeyValue("");
  }, [birthdate, displayName, preferredName]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  function flash(message: string, tone: NoticeTone = "success") {
    setNotice({ message, tone });
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2600);
  }

  const storedApiKey = getApiKey().trim();
  const profileDirty = useMemo(
    () =>
      profileDraft.birthdate !== birthdate ||
      profileDraft.lifeExpectancy !== lifeExpectancy ||
      profileDraft.displayName !== displayName ||
      profileDraft.preferredName !== preferredName ||
      profileDraft.phone !== phone,
    [birthdate, displayName, lifeExpectancy, phone, preferredName, profileDraft],
  );

  const averagesDirty = useMemo(
    () => AVG_FIELDS.some((field) => averagesDraft[field.key] !== averages[field.key]),
    [averages, averagesDraft],
  );

  const hasStoredApiKey = storedApiKey.length > 0;
  const apiDirty = apiKeyValue.trim().length > 0 && apiKeyValue.trim() !== storedApiKey;

  async function handleProfileSave() {
    setSavingProfile(true);
    const success = await onProfileSave(profileDraft);
    setSavingProfile(false);
    flash(success ? "Profile details saved." : "Profile changes could not be saved.", success ? "success" : "error");
  }

  async function handleAveragesSave() {
    setSavingAverages(true);
    const success = await onAveragesSave(averagesDraft);
    setSavingAverages(false);
    flash(success ? "Dashboard averages saved." : "Averages could not be saved.", success ? "success" : "error");
  }

  async function handleApiKeySave() {
    if (!apiDirty) return;
    setSavingKey(true);
    const success = await onApiKeyChange(apiKeyValue);
    setSavingKey(false);
    if (success) setApiKeyValue("");
    flash(success ? "Gemini key saved." : "Gemini key could not be saved.", success ? "success" : "error");
  }

  async function handleApiKeyClear() {
    setSavingKey(true);
    const success = await onApiKeyChange("");
    setSavingKey(false);
    setApiKeyValue("");
    flash(success ? "Gemini key removed." : "Gemini key could not be removed.", success ? "success" : "error");
  }

  async function handleAvatarUpload(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      flash(validationError, "error");
      return;
    }

    setUploadingAvatar(true);
    const success = await onAvatarChange(file);
    setUploadingAvatar(false);
    flash(success ? "Profile photo updated." : "Profile photo could not be updated.", success ? "success" : "error");
  }

  function handleClearLocalDeviceData() {
    clearLifeInWeeksLocalData();
    flash("Local offline queues and cached prompts were cleared.");
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
        phone,
        avatarUrl,
        averages,
      },
      diaryEntries,
      moods,
    });
    flash("Life data exported.");
  }

  const calculatorFallback = <div className="py-4 text-center text-xs text-white/40">Loading estimator...</div>;
  const currentAge = birthdate
    ? Math.floor((Date.now() - (parseStoredDate(birthdate)?.getTime() ?? Date.now())) / (365.25 * 86400000))
    : 30;
  const sectionLinks = [
    { href: "#identity", label: "Identity" },
    { href: "#account-access", label: "Account access" },
    { href: "#ai-tools", label: "AI" },
    { href: "#averages", label: "Averages" },
    { href: "#backup-privacy", label: "Backup & privacy" },
    { href: "#experience", label: "Experience" },
    { href: "#support", label: "Support" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 animate-fade-in">
      {notice && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-2 text-sm shadow-2xl ${
            notice.tone === "success"
              ? "border-[#4caf50]/30 bg-[#4caf50]/20 text-[#9ce5a1]"
              : "border-[#fb7185]/30 bg-[#fb7185]/15 text-[#fda4af]"
          }`}
          style={{ animation: "fadeIn 0.2s ease-out forwards" }}
        >
          {notice.message}
        </div>
      )}

      <Surface variant="hero">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Settings</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.4rem]">
                Keep identity, access, and daily use aligned.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/65">
                This product is single-user today, so Settings needs to separate your personal record, account access, optional AI tools, and export controls without pretending they are all one form.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportData} size="sm" variant="primary">
              Export my data
            </Button>
            <LinkButton href="#account-access" size="sm">
              Account access
            </LinkButton>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href} className="chip text-[0.68rem] text-white/72 transition-colors hover:text-white">
              {link.label}
            </a>
          ))}
        </div>
      </Surface>

      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard title="Timeline source" description="Identity and averages drive the grid, milestones, and dashboard calculations." tone="accent" />
        <InfoCard title="Optional systems" description="Gemini, display mode, and support settings stay separate from your core profile." />
        <InfoCard title="Portable record" description="Export keeps diary, mood, and profile data together without including your API key." />
      </div>

      <section className="animate-fade-in">
        <SectionHeading
          id="identity"
          eyebrow="Identity"
          title="Identity & timeline"
          description="Personal details that shape your life grid, milestones, greeting, and the way the product addresses you."
        />
        <Surface className="p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-box-border/30 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative self-start rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full border-2 border-box-border object-cover transition-colors group-hover:border-primary" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-box-border bg-primary/10 text-3xl text-primary transition-colors group-hover:border-primary">
                  {(profileDraft.preferredName || profileDraft.displayName || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingAvatar ? "Saving..." : "Upload"}
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void handleAvatarUpload(file);
              }}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="max-w-lg text-xs leading-6 text-text-muted">
                Uploading a photo is an explicit action. Text fields below stay local until you hit save.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FieldRow label="Full Name">
              <input
                type="text"
                value={profileDraft.displayName}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                placeholder="Your full name"
                className={INPUT_CLS}
              />
            </FieldRow>
            <FieldRow label="Preferred Name">
              <input
                type="text"
                value={profileDraft.preferredName}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, preferredName: event.target.value }))}
                placeholder="What should we call you?"
                className={INPUT_CLS}
              />
            </FieldRow>
            <FieldRow label="Phone">
              <input
                type="tel"
                value={profileDraft.phone}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+1 (555) 123-4567"
                className={INPUT_CLS}
              />
            </FieldRow>
            <FieldRow label="Birthdate">
              <input
                type="date"
                value={profileDraft.birthdate}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, birthdate: event.target.value }))}
                className={INPUT_CLS}
              />
            </FieldRow>
            <FieldRow label="Life Expectancy">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={profileDraft.lifeExpectancy}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      lifeExpectancy: Math.max(1, Math.min(120, parseInt(event.target.value, 10) || 80)),
                    }))
                  }
                  min={1}
                  max={120}
                  className={NUM_CLS}
                />
                <span className="text-xs text-text-muted">years</span>
                <Button onClick={() => setShowCalculator(true)} size="sm" variant="ai">
                  AI Estimate
                </Button>
              </div>
            </FieldRow>
          </div>

          <SectionFooter
            dirty={profileDirty}
            saving={savingProfile}
            onReset={() => setProfileDraft({ birthdate, lifeExpectancy, displayName, preferredName, phone })}
            onSave={handleProfileSave}
          />
        </Surface>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.02s" }}>
        <SectionHeading
          id="account-access"
          eyebrow="Access"
          title="Account access"
          description="Login identity, sign-out control, and the practical rules for how this private workspace behaves across devices."
        />
        <Surface className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoCard
              eyebrow="Login email"
              title={email}
              description="This is the auth identity for the current account. It is intentionally read-only here."
            />
            <InfoCard
              eyebrow="Workspace model"
              title="Single-user private workspace"
              description="There are no manager, owner, or invite roles in the product today. Settings separates self-access from personal profile data."
            />
          </div>

          <InfoCard
            eyebrow="Operational notes"
            title="This device can keep working through temporary connection loss."
            description={(
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/72">
              <li>Journal and mood updates queue locally if the connection drops.</li>
              <li>Exports include profile, averages, moods, and diary entries, but not the Gemini API key.</li>
              <li>Offline queues and AI helper caches are stored on this browser until they sync or you clear them.</li>
              <li>Signing out does not delete synced data from Supabase.</li>
            </ul>
            )}
          />

          <div className="flex flex-col gap-3 border-t border-box-border/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-text-muted/70">
              Sign out when you are done on a shared device. Clear local device data first if unsynced local notes should not remain on this browser.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleClearLocalDeviceData} variant="quiet">
                Clear local device data
              </Button>
              <Button onClick={onSignOut} variant="danger">
                Sign out
              </Button>
            </div>
          </div>
        </Surface>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.04s" }}>
        <SectionHeading
          id="ai-tools"
          eyebrow="Optional"
          title="AI tools"
          description="Gemini-powered features are additive. Keep them off unless you want Time Mirror, horoscope, and AI-assisted reflection modules."
        />
        <Surface className="p-5 sm:p-6">
          <FieldRow label="Gemini API Key">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={apiKeyValue}
                onChange={(event) => setApiKeyValue(event.target.value)}
                placeholder={hasStoredApiKey ? "A key is saved. Paste a new key to replace it." : "Paste your key (free at aistudio.google.com)"}
                className={`${INPUT_CLS} flex-1`}
              />
              <Button onClick={() => void handleApiKeySave()} disabled={!apiDirty || savingKey} size="sm" variant="primary">
                {savingKey ? "Saving..." : "Save key"}
              </Button>
              {hasStoredApiKey && (
                <Button onClick={() => void handleApiKeyClear()} disabled={savingKey} size="sm" variant="quiet">
                  Remove key
                </Button>
              )}
            </div>
          </FieldRow>
          <div className="ml-0 space-y-2 pt-4 sm:ml-44">
            <p className="text-[0.68rem] leading-6 text-white/45">
              {hasStoredApiKey ? "A Gemini key is saved for AI features. The raw key is not prefilled here; paste a replacement only when you want to rotate it." : "Gemini is off until you save your own API key."}
              {" "}Exports intentionally leave the key out so backups do not duplicate a secret.
            </p>
            <details className="text-[0.68rem] text-white/35">
              <summary className="cursor-pointer font-semibold text-[#00d4ff] transition-colors hover:text-[#00d4ff]/80">
                How to get a free Gemini API key
              </summary>
              <ol className="ml-4 mt-2 list-decimal space-y-1.5 text-white/55">
                <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] underline">aistudio.google.com/apikey</a></li>
                <li>Sign in with your Google account</li>
                <li>Click <strong className="text-white/70">Create API Key</strong></li>
                <li>Copy the key and paste it above</li>
              </ol>
            </details>
          </div>
        </Surface>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.08s" }}>
        <SectionHeading
          id="averages"
          eyebrow="Reference"
          title="Personal averages"
          description="These numbers tune the dashboard's derived stats. Change them only when you want the reflection math to feel more personally accurate."
        />
        <Surface className="p-5 sm:p-6">
          <div className="space-y-4">
            {AVG_FIELDS.map((field) => (
              <FieldRow key={field.key} label={field.label}>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={averagesDraft[field.key]}
                    onChange={(event) => {
                      const value = parseFloat(event.target.value);
                      if (!Number.isNaN(value)) {
                        setAveragesDraft((prev) => ({
                          ...prev,
                          [field.key]: Math.max(field.min, Math.min(field.max, value)),
                        }));
                      }
                    }}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    className={NUM_CLS}
                  />
                  <span className="text-xs text-text-muted">{field.unit}</span>
                  {averagesDraft[field.key] !== DEFAULT_AVERAGES[field.key] && (
                    <Button
                      onClick={() =>
                        setAveragesDraft((prev) => ({ ...prev, [field.key]: DEFAULT_AVERAGES[field.key] }))
                      }
                      size="sm"
                      variant="quiet"
                      title="Reset to default"
                    >
                      reset
                    </Button>
                  )}
                </div>
              </FieldRow>
            ))}
          </div>
          <SectionFooter
            dirty={averagesDirty}
            saving={savingAverages}
            onReset={() => setAveragesDraft(averages)}
            onSave={handleAveragesSave}
            saveLabel="Save averages"
          />
        </Surface>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.12s" }}>
        <SectionHeading
          id="backup-privacy"
          eyebrow="Backup"
          title="Backup & privacy"
          description="Keep a local copy of the data that powers the account and understand clearly what is and is not included."
        />
        <Surface className="p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-white/70">
            Export the data that powers your account so you can keep a backup or move your reflections elsewhere.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={handleExportData} size="sm" variant="primary">
              Download My Life Data
            </Button>
            <span className="text-[0.68rem] text-text-muted/70">
              Includes profile settings, averages, mood history, and diary entries. Excludes your Gemini API key.
            </span>
          </div>
          <p className="mt-4 text-[0.68rem] leading-6 text-white/45">
            Offline journal and mood changes can remain in this browser while waiting to sync. Use Clear local device data in Account access before leaving a shared device.
          </p>
        </Surface>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.16s" }}>
        <SectionHeading
          id="experience"
          eyebrow="Experience"
          title="Display mode"
          description="Choose the visual environment that keeps the app calm and usable for your nervous system."
        />
        <Surface className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            {([
              { id: "zen" as AppMode, label: "Zen Mode", desc: "Cosmic gradients, soft glows, breathing animations", mark: "Zen" },
              { id: "focus" as AppMode, label: "Focus Mode", desc: "High contrast, lower sensory load, clearer edges", mark: "Focus" },
            ]).map((option) => (
              <button
                key={option.id}
                onClick={() => onModeChange(option.id)}
                aria-pressed={mode === option.id}
                className={`choice-card flex-1 text-left ${
                  mode === option.id
                    ? "border-primary bg-primary/10"
                    : "border-box-border/50 hover:border-primary/30"
                }`}
              >
                <div className="chip mb-3 text-[0.65rem] text-white/60">{option.mark}</div>
                <div className={`mb-1 text-sm font-semibold ${mode === option.id ? "text-primary" : "text-white"}`}>
                  {option.label}
                </div>
                <div className="text-[0.68rem] leading-relaxed text-text-muted">{option.desc}</div>
              </button>
            ))}
          </div>
        </Surface>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "0.20s" }}>
        <SectionHeading
          id="support"
          eyebrow="Support"
          title="Contact us"
          description="Use the direct support channels when something feels broken, confusing, or emotionally off for the product's intended low-noise experience."
        />
        <Surface className="space-y-3 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-white/70">
            Found a bug? Have an idea? We read this closely because the product is personal and the details matter.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="chip text-[0.65rem] text-white/60">Email</span>
              <a href="mailto:support@lifeinweeks.app" className="text-[#00d4ff] hover:underline">support@lifeinweeks.app</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="chip text-[0.65rem] text-white/60">Issue</span>
              <span className="text-white/50">
                Report bugs:
                {" "}
                <a href="https://github.com/Anderson413366/life-in-weeks/issues" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:underline">
                  GitHub Issues
                </a>
              </span>
            </div>
          </div>
        </Surface>
      </section>

      {showCalculator && (
        <Suspense fallback={calculatorFallback}>
          <LifeExpectancyCalculator
            isOpen={showCalculator}
            onClose={() => setShowCalculator(false)}
            onAccept={async (years) => {
              setProfileDraft((prev) => ({ ...prev, lifeExpectancy: years }));
              setShowCalculator(false);
              flash("Estimator applied. Save the profile section to keep it.");
            }}
            currentAge={currentAge}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SettingsPage;
