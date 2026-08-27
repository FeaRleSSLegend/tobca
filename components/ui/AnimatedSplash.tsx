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
//
// ---------------------------------------------------------------------------
// IT NO LONGER ENDS ON ITS OWN, and that is the point of `appReady`.
//
// Before, the sequence ran wordmark → fill → hold 420ms → fade out → onDone,
// on a fixed timeline that had nothing to do with whether the app was actually
// ready. Two failure modes fell out of that:
//
//   - if startup finished FIRST, the user sat watching a hold and a fade for
//     no reason;
//   - if startup took LONGER, the splash finished its animation and then sat
//     there completely static while the app kept loading — the "frozen splash"
//     this now fixes.
//
// So the timeline is: intro (wordmark + fill) always runs, then the mark
// BREATHES on a loop — a soft highlight passing across it, the same band
// primitive BrandLoader uses — for exactly as long as the app is still
// loading, and only then does it fade out. If the app is already ready by the
// time the intro lands, the loop never starts and it fades straight out, so
// nothing is ever waited on that does not need waiting on.

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { PINK_SWOOSH, PURPLE_SWOOSH, SwooshLayer } from './brandSwooshPaths';
import { LOGO_VIEWBOX, WORDMARK } from './brandWordmarkPaths';
import { theme } from '../../constants/theme';
import { makeThemedStyles } from '../../hooks/useTheme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const VB = LOGO_VIEWBOX;
const VIEW_BOX = `${VB.x} ${VB.y} ${VB.width} ${VB.height}`;

const WORDMARK_MS = 460;
const FILL_MS = 620;
const STAGGER_MS = 60; // matches BrandLoader
// The minimum beat between the fill landing and anything else happening, so a
// fast startup does not cut the mark off the instant it completes.
const HOLD_MS = 240;
const OUT_MS = 320;
// THE LOADING LOOP. Same rhythm as BrandLoader: a quick pass, then a rest.
// A continuous sweep at this speed is exhausting to sit next to; the pause is
// what keeps it subtle rather than busy.
const SHEEN_MS = 620;
const SHEEN_REST_MS = 900;
// Band width as a fraction of the mark, and how bright the highlight gets.
// Deliberately faint: this says "still working", it is not a feature.
const SHEEN_BAND = 0.42;
const SHEEN_OPACITY = 0.5;
// Width of the soft leading edge on the fill, in viewBox units. The rect is
// this much wider than the canvas so the gradient's opaque end fully covers.
const EDGE = 150;

interface AnimatedSplashProps {
  /**
   * Whether the app behind this is ready to be shown. The splash holds — and
   * keeps animating — until it is true, then plays its exit. Passing `true`
   * from the start simply means the exit follows the intro with no loop.
   */
  appReady: boolean;
  /** Called once the whole sequence (including fade-out) has finished. */
  onDone: () => void;
  /**
   * Logo width in points.
   *
   * This used to be pinned to app.json's splash `imageWidth` so the native
   * splash and this one drew the mark at the same size. That constraint is
   * gone: the native splash no longer carries an image at all, precisely so
   * there is only ONE logo in the launch sequence and no handoff to keep in
   * step. 220 is now just the size the mark looks right at.
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

export const AnimatedSplash = ({ appReady, onDone, width = 220 }: AnimatedSplashProps) => {
  const styles = useStyles();
  const height = Math.round(width * (VB.height / VB.width));

  const wordmark = useRef(new Animated.Value(0)).current;
  const purpleX = useRef(new Animated.Value(-EDGE)).current;
  const pinkX = useRef(new Animated.Value(-EDGE)).current;
  const screen = useRef(new Animated.Value(1)).current;
  const sheenX = useRef(new Animated.Value(-VB.width)).current;
  const [introDone, setIntroDone] = useState(false);

  // ---- 1. THE INTRO. Always runs, exactly once, and starts on mount. ----
  // Nothing gates it: it does not wait on fonts, on the theme, or on any data.
  // That is the fix for "the animation takes a while to start" — the whole
  // tree used to be held back behind a font load, so this could not even
  // mount, let alone animate, until the fonts resolved.
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

    const intro = Animated.sequence([
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
    ]);

    intro.start(({ finished }) => {
      if (finished) setIntroDone(true);
    });
    return () => intro.stop();
    // Runs once. onDone is deliberately not a dep — a caller passing an inline
    // arrow would otherwise restart the sequence on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 2. THE LOADING LOOP. Only while the app is genuinely not ready. ----
  useEffect(() => {
    if (!introDone || appReady) return;
    sheenX.setValue(-VB.width);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenX, {
          toValue: VB.width,
          duration: SHEEN_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false, // SVG prop, like every mask in this file.
        }),
        Animated.delay(SHEEN_REST_MS),
      ])
    );
    loop.start();
    // Stopped the moment the app reports ready, so the exit is not competing
    // with a running loop for the JS thread.
    return () => loop.stop();
  }, [introDone, appReady, sheenX]);

  // ---- 3. THE EXIT. Fires when the intro has landed AND the app is ready. ----
  useEffect(() => {
    if (!introDone || !appReady) return;
    const out = Animated.timing(screen, {
      toValue: 0,
      duration: OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    out.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => out.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone, appReady]);

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

            {/* THE LOADING SHEEN. A narrow band with soft edges on both sides
                — transparent, opaque, transparent — so the highlight has no
                hard line at either end. Only the mask moves; the white copies
                of the paths underneath it are static. */}
            <LinearGradient id="sheenEdge" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#fff" stopOpacity="0" />
              <Stop offset="0.5" stopColor="#fff" stopOpacity="1" />
              <Stop offset="1" stopColor="#fff" stopOpacity="0" />
            </LinearGradient>
            <Mask
              id="splashSheen"
              maskUnits="userSpaceOnUse"
              x={VB.x}
              y={VB.y}
              width={VB.width}
              height={VB.height}
            >
              <AnimatedRect
                x={sheenX}
                y={VB.y}
                width={VB.width * SHEEN_BAND}
                height={VB.height}
                fill="url(#sheenEdge)"
              />
            </Mask>
          </Defs>

          {/* Purple beneath pink, matching the logo's own stacking order. */}
          <G mask="url(#splashPurple)">
            <Layers layers={PURPLE_SWOOSH} />
          </G>
          <G mask="url(#splashPink)">
            <Layers layers={PINK_SWOOSH} />
          </G>

          {/* White copies of both swooshes, visible only where the travelling
              band lets them through. Drawn last so the highlight sits ON the
              filled colour. Costs nothing while the loop is idle: the band is
              parked off-canvas, so the mask clips everything away. */}
          <G mask="url(#splashSheen)" opacity={SHEEN_OPACITY}>
            <Layers layers={PURPLE_SWOOSH.map((l) => ({ ...l, fill: '#FFFFFF' }))} />
            <Layers layers={PINK_SWOOSH.map((l) => ({ ...l, fill: '#FFFFFF' }))} />
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

const useStyles = makeThemedStyles((c) => ({
  screen: {
    // Written out rather than spreading absoluteFillObject, which this RN
    // version's types don't expose.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Follows the appearance. A white full-screen splash flashing before a
    // dark app is the most jarring frame the app can show, and it was doing
    // it on every cold start in dark mode. app.json's native splash has a
    // matching `dark` variant so the handoff is invisible in both themes.
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
    // Above everything, including the player host overlay.
    zIndex: 1000,
  },
}));
