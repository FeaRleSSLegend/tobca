// constants/sharedStyles.ts
// Only styles used by 2+ screens belong here — Live, Library, Prayer, and
// Bible Plan all share the same greeting header and "SECTION TITLE ... See
// All" row pattern. Anything specific to ONE screen goes in that screen's
// own styles file instead (e.g. live.styles.ts) — not here, no matter how
// tempting it is to just add it to this file while it's open.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { lightPalette, type Palette } from '../palette';
import { makeThemedSheet } from '../../hooks/useTheme';

// ---------------------------------------------------------------------------
// THEMED, WITH A LIGHT-ONLY COMPATIBILITY EXPORT.
//
// These styles are read by every screen in the app, which makes this file the
// one place where "convert everything at once" and "convert nothing" were both
// unacceptable. So each sheet is defined ONCE as a factory over a Palette, and
// exposed twice:
//
//   useSharedStyles()  the hook. Follows the active appearance. New code and
//                      any screen being converted uses this.
//   sharedStyles       the same sheet, frozen against the LIGHT palette, for
//                      the screens not yet converted. Byte-identical to what
//                      this file exported before, so nothing changed for them.
//
// The compatibility export is not a permanent fixture — it is what lets the
// conversion happen a screen at a time instead of in one commit that touches
// 76 files. It should be deleted when the last consumer stops importing it,
// and `grep -rn "sharedStyles"` is the progress bar.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BOTTOM SHEETS
//
// There are two sheets in the app - the streak detail and the verse highlight
// picker - and they were built months apart with no shared recipe: different
// corner radii, different handle sizes, different padding, one scrim at 25%
// and one at 40%. They read as parts of two different apps.
//
// One recipe now, applied to both. The rules it encodes:
//   - top corners at the LARGE radius (a sheet is a wide surface; the card
//     radius looks timid across a full screen width)
//   - a grab handle, always, even when the sheet is not draggable - it is what
//     says the thing came up from the bottom and goes back down
//   - generous horizontal padding, because a sheet is a focused context and
//     should not feel like a cramped list
//   - a scrim, so the sheet reads as OVER the page rather than part of it
//
// Bottom padding is deliberately NOT here: it has to add the device safe-area
// inset, which is a runtime value, so each sheet composes that in itself.
// ---------------------------------------------------------------------------
// StyleSheet.create INSIDE the factory, not just around its result. A
// standalone `(c: Palette) => ({...})` has no contextual type at its
// declaration site, so `alignSelf: 'center'` widens to `string` and stops
// being a ViewStyle. create() supplies that context and narrows the literals —
// the same reason it exists at all. makeThemedSheet calling create again on
// the result is a no-op: modern RN's create returns the object it was given.
const sheetStylesFactory = (c: Palette) => StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,22,33,0.35)',
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: c.grayBorder,
    marginBottom: theme.space.related,
  },
  /** Close button in a sheet corner - a full 44pt target, not a bare glyph. */
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const sharedStylesFactory = (c: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.layout.screenPadding,
    // Zero on purpose: each screen's ScrollView owns its own bottom clearance
    // (see layout.scrollClearance), and padding here as well would double it
    // AND stop content scrolling under the tab bar.
    paddingBottom: 0,
    backgroundColor: c.bg
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Air under the tab title before content starts. The references all give
    // the page title its own band rather than butting the first card against
    // it — cheapest possible way to make a screen feel unhurried.
    paddingBottom: theme.space.related,
  },
  // One title treatment for all four tabs. Previously each screen declared its
  // own inline { fontSize: heroTitle, fontFamily: display } — same intent,
  // four copies, and Plan had drifted to a different size. Set large with
  // negative tracking: display type at 0 tracking reads loose.
  screenTitle: {
    fontFamily: theme.fontFamily.display,
    fontSize: 28,
    letterSpacing: -0.5,
    color: c.navy,
  },
  // Live's greeting line, sitting above the tab title.
  screenEyebrow: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
  // The settings gear in the header, where the "JN" avatar disc used to be.
  // Same 32pt footprint so the title row's height is unchanged, but no fill:
  // the disc was solid navy because it stood in for a photo, and a filled
  // circle around a utility glyph would out-shout the page title next to it.
  // hitSlop on the control takes the real target past 44pt.
  //
  // Lives here rather than in library.styles because all four tabs now render
  // it through components/ui/ScreenHeader.
  settingsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The repeating "SECTION TITLE ... See All" row — appears on every screen.
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // 32 -> 24, reversing my own earlier change. I widened this for "calm",
    // but on a hub screen that is five stacked rails the gaps started reading
    // as gaps rather than as structure — the page felt stretched instead of
    // composed, and you lost roughly a section per screenful of scrolling.
    // 24 still separates cleanly at this type size; the label's own tracking
    // and weight are doing more of that work now than raw distance is.
    // One value, one meaning: section-to-section everywhere in the app.
    marginTop: theme.space.section,
    // And a tighter, DIFFERENT value from header to its own content, so the
    // header groups downward with what it labels instead of floating midway.
    marginBottom: theme.space.header,
  },
  sectionTitle: {
    // BUG FIX: this set fontWeight with NO fontFamily, so every section label
    // on every tab fell back to the SYSTEM font while the rest of the app used
    // Inter — a mismatch visible on all four screens at once.
    fontFamily: theme.fontFamily.bodyBold,
    // 14 -> 12. These are labels, not headings: the reference apps set section
    // labels small, tracked and quiet ("DAILY REFRESH"), and let the content
    // below carry the weight. At 14 uppercase with no tracking it read as
    // shouting and, set solid, as cramped.
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: c.graySecondary,
    textTransform: 'uppercase',
  },
  seeAllLink: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
  },
  // Small bold pink uppercase label — eyebrows/badges that need to pop
  // (e.g. "NEXT SERVICE", a day label in a pill). Pink was flagged as a
  // possible bug earlier — it's a deliberate design choice, kept as-is.
  overlineText: {
    // Same missing-fontFamily bug as sectionTitle, same fix. Also dropped from
    // 14 to 12 with tracking: an eyebrow that competes with the headline it
    // introduces is doing the headline's job.
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: c.pink,
    textTransform: 'uppercase',
  },
});

// ---- The two exposures. See the note at the top of this file. ----

/** Themed. Follows the active appearance. Prefer this. */
export const useSheetStyles = makeThemedSheet(sheetStylesFactory);

/**
 * The sheet recipe for a GIVEN palette, for the two screens that SPREAD it
 * (`...sheetStyles.sheet`) inside their own themed factory rather than
 * consuming it as a finished style. They are already inside a factory that has
 * `c` in hand, so they need the values, not a hook — calling a hook there
 * would be a hook call outside a component.
 */
export const sheetStylesFor = sheetStylesFactory;
/** Themed. Follows the active appearance. Prefer this. */
export const useSharedStyles = makeThemedSheet(sharedStylesFactory);

/** @deprecated Light-only. Kept while screens are still being converted. */
export const sheetStyles = sheetStylesFactory(lightPalette);
/** @deprecated Light-only. Kept while screens are still being converted. */
export const sharedStyles = sharedStylesFactory(lightPalette);
