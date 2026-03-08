import React from "react";
import { motion } from "framer-motion";

export type Page = "dashboard" | "grid";

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
}

const tabs: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "grid",      label: "Life Grid", icon: "▦" },
];

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate, onSignOut }) => (
  <nav className="flex items-center justify-between w-full max-w-7xl mx-auto mb-4 sm:mb-6">
    {/* Tabs */}
    <div className="flex gap-1 p-1 glass rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`relative px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200
            ${currentPage === tab.id ? "text-white" : "text-text-muted hover:text-white"}`}
        >
          {currentPage === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="text-xs opacity-70">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>

    {/* Sign out */}
    <button
      onClick={onSignOut}
      className="text-xs text-text-muted/60 hover:text-accent transition-colors px-3 py-2"
    >
      Sign out
    </button>
  </nav>
);

export default Navigation;
