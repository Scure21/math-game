import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function InputDisplay({ value }: { value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.inputBox, { borderBottomColor: theme.backgroundSelected }]}>
      <ThemedText style={styles.inputValue}>{value === '' ? ' ' : value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
