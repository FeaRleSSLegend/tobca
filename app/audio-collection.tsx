// app/audio-collection.tsx
// THE AUDIO COLLECTION SCREEN — audio's counterpart to app/see-all.tsx, and
// built to the same pattern on purpose.
//
// see-all.tsx is one file serving several sections behind a `section` param
// (series / services / recentlyAdded / latest / playlists), each rendering the
// FULL list with scoped search inside CollectionShell. Every video shelf on
// the Library hub is a capped preview whose header chevron pushes into it.
// Audio now works identically, so "tap the header to see all of them" means
// the same thing in both modes of the same screen.
//
//   /audio-collection                    every series, as a list
//   /audio-collection?series=<label>     one series, in part order
//   /audio-collection?section=all        every standalone recording
//   /audio-collection?section=recent     everything, newest first
//   /audio-collection?section=saved      what has been saved for offline
//
// It replaces app/audio-series.tsx, whose name stopped being true the moment
// it had to hold "All Recordings" as well.
//
// This is also still the only place the R2 archive is searchable from within a
// collection; the global /search now covers audio too, but scoped search here
// searches within the list you are already looking at.
//
// PLAYBACK comes from AudioFileProvider, the app's single now-playing state —
// so a track started here keeps playing when you go back, with the row there
// showing its own playing marker.

import { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { seeAllStyles } from '../constants/styles/seeAll.styles';
import { CollectionShell } from '../components/ui/CollectionShell';
import { EmptyState } from '../components/ui/EmptyState';
import { AudioListRow, AUDIO_ROW_ART } from '../components/ui/AudioListRow';
import { AudioCover } from '../components/ui/AudioCover';
import { PressableScale } from '../components/ui/motion';
import { useR2Manifest } from '../hooks/useR2Manifest';
import { useAudioFiles, useAudioProgress, type AudioTrack } from '../providers/AudioFileProvider';
import { groupAudio, formatAudioDate, formatClock, type AudioSeries } from '../utils/audioGrouping';
import { buildTrackIndex, toQueue } from '../utils/audioTracks';
import { formatBytes } from '../services/r2';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { useStackBottomClearance } from '../hooks/useBottomClearance';

/**
 * One series in the full list. Deliberately NOT SeriesListRow — that one is
 * built around a landscape thumbnail and an ongoing/complete status, and audio
 * has neither. It carries the same designed cover the Series shelf does, at
 * row scale, so a series is recognisable in both places.
 */
const SeriesRow = ({ series, onPress }: { series: AudioSeries; onPress: () => void }) => (
  <PressableScale
    style={styles.seriesRow}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${series.label}, ${series.items.length} recordings`}
  >
    <AudioCover title={series.label} width={64} height={64} radius={theme.radius.sm} />
    <View style={styles.seriesBody}>
      <Text style={styles.seriesTitle} numberOfLines={2}>
        {series.label}
      </Text>
      <Text style={styles.seriesMeta}>
        {series.items.length} recording{series.items.length === 1 ? '' : 's'}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
  </PressableScale>
);

export default function AudioCollectionScreen() {
  const { series: seriesLabel, section } = useLocalSearchParams<{
    series?: string;
    section?: string;
    title?: string;
  }>();
  const push = useGuardedPush();
  const audio = useAudioFiles();
  // Duration is a LIVE reading — the manifest carries none — so the one row
  // that can show it is the one currently loaded.
  const { duration } = useAudioProgress();
  const bottomClearance = useStackBottomClearance();
  const [query, setQuery] = useState('');

  // The manifest is already cached by the time anyone can reach this screen
  // (whatever you tapped rendered from it), so this is an AsyncStorage read
  // rather than a network call.
  const { items, status } = useR2Manifest('audio');
  const grouped = useMemo(() => groupAudio(items), [items]);
  const index = useMemo(
    () => buildTrackIndex(items, grouped.seriesByUrl),
    [items, grouped.seriesByUrl]
  );
  const sizeByUrl = useMemo(
    () => new Map(items.map((i) => [i.url, formatBytes(i.sizeBytes)])),
    [items]
  );

  const q = query.trim().toLowerCase();

  /** One row, wired to the queue it belongs to. */
  const renderRow = (track: AudioTrack, queue: AudioTrack[], queueLabel: string | null) => {
    const isActive = audio.isActive(track.id);
    return (
      <AudioListRow
        title={track.title}
        series={track.series}
        speaker={track.speaker}
        date={formatAudioDate(track.date)}
        duration={isActive && duration > 0 ? formatClock(duration) : null}
        sizeLabel={track.sourceUrl ? sizeByUrl.get(track.sourceUrl) : null}
        isActive={isActive}
        isPlaying={audio.isPlaying(track.id)}
        isLoading={audio.isLoading(track.id)}
        isSaved={!!track.sourceUrl && audio.isSaved(track.sourceUrl)}
        // THE QUEUE IS THE WHOLE LIST, not the filtered one. Searching narrows
        // what you can SEE; it must not silently narrow what "next" means, or
        // a search for "part 3" would leave a one-item queue and a dead skip
        // button.
        onPress={() => audio.toggle(track, { items: queue, label: queueLabel })}
      />
    );
  };

  const trackList = (
    tracks: AudioTrack[],
    queue: AudioTrack[],
    queueLabel: string | null
  ) => (
    <FlatList
      data={tracks}
      keyExtractor={(t) => t.id}
      style={{ flex: 1 }}
      contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={9}
      // OFF, deliberately. On Android this clips descendants to the viewport,
      // and it is what silently broke the horizontal shelves when they lived
      // in a list header. There is nothing horizontal in this list, but the
      // flag buys nothing here either — these rows are plain views with
      // generated (cached) artwork, not images.
      removeClippedSubviews={false}
      renderItem={({ item }) => renderRow(item, queue, queueLabel)}
    />
  );

  // ---- ONE SERIES ----
  if (seriesLabel) {
    const active = grouped.series.find((s) => s.label === seriesLabel) ?? null;
    const queue = active ? toQueue(active.items, index) : [];
    const visible = q ? queue.filter((t) => t.title.toLowerCase().includes(q)) : queue;

    return (
      <CollectionShell
        title={seriesLabel}
        subtitle={`${queue.length} recording${queue.length === 1 ? '' : 's'}`}
        searchPlaceholder={`Search ${seriesLabel}`}
        query={query}
        onQueryChange={setQuery}
      >
        {visible.length > 0 ? (
          trackList(visible, queue, seriesLabel)
        ) : q ? (
          <EmptyState
            icon="search"
            title="No matches"
            actionLabel="Clear search"
            onAction={() => setQuery('')}
          />
        ) : (
          // Reachable if a cached manifest no longer contains the series a
          // deep link names — an empty state beats a blank screen.
          <EmptyState
            icon="headset-outline"
            title="Series not found"
            subtitle={
              status === 'loading'
                ? 'Still loading the audio library…'
                : 'These recordings are no longer in the library.'
            }
          />
        )}
      </CollectionShell>
    );
  }

  // ---- A FLAT SECTION ----
  if (section === 'all' || section === 'recent' || section === 'saved') {
    const source =
      section === 'all'
        ? toQueue(grouped.standalone, index)
        : section === 'recent'
        ? toQueue(grouped.recent, index)
        : index.all.filter((t) => t.sourceUrl && audio.isSaved(t.sourceUrl));

    const meta =
      section === 'all'
        ? {
            title: 'All Recordings',
            description:
              'Every recording that is not part of a detected series, newest first.',
          }
        : section === 'recent'
        ? {
            title: 'Recent Audio',
            description: "The church's whole audio archive, newest first.",
          }
        : {
            title: 'Saved for Offline',
            description: 'Recordings kept on this device. They play without a connection.',
          };

    // Title AND speaker, because the speaker is on screen in every row — a
    // search box beside a visible field that it ignores reads as broken.
    const visible = q
      ? source.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.speaker ? t.speaker.toLowerCase().includes(q) : false)
        )
      : source;

    return (
      <CollectionShell
        title={meta.title}
        subtitle={`${source.length} recording${source.length === 1 ? '' : 's'}`}
        description={meta.description}
        searchPlaceholder={`Search ${meta.title.toLowerCase()}`}
        query={query}
        onQueryChange={setQuery}
      >
        {visible.length > 0 ? (
          trackList(visible, source, meta.title)
        ) : q ? (
          <EmptyState
            icon="search"
            title="No matches"
            actionLabel="Clear search"
            onAction={() => setQuery('')}
          />
        ) : (
          <EmptyState
            icon={section === 'saved' ? 'download-outline' : 'headset-outline'}
            title={section === 'saved' ? 'Nothing saved yet' : 'Nothing here yet'}
            subtitle={
              section === 'saved'
                ? 'Open any recording and tap Save to keep it on this device for listening offline.'
                : undefined
            }
          />
        )}
      </CollectionShell>
    );
  }

  // ---- EVERY SERIES ----
  const visibleSeries = q
    ? grouped.series.filter((s) => s.label.toLowerCase().includes(q))
    : grouped.series;

  return (
    <CollectionShell
      title="Audio Series"
      subtitle={`${grouped.series.length} series`}
      description="Teachings recorded in parts, grouped from the church's audio archive."
      searchPlaceholder="Search series"
      query={query}
      onQueryChange={setQuery}
    >
      {visibleSeries.length > 0 ? (
        <FlatList
          data={visibleSeries}
          keyExtractor={(s) => s.key}
          style={{ flex: 1 }}
          contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          removeClippedSubviews={false}
          renderItem={({ item }) => (
            <SeriesRow
              series={item}
              onPress={() =>
                push({
                  pathname: '/audio-collection',
                  params: { series: item.label, title: item.label },
                })
              }
            />
          )}
        />
      ) : q ? (
        <EmptyState
          icon="search"
          title="No matching series"
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <EmptyState
          icon="albums-outline"
          title="No series yet"
          subtitle="Recordings released in parts will be grouped here automatically."
        />
      )}
    </CollectionShell>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: theme.space.tight,
  },
  // The compact track list uses a hairline between rows rather than a gap
  // between cards — see components/ui/AudioListRow for why the card went.
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.grayBorder,
    marginLeft: AUDIO_ROW_ART + theme.space.tight + 4,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.related,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.grayBorder,
    borderWidth: theme.layout.cardBorderWidth,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  seriesBody: {
    flex: 1,
    gap: theme.space.hairline,
  },
  seriesTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.cardTitle,
    lineHeight: 21,
    color: theme.colors.navy,
  },
  seriesMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
});
