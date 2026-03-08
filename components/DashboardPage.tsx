import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LifeStats, DynamicStats, UserAverages } from "../types";
import {
  getBiologyStats, getCosmicStats, getLifeInNumbers,
  getTimeSpent, getBirthdayCountdown, getAlternativeAges, getChineseZodiac,
} from "../lib/lifeData";
import { getGeneration } from "../lib/generations";
import { getZodiacSign } from "../lib/zodiac";
import { useHoroscope } from "../hooks/useHoroscope";

import LifeBattery from "./LifeBattery";
import ExactAgeTicker from "./ExactAgeTicker";
import AccordionSection from "./AccordionSection";
import ProgressBar from "./ProgressBar";
import MilestoneTimeline from "./MilestoneTimeline";
import AIInsightBanner from "./AIInsightBanner";
import LegacySnapshot from "./LegacySnapshot";
import type { MoodEntry } from "../hooks/useMood";
import type { AppMode } from "../lib/theme";

const LOW_MOODS = new Set(["😔", "😢"]);

const MOODS = [
  { emoji: "😄", label: "Great",  energy: 5 },
  { emoji: "🙂", label: "Good",   energy: 4 },
  { emoji: "😐", label: "Okay",   energy: 3 },
  { emoji: "😔", label: "Low",    energy: 2 },
  { emoji: "😢", label: "Rough",  energy: 1 },
];

// Premium glassmorphism
const GLASS = "bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]";
const GLASS_BRIGHT = "bg-white/[0.10] backdrop-blur-xl border border-white/25 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]";

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

const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
});

function Stat({ value, label }: { value: number | string; label: string; live?: boolean }) {
  return (
    <div className={`${GLASS} p-5 text-center`}>
      <div className="text-3xl sm:text-4xl font-black text-white counter-digits">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[0.55rem] text-[#00d4ff] uppercase tracking-[0.2em] font-semibold mt-1.5">{label}</div>
    </div>
  );
}

function DataRow({ icon, value, label, sub }: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div className={`${GLASS} p-4 flex items-center gap-4`}>
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <div className="text-xl font-black text-white counter-digits">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <div className="text-[0.55rem] text-[#00d4ff] uppercase tracking-[0.2em] font-semibold">{label}</div>
        {sub && <div className="text-[0.5rem] text-white/30 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  lifeStats, dynamicStats, quote, birthYear, birthMonth, birthDay,
  averages, todayMood, recentMoods, mode, displayName, onSaveMood,
}) => {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const pct = parseFloat(lifeStats.percentageLived);
  const birthDate = useMemo(() => new Date(birthYear, birthMonth - 1, birthDay), [birthYear, birthMonth, birthDay]);
  const now = useMemo(() => new Date(), []);
  const isLowMood = todayMood ? LOW_MOODS.has(todayMood.mood) : false;

  const biology = useMemo(() => getBiologyStats(birthDate, now, averages), [birthDate, now, averages]);
  const cosmic = useMemo(() => getCosmicStats(birthDate, now), [birthDate, now]);
  const numbers = useMemo(() => getLifeInNumbers(birthDate, now, averages), [birthDate, now, averages]);
  const timeSpent = useMemo(() => getTimeSpent(birthDate, now, averages), [birthDate, now, averages]);
  const birthday = useMemo(() => getBirthdayCountdown(birthDate, now), [birthDate, now]);
  const altAges = useMemo(() => getAlternativeAges(birthDate, now), [birthDate, now]);

  const generation = getGeneration(birthYear);
  const zodiac = getZodiacSign(birthMonth, birthDay);
  const chinese = getChineseZodiac(birthYear);
  const bpm = averages.avg_heartbeats_per_min;
  const pulseDuration = 60 / bpm;
  const currentAge = Math.floor(lifeStats.daysPassed / 365.25);

  const horoscope = useHoroscope(
    zodiac?.name ?? "Aries", zodiac?.element ?? "Fire",
    birthMonth, birthDay, birthYear, currentAge, lifeStats.percentageLived,
  );

  return (
    <motion.div
      className="flex flex-col gap-10 sm:gap-12 w-full max-w-3xl mx-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <motion.section className="flex flex-col items-center pt-4" {...fade(0)}>
        <p className="text-sm italic text-white/40 font-light max-w-md text-center leading-relaxed mb-8">"{quote}"</p>

        <motion.div
          className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="125" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
            <motion.circle
              cx="140" cy="140" r="125" fill="none"
              stroke="url(#hero-ring-grad)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 125}
              initial={{ strokeDashoffset: 2 * Math.PI * 125 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 125 - (pct / 100) * 2 * Math.PI * 125 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
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
            <div className="text-[0.6rem] text-[#00d4ff] uppercase tracking-[0.3em] mt-1 font-semibold">Of Your Journey</div>
          </div>
        </motion.div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-white/[0.15] border border-white/30 text-white">
            Week {lifeStats.currentWeekInYear} · Year {lifeStats.currentYearOfLife}
          </span>
          {generation && (
            <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-white/[0.15] border border-white/30 text-white">
              {generation.emoji} {generation.name}
            </span>
          )}
          {zodiac && (
            <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-white/[0.15] border border-white/30 text-white">
              {zodiac.symbol} {zodiac.name}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-white/[0.15] border border-white/30 text-white">
            {chinese.emoji} {chinese.animal}
          </span>
        </div>

        {/* Battery + snapshot */}
        <div className="flex flex-col items-center gap-3 mt-5">
          <LifeBattery percentUsed={pct} size="md" />
          <button onClick={() => setShowSnapshot(true)}
            className="px-4 py-1.5 rounded-full text-[0.65rem] bg-white/[0.08] border border-white/20 text-white/60 hover:text-white hover:border-white/30 transition-all">
            📸 Share Snapshot
          </button>
        </div>
      </motion.section>

      {/* ══ DAILY CHECK-IN ════════════════════════════════════ */}
      <motion.section {...fade(1)}>
        <div className={`${GLASS_BRIGHT} p-6 sm:p-8`}>
          <p className="text-center text-xs text-white/70 uppercase tracking-[0.2em] mb-6 font-medium">
            How are you feeling right now?
          </p>
          <div className="flex justify-center gap-8">
            {MOODS.map((m) => {
              const isSelected = todayMood?.mood === m.emoji;
              return (
                <motion.button
                  key={m.emoji}
                  onClick={() => onSaveMood(m.emoji, m.energy)}
                  className={`text-5xl cursor-pointer transition-all duration-200
                    ${isSelected ? "scale-110 drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]" : "opacity-40 hover:opacity-100 hover:scale-125 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]"}`}
                  whileTap={{ scale: 0.9 }}
                >
                  {m.emoji}
                </motion.button>
              );
            })}
          </div>
          {todayMood && (
            <p className="text-center text-xs text-white/30 mt-4">
              {MOODS.find((m) => m.emoji === todayMood.mood)?.label} · Resets in 3 hours
            </p>
          )}
          {recentMoods.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-white/5">
              {recentMoods.slice(0, 7).map((m) => <span key={m.date} className="text-lg" title={m.date}>{m.mood}</span>)}
            </div>
          )}
        </div>
      </motion.section>

      {/* ══ AI INSIGHT ════════════════════════════════════════ */}
      <motion.section {...fade(2)}>
        <AIInsightBanner mode={mode} lifeStats={lifeStats} todayMood={todayMood} />
      </motion.section>

      {/* ══ ALL DATA IN ACCORDIONS (closed by default) ═══════ */}

      <AccordionSection title="Your Exact Age" icon="🕐">
        <ExactAgeTicker birthDate={birthDate} birthYear={birthYear} />
      </AccordionSection>

      <AccordionSection title="Birthday Countdown" icon="🎂">
        <div className={`${GLASS} p-6 max-w-sm mx-auto text-center`}>
          <div className="text-3xl mb-2">🎂</div>
          <div className="text-4xl font-black text-white counter-digits">{birthday.daysUntil}</div>
          <div className="text-[0.55rem] text-[#00d4ff] uppercase tracking-[0.2em] font-semibold mt-1">days until you turn {birthday.turningAge}</div>
          <div className="text-[0.5rem] text-white/30 mt-1">{birthday.nextBirthdayDate}</div>
        </div>
      </AccordionSection>

      <AccordionSection title={isLowMood ? "Look How Far You've Come" : "Life at a Glance"} icon="📊">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={lifeStats.daysPassed} label="Days Lived" />
          {isLowMood ? <Stat value={numbers.laughs} label="Times Laughed" /> : <Stat value={lifeStats.daysRemaining} label="Days Remaining" />}
          <Stat value={lifeStats.weeksPassed} label="Weeks Lived" />
          {isLowMood ? <Stat value={cosmic.sunrises} label="Sunrises Seen" /> : <Stat value={lifeStats.weeksRemaining} label="Weeks Remaining" />}
        </div>
      </AccordionSection>

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

      <AccordionSection title="Cosmic Perspective" icon="🌍">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="🌍" value={cosmic.orbitsAroundSun} label="Orbits Around the Sun" />
          <DataRow icon="🚀" value={`${(cosmic.distanceThroughSpaceMiles / 1e9).toFixed(1)}B mi`} label="Through Space" sub={`${(cosmic.distanceThroughSpaceKm / 1e9).toFixed(1)}B km`} />
          <DataRow icon="🌕" value={cosmic.fullMoons} label="Full Moons" />
          <DataRow icon="🌅" value={cosmic.sunrises} label="Sunrises" />
          <DataRow icon="🍂" value={cosmic.seasonsExperienced} label="Seasons" />
          <DataRow icon="🚶" value={numbers.stepsTaken} label="Steps Taken" sub={`~${averages.avg_steps_per_day.toLocaleString()}/day`} />
        </div>
      </AccordionSection>

      <AccordionSection title="Life in Numbers" icon="📊">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="💬" value={numbers.wordsSpoken} label="Words Spoken" sub={`~${averages.avg_words_per_day.toLocaleString()}/day`} />
          <DataRow icon="💭" value={numbers.dreamsHad} label="Dreams Had" sub="~4/night" />
          <DataRow icon="📱" value={`${timeSpent.screenTimeYears} yrs`} label="Screen Time" sub={`~${averages.avg_screen_hours} hrs/day`} />
          <DataRow icon="🍳" value={`${timeSpent.eatingMonths} mo`} label="Time Eating" />
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
          ].map((p) => (
            <div key={p.name} className={`${GLASS} p-3 text-center`}>
              <div className="text-lg mb-0.5">{p.icon}</div>
              <div className="text-base font-black text-white counter-digits">{p.val}</div>
              <div className="text-[0.45rem] text-[#00d4ff] uppercase tracking-wider font-semibold mt-0.5">{p.name}</div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Waking Life" icon="☀️">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={dynamicStats.wakingHoursLived} label="Waking Hours Lived" live />
          <Stat value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem." live />
        </div>
      </AccordionSection>

      <AccordionSection title="Current Rhythms" icon="📈">
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

      <AccordionSection title={`Your ${zodiac?.name ?? ""} Horoscope`} icon="✨">
        <div className={`${GLASS} p-5 sm:p-6`}>
          {/* Period tabs */}
          <div className="flex justify-center gap-2 mb-5">
            {(["today", "week", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => horoscope.fetch(p)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize
                  ${horoscope.activePeriod === p && horoscope.result
                    ? "bg-gradient-to-r from-cyan-500 to-pink-500 text-white"
                    : "bg-white/[0.08] border border-white/10 text-white/50 hover:text-white"}`}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : "This Year"}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {horoscope.loading && (
            <div className="flex flex-col items-center gap-3 py-6 animate-pulse">
              <div className="w-24 h-8 bg-white/5 rounded-xl" />
              <div className="w-full h-16 bg-white/5 rounded-xl" />
              <div className="w-48 h-4 bg-white/5 rounded-xl" />
            </div>
          )}

          {/* Error / no key */}
          {horoscope.error === "no-key" && (
            <p className="text-center text-sm text-white/30 py-4">Add your AI key in Settings to unlock your personal horoscope.</p>
          )}
          {horoscope.error && horoscope.error !== "no-key" && (
            <p className="text-center text-sm text-red-400/60 py-4">{horoscope.error}</p>
          )}

          {/* Result */}
          {horoscope.result && !horoscope.loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                {horoscope.result.theme}
              </div>
              <p className="text-sm text-white/80 leading-relaxed text-center max-w-md">{horoscope.result.message}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#00d4ff]">Focus: {horoscope.result.focus}</span>
                <span className="text-white/40">
                  {horoscope.result.energy === "high" ? "⚡⚡⚡" : horoscope.result.energy === "medium" ? "⚡⚡" : "⚡"}
                </span>
              </div>
            </div>
          )}

          {/* Default state */}
          {!horoscope.result && !horoscope.loading && !horoscope.error && (
            <p className="text-center text-sm text-white/20 py-4">Tap a period above to reveal your horoscope</p>
          )}
        </div>
      </AccordionSection>

      <LegacySnapshot isOpen={showSnapshot} onClose={() => setShowSnapshot(false)}
        lifeStats={lifeStats} birthYear={birthYear} birthMonth={birthMonth} birthDay={birthDay}
        displayName={displayName} todayMood={todayMood} />
    </motion.div>
  );
};

export default DashboardPage;
