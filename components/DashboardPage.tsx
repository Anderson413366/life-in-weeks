import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LifeStats, DynamicStats, UserAverages } from "../types";
import {
  getBiologyStats, getCosmicStats, getLifeInNumbers,
  getTimeSpent, getBirthdayCountdown, getAlternativeAges,
} from "../lib/lifeData";
import { getGeneration } from "../lib/generations";
import { getZodiacSign, getElementColor } from "../lib/zodiac";
import { getChineseZodiac } from "../lib/lifeData";

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

// Glassmorphism card class
const GLASS = "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl";

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

/** Single stat tile — stark white number, muted label */
function Stat({ value, label, live }: { value: number | string; label: string; live?: boolean }) {
  return (
    <div className={`${GLASS} p-5 text-center`}>
      <div className="text-2xl sm:text-3xl font-bold text-white counter-digits">
        {typeof value === "number" ? (live ? value.toLocaleString() : value.toLocaleString()) : value}
      </div>
      <div className="text-[0.55rem] text-gray-500 uppercase tracking-[0.2em] mt-1.5">{label}</div>
    </div>
  );
}

/** Data row — icon + big number + label */
function DataRow({ icon, value, label, sub }: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div className={`${GLASS} p-4 flex items-center gap-4`}>
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <div className="text-xl font-bold text-white counter-digits">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <div className="text-[0.55rem] text-gray-500 uppercase tracking-[0.2em]">{label}</div>
        {sub && <div className="text-[0.5rem] text-gray-600 mt-0.5">{sub}</div>}
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

  return (
    <motion.div
      className="flex flex-col gap-10 sm:gap-12 w-full max-w-3xl mx-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ════════════════════════════════════════════════════════
          HERO: Breathing Orb + Percentage
          ════════════════════════════════════════════════════════ */}
      <motion.section className="flex flex-col items-center pt-4" {...fade(0)}>
        {/* Quote */}
        <p className="text-sm italic text-gray-500 font-light max-w-md text-center leading-relaxed mb-8">
          "{quote}"
        </p>

        {/* Breathing orb */}
        <motion.div
          className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: isLowMood
                ? "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(8,145,178,0.12) 0%, transparent 70%)",
            }}
          />

          {/* SVG ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="125" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
            <motion.circle
              cx="140" cy="140" r="125" fill="none"
              stroke={isLowMood ? "#f43f5e" : "#0891b2"}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 125}
              initial={{ strokeDashoffset: 2 * Math.PI * 125 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 125 - (pct / 100) * 2 * Math.PI * 125 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 20px ${isLowMood ? "rgba(244,63,94,0.4)" : "rgba(8,145,178,0.4)"})` }}
            />
          </svg>

          {/* Center text */}
          <div className="relative text-center">
            <div className="text-5xl sm:text-6xl font-bold text-white tracking-tighter">
              {pct}<span className="text-3xl align-super">%</span>
            </div>
            <div className="text-[0.55rem] text-gray-500 uppercase tracking-[0.3em] mt-1">Of Your Journey</div>
          </div>
        </motion.div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-white/5 border border-white/8 text-gray-400">
            Week {lifeStats.currentWeekInYear} · Year {lifeStats.currentYearOfLife}
          </span>
          {generation && (
            <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-purple-500/10 border border-purple-500/15 text-purple-300">
              {generation.emoji} {generation.name}
            </span>
          )}
          {zodiac && (
            <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium border"
              style={{ backgroundColor: `${getElementColor(zodiac.element)}10`, borderColor: `${getElementColor(zodiac.element)}20`, color: getElementColor(zodiac.element) }}>
              {zodiac.symbol} {zodiac.name}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium bg-amber-500/10 border border-amber-500/15 text-amber-300">
            {chinese.emoji} {chinese.animal}
          </span>
        </div>

        {/* Battery + Snapshot */}
        <div className="flex flex-col items-center gap-3 mt-5">
          <LifeBattery percentUsed={pct} size="md" />
          <button onClick={() => setShowSnapshot(true)}
            className="px-4 py-1.5 rounded-full text-[0.65rem] bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all">
            📸 Share Snapshot
          </button>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          DAILY CHECK-IN: Massive glowing emoji buttons
          ════════════════════════════════════════════════════════ */}
      <motion.section {...fade(1)}>
        <div className={`${GLASS} p-6 sm:p-8`}>
          <p className="text-center text-[0.6rem] text-gray-500 uppercase tracking-[0.3em] mb-6">
            How are you feeling right now?
          </p>
          <div className="flex justify-center gap-4 sm:gap-6">
            {MOODS.map((m) => {
              const isSelected = todayMood?.mood === m.emoji;
              return (
                <motion.button
                  key={m.emoji}
                  onClick={() => onSaveMood(m.emoji, m.energy)}
                  className={`text-4xl sm:text-5xl transition-all rounded-2xl p-2
                    ${isSelected ? "scale-110 bg-white/10 shadow-lg" : "opacity-50 hover:opacity-100"}`}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {m.emoji}
                </motion.button>
              );
            })}
          </div>
          {todayMood && (
            <p className="text-center text-xs text-gray-500 mt-4">
              {MOODS.find((m) => m.emoji === todayMood.mood)?.label} · Resets in 3 hours
            </p>
          )}
          {/* Mood streak */}
          {recentMoods.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-white/5">
              {recentMoods.slice(0, 7).map((m) => (
                <span key={m.date} className="text-lg" title={m.date}>{m.mood}</span>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          AI INSIGHT
          ════════════════════════════════════════════════════════ */}
      <motion.section {...fade(2)}>
        <AIInsightBanner mode={mode} lifeStats={lifeStats} todayMood={todayMood} />
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          EXACT AGE (always visible — lightweight)
          ════════════════════════════════════════════════════════ */}
      <motion.section {...fade(3)}>
        <ExactAgeTicker birthDate={birthDate} birthYear={birthYear} />
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          BIRTHDAY COUNTDOWN
          ════════════════════════════════════════════════════════ */}
      <motion.section {...fade(4)}>
        <div className={`${GLASS} p-6 max-w-sm mx-auto text-center`}>
          <div className="text-3xl mb-2">🎂</div>
          <div className="text-4xl font-bold text-white counter-digits">{birthday.daysUntil}</div>
          <div className="text-[0.55rem] text-gray-500 uppercase tracking-[0.2em] mt-1">days until you turn {birthday.turningAge}</div>
          <div className="text-[0.5rem] text-gray-600 mt-1">{birthday.nextBirthdayDate}</div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          LIFE AT A GLANCE (4 tiles — always visible)
          ════════════════════════════════════════════════════════ */}
      <motion.section {...fade(5)}>
        <div className="grid grid-cols-2 gap-3">
          <Stat value={lifeStats.daysPassed} label="Days Lived" />
          {isLowMood
            ? <Stat value={numbers.laughs} label="Times You've Laughed" />
            : <Stat value={lifeStats.daysRemaining} label="Days Remaining" />}
          <Stat value={lifeStats.weeksPassed} label="Weeks Lived" />
          {isLowMood
            ? <Stat value={cosmic.sunrises} label="Sunrises You've Seen" />
            : <Stat value={lifeStats.weeksRemaining} label="Weeks Remaining" />}
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          COLLAPSIBLE DATA SECTIONS (progressive disclosure)
          ════════════════════════════════════════════════════════ */}

      <AccordionSection title="Live Chronometer" icon="⏱️">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat value={dynamicStats.hoursLived} label="Hours Lived" live />
          <Stat value={dynamicStats.minutesLived} label="Minutes Lived" live />
          <Stat value={dynamicStats.secondsLived} label="Seconds Lived" live />
          {!isLowMood && <Stat value={dynamicStats.hoursRemaining} label="Hours Remaining" live />}
          {!isLowMood && <Stat value={dynamicStats.minutesRemaining} label="Minutes Rem." live />}
          {!isLowMood && <Stat value={dynamicStats.secondsRemaining} label="Seconds Rem." live />}
        </div>
      </AccordionSection>

      <AccordionSection title="Body & Biology" icon="💓">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="💓" value={biology.heartbeats} label="Heartbeats" sub={`~${bpm} bpm`} />
          <DataRow icon="🌬️" value={biology.breaths} label="Breaths Taken" sub={`~${averages.avg_breaths_per_min}/min`} />
          <DataRow icon="👁️" value={biology.blinks} label="Blinks" sub={`~${averages.avg_blinks_per_min}/min awake`} />
          <DataRow icon="😴" value={`${biology.yearsSlept} yrs`} label="Time Sleeping" sub={`${biology.hoursSlept.toLocaleString()} hours`} />
          <DataRow icon="🍽️" value={numbers.mealsEaten} label="Meals Eaten" sub={`~${averages.meals_per_day}/day`} />
          <DataRow icon="😄" value={numbers.laughs} label="Times Laughed" sub={`~${averages.avg_laughs_per_day}/day`} />
        </div>
      </AccordionSection>

      <AccordionSection title="Cosmic Perspective" icon="🌍">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="🌍" value={cosmic.orbitsAroundSun} label="Orbits Around the Sun" />
          <DataRow icon="🚀" value={`${(cosmic.distanceThroughSpaceMiles / 1e9).toFixed(1)}B mi`} label="Distance Through Space" sub={`${(cosmic.distanceThroughSpaceKm / 1e9).toFixed(1)}B km`} />
          <DataRow icon="🌕" value={cosmic.fullMoons} label="Full Moons Witnessed" />
          <DataRow icon="🌅" value={cosmic.sunrises} label="Sunrises" />
          <DataRow icon="🍂" value={cosmic.seasonsExperienced} label="Seasons Experienced" />
          <DataRow icon="🚶" value={numbers.stepsTaken} label="Steps Taken" sub={`~${averages.avg_steps_per_day.toLocaleString()}/day`} />
        </div>
      </AccordionSection>

      <AccordionSection title="Life in Numbers" icon="📊">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataRow icon="💬" value={numbers.wordsSpoken} label="Words Spoken" sub={`~${averages.avg_words_per_day.toLocaleString()}/day`} />
          <DataRow icon="💭" value={numbers.dreamsHad} label="Dreams Had" sub="~4 per night" />
          <DataRow icon="📱" value={`${timeSpent.screenTimeYears} yrs`} label="Screen Time" sub={`~${averages.avg_screen_hours} hrs/day`} />
          <DataRow icon="🍳" value={`${timeSpent.eatingMonths} mo`} label="Time Eating" sub="~1.2 hrs/day" />
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
              <div className="text-base font-bold text-white counter-digits">{p.val}</div>
              <div className="text-[0.45rem] text-gray-500 uppercase tracking-wider mt-0.5">{p.name}</div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Waking Life" icon="☀️">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={dynamicStats.wakingHoursLived} label="Waking Hours Lived" live />
          <Stat value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem." live />
        </div>
        <p className="text-[0.5rem] text-gray-600 text-center mt-2">~16 waking hours per day</p>
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

      <LegacySnapshot
        isOpen={showSnapshot} onClose={() => setShowSnapshot(false)}
        lifeStats={lifeStats} birthYear={birthYear} birthMonth={birthMonth} birthDay={birthDay}
        displayName={displayName} todayMood={todayMood}
      />
    </motion.div>
  );
};

export default DashboardPage;
