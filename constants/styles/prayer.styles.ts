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
});
