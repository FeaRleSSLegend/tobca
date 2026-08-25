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
//
// ---------------------------------------------------------------------------
// IT FLOATS. IT DOES NOT COLLAPSE. — the scroll-glitch fix.
//
// This row used to hide by ANIMATING ITS OWN HEIGHT to zero while sitting in
// normal flow directly above the Library's scroll view. That is what produced
// the visual jank the Video tab was reported for, and there were three
// distinct failures stacked on one cause:
//
//   1. THE JUMP. The scroller below is flex:1, so collapsing ~50pt of bar
//      moved the scroll view's top edge UP by 50pt while its contentOffset was
//      unchanged. The content therefore leapt 50pt in ADDITION to the scroll
//      the finger asked for — a jump, mid-gesture, every time the bar moved.
//
//   2. THE OSCILLATION, which is the reason it read as *glitching* rather than
//      as one jump. Growing the viewport also grows layoutMeasurement.height,
//      and near the end of the content the native scroller then CLAMPS
//      contentOffset down to keep the last pixel at the bottom. That clamp
//      arrives as a negative dy — which useAutoHideOnScroll reads as "the user
//      scrolled up", shows the bar, shrinks the viewport, un-clamps the
//      offset, which arrives as a positive dy, which hides the bar again. A
//      closed feedback loop between the hide decision and the layout that
//      decision causes, needing no further user input to keep running.
//
//   3. THE COST PER FRAME. Height is not native-driver-able, so every frame of
//      the 240ms collapse re-ran layout for the pager and BOTH of its mounted
//      pages on the JS thread while a scroll gesture was in flight.
//
// None of the three is fixable by tuning the hide rule, because all three come
// from the bar changing the SIZE OF THE VIEWPORT. So it no longer does. The
// row is now positioned as an overlay by its host (see LibraryStyles.
// filterOverlay) and hides by TRANSLATING ITSELF OUT — exactly what
// BibleQuickNav has always done, and the reason that bar never had this bug.
// Opacity and transform are both native-driver-safe, so the hide costs zero
// layout passes and cannot move the content underneath it by a pixel.
//
// The host reserves the row's space as constant contentContainer padding via
// `onMeasure` instead. Constant is the whole point: reserved space that never
// changes cannot fight the scroll position.
//
// It is OPAQUE (theme.colors.bg) because content now scrolls underneath it
// rather than below it. The screen watermark it covers is a centred mark at
// 3.5% opacity; a top strip of that is not a loss worth a transparency bug.
//
// This also retires the "measure-then-constrain" trap the old version had to
// work around by absolutely positioning its own row: nothing constrains the
// row's height any more, so it can simply be measured where it sits.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Animated, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
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
  /**
   * Positioning, supplied by the host. This component does not decide where it
   * lives — the Library floats it over its pager — but it ALWAYS hides by
   * translating, never by resizing.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The row's real, laid-out height, reported once measured and again if it
   * grows (fonts finishing loading, OS text scaling). The host uses it to
   * reserve constant space under the overlay. It never fires when the row
   * renders nothing, so a single-branch build reserves nothing and the host
   * needs no special case for it.
   */
  onMeasure?: (height: number) => void;
}

export const BranchFilter = ({
  value,
  onChange,
  visible = true,
  style,
  onMeasure,
}: BranchFilterProps) => {
  // Measured, not assumed: this row's height is pill height plus padding, and
  // hardcoding it would break both the host's reserved space and the distance
  // this thing has to travel to get itself off screen.
  const [rowHeight, setRowHeight] = useState(0);
  const anim = useRef(new Animated.Value(1)).current; // 1 shown → 0 hidden

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: MOTION.base,
      // NATIVE DRIVER, now that this animates opacity and transform only. The
      // old height animation could not use it, which is what made the hide
      // cost a JS-thread layout pass per frame mid-scroll.
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  if (branches.length < 2) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        style,
        {
          opacity: anim,
          transform: [
            {
              // Slides up under the header above it. Until the first
              // measurement this is a translate of 0, which is correct: the
              // bar starts visible and has nowhere to go yet.
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-rowHeight, 0],
              }),
            },
          ],
        },
      ]}
      // A hidden bar must not eat taps meant for the content it is sitting
      // over. Opacity 0 alone would still swallow them.
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View
        style={styles.row}
        accessibilityRole="tablist"
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          // Only ever grow. The row must be able to report a bigger height
          // later (fonts, text scaling) but must never latch a smaller one.
          if (h > rowHeight) {
            setRowHeight(h);
            onMeasure?.(h);
          }
        }}
      >
        {/* Horizontally scrollable, even though two branches and "All" fit on
            every phone today. Branch count is data, not layout: the day a
            third or fourth branch is added, a fixed row would either wrap onto
            a second line (doubling the header's height) or squeeze the pills
            narrower than their labels. Scrolling absorbs that with no edit. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // The same nested-horizontal hardening HScroll carries, for the same
          // reason: this row is a horizontal scroller on a screen full of
          // them, and it must keep a pan it has claimed.
          directionalLockEnabled
          nestedScrollEnabled
          contentContainerStyle={styles.scrollContent}
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
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // The travelling wrapper. overflow:'hidden' stops the row being visible
  // above its own box as it slides out from under the header.
  wrap: {
    overflow: 'hidden',
    backgroundColor: theme.colors.bg,
  },
  row: {
    // PADDING, not margin: onLayout reports a view's height excluding its own
    // margins, so a marginTop here would be invisible to the measurement and
    // the host would reserve less space than the row actually occupies.
    paddingTop: theme.space.related,
    // Nothing below. The next block owns the space above itself.
    paddingBottom: 0,
  },
  // The gap between pills lives on the ScrollView's content container — a gap
  // on the outer view would only space the single ScrollView child, which is
  // nothing.
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
});
