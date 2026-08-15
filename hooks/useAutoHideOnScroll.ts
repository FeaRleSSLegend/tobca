// hooks/useAutoHideOnScroll.ts
//
// "Hide this bar while the user is reading/browsing, bring it back the moment
// they look like they want to navigate." Extracted from app/reading.tsx, where
// it was inline and tangled together with the reader's scroll-offset
// persistence, so the Library filter row could use the SAME behaviour rather
// than a second implementation that drifts from it.
//
// The rules, unchanged from the reader:
//   - near the top of the content, the bar is always shown. Being at the top
//     is itself a navigational moment, and a bar that stays hidden there feels
//     broken.
//   - scrolling DOWN past the deadband hides it (you are consuming content)
//   - scrolling UP past the deadband shows it (you are looking for something)
//
// The deadband is the important part: without it, the one- or two-pixel
// jitter that a finger produces while holding still flips the state
// continuously and the bar strobes.
//
// This hook owns the DECISION only, never the presentation. A bottom overlay
// (BibleQuickNav) can translate itself off-screen because it floats; a bar in
// normal flow (BranchFilter) has to collapse its height so the content below
// closes the gap. Those are different animations of the same decision.
import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface AutoHideOptions {
  /** Within this many points of the top, always show. */
  topZone?: number;
  /** Movement smaller than this is treated as jitter and ignored. */
  deadband?: number;
}

interface AutoHideResult {
  visible: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Force the bar back, e.g. when content is swapped for a new passage. */
  show: () => void;
  /** Tap-the-page-to-toggle, the standard ebook gesture the reader uses. */
  toggle: () => void;
}

export function useAutoHideOnScroll({
  topZone = 40,
  deadband = 12,
}: AutoHideOptions = {}): AutoHideResult {
  const [visible, setVisible] = useState(true);
  const lastOffsetY = useRef(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastOffsetY.current;

      if (y < topZone) {
        setVisible(true);
      } else if (dy > deadband) {
        setVisible(false);
      } else if (dy < -deadband) {
        setVisible(true);
      }

      lastOffsetY.current = y;
    },
    [topZone, deadband]
  );

  const show = useCallback(() => setVisible(true), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);

  return { visible, onScroll, show, toggle };
}
