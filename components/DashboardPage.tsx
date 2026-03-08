import React from "react";
import { motion } from "framer-motion";
import type { LifeStats, DynamicStats } from "../types";

import HeroRing from "./HeroRing";
import StatCard from "./StatCard";
import SectionHeading from "./SectionHeading";
import ProgressBar from "./ProgressBar";
import MilestoneTimeline from "./MilestoneTimeline";

interface DashboardPageProps {
  lifeStats: LifeStats;
  dynamicStats: DynamicStats;
  quote: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}

const section = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const DashboardPage: React.FC<DashboardPageProps> = ({ lifeStats, dynamicStats, quote, birthYear, birthMonth, birthDay }) => {
  const pct = parseFloat(lifeStats.percentageLived);

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
      </motion.section>

      {/* ── Life at a glance ─────────────────────────────────── */}
      <motion.section custom={1} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Life at a Glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard value={lifeStats.daysPassed}    label="Days Lived"      variant="daysLived"      index={0} />
          <StatCard value={lifeStats.daysRemaining}  label="Days Remaining"  variant="daysRemaining"  index={1} />
          <StatCard value={lifeStats.weeksPassed}    label="Weeks Lived"     variant="weeksLived"     index={2} />
          <StatCard value={lifeStats.weeksRemaining} label="Weeks Remaining" variant="weeksRemaining" index={3} />
        </div>
      </motion.section>

      {/* ── Live counters ────────────────────────────────────── */}
      <motion.section custom={2} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Live Chronometer" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <StatCard value={dynamicStats.hoursLived}      label="Hours Lived"   variant="mini" index={0} live />
          <StatCard value={dynamicStats.minutesLived}    label="Minutes Lived" variant="mini" index={1} live />
          <StatCard value={dynamicStats.secondsLived}    label="Seconds Lived" variant="mini" index={2} live />
          <StatCard value={dynamicStats.hoursRemaining}  label="Hours Rem."    variant="mini" index={3} live />
          <StatCard value={dynamicStats.minutesRemaining} label="Minutes Rem." variant="mini" index={4} live />
          <StatCard value={dynamicStats.secondsRemaining} label="Seconds Rem." variant="mini" index={5} live />
        </div>
      </motion.section>

      {/* ── Waking life ──────────────────────────────────────── */}
      <motion.section custom={3} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Waking Life" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
          <StatCard value={dynamicStats.wakingHoursLived}     label="Waking Hours Lived" variant="waking" index={0} sublabel="~16 hrs/day awake" live />
          <StatCard value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem."  variant="waking" index={1} sublabel="make them count" live />
        </div>
      </motion.section>

      {/* ── Current rhythms ──────────────────────────────────── */}
      <motion.section custom={4} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Current Rhythms" />
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          <ProgressBar label="Today"      value={dynamicStats.percentDayPassed}   color="bg-primary"   index={0} />
          <ProgressBar label="This Month" value={dynamicStats.percentMonthPassed} color="bg-accent"    index={1} />
          <ProgressBar label="This Year"  value={dynamicStats.percentYearPassed}  color="bg-[#4caf50]" index={2} />
        </div>
      </motion.section>

      {/* ── Milestones ───────────────────────────────────────── */}
      <motion.section custom={5} initial="hidden" animate="visible" variants={section}>
        <SectionHeading title="Life Milestones" />
        <MilestoneTimeline
          milestones={[
            { title: "Quarter Life",       date: lifeStats.milestones.quarter,      color: "#4CAF50" },
            { title: "Halfway Point",      date: lifeStats.milestones.halfway,      color: "#2196F3" },
            { title: "Three-Quarter Mark", date: lifeStats.milestones.threeQuarter, color: "#9C27B0" },
          ]}
        />
      </motion.section>
    </motion.div>
  );
};

export default DashboardPage;
