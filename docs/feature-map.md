# Feature Map

| Feature | Status | Route / Surface | Supporting Logic | Notes |
| --- | --- | --- | --- | --- |
| Auth sign-in / sign-up / recovery | Active | `AuthGate`, `/` signed-out | `useAuth` | Callback failure handling strengthened in this rescue |
| Home dashboard | Active | `/` | `DashboardPage`, `useLifeStats`, `useMood`, `useDiary` | Task map now collapsed by default |
| Life Grid | Active | `/grid` | `LifeGridPage`, `useLifeStats`, `DiaryModal` | Mobile shell improved; grid still dense by nature |
| Diary create/edit/delete | Active | `/diary`, modal from `/grid` | `DiaryPage`, `DiaryModal`, `useDiary` | Empty state is now writing-first |
| Diary photos | Active | `DiaryModal` | `storage.ts`, `useDiary` | Removed/deleted photos now trigger storage cleanup after successful online save |
| Mood tracking | Active | `/` | `useMood` | Optimistic and offline-aware |
| Time Mirror | Active with Gemini | `/timemirror` | `TimeMirrorPage`, `useTimeMirror`, `ai.ts` | UI now states Gemini requirement honestly |
| Settings / profile | Active | `/settings` | `SettingsPage`, `useProfile` | Task map now collapsed by default |
| JSON export | Active | `/settings` | `exportData.ts` | Gemini key excluded |
| Public legal pages | Active | `/terms`, `/privacy` | `LegalPage` | Remain outside auth |
| PWA shell | Active | app-wide | `index.tsx`, `manifest.json`, `sw.js` | Functional, but offline browser validation should keep expanding |
