// components/library/AudioLibrary.tsx
// The Audio MODE of the Library — the church's own recordings, served from the
// public Cloudflare R2 bucket rather than from YouTube.
//
// WHERE THE CONTENT COMES FROM
// services/r2.ts fetches `manifests/audio-manifest.json` (546 entries today)
// and caches it; this component owns nothing but the rendering and the
// playing. The manifest carries four fields per item — title, sourceFilename,
// url, sizeBytes — and that shortness is what shapes this screen:
//
//   no publishedAt  → there is NO "Latest" and no "Recently Added" here. The
//                     manifest is ordered alphabetically and carries no date,
//                     so any recency framing would be invented. The earlier
//                     hero-plus-shelves layout was written against a Message[]
//                     that had dates and series; with this data it would have
//                     been three headings over one arbitrary ordering.
//   no series       → no "Teachings" grouping.
//   no speaker      → the rows state no speaker rather than guessing one.
//   no duration     → the row shows file size instead, which is the one
//                     concrete fact the manifest does have. Real duration only
//                     becomes knowable once a track is loaded.
//
// So this is one honest, complete, virtualized list. It is not a discovery hub
// like the video mode, because the data cannot support one yet — when the
// pipeline starts emitting dates and speakers, the shelves can come back.
//
// PLAYBACK is expo-audio, one player instance for the whole mode: tapping a
// row plays it, tapping the playing row pauses it, tapping a different row
// replaces the source. Deliberately not routed through PlaybackProvider —
// that provider drives a YouTube IFrame inside a WebView and every one of its
// paths expects a Message with a videoId, which an mp3 url is not.

import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { theme } from '../../constants/theme';
import { EmptyState } from '../ui/EmptyState';
import { AudioRow } from '../ui/AudioRow';
import { formatBytes, type R2Item } from '../../services/r2';
import { useR2Manifest } from '../../hooks/useR2Manifest';

interface AudioLibraryProps {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bottomClearance: number;
}

export const AudioLibrary = ({ onScroll, bottomClearance }: AudioLibraryProps) => {
  const { items, status, stale, reload } = useR2Manifest('audio');

  // ONE player for the whole mode, created with no source and re-pointed with
  // replace(). Creating a player per row would mean 546 native player objects
  // for a list where at most one can ever be audible.
  const player = useAudioPlayer(undefined, { updateInterval: 500 });
  const playerStatus = useAudioPlayerStatus(player);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

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
      if (activeUrl === item.url) {
        if (playerStatus.playing) player.pause();
        else player.play();
        return;
      }
      setActiveUrl(item.url);
      player.replace({ uri: item.url });
      player.play();
    },
    [activeUrl, player, playerStatus.playing]
  );

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.pink} />
        <Text style={styles.loadingLabel}>Loading audio…</Text>
      </View>
    );
  }

  // A failed fetch with nothing cached falls back to the SAME empty-state copy
  // this mode has always shown, plus a retry — a network blip should not look
  // like a different, scarier screen than "nothing here yet".
  if (status === 'error' || items.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="headset-outline"
          title="No audio yet"
          subtitle={
            status === 'error'
              ? "We couldn't reach the audio library. Check your connection and try again."
              : 'Audio-only recordings — midweek teachings and messages shared straight to the church — will appear here once they start being published.'
          }
          actionLabel={status === 'error' ? 'Try again' : undefined}
          onAction={status === 'error' ? reload : undefined}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.url}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      // A list this long has to be virtualized; these are the same window
      // settings the other long collections use.
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Recordings</Text>
          <Text style={styles.headerCount}>
            {items.length}
            {stale ? ' · offline copy' : ''}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isActive = item.url === activeUrl;
        return (
          <AudioRow
            title={item.title}
            sizeLabel={formatBytes(item.sizeBytes)}
            isPlaying={isActive && playerStatus.playing}
            // Buffering a 100MB mp3 over mobile data is not instant, and a
            // button that looks idle for four seconds gets tapped again.
            isLoading={isActive && !playerStatus.isLoaded}
            onPress={() => toggle(item)}
          />
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    // No horizontal padding: the pager's parent already carries the screen
    // gutter, and adding it again here would inset this page relative to the
    // video page beside it — visible as a jump on every swipe.
    paddingTop: theme.space.tight,
  },
  // Fills the page so EmptyState's own flex:1 has a real height to resolve
  // against, and centres the loading spinner the same way. No padding: the
  // centring must be governed by flex alone, so it stays correct whatever
  // height the search bar and mode switch take on a given device.
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.related,
  },
  loadingLabel: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.space.header,
  },
  headerLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: theme.colors.graySecondary,
  },
  headerCount: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
  },
  separator: {
    height: theme.space.tight,
  },
});
