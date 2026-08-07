// components/ui/AnimatedSplash.tsx
// The launch animation, shown over the app once the native splash hands off.
//
// Sequence, in the order the logo is built:
//   1. the wordmark fades up from nothing, rising a few points as it arrives;
//   2. the two swooshes FILL left→right — not a highlight passing over them,
//      an actual wipe that leaves colour behind. Purple leads, pink follows by
//      the same 60ms used in BrandLoader, so the pair reads as layered.
//   3. a beat, then the whole thing fades out and the app is revealed.
//
// The fill is the distinction from BrandLoader: there the mask is a narrow band
// that lights a region and moves on, so the shape empties again. Here the mask
// is a full-width rect with a soft LEADING edge that sweeps in from the left —
// everything it has already passed stays covered, so colour accumulates and
// stays. Same primitive, opposite intent.

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { PINK_SWOOSH, PURPLE_SWOOSH, SwooshLayer } from './brandSwooshPaths';
import { LOGO_VIEWBOX, WORDMARK } from './brandWordmarkPaths';
import { theme } from '../../constants/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const VB = LOGO_VIEWBOX;
const VIEW_BOX = `${VB.x} ${VB.y} ${VB.width} ${VB.height}`;

const WORDMARK_MS = 460;
const FILL_MS = 620;
const STAGGER_MS = 60; // matches BrandLoader
const HOLD_MS = 420;
const OUT_MS = 320;
// Width of the soft leading edge on the fill, in viewBox units. The rect is
// this much wider than the canvas so the gradient's opaque end fully covers.
const EDGE = 150;

interface AnimatedSplashProps {
  /** Called once the whole sequence (including fade-out) has finished. */
  onDone: () => void;
  /**
   * Logo width in points. Defaults to 220 to MATCH app.json's splash
   * `imageWidth` — the native splash and this one draw the same mark on the
   * same white, so any difference in size makes the handoff between them a
   * visible jump rather than an invisible swap. Keep the two in step.
   */
  width?: number;
}

function Layers({ layers }: { layers: SwooshLayer[] }) {
  return (
    <>
      {layers.map((l, i) => (
        <Path key={i} d={l.d} fill={l.fill} fillOpacity={l.opacity} />
      ))}
    </>
  );
}

export const AnimatedSplash = ({ onDone, width = 220 }: AnimatedSplashProps) => {
  const height = Math.round(width * (VB.height / VB.width));

  const wordmark = useRef(new Animated.Value(0)).current;
  const purpleX = useRef(new Animated.Value(-EDGE)).current;
  const pinkX = useRef(new Animated.Value(-EDGE)).current;
  const screen = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fill = (v: Animated.Value) =>
      Animated.timing(v, {
        toValue: VB.width,
        duration: FILL_MS,
        // Ease-out: the fill arrives quickly and settles, rather than running
        // at constant speed into the end of the stroke.
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // SVG prop — same constraint as BrandLoader.
      });

    const seq = Animated.sequence([
      Animated.timing(wordmark, {
        toValue: 1,
        duration: WORDMARK_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        fill(purpleX),
        Animated.sequence([Animated.delay(STAGGER_MS), fill(pinkX)]),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(screen, {
        toValue: 0,
        duration: OUT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    seq.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => seq.stop();
    // onDone is intentionally not a dep: this sequence must run exactly once,
    // and a caller passing an inline arrow would otherwise restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordmarkStyle = {
    opacity: wordmark,
    transform: [
      { translateY: wordmark.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };

  const fillMask = (id: string, x: Animated.Value) => (
    <Mask id={id} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.width} height={VB.height}>
      {/* Opaque behind the leading edge, fading out ahead of it — so the wipe
          has a soft front and leaves everything behind it filled. */}
      <AnimatedRect x={x} y={VB.y} width={VB.width + EDGE} height={VB.height} fill="url(#edge)" />
    </Mask>
  );

  return (
    // Swallows touches rather than passing them through: the app is fully
    // mounted and live underneath, so a tap during the animation would
    // otherwise land on whatever happens to be behind it.
    <Animated.View style={[styles.screen, { opacity: screen }]}>
      <View style={{ width, height }}>
        <Svg width={width} height={height} viewBox={VIEW_BOX}>
          <Defs>
            <LinearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#fff" stopOpacity="1" />
              {/* The gradient sits at the rect's RIGHT end, which is the
                  direction of travel — everything left of it is already solid. */}
              <Stop offset={`${1 - EDGE / (VB.width + EDGE)}`} stopColor="#fff" stopOpacity="1" />
              <Stop offset="1" stopColor="#fff" stopOpacity="0" />
            </LinearGradient>
            {fillMask('splashPurple', purpleX)}
            {fillMask('splashPink', pinkX)}
          </Defs>

          {/* Purple beneath pink, matching the logo's own stacking order. */}
          <G mask="url(#splashPurple)">
            <Layers layers={PURPLE_SWOOSH} />
          </G>
          <G mask="url(#splashPink)">
            <Layers layers={PINK_SWOOSH} />
          </G>
        </Svg>

        {/* Wordmark drawn in its own overlaid Svg so its fade is a plain view
            opacity on the native driver, rather than an animated SVG prop. */}
        <Animated.View style={[StyleSheet.absoluteFill, wordmarkStyle]}>
          <Svg width={width} height={height} viewBox={VIEW_BOX}>
            <Layers layers={WORDMARK} />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    // Written out rather than spreading absoluteFillObject, which this RN
    // version's types don't expose.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    // Above everything, including the player host overlay.
    zIndex: 1000,
  },
});
