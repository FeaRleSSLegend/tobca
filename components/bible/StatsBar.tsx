import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface StatsBarProps {
  streak: number;
  completed: number;
  percentage: number;
}

export const StatsBar = ({ streak, completed, percentage }: StatsBarProps) => {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.box}>
          <Text style={styles.num}>{streak}</Text>
          <Text style={styles.label}>Streak</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.num}>{completed}</Text>
          <Text style={styles.label}>Done</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.num}>{percentage}%</Text>
          <Text style={styles.label}>Of Plan</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  box: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  num: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    fontWeight: '700',
    color: theme.colors.navy,
  },
  label: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.03,
    marginTop: theme.spacing.xs,
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.pink,
    borderRadius: theme.radius.full,
  },
});