import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';

interface CurrentMessageProps {
  message: Message;
}

// The site's own "Current Message" block is the boldest thing on their
// homepage — a full pink panel, huge white play button, one caption line.
// This card was a flat navy panel with two stacked white-on-navy eyebrows
// ("Current Message" + "Now streaming") doing the same job twice. Matched
// to the real thing instead: gradient panel, one caption, one big white
// play button with a colored icon — the site's actual play button is white
// with a pink triangle, not a small tinted circle.
export const CurrentMessage = ({ message }: CurrentMessageProps) => {
  return (
    <LinearGradient
      colors={theme.gradient.colors}
      start={theme.gradient.start}
      end={theme.gradient.end}
      style={styles.card}
    >
      <Pressable style={styles.playButton} hitSlop={4}>
        <Ionicons name="play" size={18} color={theme.colors.pink} style={{ marginLeft: 2 }} />
      </Pressable>

      <View>
        <Text style={styles.eyebrow}>Current Message</Text>
        <Text style={styles.title} numberOfLines={2}>
          {message.title}
        </Text>
        <Text style={styles.meta}>
          {message.speaker} · {message.duration}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 150,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: theme.spacing.xxl,
  },
  playButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
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
    color: 'rgba(255,255,255,0.8)',
  },
});
