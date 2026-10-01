export function isLifeExpectancyInRange(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 120;
}
