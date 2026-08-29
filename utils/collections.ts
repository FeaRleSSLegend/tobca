// utils/collections.ts
// Pure helpers shared by the dedicated collection screens (see-all.tsx).
// All the "how do we group/sort this list" decisions live here so the
// screen file stays about layout, and so these are trivially unit-testable
// later without rendering anything.
import { Message } from '../data/content';
import { ContentGroup } from './contentGrouping';

const DAY_MS = 86_400_000;

export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

// ---------------------------------------------------------------------------
// "ONGOING" — is this series still running?
//
// THE CAUSE OF THE MISCLASSIFICATION, stated before the fix.
//
// This has always been a pure RECENCY test with a window sized from the
// series' own cadence: "has it been quiet for longer than 3x its typical
// gap". That part is sound. The bug is what happens when there IS NO
// observed cadence — the code invented one:
//
//     const medianGap = gaps.length > 0 ? gaps[...] : 7;   // <- fabricated
//
// A 7-day default produces a 21-day window, and two very common groups reach
// that line with an empty `gaps` array:
//
//   1. A SINGLE-ITEM GROUP. One upload has no gaps at all, so every one-off
//      message published in the last three weeks was flagged "Ongoing". This
//      is the "series that only happened once" case: a series of one has no
//      next part by definition, and nothing about one upload is evidence that
//      a second is coming.
//
//   2. AN ALL-SAME-DAY GROUP. The `g >= 1` filter deliberately drops same-day
//      gaps (the 1st/2nd-service pairs), which is right for computing a
//      median — but a series recorded entirely in one sitting has EVERY gap
//      dropped, lands on the same empty array, and inherits the same invented
//      weekly cadence it never had.
//
// So the rule is now: no evidence of continuation means not ongoing, rather
// than assuming a weekly rhythm nobody observed.
//
// WHAT THIS STILL CANNOT DO, honestly. There is no "part 3 of 6" anywhere in
// the data to read — utils/contentGrouping strips installment markers ("Part
// 2", "Day 3") while grouping and never retains a total, and YouTube gives no
// series-completion field. So a genuinely finished 6-part series whose last
// part landed inside its own cadence window is still shown as Ongoing for a
// few more days. That is a bounded, self-correcting error rather than the
// permanent-misclassification the two cases above caused.
//
// The cadence multiple runs off the MEDIAN of the non-zero gaps (median, not
// mean: same-day pairs put 0-day gaps in the data, and a mean would drag a
// weekly cadence down toward "daily"). Clamped to a 10-day floor (nothing
// flaps out of Ongoing over one quiet week mid-run) and a 45-day ceiling.
// ---------------------------------------------------------------------------
const ONGOING_FLOOR_DAYS = 10;
const ONGOING_CEILING_DAYS = 45;

export function isOngoing(group: ContentGroup): boolean {
  // A series of one is not a series in progress. This is the single-upload
  // case above, and it is a structural fact rather than a timing question, so
  // it is answered before any date arithmetic.
  if (group.items.length < 2) return false;

  const newest = group.items[0]; // items are kept newest-first by classifyMessages
  if (!newest) return false;

  const dates = group.items
    .map((i) => new Date(i.publishedAt).getTime())
    .sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const g = (dates[i] - dates[i - 1]) / DAY_MS;
    if (g >= 1) gaps.push(g);
  }
  gaps.sort((a, b) => a - b);

  // NO OBSERVED CADENCE. Every part landed on the same day, so this is a
  // BURST: a series delivered in one sitting. There is no rhythm to project
  // forward, so it gets the bare floor rather than a fabricated weekly window
  // — recent enough to still look live for a few days, then Complete.
  const windowDays =
    gaps.length === 0
      ? ONGOING_FLOOR_DAYS
      : Math.min(
          ONGOING_CEILING_DAYS,
          Math.max(ONGOING_FLOOR_DAYS, gaps[Math.floor(gaps.length / 2)] * 3)
        );

  return daysSince(newest.publishedAt) <= windowDays;
}

// "June 2026" — month buckets for the Services collection.
export function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// "Jun 28" — compact date for list-row meta lines, instead of the raw
// ISO "2026-06-28" a Message carries internally.
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Shape SectionList consumes directly: { title, data }[].
export interface MessageSection {
  title: string;
  data: Message[];
}

/**
 * Recency buckets for the Recently Added collection: Today / This Week /
 * This Month / Earlier. Every message lands in exactly one bucket (the
 * checks cascade), empty buckets are dropped, and input order is
 * preserved — callers pass a newest-first list, so each bucket stays
 * newest-first too.
 */
export function groupByRecency(list: Message[]): MessageSection[] {
  const today: Message[] = [];
  const thisWeek: Message[] = [];
  const thisMonth: Message[] = [];
  const earlier: Message[] = [];

  const now = new Date();
  for (const m of list) {
    const d = new Date(m.publishedAt);
    const age = daysSince(m.publishedAt);
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) {
      today.push(m);
    } else if (age <= 7) {
      thisWeek.push(m);
    } else if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      thisMonth.push(m);
    } else {
      earlier.push(m);
    }
  }

  return [
    { title: 'Today', data: today },
    { title: 'This Week', data: thisWeek },
    { title: 'This Month', data: thisMonth },
    { title: 'Earlier', data: earlier },
  ].filter((s) => s.data.length > 0);
}

/**
 * Calendar buckets for the Services collection: "This Week" first (the
 * bucket a churchgoer most often wants — "the service I missed on
 * Sunday"), then month groups newest-first. Month grouping instead of
 * recency buckets because services are calendar events in people's heads
 * — "the PAMS in June" is how someone actually remembers one.
 */
export function groupByMonth(list: Message[]): MessageSection[] {
  const thisWeek: Message[] = [];
  const byMonth = new Map<string, Message[]>();

  for (const m of list) {
    if (daysSince(m.publishedAt) <= 7) {
      thisWeek.push(m);
      continue;
    }
    const label = monthLabel(m.publishedAt);
    const bucket = byMonth.get(label);
    if (bucket) bucket.push(m);
    else byMonth.set(label, [m]);
  }

  const sections: MessageSection[] = [];
  if (thisWeek.length > 0) sections.push({ title: 'This Week', data: thisWeek });
  // Map preserves insertion order, and the input list is newest-first, so
  // month buckets come out newest-first without re-sorting.
  for (const [title, data] of byMonth) sections.push({ title, data });
  return sections;
}

/**
 * Split an array into rows of `size` — used to render a 2-column grid of
 * group tiles inside a single virtualized FlatList (FlatList's own
 * numColumns can't be combined with section headers in one list, so the
 * grid rows become the list items instead).
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}
