// components/ui/SegmentedControl.tsx
// A text-only view switcher with a sliding underline: "Video   Audio".
//
// WHY NOT A FILLED CAPSULE
// The first version was a navy-filled pill track, and it sat directly above
// the branch pills (All / Kubwa / Wuse 2). Two rows of chips stacked on top of
// each other read as one undifferentiated block of controls, and the heavier
// of the two won the eye — which was backwards, because the branch pills are
// the ones you actually operate frequently.
//
// An underline tab is the right weight for this job. It says "these are the
// two halves of this screen" without competing: the labels are plain text, and
// only a 3pt accent bar marks which half you are in. That also restores the
// hierarchy — the switcher recedes, the pills below stay the loudest control
// in the header, and the two no longer look like the same kind of thing.
//
// The accent is the app's pink, the same colour the bottom tab bar uses for
// its own active-tab underline. That makes this the second instance of an
// existing pattern rather than a new one.

import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { PressableScale, MOTION } from './motion';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Announced as the group's purpose, e.g. "Library view". */
  accessibilityLabel?: string;
}

/** Measured geometry of one label, relative to the row. */
interface LabelBox {
  x: number;
  width: number;
}

// The indicator is drawn at this width and scaled to each label. Any constant
// works — it only ever appears multiplied by a measured ratio — but keeping it
// near a real label width means scaleX stays close to 1 and the bar's rounded
// ends never visibly stretch.
const INDICATOR_BASE = 60;

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const index = Math.max(0, segments.findIndex((s) => s.value === value));

  // Per-label geometry, measured rather than assumed. The indicator has to sit
  // under THE TEXT — not under an equal share of the row — so it needs each
  // label's real x and width. "Video" and "Audio" happen to be nearly the same
  // width, but a hardcoded guess would break the moment a label changes or the
  // user scales their font size up.
  const [boxes, setBoxes] = useState<Record<number, LabelBox>>({});
  const pos = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(pos, {
      toValue: index,
      // Same duration BranchFilter animates its own state change with, so the
      // two controls in this header move at one speed rather than two.
      duration: MOTION.base,
      // Native driver, unlike BranchFilter — that one animates `height`, which
      // is a layout prop and cannot be. This is translate + scale, which can,
      // so it costs the JS thread nothing.
      useNativeDriver: true,
    }).start();
  }, [index, pos]);

  // NOTE: this must be attached to the TAB, not to the Text inside it.
  // onLayout reports a view's frame relative to its PARENT, so measuring the
  // Text would give an x of ~0 for every label (each one is the first child of
  // its own tab) and every indicator position would collapse onto the left
  // edge. The tab's own x IS relative to the row, which is the frame the
  // indicator is positioned in. The tab carries no padding, so its width is
  // the label's width.
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

  // Only draw once every label has reported. A partially measured indicator
  // would flash at the wrong width on first paint.
  const measured = segments.every((_, i) => boxes[i] !== undefined);

  return (
    <View
      style={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segments.map((s, i) => {
        const active = s.value === value;
        return (
          <PressableScale
            key={s.value}
            activeScale={0.96}
            style={styles.tab}
            onLayout={measure(i)}
            onPress={() => onChange(s.value)}
            // The label is short and the row is deliberately not full-width,
            // so the visible text is well under 44pt wide. hitSlop takes the
            // touch target to the floor without padding the label out into
            // something that looks like a button again.
            hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={s.label}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </PressableScale>
        );
      })}

      {measured && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: INDICATOR_BASE,
              transform: [
                {
                  // Translate to the CENTRE of the target label, then offset
                  // back by half the drawn width — because scaleX scales about
                  // the centre, this keeps the bar centred under the text at
                  // every scale.
                  translateX: pos.interpolate({
                    inputRange: segments.map((_, i) => i),
                    outputRange: segments.map(
                      (_, i) => boxes[i].x + boxes[i].width / 2 - INDICATOR_BASE / 2
                    ),
                  }),
                },
                {
                  scaleX: pos.interpolate({
                    inputRange: segments.map((_, i) => i),
                    outputRange: segments.map((_, i) => boxes[i].width / INDICATOR_BASE),
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
    // Left-aligned and only as wide as its labels: an underline tab set is a
    // heading for the content below it, and headings start at the text margin
    // like everything else on the screen.
    alignSelf: 'flex-start',
    gap: theme.space.section,
    // Room for the indicator to sit below the text without the row growing
    // into the pills underneath.
    paddingBottom: theme.space.tight,
  },
  tab: {
    // No background, no border, no padding — the label IS the control.
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.sectionHeading,
    letterSpacing: -0.2,
    color: theme.colors.grayIcon,
  },
  labelActive: {
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.navy,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.pink,
  },
});
