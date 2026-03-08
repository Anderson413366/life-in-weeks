import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MIN_LIFE_EXPECTANCY, MAX_LIFE_EXPECTANCY, DEFAULT_LIFE_EXPECTANCY } from "../constants";
import { getApiKey, setApiKey } from "../lib/ai";

interface SettingsBarProps {
  birthdate: string;
  lifeExpectancy: number;
  onBirthdateChange: (v: string) => void;
  onLifeExpectancyChange: (v: number) => void;
}

const SettingsBar: React.FC<SettingsBarProps> = ({ birthdate, lifeExpectancy, onBirthdateChange, onLifeExpectancyChange }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState(() => getApiKey());

  return (
    <div className="glass rounded-xl p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <span className="font-medium text-white/80 text-xs uppercase tracking-wider">Birthdate</span>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => onBirthdateChange(e.target.value)}
            className="h-9 rounded-lg border border-box-border bg-transparent px-3 text-sm text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <span className="font-medium text-white/80 text-xs uppercase tracking-wider">Life Expectancy</span>
          <input
            type="number"
            value={lifeExpectancy}
            onChange={(e) => onLifeExpectancyChange(Math.max(MIN_LIFE_EXPECTANCY, Math.min(MAX_LIFE_EXPECTANCY, parseInt(e.target.value, 10) || DEFAULT_LIFE_EXPECTANCY)))}
            min={MIN_LIFE_EXPECTANCY}
            max={MAX_LIFE_EXPECTANCY}
            className="h-9 w-20 rounded-lg border border-box-border bg-transparent px-2 text-sm text-center text-white
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          <span className="text-xs text-text-muted/60">yrs</span>
        </label>

        <button
          onClick={() => setShowApiKey(!showApiKey)}
          className={`h-9 px-4 rounded-lg text-xs font-medium transition-all border
            ${getApiKey()
              ? "border-[#4caf50]/30 text-[#4caf50]/80 hover:border-[#4caf50]/50 bg-[#4caf50]/5"
              : "border-box-border text-text-muted hover:border-primary/30 hover:text-primary"
            }`}
        >
          {getApiKey() ? "AI Key ✓" : "Set AI Key"}
        </button>
      </div>

      <AnimatePresence>
        {showApiKey && (
          <motion.div
            className="flex justify-center items-center gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="Paste your Gemini API key (free at aistudio.google.com)"
              className="h-9 w-80 max-w-full rounded-lg border border-box-border bg-transparent px-3 text-xs text-white
                         focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => { setApiKey(apiKeyValue); setShowApiKey(false); }}
              className="h-9 px-4 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors border border-primary/30"
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsBar;
