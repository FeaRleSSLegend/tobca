// app/search.styles.ts
// Styles for the dedicated Search screen — same per-screen file convention
// as live.styles.ts / library.styles.ts / prayer.styles.ts.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const searchStyles = StyleSheet.create({
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
    borderBottomColor: theme.colors.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.navy,
  },
  clearBtn: {
    padding: theme.space.hairline,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.layout.scrollClearance.stack,
  },
  sectionLabel: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodySemibold,
    color: theme.colors.slate,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },

  // ---- PRE-SEARCH STATE ----
  // The screen shown before the first keystroke: recent terms, then browsable
  // collections, then what's new. One `gap` on the wrapper owns the rhythm
  // between those blocks, so no section carries a top margin of its own and
  // the first one starts flush against the scroll view's own padding.
  preSearch: {
    gap: theme.space.section,
  },
  // A section header that also carries an action ("Clear all"). The label's
  // own marginBottom is cancelled here — the row owns that gap instead, or
  // the two would stack into 24.
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionHeadLabel: {
    marginBottom: 0,
  },
  clearAll: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.body,
    color: theme.colors.pink,
  },

  // Recent-search chips. Same recessed grey field as an inactive FilterPill,
  // so "quiet chip" is one visual idea in this app rather than two — but
  // these are NOT filters, so they never take the pink selected fill.
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    paddingLeft: theme.spacing.md,
    // Tighter on the right: the dismiss glyph needs less air than the text
    // does, and equal padding makes the chip look lopsided around it.
    paddingRight: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    // Never let a long term stretch a chip across the whole row — at that
    // width it stops reading as a chip and starts reading as a list row.
    maxWidth: '100%',
  },
  // The label's pressable must be allowed to shrink, or a long term pushes
  // the dismiss glyph off the chip's right edge instead of truncating.
  chipPress: {
    flexShrink: 1,
  },
  chipLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
    flexShrink: 1,
  },
  chipDismiss: {
    // A 24pt visible box plus hitSlop at the call site — the glyph itself is
    // 14pt and would otherwise be a target you have to aim at.
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Browse tiles: two per row, GroupCard flexes to fill each half.
  tileGrid: {
    gap: theme.spacing.lg,
  },
  tileRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  // Fills the empty half of a row with an odd number of tiles, so the last
  // tile stays half-width instead of stretching across the screen.
  tileSpacer: {
    flex: 1,
  },
  resultsList: {
    gap: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
  },
  noResults: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
});
