// Bible IDs below were confirmed against the real YouVersion catalog for
// this app's key (all_available=true query, July 2026) — not guessed.
// If a lookup ever starts failing (e.g. "no verses found"), it likely
// means YouVersion renumbered something on their end; re-run:
//   /v1/bibles?language_ranges[]=en&all_available=true&page_size=*&fields[]=id&fields[]=abbreviation&fields[]=title
// and update the map below. That's a rare manual fix, not something the
// app should be re-checking over the network on every launch.

export type TranslationCode = 'kjv' | 'niv' | 'amp';

const VERSION_IDS: Record<TranslationCode, number> = {
  kjv: 1,     // King James Version
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