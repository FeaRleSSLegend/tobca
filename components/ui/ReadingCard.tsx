import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ReadingCardProps {
  date?: string;
  reference?: string;
  verse?: string;
  streak?: number;
  onPress?: () => void;
}

export const ReadingCard = ({ 
  date = "Day 45 · Genesis 12–14",
  reference = "Genesis 12–14",
  verse = '"Get thee out of thy country... unto a land that I will shew thee."',
  streak = 14,
  onPress 
}: ReadingCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.leftContent}>
        <Text style={styles.eyebrow}>{date}</Text>
        <Text style={styles.verse} numberOfLines={2}>{verse}</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Continue reading</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.slate} />
        </View>
      </View>
      <View style={styles.streakContainer}>
        <Text style={styles.streakNum}>{streak}</Text>
        <Text style={styles.streakLabel}>DAY{'\n'}STREAK</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
  },
  leftContent: {
    flex: 1,
    padding: theme.spacing.md,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.04,
    marginBottom: theme.spacing.xs,
  },
  verse: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ctaText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.slate,
  },
  streakContainer: {
    width: 70,
    flexShrink: 0,
    backgroundColor: theme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  streakNum: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    fontWeight: '700',
    color: theme.colors.white,
  },
  streakLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 12,
    marginTop: theme.spacing.xs,
    letterSpacing: 0.03,
  },
});