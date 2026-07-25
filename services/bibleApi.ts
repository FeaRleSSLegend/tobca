import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionId, TranslationCode } from './bibleVersions';
import { parseReadingReference, PassageSegment } from '../utils/referenceParser';

const APP_KEY = process.env.EXPO_PUBLIC_YVP_APP_KEY;
const BASE_URL = 'https://api.youversion.com';

export interface Verse {
  number: number;
  text: string;
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

async function fetchSingleVerse(
  bibleId: number,
  usfm: string,
  chapter: number,
  verse: number
): Promise<string> {
  if (!APP_KEY) {
    throw new Error('EXPO_PUBLIC_YVP_APP_KEY is not set. Add it to your .env file.');
  }

  const passageId = `${usfm}.${chapter}.${verse}`;
  const url = `${BASE_URL}/v1/bibles/${bibleId}/passages/${passageId}?format=text`;
  const res = await fetch(url, {
    headers: { 'X-YVP-App-Key': APP_KEY },
  });

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

  return verseNumbers.map((number, i) => ({ number, text: texts[i] }));
}

function cacheKey(translation: TranslationCode, reference: string): string {
  return `yvp:passage:${translation}:${reference}`;
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
  const segmentResults = await Promise.all(
    segments.map(seg => fetchSegmentVerses(bibleId, seg))
  );
  const verses = segmentResults.flat();

  await AsyncStorage.setItem(key, JSON.stringify(verses));
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