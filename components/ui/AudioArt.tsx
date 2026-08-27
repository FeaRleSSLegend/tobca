// components/ui/AudioArt.tsx
// The artwork for audio items, in the three treatments the Audio mode uses.
//
//   variant="track"   a derived duotone with a derived wave figure, different
//                     for every recording. See utils/audioArtwork.ts for the
//                     rule: palette and curve both come from a hash of the
//                     item's series label (or its title when it has none), so
//                     a series shares a colour, unrelated recordings drift
//                     apart, and the same item draws the same tile forever.
//
//   variant="hero"    the full player's artwork: the track's own duotone and
//                     wave, with the OliveBrook mark reversed out over it. The
//                     brief asks the player to wear the logo treatment scaled
//                     up; keeping the ITEM's palette under it means the player
//                     is still visibly the same object you tapped in the list,
//                     which a pure logo plate would throw away.
//
// This is the fix for "one asset copy-pasted N times". A shelf of six track
// cards is now six different colours and six different curves.
//
// SERIES DO NOT USE THIS. They have a designed cover instead — see
// components/ui/AudioCover. Procedural artwork is right for 254 unrelated
// standalone recordings, whose artwork exists to keep them apart, and wrong
// for a titled body of teaching, whose artwork exists to name it.
//
// MEMOISED, and that matters more than it looks: every render of this
// component would otherwise regenerate three SVG paths (see the cache note in
// utils/audioArtwork). React.memo stops the twenty-odd tiles on the Library's
// audio page re-rendering when an unrelated piece of parent state moves.

import { memo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { BrandMark } from './BrandMark';
import { paletteFor, waveBands } from '../../utils/audioArtwork';

export type AudioArtVariant = 'track' | 'hero';

interface AudioArtProps {
  /** From artSeed(title, seriesLabel) — never a raw title at the call site. */
  seed: string;
  width: number;
  height: number;
  variant?: AudioArtVariant;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Badges, play glyphs, scrims — anything drawn over the artwork. */
  children?: React.ReactNode;
}

const AudioArtBase = ({
  seed,
  width,
  height,
  variant = 'track',
  radius = theme.radius.sm,
  style,
  children,
}: AudioArtProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  const palette = paletteFor(seed);

  return (
    <View
      style={[
        styles.box,
        { width, height, borderRadius: radius },
        style,
      ]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={[palette.from, palette.to] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* The wave sits at the BOTTOM of the box as a horizon rather than
          centred as an icon. Centred, it competes with the play badge and
          with the title beneath; as a horizon it is a ground the card sits on,
          and it stays legible when the card is cropped by a scroll edge. */}
      {(
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          {waveBands(seed, width, height).map((band, i) => (
            <Path key={i} d={band.d} fill={palette.ink} fillOpacity={band.opacity} />
          ))}
        </Svg>
      )}

      {variant === 'hero' && (
        <BrandMark
          // Just over half the box. At 300pt a larger fraction would be a
          // billboard, and the hero's job is to be calm, not loud.
          width={Math.round(width * 0.52)}
          tint={c.white}
          opacity={0.85}
        />
      )}

      {children}
    </View>
  );
};

/**
 * Memoised on props. All of them are primitives except `style` and `children`,
 * and callers pass those as stable StyleSheet entries or small static nodes,
 * so the default shallow compare is the right one.
 */
export const AudioArt = memo(AudioArtBase);

const useStyles = makeThemedStyles((c) => ({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    // Clips the gradient and the wave to the rounded corners. Without it the
    // wave's square SVG canvas paints over them on Android.
    overflow: 'hidden',
    backgroundColor: c.mediaPlaceholder,
  },
}));
