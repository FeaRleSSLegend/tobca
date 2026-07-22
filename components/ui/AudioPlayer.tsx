import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface AudioPlayerProps {
  title: string;
  subtitle: string;
  isPlaying?: boolean;
  onPress?: () => void;
  onPlayPause?: () => void;
}

export const AudioPlayer = ({ 
  title, 
  subtitle, 
  isPlaying = false,
  onPress,
  onPlayPause 
}: AudioPlayerProps) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.slate]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.info}>
            <View style={styles.iconContainer}>
              <Ionicons name="musical-notes" size={18} color={theme.colors.white} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
          
          <View style={styles.controls}>
            <Pressable onPress={onPlayPause} style={styles.controlButton}>
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color={theme.colors.white} 
              />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  gradient: {
    borderRadius: theme.radius.md,
    margin: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    shadowColor: theme.colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(248, 0, 104, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 12,
    color: theme.colors.white,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginLeft: 10,
  },
  controlButton: {
    padding: 4,
  },
});