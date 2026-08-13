// components/bible/StreakHero.tsx
// The streak, presented as an achievement rather than a statistic.
//
// WHY THIS REPLACED "4 Day Streak · 1% of plan"
// The maths was never wrong — verified across consecutive days, month and year
// rollovers, a DST boundary and a 23:59 read: 4/365 genuinely is 1.096%, which
// rounds to 1%. The failure was the UNIT. A percentage of a year-long plan
// spends its first five weeks rounding to 0% or 1%, so the number a new reader
// sees most often is the one that makes real effort look like nothing — and
// putting it next to a 4-day streak made the screen argue with itself.
//
// So the streak leads, at a size that reads as a score, and the week strip
// below it carries the evidence. Seven circles are legible in one glance and,
// unlike a percentage, they move visibly every single day. The day count still
// appears, but as quiet context underneath rather than as a rival headline.

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale, PopIn } from '../ui/motion';

export interface WeekDay {
  day: string;
  status: 'completed' | 'frozen' | 'today' | 'pending';
}

interface StreakHeroProps {
  streak: number;
  week: WeekDay[];
  completedCount: number;
  totalDays: number;
  /** Freezes currently banked, 0..MAX_FREEZES. */
  freezes: number;
  maxFreezes: number;
  onPress: () => void;
}

const DayCircle = ({ day, status }: WeekDay) => {
  const done = status === 'completed';
  const frozen = status === 'frozen';
  const today = status === 'today';

  return (
    <View style={styles.dayCol}>
      <View
        style={[
          styles.circle,
          done && styles.circleDone,
          // A frozen day is NOT a checkmark. It has to be legible as a
          // different kind of day at a glance — the streak survived, but
          // nothing was read — so it gets its own frost treatment rather than
          // borrowing the completed green. Claiming credit for a day that was
          // covered would make every green circle mean less.
          frozen && styles.circleFrozen,
          // Today is marked with a RING rather than a fill. A fill would read
          // as "done", which is exactly the wrong message on a day that is
          // still open — the ring says "you are here" without claiming credit.
          today && styles.circleToday,
        ]}
      >
        {done ? (
          <PopIn>
            <Ionicons name="checkmark" size={15} color={theme.colors.white} />
          </PopIn>
        ) : frozen ? (
          <Ionicons name="snow" size={14} color={theme.colors.frost} />
        ) : (
          <Text style={[styles.dayDot, today && styles.dayDotToday]}>·</Text>
        )}
      </View>
      <Text style={[styles.dayLabel, today && styles.dayLabelToday]}>{day}</Text>
    </View>
  );
};

export const StreakHero = ({ streak, week, completedCount, totalDays, freezes, maxFreezes, onPress }: StreakHeroProps) => {
  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        streak > 0 ? `${streak} day streak.` : 'No active streak.',
        `${completedCount} of ${totalDays} days read.`,
        `${freezes} of ${maxFreezes} streak freezes banked.`,
        'View streak details.',
      ].join(' ')}
    >
      <View style={styles.headRow}>
        <View style={styles.flame}>
          <Ionicons name="flame" size={22} color={theme.colors.pink} />
        </View>

        <View style={styles.numberBlock}>
          {/* Keyed on the value so the number REMOUNTS when it changes, which
              is what makes PopIn fire on every increment. Without the key it
              would animate once on first render and never again — and the one
              moment this should celebrate is the moment it goes up. */}
          {/* A dead streak is honest but "0" set at 40pt is the most
              demoralising thing this screen could say — it makes the number
              the headline precisely when the number is nothing. When the
              streak is broken the card switches to an invitation instead, and
              the week strip below still shows the days that WERE read, so no
              credit is hidden. */}
          {streak > 0 ? (
            <>
              <PopIn key={streak}>
                <Text style={styles.number}>{streak}</Text>
              </PopIn>
              <Text style={styles.numberLabel}>day streak</Text>
            </>
          ) : (
            <Text style={styles.restartLabel}>Start your streak today</Text>
          )}
        </View>

        {/* The freeze bank sits beside the streak, not under it: it is a
            property OF the streak (what is protecting it), and separating
            them would turn one fact into two competing ones. Muted frost
            against the pink flame so it reads as support, never as a rival
            headline — the app keeps a single accent. */}
        <View style={styles.freezeChip}>
          <Ionicons name="snow" size={14} color={theme.colors.frost} />
          <Text style={styles.freezeCount}>{freezes}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
      </View>

      <View style={styles.week}>
        {week.map((d, i) => (
          <DayCircle key={`${d.day}-${i}`} day={d.day} status={d.status} />
        ))}
      </View>

      <Text style={styles.context}>
        {completedCount} of {totalDays} days read
        {/* Only explained when the bank is not full, i.e. exactly when a
            reader might wonder where a freeze went. A permanent line of
            instructions would be noise on every other day. */}
        {freezes < maxFreezes ? `  ·  ${freezes === 0 ? 'No freezes left' : `${freezes} freeze left`}` : ''}
      </Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    // On the shared scale, and NOT larger than it: the SectionLabel below
    // already contributes its own section gap, so a big margin here stacked
    // with that one and opened a hole between the streak and Today's Reading.
    marginBottom: 0,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  flame: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,0,104,0.10)',
  },
  numberBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
  },
  // Big enough to read as a score. The skill's rule is to combine hierarchy
  // levers rather than multiply them, so this is LARGE but not also coloured —
  // the flame beside it carries the accent.
  number: {
    fontFamily: theme.fontFamily.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
    color: theme.colors.navy,
  },
  restartLabel: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.cardTitle,
    color: theme.colors.navy,
  },
  numberLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.graySecondary,
  },

  freezeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.micro,
    paddingHorizontal: theme.spacing.sm,
    height: 26,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.frostFill,
  },
  freezeCount: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.frost,
  },

  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
  },
  dayCol: {
    alignItems: 'center',
    gap: theme.space.tight,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
  },
  circleDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  circleFrozen: {
    backgroundColor: theme.colors.frostFill,
    borderColor: theme.colors.frostBorder,
  },
  circleToday: {
    borderWidth: 2,
    borderColor: theme.colors.pink,
    backgroundColor: theme.colors.surface,
  },
  dayDot: {
    fontSize: 18,
    lineHeight: 20,
    color: theme.colors.grayIcon,
  },
  dayDotToday: {
    color: theme.colors.pink,
  },
  dayLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: 11,
    color: theme.colors.grayIcon,
  },
  dayLabelToday: {
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.pink,
  },
  context: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.grayIcon,
    marginTop: theme.spacing.lg,
  },
});
