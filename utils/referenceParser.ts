import { getUSFMCode } from '../data/bibleBooks';

export interface PassageSegment {
  book: string;       // display name, e.g. "Genesis"
  usfm: string;        // e.g. "GEN"
  chapter: number;
  startVerse: number;
  endVerse: number;
  passageId: string;   // e.g. "GEN.1.1-31" — what the YouVersion API expects
}

// Matches "Genesis 1:1-31" (book name, chapter, verse range) at the start of a part
const FULL_REF = /^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)*)\s+(\d+):(\d+)(?:-(\d+))?$/;
// Matches "2:1-25" (chapter + verse range only — book carries over from a previous part)
const CHAPTER_ONLY = /^(\d+):(\d+)(?:-(\d+))?$/;

/**
 * Parses a single field from biblePlan.ts, e.g.
 *   "Genesis 1:1-31, 2:1-25"       -> two segments, both Genesis
 *   "Psalm 2:1-12"                  -> one segment
 *   "Matthew 1:1-25, 2:1-12"        -> two segments, both Matthew
 *
 * Returns [] for any part it can't confidently parse (logged, not thrown —
 * a bad reference shouldn't crash the reading screen).
 */
export function parseReadingReference(reference: string): PassageSegment[] {
  const parts = reference.split(',').map(p => p.trim()).filter(Boolean);
  const segments: PassageSegment[] = [];

  let currentBook: string | null = null;
  let currentUSFM: string | null = null;

  for (const part of parts) {
    const fullMatch = part.match(FULL_REF);

    if (fullMatch) {
      const [, book, chapterStr, startStr, endStr] = fullMatch;
      const usfm = getUSFMCode(book);
      if (!usfm) {
        console.warn(`[referenceParser] Unknown book "${book}" in "${reference}"`);
        continue;
      }
      currentBook = book;
      currentUSFM = usfm;
      pushSegment(segments, book, usfm, chapterStr, startStr, endStr);
      continue;
    }

    const chapterMatch = part.match(CHAPTER_ONLY);
    if (chapterMatch && currentBook && currentUSFM) {
      const [, chapterStr, startStr, endStr] = chapterMatch;
      pushSegment(segments, currentBook, currentUSFM, chapterStr, startStr, endStr);
      continue;
    }

    console.warn(`[referenceParser] Could not parse part "${part}" in "${reference}"`);
  }

  return segments;
}

function pushSegment(
  segments: PassageSegment[],
  book: string,
  usfm: string,
  chapterStr: string,
  startStr: string,
  endStr: string | undefined
) {
  const chapter = parseInt(chapterStr, 10);
  const startVerse = parseInt(startStr, 10);
  const endVerse = endStr ? parseInt(endStr, 10) : startVerse;

  segments.push({
    book,
    usfm,
    chapter,
    startVerse,
    endVerse,
    passageId: `${usfm}.${chapter}.${startVerse}-${endVerse}`,
  });
}