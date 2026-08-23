// providers/AudioFileProvider.tsx
// Playback for the church's own mp3s (the R2 audio manifest).
//
// WHY THIS EXISTS ALONGSIDE PlaybackProvider
// PlaybackProvider drives a YouTube IFrame inside a WebView and every path
// through it expects a Message with a videoId. An mp3 url is neither, so these
// are two different players by necessity, not by oversight. They are kept
// deliberately separate rather than merged behind one interface: a merged
// provider would have to branch on media type at every call site anyway, and
// the WebView's "must never remount" constraint has nothing to say about an
// expo-audio player.
//
// WHY IT IS A PROVIDER RATHER THAN LOCAL STATE
// The audio mode is now two surfaces — the Library's Audio shelves and the
// per-series screen you reach from them. With the player owned by one screen,
// opening a series would either kill playback or start a second, competing
// player. One instance above both means tapping play in a series screen and
// going back leaves the same track playing, with the same row still showing
// its pause glyph.
//
// LAZY BY CONSTRUCTION — this is the load-on-demand guarantee, and it lives
// here rather than in the list:
//   - exactly ONE AudioPlayer exists, created with NO source, so mounting the
//     app touches no audio data at all
//   - a source is attached only inside toggle(), i.e. only from a tap
//   - expo-audio's preload() API is never called anywhere in this codebase
// Rendering a row, scrolling past a row, or having a row on screen cannot
// start a request. See the note in AudioLibrary about what the rows actually
// receive.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import type { R2Item } from '../services/r2';

interface AudioFileContextValue {
  /** The url of the track currently loaded, or null when nothing has played. */
  activeUrl: string | null;
  /** The item currently loaded — kept so any surface can label what is on. */
  activeItem: R2Item | null;
  playing: boolean;
  /** Loaded track is still buffering — a 100MB mp3 on mobile data is not instant. */
  loading: boolean;
  /** Play this item, or pause/resume it if it is already the loaded one. */
  toggle: (item: R2Item) => void;
  /** True for the item currently loaded AND playing. */
  isPlaying: (url: string) => boolean;
  isLoading: (url: string) => boolean;
}

const AudioFileContext = createContext<AudioFileContextValue | null>(null);

export function AudioFileProvider({ children }: { children: React.ReactNode }) {
  // No source. Nothing is fetched until replace() is called from a tap.
  const player = useAudioPlayer(undefined, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [active, setActive] = useState<R2Item | null>(null);

  useEffect(() => {
    // Without this, iOS silences playback when the ring switch is set to
    // silent — which is where a lot of phones live, and it reads as "the app's
    // audio is broken" rather than as a device setting.
    setAudioModeAsync({ playsInSilentMode: true }).catch((e) =>
      console.warn('Failed to set audio mode:', e)
    );
  }, []);

  const toggle = useCallback(
    (item: R2Item) => {
      if (active?.url === item.url) {
        if (status.playing) player.pause();
        else player.play();
        return;
      }
      setActive(item);
      // THE ONLY PLACE A URL EVER REACHES THE PLAYER.
      player.replace({ uri: item.url, name: item.title });
      player.play();
    },
    [active, player, status.playing]
  );

  const value = useMemo<AudioFileContextValue>(() => {
    const activeUrl = active?.url ?? null;
    return {
      activeUrl,
      activeItem: active,
      playing: status.playing,
      loading: activeUrl !== null && !status.isLoaded,
      toggle,
      isPlaying: (url: string) => url === activeUrl && status.playing,
      isLoading: (url: string) => url === activeUrl && !status.isLoaded,
    };
  }, [active, status.playing, status.isLoaded, toggle]);

  return <AudioFileContext.Provider value={value}>{children}</AudioFileContext.Provider>;
}

export function useAudioFiles(): AudioFileContextValue {
  const ctx = useContext(AudioFileContext);
  if (!ctx) throw new Error('useAudioFiles must be used within an AudioFileProvider');
  return ctx;
}
