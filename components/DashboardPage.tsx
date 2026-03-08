import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LifeStats, DynamicStats, UserAverages } from "../types";
import {
  getBiologyStats, getCosmicStats, getLifeInNumbers,
  getTimeSpent, getBirthdayCountdown, getAlternativeAges,
} from "../lib/lifeData";

import HeroRing from "./HeroRing";
import LifeBattery from "./LifeBattery";
import ExactAgeTicker from "./ExactAgeTicker";
import MoodChecker from "./MoodChecker";
import StatCard from "./StatCard";
import DataCard from "./DataCard";
import SectionHeading from "./SectionHeading";
import ProgressBar from "./ProgressBar";
import MilestoneTimeline from "./MilestoneTimeline";
import AIInsightBanner from "./AIInsightBanner";
import LegacySnapshot from "./LegacySnapshot";
import type { MoodEntry } from "../hooks/useMood";
import type { AppMode } from "../lib/theme";

// Low-mood emojis that should trigger compassionate mode
const LOW_MOODS = new Set(["😔", "😢"]);

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

const section = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" },
  }),
};

const DashboardPage: React.FC<DashboardPageProps> = ({ lifeStats, dynamicStats, quote, birthYear, birthMonth, birthDay, averages, todayMood, recentMoods, mode, displayName, onSaveMood }) => {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const pct = parseFloat(lifeStats.percentageLived);
  const birthDate = useMemo(() => new Date(birthYear, birthMonth - 1, birthDay), [birthYear, birthMonth, birthDay]);
  const now = useMemo(() => new Date(), []);
  const isLowMood = todayMood ? LOW_MOODS.has(todayMood.mood) : false;
  void mode; // used for future focus mode styling

  const biology = useMemo(() => getBiologyStats(birthDate, now, averages), [birthDate, now, averages]);
  const cosmic = useMemo(() => getCosmicStats(birthDate, now), [birthDate, now]);
  const numbers = useMemo(() => getLifeInNumbers(birthDate, now, averages), [birthDate, now, averages]);
  const timeSpent = useMemo(() => getTimeSpent(birthDate, now, averages), [birthDate, now, averages]);
  const birthday = useMemo(() => getBirthdayCountdown(birthDate, now), [birthDate, now]);
  const altAges = useMemo(() => getAlternativeAges(birthDate, now), [birthDate, now]);

  return (
    <motion.div
      className="flex flex-col gap-8 sm:gap-10 md:gap-12 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <motion.section className="flex flex-col items-center" custom={0} initial="hidden" animate="visible" variants={section}>
        <p className="text-sm sm:text-base italic text-text-muted/80 font-light max-w-lg text-center leading-relaxed mb-6">
          "{quote}"
        </p>
        <HeroRing
          percentage={pct}
          label="of your journey"
          dateFormatted={lifeStats.currentDateFormatted}
          weekInYear={lifeStats.currentWeekInYear}
          yearOfLife={lifeStats.currentYearOfLife}
          birthYear={birthYear}
          birthMonth={birthMonth}
          birthDay={birthDay}
        />
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-[0.6rem] text-text-muted/60 uppercase tracking-wider">Life Remaining</span>
          <LifeBattery percentUsed={pct} size="lg" />
          <button
            onClick={() => setShowSnapshot(true)}
            className="mt-2 px-4 py-1.5 rounded-full text-xs glass border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
          >
            📸 Share Snapshot
          </button>
        </div>
      </motion.section>

      {/* ── Mental Health Check ─────────────────────────────── */}
      <motion.section custom={1} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Daily Check-In" />
        <MoodChecker todayMood={todayMood} recentMoods={recentMoods} onSave={onSaveMood} />
      </motion.section>

      {/* ── AI Insight ────────────────────────────────────────── */}
      <motion.section custom={2} initial="hidden" animate="visible" variants={section}>
        <AIInsightBanner mode={mode} lifeStats={lifeStats} todayMood={todayMood} />
      </motion.section>

      {/* ── Your Exact Age ───────────────────────────────────── */}
      <motion.section custom={2} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Your Exact Age" />
        <ExactAgeTicker birthDate={birthDate} birthYear={birthYear} />
      </motion.section>

      {/* ── Next Birthday ────────────────────────────────────── */}
      <motion.section custom={2} initial="hidden" animate="visible" variants={section}>
        <div className="glass rounded-xl p-5 sm:p-6 max-w-md mx-auto text-center">
          <div className="text-3xl mb-2">🎂</div>
          <div className="text-4xl sm:text-5xl font-bold text-white glow-gold counter-digits">{birthday.daysUntil}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">days until you turn {birthday.turningAge}</div>
          <div className="text-xs text-text-muted/60 mt-1">{birthday.nextBirthdayDate}</div>
        </div>
      </motion.section>

      {/* ── Life at a Glance ─────────────────────────────────── */}
      <motion.section custom={3} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title={isLowMood ? "Look How Far You've Come" : "Life at a Glance"} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard value={lifeStats.daysPassed}    label="Days Lived"      variant="daysLived"      index={0} />
          {!isLowMood && <StatCard value={lifeStats.daysRemaining}  label="Days Remaining"  variant="daysRemaining"  index={1} />}
          <StatCard value={lifeStats.weeksPassed}    label="Weeks Lived"     variant="weeksLived"     index={2} />
          {!isLowMood && <StatCard value={lifeStats.weeksRemaining} label="Weeks Remaining" variant="weeksRemaining" index={3} />}
          {isLowMood && <StatCard value={numbers.laughs} label="Times You've Laughed" variant="daysLived" index={1} />}
          {isLowMood && <StatCard value={cosmic.sunrises} label="Sunrises You've Seen" variant="weeksLived" index={3} />}
        </div>
      </motion.section>

      {/* ── Live Chronometer ─────────────────────────────────── */}
      <motion.section custom={4} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title={isLowMood ? "Every Second Is a Gift" : "Live Chronometer"} />
        <div className={`grid ${isLowMood ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"} gap-2 sm:gap-3`}>
          <StatCard value={dynamicStats.hoursLived}       label="Hours Lived"   variant="mini" index={0} live />
          <StatCard value={dynamicStats.minutesLived}     label="Minutes Lived" variant="mini" index={1} live />
          <StatCard value={dynamicStats.secondsLived}     label="Seconds Lived" variant="mini" index={2} live />
          {!isLowMood && <StatCard value={dynamicStats.hoursRemaining}   label="Hours Rem."    variant="mini" index={3} live />}
          {!isLowMood && <StatCard value={dynamicStats.minutesRemaining} label="Minutes Rem."  variant="mini" index={4} live />}
          {!isLowMood && <StatCard value={dynamicStats.secondsRemaining} label="Seconds Rem."  variant="mini" index={5} live />}
        </div>
      </motion.section>

      {/* ── Body & Biology ───────────────────────────────────── */}
      <motion.section custom={5} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Body & Biology" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DataCard icon="💓" value={biology.heartbeats}  label="Heartbeats"      sublabel={`~${averages.avg_heartbeats_per_min} bpm`}   color="#ff6b6b" index={0} />
          <DataCard icon="🌬️" value={biology.breaths}    label="Breaths Taken"   sublabel={`~${averages.avg_breaths_per_min}/min`}    color="#00d4ff" index={1} />
          <DataCard icon="👁️" value={biology.blinks}     label="Blinks"          sublabel={`~${averages.avg_blinks_per_min}/min awake`} color="#8e44ad" index={2} />
          <DataCard icon="😴" value={`${biology.yearsSlept} yrs`} label="Time Spent Sleeping" sublabel={`${biology.hoursSlept.toLocaleString()} hours total`} color="#2196F3" index={3} />
          <DataCard icon="🍽️" value={numbers.mealsEaten} label="Meals Eaten"     sublabel={`~${averages.meals_per_day}/day`}        color="#ff9f43" index={4} />
          <DataCard icon="😄" value={numbers.laughs}     label="Times Laughed"   sublabel={`~${averages.avg_laughs_per_day}/day`}       color="#ffd700" index={5} />
        </div>
      </motion.section>

      {/* ── Cosmic Perspective ───────────────────────────────── */}
      <motion.section custom={6} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Cosmic Perspective" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DataCard icon="🌍" value={cosmic.orbitsAroundSun}  label="Orbits Around the Sun"  color="#4caf50" index={0} />
          <DataCard icon="🚀" value={`${(cosmic.distanceThroughSpaceMiles / 1_000_000_000).toFixed(1)}B mi`} label="Distance Through Space" sublabel={`${(cosmic.distanceThroughSpaceKm / 1_000_000_000).toFixed(1)}B km at 67,000 mph`} color="#00d4ff" index={1} />
          <DataCard icon="🌕" value={cosmic.fullMoons}        label="Full Moons Witnessed"   sublabel="~1 every 29.5 days" color="#ffd700" index={2} />
          <DataCard icon="🌅" value={cosmic.sunrises}         label="Sunrises"               sublabel="one for each day" color="#ff9f43" index={3} />
          <DataCard icon="🍂" value={cosmic.seasonsExperienced} label="Seasons Experienced"  sublabel="spring, summer, fall, winter" color="#4caf50" index={4} />
          <DataCard icon="🚶" value={numbers.stepsTaken}      label="Steps Taken"            sublabel="~7,500 per day" color="#8e44ad" index={5} />
        </div>
      </motion.section>

      {/* ── Life in Numbers ──────────────────────────────────── */}
      <motion.section custom={7} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Life in Numbers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DataCard icon="💬" value={numbers.wordsSpoken} label="Words Spoken"     sublabel="~16,000 per day" color="#00d4ff" index={0} />
          <DataCard icon="💭" value={numbers.dreamsHad}   label="Dreams Had"       sublabel="~4 per night"    color="#8e44ad" index={1} />
          <DataCard icon="📱" value={`${timeSpent.screenTimeYears} yrs`} label="Screen Time"  sublabel="~7 hrs/day average" color="#ff6b6b" index={2} />
          <DataCard icon="🍳" value={`${timeSpent.eatingMonths} mo`}     label="Time Eating"  sublabel="~1.2 hrs/day"       color="#ff9f43" index={3} />
          <DataCard icon="😴" value={`${timeSpent.sleepingYears} yrs`}   label="Time Sleeping" sublabel="~8 hrs/day"        color="#2196F3" index={4} />
          <DataCard icon="🌟" value={`${lifeStats.weeksPassed} / ${lifeStats.totalLifeWeeks}`} label="Weeks Used" sublabel={`${(100 - pct).toFixed(1)}% still ahead`} color="#4caf50" index={5} />
        </div>
      </motion.section>

      {/* ── Your Age on Other Planets ────────────────────────── */}
      <motion.section custom={8} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Your Age on Other Planets" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {[
            { icon: "☿", name: "Mercury", value: altAges.mercuryYears, color: "#b4b4c7" },
            { icon: "♀", name: "Venus",   value: altAges.venusYears,   color: "#ff9f43" },
            { icon: "♂", name: "Mars",    value: altAges.marsYears,    color: "#ff6b6b" },
            { icon: "♃", name: "Jupiter", value: altAges.jupiterYears, color: "#ff9f43" },
            { icon: "🐕", name: "Dog Yrs", value: altAges.dogYears,    color: "#8e44ad" },
            { icon: "🐈", name: "Cat Yrs", value: altAges.catYears,    color: "#00d4ff" },
          ].map((p, i) => (
            <motion.div
              key={p.name}
              className="glass rounded-xl p-3 sm:p-4 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div className="text-xl mb-1">{p.icon}</div>
              <div className="text-lg sm:text-xl font-bold text-white counter-digits">{p.value}</div>
              <div className="text-[0.5rem] sm:text-[0.55rem] text-text-muted uppercase tracking-wider mt-0.5">{p.name}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Waking Life ──────────────────────────────────────── */}
      <motion.section custom={9} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Waking Life" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
          <StatCard value={dynamicStats.wakingHoursLived}     label="Waking Hours Lived" variant="waking" index={0} sublabel="~16 hrs/day awake" live />
          <StatCard value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem."  variant="waking" index={1} sublabel="make them count" live />
        </div>
      </motion.section>

      {/* ── Current Rhythms ──────────────────────────────────── */}
      <motion.section custom={10} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Current Rhythms" />
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          <ProgressBar label="Today"      value={dynamicStats.percentDayPassed}   color="bg-primary"   index={0} />
          <ProgressBar label="This Month" value={dynamicStats.percentMonthPassed} color="bg-accent"    index={1} />
          <ProgressBar label="This Year"  value={dynamicStats.percentYearPassed}  color="bg-[#4caf50]" index={2} />
        </div>
      </motion.section>

      {/* ── Milestones ───────────────────────────────────────── */}
      <motion.section custom={11} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Life Milestones" />
        <MilestoneTimeline
          milestones={[
            { title: "Quarter Life",       date: lifeStats.milestones.quarter,      color: "#4CAF50" },
            { title: "Halfway Point",      date: lifeStats.milestones.halfway,      color: "#2196F3" },
            { title: "Three-Quarter Mark", date: lifeStats.milestones.threeQuarter, color: "#9C27B0" },
          ]}
        />
      </motion.section>

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
    </motion.div>
  );
};

export default DashboardPage;
