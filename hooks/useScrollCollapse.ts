// hooks/useScrollCollapse.ts
// A bar that is ATTACHED TO THE SCROLL, not triggered by it.
//
// ---------------------------------------------------------------------------
// WHY THE OLD BEHAVIOUR FELT DELAYED, AND WHY TUNING IT COULD NOT HELP
//
// hooks/useAutoHideOnScroll (still used by the Bible reader, see below) makes a
// BINARY decision: it reads the sign of the scroll delta, flips a boolean, and
// the bar then runs its own 200ms timing animation to the new state. Three
// things follow from that shape, and none of them is a tuning problem:
//
//   1. THE ANIMATION IS NOT THE GESTURE. Once the boolean flips, the bar plays
//      a fixed-duration animation regardless of what the finger does next.
//      Scroll 4pt and the bar travels its whole height; scroll 200pt fast and
//      it travels the same height at the same speed. The movement has no
//      relationship to how far or how quickly you actually scrolled, which is
//      exactly the "moves independently from the gesture" complaint.
//   2. THERE IS ALWAYS A FRAME OF LAG. The decision is made in JS on a scroll
//      event, then a new animation is started. Even at scrollEventThrottle 16
//      that is a frame to notice the delta plus the animation's own ramp-in.
//   3. IT IS ALL-OR-NOTHING. There is no partial state, so a small scroll and
//      a large one are indistinguishable, and reversing mid-gesture makes the
//      bar reverse a full-height animation rather than simply coming back the
//      few points you gave back.
//
// ---------------------------------------------------------------------------
// WHAT THIS DOES INSTEAD
//
// The bar's position IS a function of scroll position. No decision, no
// threshold, no duration:
//
//   Animated.diffClamp(scrollY, 0, distance)
//
// diffClamp accumulates the scroll delta and clamps the running total to
// [0, distance]. Scroll down 12pt and it reads 12; give 5pt back and it reads
// 7. That is precisely "the bar moves with the content, and comes back when
// you come back", and it is continuous by construction: slow scroll gives slow
// movement, a flick gives immediate movement, because both are the same
// number arriving at different rates.
//
// It also naturally settles the two states without snapping: the clamp holds
// it at 0 while you sit at the top and at `distance` once it is fully out, so
// there is no oscillation at either end and no threshold to cross.
//
// NATIVE DRIVER, and this is the part that removes the last of the lag: the
// whole chain (scroll offset -> diffClamp -> interpolate -> transform) is
// declared once and evaluated on the UI thread. The JS thread is not involved
// in a single frame of the movement, so it cannot be late even while the list
// is doing virtualization work.
//
// THE CALLER MUST USE Animated.ScrollView (or Animated.FlatList). A native
// Animated.event attached to a plain ScrollView silently does nothing.
//
// ---------------------------------------------------------------------------
// WHY THE BIBLE READER WAS LEFT ON THE OLD HOOK
//
// It is not an oversight and it is not "no time". The reader's quick-nav has a
// TAP-TO-TOGGLE gesture (the standard ebook "tap the page to show chrome"),
// and diffClamp has no reset: once it is parked at `distance`, tapping to show
// the bar would leave the accumulator still at max, so the very next pixel of
// scroll would yank it straight back out. Making the two coexist means
// rebasing the accumulator on every toggle, which diffClamp cannot express.
// A bar you tap to summon and a bar attached to the scroll are genuinely
// different interactions; the reader wants the first, the Library's filter row
// wants the second.

import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export interface ScrollCollapse {
  /** Attach to an Animated.ScrollView's `onScroll`. */
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** 0 = fully shown, 1 = fully collapsed. Drives transforms on the UI thread. */
  progress: Animated.AnimatedInterpolation<number>;
  /**
   * A JS-side mirror of "is it effectively hidden", for the things that CANNOT
   * read an animated node: pointerEvents and the accessibility flags. It uses
   * a threshold, and that is fine precisely because it drives no visuals - a
   * bar that is 95% gone is one nobody is aiming at.
   */
  collapsed: boolean;
}

export function useScrollCollapse(distance: number): ScrollCollapse {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [collapsed, setCollapsed] = useState(false);

  // The JS mirror of diffClamp. Same arithmetic, run only to decide a boolean,
  // so it costs one comparison per scroll event and sets state at most twice
  // per gesture (React bails on an unchanged value).
  const acc = useRef(0);
  const lastY = useRef(0);

  const onScrollJS = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const d = Math.max(1, distance);
      acc.current = Math.min(d, Math.max(0, acc.current + (y - lastY.current)));
      lastY.current = y;
      setCollapsed(acc.current > d * 0.95);
    },
    [distance]
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        // Runs on the JS thread alongside the native transform. It never
        // affects the movement - only the pointerEvents mirror above.
        listener: onScrollJS,
      }) as unknown as (e: NativeSyntheticEvent<NativeScrollEvent>) => void,
    [scrollY, onScrollJS]
  );

  const progress = useMemo(() => {
    // Guard the zero case: `distance` is measured, so it is 0 on the first
    // render and an interpolation with an empty input range throws.
    const d = Math.max(1, distance);
    return Animated.diffClamp(scrollY, 0, d).interpolate({
      inputRange: [0, d],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  }, [scrollY, distance]);

  return { onScroll, progress, collapsed };
}
