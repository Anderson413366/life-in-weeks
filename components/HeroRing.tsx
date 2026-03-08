import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGeneration } from "../lib/generations";
import { getZodiacSign, getElementColor } from "../lib/zodiac";

interface HeroRingProps {
  percentage: number;
  label: string;
  dateFormatted: string;
  weekInYear: number;
  yearOfLife: number;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
}

const SIZE = 220;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const tooltipVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const HeroRing: React.FC<HeroRingProps> = ({ percentage, label, dateFormatted, weekInYear, yearOfLife, birthYear, birthMonth, birthDay }) => {
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
  const generation = birthYear ? getGeneration(birthYear) : null;
  const zodiac = birthMonth && birthDay ? getZodiacSign(birthMonth, birthDay) : null;

  const [showGenTooltip, setShowGenTooltip] = useState(false);
  const [showZodiacTooltip, setShowZodiacTooltip] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle className="hero-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          <circle
            className="hero-ring-progress"
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE}
            stroke="url(#ring-gradient)" strokeDasharray={CIRCUMFERENCE}
            style={{ "--ring-circumference": CIRCUMFERENCE, "--ring-offset": offset } as React.CSSProperties}
          />
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#8e44ad" />
              <stop offset="100%" stopColor="#ff6b6b" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl sm:text-5xl font-bold text-white glow-cyan counter-digits">{percentage}%</span>
          <span className="text-[0.65rem] text-text-muted mt-0.5 tracking-widest uppercase">{label}</span>
        </div>
      </div>

      {/* Date & badges */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-lg sm:text-xl font-semibold text-white tracking-wide">{dateFormatted}</div>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="py-1 px-4 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
            Week {weekInYear}
          </span>
          <span className="py-1 px-4 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
            Year {yearOfLife}
          </span>

          {/* Generation badge */}
          {generation && (
            <div className="relative">
              <span
                className="py-1 px-4 rounded-full text-xs font-semibold bg-[#8e44ad]/20 text-[#c39bd3] border border-[#8e44ad]/30 cursor-pointer transition-all hover:bg-[#8e44ad]/30 hover:border-[#8e44ad]/50"
                onMouseEnter={() => setShowGenTooltip(true)}
                onMouseLeave={() => setShowGenTooltip(false)}
              >
                {generation.emoji} {generation.name}
              </span>
              <AnimatePresence>
                {showGenTooltip && (
                  <motion.div
                    className="absolute z-50 top-full mt-3 left-1/2 -translate-x-1/2 w-72 glass rounded-xl p-4 shadow-2xl border border-[#8e44ad]/30 text-left"
                    variants={tooltipVariants} initial="hidden" animate="visible" exit="hidden"
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
                            <span className="text-[#8e44ad] mt-0.5 text-[0.6rem]">●</span>
                            {t}
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
                    variants={tooltipVariants} initial="hidden" animate="visible" exit="hidden"
                    transition={{ duration: 0.15 }}
                  >
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[rgba(25,25,55,0.6)]"
                      style={{ borderLeft: `1px solid ${getElementColor(zodiac.element)}30`, borderTop: `1px solid ${getElementColor(zodiac.element)}30` }}
                    />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl" style={{ color: getElementColor(zodiac.element) }}>{zodiac.symbol}</span>
                        <div>
                          <div className="text-sm font-bold" style={{ color: getElementColor(zodiac.element) }}>{zodiac.name}</div>
                          <div className="text-[0.65rem] text-text-muted">{zodiac.dates}</div>
                        </div>
                        <span
                          className="ml-auto py-0.5 px-2 rounded-full text-[0.6rem] font-semibold"
                          style={{
                            backgroundColor: `${getElementColor(zodiac.element)}20`,
                            color: getElementColor(zodiac.element),
                          }}
                        >
                          {zodiac.element}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed mb-3">{zodiac.description}</p>
                      <ul className="space-y-1.5">
                        {zodiac.traits.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-xs text-white/80">
                            <span style={{ color: getElementColor(zodiac.element) }} className="mt-0.5 text-[0.6rem]">●</span>
                            {t}
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
