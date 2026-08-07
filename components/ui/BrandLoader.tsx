// components/ui/BrandLoader.tsx
// Branded skeleton shimmer. The swooshes DO NOT MOVE — they sit still as a
// faint unfilled shell, and a soft highlight band sweeps left→right across
// them, lighting each part to full brand colour as it passes and letting it
// fall back to the ghost behind it. The mark appears to fill with its own
// colour and empty again, continuously.
//
// The paths are the real swooshes lifted out of assets/brand-logo.svg (see
// brandSwooshPaths.ts for how they were isolated from the wordmark), so this
// is the logo shimmering, not an approximation of it.
//
// HOW THE FILL WORKS
// Two copies of the same paths are stacked inside one <Svg>:
//   1. the ghost — full colour at GHOST_OPACITY, always visible;
//   2. the lit copy — full colour, masked by a gradient band.
// The mask's band is transparent → opaque → transparent, so its edges are soft
// and the fill/unfill is a sweep rather than a wipe with a hard line. Only the
// MASK translates; both path copies are static, which is the whole point.
//
// A single <Svg> is used rather than two stacked ones so the ghost and the lit
// copy are guaranteed to be in exact registration — any sub-pixel disagreement
// between two separately-laid-out SVGs would show up as a coloured fringe
// around the shape.

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { PINK_SWOOSH, PURPLE_SWOOSH, SWOOSH_VIEWBOX, SwooshLayer } from './brandSwooshPaths';

// ON useNativeDriver
// The band is moved by animating the mask rect's `x`, which is an SVG PROP, and
// the native driver only drives view style props — so this one animation runs
// on the JS thread. That is a deliberate trade, not an oversight:
// react-native-svg 15's <G> does not accept `style` at all (its types have no
// such prop), so there is no view-transform anywhere inside an <Svg> to hand to
// the native driver. The alternatives were to drop the gradient mask and get a
// hard-edged band, or to take on @react-native-masked-view — and the fill
// effect specified here needs the soft edge.
//
// It is an acceptable trade HERE specifically because of what this component
// waits on: network I/O. During a fetch the JS thread is idle, so a one-rect
// per-frame update has room to run. Do not reuse this pattern behind
// CPU-bound work, where it would stutter exactly when it mattered.
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Faint enough to read as "not filled yet", solid enough that the mark is still
// legible while the band is elsewhere.
const GHOST_OPACITY = 0.22;
// Band width as a fraction of the mark. Wide and soft — a narrow band reads as
// a glare streak rather than the shape filling up.
const BAND_RATIO = 0.55;
const SWEEP_MS = 1100;
// The band is fully off-canvas at both ends of the sweep, so restarting is
// invisible; this pause just stops it feeling relentless.
const REST_MS = 260;

interface BrandLoaderProps {
  style?: StyleProp<ViewStyle>;
  /** Rendered width in points; height follows the mark's own aspect ratio. */
  width?: number;
  /**
   * Force a single colour for both the ghost and the lit copy. The brand pink
   * and purple disappear against the Plan hero's pink→purple gradient, so that
   * surface passes white.
   */
  tint?: string;
}

const VB = SWOOSH_VIEWBOX;
const VIEW_BOX = `${VB.x} ${VB.y} ${VB.width} ${VB.height}`;

function Swooshes({ tint }: { tint?: string }) {
  const layer = (l: SwooshLayer, i: number, key: string) => (
    <Path key={`${key}${i}`} d={l.d} fill={tint ?? l.fill} fillOpacity={l.opacity} />
  );
  return (
    <>
      {/* Purple under pink, matching the logo's own stacking order. */}
      {PURPLE_SWOOSH.map((l, i) => layer(l, i, 'u'))}
      {PINK_SWOOSH.map((l, i) => layer(l, i, 'p'))}
    </>
  );
}

export const BrandLoader = ({ style, width = 132, tint }: BrandLoaderProps) => {
  const height = Math.round(width * (VB.height / VB.width));

  const band = VB.width * BAND_RATIO;
  // Start fully clear of the left edge, finish fully clear of the right.
  const travel = VB.width + band;

  // Animated in viewBox units: from fully clear of the left edge to fully clear
  // of the right.
  const bandX = useRef(new Animated.Value(VB.x - band)).current;

  useEffect(() => {
    bandX.setValue(VB.x - band);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bandX, {
          toValue: VB.x - band + travel,
          duration: SWEEP_MS,
          // Linear: an eased sweep would visibly slow at the edges, and the
          // edges are exactly where the loop restarts.
          easing: Easing.linear,
          useNativeDriver: false, // SVG prop, not a view style — see note above.
        }),
        Animated.delay(REST_MS),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [bandX, band, travel]);

  return (
    <View
      style={[{ width, height }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <Svg width={width} height={height} viewBox={VIEW_BOX}>
        <Defs>
          {/* Soft-edged highlight: invisible at both ends, solid in the middle. */}
          <LinearGradient id="bandGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#fff" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#fff" stopOpacity="1" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>

          <Mask id="shimmerMask" maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.width} height={VB.height}>
            <AnimatedRect
              x={bandX}
              y={VB.y}
              width={band}
              height={VB.height}
              fill="url(#bandGradient)"
            />
          </Mask>
        </Defs>

        {/* 1. The unfilled shell. */}
        <G opacity={GHOST_OPACITY}>
          <Swooshes tint={tint} />
        </G>

        {/* 2. Full colour, revealed only where the band currently is. */}
        <G mask="url(#shimmerMask)">
          <Swooshes tint={tint} />
        </G>
      </Svg>
    </View>
  );
};
