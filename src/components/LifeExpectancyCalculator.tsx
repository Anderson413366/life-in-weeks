import React, { useState } from "react";

interface LifeExpectancyCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (years: number) => void;
  currentAge: number;
}

interface Question {
  id: string;
  question: string;
  options: { label: string; value: string; emoji: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "sex",
    question: "What is your biological sex?",
    options: [
      { label: "Female", value: "female", emoji: "♀️" },
      { label: "Male", value: "male", emoji: "♂️" },
    ],
  },
  {
    id: "family",
    question: "Did any of your grandparents or parents live past 85?",
    options: [
      { label: "Yes, multiple", value: "many", emoji: "👴" },
      { label: "Yes, one or two", value: "some", emoji: "🧓" },
      { label: "No", value: "none", emoji: "😐" },
      { label: "Not sure", value: "unknown", emoji: "🤷" },
    ],
  },
  {
    id: "smoking",
    question: "What's your smoking status?",
    options: [
      { label: "Never smoked", value: "never", emoji: "🚭" },
      { label: "Quit years ago", value: "quit", emoji: "✅" },
      { label: "Occasionally", value: "occasional", emoji: "🚬" },
      { label: "Regular smoker", value: "regular", emoji: "💨" },
    ],
  },
  {
    id: "exercise",
    question: "How often do you exercise?",
    options: [
      { label: "5+ times/week", value: "high", emoji: "🏋️" },
      { label: "2-4 times/week", value: "moderate", emoji: "🏃" },
      { label: "Once a week", value: "low", emoji: "🚶" },
      { label: "Rarely/never", value: "none", emoji: "🛋️" },
    ],
  },
  {
    id: "diet",
    question: "How would you describe your diet?",
    options: [
      { label: "Very healthy, whole foods", value: "excellent", emoji: "🥗" },
      { label: "Mostly healthy", value: "good", emoji: "🍎" },
      { label: "Average, some junk food", value: "average", emoji: "🍕" },
      { label: "Mostly processed food", value: "poor", emoji: "🍔" },
    ],
  },
  {
    id: "weight",
    question: "How would you describe your weight?",
    options: [
      { label: "Healthy range", value: "healthy", emoji: "⚖️" },
      { label: "Slightly overweight", value: "slight", emoji: "📊" },
      { label: "Significantly overweight", value: "significant", emoji: "⬆️" },
      { label: "Underweight", value: "under", emoji: "⬇️" },
    ],
  },
  {
    id: "alcohol",
    question: "How much alcohol do you consume?",
    options: [
      { label: "None", value: "none", emoji: "🚫" },
      { label: "Moderate (1-2/week)", value: "moderate", emoji: "🍷" },
      { label: "Regular (daily)", value: "regular", emoji: "🍺" },
      { label: "Heavy", value: "heavy", emoji: "⚠️" },
    ],
  },
  {
    id: "sleep",
    question: "How's your sleep quality?",
    options: [
      { label: "Great, 7-9 hours", value: "great", emoji: "😴" },
      { label: "Okay, sometimes restless", value: "okay", emoji: "💤" },
      { label: "Poor, often tired", value: "poor", emoji: "😫" },
      { label: "Very poor / insomnia", value: "terrible", emoji: "🌙" },
    ],
  },
  {
    id: "stress",
    question: "What's your typical stress level?",
    options: [
      { label: "Low, life is calm", value: "low", emoji: "🧘" },
      { label: "Moderate, manageable", value: "moderate", emoji: "😌" },
      { label: "High, often overwhelmed", value: "high", emoji: "😰" },
      { label: "Very high, constant", value: "very_high", emoji: "🤯" },
    ],
  },
  {
    id: "social",
    question: "How strong is your social network?",
    options: [
      { label: "Very strong, close friends & family", value: "strong", emoji: "❤️" },
      { label: "Good, some close connections", value: "good", emoji: "🤝" },
      { label: "Limited, mostly alone", value: "limited", emoji: "😐" },
      { label: "Very isolated", value: "isolated", emoji: "😔" },
    ],
  },
  {
    id: "conditions",
    question: "Do you have any chronic health conditions?",
    options: [
      { label: "None", value: "none", emoji: "💪" },
      { label: "One, managed well", value: "one_managed", emoji: "💊" },
      { label: "Multiple conditions", value: "multiple", emoji: "🏥" },
      { label: "Prefer not to say", value: "skip", emoji: "🤐" },
    ],
  },
  {
    id: "mental",
    question: "How would you rate your mental health?",
    options: [
      { label: "Excellent", value: "excellent", emoji: "🌟" },
      { label: "Good, with ups and downs", value: "good", emoji: "🙂" },
      { label: "Struggling sometimes", value: "struggling", emoji: "😟" },
      { label: "Seeking help / in treatment", value: "treatment", emoji: "🩺" },
    ],
  },
];

// Scoring based on actuarial research
const SCORES: Record<string, Record<string, number>> = {
  sex:        { female: 3, male: 0 },
  family:     { many: 4, some: 2, none: -1, unknown: 0 },
  smoking:    { never: 3, quit: 1, occasional: -3, regular: -8 },
  exercise:   { high: 4, moderate: 2, low: 0, none: -3 },
  diet:       { excellent: 3, good: 1, average: 0, poor: -3 },
  weight:     { healthy: 2, slight: 0, significant: -3, under: -1 },
  alcohol:    { none: 1, moderate: 1, regular: -2, heavy: -5 },
  sleep:      { great: 2, okay: 0, poor: -2, terrible: -4 },
  stress:     { low: 2, moderate: 0, high: -2, very_high: -4 },
  social:     { strong: 3, good: 1, limited: -1, isolated: -3 },
  conditions: { none: 2, one_managed: 0, multiple: -4, skip: 0 },
  mental:     { excellent: 2, good: 1, struggling: -2, treatment: -1 },
};

const BASELINE = 78; // Global average

function calculate(answers: Record<string, string>): { estimate: number; breakdown: { factor: string; impact: number }[] } {
  let total = BASELINE;
  const breakdown: { factor: string; impact: number }[] = [];

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (!answer) continue;
    const impact = SCORES[q.id]?.[answer] ?? 0;
    if (impact !== 0) {
      breakdown.push({
        factor: q.question.replace("?", "").replace("What's your ", "").replace("How ", "").replace("Do you have any ", ""),
        impact,
      });
    }
    total += impact;
  }

  // Clamp to reasonable range
  total = Math.max(50, Math.min(105, total));
  breakdown.sort((a, b) => b.impact - a.impact);

  return { estimate: Math.round(total), breakdown };
}

const LifeExpectancyCalculator: React.FC<LifeExpectancyCalculatorProps> = ({ isOpen, onClose, onAccept, currentAge }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ estimate: number; breakdown: { factor: string; impact: number }[] } | null>(null);

  function handleAnswer(value: string) {
    const q = QUESTIONS[step];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult(calculate(newAnswers));
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setResult(null);
  }

  if (!isOpen) return null;

  const progress = result ? 100 : ((step / QUESTIONS.length) * 100);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[1000] p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-dark rounded-xl w-full max-w-md shadow-2xl border border-box-border overflow-hidden animate-fade-in">
        {/* Progress bar */}
        <div className="h-1 bg-[rgba(255,255,255,0.05)]">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${progress}%`, transition: "width 300ms ease" }}
          />
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-primary">Life Expectancy Estimator</h3>
              <p className="text-[0.65rem] text-text-muted/60">Based on actuarial research</p>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-white">✕</button>
          </div>

          {result ? (
            <div key="result" className="flex flex-col gap-4 animate-fade-in">
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-white glow-cyan counter-digits">{result.estimate}</div>
                  <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Estimated Years</div>
                  <div className="text-xs text-text-muted/50 mt-0.5">
                    ~{Math.max(0, result.estimate - currentAge)} years remaining
                  </div>
                </div>

                {/* Top factors */}
                <div className="glass rounded-lg p-3">
                  <div className="text-[0.6rem] text-text-muted/60 uppercase tracking-wider mb-2">Key Factors</div>
                  <div className="flex flex-col gap-1.5">
                    {result.breakdown.slice(0, 5).map((f) => (
                      <div key={f.factor} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted truncate">{f.factor}</span>
                        <span className={`font-semibold ${f.impact > 0 ? "text-[#34C759]" : "text-accent"}`}>
                          {f.impact > 0 ? "+" : ""}{f.impact} yrs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[0.55rem] text-text-muted/40 text-center">
                  This is a rough estimate based on population averages. Individual outcomes vary greatly. Always consult healthcare professionals.
                </p>

                <div className="flex gap-2">
                  <button onClick={handleReset} className="flex-1 h-10 rounded-lg border border-box-border text-text-muted text-xs hover:text-white transition-colors">
                    Retake
                  </button>
                  <button
                    onClick={() => { onAccept(result.estimate); onClose(); }}
                    className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-dark text-bg-dark text-xs font-semibold transition-colors"
                  >
                    Use {result.estimate} Years
                  </button>
                </div>
            </div>
          ) : (
            <div key={`q-${step}`} className="flex flex-col gap-4 animate-fade-in">
                <div className="text-xs text-text-muted/50 mb-1">
                  Question {step + 1} of {QUESTIONS.length}
                </div>
                <h4 className="text-sm sm:text-base font-medium text-white leading-relaxed">
                  {QUESTIONS[step].question}
                </h4>
                <div className="flex flex-col gap-2">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all
                        ${answers[QUESTIONS[step].id] === opt.value
                          ? "border-primary bg-primary/10 text-white"
                          : "border-box-border/50 text-text-muted hover:border-primary/30 hover:text-white hover:bg-[rgba(255,255,255,0.02)]"
                        }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="text-xs text-text-muted/50 hover:text-primary transition-colors self-start">
                    ← Back
                  </button>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LifeExpectancyCalculator;
