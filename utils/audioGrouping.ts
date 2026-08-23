// utils/audioGrouping.ts
// Turning a flat R2 audio manifest into the same shape the video Library has:
// series, plus the standalone recordings that belong to no series.
//
// WHY THIS IS NOT utils/contentGrouping.ts
// That file clusters YouTube sermon titles fuzzily — normalising tokens,
// splitting "theme" from "service label", merging near-matches — because
// YouTube titles are marketing copy ("Sunday Service | 12 May | Pst Abu on
// FAITH"). These titles are not: they come from filenames the church itself
// typed, and they are already clean and consistent. Fuzzy clustering over data
// this regular would invent groupings that are not there. One exact key, from
// one suffix strip, is the whole algorithm.
//
// THE SUFFIX PATTERNS, MEASURED AGAINST THE REAL MANIFEST (546 items) rather
// than guessed at:
//
//   "… Part 3"       79 titles   "Centrality Of Faith Part 5"
//   "… 12"          283 titles   "Breaking The Yoke Of Poverty 12"
//   "… (1)"          26 titles   "Communion Service (1)" — a duplicate-file
//                                marker from the upload, but it behaves
//                                identically for grouping and stripping it is
//                                what stops it splitting a real group in two
//   "… Prt 4"         6 titles   "The Effect Of Slothfulness Prt 4" — a
//                                misspelling that occurs enough to matter
//   "… Day 18"        2 titles   "Commanding The Year 2023 Day 18"
//
// Patterns explicitly NOT handled because the data does not contain them:
// "Pt.", "- 3", "#3", "Vol 2", "Session 2", roman numerals. All measured at
// zero occurrences; adding them would be code no title exercises.
//
// Result on the live manifest: 63 series covering 292 recordings, 254
// standalone.

import type { R2Item } from '../services/r2';

/**
 * Ordered strips, applied repeatedly until the title stops changing —
 * "How To Make Your Marriage & Relationship Work 1 (1)" needs two passes.
 */
const SUFFIXES: RegExp[] = [
  // "(1)" / "2(1)" — the duplicate marker, always last in the string.
  /\s*\(\s*\d{1,3}\s*\)\s*$/,
  // "Part 3", "Parts 3", "Prt 3", "Pt 3", "Day 18", with or without a dash.
  /\s*[-–]?\s*\b(?:parts?|prts?|pt|day)\.?\s*\d{1,3}\s*$/i,
  // A bare trailing number: "Breaking The Yoke Of Poverty 12".
  //
  // CAPPED AT TWO DIGITS ON PURPOSE. Several recordings are named after a
  // timestamp ("Audio 2020 10 05 05 54 27") or a year ("Commanding The Year
  // 2025"), and an unbounded \d+ would eat a piece of those. Two digits keeps
  // every real part number (the longest series here is 17) while leaving
  // four-digit years intact — and even where it does strip a timestamp's last
  // pair, the SIBLING RULE below discards the result, because no two
  // timestamps agree on the remaining prefix.
  /\s+\d{1,2}\s*$/,
];

/**
 * A key must keep this much text. Guards against a short title being stripped
 * down to a fragment that then collides with an unrelated one.
 */
const MIN_KEY_LENGTH = 8;

/** The series a title belongs to, or the title itself when it has no marker. */
export function seriesKey(title: string): string {
  let key = title.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of SUFFIXES) {
      const next = key.replace(re, '').trim();
      if (next !== key && next.length >= MIN_KEY_LENGTH) {
        key = next;
        changed = true;
      }
    }
  }
  return key;
}

/**
 * The installment number a title ends with ("… Part 5" → 5, "… 12" → 12), or
 * null when it carries none. Read with the same patterns the key strip uses,
 * so a title can never be grouped by a marker this does not also see.
 */
export function partNumber(title: string): number | null {
  const t = title.trim();
  for (const re of SUFFIXES) {
    const match = t.match(re);
    if (match) {
      const n = Number(match[0].replace(/\D/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/**
 * Order WITHIN a series: by installment, ascending. A teaching series is meant
 * to be listened to from Part 1, which is the one place in this app where
 * newest-first would be actively unhelpful. Items with no number fall to the
 * end, ordered by recency between themselves.
 */
export function byPartThenRecency(a: R2Item, b: R2Item): number {
  const pa = partNumber(a.title);
  const pb = partNumber(b.title);
  if (pa !== null && pb !== null) return pa - pb;
  if (pa !== null) return -1;
  if (pb !== null) return 1;
  return byRecency(a, b);
}

export interface AudioSeries {
  /** Stable across renders and safe as a React key / route param. */
  key: string;
  /** The stripped title, shown as the shelf card's label. */
  label: string;
  /** Installment order — Part 1 first. See byPartThenRecency. */
  items: R2Item[];
}

/**
 * Recency sort. Items with no `date` go to the END, never the top: the
 * enrichment pass matched 521 of 546 files, and treating an unmatched file as
 * "just published" would put the app's least-known items in the position
 * reserved for its newest.
 *
 * Dates are ISO-like and fixed-width ('2026-03-08T08:18:09'), so a string
 * compare is a date compare — no Date objects allocated per comparison across
 * a 546-item sort.
 */
export function byRecency(a: R2Item, b: R2Item): number {
  if (a.date && b.date) return b.date.localeCompare(a.date);
  if (a.date) return -1;
  if (b.date) return 1;
  // Both undated: alphabetical, so the order is at least stable and legible
  // rather than whatever the manifest happened to hold.
  return a.title.localeCompare(b.title);
}

/**
 * Display date for a recording. Includes the YEAR, unlike the app's shortDate:
 * this archive runs from 2019 to now, so "Mar 8" alone would leave a seven-
 * year-old recording looking like last week's.
 */
export function formatAudioDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface GroupedAudio {
  /** Series with 2+ recordings, largest first. */
  series: AudioSeries[];
  /** Everything that belongs to no series, newest first. */
  standalone: R2Item[];
  /** Everything, newest first — the "Recently Added" shelf reads from this. */
  recent: R2Item[];
}

export function groupAudio(items: R2Item[]): GroupedAudio {
  const buckets = new Map<string, R2Item[]>();
  for (const item of items) {
    const key = seriesKey(item.title);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  const series: AudioSeries[] = [];
  const standalone: R2Item[] = [];

  for (const [label, bucket] of buckets) {
    // THE SIBLING RULE: a stripped title with no siblings is not a series of
    // one, it is a recording that happens to end in a number. This is also
    // what makes the aggressive bare-number strip safe.
    if (bucket.length > 1) {
      series.push({
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label,
        items: [...bucket].sort(byPartThenRecency),
      });
    } else {
      standalone.push(...bucket);
    }
  }

  // Biggest series first — the same ordering the video Series shelf uses, and
  // the one that puts the church's substantial teaching bodies at the front.
  series.sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
  standalone.sort(byRecency);

  return { series, standalone, recent: [...items].sort(byRecency) };
}
