import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { QUOTES } from "./constants";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useDiary } from "./hooks/useDiary";
import { useLifeStats } from "./hooks/useLifeStats";

import AuthGate from "./components/AuthGate";
import Navigation, { type Page } from "./components/Navigation";
import SettingsBar from "./components/SettingsBar";
import DashboardPage from "./components/DashboardPage";
import GridPage from "./components/GridPage";

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { birthdate, lifeExpectancy, loading: profileLoading, updateBirthdate, updateLifeExpectancy } = useProfile(user?.id);
  const { entries: diaryEntries, saveEntry } = useDiary(user?.id);
  const { lifeStats, dynamicStats } = useLifeStats(birthdate, lifeExpectancy);

  const [page, setPage] = useState<Page>("dashboard");
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  /* ── Loading states ───────────────────────────────────────── */

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary text-lg animate-pulse glow-cyan">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate onSignIn={signIn} onSignUp={signUp} />;
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary text-lg animate-pulse glow-cyan">Loading your data...</div>
      </div>
    );
  }

  /* ── Main layout ──────────────────────────────────────────── */

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 sm:p-5 md:p-6">
      <div className="w-full max-w-7xl flex flex-col gap-4 sm:gap-6 text-center">
        <Navigation currentPage={page} onNavigate={setPage} onSignOut={signOut} />
        <SettingsBar
          birthdate={birthdate}
          lifeExpectancy={lifeExpectancy}
          onBirthdateChange={updateBirthdate}
          onLifeExpectancyChange={updateLifeExpectancy}
        />

        {birthdate && lifeStats ? (
          <AnimatePresence mode="wait">
            {page === "dashboard" ? (
              <DashboardPage
                key="dashboard"
                lifeStats={lifeStats}
                dynamicStats={dynamicStats}
                quote={quote}
                birthYear={parseInt(birthdate.split("-")[0], 10)}
                birthMonth={parseInt(birthdate.split("-")[1], 10)}
                birthDay={parseInt(birthdate.split("-")[2], 10)}
              />
            ) : (
              <GridPage
                key="grid"
                lifeStats={lifeStats}
                birthdate={birthdate}
                lifeExpectancy={lifeExpectancy}
                diaryEntries={diaryEntries}
                onSaveDiary={saveEntry}
              />
            )}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-6xl opacity-20">◉</div>
            <p className="text-text-muted text-lg">Enter your birthdate above to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
