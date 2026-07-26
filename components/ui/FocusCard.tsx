import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { PrayerFocus } from '../../data/prayer';

interface FocusCardProps {
  focus: PrayerFocus;
  onPress?: () => void;
}

// Same move as CurrentMessageCard on Library: this was a flat navy panel
// with a thin gradient strip glued to the top as decoration. Prayer's one
// hero moment should spend the same bold-color budget Library's does —
// gradient IS the card now, so the strip (which only existed to give the
// navy card a token touch of brand color) is gone.
export const FocusCard = ({ focus, onPress }: FocusCardProps) => {
  const hasFast = focus.currentDay !== undefined && focus.totalDays !== undefined;
  const progressPct = hasFast ? (focus.currentDay! / focus.totalDays!) * 100 : 0;

  return (
    <LinearGradient
      colors={theme.gradient.colors}
      start={theme.gradient.start}
      end={theme.gradient.end}
      style={styles.card}
    >
      <Text style={styles.eyebrow}>Prayer & Fasting</Text>
      <Text style={styles.title}>{focus.title}</Text>
      <Text style={styles.description}>{focus.description}</Text>

      {hasFast && (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            {/* Solid white fill, not a second gradient — a gradient-on-
                gradient fill would barely register against this background.
                White is also exactly how the site cuts through its own pink
                panels (see the "Learn More" / "Stream on Demand" buttons). */}
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>Day {focus.currentDay} of {focus.totalDays}</Text>
        </View>
      )}

      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={styles.link}>View Full Focus →</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
  },
  progressText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
  },
  link: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
    textDecorationLine: 'underline',
  },
});
