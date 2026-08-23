// app/(tabs)/prayer.styles.ts
// Styles specific to the Prayer screen only — same convention as
// live.styles.ts. Previously this lived as an inline StyleSheet.create()
// at the bottom of prayer.tsx, the one screen that didn't follow the
// per-screen styles file pattern the other three tabs use.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const prayerStyles = StyleSheet.create({
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
    color: theme.colors.graySecondary,
    textAlign: 'center',
  },
  docsRetry: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.pink,
  },
});
