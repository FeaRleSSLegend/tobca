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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.slate,
    textTransform: 'uppercase',
  },
  seeAllLink: {
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
  },
  // Small bold pink uppercase label — eyebrows/badges that need to pop
  // (e.g. "NEXT SERVICE", a day label in a pill). Pink was flagged as a
  // possible bug earlier — it's a deliberate design choice, kept as-is.
  overlineText: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.pink,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
  },
});