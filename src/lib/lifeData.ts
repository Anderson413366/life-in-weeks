import { differenceInSeconds, differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths, format, getDay } from "date-fns";
import type { UserAverages } from "../types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Cosmic
const EARTH_ORBITAL_SPEED_KM_H = 107_226;
const LUNAR_CYCLE_DAYS = 29.53;
const AVG_DREAMS_PER_NIGHT = 4;

export interface ExactAge {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface BiologyStats {
  heartbeats: number;
  breaths: number;
  blinks: number;
  hoursSlept: number;
  yearsSlept: number;
}

export interface CosmicStats {
  orbitsAroundSun: number;
  distanceThroughSpaceKm: number;
  distanceThroughSpaceMiles: number;
  fullMoons: number;
  seasonsExperienced: number;
  sunrises: number;
}

export interface LifeInNumbers {
  mealsEaten: number;
  wordsSpoken: number;
  stepsTaken: number;
  dreamsHad: number;
  laughs: number;
}

export interface TimeSpent {
  sleepingYears: number;
  eatingMonths: number;
  screenTimeYears: number;
}

export interface BirthdayCountdown {
  daysUntil: number;
  turningAge: number;
  nextBirthdayDate: string;
}

export interface BirthDayInfo {
  dayOfWeek: string;
}

export interface AlternativeAges {
  dogYears: number;
  catYears: number;
  marsYears: number;
  mercuryYears: number;
  venusYears: number;
  jupiterYears: number;
}

export function getExactAge(birthDate: Date, now: Date): ExactAge {
  const years = differenceInYears(now, birthDate);
  const afterYears = addYears(birthDate, years);
  const months = differenceInMonths(now, afterYears);
  const afterMonths = addMonths(afterYears, months);
  const days = differenceInDays(now, afterMonths);

  const totalSecsToday = differenceInSeconds(now, afterMonths) - days * 86400;
  const hours = Math.floor(totalSecsToday / 3600);
  const minutes = Math.floor((totalSecsToday % 3600) / 60);
  const seconds = totalSecsToday % 60;

  return { years, months, days, hours, minutes, seconds };
}

export function getBiologyStats(birthDate: Date, now: Date, avg: UserAverages): BiologyStats {
  const totalSeconds = differenceInSeconds(now, birthDate);
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalSeconds / 3600;
  const sleepFraction = avg.avg_sleep_hours / 24;
  const wakingFraction = 1 - sleepFraction;

  return {
    heartbeats: Math.round(totalMinutes * avg.avg_heartbeats_per_min),
    breaths: Math.round(totalMinutes * avg.avg_breaths_per_min),
    blinks: Math.round(totalMinutes * wakingFraction * avg.avg_blinks_per_min),
    hoursSlept: Math.round(totalHours * sleepFraction),
    yearsSlept: parseFloat((totalHours * sleepFraction / 8766).toFixed(1)),
  };
}

export function getCosmicStats(birthDate: Date, now: Date): CosmicStats {
  const totalHours = differenceInSeconds(now, birthDate) / 3600;
  const totalDays = totalHours / 24;
  const years = totalDays / 365.25;

  return {
    orbitsAroundSun: parseFloat(years.toFixed(2)),
    distanceThroughSpaceKm: Math.round(totalHours * EARTH_ORBITAL_SPEED_KM_H),
    distanceThroughSpaceMiles: Math.round(totalHours * EARTH_ORBITAL_SPEED_KM_H * 0.621371),
    fullMoons: Math.floor(totalDays / LUNAR_CYCLE_DAYS),
    seasonsExperienced: Math.floor(years * 4),
    sunrises: Math.floor(totalDays),
  };
}

export function getLifeInNumbers(birthDate: Date, now: Date, avg: UserAverages): LifeInNumbers {
  const totalDays = differenceInDays(now, birthDate);

  return {
    mealsEaten: Math.round(totalDays * avg.meals_per_day),
    wordsSpoken: Math.round(totalDays * avg.avg_words_per_day),
    stepsTaken: Math.round(totalDays * avg.avg_steps_per_day),
    dreamsHad: Math.round(totalDays * AVG_DREAMS_PER_NIGHT),
    laughs: Math.round(totalDays * avg.avg_laughs_per_day),
  };
}

export function getTimeSpent(birthDate: Date, now: Date, avg: UserAverages): TimeSpent {
  const totalHours = differenceInSeconds(now, birthDate) / 3600;
  const totalDays = totalHours / 24;

  return {
    sleepingYears: parseFloat((totalDays * avg.avg_sleep_hours / 8766).toFixed(1)),
    eatingMonths: parseFloat((totalDays * 1.2 / 730).toFixed(1)),
    screenTimeYears: parseFloat((totalDays * avg.avg_screen_hours / 8766).toFixed(1)),
  };
}

export function getBirthdayCountdown(birthDate: Date, now: Date): BirthdayCountdown {
  const thisYearBday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  let nextBday = thisYearBday;

  if (now >= thisYearBday) {
    nextBday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  return {
    daysUntil: differenceInDays(nextBday, now),
    turningAge: nextBday.getFullYear() - birthDate.getFullYear(),
    nextBirthdayDate: format(nextBday, "MMMM d, yyyy"),
  };
}

export function getBirthDayInfo(birthDate: Date): BirthDayInfo {
  return { dayOfWeek: DAY_NAMES[getDay(birthDate)] };
}

export function getAlternativeAges(birthDate: Date, now: Date): AlternativeAges {
  const earthYears = differenceInSeconds(now, birthDate) / (365.25 * 24 * 3600);

  return {
    dogYears: parseFloat((earthYears * 7).toFixed(1)),
    catYears: parseFloat((earthYears < 1 ? earthYears * 15 : earthYears < 2 ? 15 + (earthYears - 1) * 9 : 24 + (earthYears - 2) * 4).toFixed(1)),
    marsYears: parseFloat((earthYears / 1.881).toFixed(2)),
    mercuryYears: parseFloat((earthYears / 0.2408).toFixed(1)),
    venusYears: parseFloat((earthYears / 0.6152).toFixed(1)),
    jupiterYears: parseFloat((earthYears / 11.862).toFixed(3)),
  };
}

// Chinese Zodiac
const CHINESE_ANIMALS: { animal: string; emoji: string; traits: string }[] = [
  { animal: "Rat",     emoji: "🐀", traits: "Quick-witted, resourceful, kind" },
  { animal: "Ox",      emoji: "🐂", traits: "Diligent, dependable, strong" },
  { animal: "Tiger",   emoji: "🐅", traits: "Brave, competitive, confident" },
  { animal: "Rabbit",  emoji: "🐇", traits: "Quiet, elegant, gentle" },
  { animal: "Dragon",  emoji: "🐉", traits: "Confident, ambitious, charismatic" },
  { animal: "Snake",   emoji: "🐍", traits: "Enigmatic, wise, intuitive" },
  { animal: "Horse",   emoji: "🐎", traits: "Animated, active, energetic" },
  { animal: "Goat",    emoji: "🐐", traits: "Calm, gentle, creative" },
  { animal: "Monkey",  emoji: "🐒", traits: "Sharp, smart, curious" },
  { animal: "Rooster", emoji: "🐓", traits: "Observant, hardworking, courageous" },
  { animal: "Dog",     emoji: "🐕", traits: "Loyal, honest, amiable" },
  { animal: "Pig",     emoji: "🐖", traits: "Compassionate, generous, diligent" },
];

export interface ChineseZodiac {
  animal: string;
  emoji: string;
  traits: string;
}

export function getChineseZodiac(year: number): ChineseZodiac {
  const index = (year - 4) % 12;
  return CHINESE_ANIMALS[index >= 0 ? index : index + 12];
}
