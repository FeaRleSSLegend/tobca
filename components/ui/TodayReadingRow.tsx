import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface TodayReadingRowProps {
  day: number;
  // First reference of the day, e.g. "Genesis 1:1-31, 2:1-25" — shown at
  // chapter level so the row stays one line.
  oldTestament: string;
  isDone: boolean;
  onPress: () => void;
}

// Home's bridge into the Bible Plan. A Bible app's home screen that never
// mentions today's reading is missing its most obvious daily action — but
// the FULL reading card was deliberately cut from Home before (it
// duplicated the whole Plan tab), so this is the slim version: one row,
// one line of orientation, one tap through. Deliberately NOT a streak
// display or a second progress UI — the Plan tab owns those; this only
// answers "have I read today, and where do I go to do it."
export const TodayReadingRow = ({ day, oldTestament, isDone, onPress }: TodayReadingRowProps) => {
  // "Genesis 1:1-31, 2:1-25" → "Genesis 1-2": chapter-level is enough to
  // orient ("oh, we're in Genesis") without verse noise on a one-liner.
  const compact = compactChapters(oldTestament);

  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={
        isDone
          ? `Today's reading, day ${day}, completed`
          : `Today's reading, day ${day}, starts at ${compact}`
      }
    >
      <View style={[styles.iconCircle, isDone && styles.iconCircleDone]}>
        <Ionicons
          name={isDone ? 'checkmark' : 'book-outline'}
          size={18}
          color={isDone ? theme.colors.white : theme.colors.navy}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Today's Reading</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {isDone ? `Day ${day} complete` : `Day ${day} · starts at ${compact}`}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
    </Pressable>
  );
};

function compactChapters(reference: string): string {
  const parts = reference.split(',').map((p) => p.trim());
  const first = parts[0]?.match(/^(.*?)\s+(\d+):/);
  if (!first) return reference;
  const book = first[1];
  const chapters = parts
    .map((p) => {
      const m = p.match(/(\d+):/);
      return m ? Number(m[1]) : null;
    })
    .filter((n): n is number => n !== null);
  if (chapters.length === 0) return reference;
  const min = Math.min(...chapters);
  const max = Math.max(...chapters);
  return min === max ? `${book} ${min}` : `${book} ${min}-${max}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.grayBorder,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.xl,
    minHeight: 60,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDone: {
    backgroundColor: theme.colors.success,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: 1,
  },
});
