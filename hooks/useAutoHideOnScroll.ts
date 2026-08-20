// hooks/useAutoHideOnScroll.ts
//
// "Hide this bar the instant the user starts consuming content, bring it back
// the instant they scroll back up." Extracted from app/reading.tsx, where it
// was inline and tangled together with the reader's scroll-offset persistence,
// so the Library filter row could use the SAME behaviour rather than a second
// implementation that drifts from it.
//
// THE RULE, AS OF THE IMMEDIACY FIX — one line long:
//   any downward delta hides, any upward delta shows. No zones, no minimum
//   travel, no jitter deadband.
//
// WHAT WAS REMOVED, AND WHY IT WAS NOT JUST TURNED DOWN
// The previous version had two guards that both delayed the response, and
// smaller values would only have made the delay harder to notice rather than
// removing it, so both are gone rather than tuned:
//
//   topZone (40pt)   "within 40pt of the top, always show". This is what made
//                    the bar feel stuck: the first ~40pt of every downward
//                    scroll — a good fraction of a flick — did nothing at all,
//                    so the hide always started late and read as lag.
//   deadband (12pt)  "ignore movement under 12pt". A second delay stacked on
//                    the first: even past the top zone, the bar only moved
//                    once the finger had already travelled 12pt.
//
// The deadband existed to stop finger jitter flipping the state continuously.
// That risk is real and is now accepted deliberately — see the note on
// setVisible below for why it does not actually strobe in practice.
//
// WHAT WAS KEPT: minScrollable. This is NOT a scroll-distance threshold and
// removing it would not make anything more immediate — it is a content-size
// guard. If the whole list is already almost visible, hiding the bar buys the
// user nothing and costs them the control they were reaching for, and there is
// no "consuming content" moment to react to in the first place. It only ever
// suppresses hiding on lists that barely scroll.
//
// This hook owns the DECISION only, never the presentation. A bottom overlay
// (BibleQuickNav) can translate itself off-screen because it floats; a bar in
// normal flow (BranchFilter) has to collapse its height so the content below
// closes the gap. Those are different animations of the same decision.
//
// NOTE FOR CALLERS: the decision is only as immediate as the scroll events
// feeding it. Every call site passes scrollEventThrottle={16} so the first
// delta arrives on the next frame; at 100 the bar would still wait up to a
// tenth of a second no matter what this file does.
import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface AutoHideOptions {
  /**
   * The list must have at least this much scrollable distance before hiding
   * is allowed at all. A content-size guard, not a travel threshold — see the
   * note above.
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
  // Two bar-heights' worth of slack. Below this there is nothing to gain by
  // hiding (you can see the whole list already).
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

      // At rest at the very top (or bouncing above it) the bar is shown. This
      // is not a zone — it is the single position y === 0, where there is no
      // meaningful delta to read and a hidden bar would look broken.
      //
      // Otherwise: sign of the delta, nothing else. React bails out of a state
      // update that sets the same value, so a run of downward events after the
      // first costs no re-render, and only a genuine direction CHANGE moves
      // the bar — which is why dropping the deadband does not produce a
      // strobe: a finger held still emits dy === 0, which matches neither
      // branch and leaves the state alone.
      if (y <= 0) {
        setVisible(true);
      } else if (dy > 0) {
        setVisible(false);
      } else if (dy < 0) {
        setVisible(true);
      }

      lastOffsetY.current = y;
    },
    [minScrollable]
  );

  const show = useCallback(() => setVisible(true), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);

  return { visible, onScroll, show, toggle };
}
