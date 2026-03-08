import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { QUOTES } from "./constants";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useDiary } from "./hooks/useDiary";
import { useLifeStats } from "./hooks/useLifeStats";
import { useMood } from "./hooks/useMood";
import { useAppMode } from "./hooks/useAppMode";

import AuthGate from "./components/AuthGate";
import Navigation, { type Page } from "./components/Navigation";
import DashboardPage from "./components/DashboardPage";
import LifeGridPage from "./components/LifeGridPage";
import DiaryPage from "./components/DiaryPage";
import SettingsPage from "./components/SettingsPage";
import TimeMirrorPage from "./components/TimeMirrorPage";
import { getApiKey } from "./lib/ai";
import VoiceJournalButton from "./components/VoiceJournalButton";
import FluidBackground from "./components/FluidBackground";
import Footer from "./components/Footer";
import FeedbackPopup from "./components/FeedbackPopup";

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const profile = useProfile(user?.id, user?.email);
  const { entries: diaryEntries, fullEntries, saveEntry } = useDiary(user?.id);
  const { lifeStats, dynamicStats } = useLifeStats(profile.birthdate, profile.lifeExpectancy);
  const { todayMood, recentMoods, saveMood } = useMood(user?.id);
  const { mode, setMode } = useAppMode();

  const [page, setPage] = useState<Page>("dashboard");
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-lg animate-pulse ${mode === "focus" ? "text-white" : "text-primary glow-cyan"}`}>Loading...</div>
      </div>
    );
  }

  if (!user) return <AuthGate onSignIn={signIn} onSignUp={signUp} onGoogleSignIn={signInWithGoogle} />;

  if (profile.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-lg animate-pulse ${mode === "focus" ? "text-white" : "text-primary glow-cyan"}`}>Loading your data...</div>
      </div>
    );
  }

  const hasBirthdate = !!profile.birthdate && !!lifeStats;

  return (
    <div className={`flex flex-col items-center w-full min-h-screen p-4 sm:p-5 md:p-6 ${mode === "focus" ? "bg-black" : ""}`}>
      <FluidBackground mode={mode} todayMood={todayMood} />
      <div className="w-full max-w-7xl flex flex-col gap-4 sm:gap-6 text-center">
        <Navigation currentPage={page} onNavigate={setPage} greeting={profile.greeting} avatarUrl={profile.avatarUrl} />

        <AnimatePresence mode="wait">
          {page === "settings" ? (
            <SettingsPage
              key="settings"
              birthdate={profile.birthdate}
              lifeExpectancy={profile.lifeExpectancy}
              displayName={profile.displayName}
              preferredName={profile.preferredName}
              email={profile.email}
              phone={profile.phone}
              avatarUrl={profile.avatarUrl}
              averages={profile.averages}
              mode={mode}
              onModeChange={setMode}
              onBirthdateChange={profile.updateBirthdate}
              onLifeExpectancyChange={profile.updateLifeExpectancy}
              onDisplayNameChange={profile.updateDisplayName}
              onPreferredNameChange={profile.updatePreferredName}
              onPhoneChange={profile.updatePhone}
              onAvatarChange={profile.updateAvatar}
              onApiKeyChange={profile.updateApiKey}
              onAveragesChange={profile.updateAverages}
              onSignOut={signOut}
            />
          ) : page === "timemirror" ? (
            <TimeMirrorPage
              key="timemirror"
              birthYear={profile.birthdate ? parseInt(profile.birthdate.split("-")[0], 10) : 1984}
              currentAge={lifeStats ? Math.floor(lifeStats.daysPassed / 365.25) : 30}
              lifeExpectancy={profile.lifeExpectancy}
              displayName={profile.greeting || profile.displayName}
              geminiApiKey={getApiKey()}
            />
          ) : page === "diary" ? (
            <DiaryPage
              key="diary"
              fullEntries={fullEntries}
              diaryEntries={diaryEntries}
              birthdate={profile.birthdate}
              userId={user?.id}
              onSave={saveEntry}
            />
          ) : page === "grid" && hasBirthdate ? (
            <LifeGridPage
              key="grid"
              lifeStats={lifeStats!}
              birthdate={profile.birthdate}
              lifeExpectancy={profile.lifeExpectancy}
              diaryEntries={diaryEntries}
              fullEntries={fullEntries}
              userId={user?.id}
              mode={mode}
              todayMood={todayMood}
              displayName={profile.greeting || profile.displayName}
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
              todayMood={todayMood}
              recentMoods={recentMoods}
              mode={mode}
              displayName={profile.greeting || profile.displayName}
              onSaveMood={saveMood}
            />
          ) : (
            <div key="empty" className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-6xl opacity-20">◉</div>
              <p className={`text-lg ${mode === "focus" ? "text-[#888]" : "text-text-muted"}`}>
                {profile.greeting ? `Welcome, ${profile.greeting}! ` : ""}Set your birthdate in Settings to begin.
              </p>
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

      {/* Floating voice journal — visible on dashboard and grid */}
      {hasBirthdate && (page === "dashboard" || page === "grid") && (
        <VoiceJournalButton birthdate={profile.birthdate} onSave={saveEntry} />
      )}

      <Footer />
      <FeedbackPopup userId={user?.id} />
    </div>
  );
};

export default App;
