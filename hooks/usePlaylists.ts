import { useEffect, useState } from 'react';
import { fetchChannelPlaylists, PlaceholderChannelError, YouTubePlaylist } from '../services/youtube';
import { getPrimaryBranch } from '../data/branches';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Curated playlists are the main church channel's; branches don't each
    // maintain their own, so this stays pinned to the primary branch.
    fetchChannelPlaylists(getPrimaryBranch().channelId)
      .then((p) => {
        if (!cancelled) setPlaylists(p);
      })
      .catch((e) => {
        if (!(e instanceof PlaceholderChannelError)) console.warn('Playlists fetch failed:', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { playlists, loading };
}
