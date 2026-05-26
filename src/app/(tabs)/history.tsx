import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getHistory } from '@/game/storage';
import { ModeMeta, type RoundResult } from '@/game/types';
import { useTheme } from '@/hooks/use-theme';

function formatRelativeTime(ts: number, now: number): string {
  const diffMs = Math.max(0, now - ts);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const theme = useTheme();
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const hist = await getHistory();
        if (cancelled) return;
        setHistory(hist);
        setNow(Date.now());
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Recent rounds</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your last 10 finished rounds, newest first.
          </ThemedText>
        </View>

        {loaded && history.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No rounds yet — finish a game to start tracking your progress.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={styles.card}>
              {history.map((round, idx) => {
                const meta = ModeMeta[round.mode];
                const avg =
                  round.avgMsPerCorrect !== null
                    ? `${(round.avgMsPerCorrect / 1000).toFixed(2)}s avg`
                    : '—';
                return (
                  <View
                    key={`${round.finishedAt}-${idx}`}
                    style={[
                      styles.row,
                      idx < history.length - 1 && {
                        borderBottomColor: theme.backgroundSelected,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}>
                    <View style={styles.rowLeft}>
                      <ThemedText type="smallBold">{meta.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {round.correct} correct · {round.wrong} wrong · {avg}
                      </ThemedText>
                    </View>
                    <View style={styles.rowRight}>
                      <ThemedText style={styles.rowScore}>
                        {meta.scoreFormat(round.score)}
                      </ThemedText>
                      {now !== null && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatRelativeTime(round.finishedAt, now)}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                );
              })}
            </ThemedView>
          </ScrollView>
        )}
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
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  rowLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  rowScore: {
    fontSize: 18,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
  },
});
