// app/player.tsx
// The full-screen player — the destination for every "play" in the app.
// First-class playback per the brief: a real, playing YouTube surface (not
// a thumbnail that opens the YouTube app), position that saves as you watch
// and restores when you return, and the metadata + next-in-series context
// that turns a bare video into a "continue through this teaching" flow.
//
// Playback engine: react-native-youtube-iframe (a thin wrapper over an
// embedded YouTube IFrame player in a WebView). This is the correct,
// terms-of-service-compliant way to play a YouTube-sourced library — it
// streams from YouTube, counts official views, and exposes play state and
// position, which is exactly what Continue Watching needs. It does NOT
// require extracting raw stream URLs (which would violate YouTube's ToS
// and break constantly).
//
// Audio-only variants (future Telegram integration) are modeled here too:
// when a message's active mode is audio, the video surface collapses to an
// audio-card treatment. The wiring is present so the audio player drops in
// without restructuring this screen; today every real message is video.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { theme } from '../constants/theme';
import { usePlayback } from '../providers/PlaybackProvider';
import { useMessages } from '../hooks/useMessages';
import { classifyMessages } from '../utils/contentGrouping';
import { primaryVariant, hasAudio, hasVideo, Message } from '../data/contentModel';
import { getPosition, savePosition } from '../utils/playbackProgress';
import { shortDate } from '../utils/collections';

// How often to persist position while playing. 5s is frequent enough that
// resuming feels exact, infrequent enough to be free.
const SAVE_INTERVAL_MS = 5000;

export default function PlayerScreen() {
  const router = useRouter();

  // Dismissing the player: normally pops the modal, but if the player was
  // somehow the entry point (deep link, a reload landing here, or a stale
  // dev state) there's nothing to pop — going back would throw the
  // "GO_BACK was not handled" error. So fall through to the tabs home
  // instead of a blind back().
  const dismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/live');
    }
  }, [router]);
  const { width } = useWindowDimensions();
  const { activeMessage, mode, play, setMode } = usePlayback();
  const { messages } = useMessages();

  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const message = activeMessage;

  const variant = message ? primaryVariant(message) : undefined;
  const videoId = message?.videoId || '';
  const durationSeconds = variant?.durationSeconds ?? 0;

  // Restore saved position once the player is ready. Seeking before ready
  // is ignored by the iframe, so this waits for onReady.
  const restoredRef = useRef(false);
  const onReady = useCallback(async () => {
    setReady(true);
    if (restoredRef.current || !message) return;
    restoredRef.current = true;
    const saved = await getPosition(message.id);
    if (saved && saved.positionSeconds > 5 && playerRef.current) {
      // Resume a few seconds before where they left off — the standard
      // "pick up the thread" nudge every media app uses, rather than a
      // cold cut mid-sentence.
      playerRef.current.seekTo(Math.max(0, saved.positionSeconds - 3), true);
    }
  }, [message]);

  // Persist position on an interval while playing, and once more on unmount
  // so a quick exit still records where they were.
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
        // getCurrentTime can reject during teardown — ignore.
      }
    };

    if (playing) {
      saveTimer.current = setInterval(persist, SAVE_INTERVAL_MS);
    }
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
      persist(); // final save on pause/unmount
    };
  }, [playing, ready, message, durationSeconds, mode]);

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

  // Next episode in the same series — the "keep going" affordance that
  // makes a multi-part teaching feel like one flow instead of twelve
  // separate videos the user has to re-find. Only computed for series
  // messages; null for standalone content. Memoized because
  // classifyMessages walks the whole library and must not re-run on every
  // playback state change (play/pause fires this component a lot).
  const nextInSeries = useMemo(() => {
    if (!message?.series) return null;
    const { series } = classifyMessages(messages);
    const group = series.find((g) => g.label === message.series);
    if (!group) return null;
    // items are newest-first; play order is oldest-first, so find the item
    // just AFTER this one chronologically.
    const chrono = [...group.items].reverse();
    const idx = chrono.findIndex((m) => m.id === message.id);
    return idx >= 0 && idx < chrono.length - 1 ? chrono[idx + 1] : null;
  }, [message?.id, message?.series, messages]);

  if (!message) {
    // Deep-linked or reloaded straight onto /player with no active message
    // in context — nothing to play, so bow out gracefully.
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={dismiss} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={26} color={theme.colors.white} />
          </Pressable>
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyText}>Nothing is playing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playerHeight = (width * 9) / 16; // 16:9
  const isAudioMode = mode === 'audio' && hasAudio(message);
  const canPlayVideo = hasVideo(message) && !!videoId && !videoId.startsWith('REPLACE_ME');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Chrome over the black media area — a single down-chevron to
          dismiss, the media-app convention for "this was a modal push". */}
      <View style={styles.header}>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Close player"
        >
          <Ionicons name="chevron-down" size={26} color={theme.colors.white} />
        </Pressable>
        <Text style={styles.headerLabel}>Now Playing</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.stage, { height: playerHeight }]}>
        {isAudioMode ? (
          // Audio variant present and selected — placeholder art surface.
          // The real audio transport arrives with Telegram integration;
          // the layout slot is here now so that lands without a rebuild.
          <View style={styles.audioStage}>
            <Ionicons name="headset" size={48} color={theme.colors.white} />
            <Text style={styles.audioStageText}>Audio</Text>
          </View>
        ) : canPlayVideo ? (
          <YoutubePlayer
            ref={playerRef}
            height={playerHeight}
            width={width}
            play={playing}
            videoId={videoId}
            onReady={onReady}
            onChangeState={onChangeState}
            initialPlayerParams={{ controls: true, modestbranding: true, rel: false }}
            webViewProps={{ allowsInlineMediaPlayback: true }}
          />
        ) : (
          // No real, playable id yet (mock stub). Be honest instead of
          // showing a broken embed — this only appears on seed data.
          <View style={styles.unavailableStage}>
            <Ionicons name="videocam-off-outline" size={36} color={theme.colors.grayIcon} />
            <Text style={styles.unavailableText}>Video not available for this item yet.</Text>
          </View>
        )}
        {!ready && canPlayVideo && !isAudioMode && (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <ActivityIndicator color={theme.colors.white} />
          </View>
        )}
      </View>

      <ScrollView style={styles.details} contentContainerStyle={styles.detailsContent}>
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.meta}>
          {message.speaker}
          {message.series ? ` · ${message.series}` : ''}
          {` · ${shortDate(message.publishedAt)}`}
        </Text>

        {/* Audio/video toggle appears ONLY when a message actually has both
            variants (per the architecture doc: toggle lives on the player,
            not on list cards). Today no message has audio, so this is
            invariably hidden — present for the Telegram future. */}
        {hasAudio(message) && hasVideo(message) && (
          <View style={styles.modeRow}>
            <ModeChip label="Video" icon="videocam" active={mode === 'video'} onPress={() => setMode('video')} />
            <ModeChip label="Audio" icon="headset" active={mode === 'audio'} onPress={() => setMode('audio')} />
          </View>
        )}

        {ended && nextInSeries && (
          <View style={styles.upNext}>
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <UpNextRow message={nextInSeries} onPress={() => play(nextInSeries)} />
          </View>
        )}

        {!ended && nextInSeries && (
          <Pressable
            style={styles.nextLink}
            onPress={() => play(nextInSeries)}
            accessibilityRole="button"
            accessibilityLabel={`Play next: ${nextInSeries.title}`}
          >
            <Ionicons name="play-skip-forward" size={16} color={theme.colors.pink} />
            <Text style={styles.nextLinkText}>Next in series</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeChip, active && styles.modeChipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={15} color={active ? theme.colors.white : theme.colors.slate} />
      <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function UpNextRow({ message, onPress }: { message: Message; onPress: () => void }) {
  return (
    <Pressable style={styles.upNextRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Play ${message.title}`}>
      <View style={styles.upNextPlay}>
        <Ionicons name="play" size={16} color={theme.colors.white} style={{ marginLeft: 2 }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.upNextTitle} numberOfLines={2}>{message.title}</Text>
        <Text style={styles.upNextMeta}>{message.duration}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stage: {
    width: '100%',
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
  },
  audioStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  audioStageText: {
    fontFamily: theme.fontFamily.bodySemibold,
    color: theme.colors.white,
    fontSize: theme.fontSize.body,
  },
  unavailableStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  unavailableText: {
    fontFamily: theme.fontFamily.body,
    color: theme.colors.grayIcon,
    textAlign: 'center',
    fontSize: theme.fontSize.body,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  detailsContent: {
    padding: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: theme.colors.navy,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
  },
  modeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 40,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    backgroundColor: theme.colors.surface,
  },
  modeChipActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  modeChipText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.slate,
  },
  modeChipTextActive: {
    color: theme.colors.white,
  },
  nextLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    minHeight: 44,
  },
  nextLinkText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.pink,
  },
  upNext: {
    marginTop: theme.spacing.xxl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
  },
  upNextLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.md,
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  upNextPlay: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upNextTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
  },
  upNextMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: 1,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamily.body,
    color: theme.colors.grayIcon,
    fontSize: theme.fontSize.body,
  },
});
