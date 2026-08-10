// components/ui/BranchFilter.tsx
// The branch switcher: "All | Ikeja | Wuse 2".
//
// A pill row, not a tab. Per the architecture note in data/branches.ts, branch
// is an ATTRIBUTE of content rather than a top-level split — two branches are
// one church, not two apps — so switching branch narrows what the existing
// screen shows instead of navigating somewhere else.
//
// It renders NOTHING when only one branch exists. A control with a single real
// choice is just clutter that has to be read and dismissed, and it also means
// this can stay mounted permanently: the day Wuse 2's channel id lands, the
// filter appears on its own with no screen edited.

import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { branches } from '../../data/branches';
import { FilterPill } from './FilterPill';
import type { BranchFilter as BranchFilterValue } from '../../hooks/useMessages';

interface BranchFilterProps {
  value: BranchFilterValue;
  onChange: (next: BranchFilterValue) => void;
}

export const BranchFilter = ({ value, onChange }: BranchFilterProps) => {
  if (branches.length < 2) return null;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      <FilterPill label="All" isActive={value === 'all'} onPress={() => onChange('all')} />
      {branches.map((b) => (
        <FilterPill
          key={b.id}
          label={b.shortName}
          isActive={value === b.id}
          onPress={() => onChange(b.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});
