// providers/AppearanceProvider.tsx
// The user's APPEARANCE PREFERENCE — Light / Dark / System — stored and read.
//
// ---------------------------------------------------------------------------
// THIS NOW DRIVES REAL THEMING. It used to store a choice and nothing else.
//
// What changed: constants/palette.ts added a SEMANTIC colour layer (roles, not
// pigments) with a light and a dark implementation, and hooks/useTheme.ts gave
// components a way to read colour during render instead of capturing it at
// module-import time inside StyleSheet.create(). This provider is where the
// two meet: it owns the preference, collapses 'system' against the live OS
// setting, and hands the resulting Palette down.
//
// 'system' IS LIVE. useColorScheme() subscribes to RN's Appearance change
// event, so flipping the OS setting while the app is open re-renders every
// consumer without a relaunch. That only works because app.json now declares
// `userInterfaceStyle: "automatic"` — while it was pinned to "light" the OS
// never reported anything else and the hook was permanently stuck.
//
// THE MIGRATION IS NOT FINISHED. Screens that have been converted to
// makeThemedStyles follow this provider; screens still importing
// `theme.colors` at module scope stay light-only until they are converted.
// See the report in the pull request for exactly which are which. A converted
// screen renders byte-identically in light mode, which is what makes it safe
// to convert them a few at a time rather than in one 76-file commit.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type Palette } from '../constants/palette';

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
   * The choice with 'system' collapsed against the OS colour scheme. This is
   * what the app actually draws, and it updates live when the OS setting
   * changes while the app is open.
   */
  resolved: ResolvedAppearance;
  /**
   * The palette for `resolved`. Components read this through
   * hooks/useTheme.ts rather than importing it directly — see that file for
   * why colour has to be resolved during render.
   */
  colors: Palette;
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

  const value = useMemo<AppearanceContextValue>(() => {
    // `systemScheme` is null on platforms that cannot report one; that is not
    // "dark", so anything other than an explicit 'dark' resolves to light.
    const resolved: ResolvedAppearance =
      preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
    return {
      preference,
      resolved,
      // The SAME object identity every time for a given appearance — the two
      // palettes are module constants. makeThemedStyles caches on that
      // identity, so a re-render for an unrelated reason cannot invalidate
      // every stylesheet in the app.
      colors: palettes[resolved],
      setPreference,
      hydrated,
    };
  }, [preference, systemScheme, setPreference, hydrated]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used inside AppearanceProvider');
  return ctx;
}
