// app/playlist/[id].tsx
// A playlist as a DESTINATION, not another grid. Modeled on Spotify/Apple
// Music playlist pages: a large artwork masthead with a color scrim, the
// title and count set big, prominent Play and Shuffle actions, then a clean
// numbered list of tracks. Deliberately does NOT use CollectionShell — the
// whole point of the redesign is that a playlist shouldn't look like every
// other collection screen. It has its own identity: art-forward, built to
// feel curated.
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { SmartImage } from '../../components/ui/SmartImage';
import { PressableScale, FadeInUp, staggerDelay } from '../../components/ui/motion';
import { EmptyState } from '../../components/ui/EmptyState';
import { Shimmer } from '../../components/ui/motion';
import { Message } from '../../data/content';
import { buildMessage } from '../../data/contentModel';
import { PRIMARY_BRANCH_ID } from '../../data/branches';
import { usePlayback } from '../../providers/PlaybackProvider';
import { fetchPlaylistItems } from '../../services/youtube';

export default function PlaylistScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const { play } = usePlayback();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setFailed(false);
    fetchPlaylistItems(id)
      .then((videos) => {
        if (cancelled) return;
        setItems(
          videos.map((v) =>
            buildMessage({
              source: 'youtube',
              branchId: PRIMARY_BRANCH_ID,
              externalId: v.videoId,
              title: v.title,
              speaker: 'OliveBrook Church',
              publishedAt: v.publishedAt,
              type: 'sermon',
              thumbnail: v.thumbnail,
              media: [{ kind: 'video', source: 'youtube', externalId: v.videoId, durationSeconds: v.durationSeconds }],
            })
          )
        );
      })
      .catch((e) => {
        console.warn('Playlist items fetch failed:', e);
        if (!cancelled) setFailed(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const cover = items[0]?.thumbnail;
  const totalMin = useMemo(
    () => items.reduce((sum, m) => sum + (m.durationSeconds ?? 0), 0) / 60,
    [items]
  );

  const playFrom = (list: Message[]) => { if (list.length) play(list[0]); };
  const shuffle = () => {
    if (!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    play(pick);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xxxl * 2 }}>
        {/* MASTHEAD — large artwork with a scrim the title sits on. */}
        <View style={styles.masthead}>
          {cover ? (
            <SmartImage uri={cover} style={StyleSheet.absoluteFill} />
          ) : loading ? (
            <Shimmer style={StyleSheet.absoluteFill} />
          ) : (
            <LinearGradient colors={theme.gradient.colors} start={theme.gradient.start} end={theme.gradient.end} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['rgba(10,22,33,0.15)', 'rgba(10,22,33,0.55)', 'rgba(10,22,33,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView edges={['top']} style={styles.mastheadSafe}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={24} color={theme.colors.white} />
            </Pressable>

            <View style={styles.mastheadText}>
              <Text style={styles.kicker}>PLAYLIST</Text>
              <Text style={styles.title} numberOfLines={3}>{title ?? 'Playlist'}</Text>
              <Text style={styles.subMeta}>
                {loading ? 'Loading…' : `${items.length} message${items.length === 1 ? '' : 's'}`}
                {!loading && totalMin >= 1 ? ` · ${Math.round(totalMin)} min` : ''}
              </Text>
            </View>
          </SafeAreaView>
        </View>

        {/* ACTIONS — a solid primary Play and a quiet secondary Shuffle.
            Play is the filled navy pill (the app's primary-action color,
            not a loud standalone pink that floats off the page); Shuffle is
            a subtle tinted button beside it. Together they read as one
            control group anchored to the masthead above. */}
        {!loading && !failed && items.length > 0 && (
          <View style={styles.actions}>
            <PressableScale style={styles.playBtn} onPress={() => playFrom(items)} accessibilityRole="button" accessibilityLabel="Play playlist">
              <Ionicons name="play" size={22} color={theme.colors.white} style={{ marginLeft: 1 }} />
              <Text style={styles.playBtnText}>Play all</Text>
            </PressableScale>
            <PressableScale style={styles.shuffleBtn} onPress={shuffle} accessibilityRole="button" accessibilityLabel="Shuffle playlist">
              <Ionicons name="shuffle" size={20} color={theme.colors.navy} />
            </PressableScale>
          </View>
        )}

        {/* TRACK LIST — numbered rows. */}
        <View style={styles.list}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.trackRow}>
                <Shimmer style={styles.trackNumSkeleton} width={24} />
                <Shimmer style={styles.trackThumb} width={64} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Shimmer style={{ height: 12, borderRadius: 4, width: '80%' }} width={220} />
                  <Shimmer style={{ height: 10, borderRadius: 4, width: '40%' }} width={110} />
                </View>
              </View>
            ))
          ) : failed ? (
            <EmptyState icon="cloud-offline" title="Couldn't load this playlist" subtitle="Check your connection and try again." />
          ) : items.length === 0 ? (
            <EmptyState icon="albums" title="No videos in this playlist yet" />
          ) : (
            items.map((m, i) => (
              <FadeInUp key={m.id} delay={staggerDelay(i)}>
                <PressableScale style={styles.trackRow} onPress={() => play(m)} accessibilityRole="button" accessibilityLabel={`Play ${m.title}`}>
                  <Text style={styles.trackNum}>{i + 1}</Text>
                  <View style={styles.trackThumb}>
                    <SmartImage uri={m.thumbnail} style={StyleSheet.absoluteFill} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle} numberOfLines={2}>{m.title}</Text>
                    <Text style={styles.trackMeta} numberOfLines={1}>{m.speaker} · {m.duration}</Text>
                  </View>
                  <Ionicons name="play-circle" size={26} color={theme.colors.grayIcon} />
                </PressableScale>
              </FadeInUp>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  masthead: { height: 300, backgroundColor: theme.colors.navy, justifyContent: 'flex-end' },
  mastheadSafe: { flex: 1, justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: theme.radius.full, backgroundColor: 'rgba(0,0,0,0.25)', margin: theme.spacing.md,
  },
  mastheadText: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl },
  kicker: { fontFamily: theme.fontFamily.bodyBold, fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  title: { fontFamily: theme.fontFamily.display, fontSize: 30, lineHeight: 34, color: theme.colors.white },
  subMeta: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.body, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  actions: { flexDirection: 'row', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl, alignItems: 'center' },
  playBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.navy, borderRadius: theme.radius.full, height: 52,
  },
  playBtnText: { fontFamily: theme.fontFamily.bodyBold, fontSize: theme.fontSize.bodyLg, color: theme.colors.white, letterSpacing: 0.2 },
  shuffleBtn: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
  },
  list: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, gap: theme.spacing.xs },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.sm },
  trackNum: { width: 22, textAlign: 'center', fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.body, color: theme.colors.grayIcon },
  trackNumSkeleton: { width: 22, height: 14, borderRadius: 4 },
  trackThumb: { width: 64, height: 44, borderRadius: theme.radius.sm, overflow: 'hidden', backgroundColor: theme.colors.grayBorder },
  trackTitle: { fontFamily: theme.fontFamily.bodySemibold, fontSize: theme.fontSize.body, color: theme.colors.navy, lineHeight: 18 },
  trackMeta: { fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.caption, color: theme.colors.graySecondary, marginTop: 2 },
});
