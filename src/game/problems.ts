import type { Operation, Problem } from './types';

const OPERATIONS: Operation[] = ['+', '-', '×', '÷'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Difficulty is a 1–10 scale.
 *   1: single-digit operands, friendly multiplication (≤6×6).
 *   10: two-digit operands for +/−, up to 15×15 for ×/÷.
 */
export function generateProblem(difficulty: number, op?: Operation): Problem {
  const d = Math.max(1, Math.min(10, Math.round(difficulty)));
  const operation = op ?? pick(OPERATIONS);

  switch (operation) {
    case '+': {
      const max = 10 + d * 5;
      const a = randInt(1, max);
      const b = randInt(1, max);
      return { a, b, op: '+', answer: a + b };
    }
    case '-': {
      const max = 10 + d * 5;
      const a = randInt(1, max);
      const b = randInt(1, a);
      return { a, b, op: '-', answer: a - b };
    }
    case '×': {
      const max = 5 + d;
      const a = randInt(2, max);
      const b = randInt(2, max);
      return { a, b, op: '×', answer: a * b };
    }
    case '÷': {
      const max = 5 + d;
      const divisor = randInt(2, max);
      const quotient = randInt(2, max);
      const dividend = divisor * quotient;
      return { a: dividend, b: divisor, op: '÷', answer: quotient };
    }
  }
}

export function formatProblem(problem: Problem): string {
  return `${problem.a} ${problem.op} ${problem.b}`;
}

/**
 * Adaptive difficulty: nudges the level based on whether the player got the
 * last answer right and how fast. Stays in [1, 10].
 *
 * Thresholds tuned for the on-screen number pad on phone-sized screens:
 *   - <2500ms after correct: feels easy, bump up.
 *   - <5000ms after correct: about right, hold.
 *   - otherwise correct: slowing down, gentle drop.
 *   - wrong: bigger drop.
 */
export function nextDifficulty(current: number, correct: boolean, elapsedMs: number): number {
  if (!correct) return Math.max(1, current - 1);
  if (elapsedMs < 2500) return Math.min(10, current + 1);
  if (elapsedMs < 5000) return current;
  return Math.max(1, current - 0.5);
}
