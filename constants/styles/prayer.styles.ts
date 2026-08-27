// app/(tabs)/prayer.styles.ts
// Styles specific to the Prayer screen only — same convention as
// live.styles.ts. Previously this lived as an inline StyleSheet.create()
// at the bottom of prayer.tsx, the one screen that didn't follow the
// per-screen styles file pattern the other three tabs use.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { lightPalette, type Palette } from '../palette';
import { makeThemedSheet } from '../../hooks/useTheme';

// THEMED, with a light-only compatibility export — the same two-exposure
// shape constants/styles/sharedStyles.ts documents, and for the same reason:
// this sheet is read by screens that have been converted and by screens that
// have not, and both have to keep working while the migration finishes.
//
//   usePrayerStyles()   follows the active appearance. Use this.
//   prayerStyles     frozen against the light palette, for unconverted callers.
const prayerStylesFactory = (c: Palette) => StyleSheet.create({
  scrollContent: {
    // No paddingBottom here. Prayer's clearance is the sum of two runtime
    // facts — the MEASURED height of its own sticky AudioPlayer, and the
    // mini-player's footprint when docked — so it is composed at the call
    // site. The flat token that used to sit here was sized for a tab bar that
    // never overlapped anything (see constants/theme.ts scrollClearance).
  },

  // ---- DOCUMENTS SECTION ----
  // A vertical list, unlike the two DocCard shelves above it, because these
  // titles are long and real ("21 Days Prayer Guide With Timetable") and a
  // shelf tile truncates them into nothing.
  docsList: {
    gap: theme.space.tight,
  },
  // The loading / error / empty slot. Given a minHeight so the section does
  // not collapse to nothing and let everything below it jump upward the
  // instant the manifest lands.
  docsStatus: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.tight,
    paddingHorizontal: theme.spacing.lg,
  },
  docsStatusText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
    textAlign: 'center',
  },
  docsRetry: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.pink,
  },
});

/** Themed. Follows the active appearance. Prefer this. */
export const usePrayerStyles = makeThemedSheet(prayerStylesFactory);
/** @deprecated Light-only. Kept while screens are still being converted. */
export const prayerStyles = prayerStylesFactory(lightPalette);
