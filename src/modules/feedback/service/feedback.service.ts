import { FEEDBACK_INTERVAL_MS, FEEDBACK_STORAGE_KEY } from "../repository/queries";
import { insertFeedback } from "../repository/feedback.repository";

export function shouldShowFeedbackPrompt(now = Date.now()): boolean {
  const last = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  return !(last && now - parseInt(last, 10) < FEEDBACK_INTERVAL_MS);
}

export function dismissFeedbackPrompt(now = Date.now()): void {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, now.toString());
}

export async function submitFeedback(userId: string | undefined, stars: number, message: string) {
  return insertFeedback(userId, stars, message);
}
