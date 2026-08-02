import { Message } from '../data/content';

/**
 * How this decides what's what:
 *
 * 1. CLIPS — anything under 3 minutes. A full sermon/service is never
 *    that short; short entries are quote graphics / social clips.
 *
 * 2. SPLIT THEME FROM SERVICE — OliveBrook titles the recordings as
 *    "Theme || Service info + date", e.g. "The Manifold Grace of God ||
 *    Sunday (1st Service) 29JUL2026". The old pipeline fed the WHOLE
 *    title into one clustering pass, and the known-service check ran on
 *    the full string — so any themed message preached on a Sunday got
 *    swallowed into the "Sunday Service" bucket and its series never
 *    formed (the exact "Manifold Grace treated as standalone" bug).
 *    Now the two halves are treated as two separate facts, because they
 *    ARE two separate facts:
 *      - the right half (or the full title when there's no separator)
 *        determines RECURRING SERVICE membership via known patterns
 *      - the left half (the theme) is what gets fuzzy-clustered into
 *        SERIES
 *    One message can legitimately belong to both — a Sunday recording of
 *    a Manifold Grace part IS both a Sunday Service and a series episode,
 *    and now it appears under both, which is what a person browsing
 *    either group expects to find.
 *
 * 3. FUZZY CLUSTER, not exact match — real titles have small
 *    inconsistencies (a colon here, "on Earth" vs "on the Earth" there)
 *    that exact-string grouping can't survive. Theme texts are tokenized
 *    into a word set and compared by Jaccard similarity (overlap ÷ union)
 *    against existing clusters; anything above the threshold joins that
 *    cluster instead of starting a new one.
 *
 * 4. RECURRING SERVICE vs. SERIES for unnamed clusters — decided by time
 *    spread. A standing weekly slot recurs steadily across months; a
 *    themed program clusters tightly then stops. This catches recurring
 *    services that aren't in the known-name list.
 *
 * 5. MERGE BY FINAL LABEL — two separate clusters can still land on the
 *    same label; this pass combines them so every label (and therefore
 *    every React key / filter pill) is unique.
 */

const SHORT_CLIP_MAX_SECONDS = 180; // under 3 min → clip, not a full message
const SIMILARITY_THRESHOLD = 0.45; // Jaccard overlap needed to join an existing cluster

// "Theme || Service" — double pipe with optional whitespace, the channel's
// own separator convention. A single pipe surrounded by spaces is accepted
// too, since a human typing titles won't hit ⇧\ twice every single time.
const TITLE_SEPARATOR = /\s*\|\|\s*|\s+\|\s+/;

const KNOWN_SERVICE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /sunday.*service|first service|second service/i, label: 'Sunday Service' },
  { pattern: /wednesday.*service|mid-?week service|teaching service/i, label: 'Wednesday Service' },
  { pattern: /saturday.*prayer|prayer meeting/i, label: 'Saturday Prayer' },
  { pattern: /praise.*miracle service|\bpams\b/i, label: 'Praise & Miracle Service' },
  { pattern: /incense/i, label: 'Incense' },
  { pattern: /communion service/i, label: 'Communion Service' },
  { pattern: /crossover service/i, label: 'Crossover Service' },
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'on', 'in', 'of', 'to', 'and', 'or', 'for', 'is', 'are',
  'with', 'at', 'by', 'from', 'this', 'that', 'it', 'you', 'we', 'be',
]);

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

function normalizeTitle(title: string): string {
  let t = title;

  // Drop installment markers ("Day 3", "Part 2") so Day 1..Day 7 of the
  // same series collapse toward each other instead of looking distinct.
  t = t.replace(/\b(?:day|part)\s*\d+\b/gi, ' ');

  // Drop date-like tokens: "29JUL2026", "29 Jul 2026", "29/07/2026", "29.07.26"
  t = t.replace(new RegExp(`\\b\\d{1,2}\\s*(${MONTHS})[a-z]*\\s*\\d{2,4}\\b`, 'gi'), ' ');
  t = t.replace(/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g, ' ');

  // Drop speaker credit, usually "Pst. FirstName LastName"
  t = t.replace(/pst\.?\s+[a-z]+(\s+[a-z]+)?/gi, ' ');

  // Collapse ordinal service markers so "(1st) Service" / "Second Service"
  // don't create separate groups from plain "Service"
  t = t.replace(/\(?\s*(1st|first|2nd|second|3rd|third)\s*\)?\s*service/gi, 'service');

  // Normalize separators & punctuation, lowercase, collapse whitespace
  t = t.replace(/\|\|/g, ' ').replace(/[^\w\s]/g, ' ');
  t = t.toLowerCase().replace(/\s+/g, ' ').trim();

  return t;
}

function tokenize(normalized: string): Set<string> {
  return new Set(normalized.split(' ').filter((w) => w.length > 1 && !STOPWORDS.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function toTitleCase(key: string): string {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Splits a raw title into its theme half and (if identifiable) the known
 * service it belongs to. Examples of what comes out:
 *
 *   "The Manifold Grace of God || Sunday (1st Service) 29JUL2026"
 *      → theme "The Manifold Grace of God", service "Sunday Service"
 *   "Sunday Service 29JUL2026"
 *      → theme null (nothing but the service), service "Sunday Service"
 *   "How To Thrive In Difficult Times"
 *      → theme = whole title, service null
 */
function splitTitle(title: string): { theme: string | null; serviceLabel: string | null } {
  const known = KNOWN_SERVICE_PATTERNS.find((p) => p.pattern.test(title));
  const parts = title.split(TITLE_SEPARATOR).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    // Theme is the segment that does NOT match a service pattern —
    // usually the left one, but don't assume the channel never flips it.
    const themePart = parts.find((p) => !KNOWN_SERVICE_PATTERNS.some((k) => k.pattern.test(p)));
    return { theme: themePart ?? null, serviceLabel: known?.label ?? null };
  }

  // No separator: a title that matches a service pattern is JUST a service
  // recording (no theme to cluster); anything else is all theme.
  return known ? { theme: null, serviceLabel: known.label } : { theme: title, serviceLabel: null };
}

export interface ContentGroup {
  key: string; // unique — safe to use directly as a React key
  label: string;
  type: 'recurringService' | 'series';
  items: Message[]; // newest first
  count: number;
  thumbnail?: string;
}

export interface ClassifiedContent {
  recurringServices: ContentGroup[]; // sorted by count, largest first, unique labels
  series: ContentGroup[]; // sorted by count, largest first, unique labels
  clips: Message[];
  standalone: Message[]; // one-off messages that didn't cluster with anything
}

interface Cluster {
  tokens: Set<string>;
  representativeKey: string;
  items: Message[];
}

function sortNewestFirst(items: Message[]): Message[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function mergeGroupsByLabel(groups: ContentGroup[]): ContentGroup[] {
  const byLabel = new Map<string, ContentGroup>();
  for (const g of groups) {
    const existing = byLabel.get(g.label);
    if (existing) {
      existing.items = sortNewestFirst([...existing.items, ...g.items]);
      existing.count = existing.items.length;
      existing.thumbnail = existing.items[0]?.thumbnail ?? existing.thumbnail;
    } else {
      byLabel.set(g.label, {
        ...g,
        key: g.label.toLowerCase().replace(/\s+/g, '-'),
      });
    }
  }
  return Array.from(byLabel.values());
}

export function classifyMessages(messages: Message[]): ClassifiedContent {
  const clips: Message[] = [];
  const rest: Message[] = [];

  for (const m of messages) {
    // durationSeconds is only present on real fetched videos — mock
    // entries always fall through to `rest` so the prototype still looks
    // populated before a key is set.
    if (m.durationSeconds !== undefined && m.durationSeconds < SHORT_CLIP_MAX_SECONDS) {
      clips.push(m);
    } else {
      rest.push(m);
    }
  }

  // Pass 1: recurring-service membership by known pattern. Exact pattern
  // matches don't need fuzzy clustering — the pattern IS the group.
  const serviceBuckets = new Map<string, Message[]>();
  // Pass 2 input: (message, themeText) pairs for series clustering.
  const themed: { m: Message; norm: string }[] = [];

  for (const m of rest) {
    const { theme, serviceLabel } = splitTitle(m.title);
    if (serviceLabel) {
      const bucket = serviceBuckets.get(serviceLabel);
      if (bucket) bucket.push(m);
      else serviceBuckets.set(serviceLabel, [m]);
    }
    if (theme) {
      const norm = normalizeTitle(theme);
      if (norm) themed.push({ m, norm });
    }
  }

  // Greedy single-linkage clustering over THEME text only: each theme
  // joins the most similar existing cluster if it clears the threshold,
  // otherwise starts a new one. A cluster's token set grows (union) as
  // items join, so it can keep matching related variants even as wording
  // drifts slightly. Service words never reach this pass anymore, so two
  // unrelated themes can no longer glue together via a shared
  // "sunday service" suffix.
  const clusters: Cluster[] = [];
  for (const { m, norm } of themed) {
    const tokens = tokenize(norm);
    if (tokens.size === 0) continue;

    let bestCluster: Cluster | undefined;
    let bestScore = 0;
    for (const c of clusters) {
      const score = jaccard(tokens, c.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = c;
      }
    }

    if (bestCluster && bestScore >= SIMILARITY_THRESHOLD) {
      bestCluster.items.push(m);
      for (const t of tokens) bestCluster.tokens.add(t);
    } else {
      clusters.push({ tokens, representativeKey: norm, items: [m] });
    }
  }

  let recurringServices: ContentGroup[] = Array.from(serviceBuckets.entries()).map(
    ([label, items]) => {
      const sorted = sortNewestFirst(items);
      return {
        key: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        type: 'recurringService' as const,
        items: sorted,
        count: sorted.length,
        thumbnail: sorted[0]?.thumbnail,
      };
    }
  );
  let series: ContentGroup[] = [];
  const standalone: Message[] = [];
  const inService = new Set(
    Array.from(serviceBuckets.values()).flat().map((m) => m.id)
  );

  for (const c of clusters) {
    if (c.items.length === 1) {
      // A lone theme is standalone ONLY if it isn't already surfaced
      // through a service group — otherwise it's covered, not orphaned.
      if (!inService.has(c.items[0].id)) standalone.push(c.items[0]);
      continue;
    }

    const sorted = sortNewestFirst(c.items);

    const dates = c.items.map((i) => new Date(i.publishedAt).getTime()).sort((a, b) => a - b);
    const spanDays = (dates[dates.length - 1] - dates[0]) / 86_400_000;
    const avgGapDays = c.items.length > 1 ? spanDays / (c.items.length - 1) : 0;

    // A standing slot recurs steadily over a long stretch — this catches a
    // real recurring service that isn't in the known-name list above.
    const looksRecurring = spanDays > 60 && c.items.length >= 4 && avgGapDays >= 5 && avgGapDays <= 40;

    const group: ContentGroup = {
      key: c.representativeKey,
      label: toTitleCase(c.representativeKey),
      type: looksRecurring ? 'recurringService' : 'series',
      items: sorted,
      count: c.items.length,
      thumbnail: sorted[0].thumbnail,
    };

    (group.type === 'recurringService' ? recurringServices : series).push(group);
  }

  // Safety net: separate clusters can still resolve to the same label —
  // this collapses them into one so every label (and therefore every
  // React key / filter pill) is unique.
  recurringServices = mergeGroupsByLabel(recurringServices);
  series = mergeGroupsByLabel(series);

  recurringServices.sort((a, b) => b.count - a.count);
  series.sort((a, b) => b.count - a.count);

  return { recurringServices, series, clips, standalone };
}
