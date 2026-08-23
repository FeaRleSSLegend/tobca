// hooks/useDebouncedValue.ts
// Holds a value still until it stops changing.
//
// WHY SEARCH NEEDED THIS
// The search screen filtered on every keystroke, straight in the render body:
//
//   const results = messages.filter((m) => m.title.toLowerCase().includes(...))
//
// That was tolerable while `messages` was a few hundred YouTube items. It
// stopped being tolerable when audio was added to the same screen, because the
// audio manifest is 546 more items and every one of them is matched against
// title AND speaker. Typing "grace" is five renders, each one a full pass over
// both corpora plus the allocation of a fresh results array — all on the JS
// thread, competing with the keystroke animation that has to paint the letter
// you just typed.
//
// Debouncing is the half of the fix that removes the WORK: five passes become
// one. Memoising the pass on the debounced term (see the search screen) is the
// half that stops it re-running when something unrelated re-renders.
//
// 250ms is the middle of the usual 200–300 band: short enough that results
// feel like they arrive as you type, long enough to swallow a whole word typed
// at speed. The value is returned unchanged on the first render so the initial
// paint is never delayed.

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    // Clearing on every change is what makes this a debounce rather than a
    // throttle: a fast typist never fires the timer at all until they pause.
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
