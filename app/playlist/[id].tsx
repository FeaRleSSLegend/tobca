// Destination for tapping a PlaylistCircle. Separate from see-all.tsx
// because a playlist's contents come from a different API call
// (fetchPlaylistItems, keyed by playlist ID) rather than from
// classifying the channel's full upload history — different data source,
// same visual result, so it reuses CardGrid/seeAllStyles rather than
// duplicating that layout.
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { seeAllStyles } from '../../constants/styles/seeAll.styles';
import { CardGrid } from '../../components/ui/CardGrid';
import { Message } from '../../data/content';
import { fetchPlaylistItems } from '../../services/youtube';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';

export default function PlaylistScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    fetchPlaylistItems(id)
      .then((videos) => {
        if (cancelled) return;
        setItems(
          videos.map((v) => ({
            id: v.videoId,
            title: v.title,
            speaker: 'OliveBrook Church',
            duration: v.duration,
            durationSeconds: v.durationSeconds,
            videoId: v.videoId,
            type: 'sermon' as const,
            publishedAt: v.publishedAt,
            thumbnail: v.thumbnail,
          }))
        );
      })
      .catch((e) => console.warn('Playlist items fetch failed:', e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <ScreenWithWatermark style={seeAllStyles.container}>
      <View style={seeAllStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={seeAllStyles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>
        <Text style={seeAllStyles.title}>{title ?? 'Playlist'}</Text>
      </View>

      <View style={seeAllStyles.gridWrap}>
        {items.length > 0 ? (
          <CardGrid data={items} />
        ) : (
          <View style={seeAllStyles.emptyState}>
            <Text style={seeAllStyles.emptyText}>{loading ? 'Loading…' : 'No videos in this playlist yet.'}</Text>
          </View>
        )}
      </View>
    </ScreenWithWatermark>
  );
}
