import { View, StyleSheet } from 'react-native';
import { DayChip } from './DayChip';
import { theme } from '../../constants/theme';
import type { WeekDayStatus } from '../../utils/biblePlan.utils';

interface WeekDay {
  day: string;
  status: WeekDayStatus;
}

interface WeekViewProps {
  week: WeekDay[];
  todayNumber?: number;
}

export const WeekView = ({ week, todayNumber }: WeekViewProps) => {
  return (
    <View style={styles.container}>
      {week.map((day, index) => (
        <DayChip 
          key={index}
          day={day.day}
          dayNumber={day.status === 'today' ? todayNumber : undefined}
          status={day.status}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
});