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

// Same fix as LiveCard and CurrentMessageCard: flat navy surface instead of
// a bespoke navy→slate gradient, with the actual brand gradient reserved
// for the play/pause control — the one thing on this sticky bar someone is
// actually meant to press.
export const AudioPlayer = ({
  title,
  subtitle,
  isPlaying = false,
  onPress,
  onPlayPause
}: AudioPlayerProps) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.bar, { backgroundColor: theme.colors.navy }]}>
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
            <Pressable onPress={onPlayPause} style={styles.controlButtonWrapper}>
              <LinearGradient
                colors={theme.gradient.colors}
                start={theme.gradient.start}
                end={theme.gradient.end}
                style={styles.controlButton}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color={theme.colors.white}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
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
  bar: {
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
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
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
    fontSize: theme.fontSize.caption,
    color: theme.colors.white,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.55)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  controlButtonWrapper: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  controlButton: {
    padding: theme.spacing.md,
  },
});
