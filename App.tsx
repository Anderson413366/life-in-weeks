import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { QUOTES } from "./constants";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useDiary } from "./hooks/useDiary";
import { useLifeStats } from "./hooks/useLifeStats";

import AuthGate from "./components/AuthGate";
import Navigation, { type Page } from "./components/Navigation";
import DashboardPage from "./components/DashboardPage";
import GridPage from "./components/GridPage";
import SettingsPage from "./components/SettingsPage";

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const profile = useProfile(user?.id, user?.email);
  const { entries: diaryEntries, saveEntry } = useDiary(user?.id);
  const { lifeStats, dynamicStats } = useLifeStats(profile.birthdate, profile.lifeExpectancy);

  const [page, setPage] = useState<Page>("dashboard");
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary text-lg animate-pulse glow-cyan">Loading...</div>
      </div>
    );
  }

  if (!user) return <AuthGate onSignIn={signIn} onSignUp={signUp} />;

  if (profile.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary text-lg animate-pulse glow-cyan">Loading your data...</div>
      </div>
    );
  }

  const hasBirthdate = !!profile.birthdate && !!lifeStats;

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 sm:p-5 md:p-6">
      <div className="w-full max-w-7xl flex flex-col gap-4 sm:gap-6 text-center">
        <Navigation currentPage={page} onNavigate={setPage} displayName={profile.displayName} />

        <AnimatePresence mode="wait">
          {page === "settings" ? (
            <SettingsPage
              key="settings"
              birthdate={profile.birthdate}
              lifeExpectancy={profile.lifeExpectancy}
              displayName={profile.displayName}
              email={profile.email}
              phone={profile.phone}
              averages={profile.averages}
              onBirthdateChange={profile.updateBirthdate}
              onLifeExpectancyChange={profile.updateLifeExpectancy}
              onDisplayNameChange={profile.updateDisplayName}
              onPhoneChange={profile.updatePhone}
              onApiKeyChange={profile.updateApiKey}
              onAveragesChange={profile.updateAverages}
              onSignOut={signOut}
            />
          ) : page === "grid" && hasBirthdate ? (
            <GridPage
              key="grid"
              lifeStats={lifeStats!}
              birthdate={profile.birthdate}
              lifeExpectancy={profile.lifeExpectancy}
              diaryEntries={diaryEntries}
              onSaveDiary={saveEntry}
            />
          ) : hasBirthdate ? (
            <DashboardPage
              key="dashboard"
              lifeStats={lifeStats!}
              dynamicStats={dynamicStats}
              quote={quote}
              birthYear={parseInt(profile.birthdate.split("-")[0], 10)}
              birthMonth={parseInt(profile.birthdate.split("-")[1], 10)}
              birthDay={parseInt(profile.birthdate.split("-")[2], 10)}
              averages={profile.averages}
            />
          ) : (
            <div key="empty" className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-6xl opacity-20">◉</div>
              <p className="text-text-muted text-lg">Set your birthdate in Settings to begin.</p>
              <button
                onClick={() => setPage("settings")}
                className="mt-2 px-5 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/30 transition-colors"
              >
                Go to Settings
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
