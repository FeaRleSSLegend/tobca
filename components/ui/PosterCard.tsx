import { Pressable, Text, View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface PosterCardProps {
  title: string;
  subtitle: string;
  thumbnail?: string;
  onPress?: () => void;
}

export const PosterCard = ({ title, subtitle, thumbnail, onPress }: PosterCardProps) => {
  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={styles.thumb}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['rgba(248,0,104,0.35)', 'rgba(200,32,248,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Ionicons name="play" size={16} color={theme.colors.white} style={styles.icon} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 126,
  },
  thumb: {
    width: 126,
    height: 82,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.slate,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    zIndex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.navy,
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: 2,
  },
});