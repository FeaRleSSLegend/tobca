import AsyncStorage from '@react-native-async-storage/async-storage';
import { biblePlan, totalDays, DayPlan } from '../data/biblePlan';

const STORAGE_KEY = '@bible_progress';
const unlockKey = (date: string) => `@bible_reading_unlocked_${date}`;

// The full reading view lives on a separate pushed screen now (app/reading.tsx),
// not inline on the Plan tab — so "they finished a reading" can't just be a
// piece of component state anymore, it has to survive a navigation away and
// back. Persisting a simple flag per day is the same pattern already used for
// scroll-position restore, just one key instead of a value.
export async function markReadingUnlocked(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(unlockKey(date), 'true');
  } catch (error) {
    console.error('Error saving reading-unlocked flag:', error);
  }
}

export async function isReadingUnlocked(date: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(unlockKey(date));
    return value === 'true';
  } catch {
    return false;
  }
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

export async function markDayAsRead(dateString: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error saving progress:', error);
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