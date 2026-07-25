import { View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface VerseOfDayCardProps {
  reference: string;
  text: string;
  onPress?: () => void;
  onShare?: () => void;
}

// Full-bleed photo + scrim + white type, the way YouVersion's Verse of the
// Day card works. This is deliberately the loudest thing on the Live tab —
// everything below it (services, reading, messages) should read as quieter
// by comparison, not compete with it card-for-card.
export const VerseOfDayCard = ({ reference, text, onPress, onShare }: VerseOfDayCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <ImageBackground
        source={require('../../assets/verse-of-day-bg.jpg')}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <LinearGradient
          colors={['rgba(10,22,33,0.05)', 'rgba(10,22,33,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>Verse of the Day</Text>
          {onShare && (
            <Pressable onPress={onShare} hitSlop={8} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={16} color={theme.colors.white} />
            </Pressable>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.verse} numberOfLines={5}>
            &ldquo;{text}&rdquo;
          </Text>
          <Text style={styles.reference}>{reference}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  bg: {
    minHeight: 260,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: theme.spacing.sm,
  },
  verse: {
    fontFamily: theme.fontFamily.displayMedium,
    fontSize: theme.fontSize.display,
    lineHeight: theme.fontSize.display * 1.3,
    color: theme.colors.white,
  },
  reference: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: 'rgba(255,255,255,0.85)',
  },
});
