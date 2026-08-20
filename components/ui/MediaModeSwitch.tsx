// components/ui/MediaModeSwitch.tsx
// The Library's MEDIA MODE switch: "VIDEO   AUDIO".
//
// WHAT THIS IS, AND WHAT IT IS NOT
// This control is not navigation and not a filter. It decides WHICH LIBRARY
// you are in — every section below it changes when it changes — so it sits in
// the header, above the branch pills, and is styled as a heading rather than
// as a control you operate all day.
//
// WHY IT IS SMALLER THAN THE THING IT REPLACED
// The previous version was an underline tab set at section-heading size (18pt)
// with a 3pt pink bar as wide as the label. Two problems: at that weight it
// read as a second navigation bar stacked under the search field, and it
// out-shouted the branch pills directly beneath it — which are the control
// people actually touch repeatedly. So:
//
//   - the labels are set as SMALL CAPS (12pt, tracked open). Tracked caps
//     read as a label for the region below, not as a tappable bar. Same
//     register the editorial masthead label uses.
//   - the active marker is a short 2pt bar centred under the tab rather than
//     a full-label 3pt rule. It marks the mode without drawing a line across
//     the header.
//   - each mode carries a small glyph (play triangle / headset), which is
//     what makes "mode" legible at a glance without a container, a fill or a
//     border. Cheapest possible way to say "these two are kinds of media"
//     rather than "these two are more filters".
//
// Everything else is deliberately absent: no track, no fill, no border, no
// pill. The header already has one filled control (the search field) and one
// row of pills; a third filled thing is what made the area read as a stack of
// bars instead of one header.

import { View, Text, StyleSheet, LayoutChangeEvent, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale, MOTION } from './motion';

export interface MediaMode<T extends string> {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface MediaModeSwitchProps<T extends string> {
  modes: MediaMode<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Announced as the group's purpose, e.g. "Library media mode". */
  accessibilityLabel?: string;
}

/** Measured geometry of one tab, relative to the row. */
interface TabBox {
  x: number;
  width: number;
}

// The active marker's drawn width. Fixed, NOT the tab's width: a bar that
// stretches to fit each label reads as an underline for that word, which is
// the heavier thing this replaced. A short constant bar reads as a marker for
// the mode, and it also means the indicator only ever translates — no scaleX,
// so its rounded ends never distort.
const MARKER_WIDTH = 14;

export function MediaModeSwitch<T extends string>({
  modes,
  value,
  onChange,
  accessibilityLabel,
}: MediaModeSwitchProps<T>) {
  const index = Math.max(0, modes.findIndex((m) => m.value === value));

  // Per-tab geometry, measured rather than assumed. The marker has to centre
  // under the tab it belongs to, and tab widths depend on the label, the glyph
  // and the user's text-size setting — none of which can be guessed here.
  const [boxes, setBoxes] = useState<Record<number, TabBox>>({});
  const pos = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(pos, {
      toValue: index,
      // Same duration BranchFilter uses for its own state change, so the two
      // controls in this header move at one speed rather than two.
      duration: MOTION.base,
      // Translate only — safe on the native driver, unlike BranchFilter's
      // height animation.
      useNativeDriver: true,
    }).start();
  }, [index, pos]);

  // Attached to the TAB, not to the Text inside it: onLayout reports a frame
  // relative to the PARENT, and the tab's own x is the one expressed in the
  // row's coordinate space — which is the frame the marker is positioned in.
  const measure = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setBoxes((prev) => {
      const prevBox = prev[i];
      if (prevBox && Math.abs(prevBox.x - x) < 0.5 && Math.abs(prevBox.width - width) < 0.5) {
        return prev; // no real change — don't churn state on every re-layout
      }
      return { ...prev, [i]: { x, width } };
    });
  };

  // Only draw once every tab has reported. A partially measured marker would
  // flash at the wrong position on first paint.
  const measured = modes.every((_, i) => boxes[i] !== undefined);

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {modes.map((m, i) => {
        const active = m.value === value;
        return (
          <PressableScale
            key={m.value}
            activeScale={0.96}
            style={styles.tab}
            onLayout={measure(i)}
            onPress={() => onChange(m.value)}
            // The label is deliberately small, so the visible text sits well
            // under the 44pt touch floor. hitSlop takes the target there
            // without padding the label out into something that looks like a
            // button again.
            hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={m.label}
          >
            <Ionicons
              name={m.icon}
              size={13}
              color={active ? theme.colors.navy : theme.colors.grayIcon}
            />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {m.label.toUpperCase()}
            </Text>
          </PressableScale>
        );
      })}

      {measured && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.marker,
            {
              width: MARKER_WIDTH,
              transform: [
                {
                  translateX: pos.interpolate({
                    inputRange: modes.map((_, i) => i),
                    outputRange: modes.map(
                      (_, i) => boxes[i].x + boxes[i].width / 2 - MARKER_WIDTH / 2
                    ),
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Left-aligned and only as wide as its labels: this is a heading for the
    // content below it, and headings start at the text margin like everything
    // else on the screen.
    alignSelf: 'flex-start',
    gap: theme.space.section,
    // Just enough room for the marker to sit clear of the caps without the
    // row growing into the pills underneath.
    paddingBottom: theme.space.tight,
  },
  tab: {
    // No background, no border, no padding — the label IS the control.
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.micro + 2,
  },
  label: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    // Positive tracking, per the editorial scale's rule for small caps: set
    // small, caps look cramped at 0.
    letterSpacing: theme.editorial.trackLabel,
    color: theme.colors.grayIcon,
  },
  labelActive: {
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.navy,
  },
  marker: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.pink,
  },
});
