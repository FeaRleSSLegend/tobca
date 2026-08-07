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
        if (__DEV__) console.warn(`[referenceParser] Unknown book "${book}" in "${reference}"`);
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

    if (__DEV__) console.warn(`[referenceParser] Could not parse part "${part}" in "${reference}"`);
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

/**
 * Human-compact form of a plan reference, grouped PER BOOK:
 *   "Job 39:1-30, 40:1-24"            → "Job 39-40"
 *   "Job 42:1-17, Psalm 1:1-6, 2:1-12" → "Job 42 · Psalm 1-2"
 *
 * The per-book grouping is the point: the old naive version pooled every
 * chapter number across the whole reference, so a Job-then-Psalm reading
 * produced "Job 1-42" — chapters 1 and 2 belonged to Psalms, but the
 * min/max didn't know that. Falls back to the raw reference for anything
 * the parser can't read (never worse than before).
 */
export function compactReference(reference: string): string {
  const segments = parseReadingReference(reference);
  if (segments.length === 0) return reference;

  const byBook = new Map<string, number[]>();
  for (const s of segments) {
    const list = byBook.get(s.book);
    if (list) list.push(s.chapter);
    else byBook.set(s.book, [s.chapter]);
  }

  const parts: string[] = [];
  for (const [book, chapters] of byBook) {
    const min = Math.min(...chapters);
    const max = Math.max(...chapters);
    parts.push(min === max ? `${book} ${min}` : `${book} ${min}-${max}`);
  }
  return parts.join(' · ');
}

/**
 * Rough time-to-read for a set of plan references, from verse counts —
 * no fetching, so it's usable anywhere (Home) without touching the API.
 * Assumes ~8 seconds per verse (avg verse ≈ 25 words at an unhurried
 * ~180 wpm devotional pace). An estimate, not a promise — hence callers
 * should present it as "about N min".
 */
export function estimateReadingMinutes(references: string[]): number {
  let totalVerses = 0;
  for (const ref of references) {
    for (const seg of parseReadingReference(ref)) {
      totalVerses += seg.endVerse - seg.startVerse + 1;
    }
  }
  return Math.max(1, Math.round((totalVerses * 8) / 60));
}