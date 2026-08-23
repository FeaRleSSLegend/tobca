// utils/audioDownloads.ts
// "Save for offline" for the church's mp3s.
//
// WHY THIS IS NEW CODE AND NOT AN EXTENSION OF SOMETHING
// Checked first, per the brief. The app has NO existing download or offline
// pattern to extend: the only things resembling one are AsyncStorage caches of
// JSON (services/r2.ts, services/youtube.ts, services/bibleApi.ts) and one
// comment in app/bible-versions.tsx noting that the Bible platform has no
// offline-download endpoint at all. Nothing anywhere writes a media file to
// disk. So this is the first, and it is kept deliberately small.
//
// WHAT IT IS NOT
// Not an offline-sync system. There is no queue, no background transfer, no
// retry policy, no eviction, no "download this whole series" affordance. One
// file at a time, started by an explicit tap, resolved or failed there and
// then. Anything more is a feature nobody has asked for yet, and every one of
// those pieces is a place for a half-written file to become a bug.
//
// STORAGE
// Files land in the DOCUMENT directory, not the cache directory: a recording
// someone deliberately saved to listen to on a journey must not be the first
// thing the OS deletes when storage runs low, which is precisely what the
// cache directory is for. The index is one AsyncStorage blob mapping remote
// url → local uri, in the same one-blob style as every other store here.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const INDEX_KEY = '@audio_downloads:v1';
const FOLDER = 'offline-audio';

/** remote url → local file uri. */
export type DownloadIndex = Record<string, string>;

/**
 * A safe on-disk name for a remote url. The manifest's urls contain raw
 * spaces, ampersands and apostrophes (482 of 546 today — see normalizeUrl in
 * services/r2.ts), none of which belong in a path, and two different
 * recordings can share a basename across folders. Hashing the whole url gives
 * a name that is unique, stable and free of every character that would need
 * escaping.
 */
function localName(url: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${(h >>> 0).toString(16)}.mp3`;
}

function folder(): Directory {
  return new Directory(Paths.document, FOLDER);
}

export async function readIndex(): Promise<DownloadIndex> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as DownloadIndex) : {};
  } catch {
    return {};
  }
}

async function writeIndex(index: DownloadIndex): Promise<void> {
  try {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.warn('Failed to persist audio download index:', e);
  }
}

/**
 * Reconcile the index against what is actually on disk, once at startup.
 *
 * The index and the filesystem can disagree in a way that matters: reinstalling
 * the app, or an OS-level "offload", empties the document directory while
 * AsyncStorage may survive it. An index entry pointing at a file that is gone
 * would make the player attempt a local uri that does not exist and fail with
 * no network fallback — i.e. a saved recording would be the ONLY kind that
 * could not play. Dropping unbacked entries turns that into a plain re-download.
 */
export async function reconcileIndex(): Promise<DownloadIndex> {
  const index = await readIndex();
  const kept: DownloadIndex = {};
  let changed = false;
  for (const [url, uri] of Object.entries(index)) {
    try {
      if (new File(uri).exists) kept[url] = uri;
      else changed = true;
    } catch {
      changed = true;
    }
  }
  if (changed) await writeIndex(kept);
  return kept;
}

/**
 * Download one recording. Resolves to the local uri, or throws — the caller
 * shows the failure; this does not swallow it, because a save that silently
 * did nothing is worse than one that says it failed.
 */
export async function downloadAudio(url: string): Promise<string> {
  const dir = folder();
  if (!dir.exists) dir.create({ intermediates: true });

  const target = new File(dir, localName(url));
  // idempotent: a retry after a partial Android write overwrites rather than
  // rejecting with DestinationAlreadyExists and stranding the user.
  const file = await File.downloadFileAsync(url, target, { idempotent: true });

  const index = await readIndex();
  index[url] = file.uri;
  await writeIndex(index);
  return file.uri;
}

/** Remove a saved recording and its index entry. Best-effort on the file. */
export async function removeDownload(url: string): Promise<void> {
  const index = await readIndex();
  const uri = index[url];
  if (uri) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('Failed to delete offline audio file:', e);
    }
  }
  delete index[url];
  await writeIndex(index);
}
