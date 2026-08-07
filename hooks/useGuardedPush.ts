import { useCallback, useRef } from 'react';
import { useRouter, type Href } from 'expo-router';

// A push is not instant: expo-router commits the navigation, but the screen
// transition takes a few hundred ms and the trigger stays mounted, visible and
// tappable that whole time. Two quick taps therefore fire onPress twice before
// anything about the UI has changed, and BOTH pushes are honoured — so you
// land on two stacked copies of the same screen and have to press back twice.
// Reported against the search bar, but nothing about it is search-specific:
// every push trigger in the app has the same window.
//
// A time window is used rather than a "is a navigation in flight" flag because
// there is no reliable completion signal to clear such a flag against, and a
// flag that fails to clear breaks navigation permanently. A stale timestamp
// can only ever cost one ignored tap.
const REENTRY_WINDOW_MS = 700;

/**
 * router.push, minus the double-fire. Drop-in replacement: same argument, and
 * the returned function is referentially stable.
 */
export function useGuardedPush() {
  const router = useRouter();
  const lastPushAt = useRef(0);

  return useCallback(
    (href: Href) => {
      const now = Date.now();
      if (now - lastPushAt.current < REENTRY_WINDOW_MS) return;
      lastPushAt.current = now;
      router.push(href);
    },
    [router]
  );
}
