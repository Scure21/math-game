import Storage from 'expo-sqlite/kv-store';

import type { GameMode, RoundResult } from './types';

const HISTORY_KEY = 'math-game:history:v1';
const HISTORY_LIMIT = 10;
const BEST_KEY = (mode: GameMode) => `math-game:best:v1:${mode}`;

export async function getHistory(): Promise<RoundResult[]> {
  const raw = await Storage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RoundResult[];
  } catch {
    return [];
  }
}

export async function appendHistory(result: RoundResult): Promise<RoundResult[]> {
  const current = await getHistory();
  const next = [result, ...current].slice(0, HISTORY_LIMIT);
  await Storage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function getBestScore(mode: GameMode): Promise<number | null> {
  const raw = await Storage.getItem(BEST_KEY(mode));
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Returns true if this beat the previous best. Race mode treats lower as better. */
export async function updateBestScore(result: RoundResult): Promise<boolean> {
  const current = await getBestScore(result.mode);
  const isBetter =
    current === null
      ? true
      : result.mode === 'race'
        ? result.score < current
        : result.score > current;
  if (isBetter) {
    await Storage.setItem(BEST_KEY(result.mode), String(result.score));
  }
  return isBetter;
}

export async function clearAll(): Promise<void> {
  await Storage.removeItem(HISTORY_KEY);
  await Promise.all([
    Storage.removeItem(BEST_KEY('sprint')),
    Storage.removeItem(BEST_KEY('race')),
    Storage.removeItem(BEST_KEY('survival')),
  ]);
}
