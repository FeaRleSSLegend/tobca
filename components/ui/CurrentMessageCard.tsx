import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';

interface CurrentMessageProps {
  message: Message;
}

export const CurrentMessage = ({ message }: CurrentMessageProps) => {
  return (
    <LinearGradient
      colors={[theme.colors.slateLight, theme.colors.navy]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Pressable style={styles.playButton}>
        <Ionicons name="play" size={16} color={theme.colors.white} />
      </Pressable>

      <View>
        <Text style={styles.eyebrow}>Now Streaming</Text>
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
    marginTop: theme.spacing.sm
  },
  playButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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