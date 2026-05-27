export type Operation = '+' | '-' | '×' | '÷';

export type Problem = {
  a: number;
  b: number;
  op: Operation;
  answer: number;
  /** Three answer options including `answer`, already shuffled. */
  choices: number[];
};

export type GameMode = 'sprint' | 'race' | 'survival';

export type RoundResult = {
  mode: GameMode;
  /** Sprint: correct count. Race: total time in ms (lower = better). Survival: correct count. */
  score: number;
  durationMs: number;
  correct: number;
  wrong: number;
  /** Average ms per correct answer, useful for tracking improvement. */
  avgMsPerCorrect: number | null;
  finishedAt: number;
};

export const ModeMeta: Record<GameMode, { title: string; tagline: string; scoreLabel: string; scoreFormat: (s: number) => string }> = {
  sprint: {
    title: '60-second sprint',
    tagline: 'Solve as many as you can in 60 seconds',
    scoreLabel: 'correct',
    scoreFormat: (s) => `${s}`,
  },
  race: {
    title: '20-problem race',
    tagline: 'Race the clock through 20 problems',
    scoreLabel: 'time',
    scoreFormat: (ms) => `${(ms / 1000).toFixed(1)}s`,
  },
  survival: {
    title: 'Survival',
    tagline: '3 lives. Speed up to survive',
    scoreLabel: 'streak',
    scoreFormat: (s) => `${s}`,
  },
};
