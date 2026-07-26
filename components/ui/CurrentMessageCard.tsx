import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';

interface CurrentMessageProps {
  message: Message;
}

// Card background is flat navy now, not a bespoke slateLight→navy blend —
// same fix as LiveCard: navy's job is "dark surface," it doesn't need its
// own invented gradient. The brand pink→purple gradient moved onto the
// play button instead, since that's this card's actual primary action.
export const CurrentMessage = ({ message }: CurrentMessageProps) => {
  return (
    <View style={styles.card}>
      <Pressable style={styles.playButtonWrapper} hitSlop={8}>
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={styles.playButton}
        >
          <Ionicons name="play" size={16} color={theme.colors.white} />
        </LinearGradient>
      </Pressable>

      <View>
        {/* This is the section identity that used to live in a separate
            SectionLabel above the card. "Now streaming" alone is a status,
            not a title — it doesn't tell you what section you're in the
            way FocusCard's "Prayer & Fasting" eyebrow does for Prayer.
            This does that job now, inside the card, instead of costing a
            whole extra row above it. */}
        <Text style={styles.sectionEyebrow}>Current Message</Text>
        <Text style={styles.eyebrow}>Now streaming</Text>
        <Text style={styles.title} numberOfLines={2}>
          {message.title}
        </Text>
        <Text style={styles.meta}>
          {message.speaker} · {message.duration}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 150,
    backgroundColor: theme.colors.navy,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    // Was spacing.sm (8px) — noticeably tighter than the gap every other
    // section on this screen uses above it. Matched to sectionHeaderRow's
    // own top margin so the hero card breathes the same as everything below it.
    marginTop: theme.spacing.xxl,
  },
  playButtonWrapper: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  playButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.cardTitle,
    color: theme.colors.white,
    marginBottom: 4,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.7)',
  },
});
