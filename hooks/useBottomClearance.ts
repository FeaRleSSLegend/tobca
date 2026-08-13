// hooks/useBottomClearance.ts
//
// How much empty space a scroll view needs BELOW its last item, as a runtime
// value rather than a constant.
//
// theme.layout.scrollClearance already says how much clearance each KIND of
// screen wants, but the stack case can't be a constant: a pushed screen has no
// tab bar, so its ScrollView runs all the way to the physical bottom of the
// display and the last row ends up under the home indicator. That inset is a
// device fact only available at runtime, which is exactly why several screens
// quietly shipped without it — Socials' last card sat flush against the bottom
// edge, and the playlist and collection screens had the same gap.
//
// Two hooks, matching the two situations in layout.scrollClearance:
//   useTabBottomClearance   — inside (tabs). The tab bar already covers the
//                             safe area (layout.tabBarHeight is the HIG value
//                             including it), so this is the constant, exposed
//                             as a hook purely so call sites read the same.
//   useStackBottomClearance — a pushed screen. Clearance PLUS the inset.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

export function useTabBottomClearance(): number {
  return theme.layout.scrollClearance.tab;
}

export function useStackBottomClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + theme.layout.scrollClearance.stack;
}
