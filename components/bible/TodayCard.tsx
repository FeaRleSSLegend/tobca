import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface TodayCardProps {
  day: number;
  reference: string;
  isRead: boolean;
  onMarkAsRead: () => void;
}

export const TodayCard = ({ day, reference, isRead, onMarkAsRead }: TodayCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.dayCount}>Day {day} of 365</Text>
      <Text style={styles.verseRef}>{reference}</Text>
      <Text style={styles.verseSub}>Today's reading · ~12 min</Text>
      
      {!isRead ? (
        <Pressable onPress={onMarkAsRead} style={styles.markBtn}>
          <Text style={styles.markBtnText}>Mark as Read</Text>
        </Pressable>
      ) : (
        <View style={styles.readBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.readBadgeText}>Completed Today</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  dayCount: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: theme.spacing.sm,
  },
  verseRef: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: theme.spacing.xs,
  },
  verseSub: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    marginBottom: theme.spacing.lg,
  },
  markBtn: {
    backgroundColor: theme.colors.pink,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    width: '100%',
    alignItems: 'center',
  },
  markBtnText: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.white,
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
    color: '#4CAF50',
  },
});