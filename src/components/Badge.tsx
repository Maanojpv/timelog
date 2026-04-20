import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type BadgeType = 'fixed' | 'hourly' | 'non-billable' | 'paid' | 'partial' | 'pending';

interface Props {
  type: BadgeType;
  label?: string;
}

const config: Record<BadgeType, { bg: string; text: string; border: string; defaultLabel: string }> = {
  fixed: { bg: colors.amber + '2E', text: colors.amber, border: colors.amber + '40', defaultLabel: 'Fixed' },
  hourly: { bg: colors.teal + '2E', text: colors.teal, border: colors.teal + '40', defaultLabel: 'Hourly' },
  'non-billable': { bg: colors.muted + '20', text: colors.muted, border: colors.muted + '40', defaultLabel: 'Non-billable' },
  paid: { bg: colors.green + '2E', text: colors.green, border: colors.green + '40', defaultLabel: 'Paid' },
  partial: { bg: colors.amber + '2E', text: colors.amber, border: colors.amber + '40', defaultLabel: 'Partial' },
  pending: { bg: colors.red + '2E', text: colors.red, border: colors.red + '40', defaultLabel: 'Pending' },
};

const Badge = React.memo(({ type, label }: Props) => {
  const c = config[type];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.text, { color: c.text }]}>{label ?? c.defaultLabel}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});

export default Badge;
