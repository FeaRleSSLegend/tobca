// library.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const LibraryStyles = StyleSheet.create({
  // Filled + fully rounded, deliberately NOT the bordered-white-card recipe
  // every other surface on this screen uses. Fill is grayBorder (a visible
  // light-gray tone), NOT theme.colors.bg — bg is literally the screen's
  // own background color, so a search bar filled with it had zero contrast
  // against the page and the pill shape was invisible despite being coded
  // correctly. grayBorder reads as a "recessed field," the standard
  // iOS/Android search treatment, and is visibly distinct from both the
  // page behind it and the white cards below it.
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    // NO margins of its own. `marginVertical: 16` here was adding to BOTH
    // neighbours: headerRow's 16pt paddingBottom above it (32pt gap under the
    // title) and BranchFilter's 16pt marginTop below it (another 32). The
    // header owns the gap above, the filter row owns the gap below.
    marginVertical: 0,
    // Padding alone landed at ~39pt tall — minHeight gets it to the 44pt
    // floor without changing how dense the field looks.
    minHeight: 44,
  },
  // Real TextInput placeholder styling used to live here, back when this
  // was an actual input. Now SearchBar is a Pressable trigger to /search,
  // so this is just static text standing in for the placeholder.
  searchPlaceholder: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.grayIcon,
  },
  // Fixed-width wrapper for a GridCard riding in a horizontal preview row
  // — GridCard sizes itself flex-first for 2/3-col grids, so inside an
  // HScroll it needs an explicit width. 148 ≈ one-and-a-bit visible past
  // two full cards on a 390pt screen, the "there's more to scroll" cue.
  // THE MEDIA MODE ROW — search bar above, branch pills below.
  //
  // The gaps here are the whole hierarchy argument, so they are not
  // symmetrical on purpose:
  //
  //   above (12, space.header)  the switch belongs TO the header — it is the
  //                             heading for everything under it, and a heading
  //                             sits close to what it heads
  //   below (8 own padding + 16 from BranchFilter's paddingTop = 24)
  //                             a full section gap, which is what separates
  //                             the MODE from the FILTERS and stops the two
  //                             reading as one block of stacked controls
  //
  // Zero bottom margin of its own: the switch already reserves 8pt under its
  // caps for the marker and BranchFilter carries its own top gap. A third
  // hand-tuned gap between two elements that each reserve their own space is
  // what made this area read as a stack of separate bars.
  modeRow: {
    marginTop: theme.space.header,
    marginBottom: 0,
  },
  hScrollCard: {
    width: theme.layout.rowCard.width,
  },
  // The gear in the header, where the "JN" avatar disc used to be. Same 32pt
  // footprint so the title row's height is unchanged, but no fill: the disc
  // was solid navy because it stood in for a photo, and a filled circle around
  // a utility glyph would out-shout the page title next to it. hitSlop on the
  // control takes the real target past 44pt.
  settingsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // THE BRANCH FILTER'S POSITION on this screen: floated over the top of the
  // pager rather than stacked above it.
  //
  // This is the layout half of the Video-tab scroll-glitch fix. In flow, the
  // row hid by collapsing its own height, which resized the scroll viewport
  // underneath it mid-gesture — see the full mechanism in BranchFilter.tsx.
  // Out of flow it can hide by translating instead, and the scroller's box
  // never changes size at all. The video page reserves the row's measured
  // height as fixed contentContainer padding, so content still starts below
  // the pills; it just passes UNDER them on the way out.
  //
  // No zIndex: it is rendered as a later sibling than the pager, and later
  // siblings paint on top. Android has dropped negatively-indexed views from
  // this app's tree before, so paint order is the safer lever.
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // NOTE: filterView / filterRow / filteredCountLabel / gridContainer /
  // gridItem were removed in the discovery-hub redesign — the pill row and
  // in-place filtered grid they styled moved to the collection screens
  // (see seeAll.styles.ts pillsView/pillsRow, which carry over the same
  // height-pinning fix documented on the old filterView).
    // Same footprint as CurrentMessage so the swap doesn't shift the page.
    // It genuinely wasn't: this was 180 tall with a 16pt top margin against a
    // real card of 160 with a 24pt top margin, so the page jumped 28pt the
    // moment the hero loaded. Both values now come from the card they stand
    // in for — change them together or not at all.
    heroSkeleton: {
        height: 160,
        marginTop: theme.space.section,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
    },
    // The one row on Library that leaves the app. Styled as a utility row,
    // not a content card — it is a door, not a thing to watch.
    // Was entirely hardcoded — gap 12, padding 16, marginTop 8, plus raw hex
    // for border and background. Every value now comes from the tokens, so this
    // row moves with the rest of the app instead of drifting from it.
    socialsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.related,
        padding: theme.space.related,
        borderRadius: theme.radius.md,
        borderWidth: theme.layout.cardBorderWidth,
        borderColor: theme.colors.grayBorder,
        backgroundColor: theme.colors.surface,
    },
    socialsBadge: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialsTitle: {
        fontSize: theme.fontSize.bodyLg,
        fontFamily: theme.fontFamily.bodySemibold,
        color: theme.colors.navy,
    },
    socialsMeta: {
        fontSize: theme.fontSize.caption,
        fontFamily: theme.fontFamily.body,
        color: theme.colors.graySecondary,
        marginTop: theme.space.hairline,
    },
});
