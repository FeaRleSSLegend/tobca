// app/search.styles.ts
// Styles for the dedicated Search screen — same per-screen file convention
// as live.styles.ts / library.styles.ts / prayer.styles.ts.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const searchStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: theme.colors.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.navy,
  },
  clearBtn: {
    padding: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  sectionLabel: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodySemibold,
    color: theme.colors.slate,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  resultsList: {
    gap: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
  },
  noResults: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
});
