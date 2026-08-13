import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { PressableScale, PopIn } from '../ui/motion';
import { BrandLoader } from '../ui/BrandLoader';

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
  // Overall plan completion 0..1, drawn as a ring — turns the hero into a
  // quiet progress indicator, the way the reference cards carry a "days" chip.
  planProgress?: number;
  /** Days read, shown in the ring instead of a percentage. See note below. */
  completedCount?: number;
}

// The Reading Plan hero, redesigned from a flat white status box into an
// immersive, editorial card in the spirit of the reference study-plan
// screens: a rich gradient surface (the app's brand pink→purple, used here
// as a genuine hero moment), a "Day N" chip in the corner like the "8 days"
// pills in the references, a large serif headline that gives the moment
// warmth, and a progress ring standing in for the reference's imagery-driven
// depth. It's the strongest thing on the screen without a photo library
// behind it — the gradient does the immersive work church-stock imagery
// would otherwise carry.
export const TodayCard = ({ day, isRead, canMarkAsRead, onMarkAsRead, planProgress = 0, completedCount = 0, loading = false }: TodayCardProps) => {
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
          <Ionicons name="calendar-outline" size={13} color={theme.colors.white} />
          <Text style={styles.dayChipText}>Day {day}</Text>
        </View>
        <ProgressRing progress={planProgress} label={`${completedCount}`} />
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
          <BrandLoader width={132} tint={theme.colors.white} />
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
              color={canMarkAsRead ? theme.colors.pink : 'rgba(255,255,255,0.6)'}
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
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
          <Text style={styles.readBadgeText}>Completed for today</Text>
        </PopIn>
      )}
    </View>
  );
};

function ProgressRing({ progress, label }: { progress: number; label: string }) {
  const size = 44;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={theme.colors.white} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c * clamped} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringInner}>
        {/* The COUNT, not the percentage. Removing "1% of plan" from the
            streak card while leaving "1%" in this ring directly above it would
            have moved the discouraging number rather than fixed it — and the
            two sat within a hundred points of each other on screen. The arc
            still encodes the true proportion; the label counts up. */}
        <Text style={styles.ringText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    gap: 6,
    backgroundColor: 'rgba(10,22,33,0.28)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
  },
  dayChipText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
  },
  ringInner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  // 10 -> 14: "1%" needed the room, a 1-3 digit count does not, and at 10pt
  // inside a 44pt ring the label was the smallest type on the screen.
  ringText: { fontFamily: theme.fontFamily.bodyBold, fontSize: 14, color: theme.colors.white },
  body: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  headline: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 24,
    lineHeight: 30,
    color: theme.colors.white,
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.full,
    height: 50,
  },
  markBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  markBtnText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
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
    color: theme.colors.white,
  },
});
