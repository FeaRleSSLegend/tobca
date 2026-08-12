// constants/sharedStyles.ts
// Only styles used by 2+ screens belong here — Live, Library, Prayer, and
// Bible Plan all share the same greeting header and "SECTION TITLE ... See
// All" row pattern. Anything specific to ONE screen goes in that screen's
// own styles file instead (e.g. live.styles.ts) — not here, no matter how
// tempting it is to just add it to this file while it's open.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
    backgroundColor: theme.colors.bg
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Air under the tab title before content starts. The references all give
    // the page title its own band rather than butting the first card against
    // it — cheapest possible way to make a screen feel unhurried.
    paddingBottom: theme.spacing.lg,
  },
  // One title treatment for all four tabs. Previously each screen declared its
  // own inline { fontSize: heroTitle, fontFamily: display } — same intent,
  // four copies, and Plan had drifted to a different size. Set large with
  // negative tracking: display type at 0 tracking reads loose.
  screenTitle: {
    fontFamily: theme.fontFamily.display,
    fontSize: 28,
    letterSpacing: -0.5,
    color: theme.colors.navy,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.navy,
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
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.sm,
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
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
  },
  seeAllLink: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
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
    color: theme.colors.pink,
    textTransform: 'uppercase',
  },
});