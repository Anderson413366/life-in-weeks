import React from "react";

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
  <nav className="flex flex-col items-center w-full max-w-7xl mx-auto mb-4 sm:mb-6 gap-2">
    {/* Centered tab bar */}
    <div className="flex gap-0.5 sm:gap-1 p-1 card-base rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`relative px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap
            ${currentPage === tab.id ? "text-white" : "text-white/50 hover:text-white"}`}
        >
          {currentPage === tab.id && (
            <span className="absolute inset-0 bg-[#00d4ff]/15 border border-[#00d4ff]/30 rounded-lg" />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span className="text-xs">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>

    {/* Greeting + avatar */}
    {(greeting || avatarUrl) && (
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-[#1e3a5f]" />
        ) : greeting ? (
          <div className="w-6 h-6 rounded-full card-base flex items-center justify-center text-[0.55rem] text-[#00d4ff] font-bold">
            {greeting[0].toUpperCase()}
          </div>
        ) : null}
        {greeting && <span className="text-[0.65rem] text-white/40">Hi, {greeting}</span>}
      </div>
    )}
  </nav>
);

export default Navigation;
