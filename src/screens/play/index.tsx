import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoicePills } from '@/components/choice-pills';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatProblem } from '@/game/problems';
import { appendHistory, updateBestScore } from '@/game/storage';
import { type GameMode, type RoundResult } from '@/game/types';

import {
  FEEDBACK_VISIBLE_MS,
  RACE_PROBLEMS,
  RACE_WRONG_PENALTY_MS,
  SPRINT_DURATION_MS,
  survivalLimitMs,
} from './constants';
import { Hud } from './Hud';
import { initialState, reducer } from './reducer';
import { ResultsView } from './ResultsView';

function resolveMode(raw: string | string[] | undefined): GameMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'race' || value === 'survival' ? value : 'sprint';
}

function computeRoundResult(args: {
  mode: GameMode;
  correct: number;
  wrong: number;
  roundStartedAt: number;
  finishedAt: number;
}): RoundResult {
  const { mode, correct, wrong, roundStartedAt, finishedAt } = args;
  const durationMs = finishedAt - roundStartedAt;
  const score =
    mode === 'race'
      ? correct >= RACE_PROBLEMS
        ? durationMs
        : durationMs + wrong * RACE_WRONG_PENALTY_MS
      : correct;
  return {
    mode,
    score,
    durationMs,
    correct,
    wrong,
    avgMsPerCorrect: correct > 0 ? Math.round(durationMs / correct) : null,
    finishedAt,
  };
}

export default function PlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = useMemo(() => resolveMode(params.mode), [params.mode]);

  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const persistedRef = useRef(false);

  // tick `now` while playing so timers re-render
  useEffect(() => {
    if (state.phase === 'finished') return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [state.phase]);

  // sprint: finish when the 60s timer runs out
  useEffect(() => {
    if (mode !== 'sprint' || state.phase === 'finished') return;
    const elapsed = now - state.roundStartedAt;
    if (elapsed >= SPRINT_DURATION_MS) {
      dispatch({ type: 'finish', now });
    }
  }, [mode, now, state.phase, state.roundStartedAt]);

  // survival: timeout counts as wrong
  useEffect(() => {
    if (mode !== 'survival' || state.phase === 'finished') return;
    const limit = survivalLimitMs(state.correct);
    const elapsed = now - state.problemStartedAt;
    if (elapsed >= limit) {
      dispatch({ type: 'submit', choice: null, mode, now, timedOut: true });
    }
  }, [mode, now, state.phase, state.problemStartedAt, state.correct]);

  // auto-dismiss the wrong-answer pill
  const feedbackId = state.wrongFeedback?.id;
  useEffect(() => {
    if (feedbackId === undefined) return;
    const t = setTimeout(
      () => dispatch({ type: 'clear-feedback', id: feedbackId }),
      FEEDBACK_VISIBLE_MS,
    );
    return () => clearTimeout(t);
  }, [feedbackId]);

  // persist exactly once when the round finishes
  useEffect(() => {
    if (state.phase !== 'finished' || state.finishedAt === null) return;
    if (persistedRef.current) return;
    persistedRef.current = true;
    const result = computeRoundResult({
      mode,
      correct: state.correct,
      wrong: state.wrong,
      roundStartedAt: state.roundStartedAt,
      finishedAt: state.finishedAt,
    });
    (async () => {
      await appendHistory(result);
      await updateBestScore(result);
    })();
  }, [state.phase, state.finishedAt, state.roundStartedAt, state.correct, state.wrong, mode]);

  const handlePick = useCallback(
    (choice: number) => {
      if (state.phase === 'finished') return;
      dispatch({ type: 'submit', choice, mode, now: Date.now() });
    },
    [state.phase, mode],
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
          <ThemedText style={styles.problem}>{formatProblem(state.problem)} = ?</ThemedText>
        </View>

        <View style={styles.choicesArea}>
          <ChoicePills choices={state.problem.choices} onPick={handlePick} />
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
    textAlign: 'center',
  },
  choicesArea: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  quitButton: {
    alignSelf: 'center',
    padding: Spacing.two,
  },
});
