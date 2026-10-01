import React, { Suspense, lazy, useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import { QUOTES } from "./constants";
import { getApiKey } from "@/modules/ai/service/ai.service";
import { useAuth } from "@/modules/auth/ui/hooks/useAuth";
import { useDiary } from "@/modules/diary/ui/hooks/useDiary";
import FeedbackPopup from "@/modules/feedback/ui/components/FeedbackPopup";
import LegalPage from "@/modules/legal/ui/pages/LegalPage";
import { getPublicLegalPage } from "@/modules/legal/service/legal.service";
import { useLifeStats } from "@/modules/life/ui/hooks/useLifeStats";
import { useMood } from "@/modules/mood/ui/hooks/useMood";
import { useAppMode } from "@/modules/preferences/ui/hooks/useAppMode";
import { useProfile } from "@/modules/profile/ui/hooks/useProfile";
import { Button, InfoCard, Surface } from "@/shared/ui/components";
import { FluidBackground, Footer, Navigation, type Page } from "@/shared/ui/shell";

const AuthGate = lazy(() => import("@/modules/auth/ui/components/AuthGate"));
const DashboardPage = lazy(() => import("@/modules/life/ui/pages/DashboardPage"));
const LifeGridPage = lazy(() => import("@/modules/life/ui/pages/LifeGridPage"));
const DiaryPage = lazy(() => import("@/modules/diary/ui/pages/DiaryPage"));
const SettingsPage = lazy(() => import("@/modules/profile/ui/pages/SettingsPage"));
const TimeMirrorPage = lazy(() => import("@/modules/ai/ui/pages/TimeMirrorPage"));
const VoiceJournalButton = lazy(() => import("@/modules/diary/ui/components/VoiceJournalButton"));

const getPageFromPath = (path: string): Page => {
  if (path.includes("grid")) return "grid";
  if (path.includes("diary")) return "diary";
  if (path.includes("timemirror")) return "timemirror";
  if (path.includes("settings")) return "settings";
  return "dashboard";
};

const App: React.FC = () => {
  const {
    user,
    loading: authLoading,
    recoveryMode,
    error: authError,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    exitRecoveryMode,
    signOut,
  } = useAuth();
  const profile = useProfile(user?.id, user?.email);
  const navigate = useNavigate();
  const location = useLocation();
  const page = getPageFromPath(location.pathname);

  const { entries: diaryEntries, fullEntries, saveEntry } = useDiary(user?.id);
  const { lifeStats, dynamicStats } = useLifeStats(profile.birthdate, profile.lifeExpectancy, page === "dashboard");
  const { todayMood, recentMoods, saveMood } = useMood(user?.id);
  const { mode, setMode } = useAppMode();

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const termsPage = getPublicLegalPage("terms");
  const privacyPage = getPublicLegalPage("privacy");
  
  const handleNavigate = (p: Page) => {
    if (p === "dashboard") navigate("/");
    else navigate(`/${p}`);
  };

  const routeFallback = (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className={`text-sm animate-pulse ${mode === "focus" ? "text-white" : "text-primary glow-cyan"}`}>
        Loading section...
      </div>
    </div>
  );

  if (location.pathname === "/terms") {
    return <LegalPage {...termsPage} />;
  }

  if (location.pathname === "/privacy") {
    return <LegalPage {...privacyPage} />;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-lg animate-pulse ${mode === "focus" ? "text-white" : "text-primary glow-cyan"}`}>Loading...</div>
      </div>
    );
  }

  if (!user || recoveryMode) {
    return (
      <Suspense fallback={routeFallback}>
        <AuthGate
          onSignIn={signIn}
          onSignUp={signUp}
          onGoogleSignIn={signInWithGoogle}
          onResetPassword={resetPassword}
          onUpdatePassword={updatePassword}
          onExitRecoveryMode={exitRecoveryMode}
          recoveryMode={recoveryMode}
          authMessage={authError ?? undefined}
        />
      </Suspense>
    );
  }

  if (profile.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-lg animate-pulse ${mode === "focus" ? "text-white" : "text-primary glow-cyan"}`}>Loading your data...</div>
      </div>
    );
  }

  const hasBirthdate = !!profile.birthdate && !!lifeStats;

  // Empty state component
  const EmptyState = () => (
    <div key="empty" className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-12">
      <Surface variant="hero">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="eyebrow">Get Started</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Set up your timeline before you explore.
            </h1>
            <p className={`text-sm leading-7 ${mode === "focus" ? "text-white/72" : "text-text-muted"}`}>
              {profile.greeting ? `${profile.greeting}, ` : ""}
              Life in Weeks needs a few identity details before it can calculate your grid, milestones, and current week with the right emotional context.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleNavigate("settings")} variant="primary">
              Finish setup in Settings
            </Button>
            <Button onClick={() => handleNavigate("dashboard")}>
              Return home
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              title: "1. Add your identity details",
              description: "Birthdate, preferred name, and life expectancy shape the dashboard and life grid.",
            },
            {
              title: "2. Choose your default experience",
              description: "Pick Zen or Focus mode so the app feels calm enough to use daily.",
            },
            {
              title: "3. Unlock optional tools",
              description: "Add a Gemini key only if you want AI reflections and Time Mirror generation.",
            },
          ].map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </Surface>
    </div>
  );

  return (
    <div className={`app-shell ${mode === "focus" ? "bg-black" : ""}`}>
      <FluidBackground mode={mode} todayMood={todayMood} />
      <div className="shell-frame">
        <Navigation currentPage={page} onNavigate={handleNavigate} greeting={profile.greeting} avatarUrl={profile.avatarUrl} mode={mode} />

        <Suspense fallback={routeFallback}>
          <Routes location={location}>
            <Route path="/settings" element={
              <SettingsPage
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
                onProfileSave={profile.saveProfileDetails}
                onAveragesSave={profile.saveAverages}
                onAvatarChange={profile.updateAvatar}
                onApiKeyChange={profile.updateApiKey}
                onSignOut={signOut}
                diaryEntries={fullEntries}
                moods={recentMoods}
              />
            } />
            
            <Route path="/timemirror" element={
              hasBirthdate ? (
                <TimeMirrorPage
                  birthYear={parseInt(profile.birthdate.split("-")[0], 10)}
                  currentAge={lifeStats ? Math.floor(lifeStats.daysPassed / 365.25) : 30}
                  lifeExpectancy={profile.lifeExpectancy}
                  displayName={profile.greeting || profile.displayName}
                  geminiApiKey={getApiKey()}
                  mode={mode}
                  onOpenSettings={() => handleNavigate("settings")}
                />
              ) : <EmptyState />
            } />

            <Route path="/diary" element={
              hasBirthdate ? (
                <DiaryPage
                  fullEntries={fullEntries}
                  diaryEntries={diaryEntries}
                  birthdate={profile.birthdate}
                  userId={user?.id}
                  mode={mode}
                  onSave={saveEntry}
                />
              ) : <EmptyState />
            } />

            <Route path="/grid" element={
              hasBirthdate ? (
                <LifeGridPage
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
              ) : <EmptyState />
            } />

            <Route path="/" element={
              hasBirthdate ? (
                <DashboardPage
                  lifeStats={lifeStats!}
                  dynamicStats={dynamicStats}
                  quote={quote}
                  birthYear={parseInt(profile.birthdate.split("-")[0], 10)}
                  birthMonth={parseInt(profile.birthdate.split("-")[1], 10)}
                birthDay={parseInt(profile.birthdate.split("-")[2], 10)}
                averages={profile.averages}
                todayMood={todayMood}
                recentMoods={recentMoods}
                diaryEntryCount={fullEntries.length}
                hasApiKey={!!getApiKey().trim()}
                mode={mode}
                displayName={profile.greeting || profile.displayName}
                onSaveMood={saveMood}
                onNavigate={handleNavigate}
              />
            ) : <EmptyState />
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* Floating voice journal — visible on dashboard and grid */}
      {hasBirthdate && (page === "dashboard" || page === "grid") && (
        <Suspense fallback={null}>
          <VoiceJournalButton birthdate={profile.birthdate} onSave={saveEntry} mode={mode} />
        </Suspense>
      )}

      <Footer />
      <Suspense fallback={null}>
        <FeedbackPopup userId={user?.id} />
      </Suspense>
    </div>
  );
};

export default App;
