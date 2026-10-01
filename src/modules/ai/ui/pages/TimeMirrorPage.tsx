import React, { useState, useMemo, useCallback, useRef } from "react";
import { generateDecadeImage, type DecadeInfo } from "../hooks/useTimeMirror";
import type { AppMode } from "@/modules/preferences";
import { Button, InfoCard, QuoteBlock, SectionPanel, Surface } from "@/shared/ui/components";
import { IMAGE_ACCEPT_ATTRIBUTE, validateImageFile } from "@/shared/lib";

interface TimeMirrorPageProps {
  birthYear: number;
  currentAge: number;
  lifeExpectancy: number;
  displayName: string;
  geminiApiKey: string;
  mode: AppMode;
  onOpenSettings: () => void;
}

type PageState = "upload" | "preview" | "generating";

const TimeMirrorPage: React.FC<TimeMirrorPageProps> = ({ birthYear, currentAge, lifeExpectancy, displayName, geminiApiKey, mode, onOpenSettings }) => {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState("image/jpeg");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<number, { imageDataUrl?: string; error?: string }>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    const validationError = validateImageFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setPhotoMimeType(file.type || "image/jpeg");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
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
    if (!photoBase64) {
      setErrorMessage("Upload a clear front-facing portrait first.");
      return;
    }

    if (!geminiApiKey) {
      setErrorMessage("Add your Gemini API key in Settings before using Time Mirror.");
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setCompletedCount(0);

    for (const decade of decades) {
      try {
        const imageDataUrl = await generateDecadeImage(geminiApiKey, photoBase64, photoMimeType, decade.age, currentAge);
        setResults((prev) => ({ ...prev, [decade.age]: { imageDataUrl } }));
      } catch (err: any) {
        setResults((prev) => ({ ...prev, [decade.age]: { error: err instanceof Error ? err.message : "Generation failed." } }));
      }
      setCompletedCount((prev) => prev + 1);
      await new Promise((r) => setTimeout(r, 1500));
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: `Write a single beautiful, poetic, deeply moving sentence (max 40 words) about the miracle of a human face changing across ${decades.length} decades of life. Be philosophical and life-affirming. No clichés. No quotes.` }] }],
      });
      setAiReflection((resp.text ?? "").trim());
    } catch {
      setAiReflection("A life can change a face gently, decade by decade, without ever erasing the person inside it.");
    }

    setIsGenerating(false);
  }, [photoBase64, geminiApiKey, photoMimeType, decades, currentAge]);

  const resetAll = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoBase64(null);
    setResults({});
    setCompletedCount(0);
    setAiReflection(null);
    setIsGenerating(false);
    setErrorMessage(null);
  }, []);

  const state: PageState = photoBase64 && completedCount === 0 && !isGenerating ? "preview" : isGenerating || completedCount > 0 ? "generating" : "upload";
  const progress = `${(completedCount / decades.length) * 100}%`;
  const isFocus = mode === "focus";
  const accentPrimary = isFocus ? "#ffffff" : "#00d4ff";
  const accentSecondary = isFocus ? "#d7d7d7" : "#ec4899";
  const subduedText = isFocus ? "text-white/70" : "text-white/50";
  const quietText = isFocus ? "text-white/55" : "text-white/25";

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto animate-fade-in gap-6">
      <Surface variant="hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Time Mirror</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.4rem]">See one face across a whole life.</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/65">
                Upload a single portrait, generate decade-by-decade variations, and review them in a calmer sequence than a typical AI gallery.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="chip text-[0.68rem] text-white/70">{decades.length} portraits</span>
            <span className="chip text-[0.68rem] text-white/70">Birth year {birthYear}</span>
            <span className={`chip text-[0.68rem] ${geminiApiKey ? "text-white/70" : "text-amber-200"}`}>{geminiApiKey ? "Gemini ready" : "Setup needed"}</span>
          </div>
        </div>
      </Surface>

      {!geminiApiKey ? (
        <SectionPanel
          tone="warm"
          eyebrow="Setup Required"
          title="Add your Gemini key before uploading a portrait."
          description="Time Mirror sends the selected image directly to Gemini from this browser. Keeping the API key as bring-your-own-key makes the AI layer explicit instead of hidden."
          actions={(
            <Button onClick={onOpenSettings} variant="primary">
              Add Gemini key
            </Button>
          )}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <InfoCard title="Your core app still works" description="Home, Diary, Life Grid, export, and Focus Mode do not require AI." />
            <InfoCard title="Portraits stay intentional" description="No image is selected or sent until you add the key and choose a file." />
            <InfoCard title="Exports stay clean" description="Backups exclude the Gemini key so secret material is not duplicated." />
          </div>
        </SectionPanel>
      ) : null}

      {geminiApiKey && state === "upload" && (
        <div className="flex flex-col items-center justify-center gap-8 py-16 text-center px-4 animate-fade-in">
          <div className="flex h-24 w-24 select-none items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-2xl font-semibold tracking-[0.18em] text-white/80">
            TM
          </div>

          <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-white tracking-tight">Choose the source portrait</h2>
              <p className={`${subduedText} text-sm max-w-sm mx-auto leading-relaxed`}>
              Upload your photo. This tool uses Gemini to generate your face at every decade from birth to {lifeExpectancy}.
              </p>
            </div>

          <div className="flex flex-col items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-64 h-64 rounded-lg border-2 border-dashed border-white/20 bg-white/[0.04] backdrop-blur-xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Portrait</span>
              <div className="text-center">
                <p className={`${isFocus ? "text-white/80" : "text-white/60"} text-sm font-medium`}>Drop your photo here</p>
                <p className={`${quietText} text-xs mt-1`}>or tap to browse</p>
              </div>
            </button>
            <Button onClick={() => fileInputRef.current?.click()} variant="primary">
              Choose portrait
            </Button>
          </div>

          <div className="space-y-1 text-center">
            <p className={`${quietText} text-xs`}>Best: clear face · front-facing · good lighting</p>
            {errorMessage && <p className="text-rose-300/80 text-xs max-w-xs">{errorMessage}</p>}
          </div>
          <QuoteBlock />
        </div>
      )}

      {state === "preview" && (
        <div className="flex flex-col items-center gap-8 py-12 px-4 animate-fade-in">
          <h2 className="text-2xl font-black text-white">Ready for your time journey?</h2>

          <div className="relative">
            <img
              src={previewUrl!}
              alt="Selected source portrait preview"
              className="w-44 h-44 rounded-full object-cover border-4 animate-fade-in"
              style={{
                borderColor: isFocus ? "rgba(255,255,255,0.35)" : "rgba(0,212,255,0.5)",
                boxShadow: isFocus ? "0 0 36px rgba(255,255,255,0.12)" : "0 0 40px rgba(0,212,255,0.3)",
              }}
            />
            <button
              onClick={resetAll}
              aria-label="Remove selected portrait"
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-black/60 border border-white/20 text-white/60 hover:text-white text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {decades.map((d) => (
              <span key={d.age} className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isFocus
                  ? d.isCurrent
                    ? "bg-white/15 border-white/35 text-white"
                    : d.isPast
                    ? "bg-white/10 border-white/20 text-white/85"
                    : "bg-white/5 border-white/10 text-white/45"
                  : d.isCurrent
                    ? "bg-[#ec4899]/20 border-[#ec4899]/50 text-[#ec4899]"
                    : d.isPast
                      ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                      : "bg-white/5 border-white/10 text-white/35"
              }`}>
                Age {d.age}
              </span>
            ))}
          </div>

          <p className={`${quietText} text-xs`}>{decades.length} portraits · ~30–60s each · Gemini AI</p>
          {errorMessage && <p className="text-rose-300/80 text-xs text-center max-w-sm">{errorMessage}</p>}

          <Button onClick={startGeneration} disabled={!geminiApiKey} variant="ai" size="lg">
            Generate my timeline
          </Button>
        </div>
      )}

      {state === "generating" && (
        <div className="flex flex-col gap-8 py-8 w-full animate-fade-in">
          <div className="text-center px-4">
            {isGenerating ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <p className={`${isFocus ? "text-white/78" : "text-white/60"} text-sm`}>Generating your life timeline...</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${accentPrimary}, ${accentSecondary})`, width: progress, transition: "width 600ms ease" }} />
                </div>
                <p className={`${quietText} text-xs`}>{completedCount} of {decades.length} complete</p>
              </div>
            ) : (
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white">{displayName || "Your"} Face Through Time</h1>
                <p className={`${isFocus ? "text-white/65" : "text-white/40"} text-sm`}>Birth year {birthYear} → Age {lifeExpectancy}</p>
                {Object.values(results).some((result) => result.error) && (
                  <p className="text-amber-300/80 text-xs">Some decades failed. You can still review successful generations below.</p>
                )}
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
            <div className="flex gap-4 px-6" style={{ width: "max-content" }}>
              {decades.map((decade, i) => {
                const result = results[decade.age];
                const isLoading = isGenerating && !result;

                return (
                  <div
                    key={decade.age}
                    className="shrink-0 flex flex-col items-center gap-3 animate-fade-in"
                    style={{ scrollSnapAlign: "start", opacity: result || isLoading ? 1 : 0.4, animationDelay: `${i * 0.05}s` }}
                  >
                    <div
                    className="relative w-40 h-48 rounded-3xl overflow-hidden"
                    style={{
                        border: isFocus
                          ? decade.isCurrent
                            ? "2px solid rgba(255,255,255,0.4)"
                            : decade.isPast
                              ? "2px solid rgba(255,255,255,0.22)"
                              : "2px solid rgba(255,255,255,0.1)"
                          : decade.isCurrent ? "2px solid #ec4899" : decade.isPast ? "2px solid rgba(0,212,255,0.5)" : "2px solid rgba(255,255,255,0.1)",
                        boxShadow: isFocus
                          ? decade.isCurrent
                            ? "0 0 30px rgba(255,255,255,0.16)"
                            : decade.isPast
                              ? "0 0 15px rgba(255,255,255,0.08)"
                              : "none"
                          : decade.isCurrent ? "0 0 30px rgba(236,72,153,0.5)" : decade.isPast ? "0 0 15px rgba(0,212,255,0.2)" : "none",
                      }}
                    >
                      {isLoading ? (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse flex flex-col items-center justify-center gap-2">
                          <div className="text-3xl animate-spin">✨</div>
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
                          {decade.isCurrent && <div className="absolute top-2 right-2 text-[0.5rem] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg" style={{ background: isFocus ? "rgba(255,255,255,0.88)" : "#ec4899", color: isFocus ? "#0b0b0b" : "#ffffff" }}>NOW</div>}
                          {decade.isFuture && <div className="absolute top-2 right-2 bg-white/10 text-white/50 text-[0.5rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">FUTURE</div>}
                        </>
                      ) : (
                        <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                          <span className="text-white/15 text-3xl">👤</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className={`text-lg font-black ${isFocus ? (decade.isFuture ? "text-white/40" : "text-white") : decade.isCurrent ? "text-[#ec4899]" : decade.isPast ? "text-[#00d4ff]" : "text-white/30"}`}>
                        Age {decade.age}
                      </div>
                      <div className={`${quietText} text-[0.6rem]`}>{decade.year}</div>
                      <div className={`text-[0.5rem] mt-0.5 ${isFocus ? "text-white/50" : decade.isCurrent ? "text-[#ec4899]/60" : decade.isPast ? "text-[#00d4ff]/40" : "text-white/15"}`}>
                        {decade.isCurrent ? "● Present" : decade.isPast ? "← Lived" : "→ Future"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isGenerating && aiReflection && (
            <div className="max-w-xl mx-auto px-4 animate-fade-in">
              <div className={`rounded-3xl p-8 text-center ${isFocus ? "bg-white/[0.06] border border-white/15" : "bg-white/[0.05] border border-white/10"}`}>
                <div className="text-3xl mb-4">✨</div>
                <p className={`${isFocus ? "text-white/82" : "text-white/70"} text-sm italic leading-relaxed`}>{aiReflection}</p>
                <p className={`${quietText} text-xs mt-4`}>— Your AI Reflection</p>
              </div>
            </div>
          )}

          {!isGenerating && (
            <div className="flex justify-center gap-3 px-4 pb-8">
              <Button onClick={resetAll}>
                ↺ New Photo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeMirrorPage;
