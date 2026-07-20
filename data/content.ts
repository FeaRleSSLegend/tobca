// data/content.ts
// Shaped exactly like a future GET /content API response would be.
// videoId marked "REPLACE_ME" needs a real ID from youtube.com/@TheOliveBrookChurch —
// two entries below use real IDs found via search, everything else is placeholder.

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
    id: 's1-1', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '38 min',
    videoId: 'REPLACE_ME_S1_1', series: 'The Manifold Grace of God', type: 'series',
    publishedAt: '2026-02-01',
  },
  {
    id: 's1-2', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '41 min',
    videoId: 'REPLACE_ME_S1_2', series: 'The Manifold Grace of God', type: 'series',
    publishedAt: '2026-02-08',
  },
  {
    id: 's1-3', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '36 min',
    videoId: 'REPLACE_ME_S1_3', series: 'The Manifold Grace of God', type: 'series',
    publishedAt: '2026-02-15',
  },
  {
    id: 's2-1', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '44 min',
    videoId: 'REPLACE_ME_S2_1', series: 'The Law of Manifestation', type: 'series',
    publishedAt: '2026-03-01',
  },
  {
    id: 's2-2', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '39 min',
    videoId: 'REPLACE_ME_S2_2', series: 'The Law of Manifestation', type: 'series',
    publishedAt: '2026-03-08',
  },
  {
    id: 's3-1', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '45 min',
    videoId: 'REPLACE_ME_S3_1', series: 'Moving from Prophecy to Manifestation', type: 'series',
    publishedAt: '2026-04-05',
  },
  {
    id: 's3-2', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '40 min',
    videoId: 'REPLACE_ME_S3_2', series: 'Moving from Prophecy to Manifestation', type: 'series',
    publishedAt: '2026-04-12',
  },
  {
    id: 's4-1', title: 'REPLACE_ME', speaker: 'Pst. Yinka Jibril', duration: '37 min',
    videoId: 'REPLACE_ME_S4_1', series: 'The Person & Work of the Holy Spirit', type: 'series',
    publishedAt: '2026-05-03',
  },
  {
    id: 's4-2', title: 'REPLACE_ME', speaker: 'Pst. Yinka Jibril', duration: '42 min',
    videoId: 'REPLACE_ME_S4_2', series: 'The Person & Work of the Holy Spirit', type: 'series',
    publishedAt: '2026-05-10',
  },
  {
    id: 's5-1', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '43 min',
    videoId: 'REPLACE_ME_S5_1', series: 'New Creation Realities', type: 'series',
    publishedAt: '2026-06-07',
  },
  {
    id: 's5-2', title: 'REPLACE_ME', speaker: 'Pst. Abu Jibril', duration: '38 min',
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



