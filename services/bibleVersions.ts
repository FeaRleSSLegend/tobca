// Bible IDs below were confirmed against the real YouVersion catalog for
// this app's key — not guessed. Re-verified August 2026, when three versions
// were added; every id here was checked twice, once in the catalog listing and
// again by actually fetching JHN.3.16, GEN.1.1, PSA.23.1 and EXO.20.3 through
// it and confirming a 200 with real text.
//
// WHAT THIS KEY ACTUALLY LICENSES. The catalog returns exactly 20 English
// Bibles for this app key, and ESV, NLT, NKJV, KJV, CSB, NASB(1995 aside),
// MSG and NRSV are NOT among them — requests for them do not 404 at the
// passage level, they simply are not in the catalog at all. So they cannot be
// added no matter how the code is written; that needs a licensing change on
// the YouVersion side, not an app change.
// If a lookup ever starts failing (e.g. "no verses found"), it likely
// means YouVersion renumbered something on their end; re-run:
//   /v1/bibles?language_ranges[]=en&all_available=true&page_size=*&fields[]=id&fields[]=abbreviation&fields[]=title
// and update the map below. That's a rare manual fix, not something the
// app should be re-checking over the network on every launch.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TranslationCode = 'asv' | 'niv' | 'amp' | 'nasb' | 'bsb' | 'nirv';

const VERSION_IDS: Record<TranslationCode, number> = {
  // CORRECTED. This line used to carry a comment describing "The Passion
  // Translation ... missing Exodus-2 Chronicles, Ezra-Esther, Ecclesiastes".
  // That comment belongs to a DIFFERENT id: the catalog reports 12 as the
  // American Standard Version with a complete 66-book list, and TPT is id
  // 1849 with 51 books. Verified by fetching EXO.20.3 through id 12, which
  // returns 200 — the very case the old comment said would fail.
  asv: 12,    // American Standard Version, 66 books
  niv: 111,   // Filed as "NIV11" in the catalog — the 2011 revision, the
              // standard modern NIV. Not a typo.
  amp: 1588,  // Amplified Bible, 66 books
  nasb: 2692, // New American Standard Bible 2020, 66 books
  bsb: 3034,  // Berean Standard Bible, 66 books
  nirv: 110,  // New International Reader's Version 2014, 66 books
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
  year: string;
  approach: string; // short tag, e.g. "Word-for-word"
  description: string; // ONE sentence on who it suits
}

// `language` was removed from this type rather than merely hidden. Every entry
// carried the string "English", it was rendered on every card, and the whole
// catalog this key exposes to the app is English — so it was a constant
// dressed as data. If a second language is ever offered, the picker will need
// grouping by language, not a repeated label on every row.

export const BIBLE_VERSIONS: BibleVersionMeta[] = [
  {
    code: 'niv',
    abbreviation: 'NIV',
    name: 'New International Version',
    year: '2011',
    approach: 'Thought-for-thought',
    description: 'The most widely used modern translation, and a solid default for everyday reading.',
  },
  {
    code: 'nasb',
    abbreviation: 'NASB',
    name: 'New American Standard Bible',
    year: '2020',
    approach: 'Word-for-word',
    description: 'A very literal modern translation, close to the original sentence structure.',
  },
  {
    code: 'bsb',
    abbreviation: 'BSB',
    name: 'Berean Standard Bible',
    year: '2022',
    approach: 'Balanced',
    description: 'Clear contemporary English that stays close to the original wording.',
  },
  {
    code: 'amp',
    abbreviation: 'AMP',
    name: 'Amplified Bible',
    year: '2015',
    approach: 'Amplified',
    description: 'Expands key words with bracketed shades of meaning, best for slow study.',
  },
  {
    code: 'nirv',
    abbreviation: 'NIrV',
    name: "New International Reader's Version",
    year: '2014',
    approach: 'Simplified',
    description: 'Short sentences and plain vocabulary, for younger readers or reading in a second language.',
  },
  {
    code: 'asv',
    abbreviation: 'ASV',
    name: 'American Standard Version',
    year: '1901',
    approach: 'Word-for-word',
    description: 'A precise classic in formal older English, useful for close comparison.',
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
    // Validated against the real list rather than a hand-written union that
    // has to be edited every time a version is added — which is exactly how a
    // newly added version would silently fail to persist.
    if (saved && BIBLE_VERSIONS.some((v) => v.code === saved)) {
      return saved as TranslationCode;
    }
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
