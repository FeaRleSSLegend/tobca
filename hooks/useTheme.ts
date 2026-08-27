// hooks/useTheme.ts
// HOW A COMPONENT READS COLOUR NOW.
//
// The problem this solves is not "where are the dark values" — that is
// constants/palette.ts. It is that StyleSheet.create() runs ONCE, at module
// import time, before any React context exists. Every StyleSheet in this app
// captured `theme.colors.navy` as the literal string '#1A3247' at startup, so
// no amount of context could ever change what those styles draw.
//
// So a themed style has to be built DURING RENDER. Doing that naively — a
// StyleSheet.create() call inside the component body — rebuilds every style
// object on every render of every instance, which is real work on a list of
// 250 rows. `makeThemedStyles` fixes that: the factory runs once PER PALETTE
// (twice, ever, for the life of the process) and every component instance
// reads the cached result.
//
// CONVERTING A FILE is mechanical:
//
//   -  const styles = StyleSheet.create({ row: { color: theme.colors.navy } });
//   +  const useStyles = makeThemedStyles((c) => ({ row: { color: c.navy } }));
//
//   inside the component:
//   +  const styles = useStyles();
//
// The legacy pigment names (`c.navy`, `c.bg`, `c.grayBorder`) exist on both
// palettes precisely so that diff is the whole change — see the note in
// constants/palette.ts. Inline colour props (`<Ionicons color=...>`) take
// `const c = useThemeColors()` in the same component.
//
// WHAT STAYS ON constants/theme.ts: spacing, radius, fontSize, fontFamily,
// layout, editorial. None of those change with appearance, so none of them
// need to move into render.

import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useAppearance } from '../providers/AppearanceProvider';
import { gradientFor, type Palette } from '../constants/palette';

/** The active palette. Re-renders the caller when the appearance changes. */
export function useThemeColors(): Palette {
  return useAppearance().colors;
}

/** The brand gradient for the active appearance — pass to LinearGradient. */
export function useThemeGradient() {
  const colors = useThemeColors();
  return useMemo(() => gradientFor(colors), [colors]);
}

/** True when the app is currently drawing dark. For the rare branch that is
 *  not expressible as a token — an image overlay opacity, a blur tint. */
export function useIsDark(): boolean {
  return useAppearance().resolved === 'dark';
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Turn a palette-taking style factory into a hook.
 *
 * The factory result is cached per palette OBJECT, and there are exactly two
 * palette objects in the app (light and dark, both module constants), so the
 * factory runs at most twice no matter how many components mount or how often
 * they re-render.
 */
// The signature mirrors StyleSheet.create's exactly, including the
// `& NamedStyles<any>` on the factory's RETURN type. That intersection is not
// decoration: it is what gives the object literal inside the factory a
// contextual type, so `flexDirection: 'row'` narrows to the literal union
// instead of widening to `string` and failing to be a ViewStyle.
export function makeThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (c: Palette) => T & NamedStyles<any>
): () => T {
  const cache = new Map<Palette, T>();
  return function useStyles(): T {
    const colors = useThemeColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}

/**
 * The same caching, for a shared stylesheet that is imported by several files
 * (constants/styles/*). Identical to makeThemedStyles — named separately only
 * so a reader of `sharedStyles` can see it is the same mechanism and not a
 * second one.
 */
export const makeThemedSheet = makeThemedStyles;
