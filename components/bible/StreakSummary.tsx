import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '../ui/motion';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface StreakSummaryProps {
  streak: number;
  percentage: number;
  onPress: () => void;
}

// Compact by design — this used to be three separate stat boxes plus a
// standalone week strip, taking up a lot of vertical space for something
// that's secondary to the actual reading. A big streak hero belongs on a
// home/dashboard screen; here it just needs to be visible enough to feel
// good and tappable enough to dig into.
export const StreakSummary = ({ streak, percentage, onPress }: StreakSummaryProps) => {
  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.flameWrap}>
        <Ionicons name="flame" size={20} color={theme.colors.pink} />
      </View>

      <View style={styles.streakText}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.progressSection}>
        <View style={styles.track}>
          <LinearGradient
            colors={theme.gradient.colors}
            start={theme.gradient.start}
            end={theme.gradient.end}
            style={[styles.fill, { width: `${Math.max(percentage, 2)}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>{percentage}% of plan</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  // No card chrome here on purpose — TodayCard above is the bordered,
  // contained element on this screen; this is secondary status info and
  // reads more calmly sitting directly on the page than boxed up to match.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  flameWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: '#FFE4EE', // light pink tint — same family as theme.colors.pink
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    alignItems: 'flex-start',
  },
  streakNumber: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    fontWeight: '700',
    color: theme.colors.navy,
    lineHeight: 22,
  },
  streakLabel: {
    fontFamily: theme.fontFamily.body,
    fontSize: 11,
    color: theme.colors.graySecondary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.grayBorder,
  },
  progressSection: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  progressLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: 11,
    color: theme.colors.graySecondary,
  },
});