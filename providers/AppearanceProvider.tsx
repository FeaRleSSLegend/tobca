// providers/AppearanceProvider.tsx
// The user's APPEARANCE PREFERENCE — Light / Dark / System — stored and read.
//
// ---------------------------------------------------------------------------
// READ THIS BEFORE ASSUMING THE APP HAS DARK MODE. IT DOES NOT.
//
// This provider stores a CHOICE. It does not restyle anything, and nothing in
// the app reads `resolved` yet. That is deliberate and it is not an oversight,
// because of what constants/theme.ts actually is:
//
//   `theme` is a frozen `const` object of literal light-mode hex values,
//   imported directly — `theme.colors.navy`, `theme.colors.bg` — at module
//   scope by essentially every component and every StyleSheet.create() call in
//   the project. StyleSheet.create() runs ONCE, at import time, long before
//   any React context could exist. There is no ThemeProvider, no useTheme(),
//   no `colors.text`/`colors.background` semantic layer — only concrete names
//   like `navy`, `pinkWash` and `grayBorder` that describe a pigment rather
//   than a role, so there is nothing to swap even if a swap mechanism existed.
//   app.json additionally pins `userInterfaceStyle: "light"`.
//
// Real dark mode therefore needs, in order: a semantic colour layer over the
// literal one (surface/onSurface/border/... rather than navy/white/grayBorder),
// a second palette behind it, a hook to read the active one, and then every
// StyleSheet in the app converted from module-scope constants to values
// resolved during render. That is a project, not a checkbox, and doing a third
// of it would leave the app half-dark — which is strictly worse than honestly
// light. So the switch is built, the choice is persisted, and the Settings
// screen says plainly that it is not applied yet.
//
// WHAT THE FOLLOW-UP INHERITS FROM THIS FILE: the preference already survives
// restarts, `resolved` already collapses 'system' against the OS setting, and
// the whole app is already wrapped. The dark-mode work starts at the palette,
// not at the plumbing.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** What the user picked. 'system' means "follow the OS", and is the default. */
export type AppearancePreference = 'light' | 'dark' | 'system';

/** What that resolves to once 'system' is collapsed against the OS setting. */
export type ResolvedAppearance = 'light' | 'dark';

const STORAGE_KEY = '@appearance_preference';

const isPreference = (v: unknown): v is AppearancePreference =>
  v === 'light' || v === 'dark' || v === 'system';

interface AppearanceContextValue {
  /** The raw stored choice — this is what the Settings selector shows. */
  preference: AppearancePreference;
  /**
   * The choice with 'system' collapsed against the OS colour scheme. NOTHING
   * READS THIS YET — see the note at the top of this file. It exists so the
   * dark-mode follow-up has one obvious place to start rather than having to
   * re-derive it.
   */
  resolved: ResolvedAppearance;
  setPreference: (next: AppearancePreference) => void;
  /**
   * False until the stored value has been read back. The Settings screen uses
   * it to avoid flashing 'system' selected for a frame when the user actually
   * chose something else — AsyncStorage is async and the first render happens
   * before it answers.
   */
  hydrated: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        // Validated rather than cast: a value written by an older build (or a
        // corrupted one) must fall back to the default, not become a
        // preference the rest of the app then has to handle.
        if (isPreference(stored)) setPreferenceState(stored);
      })
      // A storage read failing is not worth surfacing — the default is a
      // perfectly good answer, and it is the answer a first launch gives too.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    // State first, write after. The selector must respond to the tap on the
    // same frame; the persistence is a background detail and a failed write
    // costs the user the choice on next launch, not the choice they just made.
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preference,
      resolved:
        preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference,
      setPreference,
      hydrated,
    }),
    [preference, systemScheme, setPreference, hydrated]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used inside AppearanceProvider');
  return ctx;
}
