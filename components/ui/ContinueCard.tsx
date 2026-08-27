// components/ui/ContinueCard.tsx
// Prayer's top slot: the recording you are part-way through, or — when there
// isn't one — an honest word about what is below.
//
// WHAT IT REPLACED, AND WHY THE LOOK CHANGED WITH IT
// This slot held a gradient "campaign card": a fixed eyebrow ("Prayer &
// Fasting"), a fixed title, a progress bar filled to "Day 8 of 21", and a
// "View Full Focus →" link that went nowhere. Every number in it was a literal
// in data/prayer.ts. It looked like a maintained content series and was in
// fact a picture of one.
//
// So the gradient did not come along. The app spends its gradient on ONE thing
// per screen and spends it on the moment that is genuinely the loudest — see
// the note in constants/theme. What sits here now is a resumable recording:
// specific, personal, and different every time, but not an announcement. A
// surface card with a real accent play button gives it the same footprint and
// the same top-of-page prominence without claiming to be a campaign.
//
// THE EMPTY STATE IS DELIBERATELY QUIET. On a fresh install there is nothing to
// resume, and the honest thing to render is a sentence pointing at the
// sections that do have content — not a placeholder shaped like a card that
// works.
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { PressableScale } from './motion';
import { formatClock } from '../../utils/audioGrouping';

interface ContinueCardProps {
  title: string;
  /** Speaker, series, or date — whatever the row itself would show. */
  subtitle?: string | null;
  positionSeconds: number;
  durationSeconds: number;
  onPress: () => void;
}

export const ContinueCard = ({
  title,
  subtitle,
  positionSeconds,
  durationSeconds,
  onPress,
}: ContinueCardProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  const pct =
    durationSeconds > 0
      ? Math.min(100, Math.max(0, (positionSeconds / durationSeconds) * 100))
      : 0;
  const remaining = Math.max(0, durationSeconds - positionSeconds);

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Resume ${title}, ${formatClock(remaining)} remaining`}
    >
      <Text style={styles.eyebrow}>Continue Listening</Text>

      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* The one piece of brand colour on the card, on the one control that
            does something. */}
        <View style={styles.playBtn}>
          <Ionicons name="play" size={20} color={c.white} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      {/* Both numbers, because either alone is ambiguous: "12:34" could be how
          far in or how far left. Only rendered when the duration is real — a
          record written before the player read the file header would otherwise
          print "0:00 of 0:00". */}
      {durationSeconds > 0 && (
        <Text style={styles.meta}>
          {formatClock(positionSeconds)} of {formatClock(durationSeconds)} ·{' '}
          {formatClock(remaining)} left
        </Text>
      )}
    </PressableScale>
  );
};

/**
 * Nothing in progress. Same slot, same card metrics, a fraction of the weight —
 * this is a state to pass over, not to read.
 */
export const ContinueCardEmpty = () => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
  <View style={[styles.card, styles.emptyCard]}>
    <View style={styles.emptyIcon}>
      <Ionicons name="headset-outline" size={18} color={c.grayIcon} />
    </View>
    <Text style={styles.emptyTitle}>Nothing in progress</Text>
    <Text style={styles.emptyBody}>
      Start a recording from Prayer Audio, or open one of the prayer guides
      below — whatever you leave part-way through comes back here.
    </Text>
  </View>
);
}

const useStyles = makeThemedStyles((c) => ({
  card: {
    // Matches the card the gradient hero occupied: same radius, same padding,
    // same zero top margin (headerRow's paddingBottom owns the gap above).
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginTop: 0,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.pink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: c.navy,
    lineHeight: 23,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
    marginTop: theme.space.micro,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: c.pink,
    alignItems: 'center',
    justifyContent: 'center',
    // Optical centring: a play triangle's visual mass sits left of its box.
    paddingLeft: 3,
  },
  progressTrack: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: c.grayBorder,
    overflow: 'hidden',
    marginTop: theme.spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: c.pink,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    marginTop: theme.space.tight,
  },

  // ---- empty ----
  emptyCard: {
    alignItems: 'flex-start',
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: c.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.displaySemibold,
    fontSize: theme.fontSize.cardTitle,
    color: c.navy,
    marginBottom: theme.space.micro,
  },
  emptyBody: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
    lineHeight: 19,
  },
}));
