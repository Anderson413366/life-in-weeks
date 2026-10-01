export function isValidFeedbackRating(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 1 && stars <= 5;
}
