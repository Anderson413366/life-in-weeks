import React from "react";
import type { AppMode } from "@/modules/preferences";

export type Page = "dashboard" | "grid" | "diary" | "timemirror" | "settings";

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  greeting?: string;
  avatarUrl?: string;
  mode: AppMode;
}

const tabs: { id: Page; label: string; mark: string }[] = [
  { id: "dashboard",  label: "Home",        mark: "H" },
  { id: "grid",       label: "Life Grid",   mark: "G" },
  { id: "diary",      label: "Diary",       mark: "D" },
  { id: "timemirror", label: "Time Mirror", mark: "T" },
  { id: "settings",   label: "Settings",    mark: "S" },
];

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate, greeting, avatarUrl, mode }) => (
  <nav className="card-base nav-shell" aria-label="Primary">
    <div className="nav-brand">
      <div className="nav-brand__title">
        <button onClick={() => onNavigate("dashboard")} className="tracking-[0.22em] uppercase text-inherit hover:text-white transition-colors">
          Life in Weeks
        </button>
      </div>
      <p className="nav-brand__subtitle">
        Private reflection, clear next steps, and quiet daily use.
      </p>
    </div>

    <div className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className="nav-tab"
          aria-current={currentPage === tab.id ? "page" : undefined}
        >
          <span className="nav-tab__mark" aria-hidden="true">{tab.mark}</span>
          <span className="text-xs sm:text-sm">{tab.label}</span>
        </button>
      ))}
    </div>

    <div className="nav-meta">
      <div className="chip">
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/45">Mode</span>
        <span className="text-sm text-white">{mode === "focus" ? "Focus" : "Zen"}</span>
      </div>
      {(greeting || avatarUrl) && (
        <div className="nav-user">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="nav-user__avatar" />
          ) : greeting ? (
            <div className="nav-user__avatar flex items-center justify-center text-xs font-bold text-[#00d4ff]">
              {greeting[0].toUpperCase()}
            </div>
          ) : null}
          {greeting && (
            <div className="nav-user__text">
              <span className="nav-user__label">Welcome back</span>
              <span className="nav-user__name">{greeting}</span>
            </div>
          )}
        </div>
      )}
    </div>
  </nav>
);

export default Navigation;
