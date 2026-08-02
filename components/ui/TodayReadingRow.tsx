import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { compactReference, estimateReadingMinutes } from '../../utils/referenceParser';

interface TodayReadingRowProps {
  day: number;
  // All four of the day's references, in reading order — the card shows
  // the whole day's shape, not just where it starts.
  references: string[];
  isDone: boolean;
  onPress: () => void;
}

// Home's bridge into the Bible Plan — redesigned from the flat icon-row
// version. What changed and why:
//   - "starts at Job 1-42" is gone. It was metadata restating the plan
//     (and its compaction was outright wrong on multi-book readings). The
//     line that replaced it answers the two questions someone deciding
//     whether to read NOW actually has: what's today's reading (all four
//     passages, compact) and how long will it take ("about 12 min" —
//     estimated from verse counts, no fetching). Time-to-read is the
//     single most persuasive fact for "can I fit this in before work."
//   - Subtle color: a 3pt brand-gradient keel along the left edge and a
//     gradient icon tile. Enough to lift the card out of the utility
//     register without competing with the two hero cards above it —
//     completing flips both to the success green, so the card itself
//     reports state at a glance.
//   - Clear action: an explicit pink "Read" affordance (matching the plan
//     carousel's own Read link) instead of an ambiguous bare chevron.
// Still deliberately NOT a streak display — the Plan tab owns that.
export const TodayReadingRow = ({ day, references, isDone, onPress }: TodayReadingRowProps) => {
  const passages = references.map(compactReference).join(' · ');
  const minutes = estimateReadingMinutes(references);

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={
        isDone
          ? `Today's reading, day ${day}, completed`
          : `Today's reading, day ${day}, about ${minutes} minutes: ${passages}`
      }
    >
      <LinearGradient
        colors={isDone ? [theme.colors.success, theme.colors.success] : theme.gradient.colors}
        start={theme.gradient.start}
        end={theme.gradient.end}
        style={styles.keel}
      />

      {isDone ? (
        <View style={[styles.iconTile, styles.iconTileDone]}>
          <Ionicons name="checkmark" size={20} color={theme.colors.white} />
        </View>
      ) : (
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={styles.iconTile}
        >
          <Ionicons name="book" size={18} color={theme.colors.white} />
        </LinearGradient>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Today's Reading</Text>
          <Text style={styles.dayTag}>Day {day}</Text>
        </View>
        <Text style={styles.passages} numberOfLines={1}>{passages}</Text>
        <Text style={styles.meta}>
          {isDone ? 'Completed for today' : `4 passages · about ${minutes} min`}
        </Text>
      </View>

      <View style={styles.action}>
        {isDone ? (
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
        ) : (
          <>
            <Text style={styles.actionText}>Read</Text>
            <Ionicons name="chevron-forward" size={15} color={theme.colors.pink} />
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.grayBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.md + 5, // clear the keel
    marginTop: theme.spacing.xl,
    overflow: 'hidden',
  },
  keel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileDone: {
    backgroundColor: theme.colors.success,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
  },
  dayTag: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: 10,
    color: theme.colors.graySecondary,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 1,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  passages: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.slate,
    marginTop: 2,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.pink,
  },
});
