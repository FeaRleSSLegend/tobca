// hooks/useContinueListening.ts
// The one in-progress item to offer at the top of a screen.
//
// READS THE EXISTING STORE, BUILDS NOTHING NEW. utils/playbackProgress has
// recorded positions since the video player shipped and the audio player was
// extended onto the same store rather than opening a second one — so
// "continue where you left off" already exists as data, keyed by exactly the
// string AudioTrack.id carries (see trackFromR2, which builds the id with
// mediaKey precisely so a row like this can look a track up by it). All that
// was missing was somewhere to show it.
//
// SCOPED BY THE TRACK LIST PASSED IN, not by a global query. Prayer must offer
// prayer recordings, not the Library teaching someone abandoned last week, and
// the caller already holds the scoped list (useAudioManifest('prayer')). The
// store's own started/finished thresholds do the rest: getInProgress() drops a
// stray one-second tap and savePosition() deletes a record once it crosses the
// finished line, so a finished recording cannot come back as something to
// resume.
//
// MOST RECENT WINS. getInProgress() already returns updatedAt-descending, so
// the first match is the answer and there is no second sort here.
//
// RE-READ ON FOCUS, because the position is written by the player on another
// surface: someone taps the card, listens, and comes back to this tab. Focus is
// the only moment the number can have changed without this screen knowing.
// `activeId` is a second trigger for the case where playback starts and stops
// without the screen ever losing focus (the mini bar sits over this tab).
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { AudioTrack } from '../providers/AudioFileProvider';
import { getInProgress } from '../utils/playbackProgress';

export interface ContinueEntry {
  track: AudioTrack;
  positionSeconds: number;
  durationSeconds: number;
}

export function useContinueListening(
  tracks: AudioTrack[],
  activeId?: string | null
): { entry: ContinueEntry | null; ready: boolean } {
  const [entry, setEntry] = useState<ContinueEntry | null>(null);
  // Distinguishes "no in-progress item" from "haven't looked yet", so the slot
  // can stay quiet for one frame instead of flashing the empty state on every
  // return to the tab.
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      // Nothing to match against yet — the manifest is still loading. Leave
      // the previous answer in place rather than blanking to "nothing here".
      if (tracks.length === 0) return;

      const byId = new Map(tracks.map((t) => [t.id, t]));
      getInProgress()
        .then((positions) => {
          if (cancelled) return;
          const hit = positions.find((p) => byId.has(p.messageId));
          setEntry(
            hit
              ? {
                  track: byId.get(hit.messageId)!,
                  positionSeconds: hit.positionSeconds,
                  durationSeconds: hit.durationSeconds,
                }
              : null
          );
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) setReady(true);
        });

      return () => {
        cancelled = true;
      };
    }, [tracks, activeId])
  );

  return { entry, ready };
}
