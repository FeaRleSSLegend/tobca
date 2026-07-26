import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { MessageType } from '../../data/content';

interface GridCardProps {
  title: string;
  duration: string;
  speaker?: string;
  type?: MessageType;
  onPress?: () => void;
}

// Every card in this grid used to be the same navy rectangle with the same
// play triangle — title text was the only way to tell one from another,
// which is exactly the "user has to read everything" problem raised on
// this screen, and the skill's own color-and-contrast rule ("don't rely
// solely on color to convey information") points at the same fix: the
// icon needs to change, not just a tint. Until there's real thumbnail
// artwork, the content type is the one real signal available, so each
// type gets its own icon. Kept off pink/purple on purpose — that budget
// belongs to the one hero card above, not four small grid tiles.
const typeIcon: Record<MessageType, keyof typeof Ionicons.glyphMap> = {
  sermon: 'mic',
  series: 'albums',
  audio: 'headset',
  video: 'videocam',
};

export const GridCard = ({
  title,
  duration,
  speaker,
  type = 'sermon',
  onPress,
}: GridCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumbnail}>
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.slateLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name={typeIcon[type]} size={20} color={theme.colors.white} style={{ zIndex: 1 }} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {speaker && (
          <Text style={styles.speaker} numberOfLines={1}>
            {speaker}
          </Text>
        )}
        <Text style={styles.duration}>{duration}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 72,
    backgroundColor: theme.colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.navy,
    lineHeight: 16,
    marginBottom: 4,
  },
  speaker: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
    marginBottom: 2,
  },
  duration: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.grayIcon,
  },
});
