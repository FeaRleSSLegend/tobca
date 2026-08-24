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
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
} from 'expo-audio';
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

/** How close the player has to get to a seek target before the scrub bar stops
 *  being held there. A seek lands on a keyframe and status samples twice a
 *  second, so an exact match would never arrive. */
const SEEK_SETTLE_EPSILON = 1.5;

/** Give up holding the bar after this long, even if the position never
 *  arrives. A bar stuck at the wrong place is worse than a brief jump. */
const SEEK_SETTLE_TIMEOUT_MS = 2000;

// ---------------------------------------------------------------------------
// CALLING A PLAYER THAT MAY ALREADY BE GONE
//
// useAudioPlayer swaps the AudioPlayer instance every time the source changes
// (see the long note above), and useReleasingSharedObject releases the old one
// as soon as React commits. Anything holding the previous instance — a timer, a
// resolved promise, a callback captured before the swap — is then pointing at a
// JS object whose native counterpart is gone, and expo-modules throws:
//
//   ERR_USING_RELEASED_SHARED_OBJECT
//   "Cannot use shared object that was already released"
//
// That was not theoretical. It threw from inside this provider on device,
// React treated it as a component error, and the whole provider subtree was
// torn down — taking the MediaSession and the media foreground service with it,
// which is what actually stopped background playback.
//
// A call on a released player is meaningless BY CONSTRUCTION: that player has
// no source, no audio and no session, and a newer one has already replaced it.
// So the correct behaviour is a no-op, not an exception. Every imperative call
// goes through here.
//
// Anything that is NOT a released-object error is re-thrown — this swallows one
// specific, well-understood race, not errors in general.
function callPlayer<T>(label: string, fn: () => T): T | undefined {
  try {
    return fn();
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'ERR_USING_RELEASED_SHARED_OBJECT') {
      if (__DEV__) console.log(`[audio] skipped "${label}" on a released player`);
      return undefined;
    }
    throw e;
  }
}

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
  /**
   * True while the displayed position is being driven by a drag or by a seek
   * that has not landed yet — i.e. while `position` deliberately disagrees
   * with the player. The UI can use it for drag affordances; nothing about
   * playback changes.
   */
  isSeeking: boolean;
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
  isSeeking: false,
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
  /** The position a seek is currently travelling to, while it travels. */
  const pendingSeek = useRef<number | null>(null);
  const seekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const askedForNotifications = useRef(false);

  useEffect(() => {
    // Without this, iOS silences playback when the ring switch is set to
    // silent — which is where a lot of phones live, and it reads as "the app's
    // audio is broken" rather than as a device setting.
    //
    // BACKGROUND PLAYBACK. All three of these are load-bearing:
    //
    //   playsInSilentMode      iOS silences playback when the ring switch is
    //                          set to silent, which is where a lot of phones
    //                          live, and it reads as "the app's audio is
    //                          broken" rather than as a device setting.
    //
    //   shouldPlayInBackground keeps the audio session alive when the app is
    //                          backgrounded or the screen is locked. Defaults
    //                          to false. This was previously left off on
    //                          purpose, because the config plugin had not been
    //                          told to emit the native pieces; it now is (see
    //                          app.json), so the flag is finally honest.
    //
    //   interruptionMode       MUST be 'doNotMix' for the lock-screen controls
    //                          to work. Per expo-audio's own note on
    //                          setActiveForLockScreen: without exclusive audio
    //                          focus "the OS might not associate lock screen
    //                          controls with your player". It is also the right
    //                          behaviour for a sermon — a teaching playing
    //                          under someone else's music helps nobody.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((e) => console.warn('Failed to set audio mode:', e));

    // One reconcile at startup, so a saved file that no longer exists (app
    // reinstalled, storage offloaded) does not become the one recording that
    // cannot play. See utils/audioDownloads.
    reconcileIndex().then(setDownloads).catch(() => {});
  }, []);

  // AUTOPLAY + LOCK SCREEN ON A NEW PLAYER.
  //
  // `player` is a new object exactly when the source changed, which is exactly
  // when a new track was loaded — so this effect fires once per track and never
  // on an unrelated re-render. play() before the file is ready is fine: it sets
  // playWhenReady, the standard behaviour of the underlying players on both
  // platforms.
  //
  // setActiveForLockScreen IS NOT COSMETIC ON ANDROID. From expo-audio's own
  // note on shouldPlayInBackground: "On Android, you have to enable the
  // lockscreen controls with setActiveForLockScreen for sustained background
  // playback. Otherwise, the audio will stop after approximately 3 minutes of
  // background playback (OS limitation)." Enabling the config plugin alone
  // gets you three minutes of a 50-minute sermon. It also has to be re-called
  // for every new player object, which is why it lives here rather than in the
  // mount effect: a player that was never made active for the lock screen is
  // not merely missing its notification, it is on a timer.
  useEffect(() => {
    if (!current) return;
    callPlayer('autoplay.rate', () => player.setPlaybackRate(rate));
    callPlayer('autoplay.play', () => player.play());

    // Guarded like every other native call — and additionally because this one
    // depends on a service being present in the built manifest. If it is ever
    // missing (an older build, the plugin not applied) the correct outcome is
    // "playback works, notification does not".
    callPlayer('lockScreen.activate', () =>
      player.setActiveForLockScreen(
        true,
        {
          title: current.title,
          // The speaker is the closest thing a sermon has to an artist, and
          // the series is the closest thing it has to an album. Both are
          // omitted rather than filled with a placeholder when the manifest
          // does not know them (speaker is absent on ~20% of items) — a
          // notification reading "Unknown" is worse than one reading only the
          // title.
          artist: current.speaker ?? undefined,
          albumTitle: current.series ?? undefined,
        },
        {
          // A live stream has no duration and nothing to seek within, so the
          // lock screen is told to drop the scrub bar and the seek buttons
          // rather than showing controls that cannot do anything. This is the
          // Mixlr path already wired: a track with kind 'live' gets the right
          // notification for free.
          isLiveStream: current.kind === 'live',
          showSeekForward: current.kind === 'recording',
          showSeekBackward: current.kind === 'recording',
        }
      )
    );

    // `rate` is intentionally not a dependency — setRate applies it directly,
    // and listing it here would restart playback on a speed change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, current]);

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

      // ANDROID 13+ NOTIFICATION PERMISSION, asked ONCE, on the first play of
      // the session.
      //
      // Android hides the media foreground-service notification without it,
      // and that notification is the transport people reach for from the lock
      // screen. expo-audio's config plugin does NOT add POST_NOTIFICATIONS for
      // playback — only for background RECORDING (see withAudio.ts) — so
      // nothing else requests it.
      //
      // Asked HERE rather than at startup, deliberately. A permission dialog
      // on a cold launch, before the person has done anything, is the pattern
      // everyone has learned to dismiss; asked at the moment audio starts, it
      // is about something they can see happening. Fire and forget: playback
      // has already begun and a denial costs the notification, not the sermon,
      // so nothing may block or branch on the answer.
      if (!askedForNotifications.current) {
        askedForNotifications.current = true;
        requestNotificationPermissionsAsync().catch(() => {});
      }
      setCurrent(track);
      setQueue(next?.items?.length ? next.items : [track]);
      setQueueLabel(next?.label ?? null);
      setExpanded(true);
    },
    [closeVideo]
  );

  const togglePlayPause = useCallback(() => {
    if (status.playing) callPlayer('toggle.pause', () => player.pause());
    else callPlayer('toggle.play', () => player.play());
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
    const at = callPlayer('previous.currentTime', () => player.currentTime) ?? 0;
    if (at > RESTART_WINDOW || queueIndex <= 0) {
      callPlayer('previous.restart', () => player.seekTo(0));
      return;
    }
    goToIndex(queueIndex - 1);
  }, [player, goToIndex, queueIndex]);

  // ---- SEEKING, AND WHY THE DISPLAY IS HELD AFTERWARDS ---------------------
  //
  // THE GLITCH THIS FIXES. Dragging the scrub bar showed the thumb jump
  // backward and then forward, or snap back and stick until you tapped the
  // exact target. The drag itself was already correct — `scrubbing` overrode
  // the displayed position while the finger was down. The bug was at RELEASE:
  // the caller did
  //
  //     seekTo(target);   // fires a native seek, returns immediately
  //     scrubTo(null);    // display reverts to status.currentTime — NOW
  //
  // and status.currentTime is still the PRE-SEEK value, because the native
  // seek has not landed yet and the status object only refreshes every 500ms.
  // So for up to half a second the bar rendered the old position (the snap
  // back), then jumped again when the update finally arrived.
  //
  // The fix is to keep overriding the display until the player's own reported
  // position actually reaches the target. `scrubbing` therefore has two
  // sources now — the live drag, and this settle window — and both mean the
  // same thing to the renderer: "ignore currentTime, show this instead".
  //
  // PLAYBACK IS NEVER PAUSED for any of this. The audio keeps running under
  // the drag exactly as before; only what the bar draws is affected.
  /** Hand the display back to live playback, whichever way the seek ended. */
  const releaseSeekHold = useCallback(() => {
    if (seekTimer.current !== null) {
      clearTimeout(seekTimer.current);
      seekTimer.current = null;
    }
    pendingSeek.current = null;
    setScrubbing(null);
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      const total = callPlayer('seek.duration', () => player.duration) ?? 0;
      const target = Math.max(0, total > 0 ? Math.min(seconds, total) : seconds);

      // Hold the display AT the target, and keep holding it. Released by the
      // settle effect below once playback has caught up — or by this deadline
      // if it never does.
      pendingSeek.current = target;
      setScrubbing(target);
      if (seekTimer.current !== null) clearTimeout(seekTimer.current);
      seekTimer.current = setTimeout(releaseSeekHold, SEEK_SETTLE_TIMEOUT_MS);

      callPlayer('seek.seekTo', () => player.seekTo(target));
    },
    [player, releaseSeekHold]
  );

  /**
   * Called continuously while the bar is dragged. Passing a number takes the
   * display over; passing null releases it — but note that a release is
   * normally followed by seekTo(), which immediately takes it over again for
   * the settle window. Only a CANCELLED gesture releases outright.
   */
  const scrubTo = useCallback(
    (seconds: number | null) => {
      if (seconds === null) {
        releaseSeekHold();
        return;
      }
      setScrubbing(seconds);
    },
    [releaseSeekHold]
  );

  const setRate = useCallback(
    (nextRate: PlaybackRate) => {
      setRateState(nextRate);
      // shouldCorrectPitch defaults on, which keeps a sermon at 1.5x sounding
      // like a person talking faster rather than a chipmunk.
      callPlayer('setRate', () => player.setPlaybackRate(nextRate));
    },
    [player]
  );

  const close = useCallback(() => {
    callPlayer('close.pause', () => player.pause());
    // Drop the notification with the playback it describes. Without this the
    // lock screen keeps a dead transport for a player that no longer exists,
    // and tapping it does nothing. Guarded for the same reason as
    // setActiveForLockScreen — dismissing must never be able to throw.
    callPlayer('close.clearLockScreen', () => player.clearLockScreenControls());
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
        callPlayer('restore.seekTo', () => player.seekTo(Math.max(0, saved.positionSeconds - 3)));
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
      const at = callPlayer('persist.currentTime', () => player.currentTime) ?? 0;
      const total = callPlayer('persist.duration', () => player.duration) ?? 0;
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

  // ---- RELEASING THE SEEK HOLD --------------------------------------------
  //
  // Two ways out, and they need different mechanisms:
  //
  //   caught up   the player's reported position is within SEEK_SETTLE_EPSILON
  //               of where we asked it to go. Checked on each status tick.
  //               Normal case, usually the very next tick.
  //   timed out   the position never arrives — a failed seek, a track change
  //               mid-gesture, a source that cannot seek. A bar stuck at a
  //               position the audio is not at is a worse failure than the
  //               glitch this all exists to fix, so there is a deadline.
  //
  // THE TIMEOUT IS ARMED IN seekTo, NOT IN THIS EFFECT, and that placement is
  // the whole point. Armed here, it would be cleared and re-created on every
  // status tick — and status ticks every 500ms against a 2000ms deadline, so
  // it could never actually elapse. The one case the timeout exists for is the
  // one where it would never have fired.
  //
  // The epsilon is generous (1.5s) because a seek lands on a keyframe, not on
  // the exact millisecond requested, and because status only samples twice a
  // second — demanding an exact match would never release.
  useEffect(() => {
    const target = pendingSeek.current;
    if (target === null) return;
    if (Math.abs(status.currentTime - target) > SEEK_SETTLE_EPSILON) return;
    releaseSeekHold();
  }, [status.currentTime, releaseSeekHold]);

  // Rate has to be re-asserted once the file is actually loaded: setting it on
  // a source that is still resolving is dropped on both platforms, which is how
  // a 1.5x listener ends up back at 1x on every track change.
  useEffect(() => {
    if (status.isLoaded) callPlayer('reassertRate', () => player.setPlaybackRate(rate));
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
      isSeeking: scrubbing !== null,
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
