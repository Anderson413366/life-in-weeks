export function isValidMoodEnergy(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 5;
}
