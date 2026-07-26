import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface GridCardProps {
  title: string;
  duration: string;
  speaker?: string;
  onPress?: () => void;
  variant?: 'default' | 'compact';
}

export const GridCard = ({
  title,
  duration,
  speaker,
  onPress,
  variant = 'default'
}: GridCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumbnail}>
        {/* Deliberately NOT the same pink/purple wash PosterCard uses above
            — that was tried and made Series and Recently Added look like
            duplicate content blocks. Same idea (brand-tinted placeholder
            until real thumbnail art exists), different register, so the
            two sections stay visually distinguishable at a glance. */}
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.slateLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="play" size={20} color={theme.colors.white} style={{ zIndex: 1 }} />
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
    // Was 11pt, one point under theme.ts's documented caption floor
    // ("strict floor... never go below this"). Bumped to the floor itself.
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
