import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionId, TranslationCode } from './bibleVersions';
import { parseReadingReference, PassageSegment } from '../utils/referenceParser';

const APP_KEY = process.env.EXPO_PUBLIC_YVP_APP_KEY;
const BASE_URL = 'https://api.youversion.com';

export interface Verse {
  number: number;
  text: string;
  // Which chapter/book this verse belongs to — carried through from the
  // parsed segment so the reader can draw chapter boundaries. Optional
  // because passages cached under the old shape won't have them (see the
  // cache-key version bump below, which retires those anyway).
  chapter?: number;
  book?: string;
}

/**
 * NOTE on approach: the /passages endpoint returns one opaque `content`
 * string for a range (no per-verse breakdown), and it's unconfirmed whether
 * format=html gives parseable verse markup. So this fetches one verse per
 * request via the same endpoint and assembles the array ourselves — slower
 * per-call but guaranteed correct, and results are cached so it only
 * happens once per passage/translation. If format=html turns out to expose
 * verse spans once you have a live key, fetchSegmentVerses is the only
 * function that would need to change.
 */

/**
 * Fetches one verse's text. Returns null for a verse that legitimately
 * DOESN'T EXIST in this translation (HTTP 404) — that's not an error, it's
 * a fact about the text. The canonical example is Romans 16:24: modern
 * critical translations (NIV, ESV, ASV, CSB…) omit it because it's absent
 * from the earliest manuscripts, so the API correctly 404s that single
 * verse. A missing verse must never take down the passage around it, so
 * the caller skips nulls and renders the rest. Every OTHER failure
 * (network down, bad key, quota, 5xx) still throws — those are real
 * problems the passage genuinely couldn't load, and the reader's error
 * handling should see them.
 */
async function fetchSingleVerse(
  bibleId: number,
  usfm: string,
  chapter: number,
  verse: number
): Promise<string | null> {
  if (!APP_KEY) {
    throw new Error('EXPO_PUBLIC_YVP_APP_KEY is not set. Add it to your .env file.');
  }

  const passageId = `${usfm}.${chapter}.${verse}`;
  const url = `${BASE_URL}/v1/bibles/${bibleId}/passages/${passageId}?format=text`;
  const res = await fetch(url, {
    headers: { 'X-YVP-App-Key': APP_KEY },
  });

  if (res.status === 404) {
    // Verse absent in this translation (textual variant) — skip, don't fail.
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch ${passageId}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return (json.content ?? '').trim();
}

async function fetchSegmentVerses(bibleId: number, segment: PassageSegment): Promise<Verse[]> {
  const verseNumbers: number[] = [];
  for (let v = segment.startVerse; v <= segment.endVerse; v++) {
    verseNumbers.push(v);
  }

  const texts = await Promise.all(
    verseNumbers.map(v => fetchSingleVerse(bibleId, segment.usfm, segment.chapter, v))
  );

  // Drop absent verses (null) and any that came back empty — the surviving
  // verses keep their real numbers, so a gap where 16:24 would be simply
  // shows verse 23 then 25, which is exactly how a printed modern Bible
  // renders it.
  const verses: Verse[] = [];
  verseNumbers.forEach((number, i) => {
    const text = texts[i];
    if (text !== null && text !== '') {
      verses.push({ number, text, chapter: segment.chapter, book: segment.book });
    }
  });
  return verses;
}

function cacheKey(translation: TranslationCode, reference: string): string {
  // v2: verses now carry chapter/book. Bumping the prefix retires every
  // entry cached under the old shape — one refetch per passage, after
  // which everything is cached again under the new key. Cheaper and
  // safer than trying to migrate old entries in place.
  return `yvp:passage:v2:${translation}:${reference}`;
}

/**
 * Fetches all verses for a plan reference field, e.g.
 *   getVersesForReference("Genesis 1:1-31, 2:1-25", "kjv")
 * Handles multi-segment references (comma-separated ranges) by
 * concatenating verses across segments in order.
 * Cached to AsyncStorage indefinitely — scripture text doesn't change.
 */
export async function getVersesForReference(
  reference: string,
  translation: TranslationCode
): Promise<Verse[]> {
  const key = cacheKey(translation, reference);
  const cached = await AsyncStorage.getItem(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const segments = parseReadingReference(reference);
  if (segments.length === 0) {
    return [];
  }

  const bibleId = await getVersionId(translation);

  // Per-SEGMENT isolation, same principle as per-verse above. A reading
  // like "Job 42, Psalm 1, 2" is three segments; if one hits a transient
  // error while the others succeed, the reader should still show what
  // loaded rather than a blank error screen. allSettled lets each segment
  // resolve independently.
  const settled = await Promise.allSettled(
    segments.map(seg => fetchSegmentVerses(bibleId, seg))
  );

  const verses = settled
    .filter((r): r is PromiseFulfilledResult<Verse[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  const anyFailed = settled.some(r => r.status === 'rejected');
  const allFailed = verses.length === 0 && anyFailed;

  // Only a TOTAL failure (nothing loaded at all) throws — that's a genuine
  // "this passage couldn't load" the caller's error UI should handle. A
  // partial load returns the verses it got.
  if (allFailed) {
    const firstError = settled.find(r => r.status === 'rejected') as PromiseRejectedResult;
    throw firstError.reason instanceof Error
      ? firstError.reason
      : new Error(String(firstError.reason));
  }

  // Cache ONLY complete results — a partially-loaded passage must not be
  // frozen into the cache, or the missing segments would never be retried.
  // (Scripture is permanent, so a fully-loaded passage stays cached
  // forever; a partial one refetches next time and can fill the gap.)
  if (!anyFailed) {
    await AsyncStorage.setItem(key, JSON.stringify(verses));
  }
  return verses;
}

// Clears every cached passage — useful if a translation's text needs
// re-pulling (e.g. you accepted a license for a version that previously
// failed and want to retry) or during dev while iterating on the parser.
export async function clearPassageCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const passageKeys = keys.filter(k => k.startsWith('yvp:passage:'));
  await AsyncStorage.multiRemove(passageKeys);
}

/**
 * Warms the passage cache for a set of references in a translation,
 * quietly and sequentially. Fire-and-forget: never awaited by UI code,
 * and a failed reference is skipped, not fatal.
 *
 * This is the app's stand-in for YouVersion's "download this translation"
 * feature: their consumer app ships whole versions as offline bundles,
 * but the Platform API we're on is request-based with no bulk-download
 * endpoint — so instant switching has to be MANUFACTURED by making sure
 * the passages someone is about to read are already cached before they
 * ask for them. The version screen calls this the moment a translation
 * is chosen; by the time the user has navigated back to the reader, the
 * day's readings for the new version are usually already local (and once
 * cached, they're cached forever — scripture doesn't change).
 *
 * Sequential on purpose: getVersesForReference already fans out one
 * request per verse internally, so running references in series keeps
 * the burst against YouVersion's API bounded instead of multiplying it.
 */
export function prefetchReferences(references: string[], translation: TranslationCode): void {
  (async () => {
    for (const ref of references) {
      try {
        await getVersesForReference(ref, translation);
      } catch {
        // Skip and move on — the reader has its own error handling if the
        // user actually opens this one.
      }
    }
  })();
}