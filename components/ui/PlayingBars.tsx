// components/ui/PlayingBars.tsx
// The "this row is the one playing" indicator: three bars rising and falling.
//
// WHY MOTION RATHER THAN A PAUSE GLYPH
// A compact list row already carries a play control, and swapping that glyph
// to a pause bar says "tap here to pause" — useful, but it does not answer the
// question a scannable list actually raises, which is "where in this list am
// I". A moving mark is the only thing on a still page that the eye finds
// without being told where to look, which is exactly the job. The glyph swap
// stays too; they answer different questions.
//
// It STOPS when playback is paused rather than unmounting: a paused track is
// still the current one, and losing the marker on pause would make the list
// forget where you are the moment you stop to think.

import { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface PlayingBarsProps {
  /** Animating (true) vs held at rest (false, i.e. paused). */
  animating?: boolean;
  color?: string;
  size?: number;
}

// Three bars, each with its own period, so they never line up into a single
// pulsing block. Prime-ish ratios keep the pattern from visibly repeating.
const PERIODS = [520, 700, 610];
const REST = [0.4, 0.75, 0.5];

export const PlayingBars = ({
  animating = true,
  color = theme.colors.pink,
  size = 14,
}: PlayingBarsProps) => {
  // One value per bar, animating between a floor and 1 as a SCALE — scaleY on
  // the native driver, rather than height, which cannot use it and would put a
  // layout pass on the JS thread twice a second per visible row.
  const values = useRef(REST.map((r) => new Animated.Value(r))).current;

  useEffect(() => {
    if (!animating) {
      const settle = values.map((v, i) =>
        Animated.timing(v, {
          toValue: REST[i],
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
      Animated.parallel(settle).start();
      return;
    }

    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: PERIODS[i],
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.28,
            duration: PERIODS[i],
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [animating, values]);

  return (
    <View
      style={[styles.wrap, { height: size, width: size }]}
      accessibilityLabel={animating ? 'Now playing' : 'Paused'}
    >
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: size,
              // Anchored to the BOTTOM: a bar that scales about its centre
              // grows in both directions and reads as a pulsing dot rather
              // than as a level meter.
              transform: [{ translateY: 0 }, { scaleY: v }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    width: 2.5,
    borderRadius: theme.radius.full,
    // scaleY scales about the view's centre, so the row is bottom-aligned and
    // each bar is given its full height to shrink within.
    transformOrigin: 'bottom',
  },
});
