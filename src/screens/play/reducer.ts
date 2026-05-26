import { formatProblem, generateProblem, nextDifficulty } from '@/game/problems';
import type { GameMode, Problem } from '@/game/types';

import { MAX_INPUT_LENGTH, RACE_PROBLEMS } from './constants';

export type Phase = 'playing' | 'finished';

export type WrongFeedback = { problemStr: string; expected: number; id: number };

export type State = {
  phase: Phase;
  problem: Problem;
  input: string;
  difficulty: number;
  correct: number;
  wrong: number;
  lives: number;
  answered: number;
  problemStartedAt: number;
  roundStartedAt: number;
  finishedAt: number | null;
  wrongFeedback: WrongFeedback | null;
};

export type Action =
  | { type: 'append-digit'; digit: number; now: number }
  | { type: 'delete' }
  | { type: 'submit'; mode: GameMode; now: number; timedOut?: boolean }
  | { type: 'clear-feedback'; id: number }
  | { type: 'finish'; now: number };

export function initialState(now: number): State {
  return {
    phase: 'playing',
    problem: generateProblem(1),
    input: '',
    difficulty: 1,
    correct: 0,
    wrong: 0,
    lives: 3,
    answered: 0,
    problemStartedAt: now,
    roundStartedAt: now,
    finishedAt: null,
    wrongFeedback: null,
  };
}

export function reducer(state: State, action: Action): State {
  if (state.phase === 'finished') return state;

  switch (action.type) {
    case 'append-digit': {
      if (state.input.length >= MAX_INPUT_LENGTH) return state;
      return { ...state, input: state.input + action.digit };
    }
    case 'delete': {
      return { ...state, input: state.input.slice(0, -1) };
    }
    case 'submit': {
      const elapsed = action.now - state.problemStartedAt;
      const parsed = state.input === '' ? NaN : Number(state.input);
      const isCorrect = !action.timedOut && parsed === state.problem.answer;
      const newDifficulty = nextDifficulty(state.difficulty, isCorrect, elapsed);
      const newCorrect = state.correct + (isCorrect ? 1 : 0);
      const newWrong = state.wrong + (isCorrect ? 0 : 1);
      const newLives = action.mode === 'survival' && !isCorrect ? state.lives - 1 : state.lives;
      const newAnswered = state.answered + 1;
      const shouldFinish =
        (action.mode === 'race' && newAnswered >= RACE_PROBLEMS) ||
        (action.mode === 'survival' && newLives <= 0);
      const feedback: WrongFeedback | null = isCorrect
        ? null
        : {
            problemStr: formatProblem(state.problem),
            expected: state.problem.answer,
            id: action.now,
          };
      return {
        ...state,
        phase: shouldFinish ? 'finished' : 'playing',
        problem: shouldFinish ? state.problem : generateProblem(newDifficulty),
        input: '',
        difficulty: newDifficulty,
        correct: newCorrect,
        wrong: newWrong,
        lives: newLives,
        answered: newAnswered,
        problemStartedAt: action.now,
        finishedAt: shouldFinish ? action.now : state.finishedAt,
        wrongFeedback: feedback,
      };
    }
    case 'clear-feedback': {
      if (state.wrongFeedback?.id !== action.id) return state;
      return { ...state, wrongFeedback: null };
    }
    case 'finish': {
      return { ...state, phase: 'finished', finishedAt: action.now };
    }
  }
}
