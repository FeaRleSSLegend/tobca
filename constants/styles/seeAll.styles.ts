// seeAll.styles.ts
// Styles for the shared collection-screen template (app/see-all.tsx) —
// same per-screen file convention as search.styles.ts / live.styles.ts /
// library.styles.ts. Every collection variant (Series, Services, Recently
// Added, Playlists, drill-ins) draws from this one file, which is what
// keeps their chrome pixel-identical across variants.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { lightPalette, type Palette } from '../palette';
import { makeThemedSheet } from '../../hooks/useTheme';

// THEMED, with a light-only compatibility export — the same two-exposure
// shape constants/styles/sharedStyles.ts documents, and for the same reason:
// this sheet is read by screens that have been converted and by screens that
// have not, and both have to keep working while the migration finishes.
//
//   useSeeAllStyles()   follows the active appearance. Use this.
//   seeAllStyles     frozen against the light palette, for unconverted callers.
const seeAllStylesFactory = (c: Palette) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: c.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.navy,
  },
  // Small live count under the title ("24 messages") — orientation the
  // old screen only surfaced for filtered views, now on every collection.
  subtitle: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: c.graySecondary,
    marginTop: theme.space.hairline,
  },
  // One-line context under the header — only rendered when a collection
  // actually passes one; screens where the title says it all skip it.
  description: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: c.graySecondary,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.md,
  },
  // Same height-pinning fix as LibraryStyles.filterView — locks the pill
  // row's height so toggling the active pill never re-measures the row.
  pillsView: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    height: 52,
    overflow: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
  },
  pillsRow: {
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.layout.scrollClearance.stack,
  },
  // "This Week" / "June 2026" / "Ongoing" group headers inside a list —
  // same uppercase-slate recipe as sharedStyles.sectionTitle, one size
  // down since these sit inside a collection rather than heading one.
  // Count sits at the trailing edge, quiet gray, so the label stays the
  // thing that reads first.
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  groupHeader: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodySemibold,
    color: c.slate,
    textTransform: 'uppercase',
  },
  groupHeaderCount: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: c.grayIcon,
  },
  listRowWrap: {
    marginBottom: theme.spacing.sm,
  },
  // One row of the Series 2-col tile grid.
  tileRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  // One row of the Playlists 3-col circle grid.
  circleRow: {
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  gridWrap: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: c.graySecondary,
    textAlign: 'center',
  },
});

/** Themed. Follows the active appearance. Prefer this. */
export const useSeeAllStyles = makeThemedSheet(seeAllStylesFactory);
/** @deprecated Light-only. Kept while screens are still being converted. */
export const seeAllStyles = seeAllStylesFactory(lightPalette);
