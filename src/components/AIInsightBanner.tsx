import React, { useState, useEffect } from "react";
import type { AppMode } from "../lib/theme";
import type { LifeStats } from "../types";
import type { MoodEntry } from "../types";

interface AIInsightBannerProps {
  mode: AppMode;
  lifeStats: LifeStats;
  todayMood: MoodEntry | null;
}

// Contextual insights that feel like a compassionate companion
// No API needed — curated based on mood + life stats
const LOW_MOODS = new Set(["😔", "😢"]);

function generateInsight(lifeStats: LifeStats, todayMood: MoodEntry | null): string {
  const pct = parseFloat(lifeStats.percentageLived);
  const isLow = todayMood ? LOW_MOODS.has(todayMood.mood) : false;
  const isHigh = todayMood?.mood === "😄";

  if (isLow) {
    const compassionate = [
      `You've already lived ${lifeStats.daysPassed.toLocaleString()} days. Every single one of them brought you here — and here is exactly where you need to be.`,
      `Tough days are part of ${lifeStats.weeksPassed.toLocaleString()} weeks of lived experience. You've survived 100% of your worst days so far.`,
      "This feeling is temporary. You are not. Take a breath — you're doing better than you think.",
      `In ${lifeStats.daysPassed.toLocaleString()} days, you've overcome challenges you once thought were impossible. This one is no different.`,
      "Be gentle with yourself today. Rest is not giving up — it's recharging for what's ahead.",
    ];
    return compassionate[Math.floor(Math.random() * compassionate.length)];
  }

  if (isHigh) {
    const celebratory = [
      `This energy is beautiful. You're ${pct}% through your journey and radiating it.`,
      `${lifeStats.weeksPassed.toLocaleString()} weeks of experiences have led to this moment of joy. Savor it.`,
      "Your good mood is contagious — it ripples out to everyone around you today.",
      `Week ${lifeStats.currentWeekInYear} of Year ${lifeStats.currentYearOfLife} is already one to remember.`,
    ];
    return celebratory[Math.floor(Math.random() * celebratory.length)];
  }

  // Default/neutral
  const thoughtful = [
    `You're ${pct}% through your journey. Each week is a brushstroke on the canvas of your life.`,
    `Week ${lifeStats.currentWeekInYear} of your year — a perfect moment to pause, reflect, and choose your next step wisely.`,
    `${lifeStats.daysPassed.toLocaleString()} days of memories, lessons, and growth. The story is far from over.`,
    `Today is one of approximately ${lifeStats.daysRemaining.toLocaleString()} remaining days. That's not a countdown — it's a treasure map.`,
    "The fact that you're here, checking in on your life, shows more self-awareness than most people ever develop.",
  ];
  return thoughtful[Math.floor(Math.random() * thoughtful.length)];
}

const AIInsightBanner: React.FC<AIInsightBannerProps> = ({ mode, lifeStats, todayMood }) => {
  const [insight, setInsight] = useState("");

  useEffect(() => {
    setInsight(generateInsight(lifeStats, todayMood));
  }, [lifeStats.currentDateFormatted, todayMood?.mood]);

  if (!insight) return null;

  const isFocus = mode === "focus";

  return (
    <div
      className={`mx-auto max-w-2xl px-5 py-3 rounded-2xl border text-center animate-fade-in
        ${isFocus ? "border-[#333] bg-[#111]" : "border-[#00d4ff]/30 card-base"}`}
      style={{ boxShadow: "0 0 30px rgba(0,212,255,0.06)" }}
    >
        <p className={`text-sm leading-relaxed italic ${isFocus ? "text-[#aaa]" : "text-white/90"}`}>
          "{insight}"
        </p>
    </div>
  );
};

export default AIInsightBanner;
