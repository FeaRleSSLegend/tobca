// data/content.ts
// The pure helpers every screen uses to slice a Message list — "latest",
// "recently added", "audio-only", "series" — plus a re-export of the Message
// type so existing imports (`from '../data/content'`) keep resolving.
//
// THE MOCK CATALOGUE THAT USED TO LIVE HERE IS GONE.
// This file opened with `mockSeed`: seventeen invented sermons ("Commanding
// The Year 2024", "The Manifold Grace of God — Part 1/2/3", …) with invented
// speakers, invented durations and invented publish dates, sixteen of which
// carried a videoId of REPLACE_ME_*. From them it derived `messages`,
// `currentlyStreaming`, `latestMessages`, `recentlyAdded`, `seriesList` and a
// hand-set `liveState` claiming a Sunday service was on air.
//
// None of it was reachable any more — hooks/useMessages stopped seeding from
// it when the YouTube adapter landed (see the "NO MOCK SEEDING" note there),
// and every screen now imports only the functions below. But it was still the
// first thing anyone opening this file read, it still described a catalogue of
// videos that does not exist, and PlayerHost still carried REPLACE_ME guards
// for the day one of them reached it. A fake catalogue that nothing renders is
// not harmless: it is the version of the content model people trust when they
// come here to see what a Message looks like. contentModel.ts is that
// reference, and it is the real one.
//
// The functions below are unchanged and operate on whatever list is passed in,
// which is what made deleting the data a deletion rather than a rewrite.

import { Message, MessageType } from './contentModel';

export type { Message, MessageType };
export {
  makeMessageId,
  parseMessageId,
  primaryVariant,
  hasAudio,
  hasVideo,
  formatDuration,
} from './contentModel';

// --- Pure helpers below operate on whatever array is passed in. ---

/**
 * Audio-only messages, for the Library's Audio page.
 *
 * "Audio-only" means the message has an audio variant and NO video variant.
 * That distinction matters: a normal sermon carries both (the YouTube video
 * plus the audio the player extracts from it), and listing those here would
 * make the Audio page a near-duplicate of the Video page rather than its own
 * shelf. What belongs here is the material that exists ONLY as audio —
 * mid-week teachings, phone recordings, anything the Telegram ingestion
 * pipeline will drop in without a video counterpart.
 *
 * Returns [] today, and that is expected rather than a gap: no source
 * currently produces audio-only messages. The Audio page renders its empty
 * state off this. When the ingestion bot lands and starts emitting
 * `source: 'telegram'` messages with a single `kind: 'audio'` variant, they
 * appear here with no change to this function or to the screen.
 */
export function getAudioMessages(list: Message[]): Message[] {
  return [...list]
    .filter((m) => hasAudioOnly(m))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function hasAudioOnly(m: Message): boolean {
  return m.media.some((v) => v.kind === 'audio') && !m.media.some((v) => v.kind === 'video');
}

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



