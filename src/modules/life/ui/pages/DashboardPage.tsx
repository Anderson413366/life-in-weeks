import React, { Suspense, lazy, useMemo, useState } from "react";
import type { MoodEntry } from "@/modules/mood";
import type { AppMode } from "@/modules/preferences";
import { AccordionSection, Button, InfoCard, Pill, ProgressBar, QuoteBlock, SectionPanel, Surface } from "@/shared/ui/components";

import type { DynamicStats, LifeStats, UserAverages } from "../../types/life.types";
import {
  getBiologyStats,
  getCosmicStats,
  getLifeInNumbers,
  getTimeSpent,
  getBirthdayCountdown,
  getAlternativeAges,
  getChineseZodiac,
} from "../../service/life.service";
import { getGeneration, getZodiacSign } from "../../repository/life.repository";

import LifeBattery from "../components/LifeBattery";
import ExactAgeTicker from "../components/ExactAgeTicker";
import MilestoneTimeline from "../components/MilestoneTimeline";

const LOW_MOODS = new Set(["😔", "😢"]);
const LegacySnapshot = lazy(() => import("../components/LegacySnapshot"));
const BornOnYourDaySection = lazy(() => import("../components/dashboard/BornOnYourDaySection"));
const HoroscopeSection = lazy(() => import("../components/dashboard/HoroscopeSection"));

const MOODS = [
  { emoji: "😄", label: "Amazing", energy: 5, color: "#00ff9d", glow: "#00ff9d", responses: [
    "That energy is contagious! You're literally lighting up the world today. 🌟",
    "Amazing days are proof that life rewards those who keep going. Enjoy every second!",
    "Your joy right now? It took years of resilience to build. You earned this. ✨",
    "This is the version of you that future-you will look back on with pride.",
  ]},
  { emoji: "🙂", label: "Good", energy: 4, color: "#00d4ff", glow: "#00d4ff", responses: [
    "Good is powerful. Consistency in good days builds an extraordinary life. 💙",
    "A good day is never 'just' good — it's the foundation everything great is built on.",
    "You're in flow today. That quiet confidence? It's your superpower.",
    "The best days often don't feel dramatic — they feel exactly like this. Steady and strong.",
  ]},
  { emoji: "😐", label: "Okay", energy: 3, color: "#ffd700", glow: "#ffd700", responses: [
    "'Okay' is honest, and honesty takes courage. Tomorrow might surprise you. 🌤",
    "Even neutral days move you forward. You're still here, still growing.",
    "Not every day needs to be a highlight. Rest days count too.",
    "An 'okay' day is still a day you showed up. That matters more than you think.",
  ]},
  { emoji: "😔", label: "Low", energy: 2, color: "#ff6b00", glow: "#ff6b00", responses: [
    "Low days are not failures — they're signals that you need care right now. Be gentle with yourself. 🧡",
    "You've survived 100% of your worst days. This one won't break that streak.",
    "\"The wound is the place where the light enters you.\" — Rumi. Rest. Heal. Rise.",
    "It's okay to not be okay. Your strength isn't measured by how you feel today — it's measured by the fact that you're still here.",
  ]},
  { emoji: "😢", label: "Struggling", energy: 1, color: "#ec4899", glow: "#ec4899", responses: [
    "I see you. This pain is real, but it is not permanent. You are stronger than this moment. 💗",
    "Right now is hard. But you've made it through hard before. You will again.",
    "\"Stars can't shine without darkness.\" You're in the dark right now, but your light hasn't gone out.",
    "Please talk to someone you trust today. You deserve support. You are not alone. 🤝",
  ]},
];

const CARD = "app-surface app-surface--panel";

interface DashboardPageProps {
  lifeStats: LifeStats;
  dynamicStats: DynamicStats;
  quote: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  averages: UserAverages;
  todayMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  diaryEntryCount: number;
  hasApiKey: boolean;
  mode: AppMode;
  displayName: string;
  onSaveMood: (mood: string, energy: number, note?: string) => Promise<void>;
  onNavigate: (page: "grid" | "diary" | "settings") => void;
}

function Stat({ value, label, isFocus = false }: { value: number | string; label: string; live?: boolean; isFocus?: boolean }) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  const len = display.length;
  const sizeClass = len > 12 ? "text-lg sm:text-xl" : len > 9 ? "text-xl sm:text-2xl" : len > 6 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl";

  return (
    <Surface className="p-4 sm:p-5 text-center overflow-hidden min-w-0">
      <div className={`${sizeClass} font-black text-white counter-digits truncate`}>{display}</div>
      <div className={`text-[0.55rem] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1.5 truncate ${isFocus ? "text-white/65" : "text-[#00d4ff]"}`}>
        {label}
      </div>
    </Surface>
  );
}

function DataRow({ icon, value, label, sub, isFocus = false }: { icon: string; value: string | number; label: string; sub?: string; isFocus?: boolean }) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  const len = display.length;
  const sizeClass = len > 12 ? "text-base" : len > 9 ? "text-lg" : "text-xl";

  return (
    <Surface className="p-4 flex items-center gap-3 overflow-hidden min-w-0">
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`${sizeClass} font-black text-white counter-digits truncate`}>{display}</div>
        <div className={`text-[0.55rem] sm:text-xs font-bold uppercase tracking-[0.15em] truncate ${isFocus ? "text-white/65" : "text-[#00d4ff]"}`}>{label}</div>
        {sub ? <div className={`text-[0.55rem] mt-0.5 truncate ${isFocus ? "text-white/55" : "text-white/60"}`}>{sub}</div> : null}
      </div>
    </Surface>
  );
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  lifeStats,
  dynamicStats,
  quote,
  birthYear,
  birthMonth,
  birthDay,
  averages,
  todayMood,
  recentMoods,
  diaryEntryCount,
  hasApiKey,
  mode,
  displayName,
  onSaveMood,
  onNavigate,
}) => {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const pct = parseFloat(lifeStats.percentageLived);
  const birthDate = useMemo(() => new Date(birthYear, birthMonth - 1, birthDay), [birthYear, birthMonth, birthDay]);
  const todayKey = new Date().toDateString();
  const now = useMemo(() => new Date(), [todayKey]);
  const isLowMood = todayMood ? LOW_MOODS.has(todayMood.mood) : false;

  const biology = useMemo(() => getBiologyStats(birthDate, now, averages), [birthDate, now, averages]);
  const cosmic = useMemo(() => getCosmicStats(birthDate, now), [birthDate, now]);
  const numbers = useMemo(() => getLifeInNumbers(birthDate, now, averages), [birthDate, now, averages]);
  const timeSpent = useMemo(() => getTimeSpent(birthDate, now, averages), [birthDate, now, averages]);
  const birthday = useMemo(() => getBirthdayCountdown(birthDate, now), [birthDate, now]);
  const altAges = useMemo(() => getAlternativeAges(birthDate, now), [birthDate, now]);

  const generation = useMemo(() => getGeneration(birthYear), [birthYear]);
  const zodiac = useMemo(() => getZodiacSign(birthMonth, birthDay), [birthMonth, birthDay]);
  const chinese = useMemo(() => getChineseZodiac(birthYear), [birthYear]);
  const bpm = averages.avg_heartbeats_per_min;
  const pulseDuration = 60 / bpm;
  const currentAge = Math.floor(lifeStats.daysPassed / 365.25);
  const snapshotFallback = <div className="text-xs text-white/40 text-center py-4">Loading snapshot...</div>;
  const featureFallback = <div className="text-xs text-white/40 text-center py-4">Loading feature...</div>;
  const isFocus = mode === "focus";
  const badgeBase = isFocus
    ? "bg-white/[0.06] border border-white/15 text-white/80"
    : "bg-[rgba(22,18,38,0.9)]";
  const primaryBadge = isFocus ? badgeBase : `${badgeBase} border border-[#00d4ff]/40 text-[#00d4ff]`;
  const secondaryBadge = isFocus ? badgeBase : `${badgeBase} border border-[#bf5fff]/40 text-[#bf5fff]`;
  const warmBadge = isFocus ? badgeBase : `${badgeBase} border border-[#ffd700]/40 text-[#ffd700]`;
  const heroRingStart = isFocus ? "#ffffff" : "#00d4ff";
  const heroRingEnd = isFocus ? "#d7d7d7" : "#ec4899";
  const moodLabel = MOODS.find((item) => item.emoji === todayMood?.mood)?.label;
  const homePriorities = [
    todayMood
      ? {
          title: "Mood checked in",
          description: `${todayMood.mood} ${moodLabel ?? "Tracked"} for today. Home is already reflecting the emotional tone of this week.`,
        }
      : {
          title: "Check in now",
          description: "Save today's mood before you drift into the deeper numbers. It keeps Home grounded in the present.",
        },
    diaryEntryCount > 0
      ? {
          title: "Journal archive ready",
          description: `${diaryEntryCount} saved week${diaryEntryCount === 1 ? "" : "s"} already power your grid and searchable diary history.`,
        }
      : {
          title: "Capture your first week",
          description: "Open Diary and save one honest note. The product becomes far more useful as soon as the first week exists.",
        },
    hasApiKey
      ? {
          title: "AI tools available",
          description: "Time Mirror and AI-assisted reflection modules are ready when you want them.",
        }
      : {
          title: "AI remains optional",
          description: "Core reflection is fully usable without AI. Add a Gemini key in Settings only if you want the extra tools.",
        },
  ];

  return (
    <div className="flex flex-col gap-10 sm:gap-12 w-full max-w-5xl mx-auto animate-fade-in">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] animate-fade-in">
        <Surface variant="hero">
          <div className="space-y-3">
            <p className="eyebrow">Home</p>
            <div className="space-y-2">
              <h1 className="page-hero__title">
                {displayName ? `${displayName}, start with today.` : "Start with today."}
              </h1>
              <p className="page-hero__description">
                Check in, scan the current week, and choose the next best action before you open the deeper life stats.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => onNavigate("diary")} variant="primary">
              Capture this week
            </Button>
            <Button onClick={() => onNavigate("grid")}>
              Open Life Grid
            </Button>
            <Button onClick={() => onNavigate("settings")} variant="quiet">
              Review settings
            </Button>
          </div>

          <div className="status-stack mt-5">
            {homePriorities.map((priority, index) => (
              <InfoCard
                key={priority.title}
                title={priority.title}
                description={priority.description}
                tone={index === 0 && !todayMood ? "accent" : "neutral"}
              />
            ))}
          </div>
        </Surface>

        <Surface variant="hero">
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent" className={primaryBadge}>
              Week {lifeStats.currentWeekInYear} · Year {lifeStats.currentYearOfLife}
            </Pill>
            {generation ? (
              <Pill className={secondaryBadge}>
                {generation.emoji} {generation.name}
              </Pill>
            ) : null}
            {zodiac ? (
              <Pill tone="accent" className={primaryBadge}>
                {zodiac.symbol} {zodiac.name}
              </Pill>
            ) : null}
            <Pill tone="warm" className={warmBadge}>
              {chinese.emoji} {chinese.animal}
            </Pill>
          </div>

          <div
            className="relative mx-auto mt-6 flex h-56 w-56 items-center justify-center animate-pulse-slow sm:h-60 sm:w-60"
            style={{ animationDuration: `${pulseDuration}s` }}
          >
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r="125" fill="none" stroke="rgba(120,80,200,0.15)" strokeWidth="12" />
              <circle
                cx="140" cy="140" r="125" fill="none"
                stroke="url(#hero-ring-grad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 125}
                strokeDashoffset={2 * Math.PI * 125 - (pct / 100) * 2 * Math.PI * 125}
                className="transition-all duration-700 ease-out"
                style={{ filter: "drop-shadow(0 0 20px rgba(0,212,255,0.5))" }}
              />
              <defs>
                <linearGradient id="hero-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={heroRingStart} />
                  <stop offset="100%" stopColor={heroRingEnd} />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative text-center">
              <div className="text-[3.5rem] font-extrabold text-white leading-none sm:text-[4rem]">
                {pct}
                <span className="text-2xl sm:text-3xl">%</span>
              </div>
              <div className={`text-xs font-bold uppercase tracking-[0.3em] mt-1 ${isFocus ? "text-white/70" : "text-[#00d4ff]"}`}>
                Life lived
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="metric-tile">
              <p className="metric-tile__label">Diary</p>
              <p className="metric-tile__value">{diaryEntryCount} saved weeks</p>
            </div>
            <div className="metric-tile">
              <p className="metric-tile__label">Today</p>
              <p className="metric-tile__value">{todayMood ? `${todayMood.mood} ${moodLabel ?? "Tracked"}` : "No mood yet"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-start gap-3">
            <LifeBattery percentUsed={pct} size="md" />
            <Button onClick={() => setShowSnapshot(true)} size="sm">
              Share snapshot
            </Button>
            <QuoteBlock quote={quote} />
          </div>
        </Surface>
      </section>

      <SectionPanel
        className="animate-fade-in"
        tone={todayMood ? "neutral" : "accent"}
        eyebrow="Today"
        title={todayMood ? "Mood is checked in." : "Check in before the numbers take over."}
        description={todayMood
          ? "The dashboard is now grounded in your current emotional state."
          : "One tap gives the rest of the app a better signal for today's reflection."}
      >
          <div className="mood-grid">
            {MOODS.map((m) => {
              const isSelected = todayMood?.mood === m.emoji;
              return (
                <button
                  key={m.emoji}
                  onClick={() => onSaveMood(m.emoji, m.energy)}
                  className="mood-option"
                  aria-pressed={isSelected}
                  style={{
                    "--mood-color": isFocus ? "#ffffff" : m.color,
                    "--mood-glow": isFocus ? "rgba(255,255,255,0.4)" : m.glow,
                  } as React.CSSProperties}
                >
                  <div className="mood-option__glyph">
                    {m.emoji}
                  </div>
                  <span className="mood-option__label">
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          {todayMood ? (() => {
            const mood = MOODS.find((m) => m.emoji === todayMood.mood);
            if (!mood) return null;
            const responseIdx = new Date().getHours() % mood.responses.length;
            return (
              <div
                key={todayMood.mood + todayMood.date}
                className="mood-response mt-5 animate-fade-in"
                style={{
                  backgroundColor: isFocus ? "rgba(255,255,255,0.06)" : `${mood.color}10`,
                  border: isFocus ? "1px solid rgba(255,255,255,0.18)" : `1px solid ${mood.color}25`,
                }}
              >
                <p className="text-sm leading-relaxed" style={{ color: isFocus ? "rgba(255,255,255,0.84)" : `${mood.color}dd` }}>
                  {mood.responses[responseIdx]}
                </p>
                <p className={`text-[0.6rem] mt-2 ${isFocus ? "text-white/55" : "text-white/30"}`}>
                  {mood.label} · Resets in 3 hours
                </p>
              </div>
            );
          })() : null}
          {recentMoods.length > 1 ? (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-[rgba(120,80,200,0.15)]">
              {recentMoods.slice(0, 7).map((m) => <span key={m.id} className="text-lg" title={m.date}>{m.mood}</span>)}
            </div>
          ) : null}
      </SectionPanel>

      <div className="flex flex-col gap-2">
        <SectionPanel
          eyebrow="Deep Dive"
          title="Details, perspective, and long-range context."
          description="The daily surface stays short. Open these panels only when you want the richer view of a whole life."
          actions={<span className="chip text-[0.68rem] text-white/70">14 expandable views</span>}
        />

        <AccordionSection title="Your Exact Age" icon="🕐">
          <ExactAgeTicker birthDate={birthDate} birthYear={birthYear} />
        </AccordionSection>

        <AccordionSection title="Birthday Countdown" icon="🎂">
          <Surface className="p-6 max-w-sm mx-auto text-center">
            <div className="text-3xl mb-2">🎂</div>
            <div className="text-4xl font-black text-white counter-digits">{birthday.daysUntil}</div>
            <div className="text-xs font-bold text-[#00d4ff] uppercase tracking-[0.2em] mt-1">days until you turn {birthday.turningAge}</div>
            <div className="text-xs text-white/60 mt-1">{birthday.nextBirthdayDate}</div>
          </Surface>
        </AccordionSection>

        <AccordionSection title="Born On Your Day" icon="🌟">
          <Suspense fallback={featureFallback}>
            <BornOnYourDaySection birthMonth={birthMonth} birthDay={birthDay} cardClassName={CARD} />
          </Suspense>
        </AccordionSection>

        <AccordionSection title={isLowMood ? "Look How Far You've Come" : "Life at a Glance"} icon="📊" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <Stat value={lifeStats.daysPassed} label="Days Lived" isFocus={isFocus} />
            {isLowMood ? <Stat value={numbers.laughs} label="Times Laughed" isFocus={isFocus} /> : <Stat value={lifeStats.daysRemaining} label="Days Remaining" isFocus={isFocus} />}
            <Stat value={lifeStats.weeksPassed} label="Weeks Lived" isFocus={isFocus} />
            {isLowMood ? <Stat value={cosmic.sunrises} label="Sunrises Seen" isFocus={isFocus} /> : <Stat value={lifeStats.weeksRemaining} label="Weeks Remaining" isFocus={isFocus} />}
          </div>
        </AccordionSection>

        <AccordionSection title={isLowMood ? "Every Second Is a Gift" : "Live Chronometer"} icon="⏱️">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat value={dynamicStats.hoursLived} label="Hours Lived" live isFocus={isFocus} />
            <Stat value={dynamicStats.minutesLived} label="Minutes Lived" live isFocus={isFocus} />
            <Stat value={dynamicStats.secondsLived} label="Seconds Lived" live isFocus={isFocus} />
            {!isLowMood ? <Stat value={dynamicStats.hoursRemaining} label="Hours Rem." live isFocus={isFocus} /> : null}
            {!isLowMood ? <Stat value={dynamicStats.minutesRemaining} label="Minutes Rem." live isFocus={isFocus} /> : null}
            {!isLowMood ? <Stat value={dynamicStats.secondsRemaining} label="Seconds Rem." live isFocus={isFocus} /> : null}
          </div>
        </AccordionSection>

        <AccordionSection title="Waking Life" icon="☀️">
          <div className="grid grid-cols-2 gap-3">
            <Stat value={dynamicStats.wakingHoursLived} label="Waking Hours Lived" live isFocus={isFocus} />
            <Stat value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem." live isFocus={isFocus} />
          </div>
        </AccordionSection>

        <AccordionSection title="Body & Biology" icon="💓">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataRow icon="💓" value={biology.heartbeats} label="Heartbeats" sub={`~${bpm} bpm`} isFocus={isFocus} />
            <DataRow icon="🌬️" value={biology.breaths} label="Breaths Taken" sub={`~${averages.avg_breaths_per_min}/min`} isFocus={isFocus} />
            <DataRow icon="👁️" value={biology.blinks} label="Blinks" sub={`~${averages.avg_blinks_per_min}/min`} isFocus={isFocus} />
            <DataRow icon="😴" value={`${biology.yearsSlept} yrs`} label="Time Sleeping" sub={`${biology.hoursSlept.toLocaleString()} hours`} isFocus={isFocus} />
            <DataRow icon="🍽️" value={numbers.mealsEaten} label="Meals Eaten" sub={`~${averages.meals_per_day}/day`} isFocus={isFocus} />
            <DataRow icon="😄" value={numbers.laughs} label="Times Laughed" sub={`~${averages.avg_laughs_per_day}/day`} isFocus={isFocus} />
          </div>
        </AccordionSection>

        <AccordionSection title="Unique Human Facts" icon="🧬">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataRow icon="🩸" value={Math.round(lifeStats.daysPassed * 7570)} label="Liters of Blood Pumped" sub="heart pumps ~5L/min" isFocus={isFocus} />
            <DataRow icon="🦠" value={`${(lifeStats.daysPassed * 330).toLocaleString()}B`} label="New Cells Created" sub="~330 billion/day" isFocus={isFocus} />
            <DataRow icon="💧" value={Math.round(lifeStats.daysPassed * 2.5)} label="Liters of Saliva" sub="~2.5L/day" isFocus={isFocus} />
            <DataRow icon="🧠" value={Math.round(lifeStats.daysPassed * 70000)} label="Thoughts Processed" sub="~70,000/day" isFocus={isFocus} />
            <DataRow icon="👃" value={Math.round(lifeStats.daysPassed * 23040)} label="Breaths While Sleeping" sub="~8 hrs × 16/min" isFocus={isFocus} />
            <DataRow icon="🎵" value={Math.round(lifeStats.daysPassed * 4)} label="Hours of Heartbeat Music" sub={`at ${bpm}bpm`} isFocus={isFocus} />
          </div>
        </AccordionSection>

        <AccordionSection title="Life in Numbers" icon="😄">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataRow icon="💬" value={numbers.wordsSpoken} label="Words Spoken" sub={`~${averages.avg_words_per_day.toLocaleString()}/day`} isFocus={isFocus} />
            <DataRow icon="💭" value={numbers.dreamsHad} label="Dreams Had" sub="~4/night" isFocus={isFocus} />
            <DataRow icon="📱" value={`${timeSpent.screenTimeYears} yrs`} label="Screen Time" sub={`~${averages.avg_screen_hours} hrs/day`} isFocus={isFocus} />
            <DataRow icon="🍳" value={`${timeSpent.eatingMonths} mo`} label="Time Eating" isFocus={isFocus} />
            <DataRow icon="🚶" value={numbers.stepsTaken} label="Steps Taken" sub={`~${averages.avg_steps_per_day.toLocaleString()}/day`} isFocus={isFocus} />
          </div>
        </AccordionSection>

        <AccordionSection title="Current Rhythms" icon="📈" defaultOpen>
          <div className="flex flex-col gap-3">
            <ProgressBar label="Today" value={dynamicStats.percentDayPassed} color="bg-[#0891b2]" index={0} />
            <ProgressBar label="This Month" value={dynamicStats.percentMonthPassed} color="bg-[#ec4899]" index={1} />
            <ProgressBar label="This Year" value={dynamicStats.percentYearPassed} color="bg-[#4caf50]" index={2} />
          </div>
        </AccordionSection>

        <AccordionSection title="Life Milestones" icon="🏁">
          <MilestoneTimeline milestones={[
            { title: "Quarter Life", date: lifeStats.milestones.quarter, color: "#4CAF50" },
            { title: "Halfway Point", date: lifeStats.milestones.halfway, color: "#2196F3" },
            { title: "Three-Quarter Mark", date: lifeStats.milestones.threeQuarter, color: "#9C27B0" },
          ]} />
        </AccordionSection>

        <AccordionSection title="Cosmic Perspective" icon="🌍">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataRow icon="🌍" value={cosmic.orbitsAroundSun} label="Orbits Around the Sun" isFocus={isFocus} />
            <DataRow icon="🚀" value={`${(cosmic.distanceThroughSpaceMiles / 1e9).toFixed(1)}B mi`} label="Through Space" sub={`${(cosmic.distanceThroughSpaceKm / 1e9).toFixed(1)}B km`} isFocus={isFocus} />
            <DataRow icon="🌕" value={cosmic.fullMoons} label="Full Moons" isFocus={isFocus} />
            <DataRow icon="🌅" value={cosmic.sunrises} label="Sunrises" isFocus={isFocus} />
            <DataRow icon="🍂" value={cosmic.seasonsExperienced} label="Seasons" isFocus={isFocus} />
          </div>
        </AccordionSection>

        <AccordionSection title="Your Age on Other Planets" icon="🪐">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { icon: "☿", name: "Mercury", val: altAges.mercuryYears },
              { icon: "♀", name: "Venus", val: altAges.venusYears },
              { icon: "♂", name: "Mars", val: altAges.marsYears },
              { icon: "♃", name: "Jupiter", val: altAges.jupiterYears },
              { icon: "🐕", name: "Dog Yrs", val: altAges.dogYears },
              { icon: "🐈", name: "Cat Yrs", val: altAges.catYears },
            ].map((planet) => (
              <div key={planet.name} className={`${CARD} p-2 sm:p-3 text-center overflow-hidden min-w-0`}>
                <div className="text-base sm:text-lg mb-0.5">{planet.icon}</div>
                <div className="text-sm sm:text-base font-black text-white counter-digits truncate">{planet.val}</div>
                <div className={`text-[0.45rem] sm:text-[0.5rem] font-bold uppercase tracking-wider mt-0.5 truncate ${isFocus ? "text-white/65" : "text-[#00d4ff]"}`}>
                  {planet.name}
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection title={`Your ${zodiac?.name ?? ""} Horoscope`} icon="✨">
          <Suspense fallback={featureFallback}>
            <HoroscopeSection
              zodiacSign={zodiac?.name ?? "Aries"}
              zodiacElement={zodiac?.element ?? "Fire"}
              birthMonth={birthMonth}
              birthDay={birthDay}
              birthYear={birthYear}
              currentAge={currentAge}
              lifePercent={lifeStats.percentageLived}
              cardClassName={CARD}
              cardShadow=""
            />
          </Suspense>
        </AccordionSection>
      </div>

      {showSnapshot ? (
        <Suspense fallback={snapshotFallback}>
          <LegacySnapshot
            isOpen={showSnapshot}
            onClose={() => setShowSnapshot(false)}
            lifeStats={lifeStats}
            birthYear={birthYear}
            birthMonth={birthMonth}
            birthDay={birthDay}
            displayName={displayName}
            todayMood={todayMood}
          />
        </Suspense>
      ) : null}
    </div>
  );
};

export default DashboardPage;
