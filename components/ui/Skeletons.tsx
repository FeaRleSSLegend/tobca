import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * Skeleton placeholders shaped like the real content, per the perceived-
 * performance guidance: a skeleton that matches the final layout means
 * nothing jumps when real data arrives, unlike a centered spinner that
 * gets replaced by a completely different shape.
 *
 * Deliberately static (no shimmer animation) — this is a prototype, the
 * lists these stand in for resolve in well under a second from cache, and
 * an Animated shimmer loop is exactly the kind of polish that can wait
 * until there's a real reason for it.
 */

const Box = ({ style }: { style?: object }) => <View style={[styles.box, style]} />;

// Stand-in for a vertical list of MessageCard rows (Services / Recently Added).
export const SkeletonList = ({ rows = 4 }: { rows?: number }) => (
  <View style={styles.listWrap} accessibilityLabel="Loading content">
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={styles.row}>
        <Box style={styles.rowThumb} />
        <View style={styles.rowBody}>
          <Box style={styles.rowLineWide} />
          <Box style={styles.rowLineNarrow} />
        </View>
      </View>
    ))}
  </View>
);

// Stand-in for a 2-column tile grid (Series) or circle grid (Playlists).
export const SkeletonGrid = ({ tiles = 4 }: { tiles?: number }) => (
  <View style={styles.gridWrap} accessibilityLabel="Loading content">
    {Array.from({ length: tiles }).map((_, i) => (
      <View key={i} style={styles.tile}>
        <Box style={styles.tileThumb} />
        <Box style={styles.rowLineWide} />
        <Box style={styles.rowLineNarrow} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
  },
  listWrap: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  rowThumb: {
    width: 72,
    height: 72,
  },
  rowBody: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  rowLineWide: {
    height: 12,
    width: '85%',
  },
  rowLineNarrow: {
    height: 10,
    width: '50%',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
  },
  tile: {
    width: '47%',
    gap: theme.spacing.sm,
  },
  tileThumb: {
    height: 96,
    width: '100%',
  },
});
