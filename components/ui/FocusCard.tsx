import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { PrayerFocus } from '../../data/prayer';

interface FocusCardProps {
  focus: PrayerFocus;
  onPress?: () => void;
}

export const FocusCard = ({ focus, onPress }: FocusCardProps) => {
  const hasFast = focus.currentDay !== undefined && focus.totalDays !== undefined;
  const progressPct = hasFast ? (focus.currentDay! / focus.totalDays!) * 100 : 0;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={theme.gradient.colors}
        start={theme.gradient.start}
        end={theme.gradient.end}
        style={styles.topBar}
      />

      <Text style={styles.eyebrow}>Prayer & Fasting</Text>
      <Text style={styles.title}>{focus.title}</Text>
      <Text style={styles.description}>{focus.description}</Text>

      {hasFast && (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={theme.gradient.colors}
              start={theme.gradient.start}
              end={theme.gradient.end}
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
          <Text style={styles.progressText}>Day {focus.currentDay} of {focus.totalDays}</Text>
        </View>
      )}

      <Pressable onPress={onPress}>
        <Text style={styles.link}>View Full Focus →</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.navy,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
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
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  progressText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  link: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
  },
});