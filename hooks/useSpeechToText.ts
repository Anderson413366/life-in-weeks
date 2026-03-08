import { useState, useCallback, useRef } from "react";

interface SpeechToTextState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
}

export function useSpeechToText(onResult: (text: string) => void) {
  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    isSupported: typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    transcript: "",
  });

  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!state.isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + " ";
          onResult(finalTranscript.trim());
        } else {
          interim = text;
        }
      }
      setState((s) => ({ ...s, transcript: finalTranscript + interim }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false }));
    };

    recognition.onerror = () => {
      setState((s) => ({ ...s, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState((s) => ({ ...s, isListening: true, transcript: "" }));
  }, [state.isSupported, onResult]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  return { ...state, start, stop };
}
