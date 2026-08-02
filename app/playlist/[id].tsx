// Destination for tapping a PlaylistCircle. Separate from see-all.tsx
// because a playlist's contents come from a different API call
// (fetchPlaylistItems, keyed by playlist ID) rather than from
// classifying the channel's full upload history — different data source,
// but it wears the same CollectionShell as every collection screen, so
// to the user this is just one more page of the same family: identical
// header, live count, and a search scoped to this playlist's videos.
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { seeAllStyles } from '../../constants/styles/seeAll.styles';
import { CardGrid } from '../../components/ui/CardGrid';
import { CollectionShell } from '../../components/ui/CollectionShell';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonGrid } from '../../components/ui/Skeletons';
import { Message } from '../../data/content';
import { buildMessage } from '../../data/contentModel';
import { PRIMARY_BRANCH_ID } from '../../data/branches';
import { fetchPlaylistItems } from '../../services/youtube';

export default function PlaylistScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

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
              media: [
                { kind: 'video', source: 'youtube', externalId: v.videoId, durationSeconds: v.durationSeconds },
              ],
            })
          )
        );
      })
      .catch((e) => {
        console.warn('Playlist items fetch failed:', e);
        // Distinguish "fetch broke" from "playlist is empty" — an offline
        // user retrying an empty-looking screen forever is the error-state
        // failure mode the redesign calls out.
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((m) => m.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <CollectionShell
      title={title ?? 'Playlist'}
      subtitle={loading ? undefined : `${items.length} video${items.length === 1 ? '' : 's'}`}
      searchPlaceholder="Search this playlist"
      query={query}
      onQueryChange={setQuery}
    >
      {visible.length > 0 ? (
        <View style={seeAllStyles.gridWrap}>
          <CardGrid data={visible} />
        </View>
      ) : loading ? (
        <SkeletonGrid tiles={6} />
      ) : failed ? (
        <EmptyState
          icon="cloud-offline"
          title="Couldn't load this playlist"
          subtitle="Check your connection and try again."
        />
      ) : query ? (
        <EmptyState
          icon="search"
          title="No matches in this playlist"
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <EmptyState icon="albums" title="No videos in this playlist yet" />
      )}
    </CollectionShell>
  );
}
