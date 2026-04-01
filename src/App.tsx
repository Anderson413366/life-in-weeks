import React, { Suspense, lazy, useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import { QUOTES } from "./constants";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useDiary } from "./hooks/useDiary";
import { useLifeStats } from "./hooks/useLifeStats";
import { useMood } from "./hooks/useMood";
import { useAppMode } from "./hooks/useAppMode";

import Navigation, { type Page } from "./components/Navigation";
import { getApiKey } from "./lib/ai";
import FluidBackground from "./components/FluidBackground";
import Footer from "./components/Footer";
import LegalPage from "./components/LegalPage";

const AuthGate = lazy(() => import("./components/AuthGate"));
const DashboardPage = lazy(() => import("./components/DashboardPage"));
const LifeGridPage = lazy(() => import("./components/LifeGridPage"));
const DiaryPage = lazy(() => import("./components/DiaryPage"));
const SettingsPage = lazy(() => import("./components/SettingsPage"));
const TimeMirrorPage = lazy(() => import("./components/TimeMirrorPage"));
const FeedbackPopup = lazy(() => import("./components/FeedbackPopup"));
const VoiceJournalButton = lazy(() => import("./components/VoiceJournalButton"));

const termsSections = [
  {
    heading: "Using the service",
    body: [
      "Life in Weeks is a personal reflection and journaling application built to help you visualize time, track moods, and preserve your own notes.",
      "You agree to use the app lawfully and not to upload content that is abusive, fraudulent, or infringes on someone else's rights.",
    ],
  },
  {
    heading: "Your account and content",
    body: [
      "You are responsible for maintaining the security of your account and login credentials.",
      "You retain ownership of the diary entries, uploaded photos, profile information, and exports you create inside the app.",
    ],
  },
  {
    heading: "AI-assisted features",
    body: [
      "Some features rely on your own Gemini API key. AI-generated output is intended for reflection and convenience, not for medical, legal, or financial advice.",
      "You should review generated content before relying on it or sharing it elsewhere.",
    ],
  },
  {
    heading: "Availability and changes",
    body: [
      "We may improve, modify, or discontinue parts of the service over time. We aim for reliability, but uninterrupted availability is not guaranteed.",
      "If your data is important to you, export it regularly using the in-app export tools.",
    ],
  },
];

const privacySections = [
  {
    heading: "What data is stored",
    body: [
      "Life in Weeks stores the information needed to operate your account and features, including profile fields, mood entries, diary entries, uploaded photos, and app preferences.",
      "If you add a Gemini API key, it is stored with your profile so your AI features can work across devices.",
    ],
  },
  {
    heading: "How the data is used",
    body: [
      "Your data is used to render your dashboard, life grid, diary history, mood history, and optional AI-assisted experiences.",
      "We do not sell your personal journal content or mood history.",
    ],
  },
  {
    heading: "Infrastructure and storage",
    body: [
      "Account data is stored in Supabase and protected by per-user access rules. Some non-sensitive preferences may also be cached locally in your browser.",
      "Uploaded images and avatars are stored in the app's configured storage bucket.",
    ],
  },
  {
    heading: "Your controls",
    body: [
      "You can update profile data, export your life data as JSON, and replace or delete content you have saved.",
      "For account-specific support, contact support@lifeinweeks.app.",
    ],
  },
];

const App: React.FC = () => {
  const {
    user,
    loading: authLoading,
    recoveryMode,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    exitRecoveryMode,
    signOut,
  } = useAuth();
  const profile = useProfile(user?.id, user?.email);
  const { entries: diaryEntries, fullEntries, saveEntry } = useDiary(user?.id);
  const { lifeStats, dynamicStats } = useLifeStats(profile.birthdate, profile.lifeExpectancy);
  const { todayMood, recentMoods, saveMood } = useMood(user?.id);
  const { mode, setMode } = useAppMode();
  
  const navigate = useNavigate();
  const location = useLocation();

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Determine current page from location
  const getPageFromPath = (path: string): Page => {
    if (path.includes("grid")) return "grid";
    if (path.includes("diary")) return "diary";
    if (path.includes("timemirror")) return "timemirror";
    if (path.includes("settings")) return "settings";
    return "dashboard";
  };

  const page = getPageFromPath(location.pathname);
  
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-lg animate-pulse ${mode === "focus" ? "text-white" : "text-primary glow-cyan"}`}>Loading...</div>
      </div>
    );
  }

  if (location.pathname === "/terms") {
    return <LegalPage title="Terms of Service" updatedAt="March 22, 2026" sections={termsSections} />;
  }

  if (location.pathname === "/privacy") {
    return <LegalPage title="Privacy Policy" updatedAt="March 22, 2026" sections={privacySections} />;
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
    <div key="empty" className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-6xl opacity-20">◉</div>
      <p className={`text-lg ${mode === "focus" ? "text-[#888]" : "text-text-muted"}`}>
        {profile.greeting ? `Welcome, ${profile.greeting}! ` : ""}Set your birthdate in Settings to begin.
      </p>
      <button
        onClick={() => handleNavigate("settings")}
        className="mt-2 px-5 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/30 transition-colors"
      >
        Go to Settings
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col items-center w-full min-h-screen p-4 sm:p-5 md:p-6 ${mode === "focus" ? "bg-black" : ""}`}>
      <FluidBackground mode={mode} todayMood={todayMood} />
      <div className="w-full max-w-7xl flex flex-col gap-4 sm:gap-6 text-center">
        <Navigation currentPage={page} onNavigate={handleNavigate} greeting={profile.greeting} avatarUrl={profile.avatarUrl} />

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
                onBirthdateChange={profile.updateBirthdate}
                onLifeExpectancyChange={profile.updateLifeExpectancy}
                onDisplayNameChange={profile.updateDisplayName}
                onPreferredNameChange={profile.updatePreferredName}
                onPhoneChange={profile.updatePhone}
                onAvatarChange={profile.updateAvatar}
                onApiKeyChange={profile.updateApiKey}
                onAveragesChange={profile.updateAverages}
                onSignOut={signOut}
                diaryEntries={fullEntries}
                moods={recentMoods}
              />
            } />
            
            <Route path="/timemirror" element={
              <TimeMirrorPage
                birthYear={profile.birthdate ? parseInt(profile.birthdate.split("-")[0], 10) : 1984}
                currentAge={lifeStats ? Math.floor(lifeStats.daysPassed / 365.25) : 30}
                lifeExpectancy={profile.lifeExpectancy}
                displayName={profile.greeting || profile.displayName}
                geminiApiKey={getApiKey()}
              />
            } />

            <Route path="/diary" element={
              <DiaryPage
                fullEntries={fullEntries}
                diaryEntries={diaryEntries}
                birthdate={profile.birthdate}
                userId={user?.id}
                onSave={saveEntry}
              />
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
                  mode={mode}
                  displayName={profile.greeting || profile.displayName}
                  onSaveMood={saveMood}
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
          <VoiceJournalButton birthdate={profile.birthdate} onSave={saveEntry} />
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
