// utils/audioTracks.ts
// The bridge between the R2 audio manifest and the player's vocabulary.
//
// The manifest is rows of a file listing (R2Item: title, sourceFilename, url,
// sizeBytes, date?, speaker?). The player speaks AudioTrack, which is the
// small set of things a now-playing surface needs and which a live prayer
// stream will also be able to satisfy (see the AudioTrack note in
// providers/AudioFileProvider).
//
// Converting between them means normalising a speaker and looking up a series
// for every item, so it is done ONCE per manifest load rather than per render:
// building 546 tracks inside a component body would put that work on every
// keystroke in search and every playback tick in the Library. Every consumer
// memoises on the manifest identity, which only changes when a fetch resolves.

import type { R2Item } from '../services/r2';
import { trackFromR2, type AudioTrack } from '../providers/AudioFileProvider';
import { normalizeSpeaker } from './audioGrouping';

export interface TrackIndex {
  /** Every item as a track, in the order the manifest gave them. */
  all: AudioTrack[];
  /** url → track, for turning a grouped R2Item list into a queue cheaply. */
  byUrl: Map<string, AudioTrack>;
}

export function buildTrackIndex(
  items: R2Item[],
  seriesByUrl: Map<string, string>
): TrackIndex {
  const all = items.map((item) =>
    trackFromR2(item, {
      series: seriesByUrl.get(item.url) ?? null,
      speaker: normalizeSpeaker(item.speaker) ?? null,
    })
  );
  return { all, byUrl: new Map(all.map((t) => [t.sourceUrl ?? t.uri, t])) };
}

/**
 * Turn a list of manifest rows into the queue the player should receive.
 * Rows with no track (impossible today, but the index and the list are built
 * from the same fetch and could drift if that ever stops being true) are
 * dropped rather than faked.
 */
export function toQueue(items: R2Item[], index: TrackIndex): AudioTrack[] {
  return items.map((i) => index.byUrl.get(i.url)).filter((t): t is AudioTrack => !!t);
}
