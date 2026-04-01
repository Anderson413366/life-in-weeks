import React, { Suspense, lazy, useMemo, useState } from "react";
import type { LifeStats, DynamicStats, UserAverages } from "../types";
import {
  getBiologyStats, getCosmicStats, getLifeInNumbers,
  getTimeSpent, getBirthdayCountdown, getAlternativeAges, getChineseZodiac,
} from "../lib/lifeData";
import { getGeneration } from "../lib/generations";
import { getZodiacSign } from "../lib/zodiac";

import LifeBattery from "./LifeBattery";
import ExactAgeTicker from "./ExactAgeTicker";
import AccordionSection from "./AccordionSection";
import ProgressBar from "./ProgressBar";
import MilestoneTimeline from "./MilestoneTimeline";
import QuoteBlock from "./QuoteBlock";
import type { MoodEntry } from "../types";
import type { AppMode } from "../lib/theme";

const LOW_MOODS = new Set(["😔", "😢"]);
const LegacySnapshot = lazy(() => import("./LegacySnapshot"));
const BornOnYourDaySection = lazy(() => import("./dashboard/BornOnYourDaySection"));
const HoroscopeSection = lazy(() => import("./dashboard/HoroscopeSection"));

// ADHD-optimized: each mood has its own strong color identity + instant AI response
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

// Solid card styles — NO translucent whites
const CARD = "card-base";
const CARD_SHADOW = "none"; // shadow is now in the .card-base CSS class

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
  mode: AppMode;
  displayName: string;
  onSaveMood: (mood: string, energy: number, note?: string) => Promise<void>;
}

function Stat({ value, label }: { value: number | string; label: string; live?: boolean }) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  // Auto-shrink: use smaller font for long numbers so they never overflow
  const len = display.length;
  const sizeClass = len > 12 ? "text-lg sm:text-xl" : len > 9 ? "text-xl sm:text-2xl" : len > 6 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl";

  return (
    <div className={`${CARD} p-4 sm:p-5 text-center overflow-hidden min-w-0`} style={{ boxShadow: CARD_SHADOW }}>
      <div className={`${sizeClass} font-black text-white counter-digits truncate`}>
        {display}
      </div>
      <div className="text-[0.55rem] sm:text-xs font-bold text-[#00d4ff] uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1.5 truncate">{label}</div>
    </div>
  );
}

function DataRow({ icon, value, label, sub }: { icon: string; value: string | number; label: string; sub?: string }) {
  const display = typeof value === "number" ? value.toLocaleString() : value;
  const len = display.length;
  const sizeClass = len > 12 ? "text-base" : len > 9 ? "text-lg" : "text-xl";

  return (
    <div className={`${CARD} p-4 flex items-center gap-3 overflow-hidden min-w-0`} style={{ boxShadow: CARD_SHADOW }}>
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`${sizeClass} font-black text-white counter-digits truncate`}>{display}</div>
        <div className="text-[0.55rem] sm:text-xs font-bold text-[#00d4ff] uppercase tracking-[0.15em] truncate">{label}</div>
        {sub && <div className="text-[0.55rem] text-white/60 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  lifeStats, dynamicStats, quote, birthYear, birthMonth, birthDay,
  averages, todayMood, recentMoods, mode: _mode, displayName, onSaveMood,
}) => {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const pct = parseFloat(lifeStats.percentageLived);
  const birthDate = useMemo(() => new Date(birthYear, birthMonth - 1, birthDay), [birthYear, birthMonth, birthDay]);
  const todayKey = new Date().toDateString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="flex flex-col gap-10 sm:gap-12 w-full max-w-3xl mx-auto animate-fade-in">
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="flex flex-col items-center pt-4 animate-fade-in" style={{ animationDelay: "0s" }}>
        <div
          className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center animate-pulse-slow"
          style={{ animationDuration: `${pulseDuration}s` }}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
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
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative text-center">
            <div className="text-[4.5rem] font-extrabold text-white leading-none">{pct}<span className="text-3xl">%</span></div>
            <div className="text-xs font-bold text-[#00d4ff] uppercase tracking-[0.3em] mt-1">Of Your Journey</div>
          </div>
        </div>

        {/* Badges — solid navy, cyan accents */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(22,18,38,0.9)] border border-[#00d4ff]/40 text-[#00d4ff]">
            Week {lifeStats.currentWeekInYear} · Year {lifeStats.currentYearOfLife}
          </span>
          {generation && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(22,18,38,0.9)] border border-[#bf5fff]/40 text-[#bf5fff]">
              {generation.emoji} {generation.name}
            </span>
          )}
          {zodiac && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(22,18,38,0.9)] border border-[#00d4ff]/40 text-[#00d4ff]">
              {zodiac.symbol} {zodiac.name}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(22,18,38,0.9)] border border-[#ffd700]/40 text-[#ffd700]">
            {chinese.emoji} {chinese.animal}
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 mt-5">
          <LifeBattery percentUsed={pct} size="md" />
          <button onClick={() => setShowSnapshot(true)}
            className="px-4 py-1.5 rounded-full text-xs card-base text-white/90 hover:text-white hover:border-[#00d4ff]/60 transition-all">
            📸 Share Snapshot
          </button>
          <QuoteBlock quote={quote} />
        </div>
      </section>

      {/* ══ DAILY CHECK-IN ════════════════════════════════════ */}
      <section className="animate-fade-in" style={{ animationDelay: "0.06s" }}>
        <div className={`${CARD} p-6 sm:p-8`} style={{ boxShadow: "0 0 40px rgba(0,212,255,0.08)" }}>
          <p className="text-center text-xs font-bold text-[#00d4ff] uppercase tracking-[0.3em] mb-6">
            How are you feeling right now?
          </p>
          <div className="flex justify-center gap-6 sm:gap-8">
            {MOODS.map((m) => {
              const isSelected = todayMood?.mood === m.emoji;
              return (
                <button
                  key={m.emoji}
                  onClick={() => onSaveMood(m.emoji, m.energy)}
                  className="flex flex-col items-center gap-2 group transition-all duration-200"
                >
                  <div
                    className="text-5xl transition-all duration-200 group-hover:scale-125"
                    style={{
                      filter: isSelected ? `drop-shadow(0 0 16px ${m.glow})` : `drop-shadow(0 0 8px ${m.glow}66)`,
                      transform: isSelected ? "scale(1.15)" : undefined,
                    }}
                  >
                    {m.emoji}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: m.color }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          {todayMood && (() => {
            const mood = MOODS.find((m) => m.emoji === todayMood.mood);
            if (!mood) return null;
            // Pick a response based on the hour so it changes throughout the day
            const responseIdx = new Date().getHours() % mood.responses.length;
            return (
              <div
                key={todayMood.mood + todayMood.date}
                className="mt-5 p-4 rounded-2xl text-center animate-fade-in"
                style={{ backgroundColor: `${mood.color}10`, border: `1px solid ${mood.color}25` }}
              >
                <p className="text-sm leading-relaxed" style={{ color: `${mood.color}dd` }}>
                  {mood.responses[responseIdx]}
                </p>
                <p className="text-[0.6rem] text-white/30 mt-2">
                  {mood.label} · Resets in 3 hours
                </p>
              </div>
            );
          })()}
          {recentMoods.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-[rgba(120,80,200,0.15)]">
              {recentMoods.slice(0, 7).map((m) => <span key={m.date} className="text-lg" title={m.date}>{m.mood}</span>)}
            </div>
          )}
        </div>
      </section>


      {/* ══ ACCORDIONS (gap-2 compact list) ═══════════════════ */}
      <div className="flex flex-col gap-2">

      {/* 1 */}
      <AccordionSection title="Your Exact Age" icon="🕐">
        <ExactAgeTicker birthDate={birthDate} birthYear={birthYear} />
      </AccordionSection>

      {/* 2 */}
      <AccordionSection title="Birthday Countdown" icon="🎂">
        <div className={`${CARD} p-6 max-w-sm mx-auto text-center`} style={{ boxShadow: CARD_SHADOW }}>
          <div className="text-3xl mb-2">🎂</div>
          <div className="text-4xl font-black text-white counter-digits">{birthday.daysUntil}</div>
          <div className="text-xs font-bold text-[#00d4ff] uppercase tracking-[0.2em] mt-1">days until you turn {birthday.turningAge}</div>
          <div className="text-xs text-white/60 mt-1">{birthday.nextBirthdayDate}</div>
        </div>
      </AccordionSection>

      {/* 3 */}
      <AccordionSection title="Born On Your Day" icon="🌟">
        <Suspense fallback={featureFallback}>
          <BornOnYourDaySection
            birthMonth={birthMonth}
            birthDay={birthDay}
            cardClassName={CARD}
          />
        </Suspense>
      </AccordionSection>

      {/* 4 */}
      <AccordionSection title={isLowMood ? "Look How Far You've Come" : "Life at a Glance"} icon="📊">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={lifeStats.daysPassed} label="Days Lived" />
          {isLowMood ? <Stat value={numbers.laughs} label="Times Laughed" /> : <Stat value={lifeStats.daysRemaining} label="Days Remaining" />}
          <Stat value={lifeStats.weeksPassed} label="Weeks Lived" />
          {isLowMood ? <Stat value={cosmic.sunrises} label="Sunrises Seen" /> : <Stat value={lifeStats.weeksRemaining} label="Weeks Remaining" />}
        </div>
      </AccordionSection>

      {/* 5 */}
      <AccordionSection title={isLowMood ? "Every Second Is a Gift" : "Live Chronometer"} icon="⏱️">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat value={dynamicStats.hoursLived} label="Hours Lived" live />
          <Stat value={dynamicStats.minutesLived} label="Minutes Lived" live />
          <Stat value={dynamicStats.secondsLived} label="Seconds Lived" live />
          {!isLowMood && <Stat value={dynamicStats.hoursRemaining} label="Hours Rem." live />}
          {!isLowMood && <Stat value={dynamicStats.minutesRemaining} label="Minutes Rem." live />}
          {!isLowMood && <Stat value={dynamicStats.secondsRemaining} label="Seconds Rem." live />}
        </div>
      </AccordionSection>

      {/* 6 */}
      <AccordionSection title="Waking Life" icon="☀️">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={dynamicStats.wakingHoursLived} label="Waking Hours Lived" live />
          <Stat value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem." live />
        </div>
      </AccordionSection>

      {/* 7 */}
      <AccordionSection title="Body & Biology" icon="💓">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="💓" value={biology.heartbeats} label="Heartbeats" sub={`~${bpm} bpm`} />
          <DataRow icon="🌬️" value={biology.breaths} label="Breaths Taken" sub={`~${averages.avg_breaths_per_min}/min`} />
          <DataRow icon="👁️" value={biology.blinks} label="Blinks" sub={`~${averages.avg_blinks_per_min}/min`} />
          <DataRow icon="😴" value={`${biology.yearsSlept} yrs`} label="Time Sleeping" sub={`${biology.hoursSlept.toLocaleString()} hours`} />
          <DataRow icon="🍽️" value={numbers.mealsEaten} label="Meals Eaten" sub={`~${averages.meals_per_day}/day`} />
          <DataRow icon="😄" value={numbers.laughs} label="Times Laughed" sub={`~${averages.avg_laughs_per_day}/day`} />
        </div>
      </AccordionSection>

      {/* 8 */}
      <AccordionSection title="Unique Human Facts" icon="🧬">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="🩸" value={Math.round(lifeStats.daysPassed * 7570)} label="Liters of Blood Pumped" sub="heart pumps ~5L/min" />
          <DataRow icon="🦠" value={`${(lifeStats.daysPassed * 330).toLocaleString()}B`} label="New Cells Created" sub="~330 billion/day" />
          <DataRow icon="💧" value={Math.round(lifeStats.daysPassed * 2.5)} label="Liters of Saliva" sub="~2.5L/day" />
          <DataRow icon="🧠" value={Math.round(lifeStats.daysPassed * 70000)} label="Thoughts Processed" sub="~70,000/day" />
          <DataRow icon="👃" value={Math.round(lifeStats.daysPassed * 23040)} label="Breaths While Sleeping" sub="~8 hrs × 16/min" />
          <DataRow icon="🎵" value={Math.round(lifeStats.daysPassed * 4)} label="Hours of Heartbeat Music" sub={`at ${bpm}bpm`} />
        </div>
      </AccordionSection>

      {/* 9 */}
      <AccordionSection title="Life in Numbers" icon="😄">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="💬" value={numbers.wordsSpoken} label="Words Spoken" sub={`~${averages.avg_words_per_day.toLocaleString()}/day`} />
          <DataRow icon="💭" value={numbers.dreamsHad} label="Dreams Had" sub="~4/night" />
          <DataRow icon="📱" value={`${timeSpent.screenTimeYears} yrs`} label="Screen Time" sub={`~${averages.avg_screen_hours} hrs/day`} />
          <DataRow icon="🍳" value={`${timeSpent.eatingMonths} mo`} label="Time Eating" />
          <DataRow icon="🚶" value={numbers.stepsTaken} label="Steps Taken" sub={`~${averages.avg_steps_per_day.toLocaleString()}/day`} />
        </div>
      </AccordionSection>

      {/* 10 */}
      <AccordionSection title="Current Rhythms" icon="📈">
        <div className="flex flex-col gap-3">
          <ProgressBar label="Today" value={dynamicStats.percentDayPassed} color="bg-[#0891b2]" index={0} />
          <ProgressBar label="This Month" value={dynamicStats.percentMonthPassed} color="bg-[#ec4899]" index={1} />
          <ProgressBar label="This Year" value={dynamicStats.percentYearPassed} color="bg-[#4caf50]" index={2} />
        </div>
      </AccordionSection>

      {/* 11 */}
      <AccordionSection title="Life Milestones" icon="🏁">
        <MilestoneTimeline milestones={[
          { title: "Quarter Life", date: lifeStats.milestones.quarter, color: "#4CAF50" },
          { title: "Halfway Point", date: lifeStats.milestones.halfway, color: "#2196F3" },
          { title: "Three-Quarter Mark", date: lifeStats.milestones.threeQuarter, color: "#9C27B0" },
        ]} />
      </AccordionSection>

      {/* 12 */}
      <AccordionSection title="Cosmic Perspective" icon="🌍">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="🌍" value={cosmic.orbitsAroundSun} label="Orbits Around the Sun" />
          <DataRow icon="🚀" value={`${(cosmic.distanceThroughSpaceMiles / 1e9).toFixed(1)}B mi`} label="Through Space" sub={`${(cosmic.distanceThroughSpaceKm / 1e9).toFixed(1)}B km`} />
          <DataRow icon="🌕" value={cosmic.fullMoons} label="Full Moons" />
          <DataRow icon="🌅" value={cosmic.sunrises} label="Sunrises" />
          <DataRow icon="🍂" value={cosmic.seasonsExperienced} label="Seasons" />
        </div>
      </AccordionSection>

      {/* 13 */}
      <AccordionSection title="Your Age on Other Planets" icon="🪐">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { icon: "☿", name: "Mercury", val: altAges.mercuryYears },
            { icon: "♀", name: "Venus", val: altAges.venusYears },
            { icon: "♂", name: "Mars", val: altAges.marsYears },
            { icon: "♃", name: "Jupiter", val: altAges.jupiterYears },
            { icon: "🐕", name: "Dog Yrs", val: altAges.dogYears },
            { icon: "🐈", name: "Cat Yrs", val: altAges.catYears },
          ].map((p) => (
            <div key={p.name} className={`${CARD} p-2 sm:p-3 text-center overflow-hidden min-w-0`}>
              <div className="text-base sm:text-lg mb-0.5">{p.icon}</div>
              <div className="text-sm sm:text-base font-black text-white counter-digits truncate">{p.val}</div>
              <div className="text-[0.45rem] sm:text-[0.5rem] font-bold text-[#00d4ff] uppercase tracking-wider mt-0.5 truncate">{p.name}</div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* 14 */}
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
            cardShadow={CARD_SHADOW}
          />
        </Suspense>
      </AccordionSection>

      </div>{/* end accordion wrapper */}

      {showSnapshot && (
        <Suspense fallback={snapshotFallback}>
          <LegacySnapshot isOpen={showSnapshot} onClose={() => setShowSnapshot(false)}
            lifeStats={lifeStats} birthYear={birthYear} birthMonth={birthMonth} birthDay={birthDay}
            displayName={displayName} todayMood={todayMood} />
        </Suspense>
      )}
    </div>
  );
};

export default DashboardPage;
