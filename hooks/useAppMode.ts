import { useState, useCallback } from "react";
import { getMode, setMode as persistMode, type AppMode } from "../lib/theme";

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(getMode);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    persistMode(m);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "zen" ? "focus" : "zen");
  }, [mode, setMode]);

  return { mode, setMode, toggle };
}
