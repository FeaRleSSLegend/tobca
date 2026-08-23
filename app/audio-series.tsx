// app/audio-series.tsx
// The audio collection screen, in two modes — the same file-with-two-modes
// shape app/see-all.tsx uses for video, so the two media types navigate
// alike:
//
//   /audio-series                    every series, as a list
//   /audio-series?series=<label>     one series' recordings, in part order
//
// It wears CollectionShell, the same chrome every video collection wears
// (back header, live count, scoped search), which is the mechanism that stops
// audio drifting into its own visual dialect. It also closes a gap flagged
// earlier: the global /search covers YouTube messages only, so this is the
// first place the R2 audio archive is searchable at all.
//
// Playback comes from AudioFileProvider, the same instance the Library's audio
// shelves use — so a track started here keeps playing when you go back, with
// the row there showing its pause glyph. That shared instance is the reason
// the player lives in a provider rather than inside the Library screen.

import { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { seeAllStyles } from '../constants/styles/seeAll.styles';
import { CollectionShell } from '../components/ui/CollectionShell';
import { EmptyState } from '../components/ui/EmptyState';
import { AudioRow } from '../components/ui/AudioRow';
import { PressableScale } from '../components/ui/motion';
import { useR2Manifest } from '../hooks/useR2Manifest';
import { useAudioFiles } from '../providers/AudioFileProvider';
import { groupAudio, formatAudioDate, type AudioSeries } from '../utils/audioGrouping';
import { formatBytes } from '../services/r2';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { useStackBottomClearance } from '../hooks/useBottomClearance';

/**
 * One series in the full list. Deliberately NOT SeriesListRow — that one is
 * built around a landscape artwork and an ongoing/complete status, and audio
 * has neither: no thumbnail to show, and no way to know whether a teaching is
 * finished. Everything else (surface, hairline border, radius, 16pt gap) is
 * the shared list-row recipe AudioRow and DocumentRow already use.
 */
const SeriesRow = ({ series, onPress }: { series: AudioSeries; onPress: () => void }) => (
  <PressableScale
    style={styles.seriesRow}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${series.label}, ${series.items.length} recordings`}
  >
    <View style={styles.seriesTile}>
      <Ionicons name="albums" size={18} color={theme.colors.pink} />
    </View>
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

export default function AudioSeriesScreen() {
  const { series: seriesLabel } = useLocalSearchParams<{ series?: string; title?: string }>();
  const push = useGuardedPush();
  const audio = useAudioFiles();
  const bottomClearance = useStackBottomClearance();
  const [query, setQuery] = useState('');

  // The manifest is already cached by the time anyone can reach this screen
  // (the shelf you tapped rendered from it), so this is an AsyncStorage read
  // rather than a network call.
  const { items, status } = useR2Manifest('audio');
  const grouped = useMemo(() => groupAudio(items), [items]);

  const active = seriesLabel
    ? grouped.series.find((s) => s.label === seriesLabel) ?? null
    : null;

  const q = query.trim().toLowerCase();

  // ---- ONE SERIES ----
  if (seriesLabel) {
    const tracks = active?.items ?? [];
    const visible = q ? tracks.filter((t) => t.title.toLowerCase().includes(q)) : tracks;

    return (
      <CollectionShell
        title={seriesLabel}
        subtitle={`${tracks.length} recording${tracks.length === 1 ? '' : 's'}`}
        searchPlaceholder={`Search ${seriesLabel}`}
        query={query}
        onQueryChange={setQuery}
      >
        {visible.length > 0 ? (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.url}
            style={{ flex: 1 }}
            contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <AudioRow
                title={item.title}
                context={formatAudioDate(item.date) ?? undefined}
                sizeLabel={formatBytes(item.sizeBytes)}
                isPlaying={audio.isPlaying(item.url)}
                isLoading={audio.isLoading(item.url)}
                onPress={() => audio.toggle(item)}
              />
            )}
          />
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
          renderItem={({ item }) => (
            <SeriesRow
              series={item}
              onPress={() =>
                push({
                  pathname: '/audio-series',
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
  seriesTile: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.pinkWash,
    alignItems: 'center',
    justifyContent: 'center',
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
