// utils/relatedContent.ts
// Builds the "what to watch next" sections shown beneath the player. The
// design principle from the brief: only sections that GENUINELY help, never
// filler to occupy space. So each section here answers a real question a
// viewer has at the end of a message:
//
//   "Rest of this series"  → the strongest signal by far. If they're
//                            watching part 3, parts 1/2/4 are what they
//                            most likely want. Ordered chronologically
//                            (teaching builds in order), current item
//                            excluded.
//   "More from <speaker>"  → second-strongest. Someone who sought out this
//                            preacher will take more of them.
//   "Recent messages"      → a gentle catch-all so the space is never
//                            empty, but only shown when the stronger
//                            sections are thin, and never repeating an item
//                            already shown above.
//
// Everything is deduped against what's already on screen (the current
// message and higher sections), so no message appears twice across the
// whole related area.

import { Message } from '../data/contentModel';
import { classifyMessages } from './contentGrouping';

export interface RelatedSection {
  key: string;
  title: string;
  items: Message[];
}

const MAX_PER_SECTION = 6;

function chrono(items: Message[]): Message[] {
  return [...items].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
}

function recent(items: Message[]): Message[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function buildRelatedSections(current: Message, all: Message[]): RelatedSection[] {
  const sections: RelatedSection[] = [];
  const shown = new Set<string>([current.id]);

  const take = (items: Message[]) => {
    const out: Message[] = [];
    for (const m of items) {
      if (shown.has(m.id)) continue;
      out.push(m);
      shown.add(m.id);
      if (out.length >= MAX_PER_SECTION) break;
    }
    return out;
  };

  // Rest of this series — chronological, since teaching series build on
  // themselves and someone catching up wants part order, not newest-first.
  if (current.series) {
    const { series } = classifyMessages(all);
    const group = series.find((g) => g.label === current.series);
    if (group) {
      const items = take(chrono(group.items));
      if (items.length > 0) {
        sections.push({ key: 'series', title: `More from ${current.series}`, items });
      }
    }
  }

  // More from this speaker — skip the generic channel-level speaker label
  // that real YouTube data uses as a fallback, since "everything" isn't a
  // meaningful "from this speaker" set.
  const genericSpeakers = new Set(['OliveBrook Church', 'The OliveBrook Church', 'Guest Speaker']);
  if (current.speaker && !genericSpeakers.has(current.speaker)) {
    const bySpeaker = recent(all.filter((m) => m.speaker === current.speaker));
    const items = take(bySpeaker);
    if (items.length > 0) {
      sections.push({ key: 'speaker', title: `More from ${current.speaker}`, items });
    }
  }

  // Recent — only worth showing if the stronger sections didn't already
  // fill the space. Keeps the area useful for a standalone message that has
  // no series and a generic speaker, without padding a page that's already
  // rich.
  const strongCount = sections.reduce((n, s) => n + s.items.length, 0);
  if (strongCount < MAX_PER_SECTION) {
    const items = take(recent(all));
    if (items.length > 0) {
      sections.push({ key: 'recent', title: 'Recent messages', items });
    }
  }

  return sections;
}
