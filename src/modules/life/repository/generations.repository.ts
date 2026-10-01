export interface Generation {
  name: string;
  range: string;
  emoji: string;
  traits: string[];
  description: string;
}

const GENERATIONS: { min: number; max: number; gen: Generation }[] = [
  {
    min: 1928, max: 1945,
    gen: {
      name: "Silent Generation",
      range: "1928–1945",
      emoji: "📻",
      description: "Grew up during the Great Depression and WWII. Known for discipline, loyalty, and a strong work ethic.",
      traits: ["Disciplined & hardworking", "Respect for authority", "Financially conservative", "Built post-war prosperity"],
    },
  },
  {
    min: 1946, max: 1964,
    gen: {
      name: "Baby Boomer",
      range: "1946–1964",
      emoji: "🌻",
      description: "The post-war generation that drove cultural revolutions, economic growth, and social change.",
      traits: ["Optimistic & competitive", "Defined by civil rights & counterculture", "Work-centric identity", "Largest generation until Millennials"],
    },
  },
  {
    min: 1965, max: 1980,
    gen: {
      name: "Generation X",
      range: "1965–1980",
      emoji: "📼",
      description: "The 'latchkey kids' who bridged analog and digital worlds. Independent and skeptical of institutions.",
      traits: ["Independent & resourceful", "First tech-adopters", "Work-life balance pioneers", "Skeptical of institutions"],
    },
  },
  {
    min: 1981, max: 1996,
    gen: {
      name: "Millennial",
      range: "1981–1996",
      emoji: "💻",
      description: "Digital natives who came of age during the internet revolution. Value purpose, experiences, and collaboration.",
      traits: ["Digital-first mindset", "Value experiences over things", "Purpose-driven careers", "Shaped by 9/11 & 2008 recession"],
    },
  },
  {
    min: 1997, max: 2012,
    gen: {
      name: "Generation Z",
      range: "1997–2012",
      emoji: "📱",
      description: "True digital natives raised on smartphones and social media. Pragmatic, diverse, and socially conscious.",
      traits: ["Mobile-native & always connected", "Most diverse generation", "Entrepreneurial & pragmatic", "Climate & social justice advocates"],
    },
  },
  {
    min: 2013, max: 2030,
    gen: {
      name: "Generation Alpha",
      range: "2013–present",
      emoji: "🤖",
      description: "The first generation entirely born in the 21st century. Growing up with AI, voice assistants, and immersive tech.",
      traits: ["AI-native from birth", "Highly visual learners", "Global & hyper-connected", "Shaped by pandemic-era childhood"],
    },
  },
];

export function getGeneration(birthYear: number): Generation | null {
  const match = GENERATIONS.find((g) => birthYear >= g.min && birthYear <= g.max);
  return match?.gen ?? null;
}
