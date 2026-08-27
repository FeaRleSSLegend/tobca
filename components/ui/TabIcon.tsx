// components/ui/TabIcon.tsx
// The bottom-bar item. Selection used to be a pure state swap — the pill,
// the filled glyph and the gradient underline all appeared in the same
// frame, which read as the UI redrawing rather than responding. Now the
// change is animated on two separate tracks, because the two things want
// different personalities:
//   - `active` (0→1, eased) carries the PILL and the UNDERLINE. These are
//     surfaces settling into place, so they glide.
//   - `pop` (0→1, keyframed past 1) carries the ICON. This is the thing
//     the finger actually hit, so it overshoots and settles a hair larger
//     than rest — the small "bounce" that makes the tap feel answered.
// Both run on the native driver, so the bar stays smooth even while the
// incoming screen is doing its own mount work on the JS thread.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MOTION } from './motion';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  // pass the FILLED name, e.g. "home" — outline version is derived automatically
  icon: string;
  label: string;
  focused: boolean;
}

// NOTE: no Animated.createAnimatedComponent(Ionicons) here, deliberately.
//
// That crashed with "undefined is not a function" out of pop.setValue(). The
// throw is actually INSIDE setValue — Expo's LogBox collapses node_modules
// frames, so it surfaces at the call site. For a natively-driven value,
// AnimatedValue.setValue ends in:
//
//   NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value)
//
// which needs a real native view tag. Ionicons is a third-party COMPOSITE
// component (a font-glyph wrapper around Text), not a host component, so
// driving it with useNativeDriver: true left the value marked native without a
// tag to resolve. Every other Animated usage in this app targets a host view
// (Animated.View) or runs on the JS driver, which is why only the tab bar broke.
//
// Animating a wrapper Animated.View instead is visually identical — scaling the
// box scales the glyph — and puts the value on a host component like the rest
// of the app.
export default function TabIcon({ icon, label, focused }: TabIconProps) {
  const styles = useStyles();
  const c = useThemeColors();
  const color = focused ? c.navy : c.grayIcon;
  const iconName = (focused ? icon : `${icon}-outline`) as IoniconName;

  const active = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(focused ? 1 : 0)).current;
  // The tab that's already focused when the bar first mounts shouldn't play
  // an entrance — nobody pressed it, and a bar that bounces on its own at
  // launch looks like a glitch rather than feedback.
  const isFirstRun = useRef(true);

  useEffect(() => {
    const settle = Animated.timing(active, {
      toValue: focused ? 1 : 0,
      duration: MOTION.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    settle.start();

    if (isFirstRun.current) {
      isFirstRun.current = false;
      // No setValue needed: `pop` was constructed with exactly this value, so
      // the call was always a no-op that only existed to restate the initial
      // state — and it was the line that crashed.
      return () => settle.stop();
    }

    // Restart the pop from zero on every selection so repeat taps on the
    // same tab still register, instead of animating from 1 to 1 (nothing).
    if (focused) pop.setValue(0);
    const bounce = Animated.timing(pop, {
      toValue: focused ? 1 : 0,
      // Asymmetric on purpose: growing into the selected state is the part
      // worth seeing, shrinking out of it is not.
      duration: focused ? MOTION.base : MOTION.fast,
      easing: focused ? Easing.out(Easing.cubic) : Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    bounce.start();

    return () => {
      settle.stop();
      bounce.stop();
    };
  }, [focused, active, pop]);

  // Overshoot to 1.22 around the midpoint, then settle at 1.06 — the active
  // icon ends fractionally larger than its neighbours, which reads as
  // selection rather than as an animation that failed to finish.
  const iconScale = pop.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 1.22, 1.06],
  });

  // The pill scales up as it fades in rather than just appearing, so it
  // looks like it grew out from under the icon.
  const pillScale = active.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  // scaleX, not width — width can't run on the native driver, and the
  // underline wiping open from its centre is the same read.
  const indicatorScaleX = active.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return (
    <View style={styles.wrapper}>
      {/* The active pill lives behind the content as its own animated layer.
          It was previously a conditional style on the wrapper, which can
          only ever pop in — a background colour isn't animatable on the
          native driver, but an opacity is. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.pill, { opacity: active, transform: [{ scale: pillScale }] }]}
      />

      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Ionicons name={iconName} size={22} color={color} />
      </Animated.View>
      <Text style={[styles.label, { color }]}>{label}</Text>

      {/* Always mounted now, not conditional on `focused`. Rendering it only
          when active meant every tab changed height on selection, so the
          whole bar twitched; keeping it in the tree at zero opacity holds
          the layout still and lets it animate both ways. */}
      <Animated.View style={{ opacity: active, transform: [{ scaleX: indicatorScaleX }] }}>
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={styles.indicator}
        />
      </Animated.View>
    </View>
  );
}

const useStyles = makeThemedStyles((c) => ({
  wrapper: {
    minWidth: theme.layout.tabTapTarget + 16,
    minHeight: theme.layout.tabTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: theme.space.tight,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  pill: {
    // Written as literal keys rather than spreading an absolute-fill helper,
    // the same way LogoWatermark does — it keeps TS from widening `position`
    // to `string` and rejecting the style.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(40,72,104,0.08)',
    borderRadius: 14,
  },
  label: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
  },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 100,
    marginTop: theme.space.hairline,
  },
}));
