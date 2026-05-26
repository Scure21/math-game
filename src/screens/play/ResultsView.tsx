import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ModeMeta, type GameMode } from '@/game/types';
import { useTheme } from '@/hooks/use-theme';

import { RACE_PROBLEMS } from './constants';

type ResultsViewProps = {
  mode: GameMode;
  correct: number;
  wrong: number;
  durationMs: number;
  onPlayAgain: () => void;
  onHome: () => void;
};

export function ResultsView({
  mode,
  correct,
  wrong,
  durationMs,
  onPlayAgain,
  onHome,
}: ResultsViewProps) {
  const theme = useTheme();
  const meta = ModeMeta[mode];
  const avg = correct > 0 ? `${(durationMs / correct / 1000).toFixed(2)}s` : '—';
  const headlineValue =
    mode === 'race'
      ? correct >= RACE_PROBLEMS
        ? `${(durationMs / 1000).toFixed(1)}s`
        : 'unfinished'
      : `${correct}`;
  const headlineLabel = mode === 'race' ? 'final time' : meta.scoreLabel;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {meta.title}
          </ThemedText>
          <ThemedText type="title" style={styles.headline}>
            {headlineValue}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{headlineLabel}</ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ResultRow label="Correct" value={`${correct}`} />
          <ResultRow label="Wrong" value={`${wrong}`} />
          <ResultRow label="Total time" value={`${(durationMs / 1000).toFixed(1)}s`} />
          <ResultRow label="Avg per correct" value={avg} />
        </ThemedView>

        <View style={styles.actions}>
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
    <View style={styles.row}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
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
    paddingVertical: Spacing.five,
    gap: Spacing.five,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  headline: {
    fontSize: 64,
    lineHeight: 68,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  actions: {
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
