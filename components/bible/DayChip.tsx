import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface DayChipProps {
  day: string;
  dayNumber?: number;
  status: 'completed' | 'today' | 'pending';
}

export const DayChip = ({ day, dayNumber, status }: DayChipProps) => {
  return (
    <View style={styles.chip}>
      <View style={[
        styles.circle,
        status === 'completed' && styles.circleCompleted,
        status === 'today' && styles.circleToday,
      ]}>
        {status === 'completed' && (
          <Ionicons name="checkmark" size={14} color={theme.colors.white} />
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

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  circleCompleted: {
    backgroundColor: theme.colors.navy,
  },
  circleToday: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.pink,
  },
  todayText: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.navy,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.grayIcon,
  },
  label: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  labelToday: {
    color: theme.colors.navy,
  },
});