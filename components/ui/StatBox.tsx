import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { makeThemedStyles } from '../../hooks/useTheme';

interface StatBoxProps {
  value: string | number;
  label: string;
}

// One shared definition of "big number, small caption label underneath" —
// this pattern was previously hand-rolled separately in StatsBar and
// StreakModal, each with slightly different sizes. Consolidating it means
// one visual decision instead of several near-identical ones.
export const StatBox = ({ value, label }: StatBoxProps) => {
  const styles = useStyles();
  return (
    <View style={styles.box}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  box: {
    flex: 1,
    backgroundColor: c.bg,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  value: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    fontWeight: '700',
    color: c.navy,
  },
  label: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: theme.spacing.xs,
  },
}));
