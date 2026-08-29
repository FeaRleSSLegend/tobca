import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { SmartImage } from './SmartImage';
import { PressableScale } from './motion';

interface SeriesListRowProps {
  title: string;
  count: number;
  thumbnail?: string;
  isOngoing: boolean;
  index?: number; // 1-based position, shown as a quiet ordinal
  onPress: () => void;
}

// A series row: large landscape artwork that anchors it, a readable title
// with real breathing room, and a metadata line.
//
// THE ACCENT RAIL IS GONE. A 4pt coloured stripe down the left edge of every
// card is a decoration standing in for information — it encoded exactly one
// bit (ongoing or not) using the app's loudest colour, repeated down the whole
// list, which is why it read as generic. It also duplicated the status dot and
// the word "Ongoing" sitting two lines away, so the same bit was being said
// three times.
//
// Status is now said ONCE, as a small text badge, and only when it is
// actually true. "Ongoing" is the exceptional state and earns a mark;
// "Complete" is the default state of almost every series in the archive and
// does not need one — a badge on every row is a badge on no row. That follows
// the same rule the rest of the app's chrome uses (see the note on `gradient`
// in constants/theme.ts): the accent marks the exception, it is not
// wallpaper.
export const SeriesListRow = ({ title, count, thumbnail, isOngoing, index, onPress }: SeriesListRowProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <PressableScale
      style={styles.row}
      onPress={onPress}
      activeScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} message${count === 1 ? '' : 's'}, ${isOngoing ? 'ongoing' : 'completed'}`}
    >
      <View style={styles.artwork}>
        <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
        <View style={styles.countPill}>
          <Ionicons name="albums" size={11} color={c.white} />
          <Text style={styles.countPillText}>{count}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {index != null && <Text style={styles.ordinal}>SERIES {String(index).padStart(2, '0')}</Text>}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.metaRow}>
          {/* Only the exception is marked. A series that has concluded simply
              shows its message count, which is the useful fact about it. */}
          {isOngoing && (
            <View style={styles.ongoingBadge}>
              <Text style={styles.ongoingBadgeText}>ONGOING</Text>
            </View>
          )}
          <Text style={styles.countText}>{count} message{count === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.grayIcon} style={styles.chevron} />
    </PressableScale>
  );
};

const useStyles = makeThemedStyles((c) => ({
  row: {
    flexDirection: 'row',
    // 'center', not 'stretch': stretch existed so the rail could run the full
    // height of the card. With the rail gone it only made the chevron and
    // artwork fight over vertical alignment.
    alignItems: 'center',
    backgroundColor: c.surface,
    borderColor: c.grayBorder,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  artwork: {
    width: 116,
    height: 100,
    backgroundColor: c.grayBorder,
    margin: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  countPill: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.micro,
    paddingHorizontal: theme.space.tight,
    paddingVertical: theme.space.micro,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(10,22,33,0.62)',
  },
  countPillText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 11,
    color: c.white,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    gap: 4,
  },
  ordinal: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: c.grayIcon,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: 17,
    lineHeight: 22,
    color: c.navy,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
    marginTop: theme.space.hairline,
  },
  // A small tinted badge, not a filled pill: it labels a state, it is not a
  // control, and a solid accent block here would out-shout the title above it.
  ongoingBadge: {
    paddingHorizontal: theme.space.tight,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: c.accentTint,
  },
  ongoingBadgeText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: c.accent,
  },
  countText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: theme.spacing.md,
  },
}));
