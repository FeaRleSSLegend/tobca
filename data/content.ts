// data/content.ts
// Mock content, now built through the normalized content model
// (data/contentModel.ts). Every entry is a source-tagged, branch-tagged
// Message with a composite id and a media-variant array — identical in
// shape to what a real source adapter produces, so screens see no
// difference between mock and live data. The Message type itself lives in
// contentModel.ts and is re-exported here so existing imports
// (`from '../data/content'`) keep resolving unchanged.

import {
  Message,
  MessageType,
  buildMessage,
} from './contentModel';
import { PRIMARY_BRANCH_ID } from './branches';

export type { Message, MessageType };
export {
  makeMessageId,
  parseMessageId,
  primaryVariant,
  hasAudio,
  hasVideo,
  formatDuration,
} from './contentModel';

// Mock seed data. `ext` is the source-native id (a YouTube videoId, real
// where known, REPLACE_ME_* stub otherwise). buildMessage turns each row
// into a full normalized Message — composite id, media array, and the
// backward-compat accessors — so nothing downstream hand-assembles a
// Message literal.
interface MockSeed {
  ext: string;
  title: string;
  speaker: string;
  minutes: number;
  type: MessageType;
  publishedAt: string;
  series?: string;
  thumbnail?: string;
}

const mockSeed: MockSeed[] = [
  { ext: 'REPLACE_ME_1', title: 'How to Make Your Relationship & Marriage Work', speaker: 'Pst. Abu Jibril', minutes: 42, series: 'Relationships', type: 'sermon', publishedAt: '2026-06-28' },
  { ext: 'REPLACE_ME_2', title: 'Commanding The Year 2024', speaker: 'Pst. Abu Jibril', minutes: 38, series: 'Commanding 2024', type: 'sermon', publishedAt: '2026-01-05' },
  { ext: 'REPLACE_ME_3', title: 'How To Thrive In Difficult Times', speaker: 'Pst. Yinka Jibril', minutes: 35, series: 'Difficult Times', type: 'sermon', publishedAt: '2026-05-10' },
  { ext: 'REPLACE_ME_4', title: 'Mercy Triggers Miracles', speaker: 'Pst. Abu Jibril', minutes: 40, series: 'Mercy Triggers', type: 'sermon', publishedAt: '2026-04-19' },
  { ext: 'REPLACE_ME_5', title: 'Wealth Creation Summit — Day 1', speaker: 'Guest Speaker', minutes: 51, type: 'sermon', publishedAt: '2026-03-14' },
  // Real video — a guest ministration actually on OliveBrook's channel.
  // The one entry with a real, playable videoId — use it to test the player.
  { ext: 'OqWREz-etjE', title: 'Making Grace Manifest', speaker: 'Apostle Joshua Selman', minutes: 58, type: 'video', publishedAt: '2023-04-05' },
  { ext: 'REPLACE_ME_S1_1', title: 'The Manifold Grace of God — Part 1', speaker: 'Pst. Abu Jibril', minutes: 38, series: 'The Manifold Grace of God', type: 'series', publishedAt: '2026-02-01' },
  { ext: 'REPLACE_ME_S1_2', title: 'The Manifold Grace of God — Part 2', speaker: 'Pst. Abu Jibril', minutes: 41, series: 'The Manifold Grace of God', type: 'series', publishedAt: '2026-02-08' },
  { ext: 'REPLACE_ME_S1_3', title: 'The Manifold Grace of God — Part 3', speaker: 'Pst. Abu Jibril', minutes: 36, series: 'The Manifold Grace of God', type: 'series', publishedAt: '2026-02-15' },
  { ext: 'REPLACE_ME_S2_1', title: 'The Law of Manifestation — Part 1', speaker: 'Pst. Abu Jibril', minutes: 44, series: 'The Law of Manifestation', type: 'series', publishedAt: '2026-03-01' },
  { ext: 'REPLACE_ME_S2_2', title: 'The Law of Manifestation — Part 2', speaker: 'Pst. Abu Jibril', minutes: 39, series: 'The Law of Manifestation', type: 'series', publishedAt: '2026-03-08' },
  { ext: 'REPLACE_ME_S3_1', title: 'Moving from Prophecy to Manifestation — Part 1', speaker: 'Pst. Abu Jibril', minutes: 45, series: 'Moving from Prophecy to Manifestation', type: 'series', publishedAt: '2026-04-05' },
  { ext: 'REPLACE_ME_S3_2', title: 'Moving from Prophecy to Manifestation — Part 2', speaker: 'Pst. Abu Jibril', minutes: 40, series: 'Moving from Prophecy to Manifestation', type: 'series', publishedAt: '2026-04-12' },
  { ext: 'REPLACE_ME_S4_1', title: 'The Person & Work of the Holy Spirit — Part 1', speaker: 'Pst. Yinka Jibril', minutes: 37, series: 'The Person & Work of the Holy Spirit', type: 'series', publishedAt: '2026-05-03' },
  { ext: 'REPLACE_ME_S4_2', title: 'The Person & Work of the Holy Spirit — Part 2', speaker: 'Pst. Yinka Jibril', minutes: 42, series: 'The Person & Work of the Holy Spirit', type: 'series', publishedAt: '2026-05-10' },
  { ext: 'REPLACE_ME_S5_1', title: 'New Creation Realities — Part 1', speaker: 'Pst. Abu Jibril', minutes: 43, series: 'New Creation Realities', type: 'series', publishedAt: '2026-06-07' },
  { ext: 'REPLACE_ME_S5_2', title: 'New Creation Realities — Part 2', speaker: 'Pst. Abu Jibril', minutes: 38, series: 'New Creation Realities', type: 'series', publishedAt: '2026-06-14' },
];

export const messages: Message[] = mockSeed.map((s) =>
  buildMessage({
    source: 'youtube',
    branchId: PRIMARY_BRANCH_ID,
    externalId: s.ext,
    title: s.title,
    speaker: s.speaker,
    publishedAt: s.publishedAt,
    type: s.type,
    series: s.series,
    thumbnail: s.thumbnail,
    // Mock durations are known only as minutes; real fetched entries carry
    // exact seconds. A whole-minute conversion is fine for mock data.
    media: [{ kind: 'video', source: 'youtube', externalId: s.ext, durationSeconds: s.minutes * 60 }],
  })
);

export const currentlyStreaming = messages[0];

// Live state — hand-set flag kept for any screen still referencing it.
export const liveState = {
  isLive: true,
  title: 'Sunday Service',
  subtitle: 'Second Service · Pst. Abu Jibril',
};

export const latestMessages = [...messages]
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  .slice(0, 2);

export const seriesList = Array.from(
  new Set(messages.filter((m) => m.type === 'series' && m.series).map((m) => m.series))
).map((name) => ({
  name: name as string,
  count: messages.filter((m) => m.series === name).length,
}));

export const recentlyAdded = [...messages]
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  .slice(0, 4);

// --- Pure helpers below operate on whatever array is passed in. ---

export function getLatestMessages(list: Message[], count = 2): Message[] {
  return [...list]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
}

// Recently Added shows only genuinely recent uploads — anything older
// than ~2 months isn't "recent" to a person, it's just the archive, and
// the Series/Services collections are where the archive lives.
const RECENT_MAX_AGE_DAYS = 62;

export function getRecentlyAdded(list: Message[], count = 4, maxAgeDays = RECENT_MAX_AGE_DAYS): Message[] {
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  return [...list]
    .filter((m) => new Date(m.publishedAt).getTime() >= cutoff)
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



