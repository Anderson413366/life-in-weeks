import React from "react";
import { useHoroscope } from "../../hooks/useHoroscope";

interface HoroscopeSectionProps {
  zodiacSign: string;
  zodiacElement: string;
  birthMonth: number;
  birthDay: number;
  birthYear: number;
  currentAge: number;
  lifePercent: string;
  cardClassName: string;
  cardShadow: string;
}

const HoroscopeSection: React.FC<HoroscopeSectionProps> = ({
  zodiacSign,
  zodiacElement,
  birthMonth,
  birthDay,
  birthYear,
  currentAge,
  lifePercent,
  cardClassName,
  cardShadow,
}) => {
  const horoscope = useHoroscope(
    zodiacSign,
    zodiacElement,
    birthMonth,
    birthDay,
    birthYear,
    currentAge,
    lifePercent,
  );

  return (
    <div className={`${cardClassName} p-5 sm:p-6`} style={{ boxShadow: cardShadow }}>
      <div className="flex justify-center gap-2 mb-5">
        {(["today", "week", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => horoscope.fetch(p)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize"
            style={{
              background: horoscope.activePeriod === p && horoscope.result ? "linear-gradient(135deg, #00d4ff, #ec4899)" : "rgba(22,18,38,0.9)",
              color: horoscope.activePeriod === p && horoscope.result ? "#fff" : "#00d4ff",
              border: `1px solid ${horoscope.activePeriod === p && horoscope.result ? "transparent" : "rgba(120,80,200,0.2)"}`,
            }}
          >
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Year"}
          </button>
        ))}
      </div>
      {horoscope.loading && (
        <div className="flex flex-col items-center gap-3 py-6 animate-pulse">
          <div className="w-24 h-8 bg-[rgba(120,80,200,0.15)] rounded-xl" />
          <div className="w-full h-16 bg-[rgba(120,80,200,0.15)] rounded-xl" />
        </div>
      )}
      {horoscope.error === "no-key" && <p className="text-center text-sm text-white/60 py-4">Add your AI key in Settings to unlock your horoscope.</p>}
      {horoscope.error && horoscope.error !== "no-key" && <p className="text-center text-sm text-amber-400 py-4">⚠️ {horoscope.error}</p>}
      {horoscope.result && !horoscope.loading && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl font-black bg-gradient-to-r from-[#00d4ff] to-[#ec4899] bg-clip-text text-transparent">
            {horoscope.result.theme}
          </div>
          <p className="text-sm text-white/90 leading-relaxed text-center max-w-md">{horoscope.result.message}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#00d4ff] font-semibold">Focus: {horoscope.result.focus}</span>
            <span className="text-white/60">
              {horoscope.result.energy === "high" ? "⚡⚡⚡" : horoscope.result.energy === "medium" ? "⚡⚡" : "⚡"}
            </span>
          </div>
        </div>
      )}
      {!horoscope.result && !horoscope.loading && !horoscope.error && (
        <p className="text-center text-sm text-white/60 py-4">Tap a period above to reveal your horoscope</p>
      )}
    </div>
  );
};

export default HoroscopeSection;
