export { default as DashboardPage } from "./ui/pages/DashboardPage";
export { default as LifeGridPage } from "./ui/pages/LifeGridPage";
export { useLifeStats } from "./ui/hooks/useLifeStats";
export { getGeneration, getOnThisDay, getZodiacSign } from "./repository/life.repository";
export type { DynamicStats, HoverInfo, LifeStats, SelectedWeek, UserAverages } from "./types/life.types";
export * from "./api/routes";
