// components/player/AudioPlayerHost.tsx
// The surface for the church's audio: one full-screen player and one docked
// mini bar, both driven by the single expo-audio instance in
// providers/AudioFileProvider.
//
// WHY THIS IS NOT A ROUTE
// Same reason components/player/PlayerHost isn't, arrived at from the other
// direction. There, a YouTube WebView physically cannot be remounted without
// restarting playback, so the player had to be a persistent overlay. Here the
// player is an audio object that already lives above the tree, so a route
// WOULD survive playback — but it would not survive navigation: pushing
// /player onto the stack from a tab, then tapping another tab, unmounts it,
// and there is no longer anything on screen that says what is playing. An
// overlay is the only shape where "leave the player, keep listening, still see
// what's on" is true, which is the entire premise of a mini bar.
//
// SO THE TWO SURFACES ARE ONE COMPONENT with one Animated driver, `t`:
//   t = 0  mini bar docked directly above the tab bar
//   t = 1  full player covering the screen
// Both are always mounted; t moves them. That is what makes expanding a
// TRANSITION rather than a screen swap — the sheet rises, the bar fades into
// it, and playback is never touched by either.
//
// THE ONE HARD RULE ABOUT THE TAB BAR
// The bar must never cover navigation. It docks at the tab bar's TOP edge
// inside (tabs), and at the safe-area inset on a pushed screen where there is
// no tab bar to sit above — hence useSegments below. Every scrolling screen
// adds audioMiniBarFootprint() to its bottom padding while the bar is up (see
// hooks/useBottomClearance), so nothing is ever hidden behind it either.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  BackHandler,
  Share,
  ActivityIndicator,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import {
  useAudioFiles,
  useAudioProgress,
  PLAYBACK_RATES,
  type PlaybackRate,
} from '../../providers/AudioFileProvider';
import { usePlayback } from '../../providers/PlaybackProvider';
import { formatAudioDate, formatClock } from '../../utils/audioGrouping';
import { artSeed, paletteFor } from '../../utils/audioArtwork';
import { AudioArt } from '../ui/AudioArt';
import { AudioCover } from '../ui/AudioCover';
import { PlayingBars } from '../ui/PlayingBars';
import { PressableScale } from '../ui/motion';
import { makeThemedStyles } from '../../hooks/useTheme';

// ---- Mini bar geometry ------------------------------------------------------
// EXPORTED because the bar floats over every scrolling screen, so each of them
// has to end its content above it. hooks/useBottomClearance derives that
// clearance from these exact numbers rather than keeping a second copy — a
// hardcoded guess is how the old flat 120pt tab clearance ended up
// simultaneously too small when docked and dead space when not.
export const MINI_BAR_HEIGHT = 58;
export const MINI_BAR_MARGIN = 8;

/** Vertical space the docked mini bar occupies at the bottom of a screen. */
export function audioMiniBarFootprint(): number {
  return MINI_BAR_HEIGHT + MINI_BAR_MARGIN * 2;
}

const EXPAND_MS = 340;

export function AudioPlayerHost() {
  // The mini bar follows the app's appearance; the full player below does
  // not, and the sheet definitions say why.
  const miniStyles = useMiniStyles();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const audio = useAudioFiles();
  const { position: rawPosition, duration, isSeeking } = useAudioProgress();
  const video = usePlayback();

  // NO MANIFEST READ HERE, deliberately. This host is mounted at the root of
  // the app, so anything it fetches or computes is paid on every launch even
  // by someone who never opens the Audio tab. It used to read the R2 manifest
  // and run the whole 546-item grouping pass purely to look up a series name.
  // The track now CARRIES its series (see AudioTrack), resolved once by
  // whichever list the user tapped, so this component needs no data source at
  // all beyond the provider.

  const [queueOpen, setQueueOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [saveError, setSaveError] = useState(false);

  const track = audio.track;
  const expanded = audio.expanded;

  // ---- one player audible at a time, the other direction -------------------
  // AudioFileProvider closes the video player when an mp3 starts. It cannot do
  // the reverse — PlaybackProvider is its PARENT and cannot see it — so the
  // symmetric rule lives here, where both contexts are visible.
  const videoActive = video.hasActive;
  useEffect(() => {
    if (videoActive && audio.playing) audio.togglePlayPause();
  }, [videoActive]);

  // ---- the morph -----------------------------------------------------------
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration: EXPAND_MS,
      easing: Easing.inOut(Easing.cubic),
      // Layout props (the sheet's translate is fine, but the bar's `bottom`
      // is not) — kept on the JS driver so every interpolation below shares
      // one driver and cannot desynchronise mid-transition.
      useNativeDriver: false,
    }).start();
  }, [expanded, t]);

  // Collapse on Android back while the full player is open, so back means
  // "leave the player" rather than "leave the screen behind the player".
  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (queueOpen) {
        setQueueOpen(false);
        return true;
      }
      audio.collapse();
      return true;
    });
    return () => sub.remove();
  }, [expanded, queueOpen, audio]);

  // Panels are per-session, not per-track: leaving the player should not leave
  // a queue sheet open behind it for next time.
  useEffect(() => {
    if (!expanded) {
      setQueueOpen(false);
      setSpeedOpen(false);
    }
  }, [expanded]);
  useEffect(() => setSaveError(false), [track?.id]);

  // ---- derived metadata ----------------------------------------------------
  const series = track?.series ?? null;
  const speaker = track?.speaker ?? null;
  const dateLabel = formatAudioDate(track?.date) ?? null;
  const seed = track ? artSeed(track.title, series) : '';
  const palette = paletteFor(seed);
  // A live stream has no finite length and nothing to resume, so the transport
  // hides the things that would be lies about it.
  const isLive = track?.kind === 'live';
  const canSave = !!track?.sourceUrl && !isLive;

  const position = Math.min(rawPosition, duration || rawPosition);
  const progress = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  // ---- scrubbing -----------------------------------------------------------
  // A PanResponder over a measured track rather than a Slider: the app has no
  // slider dependency, and this needs to drive the provider's `scrubbing`
  // override (so the time label follows the thumb, not the audio) which a
  // stock slider's onValueChange does not give cleanly across platforms.
  const scrub = useRef({ width: 0, duration: 0 });
  scrub.current = { width: trackWidth, duration };

  const secondsAt = (x: number) => {
    const { width: w, duration: d } = scrub.current;
    if (w <= 0 || d <= 0) return 0;
    return Math.max(0, Math.min(1, x / w)) * d;
  };

  /** The seconds the bar last displayed under the finger — see the release
   *  handler for why the commit reads this instead of the event. */
  const lastScrub = useRef<number | null>(null);

  const scrubResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Claim the gesture outright and refuse to give it back: the sheet
      // scrolls, and without this a slightly diagonal scrub is taken over by
      // the ScrollView and the seek is abandoned halfway through.
      onPanResponderTerminationRequest: () => false,
      // locationX is measured against the view holding the responder — the
      // track's own hit area — for the whole gesture, move events included, so
      // it is the same coordinate throughout. secondsAt() clamps, which is what
      // handles a finger that has slid past either end of the bar.
      onPanResponderGrant: (e) => {
        lastScrub.current = secondsAtRef.current(e.nativeEvent.locationX);
        scrubRef.current.scrubTo(lastScrub.current);
      },
      onPanResponderMove: (e) => {
        lastScrub.current = secondsAtRef.current(e.nativeEvent.locationX);
        scrubRef.current.scrubTo(lastScrub.current);
      },
      // COMMIT WHAT THE BAR LAST SHOWED, not a fresh coordinate read.
      //
      // This used to re-read e.nativeEvent.locationX on release, and on Android
      // that value is stale on the up event — measured on device, a drag across
      // the bar committed a seek at roughly the gesture's MIDPOINT rather than
      // where the finger was lifted. That is the other half of the reported
      // glitch, and the half that explains its strangest symptom: tapping the
      // exact target worked, because a tap's grant and release are the same
      // point, so a stale coordinate is still the right one.
      //
      // The last value the move handler displayed is by definition the position
      // the user saw under their finger, so committing it makes the seek agree
      // with the bar by construction rather than by two coordinate reads
      // happening to match.
      //
      // NO scrubTo(null) here either: seekTo() takes the display over at the
      // target and holds it until playback arrives. Releasing here would hand
      // the bar back to a currentTime that is still pre-seek — the backward
      // snap. See the seek note in AudioFileProvider.
      onPanResponderRelease: () => {
        if (lastScrub.current !== null) scrubRef.current.seekTo(lastScrub.current);
        lastScrub.current = null;
      },
      onPanResponderTerminate: () => {
        lastScrub.current = null;
        scrubRef.current.scrubTo(null);
      },
    })
  ).current;

  // Refs so the responder (created once) always calls the current callbacks.
  const scrubRef = useRef({ scrubTo: audio.scrubTo, seekTo: audio.seekTo });
  scrubRef.current = { scrubTo: audio.scrubTo, seekTo: audio.seekTo };
  const secondsAtRef = useRef(secondsAt);
  secondsAtRef.current = secondsAt;

  // ---- mini-bar gestures ---------------------------------------------------
  //
  // EVERY ANIMATION IN THIS COMPONENT RUNS ON THE JS DRIVER, and that is not an
  // oversight to tidy up later. `t` drives layout props (the bar's opacity sits
  // on the same view as this pan's transform, and the sheet's translate is
  // composed WITH this value via Animated.add), and a value that a native-driven
  // animation has touched cannot then be read by a JS-driven one — React Native
  // throws "Attempting to run JS driven animation on animated node that has been
  // moved to native". One driver across the whole component is the only
  // configuration that does not crash. It is also what PlayerHost does, for the
  // same reason.
  const miniPan = useRef(new Animated.Value(0)).current;
  const miniResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || g.dy < -6,
      onPanResponderMove: (_e, g) => {
        // Upward drag is "expand" and gets no travel; sideways is "dismiss"
        // and follows the finger, so the two gestures never feel like the
        // same one half-done.
        if (g.dy < -8 && Math.abs(g.dx) < 20) return;
        miniPan.setValue(g.dx);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -40 && Math.abs(g.dx) < 40) {
          miniPan.setValue(0);
          miniRef.current.expand();
          return;
        }
        if (Math.abs(g.vx) > 0.7 || Math.abs(g.dx) > widthRef.current * 0.32) {
          Animated.timing(miniPan, {
            toValue: g.dx > 0 ? widthRef.current : -widthRef.current,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false, // see the driver note above
          }).start(() => {
            miniPan.setValue(0);
            miniRef.current.close();
          });
          return;
        }
        Animated.spring(miniPan, {
          toValue: 0,
          useNativeDriver: false, // see the driver note above
          tension: 70,
          friction: 11,
        }).start();
      },
    })
  ).current;
  const miniRef = useRef({ expand: audio.expand, close: audio.close });
  miniRef.current = { expand: audio.expand, close: audio.close };
  const widthRef = useRef(width);
  widthRef.current = width;

  // ---- full-sheet drag-to-collapse ----------------------------------------
  // Its own callback ref, for the same reason the mini bar has one: the
  // responder is built once and would otherwise capture the first render's
  // collapse().
  const collapseRef = useRef(audio.collapse);
  collapseRef.current = audio.collapse;
  const sheetPan = useRef(new Animated.Value(0)).current;
  const sheetResponder = useRef(
    PanResponder.create({
      // Downward only, and only once it is clearly a drag rather than a tap —
      // the sheet contains a scroll view and every control on the player.
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 1.6,
      onPanResponderMove: (_e, g) => sheetPan.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 120 || g.vy > 0.9) {
          sheetPan.setValue(0);
          collapseRef.current();
          return;
        }
        Animated.spring(sheetPan, {
          toValue: 0,
          // Composed with `t` through Animated.add for the sheet's translate,
          // so it must share t's driver — see the note by miniPan.
          useNativeDriver: false,
          tension: 80,
          friction: 12,
        }).start();
      },
    })
  ).current;

  // Shares the PUBLIC url, never the resolved one — `uri` may be a local file
  // on this device, and a file:// path is meaningless to whoever receives it.
  const onShare = useCallback(async () => {
    const url = track?.sourceUrl;
    if (!track || !url) return;
    try {
      await Share.share({ message: `${track.title}
${url}`, url });
    } catch {
      /* dismissed */
    }
  }, [track]);

  const onToggleSave = useCallback(async () => {
    const url = track?.sourceUrl;
    if (!track || !url) return;
    setSaveError(false);
    try {
      if (audio.isSaved(url)) await audio.removeOffline(track);
      else await audio.saveOffline(track);
    } catch (e) {
      console.warn('Offline save failed:', e);
      setSaveError(true);
    }
  }, [track, audio]);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  if (!audio.hasActive || !track) return null;

  // ---- geometry ------------------------------------------------------------
  // Inside (tabs) the bar sits on the tab bar's top edge. On a pushed screen
  // there is no tab bar, so it sits on the safe-area inset instead — docking
  // at a constant tab-bar height there would leave it floating in mid-air.
  const inTabs = segments[0] === '(tabs)';
  const dockBottom = (inTabs ? theme.layout.tabBarHeight : insets.bottom) + MINI_BAR_MARGIN;

  const sheetTranslate = Animated.add(
    t.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
    sheetPan
  );
  // The bar fades out fast and early: by the time the sheet is a third of the
  // way up it should already be gone, or the two read as two things on screen
  // rather than one becoming the other.
  const miniOpacity = t.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' });
  const sheetOpacity = t.interpolate({ inputRange: [0.15, 0.6], outputRange: [0, 1], extrapolate: 'clamp' });

  const heroSize = Math.min(width - theme.layout.screenPadding * 4, 300);
  const remaining = duration > 0 ? duration - position : 0;

  // ---------------------------------------------------------------------------
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* LIGHT STATUS BAR ICONS WHILE THE FULL PLAYER IS UP.
          The expanded sheet fills the screen with a dark gradient (palette →
          navy → black) that runs under the status bar, and the app's default
          dark icons were invisible on it.

          Mounted conditionally rather than styled conditionally, and that is
          the point: React Native keeps a STACK of StatusBar entries and applies
          the last one mounted, so collapsing the player unmounts this and the
          app-wide 'dark' default in app/_layout.tsx takes over again by itself.
          Nothing has to remember to put it back.

          Deliberately NOT ScreenStatusBar: this is an overlay, not a route. It
          has no focus state to key off, and it is already topmost whenever it
          is visible. The MINI BAR gets nothing — it docks above the tab bar,
          nowhere near the status bar, and the screen behind it keeps its own
          style. */}
      {expanded && <StatusBar style="light" animated />}

      {/* ---------------- MINI BAR ---------------- */}
      <Animated.View
        style={[
          miniStyles.mini,
          {
            bottom: dockBottom,
            left: MINI_BAR_MARGIN + theme.layout.screenPadding / 2,
            right: MINI_BAR_MARGIN + theme.layout.screenPadding / 2,
            height: MINI_BAR_HEIGHT,
            opacity: miniOpacity,
            transform: [{ translateX: miniPan }],
          },
        ]}
        // Never intercepts touches while the full player is up, so the sheet
        // above it is fully operable.
        pointerEvents={expanded ? 'none' : 'auto'}
        {...miniResponder.panHandlers}
      >
        <View style={miniStyles.miniInner}>
          {/* The whole bar reopens the player EXCEPT the two controls, which
              stop propagation by being separate pressables on top. */}
          <Pressable
            style={miniStyles.miniTap}
            onPress={audio.expand}
            accessibilityRole="button"
            accessibilityLabel={`Open player, ${track.title}`}
          >
            <AudioArt seed={seed} width={40} height={40} radius={theme.radius.sm} />
            <View style={miniStyles.miniBody}>
              <Text style={miniStyles.miniTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={miniStyles.miniMeta} numberOfLines={1}>
                {[speaker, series].filter(Boolean).join(' · ') || 'Audio'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={audio.togglePlayPause}
            hitSlop={8}
            style={miniStyles.miniPlay}
            accessibilityRole="button"
            accessibilityLabel={audio.playing ? 'Pause' : 'Play'}
          >
            {audio.loading ? (
              <ActivityIndicator size="small" color={theme.colors.pink} />
            ) : (
              <Ionicons
                name={audio.playing ? 'pause' : 'play'}
                size={20}
                color={theme.colors.pink}
                style={audio.playing ? undefined : miniStyles.playNudge}
              />
            )}
          </Pressable>
          <Pressable
            onPress={audio.close}
            hitSlop={8}
            style={miniStyles.miniClose}
            accessibilityRole="button"
            accessibilityLabel="Stop playback"
          >
            <Ionicons name="close" size={18} color={theme.colors.grayIcon} />
          </Pressable>

          {/* A hairline progress line along the bar's bottom edge. The mini bar
              has no room for a scrubber, but "how far in am I" is the one thing
              it can still answer for free. */}
          <View style={miniStyles.miniProgressTrack}>
            <View style={[miniStyles.miniProgressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </Animated.View>

      {/* ---------------- FULL PLAYER ---------------- */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: sheetTranslate }], opacity: sheetOpacity },
        ]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        {/* The ground is the item's own palette, deeply darkened into navy —
            calm enough to sit in front of for 50 minutes, and still visibly
            the colour of the thing you tapped. */}
        <LinearGradient
          colors={[palette.from, theme.colors.navy, theme.colors.black]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.groundScrim]} />

        <ScrollView
          contentContainerStyle={[
            styles.sheet,
            { paddingTop: insets.top + theme.space.tight, paddingBottom: insets.bottom + theme.space.section },
          ]}
          showsVerticalScrollIndicator={false}
          // The sheet is short on most phones; this only matters on small ones
          // where the controls would otherwise be pushed off the bottom.
          bounces={false}
        >
          {/* HEADER + ARTWORK are one GRAB AREA.
              The drag-to-collapse responder lives here rather than on the
              sheet itself, and that placement is load-bearing. React Native
              asks onMoveShouldSetPanResponder from the touched view UPWARD, so
              a responder on the sheet is only offered the gesture after the
              ScrollView wrapping this content has declined it — and a
              ScrollView never declines a vertical drag. Mounted on the region
              you actually grab, it is asked first and wins, which is also the
              affordance every music player already teaches: you pull the
              artwork down, not the controls. */}
          <View {...sheetResponder.panHandlers}>
          <View style={styles.header}>
            <Pressable
              onPress={audio.collapse}
              hitSlop={12}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Minimize player"
            >
              <Ionicons name="chevron-down" size={26} color={theme.colors.white} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel} numberOfLines={1}>
                {audio.queueLabel ?? 'Now Playing'}
              </Text>
            </View>
            <Pressable
              onPress={onShare}
              hitSlop={12}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Share this recording"
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.white} />
            </Pressable>
          </View>

          {/* ARTWORK */}
          <View style={styles.heroWrap}>
            {/* The shadow is on this wrapper, NOT on the artwork. AudioArt
                clips itself with overflow:'hidden' to keep the gradient and
                the wave inside its rounded corners, and on iOS a view with
                overflow:'hidden' casts no shadow at all — the two properties
                cancel. Split across two views, both work. */}
            <View
              style={[
                styles.heroShadow,
                { width: heroSize, height: heroSize, borderRadius: theme.radius.lg },
              ]}
            >
              {/* A series item wears ITS SERIES' COVER, enlarged — the same
                  designed poster the shelf card shows, so the thing you tapped
                  and the thing now filling the screen are visibly one object.
                  A standalone recording has no cover to wear, so it gets its
                  own derived artwork with the brand mark over it. */}
              {series ? (
                <AudioCover
                  title={series}
                  width={heroSize}
                  height={heroSize}
                  radius={theme.radius.lg}
                />
              ) : (
                <AudioArt
                  seed={seed}
                  width={heroSize}
                  height={heroSize}
                  variant="hero"
                  radius={theme.radius.lg}
                />
              )}
            </View>
          </View>
          </View>

          {/* TITLE + METADATA */}
          <View style={styles.meta}>
            {series ? (
              <Text style={styles.seriesLine} numberOfLines={1}>
                {series}
              </Text>
            ) : null}
            <Text style={styles.title} numberOfLines={3}>
              {track.title}
            </Text>
            {/* Speaker and date are separate lines rather than one joined
                string: the speaker is a name and deserves its own weight, and
                either can be absent without leaving a dangling separator.
                BRANCH IS NEVER SHOWN — the audio manifest has no branch field
                and no way to derive one. */}
            {speaker ? <Text style={styles.speaker}>{speaker}</Text> : null}
            {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
          </View>

          {/* PROGRESS */}
          <View style={styles.progressBlock}>
            <View
              style={styles.trackHit}
              onLayout={onTrackLayout}
              {...scrubResponder.panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel="Playback position"
              accessibilityValue={{
                min: 0,
                max: Math.round(duration) || 1,
                now: Math.round(position),
              }}
            >
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
              </View>
              {/* Grows while dragging — the one piece of feedback that tells
                  you the bar has taken your finger, on a control whose whole
                  reported problem was feeling like it had not. */}
              <View
                style={[
                  styles.thumb,
                  isSeeking && styles.thumbSeeking,
                  { left: Math.max(0, progress * trackWidth - (isSeeking ? 10 : 7)) },
                ]}
              />
            </View>
            <View style={styles.times}>
              <Text style={styles.time}>{isLive ? 'LIVE' : formatClock(position)}</Text>
              <Text style={styles.time}>
                {/* Remaining, not total: total never changes and the number
                    people actually want mid-listen is "how much is left".
                    Until the file's header is read there is no duration at
                    all, and a placeholder 0:00 would be a lie — as it would be
                    for a stream, which has no end to count down to. */}
                {isLive ? '' : duration > 0 ? `-${formatClock(remaining)}` : '--:--'}
              </Text>
            </View>
          </View>

          {/* TRANSPORT */}
          <View style={styles.transport}>
            <Pressable
              onPress={audio.previous}
              disabled={!audio.hasPrevious}
              hitSlop={12}
              style={[styles.transportBtn, !audio.hasPrevious && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel="Previous"
            >
              <Ionicons name="play-skip-back" size={26} color={theme.colors.white} />
            </Pressable>

            <PressableScale
              style={styles.playBtn}
              onPress={audio.togglePlayPause}
              accessibilityRole="button"
              accessibilityLabel={audio.playing ? 'Pause' : 'Play'}
            >
              <LinearGradient
                colors={theme.gradient.colors}
                start={theme.gradient.start}
                end={theme.gradient.end}
                style={StyleSheet.absoluteFill}
              />
              {audio.loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Ionicons
                  name={audio.playing ? 'pause' : 'play'}
                  size={30}
                  color={theme.colors.white}
                  style={audio.playing ? undefined : miniStyles.playNudgeLg}
                />
              )}
            </PressableScale>

            <Pressable
              onPress={audio.next}
              disabled={!audio.hasNext}
              hitSlop={12}
              style={[styles.transportBtn, !audio.hasNext && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel="Next"
            >
              <Ionicons name="play-skip-forward" size={26} color={theme.colors.white} />
            </Pressable>
          </View>

          {/* SPEED OPTIONS — revealed by the speed pill below rather than
              always on screen. Five pills permanently visible would make this
              a control panel; the brief asks for the opposite. */}
          {speedOpen && (
            <View style={styles.speedRow}>
              {PLAYBACK_RATES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    audio.setRate(r as PlaybackRate);
                    setSpeedOpen(false);
                  }}
                  style={[styles.speedPill, audio.rate === r && styles.speedPillOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: audio.rate === r }}
                  accessibilityLabel={`${r} times speed`}
                >
                  <Text style={[styles.speedText, audio.rate === r && styles.speedTextOn]}>
                    {r}×
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* SECONDARY CONTROLS */}
          <View style={styles.secondary}>
            <SecondaryAction
              label={`${audio.rate}×`}
              icon="speedometer-outline"
              active={speedOpen || audio.rate !== 1}
              onPress={() => setSpeedOpen((s) => !s)}
            />
            {/* Queue only exists when there is more than one thing in it. A
                "Queue (1)" button is a control that does nothing. */}
            {audio.queue.length > 1 && (
              <SecondaryAction
                label="Queue"
                icon="list-outline"
                active={queueOpen}
                onPress={() => setQueueOpen((q) => !q)}
              />
            )}
            {/* Both of these need a finite file behind a public url, which a
                live stream has not got — hence canSave rather than an
                unconditional button that would fail when tapped. */}
            {canSave && (
              <SecondaryAction
                label={
                  saveError
                    ? 'Failed'
                    : audio.isSaving(track.sourceUrl!)
                    ? 'Saving…'
                    : audio.isSaved(track.sourceUrl!)
                    ? 'Saved'
                    : 'Save'
                }
                icon={
                  saveError
                    ? 'alert-circle-outline'
                    : audio.isSaved(track.sourceUrl!)
                    ? 'checkmark-circle'
                    : 'download-outline'
                }
                active={audio.isSaved(track.sourceUrl!)}
                busy={audio.isSaving(track.sourceUrl!)}
                onPress={onToggleSave}
              />
            )}
            {!!track.sourceUrl && (
              <SecondaryAction label="Share" icon="share-outline" onPress={onShare} />
            )}
          </View>

          {/* QUEUE */}
          {queueOpen && audio.queue.length > 1 && (
            <View style={styles.queue}>
              <Text style={styles.queueHead}>
                {audio.queueLabel ?? 'Up next'} · {audio.queue.length} recordings
              </Text>
              {audio.queue.map((q, i) => {
                const current = q.id === track.id;
                return (
                  <Pressable
                    key={q.id}
                    // toggle, not play: tapping the row that is already
                    // playing should pause it, not silently do nothing.
                    onPress={() => audio.toggle(q, { items: audio.queue, label: audio.queueLabel })}
                    style={[styles.queueRow, current && styles.queueRowOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: current }}
                    accessibilityLabel={`${q.title}${current ? ', now playing' : ''}`}
                  >
                    <View style={styles.queueIndex}>
                      {current ? (
                        <PlayingBars animating={audio.playing} color={theme.colors.pink} size={12} />
                      ) : (
                        <Text style={styles.queueNum}>{i + 1}</Text>
                      )}
                    </View>
                    <Text
                      style={[styles.queueTitle, current && styles.queueTitleOn]}
                      numberOfLines={1}
                    >
                      {q.title}
                    </Text>
                    <Text style={styles.queueDate}>{formatAudioDate(q.date) ?? ''}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------

const SecondaryAction = ({
  label,
  icon,
  active,
  busy,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  busy?: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    disabled={busy}
    hitSlop={8}
    style={styles.secondaryBtn}
    accessibilityRole="button"
    accessibilityState={{ selected: !!active, busy: !!busy }}
    accessibilityLabel={label}
  >
    {busy ? (
      <ActivityIndicator size="small" color={theme.colors.white} />
    ) : (
      <Ionicons name={icon} size={19} color={active ? theme.colors.pink : 'rgba(255,255,255,0.8)'} />
    )}
    <Text style={[styles.secondaryLabel, active && styles.secondaryLabelOn]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

// THE MINI BAR IS THEMED; THE FULL PLAYER IS NOT, AND THAT IS THE POINT.
//
// These two surfaces have opposite requirements, which is why they are two
// sheets rather than one:
//
//   THE MINI BAR floats over whatever screen you are on. It is a card in the
//   app's own chrome — white with navy type in light mode — so in dark mode it
//   has to become a dark card with light type, or it is a white slab hovering
//   over a dark app: the single most visible seam dark mode can have.
//
//   THE FULL PLAYER is dark in BOTH appearances, deliberately, the same way
//   the video viewport is black in both. It draws white type on a
//   palette-derived gradient that ends in navy and black. Running those
//   through the palette would be actively wrong: `navy` maps to the PRIMARY
//   TEXT role, so in dark mode `theme.colors.navy` is #E8EDF3, and the
//   gradient's dark end would turn light. Its colours stay literal.
const useMiniStyles = makeThemedStyles((c) => ({
  // ---- mini bar ----
  // OUTER: the lift only. No overflow:'hidden' here — on iOS that property
  // cancels a shadow entirely, and this bar floats over scrolling content, so
  // a flat one would read as part of whatever page is behind it. The clipping
  // it needs (for the progress hairline's corners) is on miniInner.
  mini: {
    position: 'absolute',
    borderRadius: theme.radius.md,
    backgroundColor: c.surface,
    // c.shadow, never a text token: textPrimary is near-white in dark, so
    // the mini bar was casting a white halo onto the screen behind it.
    shadowColor: c.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  // INNER: the surface, the border and the clip.
  miniInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    overflow: 'hidden',
  },
  miniTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  miniBody: {
    flex: 1,
    gap: 1,
  },
  miniTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.textPrimary,
  },
  miniMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: 11,
    color: c.textSecondary,
  },
  miniPlay: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniClose: {
    width: 26,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniProgressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: c.border,
  },
  miniProgressFill: {
    height: 2,
    backgroundColor: c.accent,
  },
  playNudge: {
    marginLeft: 2,
  },
  playNudgeLg: {
    marginLeft: 4,
  },
}));

const styles = StyleSheet.create({
  // ---- full player ----
  groundScrim: {
    // Knocks the palette back so white type sits on it comfortably at every
    // one of the six palettes, including the two lightest.
    backgroundColor: 'rgba(10,22,33,0.34)',
  },
  sheet: {
    paddingHorizontal: theme.layout.screenPadding + theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  headerLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  heroWrap: {
    alignItems: 'center',
    // Generous, deliberately: this is the breath between the chrome and the
    // thing itself, and it is most of what makes the screen feel unhurried.
    marginTop: theme.space.section,
    marginBottom: theme.space.major,
  },
  heroShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  meta: {
    gap: theme.space.micro,
  },
  seriesLine: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: theme.colors.pink,
    marginBottom: theme.space.micro,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: theme.editorial.trackTight,
    color: theme.colors.white,
  },
  speaker: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: 'rgba(255,255,255,0.86)',
    marginTop: theme.space.micro,
  },
  date: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.55)',
  },

  progressBlock: {
    marginTop: theme.space.section,
  },
  // A 28pt tall hit area around a 4pt track: the visible bar is thin because
  // it is calm, and the target is 28 because a 4pt one is unusable.
  trackHit: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  trackFill: {
    height: 4,
    backgroundColor: theme.colors.white,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
  },
  thumbSeeking: {
    width: 20,
    height: 20,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.space.micro,
  },
  time: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.6)',
    // Tabular-ish stability: without this the whole label shifts every second
    // as digit widths change, which is very visible next to a still page.
    fontVariant: ['tabular-nums'],
  },

  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.major,
    marginTop: theme.space.section,
  },
  transportBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.space.tight,
    marginTop: theme.space.section,
  },
  speedPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  speedPillOn: {
    backgroundColor: theme.colors.pink,
  },
  speedText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.85)',
  },
  speedTextOn: {
    color: theme.colors.white,
  },

  secondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: theme.space.section,
  },
  secondaryBtn: {
    alignItems: 'center',
    gap: theme.space.micro,
    minWidth: 62,
    paddingVertical: theme.spacing.sm,
  },
  secondaryLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
  },
  secondaryLabelOn: {
    color: theme.colors.pink,
  },

  queue: {
    marginTop: theme.space.section,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: theme.space.related,
    gap: theme.space.micro,
  },
  queueHead: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: theme.space.tight,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  queueRowOn: {
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  queueIndex: {
    width: 20,
    alignItems: 'center',
  },
  queueNum: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.45)',
  },
  queueTitle: {
    flex: 1,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.86)',
  },
  queueTitleOn: {
    fontFamily: theme.fontFamily.bodySemibold,
    color: theme.colors.white,
  },
  queueDate: {
    fontFamily: theme.fontFamily.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
});
