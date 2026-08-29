import AsyncStorage from '@react-native-async-storage/async-storage';
import { biblePlan, totalDays, DayPlan } from '../data/biblePlan';

const STORAGE_KEY = '@bible_progress';

// ---------------------------------------------------------------------------
// PER-PASSAGE CONFIRMATION — the fix for a day being completed by opening one
// of its four readings.
//
// WHAT WAS WRONG. A plan day lists FOUR passages (Old Testament, New
// Testament, Psalm, Proverb). Completion was tracked as a single per-day
// boolean, `@bible_reading_unlocked_<date>`, set the moment any one passage
// was opened — and app/reading.tsx additionally called markDayAsRead() by
// itself as soon as verses rendered. So opening one Psalm marked the whole
// day read AND advanced the streak. The streak counted app-opens, not reading.
//
// WHAT REPLACES IT. A per-day SET of confirmed passage keys, written only by
// an explicit user action ("Mark as read" on that passage). A day is complete
// only when every one of its passages is in that set. The guard lives in
// markDayAsRead itself rather than only in the UI, so no call site — present
// or future — can complete a day the reader has not confirmed.
//
// WHY A SET AND NOT A COUNT. Confirming the same passage twice must not
// advance anything, and the reader needs to show a tick per passage. A count
// cannot answer "which ones".
// ---------------------------------------------------------------------------

/** The four readings that make up one plan day, in the order they are shown. */
export const PASSAGE_KEYS = ['oldTestament', 'newTestament', 'psalm', 'proverb'] as const;
export type PassageKey = (typeof PASSAGE_KEYS)[number];
export const PASSAGES_PER_DAY = PASSAGE_KEYS.length;

const passagesKey = (date: string) => `@bible_passages_read_${date}`;

const isPassageKey = (v: unknown): v is PassageKey =>
  typeof v === 'string' && (PASSAGE_KEYS as readonly string[]).includes(v);

/** Which of the day's passages the reader has explicitly confirmed. */
export async function getConfirmedPassages(date: string): Promise<PassageKey[]> {
  try {
    const raw = await AsyncStorage.getItem(passagesKey(date));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validated element-by-element: this survives app upgrades, and one bad
    // row must not take the day's progress down with it.
    return Array.isArray(parsed) ? Array.from(new Set(parsed.filter(isPassageKey))) : [];
  } catch {
    return [];
  }
}

/** Record an explicit "I have read this passage". Idempotent. */
export async function confirmPassageRead(
  date: string,
  key: PassageKey
): Promise<PassageKey[]> {
  const current = await getConfirmedPassages(date);
  if (current.includes(key)) return current;
  const next = [...current, key];
  try {
    await AsyncStorage.setItem(passagesKey(date), JSON.stringify(next));
  } catch (error) {
    console.error('Error saving passage confirmation:', error);
  }
  return next;
}

/** Undo a confirmation. The button is a toggle, so this is reachable. */
export async function unconfirmPassageRead(
  date: string,
  key: PassageKey
): Promise<PassageKey[]> {
  const current = await getConfirmedPassages(date);
  const next = current.filter((k) => k !== key);
  try {
    await AsyncStorage.setItem(passagesKey(date), JSON.stringify(next));
  } catch (error) {
    console.error('Error clearing passage confirmation:', error);
  }
  return next;
}

/** True only when EVERY passage for the day has been confirmed. */
export async function isDayFullyRead(date: string): Promise<boolean> {
  const confirmed = await getConfirmedPassages(date);
  return PASSAGE_KEYS.every((k) => confirmed.includes(k));
}

export interface ReadingProgress {
  completedDays: string[]; // ['January 1', 'January 2']
  lastReadDate: string | null;
  currentStreak: number;
  longestStreak: number;

  // ---- Streak freezes ----
  /** Freezes in the bank right now, 0..MAX_FREEZES. */
  freezes: number;
  /** toDateString() of the last day the bank was topped up. */
  lastFreezeRegenDate: string | null;
  /** Plan-date keys ("August 13") the streak survived on a spent freeze. */
  frozenDays: string[];
}

/**
 * STREAK FREEZES
 *
 * A missed day normally resets the streak to zero. That is honest but brutal
 * for a 365-day plan: one busy Wednesday erases six weeks, and the usual
 * response is to stop entirely rather than start again from 1. A small bank of
 * automatic freezes absorbs the ordinary misses without making the streak
 * meaningless — capped at 2, so it can cover a bad day or a bad weekend, never
 * a month of not reading.
 *
 * Deliberately AUTOMATIC rather than a button. Asking someone to spend a freeze
 * means telling them they failed and then asking them to file paperwork about
 * it; the point is that a life-happens day does not become a decision.
 */
export const MAX_FREEZES = 2;

// data/biblePlan.ts keys every entry by an ENGLISH month name ("August 6").
// `toLocaleString('default', { month: 'long' })` returns the DEVICE's locale
// instead, so on any non-English device every lookup here silently missed:
// getTodayReading returned null (the Plan tab showed "No reading for today"
// on a device that had a reading), and markDayAsRead's "is this today?" test
// compared "August 6" against "6 août" and never matched, so the streak could
// never advance. The plan data is the source of truth for the format, so the
// month names have to come from the same fixed list it was written with.
const PLAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The plan-file key for a given calendar date, e.g. "August 6". */
export function planDateKey(d: Date): string {
  return `${PLAN_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function getTodayReading(): DayPlan | null {
  return biblePlan.find(p => p.date === planDateKey(new Date())) || null;
}

// Tomorrow's plan entry — powers the "coming up" preview on the Plan tab,
// so someone can see what's ahead (and how long it looks) tonight instead
// of discovering it tomorrow morning.
export function getTomorrowReading(): DayPlan | null {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return biblePlan.find(p => p.date === planDateKey(t)) || null;
}

/**
 * The streak number that should actually be DISPLAYED. The stored
 * currentStreak only updates when a day gets marked — so after missing
 * three days, the UI kept proudly showing the old "12 day streak" until
 * the next mark suddenly reset it to 1, which is both dishonest while
 * it's stale and needlessly deflating at the exact moment someone comes
 * back. This derives the truth at read time: if the last read day is
 * today or yesterday the streak is alive; otherwise it's shown as 0 now
 * (and the stored value gets corrected on the next mark as before).
 */
export function getEffectiveStreak(progress: ReadingProgress): number {
  if (!progress.lastReadDate || progress.currentStreak === 0) return 0;
  const today = new Date().toDateString();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toDateString();
  return progress.lastReadDate === today || progress.lastReadDate === yesterday
    ? progress.currentStreak
    : 0;
}

export function getDayByDate(dateString: string): DayPlan | null {
  return biblePlan.find(p => p.date === dateString) || null;
}

const emptyProgress = (): ReadingProgress => ({
  completedDays: [],
  lastReadDate: null,
  currentStreak: 0,
  longestStreak: 0,
  // New readers start with a full bank. Handing over the safety net before it
  // is needed is what makes it a safety net rather than a reward.
  freezes: MAX_FREEZES,
  lastFreezeRegenDate: null,
  frozenDays: [],
});

/** Whole days between two dates, ignoring clock time. */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Bring a stored progress record up to date with the calendar.
 *
 * This is the heart of freezes, and it runs on READ rather than on write —
 * because the event that matters (a day passing with nothing read) is the
 * absence of an action, and absences never fire callbacks. Nothing happens at
 * midnight; the reckoning happens the next time the app is opened, by looking
 * at how many days have gone by since the last read.
 *
 * Each fully-missed day between the last read and today consumes one freeze.
 * The moment the bank cannot cover a missed day, the streak breaks and no
 * further freezes are spent on it. Today is NEVER treated as missed — it is
 * still in progress.
 *
 * REGEN DOES NOT HAPPEN HERE, and that is the whole point.
 * The first cut refilled the bank +1 for every elapsed DAY, which sounds right
 * and is broken: spending is also 1 per missed day, so the bank drained and
 * refilled at exactly the same rate and the streak became mathematically
 * unbreakable. A test with an EMPTY bank and a missed day still came back with
 * the streak alive, which is how it was caught.
 *
 * So freezes accrue on days you actually READ (see markDayAsRead). You earn
 * cover by showing up, and missed days only spend it. That keeps the bank
 * finite, keeps the streak losable, and still means a regular reader is nearly
 * always carrying a full net.
 */
export function reconcileStreak(progress: ReadingProgress, now: Date = new Date()): ReadingProgress {
  const p = { ...progress, frozenDays: [...progress.frozenDays] };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!p.lastReadDate || p.currentStreak === 0) return p;

  const last = new Date(p.lastReadDate);
  // gap of 1 means "read yesterday" — nothing missed, streak intact.
  const gap = daysBetween(last, today);
  if (gap <= 1) return p;

  // Days strictly between the last read and today are the missed ones.
  const missed = gap - 1;
  for (let i = 1; i <= missed; i++) {
    if (p.freezes <= 0) {
      // Out of cover: the streak genuinely breaks here.
      p.currentStreak = 0;
      return p;
    }
    p.freezes -= 1;
    const d = new Date(last);
    d.setDate(d.getDate() + i);
    const key = planDateKey(d);
    if (!p.frozenDays.includes(key)) p.frozenDays.push(key);
  }

  // Every missed day was covered, so the streak survives. lastReadDate moves to
  // yesterday so the next completed read continues the run rather than
  // restarting it — the freeze has to stand in for the read it replaced.
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  p.lastReadDate = yesterday.toDateString();
  return p;
}

/**
 * Coerce whatever is on disk into a valid ReadingProgress.
 *
 * This used to `return JSON.parse(data)` and trust it. It isn't trustworthy:
 * this key has been written by older builds of the app that stored only
 * `completedDays`, with no streak fields at all. Reading one of those blobs
 * back gave `currentStreak === undefined`, and then:
 *
 *   longestStreak = Math.max(undefined, 1)   // => NaN
 *
 * NaN is sticky — `Math.max(NaN, anything)` is NaN forever — so the longest
 * streak was permanently broken, and JSON.stringify writes NaN out as `null`,
 * which reads back as 0 and silently wipes the record. A missing/!Array
 * `completedDays` threw outright on `.includes`. Normalising on the way IN
 * means the arithmetic downstream only ever sees numbers and an array.
 */
function normalizeProgress(raw: unknown): ReadingProgress {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<Record<keyof ReadingProgress, unknown>>;

  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;

  // Dedupe: a day appearing twice would inflate the completion percentage.
  const days = Array.isArray(p.completedDays)
    ? Array.from(new Set(p.completedDays.filter((d): d is string => typeof d === 'string')))
    : [];

  const currentStreak = num(p.currentStreak);
  const frozen = Array.isArray(p.frozenDays)
    ? Array.from(new Set(p.frozenDays.filter((d): d is string => typeof d === 'string')))
    : [];
  return {
    completedDays: days,
    lastReadDate: typeof p.lastReadDate === 'string' ? p.lastReadDate : null,
    currentStreak,
    // Longest can never be less than current, whatever the stored value says.
    longestStreak: Math.max(num(p.longestStreak), currentStreak),
    // Records written before freezes existed have no bank; they get a full one
    // rather than zero, so upgrading the app never costs someone their streak.
    freezes: p.freezes === undefined ? MAX_FREEZES : Math.min(MAX_FREEZES, num(p.freezes)),
    lastFreezeRegenDate: typeof p.lastFreezeRegenDate === 'string' ? p.lastFreezeRegenDate : null,
    frozenDays: frozen,
  };
}

export async function getProgress(): Promise<ReadingProgress> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return emptyProgress();
    // Reconciled on the way out: a day passing with nothing read produces no
    // event, so the only place to notice it is the next read.
    return reconcileStreak(normalizeProgress(JSON.parse(data)));
  } catch (error) {
    console.error('Error loading progress:', error);
    return emptyProgress();
  }
}

/**
 * Complete a day. REFUSES unless every passage for that day has been
 * individually confirmed.
 *
 * The guard is here, not only in the UI, and that is deliberate: the previous
 * bug was app/reading.tsx calling this directly on render, bypassing any
 * intention on the reader's part. A rule that only exists in a button can be
 * routed around by the next call site; a rule in the writer cannot.
 *
 * Returns whether the day was (or already is) complete, so callers can tell
 * "done" from "refused" instead of guessing.
 */
export async function markDayAsRead(dateString: string): Promise<boolean> {
  try {
    // THE CHECK. Days not in the plan (defensive) and days missing any
    // confirmation are both refused.
    const fullyRead = await isDayFullyRead(dateString);
    if (!fullyRead) return false;

    const progress = await getProgress();
    if (!progress.completedDays.includes(dateString)) {
      progress.completedDays.push(dateString);

      // Streak only moves when TODAY'S reading is the one being marked —
      // completing an old missed day still counts toward overall progress
      // (completedDays / percentage), but claiming it extended a streak of
      // consecutive days would make the streak number mean nothing.
      const now = new Date();
      const isMarkingToday = dateString === planDateKey(now);

      const today = now.toDateString();
      if (isMarkingToday && progress.lastReadDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (progress.lastReadDate === yesterdayString) {
          progress.currentStreak += 1;
        } else {
          progress.currentStreak = 1;
        }
        
        progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
        progress.lastReadDate = today;

        // Earn cover by showing up: +1 per DAY READ, capped. Guarded on the
        // date so two readings marked on the same day only ever bank one.
        if (progress.lastFreezeRegenDate !== today) {
          progress.freezes = Math.min(MAX_FREEZES, progress.freezes + 1);
          progress.lastFreezeRegenDate = today;
        }
        // Reading today supersedes any freeze that had covered it.
        progress.frozenDays = progress.frozenDays.filter((d) => d !== dateString);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// HISTORICAL DATA INTEGRITY
//
// Streaks recorded before this change were earned under the old rule: a day
// was completed by OPENING one of its four passages (and app/reading.tsx
// marked it automatically on render). So some historical `completedDays` —
// possibly many — represent one passage read, not four.
//
// NOTHING IS REWRITTEN, and that is a decision rather than laziness. The old
// storage recorded only a per-day boolean "something was opened"; it never
// recorded WHICH passages were read. The information needed to separate a
// legitimately-complete day from an over-credited one was never written down,
// so any "correction" would be a guess applied to someone's personal record —
// either deleting days they genuinely did read, or keeping days they did not,
// with no way to tell which. Silently halving a 200-day streak on the basis of
// a guess is worse than an honest note.
//
// So: the record stands, and the app says so once. This stores a snapshot of
// what was on the books at upgrade time, which is what makes the disclosure
// specific ("the 43 days completed before this update") rather than vague.
// ---------------------------------------------------------------------------

const INTEGRITY_KEY = '@bible_progress_integrity_v2';

export interface LegacyProgressNotice {
  /** completedDays already on the books when the stricter rule shipped. */
  legacyCompletedCount: number;
  /** ISO date the upgrade was first seen. */
  noticedAt: string;
  /** Set once the reader dismisses the note. */
  acknowledged: boolean;
}

/**
 * Run once per install. Returns the notice to show, or null when there is
 * nothing to say — a fresh install has no legacy days, and an acknowledged
 * notice never returns again.
 */
export async function getLegacyProgressNotice(): Promise<LegacyProgressNotice | null> {
  try {
    const existing = await AsyncStorage.getItem(INTEGRITY_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as LegacyProgressNotice;
      return parsed.acknowledged ? null : parsed;
    }

    // First run under the new rule. Snapshot what is already recorded.
    const progress = await getProgress();
    const legacyCompletedCount = progress.completedDays.length;

    const notice: LegacyProgressNotice = {
      legacyCompletedCount,
      noticedAt: new Date().toISOString(),
      // A fresh install has nothing to disclose, so it is pre-acknowledged and
      // the reader never sees a note about data that does not exist.
      acknowledged: legacyCompletedCount === 0,
    };
    await AsyncStorage.setItem(INTEGRITY_KEY, JSON.stringify(notice));
    return notice.acknowledged ? null : notice;
  } catch {
    return null;
  }
}

export async function acknowledgeLegacyProgressNotice(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(INTEGRITY_KEY);
    const parsed: LegacyProgressNotice = existing
      ? JSON.parse(existing)
      : { legacyCompletedCount: 0, noticedAt: new Date().toISOString(), acknowledged: true };
    parsed.acknowledged = true;
    await AsyncStorage.setItem(INTEGRITY_KEY, JSON.stringify(parsed));
  } catch {
    // A failed acknowledgement just means the note appears once more.
  }
}

export function getCompletionPercentage(completedDays: string[]): number {
  return Math.round((completedDays.length / totalDays) * 100);
}

/** The four states a day in the week strip can be in. */
export type WeekDayStatus = 'completed' | 'frozen' | 'today' | 'pending';

export function getWeekProgress(
  completedDays: string[],
  frozenDays: string[] = [],
): { day: string; status: WeekDayStatus }[] {
  const today = new Date();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: { day: string; status: WeekDayStatus }[] = [];
  
  // Get the start of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    
    const isToday = date.toDateString() === today.toDateString();
    // planDateKey, not a locale month: this string is matched against
    // completedDays, which is written with the plan's English month names.
    // A locale month made every dot in the week strip read as "pending".
    const dateString = planDateKey(date);

    // Completed wins over the "today" highlight — today's dot flipping to
    // the done state the moment it's marked is the immediate feedback the
    // strip exists to give; the old order overwrote it back to neutral.
    // Order matters. Completed outranks frozen (a day that was covered and
    // then actually read is read, not frozen), and both outrank the "today"
    // highlight — today's dot flipping to done the moment it's marked is the
    // immediate feedback the strip exists to give.
    let status: WeekDayStatus = 'pending';
    if (completedDays.includes(dateString)) {
      status = 'completed';
    } else if (frozenDays.includes(dateString)) {
      status = 'frozen';
    } else if (isToday) {
      status = 'today';
    }
    
    result.push({
      day: weekDays[i],
      status
    });
  }
  
  return result;
}

export async function isDayCompleted(dateString: string): Promise<boolean> {
  const progress = await getProgress();
  return progress.completedDays.includes(dateString);
}