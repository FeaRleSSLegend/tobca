import { View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
import { PressableScale } from './motion';
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
    // Home renders this card without an onPress, so the whole card was a
    // tappable that dipped under your finger and then did nothing. `disabled`
    // when unwired suppresses the press feedback too, so it stops advertising
    // an interaction it doesn't have.
    <PressableScale onPress={onPress} disabled={!onPress} style={styles.wrapper}>
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
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    // The three stacked blocks on Home (live card, verse, reading row) each
    // picked their own top margin — 20, 12 and 20 — so the page had no
    // rhythm at all: two near-identical gaps that weren't identical, and a
    // third that was half the size. All three are section boundaries, so all
    // three now use the section step.
    marginTop: theme.space.section,
  },
  bg: {
    // AUDIT (on-device): at 260 this card rendered ~500px tall on a 2856px
    // screen — a third of the viewport for one short verse, most of it empty
    // dark image. Two consequences, both Refactoring UI hierarchy problems:
    // it created a SECOND maximum-weight element directly under the gradient
    // hero (two focal points = no focal point), and it pushed Today's Reading
    // — the action this screen exists to drive — below the fold.
    // 200 keeps it a real photographic moment while letting the hero lead and
    // the reading row surface without scrolling.
    minHeight: 200,
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
