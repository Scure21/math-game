import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

export function ChoicePills({
  choices,
  onPick,
  disabled,
}: {
  choices: number[];
  onPick: (choice: number) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {choices.map((choice) => (
        <Pressable
          key={choice}
          onPress={() => !disabled && onPick(choice)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
              opacity: disabled ? 0.4 : 1,
            },
          ]}>
          <ThemedText style={styles.label}>{choice}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  pill: {
    flex: 1,
    minHeight: 80,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
});
