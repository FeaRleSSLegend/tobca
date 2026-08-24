// utils/audioPurpose.ts
// What KIND of thing an audio recording is: a prayer gathering, or a teaching.
//
// WHY THIS EXISTS
// The R2 audio manifest is one undifferentiated pool of 546 files. The church
// publishes two quite different things through it: teachings/sermons, which
// belong in the Library, and prayer recordings, which belong on the Prayer tab
// beside the prayer guides people already go there for.
//
// Same spirit as utils/contentGrouping.ts — a keyword table read against the
// title, with the reasoning written down — but deliberately much simpler.
// contentGrouping fuzzy-clusters YouTube titles because those are marketing
// copy. These titles are filenames the church typed, and the question is a
// single binary, so a pattern table is the whole algorithm.
//
// THE ONE RULE THAT MATTERS: TEACHING IS THE DEFAULT.
// A title that matches nothing is a teaching, because teaching is where every
// item already lives — an unmatched title stays exactly where it is today.
// Only a positive keyword hit moves something. A teaching wrongly filed under
// Prayer is a thing someone cannot find where they expect it; a prayer
// recording left in the Library is merely the status quo.
//
// THIS TABLE WAS REVIEWED AGAINST THE REAL MANIFEST AND CUT DOWN.
// The first draft's starting set produced 59 matches, of which only 14 were
// actual prayer gatherings. What was removed, and why:
//
//   vigil, midnight cry   Zero matches across all 546 titles. Not vocabulary
//                         this church uses. Removed rather than left as dead
//                         entries — a rule that has never fired is a rule
//                         nobody can reason about.
//   communion             23 matches, all of them services. Communion is
//                         already classified as a SERVICE elsewhere in the app
//                         (KNOWN_SERVICE_PATTERNS in utils/contentGrouping),
//                         and the video side treats it as Library content.
//                         Communion recordings stay teaching/service content.

/** The two buckets. There is deliberately no 'unknown' — see the default rule. */
export type AudioPurpose = 'prayer' | 'teaching';

// ---------------------------------------------------------------------------
// TEACHING OVERRIDES — checked BEFORE any keyword.
//
// The one thing a keyword fundamentally cannot tell apart:
//
//   a prayer EVENT            "2019 Prophetic Prayer"
//   a teaching ABOUT prayer   "The Personal Prayer Life Part 12"
//
// These three named series are the church's long-running teaching runs on the
// subject of prayer — "How To Have A Great Life" reaches 13 installments,
// "The Personal Prayer Life" reaches Part 15. They are Library content by any
// reading, and between them they accounted for 22 of the original 59 matches.
//
// This is an override rather than a tweak to the keyword patterns because the
// problem is not the word "prayer" — it is that these particular programmes
// are teaching regardless of which of our words appear in their titles. Note
// what that buys: it also removes both `intercession` hits, since the only two
// titles carrying that word are installments of "How To Have A Great Life".
// ---------------------------------------------------------------------------
const TEACHING_OVERRIDES: RegExp =
  /how to have a great life|personal prayer life|pauline prayer/i;

interface PurposeRule {
  /** Shown in the review report as the REASON an item was classified. */
  keyword: string;
  pattern: RegExp;
}

// ---------------------------------------------------------------------------
// THE KEYWORDS
//
// Ordered MOST SPECIFIC FIRST, because the first match is reported as the
// reason. "Prophetic Prayer" is fully contained by the generic /prayer/ rule
// and would classify correctly without its own entry — it has one so the
// report can name the actual programme rather than the vaguer "prayer".
//
// On the boundaries chosen:
//   \bprayer    prefix-anchored, not whole-word, so "Prayers" and "Prayerful"
//               match. Anchoring the front stops it firing inside unrelated
//               words; leaving the end open catches the plural, which is how
//               most of these titles are written.
//   \bintercess same reasoning: intercession / intercessory / intercessors.
//               Currently fires on nothing once the teaching overrides are
//               applied — kept because it is real prayer vocabulary that
//               future uploads may use, unlike vigil/midnight cry which this
//               church demonstrably does not say.
//   \bfasting\b whole word. "Fast" alone is far too broad ("Fast Track To Your
//               Miracle" is a teaching), so only the -ing form counts.
// ---------------------------------------------------------------------------
const PRAYER_RULES: PurposeRule[] = [
  { keyword: 'prophetic prayer', pattern: /\bprophetic\s+prayer/i },
  { keyword: 'intercession', pattern: /\bintercess/i },
  { keyword: 'fasting', pattern: /\bfasting\b/i },
  { keyword: 'prayer', pattern: /\bprayer/i },
];

// ---------------------------------------------------------------------------
// SERVICE-EMBEDDED PRAYER
//
// "Prayer 1 1St Serv. Sun 10Th Jul 2022" … "Prayer 8 Children Sun 2Nd Serv".
// A numbered run of prayer segments recorded INSIDE Sunday services over four
// weeks in July 2022. They are genuinely prayer — but they are also genuinely
// part of those services, and pulling them out of the Library would silently
// remove eight recordings from the service listings they belong to.
//
// So they carry their own flag and the UI dual-lists them: present in both
// places, removed from neither. That is why this is a separate boolean rather
// than a third value of AudioPurpose — the purpose IS prayer, the question the
// flag answers is a different one ("does it also belong somewhere else?").
//
// Anchored at the START of the title on purpose. "Prayer 3 Warfare 1St Serv."
// matches; "The Power Of Prayer 3" does not, because there the number belongs
// to a teaching's installment count, not to a prayer segment's position.
// ---------------------------------------------------------------------------
const SERVICE_EMBEDDED_PRAYER: RegExp = /^\s*prayer\s+\d+/i;

export interface PurposeMatch {
  purpose: AudioPurpose;
  /** The keyword that fired, or null when nothing did (i.e. teaching). */
  keyword: string | null;
  /**
   * A prayer segment recorded inside a service. Only ever true when purpose is
   * 'prayer'. Callers use it to DUAL-LIST rather than move — see the note above.
   */
  isServiceEmbeddedPrayer: boolean;
}

/**
 * Classify one title. Pure, case-insensitive, partial-match on the title only
 * — no date, speaker or size is consulted, because none of them says anything
 * about what kind of gathering was recorded.
 */
export function classifyAudioPurpose(title: string): PurposeMatch {
  // Overrides win outright. Checked first so a named teaching series can never
  // be pulled out of the Library by a keyword appearing in its own title.
  if (TEACHING_OVERRIDES.test(title)) {
    return { purpose: 'teaching', keyword: null, isServiceEmbeddedPrayer: false };
  }

  for (const rule of PRAYER_RULES) {
    if (rule.pattern.test(title)) {
      return {
        purpose: 'prayer',
        keyword: rule.keyword,
        isServiceEmbeddedPrayer: SERVICE_EMBEDDED_PRAYER.test(title),
      };
    }
  }
  return { purpose: 'teaching', keyword: null, isServiceEmbeddedPrayer: false };
}

/** Convenience for call sites that only need the bucket. */
export function audioPurpose(title: string): AudioPurpose {
  return classifyAudioPurpose(title).purpose;
}

export function isPrayerAudio(title: string): boolean {
  return audioPurpose(title) === 'prayer';
}

/**
 * Should this title appear in the Library's Audio tab?
 *
 * Teachings always. Prayer recordings only when they are service-embedded, in
 * which case they are dual-listed rather than moved. This is the single
 * predicate the Library filters on, so the split cannot drift between the two
 * tabs — the Prayer tab asks the complementary question below.
 */
export function belongsInLibraryAudio(title: string): boolean {
  const m = classifyAudioPurpose(title);
  return m.purpose === 'teaching' || m.isServiceEmbeddedPrayer;
}

/** Should this title appear in the Prayer tab's audio section? */
export function belongsInPrayerAudio(title: string): boolean {
  return classifyAudioPurpose(title).purpose === 'prayer';
}
