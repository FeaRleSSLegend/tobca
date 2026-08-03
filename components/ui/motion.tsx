// components/ui/motion.tsx
// Shared motion primitives for the whole app. Built on React Native's
// built-in Animated API (not Reanimated) on purpose: it needs no babel
// plugin, no New Architecture, and no native rebuild, so it runs in Expo
// Go exactly as it does in a production build. Every animation here uses
// the native driver (useNativeDriver: true) so it runs on the UI thread
// and stays at 60fps even while JS is busy — which matters most during
// the exact moments these fire (list mounts, screen transitions, taps).
//
// The design language, kept deliberately narrow so motion feels like one
// system rather than a grab bag:
//   - durations are short (150-260ms). Fast enough to feel responsive,
//     never enough to make someone wait on the animation.
//   - easing is gentle (easeOut for entrances, spring for presses).
//   - the effect is always subtle: a few points of translate, a small
//     scale, an opacity fade. Per the brief, you should feel the polish
//     without noticing the animation.

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';

// ---------------------------------------------------------------------------
// PressableScale — a Pressable that dips slightly when pressed. This is the
// single most-felt micro-interaction in the app: every card, row, and
// button that uses it gets the same tactile "give" on touch, the thing
// that makes taps feel acknowledged instead of instant-and-flat.
// ---------------------------------------------------------------------------

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  // How deep the press dips. 0.97 is the default (barely perceptible, the
  // iOS-ish amount); pass a smaller number for larger surfaces that can
  // afford a bit more travel.
  activeScale?: number;
}

export const PressableScale = ({
  children,
  style,
  activeScale = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      // Springs, not timings, so the release has a natural settle rather
      // than a mechanical snap. Low tension + decent friction = calm.
      speed: 40,
      bounciness: 0,
    }).start();

  return (
    <Pressable
      onPressIn={(e) => {
        animateTo(activeScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// FadeInUp — entrance animation for content that has just loaded or a row
// appearing in a list. A short fade combined with a few points of upward
// travel, the "fade-through" feel from Material Motion and the iOS content-
// settle. `delay` staggers siblings so a list doesn't pop in all at once.
// ---------------------------------------------------------------------------

interface FadeInUpProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  // Travel distance in points. Small by default — this is a settle, not a
  // slide.
  offset?: number;
}

export const FadeInUp = ({ children, style, delay = 0, offset = 8 }: FadeInUpProps) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// Stagger helper: FadeInUp whose delay is derived from a list index, capped
// so a long list never makes the last item wait noticeably. Use for the
// first screenful of a freshly-loaded list.
export const STAGGER_STEP_MS = 40;
export const STAGGER_MAX_MS = 240;

export function staggerDelay(index: number): number {
  return Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS);
}

// ---------------------------------------------------------------------------
// Shimmer — the moving highlight for skeleton placeholders. A single
// horizontal gradient sweep looping across the element, the standard
// "content is loading" cue (Facebook/LinkedIn/Spotify all use a variant).
// Implemented as a translating overlay rather than an animated gradient so
// it can run on the native driver.
// ---------------------------------------------------------------------------

import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface ShimmerProps {
  style?: StyleProp<ViewStyle>;
  // Width of the shimmer container, needed to size the sweep. Defaults to a
  // generous value that covers most placeholder widths; pass the real width
  // for a tighter sweep on small elements.
  width?: number;
}

export const Shimmer = ({ style, width = 400 }: ShimmerProps) => {
  const x = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  const translateX = x.interpolate({ inputRange: [-1, 1], outputRange: [-width, width] });

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <View style={{ flex: 1, backgroundColor: theme.colors.grayBorder }} />
      <Animated.View
        style={{
          ...StyleSheet_absoluteFill,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          // A soft white band sweeping across the gray base — the
          // highlight. Kept low-contrast so it reads as a sheen, not a
          // flash.
          colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// Local copy to avoid importing StyleSheet just for one constant.
const StyleSheet_absoluteFill = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
