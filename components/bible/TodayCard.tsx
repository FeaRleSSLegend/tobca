import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface TodayCardProps {
  day: number;
  isRead: boolean;
  // Whether at least one of today's readings has actually been opened and
  // finished yet — the button stays visible either way, but disabled until
  // this is true, so it can't be marked read without having read something.
  canMarkAsRead: boolean;
  onMarkAsRead: () => void;
}

// Deliberately light now — this used to also carry the day's reference and
// a "~12 min" estimate as its own headline, but that's redundant now that
// the reading carousel below shows each reference (and a real preview) on
// its own card. This card's job shrank to: what day is it, and is today done.
export const TodayCard = ({ day, isRead, canMarkAsRead, onMarkAsRead }: TodayCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.dayCount}>Day {day} of 365</Text>

      {!isRead ? (
        <>
          <Pressable 
            onPress={onMarkAsRead} 
            disabled={!canMarkAsRead}
            style={[styles.markBtn, !canMarkAsRead && styles.markBtnDisabled]}
          >
            <Text style={[styles.markBtnText, !canMarkAsRead && styles.markBtnTextDisabled]}>
              Mark as Read
            </Text>
          </Pressable>
          {!canMarkAsRead && (
            <Text style={styles.hint}>Open one of today's readings below to unlock this</Text>
          )}
        </>
      ) : (
        <View style={styles.readBadge}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.readBadgeText}>Read</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dayCount: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  markBtn: {
    backgroundColor: theme.colors.pink,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    width: '100%',
    alignItems: 'center',
  },
  markBtnDisabled: {
    backgroundColor: theme.colors.grayBorder,
  },
  markBtnText: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  markBtnTextDisabled: {
    color: theme.colors.grayIcon,
  },
  hint: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  readBadgeText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.success,
  },
});