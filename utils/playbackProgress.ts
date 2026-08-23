// utils/playbackProgress.ts
// Per-message playback position, persisted locally. This is the data
// foundation the architecture doc calls out for "Continue Watching" and
// "Continue Listening" — those future rows are just a query over this
// store, so building it now (even before the rows exist) means playback
// records progress from day one and the rows can light up later with no
// migration.
//
// Same storage philosophy as the rest of the app: AsyncStorage, one JSON
// blob, best-effort (a failed write never blocks playback). Positions are
// keyed by the composite message id, so they're stable across sources and
// branches and survive a message appearing in multiple collections.
//
// NOW SHARED WITH AUDIO. The R2 audio player (providers/AudioFileProvider)
// persists through this same store rather than opening a second one, so
// "continue where you left off" is ONE mechanism with one storage key, one
// started/finished policy and one place to change any of it. An audio item has
// no Message id, so it brings its own key via mediaKey() below — the map is
// keyed by an opaque media key that happens to be a Message id for video.
//
// The stored records still call that field `messageId`. Renaming it would
// invalidate every position already saved on every device to gain nothing but
// a better word, so the name is legacy and the meaning is "media key".
//
// EXTENDING TO A BACKEND LATER: everything above the storage line is already
// shaped for it — savePosition/getPosition/getInProgress are async, the record
// carries `updatedAt` (which is what a last-write-wins sync needs), and no
// caller touches AsyncStorage directly. A sync layer would replace readMap and
// writeMap and nothing else. That is the whole of the preparation; none of it
// is built, and none of it should be until there is a backend to sync to.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@playback_progress';

// Below this fraction we treat a message as "not really started" (an
// accidental tap), and above it as "finished" — neither belongs in a
// Continue row, so both are excluded when that row is built later.
export const STARTED_THRESHOLD = 0.02;
export const FINISHED_THRESHOLD = 0.95;

/**
 * The store key for an audio recording. sourceFilename first because it is the
 * stabler identifier of the two — the R2 base url comes from an env var and
 * could change between the dev and production buckets, which would orphan
 * every saved position keyed by url. Falls back to the url for the (currently
 * nonexistent) item whose sourceFilename the manifest omits.
 */
export function mediaKey(sourceFilename: string, url: string): string {
  return `audio:${sourceFilename || url}`;
}

export interface PlaybackPosition {
  messageId: string;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: number; // epoch ms — lets a Continue row sort by most recent
}

type ProgressMap = Record<string, PlaybackPosition>;

async function readMap(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: ProgressMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to persist playback progress:', e);
  }
}

export async function getPosition(messageId: string): Promise<PlaybackPosition | null> {
  const map = await readMap();
  return map[messageId] ?? null;
}

/**
 * Save where playback currently is. Called on a throttled interval by the
 * player (not every frame). Once a message crosses the finished threshold
 * its entry is REMOVED rather than pinned at 100% — a finished message
 * shouldn't clutter a Continue row, and starting it again should begin
 * from the top, which is the least surprising behavior.
 */
export async function savePosition(
  messageId: string,
  positionSeconds: number,
  durationSeconds: number
): Promise<void> {
  const map = await readMap();
  if (durationSeconds > 0 && positionSeconds / durationSeconds >= FINISHED_THRESHOLD) {
    delete map[messageId];
  } else {
    map[messageId] = { messageId, positionSeconds, durationSeconds, updatedAt: Date.now() };
  }
  await writeMap(map);
}

export async function clearPosition(messageId: string): Promise<void> {
  const map = await readMap();
  delete map[messageId];
  await writeMap(map);
}

/**
 * All in-progress positions, most-recent first — the exact shape a future
 * "Continue Watching / Listening" row consumes. Entries below the started
 * threshold are filtered out so a stray one-second tap never shows up as
 * something to resume.
 */
export async function getInProgress(): Promise<PlaybackPosition[]> {
  const map = await readMap();
  return Object.values(map)
    .filter((p) => p.durationSeconds > 0 && p.positionSeconds / p.durationSeconds >= STARTED_THRESHOLD)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
