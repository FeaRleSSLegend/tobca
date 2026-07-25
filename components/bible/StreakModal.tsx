import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { WeekView } from './WeekView';
import { StatBox } from '../ui/StatBox';

interface WeekDay {
  day: string;
  status: 'completed' | 'today' | 'pending';
}

interface StreakModalProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
  longestStreak: number;
  completedCount: number;
  percentage: number;
  week: WeekDay[];
  todayNumber: number;
}

export const StreakModal = ({
  visible,
  onClose,
  streak,
  longestStreak,
  completedCount,
  percentage,
  week,
  todayNumber,
}: StreakModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.colors.graySecondary} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.flameCircle}>
            <Ionicons name="flame" size={36} color={theme.colors.pink} />
          </View>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.subtext}>
            {streak > 0 ? "You're building something — keep it going." : 'Read today to start a new streak.'}
          </Text>
        </View>

        <View style={styles.weekSection}>
          <Text style={styles.sectionLabel}>This Week</Text>
          <WeekView week={week} todayNumber={todayNumber} />
        </View>

        <View style={styles.statsRow}>
          <StatBox value={longestStreak} label="Best Streak" />
          <StatBox value={completedCount} label="Days Read" />
          <StatBox value={`${percentage}%`} label="Of Plan" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 33, 0.4)', // theme.colors.black at low opacity
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.grayBorder,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.layout.screenPadding,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  flameCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    backgroundColor: '#FFE4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  streakNumber: {
    fontFamily: theme.fontFamily.display,
    fontSize: 40,
    fontWeight: '700',
    color: theme.colors.navy,
    lineHeight: 44,
  },
  streakLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.graySecondary,
    marginBottom: theme.spacing.sm,
  },
  subtext: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
  },
  weekSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});