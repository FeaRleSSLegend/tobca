import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import type { WeekDayStatus } from '../../utils/biblePlan.utils';

interface DayChipProps {
  day: string;
  dayNumber?: number;
  status: WeekDayStatus;
}

export const DayChip = ({ day, dayNumber, status }: DayChipProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <View style={styles.chip}>
      <View style={[
        styles.circle,
        status === 'completed' && styles.circleCompleted,
        status === 'frozen' && styles.circleFrozen,
        status === 'today' && styles.circleToday,
      ]}>
        {status === 'completed' && (
          <Ionicons name="checkmark" size={14} color={c.white} />
        )}
        {/* A snowflake, never a checkmark: the day was protected, not read. */}
        {status === 'frozen' && (
          <Ionicons name="snow" size={16} color={c.frost} />
        )}
        {status === 'today' && dayNumber && (
          <Text style={styles.todayText}>{dayNumber}</Text>
        )}
        {status === 'pending' && (
          <View style={styles.pendingDot} />
        )}
      </View>
      <Text style={[
        styles.label,
        status === 'today' && styles.labelToday
      ]}>
        {day}
      </Text>
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  chip: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: c.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  circleCompleted: {
    backgroundColor: c.navy,
  },
  circleFrozen: {
    backgroundColor: c.frostFill,
  },
  circleToday: {
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: c.pink,
  },
  todayText: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: c.navy,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.grayIcon,
  },
  label: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
  labelToday: {
    color: c.navy,
  },
}));