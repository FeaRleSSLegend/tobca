import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, View } from 'react-native';
import { MOTION } from '../ui/motion';
import { theme } from '../../constants/theme';

export interface QuickNavItem {
  key: string;
  label: string; // short — this bar fits four of these across a phone
}

interface BibleQuickNavProps {
  items: QuickNavItem[];
  activeKey: string;
  visible: boolean;
  onSelect: (key: string) => void;
}

/**
 * Bottom navigation for Scripture browsing inside the reader — quick
 * switching between the day's Old Testament, New Testament, Psalm, and
 * Proverb passages without backing out to the Plan tab's carousel between
 * each one. That round trip was the reader's biggest friction: four
 * readings a day meant three exits and re-entries.
 *
 * Ebook-reader behavior: the bar slides away while actually reading
 * (scrolling down) and returns on a scroll up or a tap on the page —
 * visibility is DRIVEN by the parent via `visible`; this component only
 * owns the animation. Slide + fade rather than unmount, so reappearing is
 * instant and layout never shifts under the text.
 */
export const BibleQuickNav = ({ items, activeKey, visible, onSelect }: BibleQuickNavProps) => {
  const slide = useRef(new Animated.Value(0)).current; // 0 shown → 1 hidden

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: MOTION.base,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 90] });
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }], opacity }]}
      // While hidden, the bar must not swallow taps meant for the page
      // beneath where it used to be.
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.bar}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={[styles.tab, isActive && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label} reading`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: theme.layout.screenPadding,
    right: theme.layout.screenPadding,
    bottom: theme.spacing.lg,
  },
  // Floating pill above the page rather than a full-width docked bar —
  // this screen's whole design brief is "get out of the text's way," and
  // a floating segment is the smallest footprint that still gives four
  // 44pt targets.
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    // Soft lift so it reads as floating above the page, not printed on it.
    shadowColor: theme.colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.navy,
  },
  tabText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
});
