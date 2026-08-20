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
  /**
   * The list must have at least this much scrollable distance before hiding
   * is allowed at all. See the note on the unreachable-tail bug below.
   */
  minScrollable?: number;
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
  // Two bar-heights' worth of slack. Below this there is nothing to gain by
  // hiding (you can see the whole list already) and, per the note above,
  // real harm in trying.
  minScrollable = 120,
}: AutoHideOptions = {}): AutoHideResult {
  const [visible, setVisible] = useState(true);
  const lastOffsetY = useRef(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const dy = y - lastOffsetY.current;

      // BARELY-SCROLLABLE LISTS NEVER HIDE THE BAR.
      //
      // Straightforward UX reasoning: if the whole list is already almost
      // visible, hiding the bar buys the reader nothing and costs them the
      // control they were about to use. So below this much travel the bar
      // stays pinned.
      //
      // HONEST NOTE ON SCOPE. This was originally written believing it also
      // fixed the unreachable-tail bug on the Wuse 2 branch, where the last
      // card sits clipped behind the tab bar. It does not. Measured on device
      // after this guard was added: the bar correctly stays pinned for that
      // list, and the tail is still unreachable — so the auto-hide behaviour
      // was never the cause. That bug is separate, pre-existing, and still
      // open; see the report. Do not treat this guard as its fix.
      if (contentSize.height - layoutMeasurement.height < minScrollable) {
        setVisible(true);
        lastOffsetY.current = y;
        return;
      }

      if (y < topZone) {
        setVisible(true);
      } else if (dy > deadband) {
        setVisible(false);
      } else if (dy < -deadband) {
        setVisible(true);
      }

      lastOffsetY.current = y;
    },
    [topZone, deadband, minScrollable]
  );

  const show = useCallback(() => setVisible(true), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);

  return { visible, onScroll, show, toggle };
}
