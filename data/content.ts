// data/content.ts
// Shaped exactly like a future GET /content API response would be.
// videoId marked "REPLACE_ME_*" needs a real ID from youtube.com/@TheOliveBrookChurch —
// two entries below use real IDs found via search, everything else is a stub
// (fine — videoId isn't rendered anywhere, only used once real playback is wired up).
// Series episode titles were literally "REPLACE_ME" and rendering that way on
// screen (visible in the Recently Added grid) — given real placeholder titles
// derived from their series + part number until the real ones are supplied.

export type MessageType = 'sermon' | 'series' | 'audio' | 'video';

export interface Message {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  videoId: string;
  series?: string;
  type: MessageType;
  publishedAt: string; // ISO date
  thumbnail?: string; // YouTube thumbnail URL — undefined for mock entries, real for fetched ones
}

export const messages: Message[] = [
  {
    id: '1',
    title: 'How to Make Your Relationship & Marriage Work',
    speaker: 'Pst. Abu Jibril',
    duration: '42 min',
    videoId: 'REPLACE_ME_1',
    series: 'Relationships',
    type: 'sermon',
    publishedAt: '2026-06-28',
  },
  {
    id: '2',
    title: 'Commanding The Year 2024',
    speaker: 'Pst. Abu Jibril',
    duration: '38 min',
    videoId: 'REPLACE_ME_2',
    series: 'Commanding 2024',
    type: 'sermon',
    publishedAt: '2026-01-05',
  },
  {
    id: '3',
    title: 'How To Thrive In Difficult Times',
    speaker: 'Pst. Yinka Jibril',
    duration: '35 min',
    videoId: 'REPLACE_ME_3',
    series: 'Difficult Times',
    type: 'sermon',
    publishedAt: '2026-05-10',
  },
  {
    id: '4',
    title: 'Mercy Triggers Miracles',
    speaker: 'Pst. Abu Jibril',
    duration: '40 min',
    videoId: 'REPLACE_ME_4',
    series: 'Mercy Triggers',
    type: 'sermon',
    publishedAt: '2026-04-19',
  },
  {
    id: '5',
    title: 'Wealth Creation Summit — Day 1',
    speaker: 'Guest Speaker',
    duration: '51 min',
    videoId: 'REPLACE_ME_5',
    type: 'sermon',
    publishedAt: '2026-03-14',
  },
  {
    // Real video — a guest ministration actually uploaded on OliveBrook's channel.
    // Good one to test the video player against real YouTube data.
    id: 'real-1',
    title: 'Making Grace Manifest',
    speaker: 'Apostle Joshua Selman',
    duration: '58 min',
    videoId: 'OqWREz-etjE',
    type: 'video',
    publishedAt: '2023-04-05',
  },
  {
    id: 's1-1', title: 'The Manifold Grace of God — Part 1', speaker: 'Pst. Abu Jibril', duration: '38 min',
    videoId: 'REPLACE_ME_S1_1', series: 'The Manifold Grace of God', type: 'series',
    publishedAt: '2026-02-01',
  },
  {
    id: 's1-2', title: 'The Manifold Grace of God — Part 2', speaker: 'Pst. Abu Jibril', duration: '41 min',
    videoId: 'REPLACE_ME_S1_2', series: 'The Manifold Grace of God', type: 'series',
    publishedAt: '2026-02-08',
  },
  {
    id: 's1-3', title: 'The Manifold Grace of God — Part 3', speaker: 'Pst. Abu Jibril', duration: '36 min',
    videoId: 'REPLACE_ME_S1_3', series: 'The Manifold Grace of God', type: 'series',
    publishedAt: '2026-02-15',
  },
  {
    id: 's2-1', title: 'The Law of Manifestation — Part 1', speaker: 'Pst. Abu Jibril', duration: '44 min',
    videoId: 'REPLACE_ME_S2_1', series: 'The Law of Manifestation', type: 'series',
    publishedAt: '2026-03-01',
  },
  {
    id: 's2-2', title: 'The Law of Manifestation — Part 2', speaker: 'Pst. Abu Jibril', duration: '39 min',
    videoId: 'REPLACE_ME_S2_2', series: 'The Law of Manifestation', type: 'series',
    publishedAt: '2026-03-08',
  },
  {
    id: 's3-1', title: 'Moving from Prophecy to Manifestation — Part 1', speaker: 'Pst. Abu Jibril', duration: '45 min',
    videoId: 'REPLACE_ME_S3_1', series: 'Moving from Prophecy to Manifestation', type: 'series',
    publishedAt: '2026-04-05',
  },
  {
    id: 's3-2', title: 'Moving from Prophecy to Manifestation — Part 2', speaker: 'Pst. Abu Jibril', duration: '40 min',
    videoId: 'REPLACE_ME_S3_2', series: 'Moving from Prophecy to Manifestation', type: 'series',
    publishedAt: '2026-04-12',
  },
  {
    id: 's4-1', title: 'The Person & Work of the Holy Spirit — Part 1', speaker: 'Pst. Yinka Jibril', duration: '37 min',
    videoId: 'REPLACE_ME_S4_1', series: 'The Person & Work of the Holy Spirit', type: 'series',
    publishedAt: '2026-05-03',
  },
  {
    id: 's4-2', title: 'The Person & Work of the Holy Spirit — Part 2', speaker: 'Pst. Yinka Jibril', duration: '42 min',
    videoId: 'REPLACE_ME_S4_2', series: 'The Person & Work of the Holy Spirit', type: 'series',
    publishedAt: '2026-05-10',
  },
  {
    id: 's5-1', title: 'New Creation Realities — Part 1', speaker: 'Pst. Abu Jibril', duration: '43 min',
    videoId: 'REPLACE_ME_S5_1', series: 'New Creation Realities', type: 'series',
    publishedAt: '2026-06-07',
  },
  {
    id: 's5-2', title: 'New Creation Realities — Part 2', speaker: 'Pst. Abu Jibril', duration: '38 min',
    videoId: 'REPLACE_ME_S5_2', series: 'New Creation Realities', type: 'series',
    publishedAt: '2026-06-14',
  },
];

export const currentlyStreaming = messages[0];

// Live state — for now this is a hand-set flag, matching the Live-screen
// redesign decision (real state, not hardcoded "LIVE NOW" always).
// Swap `isLive: true` manually to test both card states until real
// schedule-based logic is wired in.
export const liveState = {
  isLive: true,
  title: 'Sunday Service',
  subtitle: 'Second Service · Pst. Abu Jibril',
};

export const latestMessages = [...messages]
    .sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0,2)


// Derived from messages with type: 'series' — groups by series name,
// counts how many episodes exist for each. Add episodes to `messages`
// and this list updates itself, no manual bookkeeping.
export const seriesList = Array.from(
  new Set(messages.filter((m) => m.type === 'series' && m.series).map((m) => m.series))
).map((name) => ({
  name: name as string,
  count: messages.filter((m) => m.series === name).length,
}));

// Add this after seriesList
export const recentlyAdded = [...messages]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 4); // Show 4 most recent

// --- Pure helpers below: same derivations as above, but operating on
// whatever array is passed in rather than the static `messages` mock.
// Screens now on real data (see hooks/useMessages.ts) call these with the
// live-fetched array instead of relying on the static exports above,
// which stay in place as a fallback if the fetch fails or hasn't
// resolved yet.

export function getLatestMessages(list: Message[], count = 2): Message[] {
  return [...list]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
}

export function getRecentlyAdded(list: Message[], count = 4): Message[] {
  return [...list]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
}

export function getSeriesList(list: Message[]) {
  return Array.from(
    new Set(list.filter((m) => m.type === 'series' && m.series).map((m) => m.series))
  ).map((name) => ({
    name: name as string,
    count: list.filter((m) => m.series === name).length,
  }));
}

export function getCurrentlyStreaming(list: Message[]): Message | undefined {
  return list[0];
}



