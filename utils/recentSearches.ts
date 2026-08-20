// utils/recentSearches.ts
// The last few things this person searched for, persisted locally.
//
// Same storage philosophy as utils/playbackProgress.ts and utils/highlights.ts:
// AsyncStorage, one JSON blob, best-effort. A failed read returns an empty
// list and a failed write is logged and swallowed — search must never be
// blocked by its own history.
//
// DEDUPE IS CASE-INSENSITIVE, STORAGE IS NOT. Searching "grace" after "Grace"
// must not produce two chips, but the chip should read the way the person
// actually typed it most recently, so the new spelling replaces the old entry
// rather than being discarded in favour of it.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@recent_searches';

/**
 * How many terms are kept. Eight is roughly two rows of chips on a phone —
 * enough to be genuinely useful as a shortcut, few enough that the section
 * never pushes Browse and Recently Added off the first screen, which is the
 * point at which a history list stops helping and starts being a wall.
 */
export const RECENT_SEARCH_LIMIT = 8;

/** Longer than this is a sentence, not a search term worth keeping. */
const MAX_TERM_LENGTH = 60;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Defensive: this blob is on the user's device across app versions, so a
    // shape that isn't an array of strings gets dropped rather than crashing
    // the screen that renders it.
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === 'string').slice(0, RECENT_SEARCH_LIMIT);
  } catch {
    return [];
  }
}

async function write(terms: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch (e) {
    console.warn('Failed to persist recent searches:', e);
  }
}

/**
 * Record a term and return the new list, most-recent-first. Returns the list
 * so the caller can set state from one source rather than re-reading storage.
 */
export async function addRecentSearch(term: string): Promise<string[]> {
  const clean = term.trim().slice(0, MAX_TERM_LENGTH);
  if (!clean) return getRecentSearches();

  const existing = await getRecentSearches();
  const next = [clean, ...existing.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    RECENT_SEARCH_LIMIT
  );
  await write(next);
  return next;
}

export async function removeRecentSearch(term: string): Promise<string[]> {
  const existing = await getRecentSearches();
  const next = existing.filter((t) => t.toLowerCase() !== term.toLowerCase());
  await write(next);
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear recent searches:', e);
  }
}
