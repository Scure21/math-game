import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getBestScore } from '@/game/storage';
import { ModeMeta, type GameMode } from '@/game/types';
import { useTheme } from '@/hooks/use-theme';

const MODES: GameMode[] = ['sprint', 'race', 'survival'];

export default function PlayMenuScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [bestScores, setBestScores] = useState<Partial<Record<GameMode, number>>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [sprint, race, survival] = await Promise.all([
          getBestScore('sprint'),
          getBestScore('race'),
          getBestScore('survival'),
        ]);
        if (cancelled) return;
        setBestScores({
          sprint: sprint ?? undefined,
          race: race ?? undefined,
          survival: survival ?? undefined,
        });
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Math Sprint
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Get faster at +, −, ×, ÷
            </ThemedText>
          </View>

          <View style={styles.modes}>
            {MODES.map((mode) => {
              const meta = ModeMeta[mode];
              const best = bestScores[mode];
              return (
                <Pressable
                  key={mode}
                  onPress={() => router.push(`/play?mode=${mode}`)}
                  style={({ pressed }) => [
                    styles.modeCard,
                    {
                      backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                    },
                  ]}>
                  <View style={styles.modeText}>
                    <ThemedText style={styles.modeTitle}>{meta.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {meta.tagline}
                    </ThemedText>
                  </View>
                  <View style={styles.modeScore}>
                    <ThemedText type="small" themeColor="textSecondary">
                      best
                    </ThemedText>
                    <ThemedText style={styles.modeScoreValue}>
                      {best !== undefined ? meta.scoreFormat(best) : '—'}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
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
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.one,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  modes: {
    gap: Spacing.three,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  modeText: {
    flex: 1,
    gap: Spacing.half,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modeScore: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  modeScoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});
