// components/library/AudioLibrary.tsx
// The Audio MODE of the Library — the church's own recordings, served from the
// public Cloudflare R2 bucket rather than from YouTube.
//
// STRUCTURED LIKE THE VIDEO MODE, NOT LIKE A FILE LISTING.
// This was a single flat list of 546 rows, which was honest but read as an
// export rather than as a library. It now uses the video hub's own vocabulary,
// component for component:
//
//   Recently Added   SectionLabel + HScroll of shelf cards   (video: same)
//   Series           SectionLabel + HScroll of shelf cards   (video: same)
//   Single Recordings   the vertical remainder                (video: grid)
//
// The shelf cards are AudioPosterCard, which is PosterCard's twin down to the
// shared rowCard metrics — so an audio shelf and a video shelf line up at the
// card edge, the baseline and the scroll peek. The one difference is the art
// box, which carries the waveform mark instead of a thumbnail, because an mp3
// has no frame to grab and a grey rectangle reads as a broken image.
//
// WHAT THE MANIFEST NOW SUPPORTS, AND WHAT IT STILL DOES NOT
// The enrichment pass added a `date` to 521 of 546 items (95.4%), which is
// what makes a real "Recently Added" possible — before this, the only ordering
// available was alphabetical and any recency framing would have been invented.
// Undated items sort to the END, never the top (see byRecency). Series come
// from utils/audioGrouping, which strips installment suffixes measured against
// the real titles. There is still no speaker and no duration in the manifest,
// so rows state neither.
//
// PLAYBACK is providers/AudioFileProvider — one expo-audio player for the
// whole app, deliberately separate from PlaybackProvider (that one drives a
// YouTube IFrame in a WebView and every path through it expects a videoId).
//
// LOAD-ON-DEMAND: nothing here passes a url to anything that could fetch it.
// A row receives strings and a callback; the url reaches the player only
// inside the provider's toggle(), i.e. only from a tap. Rendering, scrolling
// and virtualization recycling cannot start a request.

import { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { theme } from '../../constants/theme';
import { EmptyState } from '../ui/EmptyState';
import { AudioRow } from '../ui/AudioRow';
import { AudioPosterCard } from '../ui/AudioPosterCard';
import { SectionLabel } from '../ui/SectionLabel';
import { HScroll } from '../ui/HScroll';
import { formatBytes } from '../../services/r2';
import { useR2Manifest } from '../../hooks/useR2Manifest';
import { useAudioFiles } from '../../providers/AudioFileProvider';
import { groupAudio, formatAudioDate } from '../../utils/audioGrouping';
import { useGuardedPush } from '../../hooks/useGuardedPush';

interface AudioLibraryProps {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bottomClearance: number;
}

// Same teaser count the video shelves use, for the same reason: a filled row
// that runs past the screen edge says "there is more behind this header".
const PREVIEW_COUNT = 6;

export const AudioLibrary = ({ onScroll, bottomClearance }: AudioLibraryProps) => {
  const push = useGuardedPush();
  const { items, status, stale, reload } = useR2Manifest('audio');
  const audio = useAudioFiles();

  // 546 items through one grouping pass, memoised on the manifest identity —
  // which only changes when a fetch resolves, so this runs once per load and
  // not on every playback tick.
  const { series, standalone, recent } = useMemo(() => groupAudio(items), [items]);

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
      // The tail of the page is the LIST, and the shelves ride in its header.
      // Not a ScrollView: the standalone remainder is 254 rows on the live
      // manifest, and mounting those on entry would cost more than the whole
      // rest of the screen combined.
      data={standalone}
      keyExtractor={(item) => item.url}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
      ListHeaderComponent={
        <View>
          <SectionLabel label="Recently Added" />
          <HScroll>
            {recent.slice(0, PREVIEW_COUNT).map((item) => (
              <AudioPosterCard
                key={item.url}
                title={item.title}
                // The date when we have one, the file size when we do not —
                // never a fabricated date, and never an empty line.
                subtitle={formatAudioDate(item.date) ?? formatBytes(item.sizeBytes)}
                isPlaying={audio.isPlaying(item.url)}
                onPress={() => audio.toggle(item)}
              />
            ))}
          </HScroll>

          {series.length > 0 && (
            <>
              {/* Chevron into the full list — 63 series exist and six fit on
                  a shelf, the same teaser-plus-collection split every video
                  shelf uses. */}
              <SectionLabel label="Series" onPress={() => push('/audio-series')} />
              <HScroll>
                {series.slice(0, PREVIEW_COUNT).map((s) => (
                  <AudioPosterCard
                    key={s.key}
                    variant="series"
                    title={s.label}
                    subtitle={`${s.items.length} messages`}
                    onPress={() =>
                      push({
                        pathname: '/audio-series',
                        params: { series: s.label, title: s.label },
                      })
                    }
                  />
                ))}
              </HScroll>
            </>
          )}

          {standalone.length > 0 && (
            <View style={styles.listHeadRow}>
              <SectionLabel label="Single Recordings" />
              <Text style={styles.listHeadCount}>
                {standalone.length}
                {stale ? ' · offline copy' : ''}
              </Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <AudioRow
          title={item.title}
          // Same rule as the shelf cards: a real date, or the size, never a guess.
          context={formatAudioDate(item.date) ?? undefined}
          sizeLabel={formatBytes(item.sizeBytes)}
          isPlaying={audio.isPlaying(item.url)}
          isLoading={audio.isLoading(item.url)}
          onPress={() => audio.toggle(item)}
        />
      )}
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
  // against, and centres the loading spinner the same way.
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
  // SectionLabel owns its own margins, so the count is laid over the row
  // rather than added beside it — a sibling flex child would fight the
  // label's own space-between layout.
  listHeadRow: {
    justifyContent: 'center',
  },
  listHeadCount: {
    position: 'absolute',
    right: 0,
    bottom: theme.space.header,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
  },
  separator: {
    height: theme.space.tight,
  },
});
