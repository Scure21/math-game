import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NumberPad, type PadValue } from '@/components/number-pad';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatProblem, generateProblem, nextDifficulty } from '@/game/problems';
import { appendHistory, updateBestScore } from '@/game/storage';
import { ModeMeta, type GameMode, type Problem, type RoundResult } from '@/game/types';
import { useTheme } from '@/hooks/use-theme';

const SPRINT_DURATION_MS = 60_000;
const RACE_PROBLEMS = 20;
const SURVIVAL_START_LIMIT_MS = 10_000;
const SURVIVAL_MIN_LIMIT_MS = 3_000;
const SURVIVAL_SHRINK_EVERY = 5;
const SURVIVAL_SHRINK_BY_MS = 1_000;

type Phase = 'playing' | 'finished';

type WrongFeedback = { problemStr: string; expected: number; id: number };

type State = {
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

type Action =
  | { type: 'append-digit'; digit: number; now: number }
  | { type: 'delete' }
  | { type: 'submit'; mode: GameMode; now: number; timedOut?: boolean }
  | { type: 'clear-feedback'; id: number }
  | { type: 'finish'; now: number };

function initialState(now: number): State {
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

function reducer(state: State, action: Action): State {
  if (state.phase === 'finished') return state;

  switch (action.type) {
    case 'append-digit': {
      if (state.input.length >= 5) return state;
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
        : { problemStr: formatProblem(state.problem), expected: state.problem.answer, id: action.now };
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

function survivalLimitMs(correct: number): number {
  const shrinks = Math.floor(correct / SURVIVAL_SHRINK_EVERY);
  return Math.max(SURVIVAL_MIN_LIMIT_MS, SURVIVAL_START_LIMIT_MS - shrinks * SURVIVAL_SHRINK_BY_MS);
}

export default function PlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: GameMode = useMemo(() => {
    const m = params.mode;
    return m === 'race' || m === 'survival' ? m : 'sprint';
  }, [params.mode]);

  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const persistedRef = useRef(false);

  useEffect(() => {
    if (state.phase === 'finished') return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    if (mode !== 'sprint' || state.phase === 'finished') return;
    const elapsed = now - state.roundStartedAt;
    if (elapsed >= SPRINT_DURATION_MS) {
      dispatch({ type: 'finish', now });
    }
  }, [mode, now, state.phase, state.roundStartedAt]);

  useEffect(() => {
    if (mode !== 'survival' || state.phase === 'finished') return;
    const limit = survivalLimitMs(state.correct);
    const elapsed = now - state.problemStartedAt;
    if (elapsed >= limit) {
      dispatch({ type: 'submit', mode, now, timedOut: true });
    }
  }, [mode, now, state.phase, state.problemStartedAt, state.correct]);

  const feedbackId = state.wrongFeedback?.id;
  useEffect(() => {
    if (feedbackId === undefined) return;
    const t = setTimeout(() => dispatch({ type: 'clear-feedback', id: feedbackId }), 1200);
    return () => clearTimeout(t);
  }, [feedbackId]);

  useEffect(() => {
    if (state.phase !== 'finished' || persistedRef.current) return;
    persistedRef.current = true;
    const finishedAt = state.finishedAt ?? Date.now();
    const durationMs = finishedAt - state.roundStartedAt;
    const score =
      mode === 'race'
        ? state.correct >= RACE_PROBLEMS
          ? durationMs
          : durationMs + state.wrong * 5_000
        : state.correct;
    const result: RoundResult = {
      mode,
      score,
      durationMs,
      correct: state.correct,
      wrong: state.wrong,
      avgMsPerCorrect: state.correct > 0 ? Math.round(durationMs / state.correct) : null,
      finishedAt,
    };
    (async () => {
      await appendHistory(result);
      await updateBestScore(result);
    })();
  }, [state.phase, state.finishedAt, state.roundStartedAt, state.correct, state.wrong, mode]);

  const handlePad = useCallback(
    (value: PadValue) => {
      if (state.phase === 'finished') return;
      const stamp = Date.now();
      if (value === 'submit') {
        if (state.input === '') return;
        dispatch({ type: 'submit', mode, now: stamp });
      } else if (value === 'delete') {
        dispatch({ type: 'delete' });
      } else {
        dispatch({ type: 'append-digit', digit: value, now: stamp });
      }
    },
    [state.phase, state.input, mode],
  );

  if (state.phase === 'finished' && state.finishedAt !== null) {
    return (
      <ResultsView
        mode={mode}
        correct={state.correct}
        wrong={state.wrong}
        durationMs={state.finishedAt - state.roundStartedAt}
        onPlayAgain={() => router.replace(`/play?mode=${mode}`)}
        onHome={() => router.replace('/')}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Hud mode={mode} state={state} now={now} />

        <View style={styles.problemArea}>
          <View style={styles.feedbackSlot} pointerEvents="none">
            {state.wrongFeedback && (
              <Animated.View
                key={state.wrongFeedback.id}
                entering={FadeIn.duration(120)}
                exiting={FadeOut.duration(400)}
                style={styles.wrongPill}>
                <ThemedText style={styles.wrongPillText}>
                  ✗ {state.wrongFeedback.problemStr} = {state.wrongFeedback.expected}
                </ThemedText>
              </Animated.View>
            )}
          </View>
          <ThemedText style={styles.problem}>{formatProblem(state.problem)}</ThemedText>
          <ThemedText style={styles.equals} themeColor="textSecondary">
            =
          </ThemedText>
          <InputDisplay value={state.input} />
        </View>

        <View style={styles.padArea}>
          <NumberPad onPress={handlePad} />
        </View>

        <Pressable onPress={() => router.replace('/')} style={styles.quitButton}>
          <ThemedText type="small" themeColor="textSecondary">
            Quit
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function Hud({ mode, state, now }: { mode: GameMode; state: State; now: number }) {
  if (mode === 'sprint') {
    const remaining = Math.max(0, SPRINT_DURATION_MS - (now - state.roundStartedAt));
    const seconds = Math.ceil(remaining / 1000);
    return (
      <View style={styles.hud}>
        <HudStat label="time" value={`${seconds}s`} />
        <HudStat label="correct" value={`${state.correct}`} />
        <HudStat label="wrong" value={`${state.wrong}`} />
      </View>
    );
  }
  if (mode === 'race') {
    const elapsedSec = ((now - state.roundStartedAt) / 1000).toFixed(1);
    return (
      <View style={styles.hud}>
        <HudStat label="problem" value={`${state.answered + 1}/${RACE_PROBLEMS}`} />
        <HudStat label="time" value={`${elapsedSec}s`} />
        <HudStat label="wrong" value={`${state.wrong}`} />
      </View>
    );
  }
  const limit = survivalLimitMs(state.correct);
  const remaining = Math.max(0, limit - (now - state.problemStartedAt));
  const seconds = (remaining / 1000).toFixed(1);
  return (
    <View style={styles.hud}>
      <HudStat label="time" value={`${seconds}s`} />
      <HudStat label="streak" value={`${state.correct}`} />
      <HudStat label="lives" value={'♥'.repeat(state.lives)} />
    </View>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.hudStat}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hudStatLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.hudStatValue}>{value}</ThemedText>
    </View>
  );
}

function InputDisplay({ value }: { value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.inputBox, { borderBottomColor: theme.backgroundSelected }]}>
      <ThemedText style={styles.inputValue}>{value === '' ? ' ' : value}</ThemedText>
    </View>
  );
}

function ResultsView({
  mode,
  correct,
  wrong,
  durationMs,
  onPlayAgain,
  onHome,
}: {
  mode: GameMode;
  correct: number;
  wrong: number;
  durationMs: number;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const theme = useTheme();
  const meta = ModeMeta[mode];
  const avg = correct > 0 ? `${(durationMs / correct / 1000).toFixed(2)}s` : '—';
  const headlineValue =
    mode === 'race'
      ? correct >= RACE_PROBLEMS
        ? `${(durationMs / 1000).toFixed(1)}s`
        : 'unfinished'
      : `${correct}`;
  const headlineLabel = mode === 'race' ? 'final time' : `${meta.scoreLabel}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.resultsSafe}>
        <View style={styles.resultsHeader}>
          <ThemedText type="small" themeColor="textSecondary">
            {meta.title}
          </ThemedText>
          <ThemedText type="title" style={styles.resultsHeadline}>
            {headlineValue}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{headlineLabel}</ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.resultsCard}>
          <ResultRow label="Correct" value={`${correct}`} />
          <ResultRow label="Wrong" value={`${wrong}`} />
          <ResultRow label="Total time" value={`${(durationMs / 1000).toFixed(1)}s`} />
          <ResultRow label="Avg per correct" value={avg} />
        </ThemedView>

        <View style={styles.resultsActions}>
          <Pressable
            onPress={onPlayAgain}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: pressed ? '#2f6fd1' : '#3c87f7' },
            ]}>
            <ThemedText style={styles.primaryButtonLabel}>Play again</ThemedText>
          </Pressable>
          <Pressable
            onPress={onHome}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}>
            <ThemedText style={styles.secondaryButtonLabel}>Home</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText style={styles.resultRowValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.two,
  },
  hudStat: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  hudStatLabel: {
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
  hudStatValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  problemArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  feedbackSlot: {
    position: 'absolute',
    top: Spacing.three,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  wrongPill: {
    backgroundColor: '#e5484d',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  wrongPillText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  problem: {
    fontSize: 56,
    fontWeight: '600',
    lineHeight: 64,
  },
  equals: {
    fontSize: 32,
    lineHeight: 36,
  },
  inputBox: {
    minWidth: 160,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  inputValue: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    minHeight: 56,
  },
  padArea: {
    paddingTop: Spacing.two,
  },
  quitButton: {
    alignSelf: 'center',
    padding: Spacing.two,
  },
  resultsSafe: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.five,
    justifyContent: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  resultsHeadline: {
    fontSize: 64,
    lineHeight: 68,
  },
  resultsCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  resultRowValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  resultsActions: {
    gap: Spacing.two,
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});
