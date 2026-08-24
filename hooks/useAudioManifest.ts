// hooks/useAudioManifest.ts
// The audio manifest, split by purpose.
//
// The R2 audio manifest is one list of 546 files, but it feeds two tabs now:
// the Library's Audio tab (teachings) and the Prayer tab's recordings section
// (prayer gatherings). See utils/audioPurpose for how the split is decided.
//
// WHY A HOOK RATHER THAN A FILTER AT EACH CALL SITE
// There are three Library-side consumers (the Audio tab, the collection screen,
// and anything added later) and one Prayer-side. If each applied its own
// filter, the two tabs could drift apart — and the specific way they would
// drift is the bad one: a recording appearing in NEITHER place, invisible to
// everyone, because one side excluded it and the other never included it. One
// hook with one predicate per scope makes that impossible to express.
//
// The two scopes are deliberately NOT complements. Service-embedded prayer
// segments ("Prayer 3 Warfare 1St Serv…") belong to both — they are prayer,
// and they are also part of the Sunday services they were recorded in, so
// removing them from the Library would quietly delete eight recordings from
// listings they belong to. belongsInLibraryAudio and belongsInPrayerAudio both
// return true for those, and the overlap is the point.
//
// SEARCH IS DELIBERATELY NOT SCOPED. app/search.tsx keeps reading the raw
// manifest through useR2Manifest, because search should find a recording
// wherever it lives — a person searching "prophetic prayer" wants the file,
// not a lesson about which tab we filed it under.

import { useMemo } from 'react';
import { useR2Manifest } from './useR2Manifest';
import { belongsInLibraryAudio, belongsInPrayerAudio } from '../utils/audioPurpose';
import type { R2Item } from '../services/r2';

export type AudioScope = 'library' | 'prayer';

interface UseAudioManifestResult {
  items: R2Item[];
  status: ReturnType<typeof useR2Manifest>['status'];
  stale: boolean;
  reload: () => void;
}

export function useAudioManifest(scope: AudioScope): UseAudioManifestResult {
  const { items, status, stale, reload } = useR2Manifest('audio');

  // Memoised on the manifest identity, which only changes when a fetch
  // resolves — so this runs once per load, not on every render. The predicate
  // is a pure title match (see utils/audioPurpose), so there is nothing else
  // to invalidate on.
  const scoped = useMemo(
    () =>
      items.filter((i) =>
        scope === 'library' ? belongsInLibraryAudio(i.title) : belongsInPrayerAudio(i.title)
      ),
    [items, scope]
  );

  return { items: scoped, status, stale, reload };
}
