import { useState, useCallback, useEffect } from "react";
import { getMode, setMode as persistMode, type AppMode } from "../lib/theme";

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(getMode);

  // Sync body class
  useEffect(() => {
    document.body.classList.toggle("focus-mode", mode === "focus");
  }, [mode]);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    persistMode(m);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "zen" ? "focus" : "zen");
  }, [mode, setMode]);

  return { mode, setMode, toggle };
}
