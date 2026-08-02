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

// A series counts as "Ongoing" only while the silence since its last
// episode is still NORMAL for that series. Series here are intensive
// runs — episodes land days apart (often two the same Sunday) — so a
// series that's been quiet for 3× its typical gap has, in practice,
// concluded. That multiple runs off the MEDIAN of the non-zero gaps
// (median, not mean: same-day 1st/2nd-service pairs put 0-day gaps in
// the data, and a mean would let those drag a weekly cadence down to
// "daily"). Clamped to a 10-day floor (nothing flaps out of Ongoing over
// one quiet week mid-run) and a 45-day ceiling (nothing claims to be
// ongoing after a month and a half of nothing). The previous 21-day
// floor was precisely the bug that kept concluded burst-series like
// Managing Conflicts in Marriage sitting in Ongoing for three weeks.
const ONGOING_FLOOR_DAYS = 10;
const ONGOING_CEILING_DAYS = 45;

export function isOngoing(group: ContentGroup): boolean {
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
  const medianGap = gaps.length > 0 ? gaps[Math.floor(gaps.length / 2)] : 7;
  const windowDays = Math.min(ONGOING_CEILING_DAYS, Math.max(ONGOING_FLOOR_DAYS, medianGap * 3));
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
