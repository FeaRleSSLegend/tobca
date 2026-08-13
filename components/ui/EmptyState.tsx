import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './motion';
import { theme } from '../../constants/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * One empty-state component for every collection screen, with an optional
 * action button. The action is what separates the two cases that used to
 * share a single "Nothing here yet." string:
 *
 *   - collection genuinely empty  → no action, just explain
 *   - search/filter matched nothing → "Clear search" / "Show all" action,
 *     so the user has a way OUT of the empty state instead of a dead end
 *
 * Announced as a live region so screen-reader users hear the state change
 * when results vanish, rather than the list going silently blank.
 */
export const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) => (
  <View style={styles.wrap} accessibilityLiveRegion="polite">
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={26} color={theme.colors.grayIcon} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onAction ? (
      <PressableScale
        onPress={onAction}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </PressableScale>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodySemibold,
    color: theme.colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.navy,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodySemibold,
    color: theme.colors.navy,
  },
});
