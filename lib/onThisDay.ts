interface Fact {
  year: number;
  text: string;
  category: string;
}

// Curated set of fascinating facts by month-day
const FACTS: Record<string, Fact[]> = {
  "1-1":   [{ year: 1983, text: "The Internet was born — ARPANET switched to TCP/IP", category: "tech" }],
  "1-9":   [{ year: 2007, text: "Steve Jobs unveiled the first iPhone", category: "tech" }],
  "1-27":  [{ year: 1756, text: "Mozart was born in Salzburg, Austria", category: "culture" }],
  "2-4":   [{ year: 2004, text: "Facebook was launched from a Harvard dorm room", category: "tech" }],
  "2-12":  [{ year: 1809, text: "Abraham Lincoln and Charles Darwin were both born", category: "history" }],
  "2-14":  [{ year: 1876, text: "Alexander Graham Bell filed the patent for the telephone", category: "science" }],
  "3-8":   [{ year: 1911, text: "International Women's Day was celebrated for the first time", category: "history" }],
  "3-14":  [{ year: 1879, text: "Albert Einstein was born", category: "science" }],
  "3-20":  [{ year: 2003, text: "The Spring Equinox — day and night are nearly equal", category: "nature" }],
  "4-12":  [{ year: 1961, text: "Yuri Gagarin became the first human in space", category: "science" }],
  "4-15":  [{ year: 1452, text: "Leonardo da Vinci was born", category: "culture" }],
  "4-22":  [{ year: 1970, text: "The first Earth Day was celebrated", category: "nature" }],
  "5-1":   [{ year: 1886, text: "Workers rallied for the 8-hour workday, creating May Day", category: "history" }],
  "5-14":  [{ year: 1796, text: "Edward Jenner performed the first successful vaccination", category: "science" }],
  "5-25":  [{ year: 1977, text: "Star Wars premiered in theaters", category: "culture" }],
  "6-16":  [{ year: 1963, text: "Valentina Tereshkova became the first woman in space", category: "science" }],
  "6-21":  [{ year: 2004, text: "Summer Solstice — the longest day of the year", category: "nature" }],
  "6-28":  [{ year: 1969, text: "The Stonewall Riots began, launching the modern LGBTQ+ movement", category: "history" }],
  "7-4":   [{ year: 1776, text: "The United States Declaration of Independence was adopted", category: "history" }],
  "7-20":  [{ year: 1969, text: "Neil Armstrong and Buzz Aldrin walked on the Moon", category: "science" }],
  "7-30":  [{ year: 1863, text: "Henry Ford was born", category: "history" }],
  "8-6":   [{ year: 1991, text: "The first website went live at CERN", category: "tech" }],
  "8-28":  [{ year: 1963, text: "Martin Luther King Jr. delivered 'I Have a Dream'", category: "history" }],
  "9-12":  [{ year: 1959, text: "The first object reached the Moon — Luna 2", category: "science" }],
  "9-21":  [{ year: 2001, text: "International Day of Peace was established by the UN", category: "history" }],
  "10-4":  [{ year: 1957, text: "Sputnik launched — the Space Age began", category: "science" }],
  "10-29": [{ year: 1969, text: "The first ARPANET message was sent between two computers", category: "tech" }],
  "10-31": [{ year: 1517, text: "Martin Luther posted his 95 Theses", category: "history" }],
  "11-9":  [{ year: 1989, text: "The Berlin Wall fell", category: "history" }],
  "11-12": [{ year: 1990, text: "Tim Berners-Lee published a formal proposal for the World Wide Web", category: "tech" }],
  "12-1":  [{ year: 1955, text: "Rosa Parks refused to give up her bus seat", category: "history" }],
  "12-10": [{ year: 1948, text: "The Universal Declaration of Human Rights was adopted", category: "history" }],
  "12-17": [{ year: 1903, text: "The Wright Brothers achieved the first powered flight", category: "science" }],
  "12-25": [{ year: 1990, text: "Tim Berners-Lee made the first successful HTTP communication", category: "tech" }],
};

// General fun facts for days without specific entries
const GENERAL_FACTS = [
  "The average person spends about 6 months of their life waiting for red lights.",
  "A day on Venus is longer than its year.",
  "Honey never spoils — 3,000-year-old honey was found edible in Egyptian tombs.",
  "Octopuses have three hearts and blue blood.",
  "The human brain uses about 20% of the body's total energy.",
  "There are more stars in the universe than grains of sand on Earth.",
  "A group of flamingos is called a 'flamboyance'.",
  "Bananas are berries, but strawberries aren't.",
  "The shortest war in history lasted 38 minutes (Britain vs. Zanzibar, 1896).",
  "Your nose can detect over 1 trillion different scents.",
  "Light from the Sun takes 8 minutes and 20 seconds to reach Earth.",
  "The human body contains enough iron to make a 3-inch nail.",
  "A cloud can weigh more than a million pounds.",
  "Trees can communicate with each other through underground fungal networks.",
  "You produce about 25,000 quarts of saliva in a lifetime — enough to fill two swimming pools.",
];

export interface OnThisDayResult {
  fact: Fact | null;
  funFact: string;
}

export function getOnThisDay(month: number, day: number): OnThisDayResult {
  const key = `${month}-${day}`;
  const facts = FACTS[key];
  const fact = facts ? facts[Math.floor(Math.random() * facts.length)] : null;

  // Deterministic-ish fun fact based on month+day
  const funFact = GENERAL_FACTS[(month * 31 + day) % GENERAL_FACTS.length];

  return { fact, funFact };
}
