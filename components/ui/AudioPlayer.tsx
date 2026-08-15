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
  /**
   * Reports how much vertical space this bar actually occupies, so the screen
   * behind it can end its scroll content above it. MEASURED rather than
   * declared: this bar has no fixed height — it is padding plus whatever its
   * tallest child is — so any constant a screen kept for it would be a guess
   * that silently drifts the moment the bar's contents change.
   */
  onHeightChange?: (height: number) => void;
}

// This is sticky utility chrome, not a hero moment — it doesn't compete for
// the same bold-color budget FocusCard just got. Plain white surface (like
// every other card on this screen) with navy doing its actual job — text —
// instead of filling the whole bar. The one deliberate color hit is the
// play/pause button, which is also the one thing here someone actually
// presses, matching theme.ts's "primary CTA" job for the gradient.
export const AudioPlayer = ({
  title,
  subtitle,
  isPlaying = false,
  onPress,
  onPlayPause,
  onHeightChange
}: AudioPlayerProps) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View
        style={styles.bar}
        // The bar carries its own 12pt margin, which onLayout does not include,
        // so add it back on both sides to get the real occupied footprint.
        onLayout={(e) =>
          onHeightChange?.(Math.round(e.nativeEvent.layout.height) + theme.spacing.md * 2)
        }
      >
        <View style={styles.content}>
          <View style={styles.info}>
            <View style={styles.iconContainer}>
              <Ionicons name="musical-notes" size={16} color={theme.colors.pink} />
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.md,
    margin: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    shadowColor: theme.colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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
    // Soft tint, not a solid fill — a small, specific accent rather than
    // another colored block, however small.
    backgroundColor: 'rgba(248, 0, 104, 0.1)',
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
    color: theme.colors.navy,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
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
