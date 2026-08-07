// components/player/PlayerHost.tsx
// The one and only mounted player, rendered once at the root so playback
// survives navigation. It morphs between two surfaces:
//   - EXPANDED: full-screen — header, video, scrollable content beneath.
//   - COLLAPSED: a small FLOATING VIDEO WINDOW near the bottom (YouTube's
//     mobile pattern) — just the video, freely draggable, tap to restore,
//     a small close button. NOT a bar with text and controls.
// The YouTube WebView is mounted exactly once and never moves in the tree,
// so collapse/expand only resizes and repositions the same live player —
// playback never restarts, and the collapsed window shows the real, still-
// playing video.
//
// Motion: one Animated value `t` (0 = collapsed, 1 = expanded) drives the
// whole morph — the video's position and size, the header, and the details
// fade — so every part stays in sync. A separate 2-axis `pan` value lets
// the collapsed window be dragged around and flung to dismiss.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  useWindowDimensions,
  BackHandler,
  PanResponder,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { usePlayback } from '../../providers/PlaybackProvider';
import { useMessages } from '../../hooks/useMessages';
import { buildRelatedSections } from '../../utils/relatedContent';
import { primaryVariant, hasAudio, hasVideo, Message } from '../../data/contentModel';
import { getPosition, savePosition } from '../../utils/playbackProgress';
import { shortDate } from '../../utils/collections';
import { FadeInUp, PressableScale, staggerDelay } from '../ui/motion';
import { SmartImage } from '../ui/SmartImage';

const SAVE_INTERVAL_MS = 5000;
const TAB_BAR_HEIGHT = 84;

// Collapsed floating-window size. ~46% of screen width, 16:9 — big enough
// to actually watch, small enough to leave the app usable behind it.
const MINI_MARGIN = 12;

export function PlayerHost() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeMessage, mode, expanded, hasActive, play, setMode, expand, collapse, close } =
    usePlayback();
  const { messages } = useMessages();

  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef = useRef(false);

  // ---- Load reliability for the YouTube WebView ----
  // The real failure was NOT YouTube blocking us. By default
  // react-native-youtube-iframe does not render its own HTML — it points the
  // WebView at a page hosted on a third-party GitHub Pages site
  // (lonelycpp.github.io/.../iframe_v2.html, see DEFAULT_BASE_URL in the
  // package) and passes the player config as a query string. So every single
  // playback depended on a host that has nothing to do with YouTube or us
  // being reachable, and when it wasn't the WebView painted its own error
  // page: "net::ERR_CONNECTION_REFUSED", error code -6.
  //
  // `useLocalHTML` makes the library inline that same player HTML instead, so
  // the only network dependency left is YouTube's own iframe API. Paired with
  // `baseUrlOverride`, which is what the library uses as the document's
  // baseUrl in local mode — without it the page would be served from
  // about:blank and YouTube rejects embeds with a null origin.
  //
  // Two guards remain behind that:
  //   1. ARM: hold the player back one short beat after a message is set, so
  //      the WebView attaches to a hierarchy that has stopped moving.
  //   2. REMOUNT: if it still errors, bump `playerKey` once per message after
  //      a longer pause — the automatic version of the leave-and-come-back
  //      that used to be the only way out.
  const [playerKey, setPlayerKey] = useState(0);
  const [webViewArmed, setWebViewArmed] = useState(false);
  const recoveredRef = useRef(false);

  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; }, [close]);
  const expandRef = useRef(expand);
  useEffect(() => { expandRef.current = expand; }, [expand]);

  const message = activeMessage;
  const variant = message ? primaryVariant(message) : undefined;
  const videoId = message?.videoId || '';
  const durationSeconds = variant?.durationSeconds ?? 0;
  const canPlayVideo = !!message && hasVideo(message) && !!videoId && !videoId.startsWith('REPLACE_ME');
  const isAudioMode = !!message && mode === 'audio' && hasAudio(message);

  // ---- Geometry ----
  const fullVideoHeight = (width * 9) / 16;
  const headerHeight = insets.top + 36;
  const miniW = Math.round(width * 0.56);
  const miniH = Math.round((miniW * 9) / 16);
  // Resting position of the collapsed window: bottom-left, above the tab bar.
  const miniRestX = MINI_MARGIN;
  const miniRestY = height - TAB_BAR_HEIGHT - miniH - MINI_MARGIN;

  // t: 0 collapsed → 1 expanded — the morph driver.
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration: 340,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, t]);

  // pan: the collapsed window's free-drag offset from its resting spot.
  // Reset to 0 whenever we expand (so it returns home next collapse).
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (expanded) {
      pan.setValue({ x: 0, y: 0 });
      panOffset.current = { x: 0, y: 0 };
    }
  }, [expanded, pan]);

  const dragBounds = useRef({ maxX: 0, maxY: 0 });
  dragBounds.current = {
    maxX: width - miniW - MINI_MARGIN * 2,
    maxY: 0,
  };

  const panResponder = useRef(
    PanResponder.create({
      // Lower threshold (3px) so tracking latches almost immediately — the
      // earlier 6px dead zone was part of what felt stiff.
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset(panOffset.current);
        pan.setValue({ x: 0, y: 0 });
      },
      // JS driver: the window it's attached to animates layout props (its
      // size) on the JS driver during expand/collapse, so the drag must
      // match to share the same view. The fluid feel comes from the natural
      // spring physics on release (below) and the low latch threshold, not
      // from the driver.
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, g) => {
        pan.flattenOffset();
        // Fast horizontal fling, or dragged well off either edge → dismiss.
        if (Math.abs(g.vx) > 0.8 || Math.abs(g.dx) > width * 0.35) {
          Animated.timing(pan, {
            toValue: { x: g.dx > 0 ? width : -width, y: panOffset.current.y + g.dy },
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => closeRef.current());
          return;
        }
        // Otherwise glide to a settle. A natural low-tension/high-friction
        // spring carries the release velocity so it eases in rather than
        // snapping — the "smooth momentum" that makes it feel effortless.
        const nx = clamp(panOffset.current.x + g.dx, -miniRestX, dragBounds.current.maxX);
        const ny = clamp(panOffset.current.y + g.dy, -(miniRestY - insets.top - 8), TAB_BAR_HEIGHT + miniH);
        panOffset.current = { x: nx, y: ny };
        Animated.spring(pan, {
          toValue: { x: nx, y: ny },
          useNativeDriver: false,
          tension: 60,
          friction: 12,
          velocity: Math.max(Math.abs(g.vx), Math.abs(g.vy)),
        }).start();
      },
    })
  ).current;

  useEffect(() => { if (!message) return; restoredRef.current = false; recoveredRef.current = false; setReady(false); setEnded(false); setPlaying(true); }, [message?.id]);

  // Arms the WebView a beat after the message changes, and re-arms after a
  // recovery remount (playerKey bump) so the new instance also gets a
  // settled tree rather than being swapped in mid-teardown.
  useEffect(() => {
    if (!message) { setWebViewArmed(false); return; }
    setWebViewArmed(false);
    // A retry waits longer than a first load: whatever made the first attempt
    // fail (a half-open socket, a WebView still tearing down) needs more than
    // a frame to clear, and an instant retry mostly just fails twice.
    const t = setTimeout(() => setWebViewArmed(true), recoveredRef.current ? 450 : 120);
    return () => clearTimeout(t);
  }, [message?.id, playerKey]);

  const onPlayerError = useCallback((err: string) => {
    // Dev-only, and never a warn: the library forwards an undefined payload
    // for most failures, so this was logging "undefined" into the user's
    // console twice per recovery while telling nobody anything.
    if (__DEV__) console.log('[player] recovering from YouTube error:', err);
    // One automatic retry per message. A second failure is a real problem
    // (video removed, embedding disabled) and looping the remount would
    // just hide it behind an endless reload.
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    restoredRef.current = false; // let the fresh instance restore position
    setReady(false);
    setPlayerKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { collapse(); return true; });
    return () => sub.remove();
  }, [expanded, collapse]);

  const onReady = useCallback(async () => {
    setReady(true);
    if (restoredRef.current || !message) return;
    restoredRef.current = true;
    const saved = await getPosition(message.id);
    if (saved && saved.positionSeconds > 5 && playerRef.current) {
      playerRef.current.seekTo(Math.max(0, saved.positionSeconds - 3), true);
    }
  }, [message?.id]);

  useEffect(() => {
    if (!message || mode !== 'video') return;
    const persist = async () => {
      if (!playerRef.current || !ready) return;
      try {
        const current = await playerRef.current.getCurrentTime();
        if (typeof current === 'number' && current > 0) savePosition(message.id, current, durationSeconds);
      } catch { /* ignore teardown races */ }
    };
    if (playing) saveTimer.current = setInterval(persist, SAVE_INTERVAL_MS);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); persist(); };
  }, [playing, ready, message?.id, durationSeconds, mode]);

  const onChangeState = useCallback((state: string) => {
    if (state === 'ended') { setEnded(true); setPlaying(false); }
    else if (state === 'playing') { setEnded(false); setPlaying(true); }
    else if (state === 'paused') setPlaying(false);
  }, []);

  const onShare = useCallback(async () => {
    if (!message) return;
    const url = message.videoId && !message.videoId.startsWith('REPLACE_ME') ? `https://youtu.be/${message.videoId}` : undefined;
    try { await Share.share({ message: url ? `${message.title}\n${url}` : message.title, ...(url ? { url } : {}) }); }
    catch { /* dismissed */ }
  }, [message?.id]);

  // Opening the series collapses the player first. This host renders ABOVE
  // the whole app, so pushing a route while expanded would navigate behind a
  // full-screen player and look like the tap did nothing — the mini window
  // keeps playback alive while the collection comes forward.
  const openSeries = useCallback((series: string) => {
    collapse();
    router.push({ pathname: '/see-all', params: { filter: series, title: series } });
  }, [collapse, router]);

  const relatedSections = useMemo(() => (message ? buildRelatedSections(message, messages) : []), [message?.id, messages]);
  const upNext = relatedSections[0]?.items[0] ?? null;

  if (!hasActive || !message) return null;

  // ---- Morph interpolations ----
  // The video box goes from the floating mini rect (collapsed) to the full-
  // width 16:9 below the header (expanded). Position is driven by t AND, when
  // collapsed, offset by the free-drag pan value.
  const videoLeft = t.interpolate({ inputRange: [0, 1], outputRange: [miniRestX, 0] });
  const videoTop = t.interpolate({ inputRange: [0, 1], outputRange: [miniRestY, headerHeight] });
  const videoW = t.interpolate({ inputRange: [0, 1], outputRange: [miniW, width] });
  const videoH = t.interpolate({ inputRange: [0, 1], outputRange: [miniH, fullVideoHeight] });
  // The YouTube surface is always laid out at full width (that's the only
  // width the iframe renders crisply at), so to make it FIT the smaller
  // collapsed window we scale it down uniformly rather than clip it — the
  // bug before was a full-size frame clipped to a small box, showing only a
  // corner. Both mini and full are 16:9, so a single uniform scale
  // (miniW/width → 1) shows the whole frame at every size. transformOrigin
  // is top-left (default for RN scale is center, so we translate to keep the
  // scaled top-left pinned to the window's top-left).
  const videoScale = t.interpolate({ inputRange: [0, 1], outputRange: [miniW / width, 1] });
  const videoScaleTX = t.interpolate({ inputRange: [0, 1], outputRange: [-(width - miniW) / 2, 0] });
  const videoScaleTY = t.interpolate({ inputRange: [0, 1], outputRange: [-(fullVideoHeight - miniH) / 2, 0] });
  const videoRadius = t.interpolate({ inputRange: [0, 1], outputRange: [theme.radius.md, 0] });
  // Drag only applies while collapsed; scale it out as we expand so a stray
  // offset can't shove the expanded video off-screen.
  const dragFactor = t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const panX = Animated.multiply(pan.x, dragFactor);
  const panY = Animated.multiply(pan.y, dragFactor);

  const detailsOpacity = t.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const headerOpacity = detailsOpacity;
  const miniChromeOpacity = t.interpolate({ inputRange: [0, 0.25], outputRange: [1, 0], extrapolate: 'clamp' });
  // Dim/hide the full black backdrop when collapsed so only the floating
  // window shows (no full-screen black behind the app).
  const backdropOpacity = t.interpolate({ inputRange: [0, 0.02, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });

  const videoElement = (
    <View style={{ width, height: fullVideoHeight }}>
      {isAudioMode ? (
        <View style={styles.audioStage}><Ionicons name="headset" size={expanded ? 48 : 20} color={theme.colors.white} /></View>
      ) : canPlayVideo ? (
        webViewArmed ? (
          <YoutubePlayer
            // videoId + recovery counter: changing either is a deliberate
            // full remount of the WebView, which is the only reliable way
            // to clear YouTube's blocked-response page.
            key={`${videoId}:${playerKey}`}
            ref={playerRef}
            height={fullVideoHeight}
            width={width}
            play={playing}
            videoId={videoId}
            onReady={onReady}
            onError={onPlayerError}
            onChangeState={onChangeState}
            // controls:true is deliberate and stays — YouTube's own transport
            // (scrubber, play/pause, fullscreen) is the playback surface. Only
            // the shell around it is ours.
            initialPlayerParams={{ controls: true, modestbranding: true, rel: false }}
            // Inline the player HTML instead of fetching it from the
            // package's GitHub Pages host — see the note by `playerKey`.
            useLocalHTML
            // Doubles as the document baseUrl in local mode, i.e. the origin
            // the embed reports to YouTube. It must be a real https origin
            // that is NOT youtube.com: the library's script never sets an
            // explicit `origin` player var, so the IFrame API derives it from
            // window.location, and an embed claiming to be hosted ON
            // youtube.com is rejected as an invalid embed context — which is
            // what produced "This video is unavailable, error 152" even though
            // the Data API reports these videos as embeddable:true. The
            // church's own domain is the honest origin to present; nothing is
            // ever fetched from it, the HTML is local.
            baseUrlOverride="https://theolivebrookchurch.org"
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              // Hardware layer: without it the WebView can compose badly
              // against the animated (JS-driven) container it lives in during
              // the expand/collapse morph.
              androidLayerType: 'hardware',
              // Nothing in the embed should ever spawn a second window; left
              // on, a stray target=_blank can hand the surface to a blank
              // popup that looks exactly like a load failure.
              setSupportMultipleWindows: false,
            }}
          />
        ) : (
          <View style={styles.loadingStage}>
            <ActivityIndicator color={theme.colors.white} />
          </View>
        )
      ) : (
        <View style={styles.unavailableStage}>
          <Ionicons name="videocam-off-outline" size={expanded ? 36 : 18} color={theme.colors.grayIcon} />
          {expanded && <Text style={styles.unavailableText}>Video not available for this item yet.</Text>}
        </View>
      )}
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Full black backdrop — only visible when expanded, tap-through when
          collapsed so the app stays usable behind the floating window. */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={expanded ? 'auto' : 'none'}
      />

      {/* EXPANDED header. */}
      <Animated.View
        style={[styles.header, { opacity: headerOpacity, paddingTop: insets.top, height: headerHeight }]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <Pressable onPress={collapse} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Minimize player">
          <Ionicons name="chevron-down" size={26} color={theme.colors.white} />
        </Pressable>
        {/* Centre label sits in its own flexed box so it stays optically
            centred regardless of the two icon buttons' widths — the previous
            flex:1 Text was centred against the row, not the screen. */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel} numberOfLines={1}>
            {message.series ? message.series : message.type === 'service' ? 'Service' : 'Now Playing'}
          </Text>
        </View>
        <Pressable onPress={onShare} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Share this message">
          <Ionicons name="share-outline" size={20} color={theme.colors.white} />
        </Pressable>
      </Animated.View>

      {/* EXPANDED details beneath the video. */}
      <Animated.View
        style={[styles.detailsWrap, { top: headerHeight + fullVideoHeight, bottom: 0, opacity: detailsOpacity }]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <ScrollView contentContainerStyle={[styles.detailsContent, { paddingBottom: insets.bottom + theme.spacing.xxxl }]} showsVerticalScrollIndicator={false}>
          {/* MASTHEAD — the title block. An eyebrow above the title gives the
              page a top edge to start from instead of opening cold on a
              wrapped sentence, and it's where the message's kind lives so the
              title doesn't have to carry it. */}
          <FadeInUp>
            <Text style={styles.eyebrow}>
              {message.type === 'service' ? 'SERVICE' : message.series ? 'FROM THE SERIES' : 'MESSAGE'}
            </Text>
            <Text style={styles.title}>{message.title}</Text>
            <View style={styles.metaChips}>
              <MetaChip icon="person-circle-outline" label={message.speaker} />
              <MetaChip icon="calendar-outline" label={shortDate(message.publishedAt)} />
              {message.duration ? <MetaChip icon="time-outline" label={message.duration} /> : null}
            </View>
          </FadeInUp>

          {/* ACTIONS — Share is the only one that does anything today, so it
              is the only one styled as live. Save and Download stay present
              and clearly secondary rather than being hidden: removing them
              would make the row look sparse, and greying them the same as a
              broken control would make them look failed. */}
          <FadeInUp delay={40}>
            <View style={styles.actionsRow}>
              <ActionButton icon="share-outline" label="Share" onPress={onShare} primary />
              <ActionButton icon="bookmark-outline" label="Save" onPress={() => {}} disabled />
              <ActionButton icon="download-outline" label="Download" onPress={() => {}} disabled />
            </View>
          </FadeInUp>

          {hasAudio(message) && hasVideo(message) && (
            <FadeInUp delay={80}>
              <View style={styles.modeRow}>
                <ModeChip label="Video" icon="videocam" active={mode === 'video'} onPress={() => setMode('video')} />
                <ModeChip label="Audio" icon="headset" active={mode === 'audio'} onPress={() => setMode('audio')} />
              </View>
            </FadeInUp>
          )}

          {message.series && (
            <FadeInUp delay={80}>
              <PressableScale
                style={styles.seriesCard}
                onPress={() => openSeries(message.series!)}
                accessibilityRole="button"
                accessibilityLabel={`See all of the series ${message.series}`}
              >
                <View style={styles.seriesIcon}>
                  <Ionicons name="albums" size={17} color={theme.colors.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.seriesCardLabel}>PART OF A SERIES</Text>
                  <Text style={styles.seriesCardName} numberOfLines={1}>{message.series}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
              </PressableScale>
            </FadeInUp>
          )}

          {ended && upNext && (
            <FadeInUp style={styles.upNext}>
              <Text style={styles.upNextLabel}>UP NEXT</Text>
              <RelatedRow message={upNext} onPress={() => play(upNext)} />
            </FadeInUp>
          )}

          {relatedSections.map((section) => (
            <View key={section.key} style={styles.relatedSection}>
              {/* A hairline above each section title does the work a big
                  margin was doing before, at a fraction of the vertical
                  budget — the list stays close to what it belongs to. */}
              <View style={styles.rule} />
              <Text style={styles.relatedTitle}>{section.title}</Text>
              {section.items.map((m, i) => (
                <FadeInUp key={m.id} delay={staggerDelay(i)}>
                  <RelatedRow message={m} onPress={() => play(m)} />
                </FadeInUp>
              ))}
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* THE SHARED VIDEO WINDOW. Absolutely positioned; morphs between the
          floating mini rect and the full-width expanded video. When
          collapsed it also carries the free-drag pan offset, a tap-to-expand
          layer, and a small close button. */}
      <Animated.View
        style={[
          styles.videoWindow,
          {
            left: videoLeft,
            top: videoTop,
            width: videoW,
            height: videoH,
            borderRadius: videoRadius,
            transform: [{ translateX: panX }, { translateY: panY }],
          },
          !expanded && styles.videoWindowFloating,
        ]}
        pointerEvents="box-none"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        {...(!expanded ? panResponder.panHandlers : {})}
      >
        <Animated.View
          style={{
            width,
            height: fullVideoHeight,
            transform: [
              { translateX: videoScaleTX },
              { translateY: videoScaleTY },
              { scale: videoScale },
            ],
          }}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          {videoElement}
        </Animated.View>

        {/* Collapsed-only chrome: a tap layer to expand + a close button.
            Fades out as the window grows so it never lingers over the
            expanded video. When expanded, pointerEvents none so the real
            YouTube controls are usable. */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: miniChromeOpacity }]}
          pointerEvents={expanded ? 'none' : 'box-none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => expandRef.current()} accessibilityRole="button" accessibilityLabel={`Expand player: ${message.title}`} />
          <Pressable onPress={close} hitSlop={8} style={styles.miniClose} accessibilityRole="button" accessibilityLabel="Close player">
            <Ionicons name="close" size={16} color={theme.colors.white} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={theme.colors.graySecondary} />
      <Text style={styles.metaChipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Three states in one control so the row stays visually even: `primary` is
// the live action (filled), plain is available-but-secondary, `disabled` is
// present-but-not-yet. Crucially the disabled pair keeps the same size and
// shape as the live one — only their fill and content colour drop back — so
// the row reads as one designed group rather than one button plus two
// failures.
function ActionButton({ icon, label, onPress, disabled, primary }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const tint = disabled ? theme.colors.grayIcon : primary ? theme.colors.white : theme.colors.navy;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      // containerStyle carries the flex. `style` lands on the inner animated
      // view, so a flex:1 there never reached the element the row measures —
      // every button collapsed to hug its icon and the labels spilled out
      // past the pill. This is the row's actual layout owner.
      containerStyle={styles.actionSlot}
      style={[styles.actionBtn, primary && styles.actionBtnPrimary, disabled && styles.actionBtnDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={disabled ? 'Coming soon' : undefined}
    >
      <Ionicons name={icon} size={20} color={tint} />
      {/* One line, always. "Download" is the widest label and the one that
          was wrapping out of its box. */}
      <Text style={[styles.actionLabel, { color: tint }]} numberOfLines={1}>{label}</Text>
    </PressableScale>
  );
}

function ModeChip({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeChip, active && styles.modeChipActive]} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label}>
      <Ionicons name={icon} size={15} color={active ? theme.colors.white : theme.colors.slate} />
      <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RelatedRow({ message, onPress }: { message: Message; onPress: () => void }) {
  return (
    <PressableScale style={styles.relatedRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Play ${message.title}, ${message.duration}`}>
      <View style={styles.relatedThumb}>
        <SmartImage uri={message.thumbnail} style={StyleSheet.absoluteFill} />
        {/* Duration on the artwork, the way every video product does it —
            it frees the meta line below to carry speaker and date instead of
            spending its width restating the length. */}
        {message.duration ? (
          <View style={styles.relatedDuration}>
            <Text style={styles.relatedDurationText}>{message.duration}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.relatedRowTitle} numberOfLines={2}>{message.title}</Text>
        <Text style={styles.relatedRowMeta} numberOfLines={1}>
          {message.speaker} · {shortDate(message.publishedAt)}
        </Text>
      </View>
    </PressableScale>
  );
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.colors.black, zIndex: 90 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.black, zIndex: 95,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.sm },
  headerLabel: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  // Rounded top edge over the black backdrop: the detail sheet reads as a
  // surface the video sits on top of, rather than the page simply changing
  // colour at the video's bottom edge.
  detailsWrap: {
    position: 'absolute', left: 0, right: 0, backgroundColor: theme.colors.bg, zIndex: 92,
    borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, overflow: 'hidden',
  },
  detailsContent: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xxl },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold, fontSize: 10, letterSpacing: 1.2,
    color: theme.colors.pink, marginBottom: 6,
  },
  title: { fontFamily: theme.fontFamily.display, fontSize: 22, color: theme.colors.navy, marginBottom: theme.spacing.lg, lineHeight: 29 },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.grayBorder, borderRadius: theme.radius.full, paddingHorizontal: theme.spacing.md, minHeight: 30, maxWidth: '100%' },
  metaChipText: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.caption, color: theme.colors.graySecondary, flexShrink: 1, includeFontPadding: false },
  actionsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  // The row's layout unit — one equal share each, on the Pressable itself.
  actionSlot: { flex: 1 },
  actionBtn: {
    width: '100%', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 64, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.xs,
    borderWidth: 1, borderColor: theme.colors.grayBorder, backgroundColor: theme.colors.surface,
  },
  actionBtnPrimary: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  // Softer than the live buttons but still a real surface — a flat opacity
  // drop on the whole control is what made these read as broken before.
  actionBtnDisabled: { backgroundColor: theme.colors.bg, borderColor: theme.colors.grayBorder },
  actionLabel: { fontFamily: theme.fontFamily.bodySemibold, fontSize: 11, letterSpacing: 0.1, includeFontPadding: false },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.grayBorder, marginBottom: theme.spacing.lg },
  audioStage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navy },
  unavailableStage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xl, backgroundColor: theme.colors.black },
  loadingStage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.black },
  unavailableText: { fontFamily: theme.fontFamily.body, color: theme.colors.grayIcon, textAlign: 'center', fontSize: theme.fontSize.body },
  modeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.lg, minHeight: 40, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.grayBorder, backgroundColor: theme.colors.surface },
  modeChipActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  modeChipText: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.caption, color: theme.colors.slate },
  modeChipTextActive: { color: theme.colors.white },
  seriesCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xl, padding: theme.spacing.lg, backgroundColor: '#FDF2F7', borderRadius: theme.radius.md, borderWidth: 1, borderColor: '#F8D6E6' },
  seriesIcon: {
    width: 36, height: 36, borderRadius: theme.radius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white,
  },
  seriesCardLabel: { fontFamily: theme.fontFamily.bodyBold, fontSize: 10, letterSpacing: 0.9, color: theme.colors.pink },
  seriesCardName: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.bodyLg, color: theme.colors.navy, marginTop: 3 },
  upNext: { marginTop: theme.spacing.xxl, padding: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.grayBorder },
  upNextLabel: { fontFamily: theme.fontFamily.bodyBold, fontSize: 10, color: theme.colors.pink, letterSpacing: 1.2, marginBottom: theme.spacing.md },
  relatedSection: { marginTop: theme.spacing.xxl, gap: theme.spacing.lg },
  relatedTitle: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sectionHeading, color: theme.colors.navy, marginBottom: theme.spacing.xs },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  relatedThumb: { width: 132, height: 74, borderRadius: theme.radius.sm, overflow: 'hidden', backgroundColor: theme.colors.grayBorder },
  relatedDuration: {
    position: 'absolute', right: 5, bottom: 5,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: 'rgba(10,22,33,0.82)',
  },
  relatedDurationText: { fontFamily: theme.fontFamily.bodySemibold, fontSize: 10, color: theme.colors.white, includeFontPadding: false },
  relatedRowTitle: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.bodyLg, color: theme.colors.navy, lineHeight: 19 },
  relatedRowMeta: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.caption, color: theme.colors.graySecondary, marginTop: 3 },
  videoWindow: { position: 'absolute', backgroundColor: theme.colors.black, overflow: 'hidden', zIndex: 100 },
  videoWindowFloating: {
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  miniClose: { position: 'absolute', top: 5, right: 5, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(10,22,33,0.6)', alignItems: 'center', justifyContent: 'center' },
});
