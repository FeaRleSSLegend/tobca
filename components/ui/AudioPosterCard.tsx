// components/ui/AudioPosterCard.tsx
// The audio shelf card — PosterCard's twin for content that has no thumbnail.
//
// Every metric here is PosterCard's, taken from the same tokens rather than
// re-chosen: theme.layout.rowCard width and derived 16:9 height, the same 8pt
// gap under the art, the same 12pt bold title on two lines over a 12pt grey
// subtitle. Put an audio shelf next to a video shelf and the card edges,
// baselines and scroll peek line up exactly, which is the whole point — Audio
// should read as a sibling of Video, not as a different app's screen.
//
// The ONE deliberate difference is what fills the art box. There is no frame
// to grab from an mp3, so instead of a fake thumbnail it carries the waveform
// mark already established by AudioRow: the same bar figure, the same pink
// accent, on the brand gradient wash PosterCard falls back to when a video has
// no thumbnail. That keeps "this is sound, not video" legible at shelf size
// without inventing a second audio visual language.

import { Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale } from './motion';

interface AudioPosterCardProps {
  title: string;
  /** "6 messages" for a series, a date for a single recording. */
  subtitle: string;
  /** Series cards get a stack glyph, single recordings a play/pause one. */
  variant?: 'track' | 'series';
  isPlaying?: boolean;
  onPress?: () => void;
}

// Same figure as AudioRow's tile, widened for a 16:9 box. A fixed pattern, not
// random heights: random would imply these bars are real amplitude data for
// this particular file, which they are not.
const BARS = [0.3, 0.55, 0.85, 0.45, 1, 0.7, 0.4, 0.9, 0.6, 0.35, 0.75, 0.5];

export const AudioPosterCard = ({
  title,
  subtitle,
  variant = 'track',
  isPlaying = false,
  onPress,
}: AudioPosterCardProps) => (
  <PressableScale
    style={styles.wrapper}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: isPlaying }}
    accessibilityLabel={`${title}, ${subtitle}${variant === 'series' ? '' : ', audio'}`}
  >
    <View style={styles.art}>
      <LinearGradient
        colors={['rgba(248,0,104,0.35)', 'rgba(200,32,248,0.25)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bars}>
        {BARS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: `${Math.round(h * 100)}%`,
                backgroundColor: h >= 0.8 ? theme.colors.white : 'rgba(255,255,255,0.55)',
              },
            ]}
          />
        ))}
      </View>
      {/* A badge rather than PosterCard's centred glyph: the waveform already
          owns the middle of this box, and a glyph on top of it would read as
          two marks fighting for the same space. */}
      <View style={styles.badge}>
        <Ionicons
          name={variant === 'series' ? 'albums' : isPlaying ? 'pause' : 'play'}
          size={12}
          color={theme.colors.white}
        />
      </View>
    </View>
    <Text style={styles.title} numberOfLines={2}>
      {title}
    </Text>
    <Text style={styles.subtitle} numberOfLines={1}>
      {subtitle}
    </Text>
  </PressableScale>
);

const styles = StyleSheet.create({
  wrapper: {
    width: theme.layout.rowCard.width,
  },
  art: {
    width: theme.layout.rowCard.width,
    height: theme.layout.rowCard.height,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.slate,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '52%',
    width: '68%',
  },
  bar: {
    flex: 1,
    borderRadius: theme.radius.full,
    minHeight: 3,
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    // The same scrim recipe GridCard and GroupCard use for their badges.
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: theme.radius.full,
    padding: 5,
  },
  // Identical to PosterCard's — same family, same tokens.
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
    marginTop: theme.space.hairline,
  },
});
