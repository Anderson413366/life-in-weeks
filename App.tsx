
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { differenceInWeeks, differenceInDays, addWeeks, format, addDays, differenceInSeconds, startOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
// Firebase v9+ compat imports for v8 style API
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { motion } from 'framer-motion'; // Added Framer Motion

import { LifeStats, DynamicStats, SelectedWeek, DiaryEntries, HoverInfo, UserSettings } from './types';

// FirebaseServices interface using v8 types from compat import
export interface FirebaseServices {
  db: firebase.firestore.Firestore | null;
  auth: firebase.auth.Auth | null;
  userId: string | null;
  appId: string;
  isAuthReady: boolean;
}

import { QUOTES, DEFAULT_LIFE_EXPECTANCY, MIN_LIFE_EXPECTANCY, MAX_LIFE_EXPECTANCY, DAYS_IN_YEAR_AVG, WEEKS_IN_YEAR, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE, WAKING_TIME_FACTOR } from './constants';

import Tooltip from './components/Tooltip';
import WeeksGrid from './components/WeeksGrid';
import DiaryModal from './components/DiaryModal';
import SectionHeading from './components/SectionHeading';
import StatCard from './components/StatCard';


// Access global Firebase config injected by index.tsx
const firebaseConfig = (window as any).firebaseConfig || {};
const globalAppId = (window as any).appId || 'default-life-in-weeks'; // Renamed to avoid conflict with App component's appId state
const initialAuthToken = (window as any).initialAuthToken || null;


const App: React.FC = () => {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices>({
    db: null,
    auth: null,
    userId: null,
    appId: globalAppId, // Use the globally sourced appId
    isAuthReady: false,
  });

  const [birthdate, setBirthdate] = useState<string>('');
  const [totalYears, setTotalYears] = useState<number>(DEFAULT_LIFE_EXPECTANCY);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntries>({});

  const initialBirthdateLoadDone = useRef(false);
  const initialTotalYearsLoadDone = useRef(false);

  const [quote, setQuote] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null); // Ref for the main app container for width calculations

  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [dynamicStats, setDynamicStats] = useState<DynamicStats>({
    secondsLived: 0, minutesLived: 0, hoursLived: 0,
    secondsRemaining: 0, minutesRemaining: 0, hoursRemaining: 0,
    percentDayPassed: 0, percentMonthPassed: 0, percentYearPassed: 0,
    wakingHoursLived: 0, wakingHoursRemaining: 0,
  });

  // Initialize Firebase
  useEffect(() => {
    if (Object.keys(firebaseConfig).length === 0) {
      console.warn("Firebase config is empty. App will use local state only.");
      setFirebaseServices(prev => ({ ...prev, isAuthReady: true, appId: globalAppId }));
      return;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      const firestoreDb: firebase.firestore.Firestore = firebase.firestore();
      const firebaseAuth: firebase.auth.Auth = firebase.auth();
      // firebase.firestore.setLogLevel('debug'); // For development, v8 style

      const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
          setFirebaseServices(prev => ({ ...prev, db: firestoreDb, auth: firebaseAuth, userId: user.uid, isAuthReady: true, appId: globalAppId }));
        } else {
          try {
            if (initialAuthToken) {
              await firebaseAuth.signInWithCustomToken(initialAuthToken);
            } else {
              await firebaseAuth.signInAnonymously();
            }
            // After sign-in, onAuthStateChanged will trigger again with the user object
          } catch (error) {
            console.error("Error during Firebase sign-in:", error);
            setFirebaseServices(prev => ({ ...prev, isAuthReady: true, appId: globalAppId })); // Still ready, but unauthenticated
          }
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setFirebaseServices(prev => ({ ...prev, isAuthReady: true, appId: globalAppId }));
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Firestore: Load user settings (birthdate, totalYears)
  useEffect(() => {
    const { isAuthReady, db, userId, appId } = firebaseServices;
    if (!isAuthReady || !db || !userId) return;

    const settingsDocRef = db.doc(`artifacts/${appId}/users/${userId}/userData/settings`);
    const unsubscribe = settingsDocRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data() as UserSettings;
        // Check if data.birthdate is defined and different before setting
        if (data.birthdate && data.birthdate !== birthdate) {
          setBirthdate(data.birthdate);
        }
        const loadedTotalYears = data.totalYears ? parseInt(data.totalYears, 10) : NaN;
        if (!isNaN(loadedTotalYears) && loadedTotalYears !== totalYears) {
          setTotalYears(loadedTotalYears);
        }
      } else {
        // Optional: Handle case where no settings exist yet (e.g., set defaults or leave as is)
      }
      if (!initialBirthdateLoadDone.current) initialBirthdateLoadDone.current = true;
      if (!initialTotalYearsLoadDone.current) initialTotalYearsLoadDone.current = true;
    }, (error) => {
      console.error("Error fetching user settings:", error);
      if (!initialBirthdateLoadDone.current) initialBirthdateLoadDone.current = true;
      if (!initialTotalYearsLoadDone.current) initialTotalYearsLoadDone.current = true;
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseServices.isAuthReady, firebaseServices.db, firebaseServices.userId, firebaseServices.appId]);

  // Firestore: Save birthdate
  useEffect(() => {
    const { isAuthReady, db, userId, appId } = firebaseServices;
    if (!isAuthReady || !db || !userId || !initialBirthdateLoadDone.current || !birthdate) {
      return;
    }
    const settingsDocRef = db.doc(`artifacts/${appId}/users/${userId}/userData/settings`);
    settingsDocRef.set({ birthdate }, { merge: true })
      .catch(error => console.error("Error saving birthdate:", error));
  }, [birthdate, firebaseServices]);

  // Firestore: Save totalYears
  useEffect(() => {
    const { isAuthReady, db, userId, appId } = firebaseServices;
    if (!isAuthReady || !db || !userId || !initialTotalYearsLoadDone.current || typeof totalYears === 'undefined') {
      return;
    }
    const settingsDocRef = db.doc(`artifacts/${appId}/users/${userId}/userData/settings`);
    settingsDocRef.set({ totalYears: totalYears.toString() }, { merge: true })
      .catch(error => console.error("Error saving totalYears:", error));
  }, [totalYears, firebaseServices]);

  // Firestore: Load diary entries
  useEffect(() => {
    const { isAuthReady, db, userId, appId } = firebaseServices;
    if (!isAuthReady || !db || !userId) return;

    const diaryDocRef = db.doc(`artifacts/${appId}/users/${userId}/userData/diary`);
    const unsubscribe = diaryDocRef.onSnapshot((docSnap) => {
      const newEntries = docSnap.exists ? (docSnap.data() as DiaryEntries) || {} : {};
      if (JSON.stringify(newEntries) !== JSON.stringify(diaryEntries)) {
        setDiaryEntries(newEntries);
      }
    }, (error) => console.error("Error fetching diary entries:", error));
    return () => unsubscribe();
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseServices.isAuthReady, firebaseServices.db, firebaseServices.userId, firebaseServices.appId]);

  // Random quote effect
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // Grid resize/scale effect
  useEffect(() => {
    const handleResize = () => {
      if (gridContainerRef.current && appContainerRef.current) {
        const gridElement = gridContainerRef.current.querySelector('.inline-flex');
        if (!gridElement) return;

        const containerWidth = appContainerRef.current.clientWidth;
        const gridContentWidth = gridElement.scrollWidth;

        const computedStyle = window.getComputedStyle(appContainerRef.current);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const availableWidth = containerWidth - paddingLeft - paddingRight;


        if (gridContentWidth > availableWidth && availableWidth > 0) {
          const newScale = parseFloat((availableWidth / gridContentWidth).toFixed(3));
          if (newScale !== scale) setScale(Math.min(1, newScale));
        } else {
          if (scale !== 1) setScale(1);
        }
      }
    };
    handleResize(); // Initial call
    const debouncedHandleResize = () => { // Basic debounce
        let timeoutId: number;
        return () => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => handleResize(), 150);
        };
    };
    const effectiveResizeHandler = debouncedHandleResize();
    window.addEventListener('resize', effectiveResizeHandler);
    return () => {
      window.removeEventListener('resize', effectiveResizeHandler);
    };
  }, [birthdate, totalYears, scale]); // Add scale to dependencies

  const lifeStats = useMemo<LifeStats | null>(() => {
    if (!birthdate) return null;
    try {
      const birthDateObj = new Date(birthdate);
      if (isNaN(birthDateObj.getTime())) return null;

      const today = new Date();
      const endDate = addDays(birthDateObj, totalYears * DAYS_IN_YEAR_AVG);

      const daysPassed = differenceInDays(today, birthDateObj);
      const totalLifeDays = differenceInDays(endDate, birthDateObj);
      const daysRemaining = Math.max(0, totalLifeDays - daysPassed);

      const weeksPassed = differenceInWeeks(today, birthDateObj);
      const totalLifeWeeks = totalYears * WEEKS_IN_YEAR;
      const weeksRemaining = Math.max(0, totalLifeWeeks - weeksPassed);

      const percentageLived = totalLifeDays > 0 ? (daysPassed / totalLifeDays * 100) : 0;

      return {
        daysPassed, daysRemaining, totalLifeDays,
        weeksPassed, weeksRemaining, totalLifeWeeks,
        percentageLived: percentageLived.toFixed(2),
        milestones: {
          quarter: format(addDays(birthDateObj, totalLifeDays / 4), 'MMM d, yyyy'),
          halfway: format(addDays(birthDateObj, totalLifeDays / 2), 'MMM d, yyyy'),
          threeQuarter: format(addDays(birthDateObj, totalLifeDays * 0.75), 'MMM d, yyyy'),
        },
        currentWeekInYear: (weeksPassed % WEEKS_IN_YEAR) + 1,
        currentYearOfLife: Math.floor(weeksPassed / WEEKS_IN_YEAR),
        currentDateFormatted: format(today, 'MMM d, yyyy'),
        totalLifeSeconds: totalLifeDays * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE,
      };
    } catch (error) {
      console.error("Error calculating lifeStats:", error);
      return null;
    }
  }, [birthdate, totalYears]);

  // Update dynamic stats every second
  useEffect(() => {
    if (!birthdate || !lifeStats) {
      setDynamicStats({
        secondsLived: 0, minutesLived: 0, hoursLived: 0,
        secondsRemaining: 0, minutesRemaining: 0, hoursRemaining: 0,
        percentDayPassed: 0, percentMonthPassed: 0, percentYearPassed: 0,
        wakingHoursLived: 0, wakingHoursRemaining: 0,
      });
      return;
    }
    const birthDateObj = new Date(birthdate);
    if (isNaN(birthDateObj.getTime())) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const secondsLived = differenceInSeconds(now, birthDateObj);
      const secondsRemaining = Math.max(0, lifeStats.totalLifeSeconds - secondsLived);

      const todayStart = startOfDay(now);
      const secondsTodayTotal = HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
      const secondsPassedToday = differenceInSeconds(now, todayStart);

      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const nextMonthStart = startOfMonth(addDays(monthEnd, 1));
      const secondsThisMonthTotal = differenceInSeconds(nextMonthStart, monthStart);
      const secondsPassedThisMonth = differenceInSeconds(now, monthStart);

      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const nextYearStart = startOfYear(addDays(yearEnd, 1));
      const secondsThisYearTotal = differenceInSeconds(nextYearStart, yearStart);
      const secondsPassedThisYear = differenceInSeconds(now, yearStart);

      setDynamicStats({
        secondsLived,
        minutesLived: Math.floor(secondsLived / SECONDS_IN_MINUTE),
        hoursLived: Math.floor(secondsLived / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR)),
        secondsRemaining,
        minutesRemaining: Math.floor(secondsRemaining / SECONDS_IN_MINUTE),
        hoursRemaining: Math.floor(secondsRemaining / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR)),
        percentDayPassed: (secondsPassedToday / secondsTodayTotal) * 100,
        percentMonthPassed: (secondsPassedThisMonth / secondsThisMonthTotal) * 100,
        percentYearPassed: (secondsPassedThisYear / secondsThisYearTotal) * 100,
        wakingHoursLived: Math.floor((secondsLived * WAKING_TIME_FACTOR) / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR)),
        wakingHoursRemaining: Math.floor((secondsRemaining * WAKING_TIME_FACTOR) / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR)),
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [birthdate, lifeStats]);

  const openDiaryModal = useCallback((weekIndex: number, row: number, col: number) => {
    if (!birthdate) return;
    try {
      const birthDateObj = new Date(birthdate);
      if (isNaN(birthDateObj.getTime())) {
        console.error("Invalid birthdate for modal:", birthdate);
        return;
      }
      setSelectedWeek({
        index: weekIndex, row, col,
        date: format(addWeeks(birthDateObj, weekIndex), 'MMM d, yyyy')
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error opening diary modal:", error);
    }
  }, [birthdate]);

  const closeModalCallback = useCallback(() => {
    setIsModalOpen(false);
    setSelectedWeek(null);
  }, []);

  const saveDiaryEntry = useCallback(async (newEntryText: string) => {
    const { isAuthReady, db, userId, appId } = firebaseServices;
    if (!selectedWeek || !isAuthReady || !db || !userId) return;

    const diaryDocRef = db.doc(`artifacts/${appId}/users/${userId}/userData/diary`);
    const weekKey = selectedWeek.index.toString();
    const trimmedNewEntryText = newEntryText.trim();
    const currentEntryForWeek = diaryEntries[weekKey] || '';

    try {
      if (trimmedNewEntryText === '' && currentEntryForWeek !== '') {
        await diaryDocRef.update({ [weekKey]: firebase.firestore.FieldValue.delete() });
      } else if (trimmedNewEntryText !== '' && trimmedNewEntryText !== currentEntryForWeek) {
        await diaryDocRef.set({ [weekKey]: trimmedNewEntryText }, { merge: true });
      }
      closeModalCallback();
    } catch (error) {
      console.error("Error saving diary entry:", error);
    }
  }, [selectedWeek, firebaseServices, diaryEntries, closeModalCallback]);


  if (!firebaseServices.isAuthReady && Object.keys(firebaseConfig).length > 0) {
    return <div className="text-text-muted text-center pt-20 text-xl animate-pulse">Loading Life Data...</div>;
  }

  const currentDiaryEntry = selectedWeek ? diaryEntries[selectedWeek.index.toString()] || '' : '';

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i:number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };


  return (
    <>
      <div ref={appContainerRef} className="flex flex-col items-center w-full min-h-screen p-4 sm:p-5 md:p-6">
        <div className="w-full max-w-7xl flex flex-col gap-4 sm:gap-6 md:gap-8 text-center">
          <motion.header
            className="text-center mb-0 sm:mb-2 flex flex-col items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-1 uppercase tracking-wider text-primary drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
              My Life in Weeks
            </h1>
            <p className="text-sm sm:text-base lg:text-lg italic mb-4 sm:mb-6 text-text-muted font-light max-w-2xl leading-relaxed">
              "{quote}"
            </p>
            {firebaseServices.isAuthReady && firebaseServices.userId && Object.keys(firebaseConfig).length > 0 && (
              <p className="text-xs text-text-muted/70 -mt-3 mb-3">User ID: {firebaseServices.userId.substring(0,8)}...</p>
            )}

            {lifeStats && (
              <div className="text-sm sm:text-base mb-2 sm:mb-4 text-text-muted font-normal relative flex flex-col items-center p-3 sm:p-4 border-y border-primary/20 bg-card-bg/80 backdrop-blur-sm rounded-lg shadow-lg max-w-sm mx-auto">
                <div className="flex justify-center gap-3 sm:gap-4 mb-2 w-full">
                  <span className="py-1 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold shadow-md bg-accent text-white">Week {lifeStats.currentWeekInYear}</span>
                  <span className="py-1 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold shadow-md bg-primary text-bg-dark">Year {lifeStats.currentYearOfLife}</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] tracking-wide">{lifeStats.currentDateFormatted}</div>
              </div>
            )}
          </motion.header>

          <motion.section
            className="mb-0 sm:mb-2"
            custom={0} initial="hidden" animate="visible" variants={sectionVariants}
          >
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
              <label className="flex flex-col sm:flex-row items-center gap-2 text-sm sm:text-base text-text-muted w-full sm:w-auto max-w-xs sm:max-w-none">
                <span className="font-medium text-white whitespace-nowrap">Birthdate:</span>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="h-10 w-full sm:w-auto flex rounded-md border border-input bg-transparent px-3 py-2 text-sm text-white
                             ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
                             placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                             focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  aria-label="Birthdate"
                />
              </label>
              <label className="flex flex-col sm:flex-row items-center gap-2 text-sm sm:text-base text-text-muted w-full sm:w-auto max-w-xs sm:max-w-none">
                <span className="font-medium text-white whitespace-nowrap">Life Expectancy:</span>
                <input
                  type="number"
                  value={totalYears}
                  onChange={(e) => setTotalYears(Math.max(MIN_LIFE_EXPECTANCY, Math.min(MAX_LIFE_EXPECTANCY, parseInt(e.target.value, 10) || DEFAULT_LIFE_EXPECTANCY)))}
                  min={MIN_LIFE_EXPECTANCY.toString()} max={MAX_LIFE_EXPECTANCY.toString()}
                  className="h-10 w-24 flex rounded-md border border-input bg-transparent px-3 py-2 text-sm text-center text-white
                             ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed
                             disabled:opacity-50 transition-colors appearance-none [-moz-appearance:textfield]"
                  aria-label="Life expectancy in years"
                />
                <span className="text-xs sm:text-sm text-text-muted">years</span>
              </label>
            </div>
          </motion.section>

          {birthdate && lifeStats ? (
            <main className="flex flex-col gap-6 sm:gap-8 md:gap-10 w-full">
              <motion.section custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
                <div className="w-full h-2.5 bg-bg-light rounded-full overflow-hidden shadow-inner mb-1 mx-auto max-w-3xl border border-box-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary-dark to-primary transition-all duration-1000 ease-out shadow-[0_0_10px_theme(colors.primary-glow)]"
                    style={{ width: `${lifeStats.percentageLived}%` }}
                    role="progressbar"
                    aria-valuenow={parseFloat(lifeStats.percentageLived)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Percentage of life journey completed"
                  ></div>
                </div>
                <div className="text-sm font-medium text-primary text-center">{lifeStats.percentageLived}% of life journey</div>
              </motion.section>

              <motion.section ref={gridContainerRef} custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
                <WeeksGrid
                  weeksPassed={lifeStats.weeksPassed}
                  totalYears={totalYears}
                  birthdate={birthdate}
                  onHover={setHoverInfo}
                  onWeekClick={openDiaryModal}
                  diaryEntries={diaryEntries}
                  scale={scale}
                />
              </motion.section>

              <motion.section custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
                <SectionHeading title="Life Journey Overview" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  <StatCard value={lifeStats.daysPassed} label="Days Lived" variant="daysLived" index={0}/>
                  <StatCard value={lifeStats.daysRemaining} label="Days Remaining" variant="daysRemaining" index={1}/>
                  <StatCard value={lifeStats.weeksPassed} label="Weeks Lived" variant="weeksLived" index={2}/>
                  <StatCard value={lifeStats.weeksRemaining} label="Weeks Remaining" variant="weeksRemaining" index={3}/>
                </div>
              </motion.section>

              <motion.section custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
                <SectionHeading title="Detailed Chronometrics" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                  <StatCard value={dynamicStats.hoursLived} label="Hours Lived" variant="mini" index={0}/>
                  <StatCard value={dynamicStats.minutesLived} label="Minutes Lived" variant="mini" index={1}/>
                  <StatCard value={dynamicStats.secondsLived} label="Seconds Lived" variant="mini" index={2}/>
                  <StatCard value={dynamicStats.hoursRemaining} label="Hours Rem." variant="mini" index={3}/>
                  <StatCard value={dynamicStats.minutesRemaining} label="Minutes Rem." variant="mini" index={4}/>
                  <StatCard value={dynamicStats.secondsRemaining} label="Seconds Rem." variant="mini" index={5}/>
                </div>
              </motion.section>

              <motion.section custom={5} initial="hidden" animate="visible" variants={sectionVariants}>
                <SectionHeading title="Waking Life Perspective" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 max-w-3xl mx-auto">
                    <StatCard value={dynamicStats.wakingHoursLived} label="Waking Hours Lived" index={0} />
                    <StatCard value={dynamicStats.wakingHoursRemaining} label="Waking Hours Rem." index={1}/>
                </div>
                 <p className="text-xs text-text-muted mt-2 text-center">(Estimated based on 16 waking hours per day)</p>
              </motion.section>

              <motion.section custom={6} initial="hidden" animate="visible" variants={sectionVariants}>
                <SectionHeading title="Current Rhythms" />
                <div className="flex flex-col gap-3 sm:gap-4 max-w-2xl mx-auto">
                  {[
                    { label: "Today Passed", value: dynamicStats.percentDayPassed, colorName: "primary" }, // Using theme color names
                    { label: "This Month Passed", value: dynamicStats.percentMonthPassed, colorName: "accent" },
                    { label: "This Year Passed", value: dynamicStats.percentYearPassed, colorHex: "#4caf50" }, // Keep specific hex if not in theme
                  ].map((rhythm, idx) => (
                    <motion.div
                      key={rhythm.label}
                      className="bg-card-bg/50 p-3 rounded-md border border-box-border/50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="text-sm text-text-muted mb-1 text-left flex justify-between">
                        <span>{rhythm.label}:</span>
                        <span>{rhythm.value.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-bg-light rounded-full overflow-hidden border border-box-border/30">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${rhythm.colorName ? `bg-${rhythm.colorName}` : ''}`}
                          style={{ width: `${rhythm.value}%`, backgroundColor: rhythm.colorHex ? rhythm.colorHex : undefined }}
                          role="progressbar"
                          aria-valuenow={rhythm.value}
                          aria-label={`${rhythm.label} progress`}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              <motion.section custom={7} initial="hidden" animate="visible" variants={sectionVariants}>
                <h3 className="text-center text-xl sm:text-2xl text-primary mb-6 font-medium">Life Milestones</h3>
                <div className="relative flex flex-col sm:flex-row justify-around items-start max-w-3xl mx-auto gap-6 sm:gap-0">
                  <div className="hidden sm:block absolute top-2.5 left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary to-accent rounded-full z-[1] shadow-lg shadow-primary/30"></div>
                  {[
                    { title: "Quarter Life", date: lifeStats.milestones.quarter, color: "#4CAF50" },
                    { title: "Halfway Point", date: lifeStats.milestones.halfway, color: "#2196F3" },
                    { title: "Three-Quarter Mark", date: lifeStats.milestones.threeQuarter, color: "#9C27B0" },
                  ].map((milestone, idx) => (
                    <motion.div
                      key={milestone.title}
                      className="relative z-[2] flex flex-col items-center w-full sm:w-1/3 px-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.15 }}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-bg-dark mb-2 sm:mb-3 shadow-lg" style={{ backgroundColor: milestone.color, boxShadow: `0 0 12px ${milestone.color}80` }}>
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="text-center bg-card-bg p-2.5 sm:p-3 rounded-md w-full backdrop-blur-sm shadow-lg border border-box-border/50">
                        <div className="font-medium text-sm" style={{color: milestone.color}}>{milestone.title}</div>
                        <div className="text-base sm:text-lg text-white">{milestone.date}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              <motion.footer
                className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-box-border"
                custom={8} initial="hidden" animate="visible" variants={sectionVariants}
              >
                <div className="flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm flex-wrap">
                  {[
                    { label: "Past Weeks", colorClass: `bg-primary shadow-sm shadow-primary/20` },
                    { label: "Current Week", colorClass: `bg-accent shadow-md shadow-accent/40` },
                    { label: "Future Weeks", colorClass: `bg-bg-light` },
                    { label: "Contains Diary Entry", colorClass: `bg-bg-light relative after:content-['📝'] after:absolute after:text-[9px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:opacity-80` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center text-text-muted">
                      <span className={`inline-block w-4 h-4 mr-1.5 border border-box-border rounded-[2px] ${item.colorClass}`}></span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </motion.footer>

            </main>
          ) : (
            <div className="text-center text-text-muted mt-10 p-5 text-lg">
              {firebaseServices.isAuthReady && Object.keys(firebaseConfig).length > 0 ?
                "Please enter your birthdate to begin your life journey visualization." :
                "Initializing application..."}
            </div>
          )}

          <Tooltip hoverInfo={hoverInfo} />

          <DiaryModal
            isOpen={isModalOpen}
            onClose={closeModalCallback}
            selectedWeek={selectedWeek}
            initialEntryText={currentDiaryEntry}
            onSave={saveDiaryEntry}
          />

        </div>
      </div>
    </>
  );
};

export default App;
