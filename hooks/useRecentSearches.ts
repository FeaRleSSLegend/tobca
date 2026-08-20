// hooks/useRecentSearches.ts
// React state over utils/recentSearches.ts.
//
// Every mutator updates local state OPTIMISTICALLY and then reconciles with
// whatever the store returns. Dismissing a chip has to feel instant — waiting
// on a disk round-trip to remove a chip you just tapped is the kind of lag
// that reads as a missed tap and gets tapped again.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../utils/recentSearches';

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);
  // Guards a late-resolving load from overwriting state the user has already
  // changed (open search, immediately dismiss a chip, load lands after).
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    getRecentSearches().then((terms) => {
      if (mounted.current) setRecents(terms);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  const record = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecents((prev) => [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())]);
    addRecentSearch(clean).then((terms) => {
      if (mounted.current) setRecents(terms);
    });
  }, []);

  const remove = useCallback((term: string) => {
    setRecents((prev) => prev.filter((t) => t.toLowerCase() !== term.toLowerCase()));
    removeRecentSearch(term).then((terms) => {
      if (mounted.current) setRecents(terms);
    });
  }, []);

  const clear = useCallback(() => {
    setRecents([]);
    clearRecentSearches();
  }, []);

  return { recents, record, remove, clear };
}
