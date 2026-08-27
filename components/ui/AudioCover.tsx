// components/ui/AudioCover.tsx
// The SERIES COVER — a designed poster, not a generated pattern.
//
// WHAT THIS REPLACES AND WHY
// Series cards used to wear the same machinery as individual recordings: a
// hashed duotone with a hashed sine-wave figure. Per-item variety is the right
// answer for 254 unrelated standalone recordings, where the artwork's job is
// to keep them apart. It is the wrong answer for a series, whose artwork's job
// is the opposite — to say "this is a titled body of teaching, published by
// this church". A procedural gradient says neither of those things; it reads
// as a placeholder that has not been designed yet.
//
// So a series gets a cover, built the way a real one is: a ground, the
// publisher's mark, and the title set as type. Nothing is random. The palette
// is chosen by a hash of the series title, so a given series always renders
// exactly the same cover — on every device, on every load, forever — which is
// what lets it be recognised rather than merely looked at.
//
// THE TEMPLATE
//   ground     one of five deep duotones, all dark enough that white type sits
//              on them at full contrast wherever it lands
//   watermark  the OliveBrook mark, oversized and very faint, bleeding off the
//              right edge — texture, and the only thing here that varies
//              across the surface
//   mark       the OliveBrook mark, small and solid, top-left, exactly where a
//              publisher's logo goes on a book jacket
//   title      the series name, in the display face, tight-tracked, up to
//              three lines
//
// Everything scales from `width`, so one template serves a 148pt shelf card
// and a 300pt player hero without a second set of numbers.

import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { BrandMark } from './BrandMark';
import { hashSeed } from '../../utils/audioArtwork';

interface CoverPalette {
  from: string;
  to: string;
}

// All five sit on the brand's own axis — pink, purple, navy and the blends
// between them — dark enough that white type is legible at every point without
// a scrim. A cover that needed one would be a cover that had not been
// designed, just tinted.
//
// TUNED AFTER LOOKING AT A REAL SHELF. The first set was five variations on
// dark plum: correct on paper, and on device three adjacent covers were
// indistinguishable, which defeats the entire point of a per-series palette.
// These separate by HUE first — violet, rose, blue, wine, indigo — and the top
// stop is lightened until the hue is actually readable at 148pt. Every `from`
// still clears 7:1 against white, so the type is unaffected.
const COVER_PALETTES: CoverPalette[] = [
  { from: '#5B2A9E', to: '#160E2E' }, // violet
  { from: '#A3125A', to: '#2A0B22' }, // rose
  { from: '#14406B', to: '#1B1038' }, // blue
  { from: '#7A1533', to: '#241019' }, // wine
  { from: '#3D1F7A', to: '#0E1B2A' }, // indigo
];

export function coverPalette(title: string): CoverPalette {
  return COVER_PALETTES[hashSeed(`cover:${title}`) % COVER_PALETTES.length];
}

interface AudioCoverProps {
  /** The series title. Both the displayed type and the palette seed. */
  title: string;
  width: number;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const AudioCover = ({
  title,
  width,
  height,
  radius = theme.radius.sm,
  style,
  children,
}: AudioCoverProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  const palette = coverPalette(title);

  // One scale factor off the shelf-card width, so the hero is the same design
  // enlarged rather than a second layout that happens to look similar.
  const scale = width / theme.layout.rowCard.width;
  const pad = Math.round(8 * Math.min(scale, 2.2));
  const titleSize = Math.max(10, Math.round(11 * Math.min(scale, 2.6)));
  const markWidth = Math.round(width * 0.26);

  return (
    <View
      style={[styles.box, { width, height, borderRadius: radius }, style]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={[palette.from, palette.to] as const}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Watermark. Positioned off the right edge so it is a texture the type
          sits on rather than a second logo competing with the real one. */}
      <BrandMark
        width={width * 1.35}
        tint={c.white}
        opacity={0.07}
        style={{ position: 'absolute', right: -width * 0.3, top: height * 0.18 }}
      />

      <View style={[styles.inner, { padding: pad }]}>
        <BrandMark width={markWidth} tint={c.white} opacity={0.9} />
        <Text
          style={[
            styles.title,
            {
              fontSize: titleSize,
              lineHeight: Math.round(titleSize * 1.24),
            },
          ]}
          numberOfLines={3}
        >
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  box: {
    // Clips the gradient and the bleeding watermark to the rounded corners.
    overflow: 'hidden',
    backgroundColor: c.navy,
  },
  inner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Mark at the top, title at the bottom — the jacket layout, and the one
    // that keeps the title's baseline predictable however many lines it takes.
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: theme.fontFamily.display,
    color: c.white,
    // Large type set tight, per the editorial scale. The title IS the cover,
    // so it is allowed to be the loudest thing on it.
    letterSpacing: theme.editorial.trackTight,
  },
}));
