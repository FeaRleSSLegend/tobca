// components/ui/BrandLoader.tsx
// Branded skeleton shimmer. The swooshes DO NOT MOVE — they sit still as faint
// unfilled shells, and a soft highlight streaks left→right across them, lighting
// each part to full brand colour as it passes before it falls back to the ghost
// behind it. The mark appears to fill with its own colour and empty again.
//
// The paths are the real swooshes lifted out of assets/brand-logo.svg (see
// brandSwooshPaths.ts for how they were isolated from the wordmark), so this is
// the logo shimmering, not an approximation of it.
//
// RHYTHM: a fast pass, then a hold. The streak covers the mark in ~480ms and
// then nothing happens for ~800ms. Speed is what makes it read as a glint
// rather than a lazy crawl, and the pause is what keeps a fast movement from
// feeling frantic — a continuous sweep at this speed would be exhausting to sit
// next to. The two swooshes are also staggered by ~60ms so the highlight hits
// the pink just after the purple; they read as two layered strokes rather than
// one rigid block.
//
// HOW THE FILL WORKS
// Each swoosh is drawn four times inside one <Svg>: a ghost at GHOST_OPACITY
// that is always visible, a full-colour copy masked by a gradient band, and two
// white copies masked by narrower bands that put a silver glint on the crest.
// Every band's stops run transparent → opaque → transparent, so the edges are
// soft and the fill/unfill is a sweep, not a wipe with a hard line. Only the
// MASKS move — every path copy is static, which is the whole point.
//
// A single <Svg> is used rather than stacked ones so the ghost and lit copies
// are guaranteed to be in exact registration; any sub-pixel disagreement
// between separately laid-out SVGs shows up as a coloured fringe on the shape.

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { PINK_SWOOSH, PURPLE_SWOOSH, SWOOSH_VIEWBOX, SwooshLayer } from './brandSwooshPaths';

// ON useNativeDriver
// The band is moved by animating the mask rect's `x`, an SVG PROP, so this runs
// on the JS thread. react-native-svg 15's <G> accepts no `style` prop at all, so
// there is no view transform anywhere inside an <Svg> for the native driver to
// take — the choice was this, a hard-edged band, or a new masking dependency,
// and the soft edge is the effect. It costs little here: the component waits on
// network I/O (an idle JS thread), and post-refinement it is only animating for
// ~480ms in every ~1290ms cycle. Don't reuse the pattern behind CPU-bound work.
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Faint enough to read as "not filled yet", solid enough to stay legible while
// the band is elsewhere.
const GHOST_OPACITY = 0.22;
// Band width as a fraction of the mark. A narrow band reads as a glare streak
// rather than the shape filling; this is wide enough to feel like a fill and
// tight enough to still be a glint.
const BAND_RATIO = 0.5;

// THE SILVER GLINT
// Two white layers ride on top of the lit brand colour, both centred in the
// band: a wide, faint BLOOM and a narrow, bright CORE. White over saturated
// pink/purple desaturates the crest toward metal, and the bloom-to-core falloff
// is what sells it as light sitting ON the surface rather than the surface just
// being paler — the difference between polished metal and pastel.
//
// This started as a single white layer with an SVG <Filter>/<FeGaussianBlur>,
// which would have let the light bleed OUTSIDE the stroke for a true glow. On
// Android, react-native-svg 15.15.4 renders nothing at all for a filtered <G>
// nested inside a masked <G> — verified by screenshotting with and without the
// filter: the core is plainly visible once the filter is removed, and vanishes
// entirely with it. Two graded layers get most of the way there without
// depending on filter support; the light stays inside the stroke, which on a
// shape this thin reads as a glow anyway.
const BLOOM_RATIO = 0.72; // of the band width
const BLOOM_OPACITY = 0.32;
const CORE_RATIO = 0.26;
const CORE_OPACITY = 0.9;

const SWEEP_MS = 480; // the streak
const REST_MS = 810; // the hold, ghost sitting still
// Purple leads, pink follows. Tightened from 110ms: at that gap the two reads
// as two separate passes, and the effect wants to be one glint with depth. Low
// enough now that they overlap for most of the sweep — you feel the layering
// rather than counting two events.
const STAGGER_MS = 60;

interface BrandLoaderProps {
  style?: StyleProp<ViewStyle>;
  /** Rendered width in points; height follows the mark's own aspect ratio. */
  width?: number;
  /**
   * Force a single colour for both ghost and lit copies. The brand pink and
   * purple disappear against the Plan hero's pink→purple gradient, so that
   * surface passes white.
   */
  tint?: string;
}

const VB = SWOOSH_VIEWBOX;
const VIEW_BOX = `${VB.x} ${VB.y} ${VB.width} ${VB.height}`;

// SVG ids are not automatically scoped per <Svg> on native, so two loaders on
// one screen sharing an id can resolve each other's mask. That was invisible
// while both bands ran in lockstep and becomes a real bug now they're
// staggered — hence a per-instance suffix.
let instanceCount = 0;

function Layers({ layers, tint }: { layers: SwooshLayer[]; tint?: string }) {
  return (
    <>
      {layers.map((l, i) => (
        <Path key={i} d={l.d} fill={tint ?? l.fill} fillOpacity={l.opacity} />
      ))}
    </>
  );
}

export const BrandLoader = ({ style, width = 132, tint }: BrandLoaderProps) => {
  const height = Math.round(width * (VB.height / VB.width));
  const [uid] = useState(() => `bl${++instanceCount}`);

  const band = VB.width * BAND_RATIO;
  const startX = VB.x - band; // fully clear of the left edge
  const endX = VB.x + VB.width; // fully clear of the right edge

  const purpleX = useRef(new Animated.Value(startX)).current;
  const pinkX = useRef(new Animated.Value(startX)).current;

  useEffect(() => {
    // One cycle: streak across, then hold off-canvas. Both swooshes use the
    // same cycle length, so the stagger applied once at the start stays
    // constant for every subsequent pass instead of drifting.
    const cycle = (value: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: endX,
            duration: SWEEP_MS,
            // Linear: constant velocity is what makes it a streak. Easing would
            // decelerate it into the right edge, which is the opposite feel.
            easing: Easing.linear,
            useNativeDriver: false, // SVG prop, not a view style — see note above.
          }),
          Animated.delay(REST_MS),
        ])
      );

    purpleX.setValue(startX);
    pinkX.setValue(startX);

    const purple = cycle(purpleX);
    // Pink is held back once; from then on its loop runs at the same period.
    const pink = Animated.sequence([Animated.delay(STAGGER_MS), cycle(pinkX)]);

    purple.start();
    pink.start();
    return () => {
      purple.stop();
      pink.stop();
    };
  }, [purpleX, pinkX, startX, endX]);

  const gradientId = `${uid}band`;
  const maskId = (swoosh: string, layer: string) => `${uid}${swoosh}${layer}`;

  // All three bands (lit, bloom, core) are centred on the same animated x, so
  // one animation per swoosh keeps every layer locked together.
  const rectFor = (x: Animated.Value, ratio: number) => {
    const w = band * ratio;
    return (
      <AnimatedRect
        x={ratio === 1 ? x : Animated.add(x, (band - w) / 2)}
        y={VB.y}
        width={w}
        height={VB.height}
        fill={`url(#${gradientId})`}
      />
    );
  };

  const maskDef = (name: string, layer: string, x: Animated.Value, ratio: number) => (
    <Mask
      key={`${name}${layer}`}
      id={maskId(name, layer)}
      maskUnits="userSpaceOnUse"
      x={VB.x}
      y={VB.y}
      width={VB.width}
      height={VB.height}
    >
      {rectFor(x, ratio)}
    </Mask>
  );

  // ghost → lit brand colour → wide faint bloom → narrow bright core.
  const swooshStack = (name: string, layers: SwooshLayer[]) => (
    <G key={name}>
      <G opacity={GHOST_OPACITY}>
        <Layers layers={layers} tint={tint} />
      </G>
      <G mask={`url(#${maskId(name, 'band')})`}>
        <Layers layers={layers} tint={tint} />
      </G>
      <G mask={`url(#${maskId(name, 'bloom')})`} opacity={BLOOM_OPACITY}>
        <Layers layers={layers} tint="#FFFFFF" />
      </G>
      <G mask={`url(#${maskId(name, 'core')})`} opacity={CORE_OPACITY}>
        <Layers layers={layers} tint="#FFFFFF" />
      </G>
    </G>
  );

  return (
    <View
      style={[{ width, height }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <Svg width={width} height={height} viewBox={VIEW_BOX}>
        <Defs>
          {/* Soft-edged highlight: invisible at both ends, solid in the middle. */}
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#fff" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#fff" stopOpacity="1" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>

          {/* One mask per swoosh PER LAYER — separate masks per swoosh are what
              allow the stagger; separate widths are what grade the glint. */}
          {maskDef('purple', 'band', purpleX, 1)}
          {maskDef('purple', 'bloom', purpleX, BLOOM_RATIO)}
          {maskDef('purple', 'core', purpleX, CORE_RATIO)}
          {maskDef('pink', 'band', pinkX, 1)}
          {maskDef('pink', 'bloom', pinkX, BLOOM_RATIO)}
          {maskDef('pink', 'core', pinkX, CORE_RATIO)}
        </Defs>

        {/* Purple beneath pink, matching the logo's own stacking order. */}
        {swooshStack('purple', PURPLE_SWOOSH)}
        {swooshStack('pink', PINK_SWOOSH)}
      </Svg>
    </View>
  );
};
