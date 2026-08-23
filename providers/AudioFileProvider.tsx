// providers/AudioFileProvider.tsx
// THE APP'S ONE NOW-PLAYING STATE. Every audio surface reads from here: the
// Library's shelves and rows, the collection screens, the mini bar and the
// full player.
//
// ONE PLAYER, ONE SOURCE, NEVER TWO
// A phone can sensibly play one thing at a time, so this provider models
// exactly one active track. That is why the Prayer tab's old "ambient audio"
// capsule is gone: it was a second, parallel floating bar with its own local
// isPlaying state and no audio behind it, and keeping it would have guaranteed
// two now-playing bars the day the live prayer stream became real. See
// AudioTrack below for how a live stream slots into this same state.
//
// WHY THIS EXISTS ALONGSIDE PlaybackProvider
// PlaybackProvider drives a YouTube IFrame inside a WebView and every path
// through it expects a Message with a videoId. An mp3 url is neither, so these
// are two different engines by necessity. They agree on one thing: only one of
// them may be audible. Starting a track here closes the video player; the
// reverse direction is handled in AudioPlayerHost, which can see both.
//
// ---------------------------------------------------------------------------
// HOW THE SOURCE IS LOADED, AND WHY IT IS NOT player.replace()
//
// It used to call player.replace({ uri }) to change tracks and player.replace(
// null) to release the file on dismiss. The second of those CRASHED, every
// time the mini bar's × was tapped:
//
//   Call to function 'AudioPlayer.replace' has been rejected.
//   → The 2nd argument cannot be cast to type expo.modules.audio.AudioSource
//     (received null)
//   → Cannot assigned null to not nullable type.  [ERR_NULL_ARGUMENT]
//
// The TypeScript type says `AudioSource = string | number | null | {…}`, so
// this compiled cleanly — but the Android binding is
// `Function("replace") { player: AudioPlayer, source: AudioSource -> … }` with
// a NON-nullable Kotlin parameter (expo-audio 57.0.4,
// android/…/AudioModule.kt). The nullability in the TS type is a lie about the
// native signature.
//
// The fix is not a different method call, it is a different SHAPE. expo-audio
// releases a player through `useReleasingSharedObject`, which
// `useAudioPlayer` is built on: when the hook's dependencies change it calls
// `.release()` on the old player, and on Android that runs
// sharedObjectDidRelease → releasePlayer → ExoPlayer.release(), which is what
// actually frees the buffered audio. So the source is passed TO THE HOOK
// instead of pushed into the player afterwards:
//
//   useAudioPlayer(source)  →  source changes  →  old player released
//                                                 (buffers freed)
//                              →  new player created with the new source
//
// Dismissing sets the source to null, which releases the loaded player and
// leaves a fresh, empty one. That is both the crash fix and the memory
// release, and it is the lifecycle the library documents.
//
// The other two candidates were checked and rejected: `player.remove()` and
// the inherited `SharedObject.release()` both detach the JS object from its
// native counterpart PERMANENTLY — every later call throws — and
// useAudioPlayer's deps never change on their own, so nothing would recreate
// the player afterwards. They are correct for a player you are finished with,
// not for a persistent one you intend to reuse.
//
// LAZY BY CONSTRUCTION still holds: the hook is called with a null source, so
// mounting the app touches no audio data. A uri only enters `current`, and
// therefore the hook, from a tap.
// ---------------------------------------------------------------------------
//
// TWO CONTEXTS, ON PURPOSE — see the note above AudioProgressContext. The
// short version: playback position updates twice a second, and a single
// context would re-render every audio row in the app at that rate.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import type { R2Item } from '../services/r2';
import { usePlayback } from './PlaybackProvider';
import { getPosition, savePosition, clearPosition, mediaKey } from '../utils/playbackProgress';
import {
  downloadAudio,
  reconcileIndex,
  removeDownload,
  type DownloadIndex,
} from '../utils/audioDownloads';

// ---------------------------------------------------------------------------
// WHAT CAN PLAY
//
// AudioTrack is the provider's whole vocabulary. It is deliberately NOT R2Item:
// R2Item is a row of the sermon manifest (sizeBytes, sourceFilename), and the
// live prayer stream this player will eventually carry has none of those. A
// track is the small set of things the mini bar and the full player actually
// need, and `kind` is what tells them which behaviours apply.
//
// WIRING MIXLR LATER is therefore a construction, not a refactor:
//
//   play({
//     id: 'live:prayer',
//     title: 'Prayer & Fasting: Live',
//     uri: <the Mixlr stream url>,
//     kind: 'live',
//     subtitle: 'Live now',
//   });
//
// and nothing else changes. `kind: 'live'` already suppresses the three things
// that are meaningless for a stream — position restore, position saving, and
// save-for-offline — at the points where they are decided, so there is no
// second code path to write. The queue stays empty, so previous/next disable
// themselves.
// ---------------------------------------------------------------------------
export type AudioTrackKind = 'recording' | 'live';

export interface AudioTrack {
  /** Stable identity. Also the progress-store key — see utils/playbackProgress. */
  id: string;
  title: string;
  /** What the player loads. Already resolved: a local file when one is saved. */
  uri: string;
  kind: AudioTrackKind;
  /** Second line in the mini bar when there is nothing better to show. */
  subtitle?: string | null;
  speaker?: string | null;
  /** The derived group title, when the item belongs to a detected series. */
  series?: string | null;
  date?: string;
  /**
   * The public url. Kept separate from `uri` because `uri` may be a local
   * file: sharing a file:// path, or "saving" something already on disk, are
   * both nonsense. Absent for live.
   */
  sourceUrl?: string;
}

/** Adapt a manifest row into a track. The one place the two models meet. */
export function trackFromR2(
  item: R2Item,
  opts?: { series?: string | null; speaker?: string | null; localUri?: string }
): AudioTrack {
  return {
    // mediaKey, not a literal, so the track id and the progress store's key
    // are the same string by construction — a Continue Listening row looks a
    // track up by exactly this value.
    id: mediaKey(item.sourceFilename, item.url),
    title: item.title,
    uri: opts?.localUri ?? item.url,
    kind: 'recording',
    speaker: opts?.speaker ?? null,
    series: opts?.series ?? null,
    date: item.date,
    sourceUrl: item.url,
  };
}

/** Speeds offered by the player. No existing speed convention in the app to
 *  match, so this is the conventional set, anchored on 1x. */
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

/** How far into a track previous() stops meaning "back one" and starts meaning
 *  "restart this one". The convention every music app uses. */
const RESTART_WINDOW = 3;

/** Position is persisted on a timer, not every tick. */
const SAVE_INTERVAL_MS = 5000;

/** Below this, a saved position is not worth restoring — resuming at 0:02
 *  reads as a bug rather than as a courtesy. */
const RESUME_FLOOR = 10;

export interface AudioQueue {
  /** The tracks next()/previous() move through, in display order. */
  items: AudioTrack[];
  /** What to call this context ("Faith Foundations", "Recent Audio"). */
  label: string | null;
}

interface AudioControlsValue {
  track: AudioTrack | null;
  playing: boolean;
  /** Loaded but not yet ready — a 100MB mp3 on mobile data is not instant. */
  loading: boolean;
  rate: PlaybackRate;

  queue: AudioTrack[];
  queueLabel: string | null;
  queueIndex: number;
  hasNext: boolean;
  hasPrevious: boolean;

  /** Full player (true) vs docked mini bar (false). */
  expanded: boolean;
  /** Anything loaded at all — the mini bar shows only when true. */
  hasActive: boolean;

  play: (track: AudioTrack, queue?: AudioQueue) => void;
  /** Play, or pause/resume when it is already the loaded track. */
  toggle: (track: AudioTrack, queue?: AudioQueue) => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (seconds: number) => void;
  /** Called continuously while a scrubber is dragged; does not seek. */
  scrubTo: (seconds: number | null) => void;
  setRate: (rate: PlaybackRate) => void;

  expand: () => void;
  collapse: () => void;
  /** Stops playback, releases the loaded file and dismisses the player. */
  close: () => void;

  isActive: (id: string) => boolean;
  isPlaying: (id: string) => boolean;
  isLoading: (id: string) => boolean;

  isSaved: (url: string) => boolean;
  isSaving: (url: string) => boolean;
  saveOffline: (track: AudioTrack) => Promise<void>;
  removeOffline: (track: AudioTrack) => Promise<void>;
}

interface AudioProgressValue {
  /** Seconds. The DRAGGED value while a scrubber is in use. */
  position: number;
  /** Seconds, 0 until the player has read the file's header. */
  duration: number;
  buffering: boolean;
}

const AudioControlsContext = createContext<AudioControlsValue | null>(null);

// ---------------------------------------------------------------------------
// WHY PROGRESS IS A SEPARATE CONTEXT
//
// The player emits a status update every 500ms, so `position` changes twice a
// second forever while anything is playing. When that lived in the single
// context, every consumer re-rendered at that rate — and the consumers are the
// Library's whole audio page (its shelves, its rows) plus the bottom-clearance
// hook on EVERY tab. Each of those shelf cards and rows draws generated SVG
// artwork, so a tick meant regenerating thousands of path points. That is what
// produced React Native's "VirtualizedList: large list slow to update" warning
// and the lag when opening the Audio tab.
//
// Splitting it means the ticking value has exactly one consumer that needs it
// (the full player's progress bar and time labels), and the lists re-render
// only when something they actually show changes — which track is active, and
// whether it is playing.
// ---------------------------------------------------------------------------
const AudioProgressContext = createContext<AudioProgressValue>({
  position: 0,
  duration: 0,
  buffering: false,
});

export function AudioFileProvider({ children }: { children: React.ReactNode }) {
  const { close: closeVideo } = usePlayback();

  // `uri` is captured at play time and never recomputed from the download
  // index afterwards. That is deliberate: if the source were derived live,
  // saving the playing track for offline would swap its uri mid-listen, which
  // — because the uri is the hook's dependency — would rebuild the player and
  // restart the sermon from zero.
  const [current, setCurrent] = useState<AudioTrack | null>(null);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [queueLabel, setQueueLabel] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [rate, setRateState] = useState<PlaybackRate>(1);
  const [scrubbing, setScrubbing] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<DownloadIndex>({});
  const [saving, setSaving] = useState<Record<string, true>>({});

  // THE SOURCE. Changing this object's contents is what releases the old
  // player and builds a new one — see the long note at the top of the file.
  // Memoised on the two primitives the hook stringifies, so an unrelated
  // re-render cannot rebuild the player and interrupt playback.
  const source = useMemo(
    () => (current ? { uri: current.uri, name: current.title } : null),
    [current?.uri, current?.title]
  );

  const player = useAudioPlayer(source, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const restoredFor = useRef<string | null>(null);
  const finishedFor = useRef<string | null>(null);

  useEffect(() => {
    // Without this, iOS silences playback when the ring switch is set to
    // silent — which is where a lot of phones live, and it reads as "the app's
    // audio is broken" rather than as a device setting.
    //
    // shouldPlayInBackground is deliberately NOT set: it needs the expo-audio
    // config plugin plus a native rebuild (iOS background audio mode, an
    // Android foreground service), and setting the flag without that is a
    // promise the build cannot keep. In-app playback across navigation — what
    // the mini bar is for — needs none of it.
    setAudioModeAsync({ playsInSilentMode: true }).catch((e) =>
      console.warn('Failed to set audio mode:', e)
    );
    // One reconcile at startup, so a saved file that no longer exists (app
    // reinstalled, storage offloaded) does not become the one recording that
    // cannot play. See utils/audioDownloads.
    reconcileIndex().then(setDownloads).catch(() => {});
  }, []);

  // AUTOPLAY ON A NEW PLAYER. `player` is a new object exactly when the source
  // changed, which is exactly when a new track was loaded — so this effect
  // fires once per track and never on an unrelated re-render. play() before
  // the file is ready is fine: it sets playWhenReady, the standard behaviour
  // of the underlying players on both platforms.
  useEffect(() => {
    if (!current) return;
    player.setPlaybackRate(rate);
    player.play();
    // `rate` is intentionally not a dependency — setRate applies it directly,
    // and listing it here would restart playback on a speed change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  const queueIndex = useMemo(
    () => (current ? queue.findIndex((t) => t.id === current.id) : -1),
    [queue, current]
  );

  const play = useCallback(
    (track: AudioTrack, next?: AudioQueue) => {
      // One player audible at a time. The video host is a sibling surface with
      // its own WebView; leaving it running under a sermon is two of them at
      // once, which is unambiguously a bug rather than a preference.
      closeVideo();
      setCurrent(track);
      setQueue(next?.items?.length ? next.items : [track]);
      setQueueLabel(next?.label ?? null);
      setExpanded(true);
    },
    [closeVideo]
  );

  const togglePlayPause = useCallback(() => {
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing]);

  const toggle = useCallback(
    (track: AudioTrack, next?: AudioQueue) => {
      if (current?.id === track.id) {
        togglePlayPause();
        return;
      }
      play(track, next);
    },
    [current, play, togglePlayPause]
  );

  /** Move within the queue WITHOUT resetting it or opening the full player —
   *  next/previous stay inside the context you are already in. */
  const goToIndex = useCallback(
    (index: number) => {
      const track = queue[index];
      if (track) setCurrent(track);
    },
    [queue]
  );

  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;

  const next = useCallback(() => {
    if (hasNext) goToIndex(queueIndex + 1);
  }, [hasNext, goToIndex, queueIndex]);

  const previous = useCallback(() => {
    // Read the position from the PLAYER rather than from state. Keeping the
    // live position out of the controls context is what stops every audio row
    // in the app re-rendering twice a second — see AudioProgressContext.
    if (player.currentTime > RESTART_WINDOW || queueIndex <= 0) {
      player.seekTo(0);
      return;
    }
    goToIndex(queueIndex - 1);
  }, [player, goToIndex, queueIndex]);

  const seekTo = useCallback(
    (seconds: number) => {
      const total = player.duration;
      player.seekTo(Math.max(0, total > 0 ? Math.min(seconds, total) : seconds));
    },
    [player]
  );

  const scrubTo = useCallback((seconds: number | null) => setScrubbing(seconds), []);

  const setRate = useCallback(
    (nextRate: PlaybackRate) => {
      setRateState(nextRate);
      // shouldCorrectPitch defaults on, which keeps a sermon at 1.5x sounding
      // like a person talking faster rather than a chipmunk.
      player.setPlaybackRate(nextRate);
    },
    [player]
  );

  const close = useCallback(() => {
    player.pause();
    // Setting the track to null nulls the hook's source, which releases this
    // player — ExoPlayer.release() / AVPlayer teardown — and builds an empty
    // one. THIS is what frees the buffered file; there is no replace(null).
    setCurrent(null);
    setQueue([]);
    setQueueLabel(null);
    setExpanded(false);
    restoredFor.current = null;
    finishedFor.current = null;
  }, [player]);

  // ---- continue where you left off ----------------------------------------
  // Recordings only. A live stream has no meaningful position to return to.

  useEffect(() => {
    if (!current || current.kind !== 'recording' || !status.isLoaded) return;
    if (restoredFor.current === current.id) return;
    restoredFor.current = current.id;

    let cancelled = false;
    getPosition(current.id)
      .then((saved) => {
        if (cancelled || !saved || saved.positionSeconds < RESUME_FLOOR) return;
        // A few seconds of run-up, so you rejoin mid-sentence rather than
        // exactly where a pause cut one in half.
        player.seekTo(Math.max(0, saved.positionSeconds - 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [current, status.isLoaded, player]);

  // Persist on a timer while playing, and once more on pause/track-change —
  // that trailing write is what makes closing the app mid-listen resumable.
  useEffect(() => {
    if (!current || current.kind !== 'recording') return;
    const id = current.id;
    const persist = () => {
      const at = player.currentTime;
      const total = player.duration;
      if (at > 0 && total > 0) savePosition(id, at, total);
    };
    if (!status.playing) {
      persist();
      return;
    }
    const timer = setInterval(persist, SAVE_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      persist();
    };
  }, [current, status.playing, player]);

  // ---- end of track --------------------------------------------------------
  // didJustFinish stays LATCHED in the status object until the source changes,
  // so an effect that simply reads it fires again on every unrelated status
  // update — which, with an auto-advance inside, is an infinite skip through
  // the queue. The ref makes "finished" a one-shot per track.
  useEffect(() => {
    if (!current) return;
    if (!status.didJustFinish) {
      if (finishedFor.current === current.id && status.currentTime < 1) {
        finishedFor.current = null; // restarted — re-arm
      }
      return;
    }
    if (finishedFor.current === current.id) return;
    finishedFor.current = current.id;

    // Finished means finished: drop the saved position so replaying starts at
    // the top rather than at 99%.
    if (current.kind === 'recording') clearPosition(current.id).catch(() => {});
    if (hasNext) goToIndex(queueIndex + 1);
    // No wrap and no autoplay past the end. A series plays through and stops.
  }, [status.didJustFinish, status.currentTime, current, hasNext, goToIndex, queueIndex]);

  // Rate has to be re-asserted once the file is actually loaded: setting it on
  // a source that is still resolving is dropped on both platforms, which is how
  // a 1.5x listener ends up back at 1x on every track change.
  useEffect(() => {
    if (status.isLoaded) player.setPlaybackRate(rate);
  }, [status.isLoaded, rate, player]);

  // ---- offline -------------------------------------------------------------
  // Recordings only, and guarded rather than merely undisplayed: a live stream
  // has no finite file to save.

  const saveOffline = useCallback(async (track: AudioTrack) => {
    const url = track.sourceUrl;
    if (!url || track.kind !== 'recording') return;
    setSaving((s) => ({ ...s, [url]: true }));
    try {
      const uri = await downloadAudio(url);
      setDownloads((d) => ({ ...d, [url]: uri }));
    } finally {
      setSaving((s) => {
        const { [url]: _drop, ...rest } = s;
        return rest;
      });
    }
  }, []);

  const removeOffline = useCallback(async (track: AudioTrack) => {
    const url = track.sourceUrl;
    if (!url) return;
    await removeDownload(url);
    setDownloads((d) => {
      const { [url]: _drop, ...rest } = d;
      return rest;
    });
  }, []);

  // ---- exposed values ------------------------------------------------------
  //
  // NOTHING BELOW MAY DEPEND ON status.currentTime. That is the rule that keeps
  // the lists still; the ticking values live in the progress context instead.

  const controls = useMemo<AudioControlsValue>(() => {
    const id = current?.id ?? null;
    return {
      track: current,
      playing: status.playing,
      loading: id !== null && !status.isLoaded,
      rate,

      queue,
      queueLabel,
      queueIndex,
      hasNext,
      // Always available while something is loaded: at index 0 it restarts the
      // track, which is a real action. Deciding that here would need the live
      // position, so the decision lives inside previous() instead.
      hasPrevious: id !== null,

      expanded,
      hasActive: id !== null,

      play,
      toggle,
      togglePlayPause,
      next,
      previous,
      seekTo,
      scrubTo,
      setRate,
      expand: () => setExpanded(true),
      collapse: () => setExpanded(false),
      close,

      isActive: (candidate: string) => candidate === id,
      isPlaying: (candidate: string) => candidate === id && status.playing,
      isLoading: (candidate: string) => candidate === id && !status.isLoaded,

      isSaved: (url: string) => !!downloads[url],
      isSaving: (url: string) => !!saving[url],
      saveOffline,
      removeOffline,
    };
  }, [
    current,
    status.playing,
    status.isLoaded,
    rate,
    queue,
    queueLabel,
    queueIndex,
    hasNext,
    expanded,
    play,
    toggle,
    togglePlayPause,
    next,
    previous,
    seekTo,
    scrubTo,
    setRate,
    close,
    downloads,
    saving,
    saveOffline,
    removeOffline,
  ]);

  const progress = useMemo<AudioProgressValue>(
    () => ({
      position: scrubbing ?? status.currentTime,
      duration: status.duration,
      buffering: status.isBuffering,
    }),
    [scrubbing, status.currentTime, status.duration, status.isBuffering]
  );

  return (
    <AudioControlsContext.Provider value={controls}>
      <AudioProgressContext.Provider value={progress}>{children}</AudioProgressContext.Provider>
    </AudioControlsContext.Provider>
  );
}

/** Everything except the ticking position. Safe to consume from a list row. */
export function useAudioFiles(): AudioControlsValue {
  const ctx = useContext(AudioControlsContext);
  if (!ctx) throw new Error('useAudioFiles must be used within an AudioFileProvider');
  return ctx;
}

/**
 * The playback position, which changes twice a second.
 *
 * Consume this ONLY where the moving number is actually drawn — today that is
 * the full player's progress bar and the mini bar's hairline. Anything else
 * that subscribes re-renders at 2Hz for the life of the track.
 */
export function useAudioProgress(): AudioProgressValue {
  return useContext(AudioProgressContext);
}
