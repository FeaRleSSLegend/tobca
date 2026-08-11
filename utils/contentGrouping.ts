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

// Known recurring services by name. This list is the FIRST line of
// classification — a title matching one of these is a service recording by
// definition, no statistics needed. (When TOBC Wuse 2's channel gets
// merged in, run classification per channel and prefix labels with the
// branch before merging — two branches' "Sunday Service" are different
// events and must not collapse into one bucket.)
const KNOWN_SERVICE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /sunday.*service|first service|second service/i, label: 'Sunday Service' },
  { pattern: /wednesday.*service|mid-?week service|teaching service/i, label: 'Wednesday Service' },
  { pattern: /saturday.*prayer|prayer meeting/i, label: 'Saturday Prayer' },
  { pattern: /praise.*miracle service|\bpams\b/i, label: 'Praise & Miracle Service' },
  // The monthly worship program is BRANDED "One Hour of Intense Worship"
  // in titles but known in-house as Incense — the old /incense/ pattern
  // never matched a single real title, which is exactly how it leaked
  // into Series as an 11-part "teaching series".
  { pattern: /one hour of intense worship|intense worship|\bincense\b/i, label: 'One Hour Worship (Incense)' },
  { pattern: /communion service/i, label: 'Communion Service' },
  { pattern: /crossover service/i, label: 'Crossover Service' },
  { pattern: /thanksgiving service/i, label: 'Thanksgiving Service' },
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

// Segments that are metadata, not theme: a speaker credit ("Pst. Abu
// Jibril") or a bare date ("02AUG2026"). Real titles use up to three
// separated segments — "Theme || Pst. Name || Date" or "Service || Pst.
// Name || Date" — and picking "the first segment that isn't a service"
// as the theme would happily pick the pastor's name and cluster every
// upload into a phantom "Pst. Abu Jibril" series.
const SPEAKER_PART = /^(pst|pastor|rev|dr|min|bro|sis)\.?\s/i;
const DATE_ONLY_PART = new RegExp(
  `^(\\d{1,2}\\s*(${MONTHS})[a-z]*\\s*\\d{2,4}|\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4})$`,
  'i'
);

/**
 * Splits a raw title into its theme half and (if identifiable) the known
 * service it belongs to. Examples of what comes out:
 *
 *   "The Manifold Grace of God || Sunday (1st Service) 29JUL2026"
 *      → theme "The Manifold Grace of God", service "Sunday Service"
 *   "August Praise and Miracle Service || Pst. Abu Jibril || 02AUG2026"
 *      → theme null (the other segments are a speaker and a date),
 *        service "Praise & Miracle Service"
 *   "How To Thrive In Difficult Times"
 *      → theme = whole title, service null
 */
function splitTitle(title: string): { theme: string | null; serviceLabel: string | null } {
  const known = KNOWN_SERVICE_PATTERNS.find((p) => p.pattern.test(title));
  const parts = title.split(TITLE_SEPARATOR).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const themePart = parts.find(
      (p) =>
        !KNOWN_SERVICE_PATTERNS.some((k) => k.pattern.test(p)) &&
        !SPEAKER_PART.test(p) &&
        !DATE_ONLY_PART.test(p)
    );
    return { theme: themePart ?? null, serviceLabel: known?.label ?? null };
  }

  // No separator: a title that matches a service pattern is JUST a service
  // recording (no theme to cluster); anything else is all theme.
  return known ? { theme: null, serviceLabel: known.label } : { theme: title, serviceLabel: null };
}

/**
 * The title to SHOW a human, as opposed to the raw upload title.
 *
 * The channel names uploads for archiving, not for reading:
 *   "The Manifold Grace of God || Sunday (2nd) Service || Pst. Abu Jibril || 9AUG2026"
 * Rendered verbatim that is three lines of pipes, a name and a date where a
 * headline should be — on the Library hero it ran to three lines and still
 * truncated, so the one thing the card exists to say never fit.
 *
 * splitTitle already separates the theme from the service metadata for
 * CLASSIFICATION; this exposes the same answer for DISPLAY. Preference order:
 *   1. the theme, if the title has one ("The Manifold Grace of God")
 *   2. the recognised service name, for a pure service recording
 *   3. the raw title, if it has neither — never blank, never worse than today.
 */
export function displayTitle(title: string): string {
  const { theme, serviceLabel } = splitTitle(title);
  const cleaned = (theme ?? serviceLabel ?? title)
    // Drop a trailing date the channel appends after the theme, e.g. "9AUG2026".
    .replace(new RegExp(`\b\d{1,2}\s*(${MONTHS})[a-z]*\s*\d{2,4}\b`, 'gi'), '')
    .replace(/[\s\-–:|,]+$/g, '')
    .trim();
  return cleaned || title;
}

/**
 * The line UNDER a title in a list row.
 *
 * displayTitle() deliberately strips the service and date out of an upload
 * title — which is right for a headline and WRONG on its own in a list, because
 * a channel that runs the same series across four services publishes four
 * uploads whose themes are identical. Stripped, they all render as "The
 * Manifold Grace of God" with the same artwork and the same speaker, and the
 * list becomes unusable: four rows that look like duplicates but aren't.
 *
 * So whatever displayTitle REMOVED is exactly what disambiguates the row.
 * Returns the service ("Sunday Service") when the title carries one, otherwise
 * null so the caller can fall back.
 *
 * Speaker is a poor substitute here: every upload on a church channel has the
 * same one, so it costs a line and distinguishes nothing.
 */
export function displaySubtitle(title: string): string | null {
  const { theme } = splitTitle(title);
  if (!theme) return null; // a pure service recording already says so in its title

  // The RAW service segment, not the normalised label. Classification folds
  // "Sunday (1st) Service" and "Sunday (2nd) Service" into one "Sunday Service"
  // bucket ON PURPOSE — they belong to the same recurring service. But for a
  // LIST ROW that normalisation is exactly the information that tells two
  // otherwise-identical rows apart: a church that streams the same series at
  // both Sunday services publishes two uploads with the same theme, same
  // artwork and the same date, and collapsing the ordinal makes them read as
  // duplicates. So display keeps what grouping discards.
  const parts = title.split(TITLE_SEPARATOR).map((p) => p.trim()).filter(Boolean);
  let raw = parts.find((p) => KNOWN_SERVICE_PATTERNS.some((k) => k.pattern.test(p)));

  // No service? Fall back to an INSTALMENT marker — "Day 1", "Part 2".
  // A summit published as "…Summit with Fela Durotoye || Day 1 || 20JUN2026"
  // has no service segment at all, and its theme is identical across every
  // day, so without this a five-day playlist renders as five identical rows.
  // Same principle as the ordinal above: whatever distinguishes the item is
  // whatever the title's extra segments carry.
  if (!raw) raw = parts.find((p) => /^(?:day|part|episode)\s*\d+$/i.test(p.trim()));
  if (!raw) return null;

  return raw
    .replace(new RegExp(`\b\d{1,2}\s*(${MONTHS})[a-z]*\s*\d{2,4}\b`, 'gi'), '')
    .replace(/\s+/g, ' ')
    .replace(/[\s\-–:|,]+$/g, '')
    .trim() || null;
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
  // Raw (pre-normalize) theme strings of every member — the display label
  // comes from the SHORTEST of these, which naturally drops per-episode
  // suffixes: "Managing Conflicts In Marriage (Masters & Disasters)" and
  // plain "Managing Conflicts In Marriage" cluster together, and the
  // short one is the series name. Also keeps the channel's own
  // capitalization instead of a mechanical Title Case of normalized
  // tokens (which had already eaten the punctuation).
  rawThemes: string[];
  items: Message[];
}

function clusterLabel(c: Cluster): string {
  // Same installment-marker strip as normalizeTitle, applied to the RAW
  // strings — "Faith The Most Powerful Force On Earth Part 1" labels as
  // the series, not as its first episode. Dangling separators left behind
  // by the strip get trimmed too.
  const cleaned = c.rawThemes
    .map((t) =>
      t
        .replace(/\b(?:day|part|episode)\s*\d+\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[\s\-–:|,]+$/g, '')
        .trim()
    )
    .filter(Boolean);
  const shortest = cleaned.sort((a, b) => a.length - b.length)[0];
  return shortest || toTitleCase(c.representativeKey);
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
  const themed: { m: Message; norm: string; raw: string }[] = [];

  for (const m of rest) {
    const { theme, serviceLabel } = splitTitle(m.title);
    if (serviceLabel) {
      const bucket = serviceBuckets.get(serviceLabel);
      if (bucket) bucket.push(m);
      else serviceBuckets.set(serviceLabel, [m]);
    }
    if (theme) {
      const norm = normalizeTitle(theme);
      if (norm) themed.push({ m, norm, raw: theme });
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
  for (const { m, norm, raw } of themed) {
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
      bestCluster.rawThemes.push(raw);
      for (const t of tokens) bestCluster.tokens.add(t);
    } else {
      clusters.push({ tokens, representativeKey: norm, rawThemes: [raw], items: [m] });
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

    // Series vs recurring program, by the SHAPE of the release pattern —
    // not by weekday, since real series land Sunday→Sunday→Wednesday→
    // Saturday depending on what's on that week. Two facts separate them:
    //   - a teaching series is an intensive run: episodes in close
    //     succession (days apart, often two in one day for 1st/2nd
    //     service), over a bounded stretch;
    //   - a recurring program is a standing fixture: it keeps appearing
    //     across a long span at a sparse, roughly periodic cadence
    //     (monthly worship night, quarterly special).
    // So: recurring only when the run is LONG (90+ days) AND the typical
    // gap is sparse (14+ days) AND there are enough occurrences to call
    // it a fixture. Median gap, not mean, because same-day double
    // services put 0-day gaps in the data and a mean would let a couple
    // of those disguise a monthly cadence as a weekly one.
    const dates = c.items.map((i) => new Date(i.publishedAt).getTime()).sort((a, b) => a - b);
    const spanDays = (dates[dates.length - 1] - dates[0]) / 86_400_000;
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const g = (dates[i] - dates[i - 1]) / 86_400_000;
      if (g >= 1) gaps.push(g); // skip same-day pairs (1st/2nd service)
    }
    gaps.sort((a, b) => a - b);
    const medianGap = gaps.length > 0 ? gaps[Math.floor(gaps.length / 2)] : 0;

    const isRecurringProgram = c.items.length >= 4 && spanDays >= 90 && medianGap >= 14;

    const group: ContentGroup = {
      key: c.representativeKey,
      label: clusterLabel(c),
      type: isRecurringProgram ? 'recurringService' : 'series',
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
