import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { PressableScale, PopIn } from '../ui/motion';
import { BrandLoader } from '../ui/BrandLoader';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

interface TodayCardProps {
  day: number;
  isRead: boolean;
  canMarkAsRead: boolean;
  onMarkAsRead: () => void;
  // Stored progress hasn't come back yet, so isRead/canMarkAsRead are not
  // answers — they're just their defaults. Rendering the button off those
  // means the card briefly claims "not read" for a day that IS read, then
  // flips. The loader holds that space until the truth arrives.
  loading?: boolean;
}

// NOTE: planProgress / completedCount used to live here, feeding a progress
// ring in the top-right corner. Both props and the ring are gone. See the
// header comment below for why.

// The Reading Plan hero, redesigned from a flat white status box into an
// immersive, editorial card in the spirit of the reference study-plan
// screens: a rich gradient surface (the app's brand pink→purple, used here
// as a genuine hero moment), a "Day N" chip in the corner like the "8 days"
// pills in the references, a large serif headline that gives the moment
// warmth, and a progress ring standing in for the reference's imagery-driven
// depth. It's the strongest thing on the screen without a photo library
// behind it — the gradient does the immersive work church-stock imagery
// would otherwise carry.
//
// THE PROGRESS RING IS GONE, deliberately.
// It began as "1% of plan", was softened to a raw day count, and neither
// belonged. This card sits directly above the streak, so whatever the ring
// showed was read as part of the streak — and a 365-day plan means that
// number spends its first month rounding to nothing, which is the single most
// discouraging thing the screen can say to a new reader. The streak card
// below already carries "N of 365 days read" as quiet context, in one place,
// at the right weight. Removing the ring also lets "Day N" sit alone on the
// top row, which is a cleaner corner than a chip fighting a dial.
export const TodayCard = ({ day, isRead, canMarkAsRead, onMarkAsRead, loading = false }: TodayCardProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={theme.gradient.colors}
        start={theme.gradient.start}
        end={theme.gradient.end}
        style={StyleSheet.absoluteFill}
      />
      {/* A soft dark scrim at the base so text stays legible over the
          brightest part of the gradient, the same scrim trick the reference
          hero cards use over their photography. */}
      <LinearGradient
        colors={['rgba(10,22,33,0)', 'rgba(10,22,33,0.35)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <View style={styles.dayChip}>
          <Ionicons name="calendar-outline" size={13} color={c.white} />
          <Text style={styles.dayChipText}>Day {day}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>TODAY'S PLAN</Text>
        <Text style={styles.headline}>
          {loading ? 'Your reading for today' : isRead ? "Today's reading complete" : 'Your reading for today'}
        </Text>
      </View>

      {loading ? (
        // Same 50pt height as the button and badge it stands in for, so the
        // card doesn't resize when the real state arrives.
        <View style={styles.loadingSlot}>
          {/* White, not brand pink/purple — the swooshes' own colours vanish
              against this card's pink→purple gradient. */}
          <BrandLoader width={132} tint={c.white} />
        </View>
      ) : !isRead ? (
        <>
          <PressableScale
            onPress={onMarkAsRead}
            disabled={!canMarkAsRead}
            style={[styles.markBtn, !canMarkAsRead && styles.markBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Mark today's reading as read"
          >
            <Ionicons
              name={canMarkAsRead ? 'checkmark-circle' : 'lock-closed'}
              size={18}
              // ENABLED: the glyph sits on the white pill, so it takes the
              // literal accent. DISABLED: the pill becomes a translucent wash
              // over the gradient, so the glyph is literal white instead. Two
              // different grounds, neither of which follows the theme.
              color={canMarkAsRead ? c.accentOnLight : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.markBtnText, !canMarkAsRead && styles.markBtnTextDisabled]}>
              Mark as Read
            </Text>
          </PressableScale>
          {!canMarkAsRead && (
            <Text style={styles.hint}>Open a reading below to unlock this</Text>
          )}
        </>
      ) : (
        // This badge only ever mounts at the moment the day is completed, so
        // a mount pop IS the confirmation of the action — no trigger needed.
        <PopIn style={styles.readBadge}>
          <Ionicons name="checkmark-circle" size={20} color={c.white} />
          <Text style={styles.readBadgeText}>Completed for today</Text>
        </PopIn>
      )}
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    overflow: 'hidden',
    // NO top margin. This card is the first thing under the screen title, and
    // sharedStyles.headerRow already ends with a 16pt paddingBottom — the 12
    // that used to be here landed on top of it for a 28pt gap, wider than any
    // other gap on the screen and for no stated reason. The header owns the
    // space beneath itself.
    marginTop: 0,
    // The gap to the streak card below. `related`, not `header`: these are two
    // cards in one group ("today"), so 16 sits deliberately between the 8 used
    // inside a card and the 24 that separates sections.
    marginBottom: theme.space.related,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
    backgroundColor: 'rgba(10,22,33,0.28)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.space.tight,
    borderRadius: theme.radius.full,
  },
  dayChipText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.white,
  },
  body: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: theme.space.tight,
  },
  headline: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 24,
    lineHeight: 30,
    color: c.white,
  },
  loadingSlot: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.white,
    borderRadius: theme.radius.full,
    height: 50,
  },
  markBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  // Same white-pill-on-a-gradient case as LiveCard's buttons, and it had the
  // same white-on-white failure in dark mode.
  markBtnText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.bodyLg,
    color: c.inkOnLight,
  },
  markBtnTextDisabled: {
    color: 'rgba(255,255,255,0.75)',
  },
  hint: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.radius.full,
  },
  readBadgeText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.bodyLg,
    color: c.white,
  },
}));
