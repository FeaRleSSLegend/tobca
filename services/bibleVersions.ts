// Bible IDs below were confirmed against the real YouVersion catalog for
// this app's key (all_available=true query, July 2026) — not guessed.
// If a lookup ever starts failing (e.g. "no verses found"), it likely
// means YouVersion renumbered something on their end; re-run:
//   /v1/bibles?language_ranges[]=en&all_available=true&page_size=*&fields[]=id&fields[]=abbreviation&fields[]=title
// and update the map below. That's a rare manual fix, not something the
// app should be re-checking over the network on every launch.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TranslationCode = 'asv' | 'niv' | 'amp';

const VERSION_IDS: Record<TranslationCode, number> = {
  asv: 12,  // The Passion Translation — note: catalog lists it "(In Review)"
              // and its books[] array is missing Exodus–2 Chronicles, Ezra–
              // Esther, and Ecclesiastes. Passages in those books will fail
              // for this translation until YouVersion's catalog fills in.
  niv: 111,   // Filed as "NIV11" in the catalog — the 2011 revision, the
              // standard modern NIV. Not a typo.
  amp: 1588,  // Amplified Bible
};

// Kept async even though it doesn't need to be right now — every call site
// in bibleApi.ts already awaits this, and if a translation ever does need
// a live lookup again (a 6th version, a language other than English) the
// call sites won't need to change, only this function's internals.
export async function getVersionId(translation: TranslationCode): Promise<number> {
  const id = VERSION_IDS[translation];
  if (!id) {
    throw new Error(`No known Bible ID for "${translation}". Check VERSION_IDS in bibleVersions.ts.`);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Display metadata for the version-selection screen. The reading approach
// line is the piece that actually helps someone choose — "word-for-word vs
// thought-for-thought" is the real decision axis between translations, not
// the publication year.
// ---------------------------------------------------------------------------

export interface BibleVersionMeta {
  code: TranslationCode;
  abbreviation: string;
  name: string;
  language: string;
  year: string;
  approach: string; // short tag, e.g. "Word-for-word"
  description: string; // one or two sentences on who it suits
}

export const BIBLE_VERSIONS: BibleVersionMeta[] = [
  {
    code: 'niv',
    abbreviation: 'NIV',
    name: 'New International Version',
    language: 'English',
    year: '2011',
    approach: 'Thought-for-thought',
    description:
      'Balances accuracy with natural modern English. The most widely used contemporary translation — a strong default for everyday reading.',
  },
  {
    code: 'amp',
    abbreviation: 'AMP',
    name: 'Amplified Bible',
    language: 'English',
    year: '2015',
    approach: 'Amplified',
    description:
      'Expands key words with bracketed shades of meaning from the original languages. Best for slow study; wordier for straight-through reading.',
  },
  {
    code: 'asv',
    abbreviation: 'ASV',
    name: 'American Standard Version',
    language: 'English',
    year: '1901',
    approach: 'Word-for-word',
    description:
      'A precise, literal classic translation in formal older English. Good for close comparison with the original text structure.',
  },
];

export function getVersionMeta(code: TranslationCode): BibleVersionMeta {
  return BIBLE_VERSIONS.find((v) => v.code === code) ?? BIBLE_VERSIONS[0];
}

// ---------------------------------------------------------------------------
// Persisted selection — chosen once on the versions screen, read by the
// Plan tab and the reader so the whole Bible experience agrees on one
// translation instead of each screen defaulting independently.
// ---------------------------------------------------------------------------

const TRANSLATION_STORAGE_KEY = '@bible_translation';
const DEFAULT_TRANSLATION: TranslationCode = 'niv';

export async function getSavedTranslation(): Promise<TranslationCode> {
  try {
    const saved = await AsyncStorage.getItem(TRANSLATION_STORAGE_KEY);
    if (saved && (saved === 'asv' || saved === 'niv' || saved === 'amp')) return saved;
  } catch {
    // fall through to default
  }
  return DEFAULT_TRANSLATION;
}

export async function saveTranslation(code: TranslationCode): Promise<void> {
  try {
    await AsyncStorage.setItem(TRANSLATION_STORAGE_KEY, code);
  } catch (error) {
    console.error('Error saving translation choice:', error);
  }
}
