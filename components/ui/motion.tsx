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

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
// From expo-router, not @react-navigation/native — SDK 56+ rejects a direct
// react-navigation import at bundle time (expo-router re-exports the hook).
import { useFocusEffect } from 'expo-router';

// ---------------------------------------------------------------------------
// PressableScale — a Pressable that dips slightly when pressed. This is the
// single most-felt micro-interaction in the app: every card, row, and
// button that uses it gets the same tactile "give" on touch, the thing
// that makes taps feel acknowledged instead of instant-and-flat.
// ---------------------------------------------------------------------------

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  // Layout style for the OUTER Pressable. `style` lands on the inner animated
  // view — it has to, because that's the box being scaled, and putting the
  // background and padding anywhere else would scale the content off its own
  // backdrop. But that means layout a PARENT needs to see (`flex: 1` in a
  // grid or a row) never reaches the element being measured, and the control
  // silently collapses to hug its content. Pass that layout here instead.
  containerStyle?: StyleProp<ViewStyle>;
  // How deep the press dips. 0.97 is the default (barely perceptible, the
  // iOS-ish amount); pass a smaller number for larger surfaces that can
  // afford a bit more travel.
  activeScale?: number;
}

// ---------------------------------------------------------------------------
// MOTION DURATIONS
//
// Every animation in the app used to name its own number: 340 for a content
// entrance, 260 for a confirmation, 300 and 140 for the two halves of a tab
// icon, 200 for the quick-nav. Nothing was wrong individually, but nothing
// agreed either, and inconsistent timing is felt before it is noticed - the
// app reads as if different parts of it were built by different people.
//
// Two durations, because there are two kinds of moment:
//   fast - a control acknowledging a tap. Must land almost before you notice
//          it started, or it reads as lag rather than feedback.
//   base - content arriving, or the app confirming something happened. Long
//          enough to be seen as movement, short enough never to be waited on.
//
// Both sit inside the 150-250ms band where motion registers without costing
// the user time. Anything longer belongs to a surface large enough to justify
// it (the player expanding across the whole screen), and those state their own
// reason locally.
//
// All of these run on the NATIVE driver. The exceptions in the app are the two
// SVG animations, which animate a prop rather than a view style and physically
// cannot - both say so at the call site.
// ---------------------------------------------------------------------------
export const MOTION = {
  fast: 180,
  base: 240,
} as const;

export const PressableScale = ({
  children,
  style,
  containerStyle,
  activeScale = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  // The two halves of a press want different curves, which one shared spring
  // couldn't give them. Going DOWN should be dead calm — any wobble on the
  // way in feels like the surface is unstable under the finger. Coming BACK
  // UP is the moment the tap is acknowledged, so it rebounds a little past
  // rest before settling. That asymmetry is the whole difference between a
  // control that feels alive and one that just changes size.
  const animateTo = (to: number, bounciness: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 20,
      bounciness,
    }).start();

  return (
    <Pressable
      onPressIn={(e) => {
        animateTo(activeScale, 0);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1, 12);
        onPressOut?.(e);
      }}
      style={containerStyle}
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
      duration: MOTION.base,
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

// ---------------------------------------------------------------------------
// TabTransition — the entrance for a bottom-tab screen. Bottom tabs swap
// instantly by default, which reads as a hard cut; a small scale-up paired
// with a fade gives the incoming screen a sense of arriving without costing
// anyone time. Deliberately the FAST duration rather than the base one, and
// no travel: a tab switch is a jump between peers, not content settling into
// place, so it should land almost before you notice it started.
//
// Wraps a tab screen's root. Runs on focus rather than mount because bottom
// tabs keep screens mounted — without the focus trigger it would animate
// once, the first time each tab was ever opened, and never again.
//
// WHY THE RESET HAPPENS ON FOCUS, NOT ON BLUR
// The first version zeroed the value when the screen BLURRED, so the next
// focus would have a "from" state to animate out of. Two things killed it:
//   - react-native-screens detaches an inactive tab's native views. Writing
//     to a native-driven node whose view has already been torn down means
//     the reset can land nowhere, and the screen re-attaches sitting at 1 —
//     the animation then runs 1→1 and nothing visibly happens.
//   - it left the screen parked at opacity 0 whenever it wasn't focused, so
//     any path that re-showed a screen WITHOUT firing focus would show a
//     blank page.
// Resetting at the top of the focus callback fixes both: the "from" state is
// written to a node that is definitely attached, one instruction before the
// animation that consumes it, and a blurred screen is always left fully
// opaque so the worst case is no animation rather than an empty screen.
// ---------------------------------------------------------------------------

interface TabTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const TabTransition = ({ children, style }: TabTransitionProps) => {
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: MOTION.fast,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      anim.start();
      return () => {
        anim.stop();
        // Leave the screen visible on the way out. See the note above: a
        // blurred screen parked at 0 is how this breaks badly.
        progress.setValue(1);
      };
    }, [progress])
  );

  // 0.96 → 1: enough to register as movement, small enough that text never
  // looks like it's being resized.
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <Animated.View style={[styles_tabTransition, style, { opacity: progress, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

const styles_tabTransition: ViewStyle = { flex: 1 };

// ---------------------------------------------------------------------------
// PopIn — a confirmation. For the moment a piece of UI appears BECAUSE the
// user just changed something: a reading flipping to complete, a highlight
// landing on a verse. It overshoots and settles, which is the difference
// between the app acknowledging an action and the app merely re-rendering.
//
// Deliberately mount-only. Every case this is for swaps one element for
// another (button → completed badge, empty swatch → ticked swatch), so the
// confirming element is newly mounted anyway and no trigger plumbing is
// needed. Don't reach for it on things that mount during normal navigation —
// that's what FadeInUp is for, and a pop on arrival reads as a twitch.
// ---------------------------------------------------------------------------

interface PopInProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PopIn = ({ children, style }: PopInProps) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.72, 1.1, 1] });
  // Opacity finishes well before the scale does, so what you see is a settle
  // rather than something still fading while it is already the right size.
  const opacity = progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>
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
