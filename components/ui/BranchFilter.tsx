// components/ui/BranchFilter.tsx
// The branch switcher: "All | Ikeja | Wuse 2".
//
// A pill row, not a tab. Per the architecture note in data/branches.ts, branch
// is an ATTRIBUTE of content rather than a top-level split — two branches are
// one church, not two apps — so switching branch narrows what the existing
// screen shows instead of navigating somewhere else.
//
// It renders NOTHING when only one branch exists. A control with a single real
// choice is just clutter that has to be read and dismissed, and it also means
// this can stay mounted permanently: the day Wuse 2's channel id lands, the
// filter appears on its own with no screen edited.

import { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { branches } from '../../data/branches';
import { FilterPill } from './FilterPill';
import { MOTION } from './motion';
import type { BranchFilter as BranchFilterValue } from '../../hooks/useMessages';

interface BranchFilterProps {
  value: BranchFilterValue;
  onChange: (next: BranchFilterValue) => void;
  /**
   * Auto-hide state, driven by the host screen's useAutoHideOnScroll — the
   * same rule the Bible reader's quick-nav uses. Defaults to shown, so a
   * screen that doesn't care can ignore it entirely.
   */
  visible?: boolean;
}

export const BranchFilter = ({ value, onChange, visible = true }: BranchFilterProps) => {
  // Measured, not assumed: this row's height is pill height plus margins, and
  // hardcoding it here would silently break the collapse the moment a pill's
  // padding or type size changes.
  const [rowHeight, setRowHeight] = useState(0);
  const anim = useRef(new Animated.Value(1)).current; // 1 shown → 0 hidden

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: MOTION.base,
      // NOT the native driver. Unlike BibleQuickNav — which floats over the
      // page and can simply translate itself away — this row sits in normal
      // flow above the scroll view, so hiding it has to COLLAPSE its height or
      // it just leaves a hole where it used to be. Height is a layout prop and
      // cannot be driven natively.
      useNativeDriver: false,
    }).start();
  }, [visible, anim]);

  if (branches.length < 2) return null;

  // MEASURE-THEN-CONSTRAIN is the trap here, and it cost two test runs before
  // it was pinned down. The wrapper's animated height is derived from a
  // measurement of the row; if the row is also a normal-flow CHILD of that
  // wrapper, the wrapper's height constrains it, so a measurement taken before
  // the custom fonts finish loading — which is smaller than the final layout —
  // locks the row at that size and it can never report a larger one. The
  // visible symptom was pills with no labels: clipped to a stale height.
  //
  // So once measured, the row is taken OUT OF FLOW. An absolutely positioned
  // child is laid out at its natural size regardless of the parent's height,
  // still fires onLayout, and can therefore still grow when the real fonts
  // land. Until the first measurement it stays in flow so the wrapper has
  // something to size itself from.
  const measured = rowHeight > 0;

  const animatedStyle = measured
    ? {
        height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, rowHeight] }),
        opacity: anim,
      }
    : undefined;

  return (
    <Animated.View style={[styles.clip, animatedStyle]}>
      <View
        style={[styles.row, measured && styles.rowFloating]}
        accessibilityRole="tablist"
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          // Only ever grow. The row must be able to report a bigger height
          // later (fonts, text scaling) but must never latch a smaller one.
          if (h > rowHeight) setRowHeight(h);
        }}
      >
        <FilterPill label="All" isActive={value === 'all'} onPress={() => onChange('all')} />
        {branches.map((b) => (
          <FilterPill
            key={b.id}
            label={b.shortName}
            isActive={value === b.id}
            onPress={() => onChange(b.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // The collapsing wrapper. overflow:'hidden' is what lets the row slide out
  // of view as its height goes to zero instead of overflowing the box.
  clip: {
    overflow: 'hidden',
  },
  // Out of flow, so the collapsing wrapper can never constrain the row it was
  // measured from. Pinned to the top so the row slides up under the search bar
  // as the wrapper's height closes.
  rowFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    // PADDING, not margin. The gap to the search bar above is the same 16 it
    // always was, but it has to live INSIDE the collapsing wrapper: onLayout
    // reports a view's height excluding its own margins, so as a marginTop it
    // was invisible to the measurement and the wrapper was permanently 16pt
    // shorter than its contents — which clipped the pills instead of
    // collapsing them. It also means the gap itself collapses along with the
    // row, which is what you want; a hidden bar should not leave its spacing
    // behind.
    paddingTop: theme.space.related,
    // Nothing below. The 4pt that used to sit here was landing on top of
    // CurrentMessage's own 24pt section margin for a 28pt gap — close enough
    // to 24 to look like a mistake rather than a choice, and it meant the gap
    // changed size depending on which card happened to render first. The next
    // block owns the space above itself.
    marginBottom: 0,
  },
});
