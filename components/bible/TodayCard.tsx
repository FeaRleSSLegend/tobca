import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { PressableScale, PopIn } from '../ui/motion';

interface TodayCardProps {
  day: number;
  isRead: boolean;
  canMarkAsRead: boolean;
  onMarkAsRead: () => void;
  // Overall plan completion 0..1, drawn as a ring — turns the hero into a
  // quiet progress indicator, the way the reference cards carry a "days" chip.
  planProgress?: number;
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
export const TodayCard = ({ day, isRead, canMarkAsRead, onMarkAsRead, planProgress = 0 }: TodayCardProps) => {
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
        <ProgressRing progress={planProgress} />
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>TODAY'S PLAN</Text>
        <Text style={styles.headline}>
          {isRead ? "Today's reading complete" : 'Your reading for today'}
        </Text>
      </View>

      {!isRead ? (
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

function ProgressRing({ progress }: { progress: number }) {
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
        <Text style={styles.ringText}>{Math.round(clamped * 100)}%</Text>
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
  ringText: { fontFamily: theme.fontFamily.bodyBold, fontSize: 10, color: theme.colors.white },
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
