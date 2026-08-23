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
// TWO KINDS OF CARD, TWO KINDS OF ARTWORK
//
//   variant="track"   AudioArt: a per-item duotone and wave curve, derived
//                     from the item so a Recent shelf is six visibly
//                     different things rather than one tile printed six times.
//                     The title sits BELOW the art, as on every video card.
//
//   variant="series"  AudioCover: a designed poster carrying the OliveBrook
//                     mark and the series title as type. The title is ON the
//                     cover, so it is not repeated underneath — the caption is
//                     just the count, which is how an album shelf reads and
//                     what keeps the same words from appearing twice in 83pt
//                     of vertical space.

import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale } from './motion';
import { AudioArt } from './AudioArt';
import { AudioCover } from './AudioCover';
import { PlayingBars } from './PlayingBars';
import { artSeed } from '../../utils/audioArtwork';

interface AudioPosterCardProps {
  title: string;
  /** "6 messages" for a series, a date for a single recording. */
  subtitle: string;
  variant?: 'track' | 'series';
  /**
   * The series a TRACK belongs to, when it belongs to one. Only used to seed
   * the artwork, so every part of a series shares a palette on the shelf.
   */
  series?: string | null;
  isActive?: boolean;
  isPlaying?: boolean;
  onPress?: () => void;
}

const AudioPosterCardBase = ({
  title,
  subtitle,
  variant = 'track',
  series,
  isActive = false,
  isPlaying = false,
  onPress,
}: AudioPosterCardProps) => {
  const badge = (
    // A badge rather than PosterCard's centred glyph: the artwork already owns
    // the middle of this box, and a glyph on top of it would read as two marks
    // fighting for the same space.
    <View style={styles.badge}>
      {isActive ? (
        <PlayingBars animating={isPlaying} color={theme.colors.white} size={11} />
      ) : (
        // Always 'play' — only track cards carry this badge now.
        <Ionicons name="play" size={12} color={theme.colors.white} />
      )}
    </View>
  );

  return (
    <PressableScale
      style={styles.wrapper}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${title}, ${subtitle}${variant === 'series' ? '' : ', audio'}`}
    >
      {variant === 'series' ? (
        // NO BADGE on a cover. The badge sits bottom-right and the cover's
        // title sits bottom-left across up to three lines, so on any series
        // whose name reaches the corner the glyph lands on the words. It is
        // also redundant here in a way it is not on a track card: a cover
        // carrying the mark and the title over "17 messages" is already
        // unmistakably a collection, and a designed poster should not have
        // furniture bolted to it.
        <AudioCover
          title={title}
          width={theme.layout.rowCard.width}
          height={theme.layout.rowCard.height}
          style={styles.art}
        />
      ) : (
        <AudioArt
          seed={artSeed(title, series)}
          width={theme.layout.rowCard.width}
          height={theme.layout.rowCard.height}
          style={styles.art}
        >
          {badge}
        </AudioArt>
      )}

      {/* The series title is already set on its cover — repeating it here
          would print the same words twice inside 100pt. */}
      {variant === 'track' && (
        <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={2}>
          {title}
        </Text>
      )}
      <Text style={styles.subtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </PressableScale>
  );
};

/** Memoised: a shelf card's props are primitives, and its artwork is generated. */
export const AudioPosterCard = memo(AudioPosterCardBase);

const styles = StyleSheet.create({
  wrapper: {
    width: theme.layout.rowCard.width,
  },
  art: {
    marginBottom: theme.spacing.sm,
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    // The same scrim recipe GridCard and GroupCard use for their badges.
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: theme.radius.full,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Identical to PosterCard's — same family, same tokens.
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.navy,
    lineHeight: 16,
  },
  titleActive: {
    color: theme.colors.pink,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: theme.space.hairline,
  },
});
