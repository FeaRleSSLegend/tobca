import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { Shimmer } from './motion';

/**
 * Skeleton placeholders shaped like the real content, per the perceived-
 * performance guidance: a skeleton that matches the final layout means
 * nothing jumps when real data arrives, unlike a centered spinner that
 * gets replaced by a completely different shape.
 *
 * These now animate — each Box is a Shimmer (a highlight sweeping across a
 * gray base), which is what tells a user "this is loading" rather than "this
 * is broken/empty". The sweep is deliberately low-contrast and slow (1.2s)
 * so it reads as a calm sheen, not a strobe. Because the real bottleneck
 * turned out to be image loads (5-8s), these matter: they hold a believable
 * shape for the whole wait instead of a blank frame.
 *
 * A Box takes an explicit width where the sweep needs to know how far to
 * travel; percentage-width boxes pass a reasonable pixel estimate.
 */

const Box = ({ style, width }: { style?: object; width?: number }) => (
  <Shimmer style={[styles.box, style]} width={width} />
);

// Stand-in for a vertical list of MessageCard rows (Services / Recently Added).
export const SkeletonList = ({ rows = 4 }: { rows?: number }) => (
  <View style={styles.listWrap} accessibilityLabel="Loading content">
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={styles.row}>
        <Box style={styles.rowThumb} width={72} />
        <View style={styles.rowBody}>
          <Box style={styles.rowLineWide} width={240} />
          <Box style={styles.rowLineNarrow} width={140} />
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
        <Box style={styles.tileThumb} width={170} />
        <Box style={styles.rowLineWide} width={150} />
        <Box style={styles.rowLineNarrow} width={90} />
      </View>
    ))}
  </View>
);

// Stand-in for a horizontal preview row on the Library hub (poster cards).
export const SkeletonRow = ({ cards = 3 }: { cards?: number }) => (
  <View style={styles.hRow} accessibilityLabel="Loading content">
    {Array.from({ length: cards }).map((_, i) => (
      <View key={i} style={styles.poster}>
        <Box style={styles.posterThumb} width={148} />
        <Box style={styles.rowLineWide} width={120} />
        <Box style={styles.rowLineNarrow} width={70} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
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
  hRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
  },
  poster: {
    width: 148,
    gap: theme.spacing.sm,
  },
  posterThumb: {
    width: 148,
    height: 96,
  },
});
