import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

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
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <PressableScale onPress={onPress} style={styles.container}>
      <View style={styles.leftContent}>
        <Text style={styles.eyebrow}>{date}</Text>
        <Text style={styles.verse} numberOfLines={2}>{verse}</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Continue reading</Text>
          <Ionicons name="chevron-forward" size={14} color={c.slate} />
        </View>
      </View>
      <View style={styles.streakContainer}>
        <Text style={styles.streakNum}>{streak}</Text>
        <Text style={styles.streakLabel}>DAY{'\n'}STREAK</Text>
      </View>
    </PressableScale>
  );
};

const useStyles = makeThemedStyles((c) => ({
  container: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
  },
  leftContent: {
    flex: 1,
    padding: theme.spacing.md,
    minWidth: 0,
  },
  // Plain small label, not an uppercase eyebrow — this card already sits
  // under a "Today's Reading" SectionLabel, so restating that as a shouty
  // caption on every card underneath it was redundant.
  eyebrow: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: c.slate,
    marginBottom: theme.spacing.xs,
  },
  verse: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.navy,
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
    color: c.slate,
  },
  streakContainer: {
    width: 70,
    flexShrink: 0,
    backgroundColor: c.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  streakNum: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    fontWeight: '700',
    color: c.white,
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
}));