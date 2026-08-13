import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
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

// A premium, editorial series row. This is NOT the old grid tile reflowed —
// it's built around how someone actually decides what teaching to commit
// to: a large landscape artwork that anchors the row, a big readable title
// with real breathing room, and a clear metadata line. A left accent rail
// (pink for ongoing, quiet grey for completed) gives the list visual rhythm
// and lets the eye scan status without reading a word. The whole row reads
// like a chapter in a library, not a thumbnail to click.
export const SeriesListRow = ({ title, count, thumbnail, isOngoing, index, onPress }: SeriesListRowProps) => {
  return (
    <PressableScale
      style={styles.row}
      onPress={onPress}
      activeScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} message${count === 1 ? '' : 's'}, ${isOngoing ? 'ongoing' : 'completed'}`}
    >
      {/* Accent rail — instant status read, and the thing that gives the
          vertical list rhythm instead of a wall of identical cards. */}
      <View style={[styles.rail, { backgroundColor: isOngoing ? theme.colors.pink : theme.colors.grayBorder }]} />

      <View style={styles.artwork}>
        <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
        <View style={styles.countPill}>
          <Ionicons name="albums" size={11} color={theme.colors.white} />
          <Text style={styles.countPillText}>{count}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {index != null && <Text style={styles.ordinal}>SERIES {String(index).padStart(2, '0')}</Text>}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.statusDot, { backgroundColor: isOngoing ? theme.colors.success : theme.colors.grayIcon }]} />
          <Text style={styles.statusText}>{isOngoing ? 'Ongoing' : 'Complete'}</Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.countText}>{count} message{count === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} style={styles.chevron} />
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.grayBorder,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  rail: {
    width: 4,
  },
  artwork: {
    width: 116,
    height: 100,
    backgroundColor: theme.colors.grayBorder,
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
    color: theme.colors.white,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
    gap: 4,
  },
  ordinal: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: theme.colors.grayIcon,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.navy,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
    marginTop: theme.space.hairline,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.slate,
  },
  metaDivider: {
    color: theme.colors.grayIcon,
    fontSize: theme.fontSize.caption,
  },
  countText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: theme.spacing.md,
  },
});
