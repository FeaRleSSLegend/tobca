// hooks/useR2Manifest.ts
// React state over services/r2.ts, shared by the Library's Audio mode and the
// Prayer tab's documents section — the two screens are the same problem
// (fetch a list once, show loading, survive a failure), so they get one hook
// rather than two nearly-identical effects.
//
// The status model is deliberately three-valued and not a boolean pair.
// `loading` + `error` as separate flags always ends up with a fourth,
// impossible combination someone has to render defensively; a single status
// makes "which of these do I draw" a switch with no dead branches.

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchManifest, type R2Item, type R2ManifestKind } from '../services/r2';

export type ManifestStatus = 'loading' | 'ready' | 'error';

interface UseR2ManifestResult {
  items: R2Item[];
  status: ManifestStatus;
  /** True when the list on screen came from cache because the network failed. */
  stale: boolean;
  /** Retry after a failure — wired to the error state's action button. */
  reload: () => void;
}

export function useR2Manifest(kind: R2ManifestKind): UseR2ManifestResult {
  const [items, setItems] = useState<R2Item[]>([]);
  const [status, setStatus] = useState<ManifestStatus>('loading');
  const [stale, setStale] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    // Not reset to 'loading' on a retry of an already-populated list — that
    // would blank real content out to show a spinner, which is a downgrade.
    setStatus((s) => (s === 'ready' ? s : 'loading'));

    fetchManifest(kind)
      .then((result) => {
        if (!mounted.current) return;
        setItems(result.items);
        setStale(result.fromStaleCache);
        setStatus('ready');
      })
      .catch((e) => {
        if (!mounted.current) return;
        console.warn(`Failed to load ${kind} manifest:`, e);
        setStatus('error');
      });

    return () => {
      mounted.current = false;
    };
  }, [kind, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  return { items, status, stale, reload };
}
