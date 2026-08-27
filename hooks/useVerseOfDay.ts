// hooks/useVerseOfDay.ts
// TODAY'S VERSE — picked once per day, never repeating inside 30 days.
//
// THE THREE PROPERTIES THIS HAS TO HAVE, and why each is not free:
//
// 1. STABLE WITHIN A DAY. The obvious implementation — pick at random on
//    mount — gives a different verse every time you switch tabs, which reads
//    as the app being broken rather than as variety. So the choice is WRITTEN
//    DOWN against today's date the first time it is made, and every later read
//    that day returns the recorded choice rather than picking again.
//
// 2. NO REPEAT INSIDE 30 DAYS. That is a property of the HISTORY, not of the
//    picker: you cannot get it by seeding a PRNG on the date, because a hash
//    of the date collides freely and would happily show the same verse twice
//    in a week. So there is a real stored history and the eligible pool is the
//    pool minus what it contains.
//
// 3. GRACEFUL WHEN THE POOL IS TOO SMALL. If the pool ever shrinks to 30 or
//    fewer, "exclude the last 30 days" excludes everything and a naive
//    implementation either crashes on an empty array or falls through to
//    yesterday's verse — the two worst answers. The fallback is LEAST RECENTLY
//    USED, which degrades to a clean rotation rather than to a repeat, and
//    explicitly cannot return yesterday's verse while the pool holds more than
//    one item.
//
// DATES ARE LOCAL, not UTC. "Today's verse" means today where the reader is;
// keying on an ISO timestamp would roll the verse over at midnight UTC, which
// is 1am in Abuja — the app's own city — so people would see the new verse an
// hour into the previous evening.
//
// STORAGE is one AsyncStorage key holding a bounded array. It is pruned to
// twice the no-repeat window, so it cannot grow without limit no matter how
// long the app is installed.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fallbackVerse,
  getVerse,
  NO_REPEAT_DAYS,
  VERSE_POOL_SIZE,
  verseOfDayPool,
  type VerseOfDay,
} from '../data/verseOfDay';

const STORAGE_KEY = '@verse_of_day_history';

/** Keep twice the window, so the exclusion set is always fully covered. */
const HISTORY_LIMIT = NO_REPEAT_DAYS * 2;

interface HistoryEntry {
  /** The verse's reference, which is its id. */
  ref: string;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
}

/** Local calendar day as YYYY-MM-DD. See the note above on why not UTC. */
export function localDayKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** How many days ago a day-key is, relative to `today`. */
function daysAgo(day: string, today: Date): number {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return Number.POSITIVE_INFINITY;
  // Compare at local midnight on both sides so the result is a whole number of
  // calendar days rather than a fractional difference of instants.
  const then = new Date(y, m - 1, d).getTime();
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((now - then) / 86_400_000);
}

function isEntry(v: unknown): v is HistoryEntry {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as HistoryEntry).ref === 'string' &&
    typeof (v as HistoryEntry).day === 'string'
  );
}

/**
 * Choose today's verse from `history`, returning it plus the history to store.
 *
 * PURE, and exported, so the rule can be reasoned about (and tested) without
 * AsyncStorage, a fake clock, or a rendered component in the way.
 */
export function selectVerse(
  history: HistoryEntry[],
  now: Date = new Date()
): { verse: VerseOfDay; history: HistoryEntry[]; wasExhausted: boolean } {
  const today = localDayKey(now);

  // Already decided today: return that, unchanged. This is property 1.
  const todays = history.find((h) => h.day === today);
  if (todays) {
    const verse = getVerse(todays.ref);
    // The recorded verse can be missing if the pool was edited between
    // launches. Falling through to a fresh pick is right; keeping a dangling
    // reference is not.
    if (verse) return { verse, history, wasExhausted: false };
  }

  const recent = new Set(
    history.filter((h) => daysAgo(h.day, now) < NO_REPEAT_DAYS).map((h) => h.ref)
  );

  const eligible = verseOfDayPool.filter((v) => !recent.has(v.reference));
  const wasExhausted = eligible.length === 0;

  let verse: VerseOfDay;
  if (!wasExhausted) {
    verse = eligible[Math.floor(Math.random() * eligible.length)];
  } else {
    // ---- LEAST RECENTLY USED ----
    // Property 3. Every verse is in `recent`, so pick the one whose most
    // recent showing is oldest. `lastSeen` defaults to Infinity for a verse
    // with no record at all, which sorts it first — correct, since never-shown
    // beats long-ago-shown.
    const lastSeen = new Map<string, number>();
    for (const h of history) {
      const age = daysAgo(h.day, now);
      const prev = lastSeen.get(h.ref);
      // Smallest age = most recent showing.
      if (prev === undefined || age < prev) lastSeen.set(h.ref, age);
    }
    verse = [...verseOfDayPool].sort(
      (a, b) =>
        (lastSeen.get(b.reference) ?? Number.POSITIVE_INFINITY) -
        (lastSeen.get(a.reference) ?? Number.POSITIVE_INFINITY)
    )[0];
  }

  const next = [
    { ref: verse.reference, day: today },
    // Drop any earlier entry for today — reachable only when the recorded
    // verse no longer exists in the pool, and leaving both would make the
    // day ambiguous on the next read.
    ...history.filter((h) => h.day !== today),
  ].slice(0, HISTORY_LIMIT);

  return { verse, history: next, wasExhausted };
}

export interface UseVerseOfDayResult {
  verse: VerseOfDay;
  /** False until history has been read back and today's verse decided. */
  ready: boolean;
  /**
   * True when the 30-day exclusion emptied the pool and the least-recently-used
   * fallback had to run. Surfaced rather than swallowed: it is the signal that
   * the pool needs to grow, and it is invisible from the outside otherwise.
   */
  exhausted: boolean;
  /** The pool size, so a caller (or a log line) can report it. */
  poolSize: number;
}

export function useVerseOfDay(): UseVerseOfDayResult {
  // Starts on the fallback so the card renders real text on frame one rather
  // than a blank or a skeleton — a verse card that flashes empty on every app
  // open is worse than one that settles from a known verse to today's.
  const [verse, setVerse] = useState<VerseOfDay>(fallbackVerse);
  const [ready, setReady] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  const decide = useCallback(async () => {
    let history: HistoryEntry[] = [];
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      // Validated element by element rather than cast: this value survives app
      // upgrades, and one malformed row must not take the whole feature down.
      if (Array.isArray(parsed)) history = parsed.filter(isEntry);
    } catch {
      // Unreadable or corrupt history behaves exactly like a first launch.
      history = [];
    }

    const result = selectVerse(history);
    setVerse(result.verse);
    setExhausted(result.wasExhausted);
    setReady(true);

    if (result.wasExhausted) {
      console.warn(
        `[verseOfDay] Pool of ${VERSE_POOL_SIZE} exhausted by the ${NO_REPEAT_DAYS}-day ` +
          'no-repeat window; fell back to least-recently-used. Grow data/verseOfDay.ts.'
      );
    }

    // Only write when the history actually changed — i.e. when a new choice
    // was made. Re-reads on later mounts the same day must not touch storage.
    if (result.history !== history) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result.history)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    decide().catch(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [decide]);

  return { verse, ready, exhausted, poolSize: VERSE_POOL_SIZE };
}
