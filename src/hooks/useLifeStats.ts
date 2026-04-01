import { useMemo, useState, useEffect } from "react";
import {
  differenceInWeeks,
  differenceInDays,
  differenceInSeconds,
  addDays,
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import type { LifeStats, DynamicStats } from "../types";
import {
  WEEKS_IN_YEAR,
  DAYS_IN_YEAR_AVG,
  HOURS_IN_DAY,
  MINUTES_IN_HOUR,
  SECONDS_IN_MINUTE,
  WAKING_TIME_FACTOR,
} from "../constants";

const EMPTY_DYNAMIC: DynamicStats = {
  secondsLived: 0,
  minutesLived: 0,
  hoursLived: 0,
  secondsRemaining: 0,
  minutesRemaining: 0,
  hoursRemaining: 0,
  percentDayPassed: 0,
  percentMonthPassed: 0,
  percentYearPassed: 0,
  wakingHoursLived: 0,
  wakingHoursRemaining: 0,
};

export function useLifeStats(birthdate: string, totalYears: number) {
  // Recalculate when the calendar date changes (not just birthdate/totalYears)
  const todayKey = new Date().toDateString();

  const lifeStats = useMemo<LifeStats | null>(() => {
    if (!birthdate) return null;

    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    const endDate = addDays(birth, totalYears * DAYS_IN_YEAR_AVG);

    const daysPassed = differenceInDays(today, birth);
    const totalLifeDays = differenceInDays(endDate, birth);
    const daysRemaining = Math.max(0, totalLifeDays - daysPassed);

    const weeksPassed = differenceInWeeks(today, birth);
    const totalLifeWeeks = totalYears * WEEKS_IN_YEAR;
    const weeksRemaining = Math.max(0, totalLifeWeeks - weeksPassed);

    const percentageLived =
      totalLifeDays > 0 ? ((daysPassed / totalLifeDays) * 100).toFixed(2) : "0.00";

    return {
      daysPassed,
      daysRemaining,
      totalLifeDays,
      weeksPassed,
      weeksRemaining,
      totalLifeWeeks,
      percentageLived,
      milestones: {
        quarter: format(addDays(birth, totalLifeDays / 4), "MMM d, yyyy"),
        halfway: format(addDays(birth, totalLifeDays / 2), "MMM d, yyyy"),
        threeQuarter: format(addDays(birth, totalLifeDays * 0.75), "MMM d, yyyy"),
      },
      currentWeekInYear: (weeksPassed % WEEKS_IN_YEAR) + 1,
      currentYearOfLife: Math.floor(weeksPassed / WEEKS_IN_YEAR),
      currentDateFormatted: format(today, "MMM d, yyyy"),
      totalLifeSeconds: totalLifeDays * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthdate, totalYears, todayKey]);

  const [dynamicStats, setDynamicStats] = useState<DynamicStats>(EMPTY_DYNAMIC);

  useEffect(() => {
    if (!birthdate || !lifeStats) {
      setDynamicStats(EMPTY_DYNAMIC);
      return;
    }

    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return;

    function tick() {
      const now = new Date();
      const secLived = differenceInSeconds(now, birth);
      const secRemaining = Math.max(0, lifeStats!.totalLifeSeconds - secLived);

      const dayStart = startOfDay(now);
      const secInDay = HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
      const secToday = differenceInSeconds(now, dayStart);

      const mStart = startOfMonth(now);
      const mEnd = endOfMonth(now);
      const nextMonth = startOfMonth(addDays(mEnd, 1));
      const secMonth = differenceInSeconds(nextMonth, mStart);
      const secPassedMonth = differenceInSeconds(now, mStart);

      const yStart = startOfYear(now);
      const yEnd = endOfYear(now);
      const nextYear = startOfYear(addDays(yEnd, 1));
      const secYear = differenceInSeconds(nextYear, yStart);
      const secPassedYear = differenceInSeconds(now, yStart);

      const SPM = SECONDS_IN_MINUTE;
      const SPH = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;

      setDynamicStats({
        secondsLived: secLived,
        minutesLived: Math.floor(secLived / SPM),
        hoursLived: Math.floor(secLived / SPH),
        secondsRemaining: secRemaining,
        minutesRemaining: Math.floor(secRemaining / SPM),
        hoursRemaining: Math.floor(secRemaining / SPH),
        percentDayPassed: (secToday / secInDay) * 100,
        percentMonthPassed: (secPassedMonth / secMonth) * 100,
        percentYearPassed: (secPassedYear / secYear) * 100,
        wakingHoursLived: Math.floor((secLived * WAKING_TIME_FACTOR) / SPH),
        wakingHoursRemaining: Math.floor((secRemaining * WAKING_TIME_FACTOR) / SPH),
      });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [birthdate, lifeStats]);

  return { lifeStats, dynamicStats };
}
