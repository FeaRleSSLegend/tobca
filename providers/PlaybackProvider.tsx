// providers/PlaybackProvider.tsx
// Owns "what is playing, how, and in what surface". This is the single
// source of truth the whole app plays through — every card calls play(),
// and the persistent player host (components/player/PlayerHost) reads this
// to render exactly one YouTube player instance that survives navigation.
//
// The key architectural decision for the mini-player: a YouTube IFrame
// player lives inside a WebView, and a WebView CANNOT be moved between
// React trees or remounted without restarting playback. So the player is
// NOT a route you navigate to and away from. Instead it is rendered ONCE,
// high in the tree (PlayerHost, mounted in the root layout), and this
// provider only flips an `expanded` flag. Expanding and collapsing animate
// the SAME mounted player between full-screen and a docked mini-bar, so
// audio/video never cuts out when you leave the full player to keep
// browsing — the YouTube-style behavior requested.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Message, hasVideo, hasAudio } from '../data/contentModel';

export type PlaybackMode = 'video' | 'audio';

interface PlaybackContextValue {
  activeMessage: Message | null;
  mode: PlaybackMode;
  // Full-screen (true) vs docked mini-bar (false). Playback continues in
  // both; this only changes the surface.
  expanded: boolean;
  // Whether anything is loaded at all (mini-bar shows only when true).
  hasActive: boolean;

  play: (message: Message, opts?: { preferAudio?: boolean }) => void;
  setMode: (mode: PlaybackMode) => void;
  expand: () => void;
  collapse: () => void;
  // Fully tears down playback and hides the player entirely (the mini-bar's
  // dismiss button).
  close: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [mode, setMode] = useState<PlaybackMode>('video');
  const [expanded, setExpanded] = useState(false);

  const play = useCallback((message: Message, opts?: { preferAudio?: boolean }) => {
    const resolvedMode: PlaybackMode =
      opts?.preferAudio && hasAudio(message)
        ? 'audio'
        : hasVideo(message)
        ? 'video'
        : 'audio';

    setActiveMessage(message);
    setMode(resolvedMode);
    // Playing always opens full-screen; the host animates up from wherever
    // it was (nothing, or the mini-bar).
    setExpanded(true);
  }, []);

  const expand = useCallback(() => setExpanded(true), []);
  const collapse = useCallback(() => setExpanded(false), []);
  const close = useCallback(() => {
    setExpanded(false);
    setActiveMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      activeMessage,
      mode,
      expanded,
      hasActive: activeMessage !== null,
      play,
      setMode,
      expand,
      collapse,
      close,
    }),
    [activeMessage, mode, expanded, play, expand, collapse, close]
  );

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return ctx;
}
