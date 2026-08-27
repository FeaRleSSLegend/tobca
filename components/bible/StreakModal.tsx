import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { WeekView } from './WeekView';
import { StatBox } from '../ui/StatBox';
import type { WeekDayStatus } from '../../utils/biblePlan.utils';
import { useSheetStyles, sheetStylesFor } from '../../constants/styles/sharedStyles';
import { PressableScale } from '../ui/motion';

interface WeekDay {
  day: string;
  status: WeekDayStatus;
}

interface StreakModalProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
  longestStreak: number;
  completedCount: number;
  /** Freezes banked, and the cap. Replaces the old "% of plan" stat. */
  freezes: number;
  maxFreezes: number;
  week: WeekDay[];
  todayNumber: number;
}

export const StreakModal = ({
  visible,
  onClose,
  streak,
  longestStreak,
  completedCount,
  freezes,
  maxFreezes,
  week,
  todayNumber,
}: StreakModalProps) => {
  const sheetStyles = useSheetStyles();
  const styles = useStyles();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={sheetStyles.scrim} onPress={onClose} accessibilityLabel="Close streak details" />

      {/* Bottom padding composes the safe-area inset in: with a fixed value,
          the stats row sat under the home indicator on gesture-bar devices. */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.xxl }]}>
        <View style={sheetStyles.handle} />

        <PressableScale
          onPress={onClose}
          containerStyle={sheetStyles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={c.graySecondary} />
        </PressableScale>

        <View style={styles.hero}>
          <View style={styles.flameCircle}>
            <Ionicons name="flame" size={36} color={c.pink} />
          </View>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.subtext}>
            {streak > 0 ? "You're building something — keep it going." : 'Read today to start a new streak.'}
          </Text>
          {/* Says what the freezes are FOR. The chip on the card shows the
              count; this is the one place with room to explain it, and it
              only appears when there is cover to explain. */}
          {freezes > 0 && (
            <Text style={styles.freezeNote}>
              {freezes === 1 ? 'One freeze banked' : `${freezes} freezes banked`} — miss a day and your streak survives.
            </Text>
          )}
        </View>

        <View style={styles.weekSection}>
          <Text style={styles.sectionLabel}>This Week</Text>
          <WeekView week={week} todayNumber={todayNumber} />
        </View>

        <View style={styles.statsRow}>
          <StatBox value={longestStreak} label="Best Streak" />
          <StatBox value={completedCount} label="Days Read" />
          {/* Was "N% Of Plan". Removed: across a 365-day plan that figure
              reads 0% or 1% for the first five weeks, so the streak sheet
              ended on the most discouraging number available. The freeze bank
              is the useful thing to know here instead — it answers "what
              happens if I miss tomorrow?", which is the actual question
              someone opening this sheet has. */}
          <StatBox value={`${freezes}/${maxFreezes}`} label="Freezes" />
        </View>
      </View>
    </Modal>
  );
};

const useStyles = makeThemedStyles((c) => ({
  // Scrim, handle and close button come from sheetStyles now. What stays local
  // is the POSITIONING, and it is load-bearing: the old scrim was a `flex: 1`
  // view whose job — undocumented — was to push this sheet to the bottom of
  // the screen. The shared scrim is absoluteFill, so it no longer pushes
  // anything, and without this the sheet rendered pinned to the TOP. Anchoring
  // it explicitly says what the layout depends on instead of relying on a
  // sibling's flex to imply it.
  sheet: {
    ...sheetStylesFor(c).sheet,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: c.pinkTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  streakNumber: {
    fontFamily: theme.fontFamily.display,
    fontSize: 40,
    fontWeight: '700',
    color: c.navy,
    lineHeight: 44,
  },
  streakLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: c.graySecondary,
    marginBottom: theme.spacing.sm,
  },
  subtext: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
    textAlign: 'center',
  },
  freezeNote: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.frost,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 19,
  },
  weekSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
}));