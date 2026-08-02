// providers/PlaybackProvider.tsx
// One place that owns "what is playing and how". Every card, hero, and row
// in the app plays content by calling play(message) from this context, so
// there is exactly one code path into playback — no screen builds its own
// player, and future features (Continue Watching resume, a global mini
// player, audio/video switching) hook in here rather than in twelve call
// sites.
//
// This iteration keeps the surface deliberately small: it holds the active
// message and preferred mode, and opens the full-screen player route. It
// does NOT yet implement a persistent mini-player or background audio —
// those are later items, and the architecture doc is explicit about not
// building ahead of need. But because play() is the sole entry point, add-
// ing them later touches only this file.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Message, hasVideo, hasAudio } from '../data/contentModel';

export type PlaybackMode = 'video' | 'audio';

interface PlaybackContextValue {
  activeMessage: Message | null;
  mode: PlaybackMode;
  // Play a message. `preferAudio` is a hint (used later for the
  // data-saving "audio on cellular" default); today it's honored only when
  // the message actually has an audio variant.
  play: (message: Message, opts?: { preferAudio?: boolean }) => void;
  setMode: (mode: PlaybackMode) => void;
  stop: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [mode, setMode] = useState<PlaybackMode>('video');

  const play = useCallback((message: Message, opts?: { preferAudio?: boolean }) => {
    // Pick the mode the message can actually satisfy: honor an audio
    // preference only if there's an audio variant, otherwise fall to video,
    // and vice versa. A message always has at least one variant, so one of
    // these is always true.
    const resolvedMode: PlaybackMode =
      opts?.preferAudio && hasAudio(message)
        ? 'audio'
        : hasVideo(message)
        ? 'video'
        : 'audio';

    setActiveMessage(message);
    setMode(resolvedMode);
    // The player is a modally-presented route (configured in app/_layout).
    // Passing only the id keeps the URL clean and stable; the player reads
    // the full message from this context, not from params.
    router.push({ pathname: '/player', params: { id: message.id } });
  }, []);

  const stop = useCallback(() => {
    setActiveMessage(null);
  }, []);

  const value = useMemo(
    () => ({ activeMessage, mode, play, setMode, stop }),
    [activeMessage, mode, play, stop]
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
