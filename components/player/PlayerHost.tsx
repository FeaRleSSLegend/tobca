// components/player/PlayerHost.tsx
// The one and only mounted player, rendered once at the root so playback
// survives navigation. It animates between two surfaces:
//   - EXPANDED: full-screen, with video on top and related content below.
//   - COLLAPSED: a slim mini-bar docked above the tab bar that keeps
//     playing while the user browses (YouTube-style).
// The YouTube WebView itself is mounted exactly once and never moves in the
// tree, so collapsing/expanding never restarts playback — it just resizes
// and repositions the same live player.
//
// Motion: a single Animated value `t` (0 = collapsed, 1 = expanded) drives
// every transition — the sheet's vertical position, the video's size, the
// fade of the full-screen details, and the fade of the mini-bar. One value,
// so the whole morph stays perfectly in sync and runs on the native driver.

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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const MINI_HEIGHT = 64;
const TAB_BAR_HEIGHT = 84; // mini-bar docks just above the tab bar

export function PlayerHost() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { activeMessage, mode, expanded, hasActive, play, setMode, expand, collapse, close } =
    usePlayback();
  const { messages } = useMessages();

  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef = useRef(false);

  const message = activeMessage;
  const variant = message ? primaryVariant(message) : undefined;
  const videoId = message?.videoId || '';
  const durationSeconds = variant?.durationSeconds ?? 0;
  const canPlayVideo = !!message && hasVideo(message) && !!videoId && !videoId.startsWith('REPLACE_ME');
  const isAudioMode = !!message && mode === 'audio' && hasAudio(message);

  // t: 0 collapsed → 1 expanded. The single driver for the whole morph.
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      // Layout props (height/top) can't use the native driver, and this
      // animation drives size/position, so it runs on the JS driver. It's a
      // single short transform on a small tree, so it stays smooth.
      useNativeDriver: false,
    }).start();
  }, [expanded, t]);

  // Reset per-message playback flags when the message changes.
  useEffect(() => {
    if (!message) return;
    restoredRef.current = false;
    setReady(false);
    setEnded(false);
    setPlaying(true);
  }, [message?.id]);

  // Hardware back (Android): collapse the expanded player instead of
  // leaving the screen, matching the mini-player affordance.
  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      collapse();
      return true;
    });
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
        if (typeof current === 'number' && current > 0) {
          savePosition(message.id, current, durationSeconds);
        }
      } catch {
        // ignore teardown races
      }
    };
    if (playing) saveTimer.current = setInterval(persist, SAVE_INTERVAL_MS);
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
      persist();
    };
  }, [playing, ready, message?.id, durationSeconds, mode]);

  const onChangeState = useCallback((state: string) => {
    if (state === 'ended') {
      setEnded(true);
      setPlaying(false);
    } else if (state === 'playing') {
      setEnded(false);
      setPlaying(true);
    } else if (state === 'paused') {
      setPlaying(false);
    }
  }, []);

  const relatedSections = useMemo(
    () => (message ? buildRelatedSections(message, messages) : []),
    [message?.id, messages]
  );
  const upNext = relatedSections[0]?.items[0] ?? null;

  if (!hasActive || !message) return null;

  // ---- Interpolations from the single driver ----
  const fullVideoHeight = (width * 9) / 16;
  const miniVideoWidth = 104;

  // The sheet fills the screen when expanded, shrinks to the mini-bar when
  // collapsed. Animating top + height (JS driver) so the whole player slab
  // physically resizes.
  const sheetTop = t.interpolate({
    inputRange: [0, 1],
    outputRange: [height - TAB_BAR_HEIGHT - MINI_HEIGHT, 0],
  });
  const sheetHeight = t.interpolate({
    inputRange: [0, 1],
    outputRange: [MINI_HEIGHT, height],
  });
  const videoWidth = t.interpolate({ inputRange: [0, 1], outputRange: [miniVideoWidth, width] });
  const videoHeight = t.interpolate({ inputRange: [0, 1], outputRange: [MINI_HEIGHT, fullVideoHeight] });
  const detailsOpacity = t.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const miniOpacity = t.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerOpacity = detailsOpacity;

  // The live YouTube surface. Rendered ONCE here and shared by both layouts
  // via absolute positioning + animated size — this is what preserves
  // playback across expand/collapse. Sits at the top-left of the sheet in
  // both states (full width when expanded, mini thumbnail when collapsed).
  const playerSurface = (
    <Animated.View style={[styles.videoSlot, { width: videoWidth, height: videoHeight }]}>
      {isAudioMode ? (
        <View style={styles.audioStage}>
          <Ionicons name="headset" size={expanded ? 48 : 22} color={theme.colors.white} />
        </View>
      ) : canPlayVideo ? (
        <YoutubePlayer
          ref={playerRef}
          height={fullVideoHeight}
          width={width}
          play={playing}
          videoId={videoId}
          onReady={onReady}
          onChangeState={onChangeState}
          initialPlayerParams={{ controls: true, modestbranding: true, rel: false }}
          webViewProps={{ allowsInlineMediaPlayback: true }}
        />
      ) : (
        <View style={styles.unavailableStage}>
          <Ionicons name="videocam-off-outline" size={expanded ? 36 : 20} color={theme.colors.grayIcon} />
          {expanded && <Text style={styles.unavailableText}>Video not available for this item yet.</Text>}
        </View>
      )}
      {!ready && canPlayVideo && !isAudioMode && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator color={theme.colors.white} />
        </View>
      )}
    </Animated.View>
  );

  return (
    <Animated.View
      style={[styles.sheet, { top: sheetTop, height: sheetHeight }]}
      pointerEvents="box-none"
    >
      {/* EXPANDED header — fades in only near the top of the expansion. */}
      <Animated.View
        style={[styles.header, { opacity: headerOpacity, paddingTop: insets.top }]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <Pressable onPress={collapse} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Minimize player">
          <Ionicons name="chevron-down" size={26} color={theme.colors.white} />
        </Pressable>
        <Text style={styles.headerLabel}>Now Playing</Text>
        <View style={styles.iconBtn} />
      </Animated.View>

      {/* The shared live player surface. */}
      <View style={styles.stageRow}>
        {/* When collapsed, the whole mini-bar (thumbnail + text + controls)
            is one tap target that expands the player. When expanded, the
            video area is just the video. */}
        {expanded ? (
          playerSurface
        ) : (
          <Pressable style={styles.miniRow} onPress={expand} accessibilityRole="button" accessibilityLabel={`Expand player: ${message.title}`}>
            {playerSurface}
            <Animated.View style={[styles.miniText, { opacity: miniOpacity }]}>
              <Text style={styles.miniTitle} numberOfLines={1}>{message.title}</Text>
              <Text style={styles.miniMeta} numberOfLines={1}>{message.speaker}</Text>
            </Animated.View>
            <Animated.View style={{ opacity: miniOpacity, flexDirection: 'row' }}>
              <Pressable
                onPress={() => setPlaying((p) => !p)}
                hitSlop={10}
                style={styles.miniBtn}
                accessibilityRole="button"
                accessibilityLabel={playing ? 'Pause' : 'Play'}
              >
                <Ionicons name={playing ? 'pause' : 'play'} size={20} color={theme.colors.navy} />
              </Pressable>
              <Pressable
                onPress={close}
                hitSlop={10}
                style={styles.miniBtn}
                accessibilityRole="button"
                accessibilityLabel="Close player"
              >
                <Ionicons name="close" size={20} color={theme.colors.graySecondary} />
              </Pressable>
            </Animated.View>
          </Pressable>
        )}
      </View>

      {/* EXPANDED details + related content — only interactive when expanded,
          faded out during collapse so it doesn't flash behind the mini-bar. */}
      <Animated.View style={[styles.detailsWrap, { opacity: detailsOpacity }]} pointerEvents={expanded ? 'auto' : 'none'}>
        <ScrollView contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
          <FadeInUp>
            <Text style={styles.title}>{message.title}</Text>
            <Text style={styles.metaText}>
              {message.speaker}
              {message.series ? ` · ${message.series}` : ''}
              {` · ${shortDate(message.publishedAt)}`}
            </Text>
          </FadeInUp>

          {hasAudio(message) && hasVideo(message) && (
            <View style={styles.modeRow}>
              <ModeChip label="Video" icon="videocam" active={mode === 'video'} onPress={() => setMode('video')} />
              <ModeChip label="Audio" icon="headset" active={mode === 'audio'} onPress={() => setMode('audio')} />
            </View>
          )}

          {ended && upNext && (
            <FadeInUp style={styles.upNext}>
              <Text style={styles.upNextLabel}>UP NEXT</Text>
              <RelatedRow message={upNext} onPress={() => play(upNext)} />
            </FadeInUp>
          )}

          {relatedSections.map((section) => (
            <View key={section.key} style={styles.relatedSection}>
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
    </Animated.View>
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
        <View style={styles.relatedPlayBadge}>
          <Ionicons name="play" size={12} color={theme.colors.white} style={{ marginLeft: 1 }} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.relatedRowTitle} numberOfLines={2}>{message.title}</Text>
        <Text style={styles.relatedRowMeta} numberOfLines={1}>{message.speaker} · {message.duration}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.black,
    zIndex: 100,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerLabel: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stageRow: {
    backgroundColor: theme.colors.black,
  },
  videoSlot: {
    backgroundColor: theme.colors.black,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MINI_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grayBorder,
  },
  miniText: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  miniTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
  },
  miniMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: 1,
  },
  miniBtn: {
    width: 44,
    height: MINI_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioStage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navy },
  unavailableStage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.xl },
  unavailableText: { fontFamily: theme.fontFamily.body, color: theme.colors.grayIcon, textAlign: 'center', fontSize: theme.fontSize.body },
  loaderOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  detailsWrap: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  detailsContent: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl * 2 },
  title: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sectionHeading, color: theme.colors.navy, marginBottom: theme.spacing.sm },
  metaText: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.body, color: theme.colors.graySecondary },
  modeRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg, minHeight: 40, borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.grayBorder, backgroundColor: theme.colors.surface,
  },
  modeChipActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  modeChipText: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.caption, color: theme.colors.slate },
  modeChipTextActive: { color: theme.colors.white },
  upNext: {
    marginTop: theme.spacing.xxl, padding: theme.spacing.lg, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.grayBorder,
  },
  upNextLabel: { fontFamily: theme.fontFamily.bodyBold, fontSize: theme.fontSize.caption, color: theme.colors.pink, letterSpacing: 0.8, marginBottom: theme.spacing.md },
  relatedSection: { marginTop: theme.spacing.xxl, gap: theme.spacing.md },
  relatedTitle: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.bodyLg, color: theme.colors.navy, marginBottom: theme.spacing.xs },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  relatedThumb: { width: 128, height: 72, borderRadius: theme.radius.sm, overflow: 'hidden', backgroundColor: theme.colors.grayBorder },
  relatedPlayBadge: {
    position: 'absolute', left: 6, bottom: 6, width: 24, height: 24, borderRadius: theme.radius.full,
    backgroundColor: 'rgba(10,22,33,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  relatedRowTitle: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.body, color: theme.colors.navy, lineHeight: 18 },
  relatedRowMeta: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.caption, color: theme.colors.graySecondary, marginTop: 2 },
});
