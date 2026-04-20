import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatMoney } from '../utils/calculations';

interface Props {
  label: string;
  value: string | number;
  accentColor: string;
  isMoney?: boolean;
  isLast?: boolean;
  currencySymbol?: string;
}

const StatCard = React.memo(({ label, value, accentColor, isMoney, isLast, currencySymbol = '$' }: Props) => {
  const displayValue = isMoney && typeof value === 'number'
    ? formatMoney(value, currencySymbol)
    : String(value);

  return (
    <View style={[styles.card, { borderTopColor: accentColor }, !isLast && styles.borderRight]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{displayValue}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderTopWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontFamily: 'Inter_500Medium',
  },
});

export default StatCard;
