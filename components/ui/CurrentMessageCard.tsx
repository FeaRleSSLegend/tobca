import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { SmartImage } from './SmartImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';
import { displayTitle } from '../../utils/contentGrouping';

interface CurrentMessageProps {
  message: Message;
  onPress?: () => void;
}

// Library's hero card. Refinement pass: with real YouTube data flowing,
// every message now HAS artwork — so the card uses the actual thumbnail
// as its background instead of covering it with a flat brand gradient
// that made every week's hero look identical. A bottom scrim (transparent
// → near-black navy) keeps the text at readable contrast wherever the
// photo is busy; the brand gradient stays as the fallback for the mock
// entries that have no thumbnail. Same information, one more real signal,
// zero added elements — the scan order is unchanged: eyebrow → title →
// meta, play button in the corner.
export const CurrentMessage = ({ message, onPress }: CurrentMessageProps) => {
  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Current message: ${displayTitle(message.title)}, ${message.speaker}`}
    >
      {message.thumbnail ? (
        <>
          <SmartImage
            uri={message.thumbnail}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(10,22,33,0.05)', 'rgba(10,22,33,0.85)']}
            start={{ x: 0, y: 0.25 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Visual affordance only — the whole card is the tap target now, so
          a nested Pressable here would just swallow the press. */}
      <View style={styles.playButton}>
        <Ionicons name="play" size={18} color={theme.colors.pink} style={{ marginLeft: theme.space.hairline }} />
      </View>

      <View>
        <Text style={styles.eyebrow}>Current Message</Text>
        <Text style={styles.title} numberOfLines={2}>
          {displayTitle(message.title)}
        </Text>
        <Text style={styles.meta}>
          {message.speaker} · {message.duration}
        </Text>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 160,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    // The one owner of the gap between the branch filter and the hero card.
    marginTop: theme.space.section,
    backgroundColor: theme.colors.navy, // paints the frame while the image loads
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
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: theme.colors.white,
    marginBottom: 4,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.8)',
  },
});
