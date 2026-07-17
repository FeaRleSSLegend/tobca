// library.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const LibraryStyles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm, // check your actual token name, e.g. spacing.sm or spacing[2]
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.grayIcon,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginVertical: 14,
  },
  searchInput: {
    flex: 1, // takes remaining width after the icon
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.navy,
  },
  searchText: {
    marginTop: 8,
    gap: 6,
  },
  filterView: {
    padding: theme.spacing.sm,
  }
});