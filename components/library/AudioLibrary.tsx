// components/library/AudioLibrary.tsx
// The Audio MODE of the Library — the church's own recordings, served from the
// public Cloudflare R2 bucket rather than from YouTube.
//
// A HUB, EXACTLY LIKE THE VIDEO HUB IS A HUB
// This page used to end in the whole standalone remainder: 254 rows, paged 40
// at a time behind a "Show more" button. That was still the wrong shape, and
// the reason is not the button — it is that the Video mode of this same screen
// answered the same problem years ago and answered it differently. Video's
// pattern, verbatim from app/(tabs)/library.tsx:
//
//   every section is a CAPPED preview (PREVIEW_COUNT = 6)
//   every section header is tappable, rendered with a "›" chevron
//   the chevron pushes a DEDICATED FULL-LIST SCREEN (app/see-all.tsx), which
//   is where scoped search, filter pills and the complete list live
//
// Audio now does the same thing, into app/audio-collection.tsx. Nothing on
// this page is unbounded, and browsing 254 recordings is a place you navigate
// to rather than a tail you fall into.
//
// That change also removed this file's last structural oddity. It used to be a
// FlatList whose header held the shelves — the only virtualised list in the
// app with horizontal scrollers inside its header, and the reason those
// shelves would not scroll on Android (removeClippedSubviews clipped their
// off-screen cards out of the hierarchy). With no long list left to
// virtualise, this is a plain ScrollView, which is what the Video page has
// always been, and the failure mode cannot recur.
//
// SECTIONS, chosen from what the manifest actually contains. Each is omitted
// rather than faked when its data is empty:
//
//   Continue Listening  positions already persisted by the player.
//   Recent Audio        real `date` on 521 of 546 items (95.4%).
//   Series              title-grouped, 63 of them.
//   Saved for Offline   only when the user has actually saved something.
//   All Recordings      a six-row preview into the full browse screen.
//
// DELIBERATELY ABSENT
//   Playlists — the video hub has them because usePlaylists returns real
//     YouTube playlists. There is no audio equivalent and no way for a user to
//     make one, so the section would be a header over nothing.
//   Branch — the manifest carries no branch/location field and none can be
//     derived. Same reason the Library's branch pills hide in Audio mode.
//   Speakers — `speaker` is real (79.5% coverage) and is SHOWN on every row
//     and in the player, but it is not a browse axis: the tag is free-typed
//     and unnormalised, 55 distinct strings for roughly a dozen people. A
//     "Browse by speaker" shelf over that lists the same man four times.
//
// PLAYBACK is providers/AudioFileProvider — the app's single now-playing
// state, shared with the mini bar, the full player and (when it is wired) the
// live prayer stream.
//
// EVERY PLAY CARRIES ITS LIST: tapping a row hands the provider the list that
// row was displayed in, which is what previous/next then move through.
//
// LOAD-ON-DEMAND: a uri reaches the player only from a tap. Rendering,
// scrolling and virtualization recycling cannot start a request.

import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../../constants/theme';
import { EmptyState } from '../ui/EmptyState';
import { AudioListRow } from '../ui/AudioListRow';
import { AudioPosterCard } from '../ui/AudioPosterCard';
import { SectionLabel } from '../ui/SectionLabel';
import { HScroll } from '../ui/HScroll';
import { SkeletonRow, SkeletonList } from '../ui/Skeletons';
import { formatBytes } from '../../services/r2';
import { useAudioManifest } from '../../hooks/useAudioManifest';
import { useAudioFiles, type AudioTrack } from '../../providers/AudioFileProvider';
import { groupAudio, formatAudioDate } from '../../utils/audioGrouping';
import { buildTrackIndex, toQueue } from '../../utils/audioTracks';
import { getInProgress } from '../../utils/playbackProgress';
import { useGuardedPush } from '../../hooks/useGuardedPush';

interface AudioLibraryProps {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bottomClearance: number;
}

// Same teaser count the video shelves use, for the same reason: a filled row
// that runs past the screen edge says "there is more behind this header".
const PREVIEW_COUNT = 6;

/**
 * The part-listened recordings, newest activity first.
 *
 * Reads the SHARED position store (utils/playbackProgress) rather than a new
 * one — the video player has written to it since before this feature existed,
 * and audio writes to it too, keyed by the same string a track uses as its id.
 * Records whose key no longer matches anything in the manifest are dropped:
 * a recording can be removed from the bucket, and a Continue row pointing at a
 * 404 is worse than no row.
 */
function useContinueListening(tracks: AudioTrack[], activeId: string | null): AudioTrack[] {
  const [keys, setKeys] = useState<string[]>([]);

  const refresh = useCallback(() => {
    let cancelled = false;
    getInProgress()
      .then((rows) => {
        if (!cancelled) setKeys(rows.map((r) => r.messageId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // On focus, so coming back from the player shows the position just written
  // rather than the one from when this mounted.
  useFocusEffect(refresh);

  return useMemo(() => {
    if (keys.length === 0) return [];
    const byId = new Map(tracks.map((t) => [t.id, t]));
    return keys
      .map((k) => byId.get(k))
      .filter((t): t is AudioTrack => !!t)
      // The active track is already on screen in the mini bar; offering to
      // "continue" it here too is noise.
      .filter((t) => t.id !== activeId)
      .slice(0, PREVIEW_COUNT);
  }, [keys, tracks, activeId]);
}

export const AudioLibrary = ({ onScroll, bottomClearance }: AudioLibraryProps) => {
  const push = useGuardedPush();
  // SCOPED. Teachings, plus the service-embedded prayer segments that are
  // dual-listed here and on the Prayer tab. See hooks/useAudioManifest.
  const { items, status, stale, reload } = useAudioManifest('library');
  const audio = useAudioFiles();

  // Two passes over 546 items, both memoised on the manifest identity — which
  // only changes when a fetch resolves, so they run once per load and never on
  // a playback tick. (They CANNOT run on a tick any more: the ticking position
  // lives in a separate context this file does not subscribe to.)
  const { series, standalone, recent, seriesByUrl } = useMemo(() => groupAudio(items), [items]);
  const index = useMemo(() => buildTrackIndex(items, seriesByUrl), [items, seriesByUrl]);

  const activeId = audio.track?.id ?? null;
  const continueListening = useContinueListening(index.all, activeId);

  const savedTracks = useMemo(
    () => index.all.filter((t) => t.sourceUrl && audio.isSaved(t.sourceUrl)),
    [index, audio.isSaved]
  );

  const recentTracks = useMemo(
    () => toQueue(recent.slice(0, PREVIEW_COUNT), index),
    [recent, index]
  );
  const standaloneTracks = useMemo(() => toQueue(standalone, index), [standalone, index]);
  const previewRows = useMemo(
    () => standaloneTracks.slice(0, PREVIEW_COUNT),
    [standaloneTracks]
  );
  const sizeByUrl = useMemo(
    () => new Map(items.map((i) => [i.url, formatBytes(i.sizeBytes)])),
    [items]
  );

  const openCollection = useCallback(
    (section: string, title: string) =>
      push({ pathname: '/audio-collection', params: { section, title } }),
    [push]
  );

  // ---- SKELETON ----
  // Reuses the Video tab's own skeleton components rather than a second set:
  // SkeletonRow already carries the section label placeholder and the exact
  // rowCard metrics, which is what stops the shelves stepping sideways or
  // dropping 13pt the instant real data lands.
  if (status === 'loading') {
    return (
      <View style={styles.skeleton} accessibilityLabel="Loading audio library">
        <SkeletonRow cards={3} />
        <SkeletonRow cards={3} />
        <View style={styles.skeletonList}>
          <SkeletonList rows={4} />
        </View>
      </View>
    );
  }

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

  const shelf = (
    label: string,
    list: AudioTrack[],
    queueLabel: string,
    onSeeAll?: () => void
  ) => (
    <>
      <SectionLabel label={label} onPress={onSeeAll} />
      <HScroll>
        {list.map((track) => (
          <AudioPosterCard
            key={track.id}
            title={track.title}
            // The date when we have one, the file size when we do not — never
            // a fabricated date, and never an empty line.
            subtitle={
              formatAudioDate(track.date) ??
              (track.sourceUrl ? sizeByUrl.get(track.sourceUrl) ?? '' : '')
            }
            series={track.series}
            isActive={audio.isActive(track.id)}
            isPlaying={audio.isPlaying(track.id)}
            // The queue is THIS SHELF, in the order it is displayed. Next moves
            // along the shelf you tapped, which is the only meaning of "next" a
            // person can predict from the screen they are on.
            onPress={() => audio.toggle(track, { items: list, label: queueLabel })}
          />
        ))}
      </HScroll>
    </>
  );

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
    >
      {continueListening.length > 0 &&
        shelf('Continue Listening', continueListening, 'Continue Listening')}

      {recentTracks.length > 0 &&
        shelf('Recent Audio', recentTracks, 'Recent Audio', () =>
          openCollection('recent', 'Recent Audio')
        )}

      {series.length > 0 && (
        <>
          <SectionLabel label="Series" onPress={() => push('/audio-collection')} />
          <HScroll>
            {series.slice(0, PREVIEW_COUNT).map((s) => (
              <AudioPosterCard
                key={s.key}
                variant="series"
                title={s.label}
                subtitle={`${s.items.length} messages`}
                onPress={() =>
                  push({
                    pathname: '/audio-collection',
                    params: { series: s.label, title: s.label },
                  })
                }
              />
            ))}
          </HScroll>
        </>
      )}

      {savedTracks.length > 0 &&
        shelf(
          'Saved for Offline',
          savedTracks.slice(0, PREVIEW_COUNT),
          'Saved for Offline',
          savedTracks.length > PREVIEW_COUNT
            ? () => openCollection('saved', 'Saved for Offline')
            : undefined
        )}

      {standaloneTracks.length > 0 && (
        <>
          {/* The chevron is the whole point of this section: six rows are a
              taste, and the browse screen is where 254 of them belong. */}
          <SectionLabel
            label="All Recordings"
            onPress={() => openCollection('all', 'All Recordings')}
          />
          <View style={styles.previewList}>
            {previewRows.map((track, i) => (
              <View key={track.id}>
                {i > 0 && <View style={styles.divider} />}
                <AudioListRow
                  title={track.title}
                  series={track.series}
                  speaker={track.speaker}
                  date={formatAudioDate(track.date)}
                  sizeLabel={track.sourceUrl ? sizeByUrl.get(track.sourceUrl) : null}
                  isActive={audio.isActive(track.id)}
                  isPlaying={audio.isPlaying(track.id)}
                  isLoading={audio.isLoading(track.id)}
                  isSaved={!!track.sourceUrl && audio.isSaved(track.sourceUrl)}
                  // The queue is the WHOLE browse list, not the six rows shown
                  // — otherwise "next" would stop dead at the preview's edge,
                  // which is a layout decision leaking into the transport.
                  onPress={() =>
                    audio.toggle(track, { items: standaloneTracks, label: 'All Recordings' })
                  }
                />
              </View>
            ))}
          </View>
          <Text style={styles.moreHint}>
            {standaloneTracks.length} recordings
            {stale ? ' · offline copy' : ''}
          </Text>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    // No horizontal padding: the pager's parent already carries the screen
    // gutter, and adding it again here would inset this page relative to the
    // video page beside it — visible as a jump on every swipe.
    paddingTop: theme.space.tight,
  },
  skeleton: {
    paddingTop: theme.space.tight,
  },
  skeletonList: {
    // SectionLabel's own top margin is what separates a real shelf from the
    // section under it; the row skeleton has no label of its own, so it
    // contributes the same gap here rather than sitting flush.
    marginTop: theme.space.section,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.related,
  },
  previewList: {
    marginTop: -theme.space.micro,
  },
  // A hairline between rows instead of a gap between cards — what makes the
  // preview read as one list rather than six separate objects.
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.grayBorder,
    marginLeft: 58, // clears the artwork, aligns with the title
  },
  moreHint: {
    marginTop: theme.space.header,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
    textAlign: 'center',
  },
});
