// components/ui/BrandLoader.tsx
// The loading state for branded surfaces (the Reading Plan hero, and anywhere
// else waiting on plan data). A spinner says "something is happening"; this
// says "OliveBrook is loading" — it's the logo's two swoosh strokes, pink over
// purple, sliding back and forth.
//
// Built on the same plain Animated primitives as components/ui/motion.tsx: one
// looping value per bar, native driver, translateX only. Two details do the
// work:
//   - the bars run on SEPARATE loops of different durations, so they drift in
//     and out of phase instead of moving as one rigid pair. That off-parallel
//     motion is what makes it read as the logo's swooshes rather than a
//     progress bar cut in half.
//   - `Easing.inOut` on a yoyo, not a linear wrap, so each bar decelerates at
//     the turn instead of snapping back to the start.

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface BrandLoaderProps {
  style?: StyleProp<ViewStyle>;
  // Track width the bars travel inside. The bars are sized off this, so one
  // number scales the whole mark.
  width?: number;
  // Light surfaces (cards, sheets) vs the gradient hero, which needs the
  // brighter treatment to survive on pink/purple.
  onDark?: boolean;
}

const BAR_HEIGHT = 5;

export const BrandLoader = ({ style, width = 132, onDark = false }: BrandLoaderProps) => {
  const barWidth = Math.round(width * 0.52);
  const travel = width - barWidth;

  const top = useRef(new Animated.Value(0)).current;
  const bottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const yoyo = (value: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    // Deliberately not the same duration — see the note above.
    const a = yoyo(top, 780, 0);
    const b = yoyo(bottom, 950, 120);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [top, bottom]);

  const slide = (v: Animated.Value) => ({
    transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }],
  });

  return (
    <View style={[styles.wrap, { width }, style]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View
        style={[
          styles.bar,
          { width: barWidth, backgroundColor: onDark ? theme.colors.white : theme.colors.pink },
          slide(top),
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            backgroundColor: onDark ? 'rgba(255,255,255,0.6)' : theme.colors.purple,
          },
          slide(bottom),
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: BAR_HEIGHT + 1,
    justifyContent: 'center',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
});
