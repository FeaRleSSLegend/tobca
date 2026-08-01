import { useEffect, useState } from 'react';
import { fetchChannelPlaylists, YouTubePlaylist } from '../services/youtube';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchChannelPlaylists()
      .then((p) => {
        if (!cancelled) setPlaylists(p);
      })
      .catch((e) => console.warn('Playlists fetch failed:', e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { playlists, loading };
}
