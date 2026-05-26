export const SPRINT_DURATION_MS = 60_000;
export const RACE_PROBLEMS = 20;
export const RACE_WRONG_PENALTY_MS = 5_000;
export const SURVIVAL_START_LIMIT_MS = 10_000;
export const SURVIVAL_MIN_LIMIT_MS = 3_000;
export const SURVIVAL_SHRINK_EVERY = 5;
export const SURVIVAL_SHRINK_BY_MS = 1_000;
export const FEEDBACK_VISIBLE_MS = 1_200;
export const MAX_INPUT_LENGTH = 5;

export function survivalLimitMs(correct: number): number {
  const shrinks = Math.floor(correct / SURVIVAL_SHRINK_EVERY);
  return Math.max(SURVIVAL_MIN_LIMIT_MS, SURVIVAL_START_LIMIT_MS - shrinks * SURVIVAL_SHRINK_BY_MS);
}
