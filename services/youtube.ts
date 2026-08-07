import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_ID = 'UC2iX9RmSZ6uAjFqi7putEaA';
// YouTube convention: swap the "UC" prefix for "UU" to get the channel's
// uploads playlist ID without spending an extra API call to look it up.
const UPLOADS_PLAYLIST_ID = 'UU' + CHANNEL_ID.slice(2);
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function requireApiKey() {
  if (!API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_YOUTUBE_API_KEY is not set. Add it to your .env file and to EAS (eas env:set).'
    );
  }
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  thumbnail: string;
  duration: string; // formatted, e.g. "42 min" — for display
  durationSeconds: number; // raw seconds — for classification (e.g. detecting short clips)
}

function isoDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}

/**
 * Pick the artwork for a 16:9 frame.
 *
 * YouTube's thumbnail sizes are NOT all the same shape, which is the trap:
 *   default  120x90    4:3
 *   medium   320x180   16:9
 *   high     480x360   4:3
 *   standard 640x480   4:3
 *   maxres   1280x720  16:9
 *
 * The 4:3 variants are the 16:9 frame letterboxed inside baked-in black bars.
 * Drop one of those into a 16:9 container and no `contentFit` can save it —
 * `cover` crops the picture to hide the bars, `contain` shows them. So only
 * the genuinely-16:9 sizes are eligible here.
 *
 * `medium` alone (the previous choice) is only 320px wide, which is fine for a
 * list row but visibly soft blown up to a full-width playlist hero — hence
 * preferring maxres and falling back, rather than the reverse.
 */
function pickThumbnail(thumbs: any): string {
  return thumbs?.maxres?.url ?? thumbs?.medium?.url ?? '';
}

function secondsToLabel(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

async function fetchPlaylistPage(playlistId: string, pageToken?: string) {
  const url = new URL(`${BASE_URL}/playlistItems`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', '50');
  url.searchParams.set('key', API_KEY!);
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube playlistItems failed: ${res.status}`);
  return res.json();
}

/**
 * Shared by fetchChannelUploads and fetchPlaylistItems — both are "list the
 * videos in a playlist" (the uploads playlist is just YouTube's built-in
 * playlist of everything a channel has posted), so they share the same
 * paging + duration-lookup logic instead of duplicating it.
 */
async function fetchPlaylistVideos(playlistId: string, cacheKey: string, cap = 500): Promise<YouTubeVideo[]> {
  requireApiKey();

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    const { videos, fetchedAt } = JSON.parse(cached);
    if (Date.now() - fetchedAt < CACHE_TTL_MS) return videos;
  }

  let items: any[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchPlaylistPage(playlistId, pageToken);
    items = items.concat(page.items);
    pageToken = page.nextPageToken;
  } while (pageToken && items.length < cap);

  const videoIds = items.map((i) => i.snippet.resourceId.videoId);
  const durationMap: Record<string, number> = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL(`${BASE_URL}/videos`);
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', batch.join(','));
    url.searchParams.set('key', API_KEY!);
    const res = await fetch(url.toString());
    const json = await res.json();
    for (const v of json.items ?? []) {
      durationMap[v.id] = isoDurationToSeconds(v.contentDetails.duration);
    }
  }

  const videos: YouTubeVideo[] = items
    // Playlist items can reference a video that was deleted/privated —
    // resourceId still shows up but there's no duration for it. Skip those
    // rather than showing a broken "0 min" card for something unplayable.
    .filter((i) => durationMap[i.snippet.resourceId.videoId] !== undefined)
    .map((i) => {
      const durationSeconds = durationMap[i.snippet.resourceId.videoId];
      return {
        videoId: i.snippet.resourceId.videoId,
        title: i.snippet.title,
        publishedAt: i.snippet.publishedAt.slice(0, 10),
        thumbnail: pickThumbnail(i.snippet.thumbnails),
        duration: secondsToLabel(durationSeconds),
        durationSeconds,
      };
    });

  await AsyncStorage.setItem(cacheKey, JSON.stringify({ videos, fetchedAt: Date.now() }));
  return videos;
}

/**
 * Pulls every video off the channel's uploads playlist. 1 quota unit per
 * page of 50 (cheap), plus 1 unit per 50 IDs for durations. Capped at 500
 * videos for now — plenty of headroom for classification (see
 * utils/contentGrouping.ts) to have enough history to detect recurring
 * services and series confidently; raise the cap later if the channel
 * outgrows it.
 */
export async function fetchChannelUploads(): Promise<YouTubeVideo[]> {
  return fetchPlaylistVideos(UPLOADS_PLAYLIST_ID, 'yt:uploads', 500);
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  itemCount: number;
  thumbnail: string;
}

/**
 * Real curated playlists from the channel (e.g. "Pastor Abu's Sermons",
 * "Take 5 with PY") — these are the authoritative source for a
 * collection when the channel has bothered to make one, more reliable
 * than guessing from titles. 1 quota unit.
 */
export async function fetchChannelPlaylists(): Promise<YouTubePlaylist[]> {
  requireApiKey();

  const cacheKey = 'yt:playlists';
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    const { playlists, fetchedAt } = JSON.parse(cached);
    if (Date.now() - fetchedAt < CACHE_TTL_MS) return playlists;
  }

  const url = new URL(`${BASE_URL}/playlists`);
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('maxResults', '50');
  url.searchParams.set('key', API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube playlists failed: ${res.status}`);
  const json = await res.json();

  const playlists: YouTubePlaylist[] = (json.items ?? [])
    // Empty playlists (0 items) aren't worth a circle on Library — usually
    // leftover drafts, not something a visitor should tap into.
    .filter((p: any) => p.contentDetails.itemCount > 0)
    .map((p: any) => ({
      id: p.id,
      title: p.snippet.title,
      itemCount: p.contentDetails.itemCount,
      thumbnail: pickThumbnail(p.snippet.thumbnails),
    }));

  await AsyncStorage.setItem(cacheKey, JSON.stringify({ playlists, fetchedAt: Date.now() }));
  return playlists;
}

/** Videos inside one specific playlist — used when a user taps into a playlist. */
export async function fetchPlaylistItems(playlistId: string): Promise<YouTubeVideo[]> {
  return fetchPlaylistVideos(playlistId, `yt:playlist:${playlistId}`);
}

/**
 * Checks whether the channel is live right now. Uses search.list, which
 * costs 100 quota units per call (vs 1 for most YouTube API calls) — the
 * free daily quota is 10,000 units, so this can only run ~100x/day.
 *
 * This is now the PRIMARY live signal for the whole app (the schedule in
 * data/services.ts is only a fallback when this can't answer — see
 * hooks/useLiveStatus.ts), so it's called more often than before. The
 * maxAgeMs cache below is what makes that affordable: callers pass how
 * stale an answer they can tolerate (tight during service windows, loose
 * outside them), and anything fresher than that is served from
 * AsyncStorage without spending the 100 units.
 */
const LIVE_CACHE_KEY = 'yt:liveStatus';

export type LiveCheckResult =
  | { isLive: true; videoId: string; title: string }
  | { isLive: false };

export async function checkChannelLive(maxAgeMs = 5 * 60 * 1000): Promise<LiveCheckResult> {
  requireApiKey();

  try {
    const cached = await AsyncStorage.getItem(LIVE_CACHE_KEY);
    if (cached) {
      const { result, fetchedAt } = JSON.parse(cached);
      if (Date.now() - fetchedAt < maxAgeMs) return result;
    }
  } catch {
    // Cache read failing just means a fresh fetch — never fatal.
  }

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('eventType', 'live');
  url.searchParams.set('type', 'video');
  url.searchParams.set('key', API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`);
  const json = await res.json();

  const result: LiveCheckResult =
    json.items && json.items.length > 0
      ? { isLive: true, videoId: json.items[0].id.videoId, title: json.items[0].snippet.title }
      : { isLive: false };

  await AsyncStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ result, fetchedAt: Date.now() }));
  return result;
}
