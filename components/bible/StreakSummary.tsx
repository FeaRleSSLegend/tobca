import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '../ui/motion';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

interface StreakSummaryProps {
  streak: number;
  percentage: number;
  /** Days actually read, and the plan's length — see the note below. */
  completedCount: number;
  totalDays: number;
  onPress: () => void;
}

// Compact by design — this used to be three separate stat boxes plus a
// standalone week strip, taking up a lot of vertical space for something
// that's secondary to the actual reading. A big streak hero belongs on a
// home/dashboard screen; here it just needs to be visible enough to feel
// good and tappable enough to dig into.
// A NOTE ON THE NUMBER SHOWN
// This used to read "1% of plan" beside "4 Day Streak", which looks like a
// contradiction and is actually just arithmetic: 4/365 = 1.096%, rounded. The
// maths was verified correct — both figures read from the same completedDays
// array — but a percentage is the wrong unit for a year-long plan. Early on it
// rounds every real day of effort down to 0% or 1%, so the number a reader is
// most likely to see is the one that makes four days of work look like nothing.
//
// "4 of 365 days" carries the same fact and counts UP: every day read moves a
// number that visibly changes, instead of one that will sit on "1%" for another
// fortnight. The gradient bar still encodes the true proportion, so the honest
// smallness of early progress is not hidden — just not the headline.
export const StreakSummary = ({ streak, percentage, completedCount, totalDays, onPress }: StreakSummaryProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={styles.flameWrap}>
        <Ionicons name="flame" size={20} color={c.pink} />
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
        <Text style={styles.progressLabel}>{completedCount} of {totalDays} days</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.grayIcon} />
    </PressableScale>
  );
};

const useStyles = makeThemedStyles((c) => ({
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
    backgroundColor: c.pinkTint,
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
    color: c.navy,
    lineHeight: 22,
  },
  streakLabel: {
    fontFamily: theme.fontFamily.body,
    fontSize: 11,
    color: c.graySecondary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: c.grayBorder,
  },
  progressSection: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  track: {
    height: 6,
    backgroundColor: c.grayBorder,
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
    color: c.graySecondary,
  },
}));