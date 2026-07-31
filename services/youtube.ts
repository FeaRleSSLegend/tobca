import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_ID = 'UC2iX9RmSZ6uAjFqi7putEaA';
// YouTube convention: swap the "UC" prefix for "UU" to get the channel's
// uploads playlist ID without spending an extra API call to look it up.
const UPLOADS_PLAYLIST_ID = 'UU' + CHANNEL_ID.slice(2);
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  thumbnail: string;
  duration: string; // e.g. "42 min"
}

function isoDurationToLabel(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

async function fetchUploadsPage(pageToken?: string) {
  const url = new URL(`${BASE_URL}/playlistItems`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', UPLOADS_PLAYLIST_ID);
  url.searchParams.set('maxResults', '25');
  url.searchParams.set('key', API_KEY!);
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube playlistItems failed: ${res.status}`);
  return res.json();
}

/**
 * Pulls every video off the channel's uploads playlist (1 quota unit per
 * page of 25 — cheap), then a single videos.list call to get durations for
 * all of them (1 unit, batched up to 50 IDs per call). Cached to
 * AsyncStorage for an hour since the sermon list doesn't change minute to
 * minute — no reason to re-fetch on every screen visit.
 */
export async function fetchChannelUploads(): Promise<YouTubeVideo[]> {
  if (!API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_YOUTUBE_API_KEY is not set. Add it to your .env file and to EAS (eas env:create).'
    );
  }

  const cacheKey = 'yt:uploads';
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    const { videos, fetchedAt } = JSON.parse(cached);
    if (Date.now() - fetchedAt < 60 * 60 * 1000) {
      return videos;
    }
  }

  let items: any[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchUploadsPage(pageToken);
    items = items.concat(page.items);
    pageToken = page.nextPageToken;
  } while (pageToken && items.length < 100); // cap at 100 videos for now

  const videoIds = items.map((i) => i.snippet.resourceId.videoId);
  const durationMap: Record<string, string> = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL(`${BASE_URL}/videos`);
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', batch.join(','));
    url.searchParams.set('key', API_KEY);
    const res = await fetch(url.toString());
    const json = await res.json();
    for (const v of json.items ?? []) {
      durationMap[v.id] = isoDurationToLabel(v.contentDetails.duration);
    }
  }

  const videos: YouTubeVideo[] = items.map((i) => ({
    videoId: i.snippet.resourceId.videoId,
    title: i.snippet.title,
    publishedAt: i.snippet.publishedAt.slice(0, 10),
    thumbnail: i.snippet.thumbnails?.medium?.url ?? '',
    duration: durationMap[i.snippet.resourceId.videoId] ?? '',
  }));

  await AsyncStorage.setItem(cacheKey, JSON.stringify({ videos, fetchedAt: Date.now() }));
  return videos;
}

/**
 * Checks whether the channel is live right now. Uses search.list, which
 * costs 100 quota units per call (vs 1 for most YouTube API calls) — the
 * free daily quota is 10,000 units, so this can only run ~100x/day.
 * Callers should NOT poll this continuously; only call it near a scheduled
 * service window (see hooks/useLiveStatus.ts, which already handles this).
 */
export async function checkChannelLive(): Promise<
  { isLive: true; videoId: string; title: string } | { isLive: false }
> {
  if (!API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_YOUTUBE_API_KEY is not set. Add it to your .env file and to EAS (eas env:create).'
    );
  }

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('eventType', 'live');
  url.searchParams.set('type', 'video');
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`);
  const json = await res.json();

  if (json.items && json.items.length > 0) {
    const item = json.items[0];
    return { isLive: true, videoId: item.id.videoId, title: item.snippet.title };
  }
  return { isLive: false };
}
