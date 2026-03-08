import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
import { generateDecadeImage, type DecadeInfo } from "../hooks/useTimeMirror";

interface TimeMirrorPageProps {
  birthYear: number;
  currentAge: number;
  lifeExpectancy: number;
  displayName: string;
  geminiApiKey: string;
}

type PageState = "upload" | "preview" | "generating";

const TimeMirrorPage: React.FC<TimeMirrorPageProps> = ({ birthYear, currentAge, lifeExpectancy, displayName, geminiApiKey }) => {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState("image/jpeg");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<number, { imageDataUrl?: string; error?: string }>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [aiReflection, setAiReflection] = useState<string | null>(null);

  const decades = useMemo<DecadeInfo[]>(() => {
    const arr: DecadeInfo[] = [];
    for (let age = 0; age <= lifeExpectancy; age += 10) {
      arr.push({
        age,
        year: birthYear + age,
        isPast: age < currentAge - 5,
        isCurrent: Math.abs(age - currentAge) <= 5,
        isFuture: age > currentAge + 5,
      });
    }
    return arr;
  }, [birthYear, currentAge, lifeExpectancy]);

  const handleFileSelect = useCallback((file: File) => {
    setPhotoMimeType(file.type || "image/jpeg");
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
    setResults({});
    setCompletedCount(0);
    setAiReflection(null);
  }, []);

  const startGeneration = useCallback(async () => {
    if (!photoBase64 || !geminiApiKey) return;
    setIsGenerating(true);
    setCompletedCount(0);

    for (const decade of decades) {
      try {
        const imageDataUrl = await generateDecadeImage(geminiApiKey, photoBase64, photoMimeType, decade.age, currentAge);
        setResults((prev) => ({ ...prev, [decade.age]: { imageDataUrl } }));
      } catch (err: any) {
        console.error(`Failed age ${decade.age}:`, err);
        setResults((prev) => ({ ...prev, [decade.age]: { error: err.message } }));
      }
      setCompletedCount((prev) => prev + 1);
      await new Promise((r) => setTimeout(r, 1500));
    }

    // AI reflection
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [{ role: "user", parts: [{ text: `Write a single beautiful, poetic, deeply moving sentence (max 40 words) about the miracle of a human face changing across ${decades.length} decades of life. Be philosophical and life-affirming. No clichés. No quotes.` }] }],
      });
      setAiReflection((resp.text ?? "").trim());
    } catch {}

    setIsGenerating(false);
  }, [photoBase64, geminiApiKey, photoMimeType, decades, currentAge]);

  const resetAll = useCallback(() => {
    setPreviewUrl(null);
    setPhotoBase64(null);
    setResults({});
    setCompletedCount(0);
    setAiReflection(null);
    setIsGenerating(false);
  }, []);

  const state: PageState = photoBase64 && completedCount === 0 && !isGenerating ? "preview" : isGenerating || completedCount > 0 ? "generating" : "upload";

  return (
    <motion.div className="flex flex-col w-full max-w-5xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        {state === "upload" && (
          <motion.div key="upload" className="flex flex-col items-center justify-center gap-8 py-16 text-center px-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

            <motion.div className="text-8xl select-none"
              animate={{ y: [0, -10, 0], rotateY: [0, 15, 0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              🪞
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Time Mirror</h1>
              <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
                Upload your photo. AI generates your face at every decade — from birth to {lifeExpectancy}.
              </p>
            </div>

            <label className="cursor-pointer group block">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              <motion.div
                className="w-64 h-64 rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.04] backdrop-blur-xl flex flex-col items-center justify-center gap-3 transition-all duration-300"
                whileHover={{ borderColor: "rgba(0,212,255,0.6)", backgroundColor: "rgba(255,255,255,0.08)", boxShadow: "0 0 40px rgba(0,212,255,0.15)" }}>
                <span className="text-5xl">📷</span>
                <div className="text-center">
                  <p className="text-white/60 text-sm font-medium">Drop your photo here</p>
                  <p className="text-white/25 text-xs mt-1">or tap to browse</p>
                </div>
              </motion.div>
            </label>

            <div className="space-y-1 text-center">
              <p className="text-white/25 text-xs">Best: clear face · front-facing · good lighting</p>
              {!geminiApiKey && <p className="text-amber-400/70 text-xs">⚠️ Gemini API key required — add it in Settings</p>}
            </div>
          </motion.div>
        )}

        {state === "preview" && (
          <motion.div key="preview" className="flex flex-col items-center gap-8 py-12 px-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

            <h2 className="text-2xl font-black text-white">Ready for your time journey?</h2>

            <div className="relative">
              <motion.img src={previewUrl!} className="w-44 h-44 rounded-full object-cover border-4 border-[#00d4ff]/50"
                style={{ boxShadow: "0 0 40px rgba(0,212,255,0.3)" }}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />
              <button onClick={resetAll}
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-black/60 border border-white/20 text-white/60 hover:text-white text-xs flex items-center justify-center">✕</button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {decades.map((d) => (
                <span key={d.age} className={`px-3 py-1 rounded-full text-xs font-semibold border ${d.isCurrent ? "bg-[#ec4899]/20 border-[#ec4899]/50 text-[#ec4899]" : d.isPast ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "bg-white/5 border-white/10 text-white/35"}`}>
                  Age {d.age}
                </span>
              ))}
            </div>

            <p className="text-white/25 text-xs">{decades.length} portraits · ~30–60s each · Gemini AI</p>

            <motion.button onClick={startGeneration} disabled={!geminiApiKey}
              className="px-10 py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #00d4ff, #ec4899)", boxShadow: "0 0 40px rgba(0,212,255,0.25)" }}
              whileHover={{ scale: 1.03, boxShadow: "0 0 60px rgba(236,72,153,0.35)" }}
              whileTap={{ scale: 0.97 }}>
              ✨ Generate My Timeline
            </motion.button>
          </motion.div>
        )}

        {state === "generating" && (
          <motion.div key="generating" className="flex flex-col gap-8 py-8 w-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            <div className="text-center px-4">
              {isGenerating ? (
                <div className="space-y-3 max-w-sm mx-auto">
                  <p className="text-white/60 text-sm">Generating your life timeline...</p>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #00d4ff, #ec4899)" }}
                      animate={{ width: `${(completedCount / decades.length) * 100}%` }} transition={{ duration: 0.6 }} />
                  </div>
                  <p className="text-white/30 text-xs">{completedCount} of {decades.length} complete</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-white">{displayName || "Your"} Face Through Time</h1>
                  <p className="text-white/40 text-sm">Birth year {birthYear} → Age {lifeExpectancy}</p>
                </div>
              )}
            </div>

            {/* Film strip */}
            <div className="w-full overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
              <div className="flex gap-4 px-6" style={{ width: "max-content" }}>
                {decades.map((decade, i) => {
                  const result = results[decade.age];
                  const isLoading = isGenerating && !result;

                  return (
                    <motion.div key={decade.age} className="shrink-0 flex flex-col items-center gap-3" style={{ scrollSnapAlign: "start" }}
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: result || isLoading ? 1 : 0.4, y: 0 }}
                      transition={{ delay: i * 0.05 }}>

                      <div className="relative w-40 h-48 rounded-3xl overflow-hidden" style={{
                        border: decade.isCurrent ? "2px solid #ec4899" : decade.isPast ? "2px solid rgba(0,212,255,0.5)" : "2px solid rgba(255,255,255,0.1)",
                        boxShadow: decade.isCurrent ? "0 0 30px rgba(236,72,153,0.5)" : decade.isPast ? "0 0 15px rgba(0,212,255,0.2)" : "none",
                      }}>
                        {isLoading ? (
                          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse flex flex-col items-center justify-center gap-2">
                            <motion.div className="text-3xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>✨</motion.div>
                            <p className="text-white/20 text-[0.6rem]">Generating...</p>
                          </div>
                        ) : result?.error ? (
                          <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-2 p-4">
                            <span className="text-2xl">😞</span>
                            <p className="text-white/25 text-[0.6rem] text-center leading-tight">{result.error.slice(0, 60)}</p>
                          </div>
                        ) : result?.imageDataUrl ? (
                          <>
                            <img src={result.imageDataUrl} className="w-full h-full object-cover" alt={`Age ${decade.age}`} />
                            {decade.isPast && !decade.isCurrent && <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(120,80,40,0.15)", mixBlendMode: "multiply" }} />}
                            {decade.isFuture && <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(10,10,40,0.2)" }} />}
                            {decade.isCurrent && <div className="absolute top-2 right-2 bg-[#ec4899] text-white text-[0.5rem] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">NOW</div>}
                            {decade.isFuture && <div className="absolute top-2 right-2 bg-white/10 text-white/50 text-[0.5rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">FUTURE</div>}
                          </>
                        ) : (
                          <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                            <span className="text-white/15 text-3xl">👤</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <div className={`text-lg font-black ${decade.isCurrent ? "text-[#ec4899]" : decade.isPast ? "text-[#00d4ff]" : "text-white/30"}`}>
                          Age {decade.age}
                        </div>
                        <div className="text-white/25 text-[0.6rem]">{decade.year}</div>
                        <div className={`text-[0.5rem] mt-0.5 ${decade.isCurrent ? "text-[#ec4899]/60" : decade.isPast ? "text-[#00d4ff]/40" : "text-white/15"}`}>
                          {decade.isCurrent ? "● Present" : decade.isPast ? "← Lived" : "→ Future"}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* AI Reflection */}
            {!isGenerating && aiReflection && (
              <motion.div className="max-w-xl mx-auto px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="bg-white/[0.05] border border-white/10 rounded-3xl p-8 text-center">
                  <div className="text-3xl mb-4">✨</div>
                  <p className="text-white/70 text-sm italic leading-relaxed">{aiReflection}</p>
                  <p className="text-white/20 text-xs mt-4">— Your AI Reflection</p>
                </div>
              </motion.div>
            )}

            {!isGenerating && (
              <div className="flex justify-center gap-3 px-4 pb-8">
                <button onClick={resetAll} className="px-5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-all">
                  ↺ New Photo
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TimeMirrorPage;
