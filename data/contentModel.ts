// data/contentModel.ts
// The normalized content model from the architecture doc. Every content
// source (YouTube today; Telegram audio and a second branch later) maps
// into this ONE shape, so the rest of the app never knows or cares where a
// message came from. This is the foundation that makes multi-source and
// multi-branch a plug-in rather than a rewrite.
//
// Design decisions, straight from the architecture doc:
//  - Composite globally-unique id: `${source}:${branch}:${externalId}`.
//    Unique by construction, carries its own provenance, and never
//    collides across branches or sources. This is what retires the whole
//    class of duplicate-key bugs at the root.
//  - Media as VARIANTS on one message, not separate items. A message can
//    have a video (YouTube) and/or an audio (Telegram) variant; playback
//    picks between them. Today everything has exactly one video variant,
//    but the shape is ready for audio with zero later migration.
//  - Backward-compatible accessors (videoId, duration) so the existing
//    screens keep working through the transition instead of all breaking
//    at once.

import { BranchId } from './branches';
import { FeaturedChannelId } from './channels';

export type ContentSource = 'youtube' | 'telegram';

/**
 * Who a message belongs to: a church branch, or a featured non-branch channel
 * (see data/channels.ts). Both need a slot in the composite id so provenance
 * stays readable and ids can never collide — `youtube:kubwa:abc` vs
 * `youtube:yinka:abc` — but only branches appear in the branch filter, and
 * only branch content goes through sermon classification.
 */
export type ContentOwnerId = BranchId | FeaturedChannelId;

export type MessageType = 'sermon' | 'series' | 'audio' | 'video' | 'service';

export interface MediaVariant {
  kind: 'video' | 'audio';
  source: ContentSource;
  // The source-native id: a YouTube videoId, or later a Telegram file id.
  externalId: string;
  durationSeconds: number;
  // Audio-only, for download UX later (video streams from YouTube, so it
  // has no meaningful pre-download size).
  sizeBytes?: number;
}

export interface Message {
  // Composite: `${source}:${branch}:${externalId}`. Treat as opaque —
  // build it with makeMessageId, never hand-concatenate at call sites.
  id: string;

  source: ContentSource;
  branchId: ContentOwnerId;

  title: string;
  speaker: string;
  publishedAt: string; // ISO date (YYYY-MM-DD)
  thumbnail?: string;
  type: MessageType;
  series?: string; // assigned by classification; stable across sources

  // Every playable form of this message. Ordered by preference (video
  // first today). Guaranteed non-empty for anything playable.
  media: MediaVariant[];

  // ---- Backward-compatible convenience accessors ----
  // These duplicate data now living in `media`, so screens written against
  // the old flat shape (videoId, duration, durationSeconds) keep working
  // unchanged. New code should prefer the structured fields; these are a
  // migration bridge, not the model.
  videoId: string; // primary video variant's externalId ('' if audio-only)
  duration: string; // formatted label, e.g. "42 min"
  durationSeconds?: number; // primary variant's raw seconds
}

// Build the one true id. Keeping this in a function means the format lives
// in exactly one place and can evolve without a find-and-replace.
export function makeMessageId(source: ContentSource, branchId: ContentOwnerId, externalId: string): string {
  return `${source}:${branchId}:${externalId}`;
}

// Parse a composite id back into parts — useful for debugging, analytics,
// and provenance checks. Tolerant of externalIds that themselves contain
// colons (rare, but YouTube ids never do; Telegram ids might).
export function parseMessageId(id: string): { source: string; branchId: string; externalId: string } | null {
  const first = id.indexOf(':');
  const second = id.indexOf(':', first + 1);
  if (first === -1 || second === -1) return null;
  return {
    source: id.slice(0, first),
    branchId: id.slice(first + 1, second),
    externalId: id.slice(second + 1),
  };
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

// The primary playable variant — video if present, else the first audio.
// Playback and the convenience accessors both read through this so
// "which media do we play" is decided in exactly one place.
export function primaryVariant(m: Message): MediaVariant | undefined {
  return m.media.find((v) => v.kind === 'video') ?? m.media[0];
}

export function hasAudio(m: Message): boolean {
  return m.media.some((v) => v.kind === 'audio');
}

export function hasVideo(m: Message): boolean {
  return m.media.some((v) => v.kind === 'video');
}

/**
 * The single constructor every source adapter funnels through. Give it the
 * essentials; it derives the composite id, the media array, and the
 * backward-compat accessors so those can never drift out of sync with the
 * structured fields. A source adapter should never build a Message literal
 * by hand — it calls this.
 */
export function buildMessage(input: {
  source: ContentSource;
  branchId: ContentOwnerId;
  externalId: string;
  title: string;
  speaker: string;
  publishedAt: string;
  type: MessageType;
  thumbnail?: string;
  series?: string;
  media: MediaVariant[];
}): Message {
  const id = makeMessageId(input.source, input.branchId, input.externalId);
  const primary = input.media.find((v) => v.kind === 'video') ?? input.media[0];
  return {
    id,
    source: input.source,
    branchId: input.branchId,
    title: input.title,
    speaker: input.speaker,
    publishedAt: input.publishedAt,
    thumbnail: input.thumbnail,
    type: input.type,
    series: input.series,
    media: input.media,
    videoId: primary && primary.kind === 'video' ? primary.externalId : '',
    duration: primary ? formatDuration(primary.durationSeconds) : '',
    durationSeconds: primary?.durationSeconds,
  };
}
