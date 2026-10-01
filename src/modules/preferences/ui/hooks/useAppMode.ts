import { useState, useCallback, useEffect } from "react";
import { applyModeToBody, getMode, setMode as persistMode } from "../../service/preferences.service";
import type { AppMode } from "../../types/preferences.types";

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(getMode);

  // Sync body class
  useEffect(() => {
    applyModeToBody(mode);
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
