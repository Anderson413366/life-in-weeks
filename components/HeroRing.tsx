import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGeneration } from "../lib/generations";
import { getZodiacSign, getElementColor } from "../lib/zodiac";
import type { AppMode } from "../lib/theme";

interface HeroRingProps {
  percentage: number;
  label: string;
  dateFormatted: string;
  weekInYear: number;
  yearOfLife: number;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  heartRate?: number;
  mode?: AppMode;
  moodColor?: string;
}

const SIZE = 280;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const tooltipMotion = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const HeroRing: React.FC<HeroRingProps> = ({
  percentage, label, dateFormatted, weekInYear, yearOfLife,
  birthYear, birthMonth, birthDay, heartRate = 72, mode = "zen", moodColor,
}) => {
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
  const generation = birthYear ? getGeneration(birthYear) : null;
  const zodiac = birthMonth && birthDay ? getZodiacSign(birthMonth, birthDay) : null;
  const [showGenTooltip, setShowGenTooltip] = useState(false);
  const [showZodiacTooltip, setShowZodiacTooltip] = useState(false);

  const isFocus = mode === "focus";
  const pulseDuration = 60 / heartRate; // breathing tied to heart rate
  const ringStroke = moodColor ?? (isFocus ? "#ffffff" : "url(#ring-gradient)");

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Ring */}
      <motion.div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        animate={{ scale: isFocus ? 1 : [1, 1.015, 1] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke={isFocus ? "#1a1a1a" : "rgba(255,255,255,0.04)"}
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke={ringStroke} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: isFocus ? "none" : `drop-shadow(0 0 24px ${moodColor ?? "rgba(0,212,255,0.5)"})` }}
          />
          {!isFocus && (
            <defs>
              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={moodColor ?? "#00d4ff"} />
                <stop offset="50%" stopColor="#8e44ad" />
                <stop offset="100%" stopColor="#ff6b6b" />
              </linearGradient>
            </defs>
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl sm:text-6xl font-bold tracking-tighter text-white ${isFocus ? "" : "glow-cyan"}`}>
            {percentage}
            <span className="text-3xl align-super">%</span>
          </span>
          <span className={`text-[0.6rem] mt-1 tracking-[3px] uppercase ${isFocus ? "text-[#888]" : "text-primary/70"}`}>{label}</span>
        </div>

        {/* Live pulse indicator */}
        {!isFocus && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[0.5rem] tracking-[2px] text-text-muted/40">{heartRate} BPM</span>
          </div>
        )}
      </motion.div>

      {/* Date & badges */}
      <div className="flex flex-col items-center gap-3">
        <div className={`text-lg sm:text-xl font-semibold tracking-wide ${isFocus ? "text-white" : "text-white"}`}>{dateFormatted}</div>
        <div className="flex flex-wrap justify-center gap-2">
          <span className={`py-1 px-4 rounded-full text-xs font-semibold ${isFocus ? "bg-white/10 text-white border border-white/20" : "bg-accent/20 text-accent border border-accent/30"}`}>
            Week {weekInYear}
          </span>
          <span className={`py-1 px-4 rounded-full text-xs font-semibold ${isFocus ? "bg-white/10 text-white border border-white/20" : "bg-primary/20 text-primary border border-primary/30"}`}>
            Year {yearOfLife}
          </span>

          {/* Generation badge */}
          {generation && (
            <div className="relative">
              <span
                className="py-1 px-4 rounded-full text-xs font-semibold bg-[#8e44ad]/20 text-[#c39bd3] border border-[#8e44ad]/30 cursor-pointer transition-all hover:bg-[#8e44ad]/30"
                onMouseEnter={() => setShowGenTooltip(true)}
                onMouseLeave={() => setShowGenTooltip(false)}
              >
                {generation.emoji} {generation.name}
              </span>
              <AnimatePresence>
                {showGenTooltip && (
                  <motion.div
                    className="absolute z-50 top-full mt-3 left-1/2 -translate-x-1/2 w-72 glass rounded-xl p-4 shadow-2xl border border-[#8e44ad]/30 text-left"
                    variants={tooltipMotion} initial="hidden" animate="visible" exit="hidden"
                    transition={{ duration: 0.15 }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[rgba(25,25,55,0.6)] border-l border-t border-[#8e44ad]/30" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{generation.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-[#c39bd3]">{generation.name}</div>
                          <div className="text-[0.65rem] text-text-muted">{generation.range}</div>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed mb-3">{generation.description}</p>
                      <ul className="space-y-1.5">
                        {generation.traits.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-xs text-white/80">
                            <span className="text-[#8e44ad] mt-0.5 text-[0.6rem]">●</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Zodiac badge */}
          {zodiac && (
            <div className="relative">
              <span
                className="py-1 px-4 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  backgroundColor: `${getElementColor(zodiac.element)}15`,
                  color: getElementColor(zodiac.element),
                  borderWidth: 1,
                  borderColor: `${getElementColor(zodiac.element)}40`,
                }}
                onMouseEnter={() => setShowZodiacTooltip(true)}
                onMouseLeave={() => setShowZodiacTooltip(false)}
              >
                {zodiac.symbol} {zodiac.name}
              </span>
              <AnimatePresence>
                {showZodiacTooltip && (
                  <motion.div
                    className="absolute z-50 top-full mt-3 left-1/2 -translate-x-1/2 w-72 glass rounded-xl p-4 shadow-2xl text-left"
                    style={{ borderWidth: 1, borderColor: `${getElementColor(zodiac.element)}30` }}
                    variants={tooltipMotion} initial="hidden" animate="visible" exit="hidden"
                    transition={{ duration: 0.15 }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[rgba(25,25,55,0.6)]"
                      style={{ borderLeft: `1px solid ${getElementColor(zodiac.element)}30`, borderTop: `1px solid ${getElementColor(zodiac.element)}30` }} />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl" style={{ color: getElementColor(zodiac.element) }}>{zodiac.symbol}</span>
                        <div>
                          <div className="text-sm font-bold" style={{ color: getElementColor(zodiac.element) }}>{zodiac.name}</div>
                          <div className="text-[0.65rem] text-text-muted">{zodiac.dates}</div>
                        </div>
                        <span className="ml-auto py-0.5 px-2 rounded-full text-[0.6rem] font-semibold"
                          style={{ backgroundColor: `${getElementColor(zodiac.element)}20`, color: getElementColor(zodiac.element) }}>
                          {zodiac.element}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed mb-3">{zodiac.description}</p>
                      <ul className="space-y-1.5">
                        {zodiac.traits.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-xs text-white/80">
                            <span style={{ color: getElementColor(zodiac.element) }} className="mt-0.5 text-[0.6rem]">●</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroRing;
