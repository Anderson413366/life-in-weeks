export interface ZodiacSign {
  name: string;
  symbol: string;
  element: string;
  dates: string;
  traits: string[];
  description: string;
}

const SIGNS: { month: number; day: number; sign: ZodiacSign }[] = [
  { month: 1, day: 20, sign: { name: "Capricorn",   symbol: "♑", element: "Earth", dates: "Dec 22 – Jan 19",  description: "Ambitious and disciplined. Capricorns are master planners who climb steadily toward their goals.", traits: ["Ambitious & determined", "Disciplined & patient", "Practical strategist", "Natural leader"] } },
  { month: 2, day: 19, sign: { name: "Aquarius",    symbol: "♒", element: "Air",   dates: "Jan 20 – Feb 18",  description: "Innovative and independent. Aquarians are visionary thinkers who challenge the status quo.", traits: ["Independent thinker", "Humanitarian spirit", "Innovative & original", "Values freedom"] } },
  { month: 3, day: 20, sign: { name: "Pisces",      symbol: "♓", element: "Water", dates: "Feb 19 – Mar 20",  description: "Intuitive and compassionate. Pisces are deeply empathetic dreamers with rich inner worlds.", traits: ["Deeply intuitive", "Creative & artistic", "Compassionate soul", "Emotionally intelligent"] } },
  { month: 4, day: 20, sign: { name: "Aries",       symbol: "♈", element: "Fire",  dates: "Mar 21 – Apr 19",  description: "Bold and energetic. Aries are fearless trailblazers who thrive on challenge and competition.", traits: ["Courageous & bold", "Natural-born leader", "Energetic & passionate", "Loves a challenge"] } },
  { month: 5, day: 21, sign: { name: "Taurus",      symbol: "♉", element: "Earth", dates: "Apr 20 – May 20",  description: "Reliable and patient. Taureans appreciate beauty, comfort, and the finer things in life.", traits: ["Steady & reliable", "Appreciates beauty", "Strong-willed", "Loyal to the core"] } },
  { month: 6, day: 21, sign: { name: "Gemini",      symbol: "♊", element: "Air",   dates: "May 21 – Jun 20",  description: "Curious and adaptable. Geminis are quick-witted communicators who love variety and learning.", traits: ["Quick-witted & curious", "Excellent communicator", "Adaptable & versatile", "Loves to learn"] } },
  { month: 7, day: 23, sign: { name: "Cancer",      symbol: "♋", element: "Water", dates: "Jun 21 – Jul 22",  description: "Nurturing and protective. Cancers are deeply loyal and create strong emotional bonds.", traits: ["Deeply nurturing", "Strong intuition", "Fiercely protective", "Values home & family"] } },
  { month: 8, day: 23, sign: { name: "Leo",         symbol: "♌", element: "Fire",  dates: "Jul 23 – Aug 22",  description: "Confident and charismatic. Leos are natural performers who light up every room they enter.", traits: ["Charismatic & confident", "Generous spirit", "Creative self-expression", "Born to lead"] } },
  { month: 9, day: 23, sign: { name: "Virgo",       symbol: "♍", element: "Earth", dates: "Aug 23 – Sep 22",  description: "Analytical and detail-oriented. Virgos are perfectionists who find beauty in order and precision.", traits: ["Analytical mind", "Detail-oriented", "Service-driven", "Practical perfectionist"] } },
  { month: 10, day: 23, sign: { name: "Libra",      symbol: "♎", element: "Air",   dates: "Sep 23 – Oct 22",  description: "Balanced and diplomatic. Libras seek harmony, beauty, and fairness in all things.", traits: ["Seeks balance & harmony", "Diplomatic & fair", "Appreciation for art", "Social & charming"] } },
  { month: 11, day: 22, sign: { name: "Scorpio",    symbol: "♏", element: "Water", dates: "Oct 23 – Nov 21",  description: "Intense and perceptive. Scorpios are passionate seekers of truth with powerful determination.", traits: ["Intensely passionate", "Deeply perceptive", "Resourceful & strategic", "Unwavering determination"] } },
  { month: 12, day: 22, sign: { name: "Sagittarius", symbol: "♐", element: "Fire", dates: "Nov 22 – Dec 21",  description: "Adventurous and optimistic. Sagittarians are philosophical explorers with an infectious enthusiasm.", traits: ["Adventurous spirit", "Philosophical thinker", "Optimistic & honest", "Freedom-loving explorer"] } },
  // Capricorn wraps around (Dec 22+)
  { month: 12, day: 31, sign: { name: "Capricorn",  symbol: "♑", element: "Earth", dates: "Dec 22 – Jan 19",  description: "Ambitious and disciplined. Capricorns are master planners who climb steadily toward their goals.", traits: ["Ambitious & determined", "Disciplined & patient", "Practical strategist", "Natural leader"] } },
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire:  "#ff6b6b",
  Earth: "#4caf50",
  Air:   "#00d4ff",
  Water: "#2196F3",
};

export function getZodiacSign(month: number, day: number): ZodiacSign | null {
  for (const entry of SIGNS) {
    if (month < entry.month || (month === entry.month && day <= entry.day)) {
      return entry.sign;
    }
  }
  return SIGNS[SIGNS.length - 1].sign; // Capricorn fallback
}

export function getElementColor(element: string): string {
  return ELEMENT_COLORS[element] ?? "#b4b4c7";
}
