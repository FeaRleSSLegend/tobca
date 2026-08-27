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
 * ONE REQUEST PER SEGMENT, not per verse.
 *
 * This module used to fetch every verse individually, because format=text
 * returns one opaque blob for a range and it was unverified whether
 * format=html exposed verse boundaries. It does. A ranged request returns
 * anchors of the form
 *
 *   <span class="yv-v" v="7"></span><span class="yv-vlbl">7</span>Verse text…
 *
 * which is enough to split the passage back into numbered verses. The old
 * approach cost one ~1s round trip PER VERSE: a single day's four readings
 * ran to 50+ requests, which is why the Plan tab and the reader sat on a
 * loader for so long.
 *
 * Verified before switching: ranged+parsed output is byte-identical to the
 * per-verse output for prose (1 Corinthians 4) and for poetry with
 * superscriptions and small-caps divine names (Psalm 13, Psalm 29).
 *
 * Two details the range form gets for free:
 *   - a verse absent from a translation (Romans 16:24 in modern critical
 *     texts) simply has no anchor, so it drops out exactly as the old
 *     404-per-verse path made it drop out;
 *   - the passage heading / psalm superscription sits BEFORE the first
 *     anchor, so discarding the leading chunk removes it — matching the old
 *     behaviour, which never saw it at all.
 *
 * fetchVersesOneByOne is kept as a fallback for the case where a range
 * request 404s or yields nothing parseable.
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

// Hermes has no DOM, so the passage markup is unwound with string work.
// `&amp;` is decoded LAST: doing it first would turn "&amp;lt;" into "&lt;"
// and then into "<", corrupting text that legitimately contains an escaped
// entity.
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function plainText(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a ranged passage's HTML back into numbered verses. */
function parsePassageHtml(content: string, segment: PassageSegment): Verse[] {
  // The printed verse label is a separate span from the anchor; drop it, or
  // every verse's text would start with its own number (the reader draws that
  // itself).
  let s = content.replace(/<span class="yv-vlbl">[\s\S]*?<\/span>/g, '');
  // Block ends become spaces. Without this, poetry set as consecutive <div>s
  // would concatenate across the line break: "forever?How long".
  s = s.replace(/<\/(?:div|p)>/g, ' ');

  // A capturing split interleaves [before, num, text, num, text, …]; index 0
  // is whatever preceded the first verse (heading/superscription) and is
  // dropped.
  const parts = s.split(/<span class="yv-v" v="(\d+)"[^>]*>\s*<\/span>/);

  const verses: Verse[] = [];
  for (let i = 1; i < parts.length - 1; i += 2) {
    const number = parseInt(parts[i], 10);
    if (!Number.isFinite(number)) continue;
    // Guard against the API ever returning more than was asked for.
    if (number < segment.startVerse || number > segment.endVerse) continue;
    const text = plainText(parts[i + 1]);
    if (text) verses.push({ number, text, chapter: segment.chapter, book: segment.book });
  }
  return verses;
}

/**
 * One request for the whole segment. Returns null when the range can't be
 * served or parsed, so the caller can fall back to the per-verse path rather
 * than showing an empty passage.
 */
async function fetchRangedVerses(
  bibleId: number,
  segment: PassageSegment
): Promise<Verse[] | null> {
  if (!APP_KEY) {
    throw new Error('EXPO_PUBLIC_YVP_APP_KEY is not set. Add it to your .env file.');
  }

  // Note the range form: "PSA.13.1-6". The fully-qualified
  // "PSA.13.1-PSA.13.6" that USFM elsewhere accepts 404s on this endpoint.
  const passageId =
    segment.startVerse === segment.endVerse
      ? `${segment.usfm}.${segment.chapter}.${segment.startVerse}`
      : `${segment.usfm}.${segment.chapter}.${segment.startVerse}-${segment.endVerse}`;

  const res = await fetch(`${BASE_URL}/v1/bibles/${bibleId}/passages/${passageId}?format=html`, {
    headers: { 'X-YVP-App-Key': APP_KEY },
  });

  if (res.status === 404) return null; // let the per-verse path try
  if (!res.ok) {
    throw new Error(`Failed to fetch ${passageId}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const content: string = json.content ?? '';
  const verses = parsePassageHtml(content, segment);
  return verses.length > 0 ? verses : null;
}

/** The original path: one request per verse. Fallback only. */
async function fetchVersesOneByOne(bibleId: number, segment: PassageSegment): Promise<Verse[]> {
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

async function fetchSegmentVerses(bibleId: number, segment: PassageSegment): Promise<Verse[]> {
  const ranged = await fetchRangedVerses(bibleId, segment);
  if (ranged) return ranged;
  return fetchVersesOneByOne(bibleId, segment);
}

function cacheKey(translation: TranslationCode, reference: string): string {
  // v2: verses now carry chapter/book. Bumping the prefix retires every
  // entry cached under the old shape — one refetch per passage, after
  // which everything is cached again under the new key. Cheaper and
  // safer than trying to migrate old entries in place.
  return `yvp:passage:v2:${translation}:${reference}`;
}

export interface FetchOptions {
  /**
   * Skip the cache read and re-request from the network. For an explicit,
   * human "Try again" ONLY — see the note below on why a retry has to be able
   * to do this, and why nothing else should.
   */
  bypassCache?: boolean;
}

/**
 * Fetches all verses for a plan reference field, e.g.
 *   getVersesForReference("Genesis 1:1-31, 2:1-25", "kjv")
 * Handles multi-segment references (comma-separated ranges) by
 * concatenating verses across segments in order.
 * Cached to AsyncStorage indefinitely — scripture text doesn't change.
 *
 * WHY THIS FUNCTION KNOWS WHAT A RETRY IS
 *
 * The reader's "Try again" button was reported as not retrying: a spinner, then
 * the same failure, with no apparent second attempt. The button and the effect
 * behind it turned out to be correct — app/reading.tsx keeps a retryCount in
 * the fetch effect's dependency array, so tapping it genuinely re-runs the
 * effect and genuinely calls this function again. What it could not do was get
 * past this function, because every path back out of a failed load ran through
 * a short-circuit here BEFORE any request was made:
 *
 *  1. THE CACHE READ WAS UNCONDITIONAL. A retry got whatever the first attempt
 *     left behind, from disk, without touching the network — so a retry could
 *     not be more authoritative than the attempt that failed, which is the one
 *     thing a retry is for.
 *
 *  2. AN EMPTY RESULT WAS CACHED FOREVER. `if (!anyFailed)` was true when every
 *     segment RESOLVED with zero verses — which is exactly what happens when a
 *     translation's catalogue is missing the book (see the ASV note in
 *     bibleVersions.ts: that id's books[] omits Exodus–2 Chronicles, Ezra–
 *     Esther and Ecclesiastes, so a ranged request 404s and the per-verse
 *     fallback 404s on every verse). `[]` then went to disk under a key that
 *     never expires, and every subsequent call — including every retry —
 *     returned it from (1) in a few milliseconds. Permanent, and immune to the
 *     network coming back.
 *
 *  3. A CORRUPT CACHE ENTRY THREW. JSON.parse ran unguarded on whatever the
 *     key held, so one bad write produced a rejection on every call for that
 *     passage forever, with no request and nothing to fix it.
 *
 * All three are the same bug wearing different clothes: a failed load left
 * state that made the next attempt cheap instead of real. The fix is that a
 * retry bypasses the cache, only non-empty results are written, and a cache
 * entry that cannot be read is discarded rather than thrown.
 */
export async function getVersesForReference(
  reference: string,
  translation: TranslationCode,
  options: FetchOptions = {}
): Promise<Verse[]> {
  const key = cacheKey(translation, reference);

  if (!options.bypassCache) {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Verse[];
        // An empty array can still be sitting under this key from before empty
        // results stopped being cached. Treat it as a miss and refetch rather
        // than serving it, or the passages poisoned by the old behaviour would
        // stay broken on every device that already has one.
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Unreadable entry — drop it and fetch. Rethrowing here would report a
        // storage problem as "this passage couldn't load", which is both wrong
        // and unfixable from the UI.
        await AsyncStorage.removeItem(key).catch(() => {});
      }
    }
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

  // Cache ONLY complete, NON-EMPTY results.
  //
  // Complete, because a partially-loaded passage frozen into a cache that never
  // expires would mean the missing segments are never retried. Non-empty,
  // because "every segment resolved with nothing" is not a passage — it is a
  // translation that doesn't carry the book, or a parse that found no verses,
  // and writing that to a permanent key is what made "Try again" a no-op for
  // good. Scripture is permanent, so a fully-loaded passage stays cached
  // forever; everything else is refetched.
  if (!anyFailed && verses.length > 0) {
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
 * Sequential on purpose: getVersesForReference fans out one request per
 * SEGMENT internally, so running references in series keeps the burst against
 * YouVersion's API bounded instead of multiplying it.
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