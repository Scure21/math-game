import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { GameMode } from '@/game/types';

import { RACE_PROBLEMS, SPRINT_DURATION_MS, survivalLimitMs } from './constants';
import type { State } from './reducer';

export function Hud({ mode, state, now }: { mode: GameMode; state: State; now: number }) {
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

const styles = StyleSheet.create({
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
});
