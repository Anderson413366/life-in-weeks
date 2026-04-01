import React, { useState, useEffect } from "react";
import { getExactAge, getBirthDayInfo, getChineseZodiac, type ExactAge } from "../lib/lifeData";

interface ExactAgeTickerProps {
  birthDate: Date;
  birthYear: number;
}

const UNITS: { key: keyof ExactAge; label: string }[] = [
  { key: "years",   label: "YRS" },
  { key: "months",  label: "MOS" },
  { key: "days",    label: "DAYS" },
  { key: "hours",   label: "HRS" },
  { key: "minutes", label: "MIN" },
  { key: "seconds", label: "SEC" },
];

const ExactAgeTicker: React.FC<ExactAgeTickerProps> = ({ birthDate, birthYear }) => {
  const [age, setAge] = useState<ExactAge>(() => getExactAge(birthDate, new Date()));

  useEffect(() => {
    const id = setInterval(() => setAge(getExactAge(birthDate, new Date())), 1000);
    return () => clearInterval(id);
  }, [birthDate]);

  const birthDay = getBirthDayInfo(birthDate);
  const chinese = getChineseZodiac(birthYear);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ticking age display */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {UNITS.map((u, i) => (
          <div
            key={u.key}
            className="card-base rounded-lg p-3 sm:p-4 min-w-[50px] sm:min-w-[68px] text-center overflow-hidden animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="text-xl sm:text-2xl font-bold text-white counter-digits glow-cyan">
              {age[u.key]}
            </div>
            <div className="text-[0.5rem] sm:text-[0.55rem] text-text-muted tracking-[0.2em] mt-1">
              {u.label}
            </div>
          </div>
        ))}
      </div>

      {/* Birth info badges */}
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <span className="py-1 px-3 rounded-full bg-[rgba(255,255,255,0.05)] text-text-muted border border-box-border/50">
          Born on a {birthDay.dayOfWeek}
        </span>
        <span className="py-1 px-3 rounded-full bg-[rgba(255,215,0,0.08)] text-[#ffd700] border border-[#ffd700]/20">
          {chinese.emoji} Year of the {chinese.animal}
        </span>
        <span className="py-1 px-3 rounded-full bg-[rgba(255,215,0,0.05)] text-text-muted/70 border border-box-border/30">
          {chinese.traits}
        </span>
      </div>
    </div>
  );
};

export default ExactAgeTicker;
