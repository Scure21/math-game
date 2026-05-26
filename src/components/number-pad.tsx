import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type Key = { label: string; value: PadValue; flex?: number };
export type PadValue = number | 'delete' | 'submit';

const ROWS: Key[][] = [
  [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
  ],
  [
    { label: '4', value: 4 },
    { label: '5', value: 5 },
    { label: '6', value: 6 },
  ],
  [
    { label: '7', value: 7 },
    { label: '8', value: 8 },
    { label: '9', value: 9 },
  ],
  [
    { label: '⌫', value: 'delete' },
    { label: '0', value: 0 },
    { label: '✓', value: 'submit' },
  ],
];

export function NumberPad({ onPress, disabled }: { onPress: (value: PadValue) => void; disabled?: boolean }) {
  const theme = useTheme();

  const handlePress = useCallback(
    (value: PadValue) => {
      if (disabled) return;
      onPress(value);
    },
    [disabled, onPress],
  );

  return (
    <View style={styles.pad}>
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => {
            const isSubmit = key.value === 'submit';
            const isDelete = key.value === 'delete';
            return (
              <Pressable
                key={key.label}
                onPress={() => handlePress(key.value)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: isSubmit
                      ? '#3c87f7'
                      : pressed
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                    opacity: disabled ? 0.4 : 1,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.keyLabel,
                    isSubmit && styles.submitLabel,
                    isDelete && styles.deleteLabel,
                  ]}>
                  {key.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  key: {
    flex: 1,
    height: 64,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
  },
  submitLabel: {
    color: '#ffffff',
  },
  deleteLabel: {
    fontSize: 24,
  },
});
