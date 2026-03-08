import React from "react";
import { motion } from "framer-motion";

export type Page = "dashboard" | "grid" | "diary" | "timemirror" | "settings";

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  greeting?: string;
  avatarUrl?: string;
}

const tabs: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard",  label: "Dashboard",   icon: "◉" },
  { id: "grid",       label: "Life Grid",   icon: "▦" },
  { id: "diary",      label: "Diary",       icon: "📖" },
  { id: "timemirror", label: "Time Mirror", icon: "🪞" },
  { id: "settings",   label: "Settings",    icon: "⚙" },
];

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate, greeting, avatarUrl }) => (
  <nav className="flex items-center justify-between w-full max-w-7xl mx-auto mb-4 sm:mb-6">
    <div className="flex gap-0.5 sm:gap-1 p-1 glass rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`relative px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap
            ${currentPage === tab.id ? "text-white" : "text-text-muted hover:text-white"}`}
        >
          {currentPage === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span className="text-xs opacity-70">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>

    {/* User greeting + avatar */}
    <div className="flex items-center gap-2">
      {greeting && <span className="text-xs text-text-muted/60 hidden sm:block">Hi, {greeting}</span>}
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-box-border" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-box-border flex items-center justify-center text-xs text-primary">
          {greeting ? greeting[0].toUpperCase() : "?"}
        </div>
      )}
    </div>
  </nav>
);

export default Navigation;
