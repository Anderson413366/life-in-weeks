import React, { useEffect } from "react";
import { useFamousBirthdays } from "../../hooks/useFamousBirthdays";

interface BornOnYourDaySectionProps {
  birthMonth: number;
  birthDay: number;
  cardClassName: string;
}

const BornOnYourDaySection: React.FC<BornOnYourDaySectionProps> = ({
  birthMonth,
  birthDay,
  cardClassName,
}) => {
  const famousBirthdays = useFamousBirthdays(birthMonth, birthDay);

  useEffect(() => {
    if (!famousBirthdays.people.length && !famousBirthdays.loading && !famousBirthdays.error) {
      void famousBirthdays.fetch();
    }
  }, [famousBirthdays]);

  if (famousBirthdays.loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${cardClassName} min-w-[140px] max-w-[140px] p-4 animate-pulse`}>
            <div className="w-8 h-8 bg-[rgba(120,80,200,0.15)] rounded-full mb-2" />
            <div className="w-full h-3 bg-[rgba(120,80,200,0.15)] rounded mb-1" />
            <div className="w-2/3 h-2 bg-[rgba(120,80,200,0.15)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (famousBirthdays.error === "no-key") {
    return <p className="text-sm text-white/60 text-center py-4">Add your AI key in Settings to see famous people born on your day.</p>;
  }

  if (famousBirthdays.error) {
    return <p className="text-sm text-red-400 text-center py-4">{famousBirthdays.error}</p>;
  }

  if (famousBirthdays.people.length === 0) {
    return <p className="text-sm text-white/60 text-center py-4">No birthdays found yet.</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
      {famousBirthdays.people.map((p) => (
        <div key={p.name} className={`${cardClassName} min-w-[140px] max-w-[140px] p-4 shrink-0`}>
          <div className="text-3xl mb-2">{p.emoji}</div>
          <div className="text-white font-bold text-sm leading-tight">{p.name}</div>
          <div className="mt-1">
            <span className="bg-[rgba(120,80,200,0.15)] text-[#00d4ff] text-[0.5rem] uppercase tracking-wide rounded-full px-2 py-0.5 font-semibold">
              {p.field}
            </span>
          </div>
          <div className="text-white/60 text-xs mt-1">{p.born} – {p.died ?? "alive"}</div>
          <div className="text-white/85 text-xs leading-snug mt-1">{p.tagline}</div>
        </div>
      ))}
    </div>
  );
};

export default BornOnYourDaySection;
