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

// A series counts as "Ongoing" if its newest episode landed within this
// window. 60 days (not 7 or 14) on purpose: series here are preaching
// programs that can pause for a month around special services (PAMS,
// Crossover season) and still be very much alive — a tight window would
// bounce them between Ongoing and Completed every few weeks. Same
// starting-value caveat as the classification thresholds in
// contentGrouping.ts: tune against the real dataset once more content
// accumulates.
export const ONGOING_WINDOW_DAYS = 60;

export function isOngoing(group: ContentGroup): boolean {
  const newest = group.items[0]; // items are kept newest-first by classifyMessages
  return newest ? daysSince(newest.publishedAt) <= ONGOING_WINDOW_DAYS : false;
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
