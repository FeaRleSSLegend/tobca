// app/(tabs)/prayer.styles.ts
// Styles specific to the Prayer screen only — same convention as
// live.styles.ts. Previously this lived as an inline StyleSheet.create()
// at the bottom of prayer.tsx, the one screen that didn't follow the
// per-screen styles file pattern the other three tabs use.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const prayerStyles = StyleSheet.create({
  scrollContent: {
    // Clearance for the sticky AudioPlayer below. This used to be paired
    // with a second, separate 80pt spacer View at the end of the scroll
    // content doing the same job twice — one clearance mechanism is enough.
    // Was a bare 110 — a number picked by eye to clear the tab bar. Same job,
    // same value class, now shared with every other tab.
    paddingBottom: theme.layout.scrollClearance.tab,
  },
});
