import { View, Text, Pressable, StyleSheet } from 'react-native';
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
        <Ionicons name="play" size={20} color={theme.colors.white} />
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
    padding: 10,
  },
  title: {
    fontSize: 12.5,
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.navy,
    lineHeight: 16,
    marginBottom: 4,
  },
  speaker: {
    fontSize: 11,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
    marginBottom: 2,
  },
  duration: {
    fontSize: 11,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.grayIcon,
  },
});