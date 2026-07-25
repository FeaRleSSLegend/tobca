import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <Pressable onPress={onPress} style={styles.card}>
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
          <View style={[styles.fill, { width: `${Math.max(percentage, 2)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{percentage}% of plan</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    backgroundColor: theme.colors.pink,
    borderRadius: theme.radius.full,
  },
  progressLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: 11,
    color: theme.colors.graySecondary,
  },
});