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
    marginVertical: theme.spacing.lg,
    // Padding alone landed at ~39pt tall — minHeight gets it to the 44pt
    // floor without changing how dense the field looks.
    minHeight: 44,
  },
  clearBtn: {
    padding: 2, // hitSlop below does the real touch-target work
  },
  noResults: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  searchInput: {
    flex: 1, // takes remaining width after the icon
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.navy,
  },
  searchText: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterView: {
    padding: theme.spacing.sm,
  },
  // Was an inline `{ gap: theme.spacing.md }` object literal passed
  // straight to contentContainerStyle in library.tsx — moved here so this
  // screen's layout values live in one place, same convention live.styles.ts
  // documents ("if Library ever needs one of these...").
  filterRow: {
    gap: theme.spacing.md,
  },
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      // Was a bare 10 — not on the 4/8/12/16/20/24/32 spacing scale.
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.sm,
  },
  gridItem: {
      width: '48%', // 2 columns with gap
  },
});
