import { Message } from '../data/content';

/**
 * How this decides what's what:
 *
 * 1. CLIPS — anything under 3 minutes. A full sermon/service is never
 *    that short; short entries are quote graphics / social clips.
 *
 * 2. NORMALIZE — strip the parts of a title that vary per-occurrence
 *    (dates, "(1st)/(2nd) Service", speaker credit, "Day N"/"Part N").
 *
 * 3. FUZZY CLUSTER, not exact match — real titles have small
 *    inconsistencies (a colon here, "on Earth" vs "on the Earth" there)
 *    that exact-string grouping can't survive. Titles are tokenized into
 *    a word set and compared by Jaccard similarity (overlap ÷ union)
 *    against existing clusters; anything above the threshold joins that
 *    cluster instead of starting a new one. This is what makes 15 near-
 *    identical "Faith: The Most Powerful Force..." titles collapse into
 *    one real group instead of a dozen fragments.
 *
 * 4. RECURRING SERVICE vs. SERIES — decided by time spread, not naming.
 *    A standing weekly slot recurs steadily across months; a themed
 *    program clusters tightly then stops. The known-name list is only a
 *    confidence boost when a title happens to match a name we already
 *    know — the date-spread math is what actually classifies.
 *
 * 5. MERGE BY FINAL LABEL — even after fuzzy clustering, two separate
 *    clusters can still land on the same known label (e.g. one cluster
 *    keyed by wording from January, another from June, both matching the
 *    "Sunday Service" pattern independently). Without this step you'd
 *    get "Sunday Service" appearing 2-3 times as distinct groups —
 *    exactly the bug reported. This pass combines any groups that ended
 *    up with the same label into one, so every label is unique.
 */

const SHORT_CLIP_MAX_SECONDS = 180; // under 3 min → clip, not a full message
const SIMILARITY_THRESHOLD = 0.45; // Jaccard overlap needed to join an existing cluster

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

function mergeGroupsByLabel(groups: ContentGroup[]): ContentGroup[] {
  const byLabel = new Map<string, ContentGroup>();
  for (const g of groups) {
    const existing = byLabel.get(g.label);
    if (existing) {
      existing.items = [...existing.items, ...g.items].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
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

  // Greedy single-linkage clustering: each title joins the most similar
  // existing cluster if it clears the threshold, otherwise starts a new
  // one. A cluster's token set grows (union) as items join, so it can
  // keep matching related variants even as wording drifts slightly.
  const clusters: Cluster[] = [];
  for (const m of rest) {
    const norm = normalizeTitle(m.title);
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

  let recurringServices: ContentGroup[] = [];
  let series: ContentGroup[] = [];
  const standalone: Message[] = [];

  for (const c of clusters) {
    if (c.items.length === 1) {
      standalone.push(c.items[0]);
      continue;
    }

    const sorted = [...c.items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const known = KNOWN_SERVICE_PATTERNS.find((p) => p.pattern.test(c.items[0].title));

    const dates = c.items.map((i) => new Date(i.publishedAt).getTime()).sort((a, b) => a - b);
    const spanDays = (dates[dates.length - 1] - dates[0]) / 86_400_000;
    const avgGapDays = c.items.length > 1 ? spanDays / (c.items.length - 1) : 0;

    // A standing slot recurs steadily over a long stretch — this is what
    // catches a real recurring service we haven't named in the list above.
    const looksRecurring = spanDays > 60 && c.items.length >= 4 && avgGapDays >= 5 && avgGapDays <= 40;

    const group: ContentGroup = {
      key: c.representativeKey,
      label: known?.label ?? toTitleCase(c.representativeKey),
      type: known || looksRecurring ? 'recurringService' : 'series',
      items: sorted,
      count: c.items.length,
      thumbnail: sorted[0].thumbnail,
    };

    (group.type === 'recurringService' ? recurringServices : series).push(group);
  }

  // Safety net: even with fuzzy clustering, two separate clusters can
  // still resolve to the same known label — this collapses them into one
  // so every label (and therefore every React key / filter pill) is unique.
  recurringServices = mergeGroupsByLabel(recurringServices);
  series = mergeGroupsByLabel(series);

  recurringServices.sort((a, b) => b.count - a.count);
  series.sort((a, b) => b.count - a.count);

  return { recurringServices, series, clips, standalone };
}
