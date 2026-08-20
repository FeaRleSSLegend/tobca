import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
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

// Stand-in for a horizontal preview row on the Library hub.
//
// A REAL SHELF IS TWO THINGS, AND SO IS THIS.
// Every shelf on the hub is `<SectionLabel/> + <HScroll/>`, and ALL of the
// vertical rhythm around it lives on the label: sharedStyles.sectionHeaderRow
// carries marginTop 24 (section to section) and marginBottom 12 (header to its
// own content). HScroll contributes nothing vertically, and neither did this
// skeleton — it was only ever the poster row.
//
// That is why the loading state read as one joined block: the hero skeleton
// has no bottom margin (the real hero has none either), and with no label
// standing in between, the first poster row started at the hero's bottom edge
// with 0pt of separation. The gap was never missing from the cards; it was
// missing along with the label that owns it.
//
// So the label placeholder is part of the shelf skeleton, and it reuses
// sectionHeaderRow itself rather than restating 24/12 here — one source for
// the rhythm means the skeleton cannot drift from the real layout later.
export const SkeletonRow = ({ cards = 3 }: { cards?: number }) => (
  <View accessibilityLabel="Loading content">
    <View style={sharedStyles.sectionHeaderRow}>
      <Box style={styles.labelLine} width={110} />
    </View>
    <View style={styles.hRow}>
      {Array.from({ length: cards }).map((_, i) => (
        <View key={i} style={styles.poster}>
          <Box style={styles.posterThumb} width={148} />
          <Box style={styles.rowLineWide} width={120} />
          <Box style={styles.rowLineNarrow} width={70} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  // NO padding of its own. Every one of these skeletons is rendered inside a
  // container that ALREADY applies screenPadding (sharedStyles.container on
  // Live/Library, scrollContent on Search, listContent on See-all), so the
  // 16pt this used to add made the loading state inset 32 while the real
  // content it stands in for is inset 16 — a 16pt sideways jump at the exact
  // moment data lands, which is precisely what a skeleton exists to prevent.
  // Same for paddingTop, which stacked on SectionLabel's 12pt bottom margin.
  listWrap: {
    gap: theme.spacing.md,
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
  // See listWrap — the host container owns the padding.
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  tile: {
    width: '47%',
    gap: theme.spacing.sm,
  },
  tileThumb: {
    height: 96,
    width: '100%',
  },
  // The section label's line box, not its glyph height: sectionTitle is 12pt
  // Inter Bold with no explicit lineHeight, which RN lays out at ~15pt. The
  // placeholder has to occupy the LINE, or the shelf below it would sit a few
  // points higher while loading and step down when the real label arrives —
  // the same class of jump the poster thumb size fixed.
  labelLine: {
    height: 15,
  },
  hRow: {
    flexDirection: 'row',
    // Must be the SHELF gap, not a generic one: a skeleton row whose gap
    // differs from the real row's shifts every card sideways at the moment
    // content arrives. Padding removed for the same reason — see listWrap.
    gap: theme.layout.rowCard.gap,
  },
  poster: {
    width: theme.layout.rowCard.width,
    gap: theme.spacing.sm,
  },
  // Was 148x96 against a real card of 148x83 — a 13pt drop on every shelf the
  // instant the data landed. Both now derive from the same metric, so the
  // skeleton occupies exactly the space its content will.
  posterThumb: {
    width: theme.layout.rowCard.width,
    height: theme.layout.rowCard.height,
  },
});
