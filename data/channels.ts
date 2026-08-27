// data/channels.ts
// FEATURED CHANNELS — content the app carries that is NOT a church branch.
//
// Kept deliberately separate from data/branches.ts. A branch is a physical
// OliveBrook location: it has a service schedule, its own live stream, and its
// sermons belong in the same sermon feeds as every other branch's. A featured
// channel is somebody's own voice — Pastor Yinka Jibril's podcast is hers, not
// a second Ikeja — so it must never be swept into the branch filter, the
// sermon classification, or the Library's series/services rows.
//
// Two registries, therefore, rather than one with a flag: the flag version
// would put the burden on every consumer to remember to exclude featured
// channels, and the first place someone forgot would silently mix a podcast
// episode into "Sunday Service".

export type FeaturedChannelId = 'yinka';

export interface FeaturedChannel {
  id: FeaturedChannelId;
  /** Display name — this is a person, so it leads with theirs. */
  name: string;
  /** One line under the name, saying what the channel IS. */
  tagline: string;
  /** How to credit an episode's speaker in the player. */
  speaker: string;
  /** Their role at the church, shown on their own page under the name. */
  role: string;
  channelId: string;
}

// RESOLVED — no placeholder needed.
// @yinkajibril was resolved to a channel id through the YouTube Data API's
// channels.list `forHandle` parameter, which is the documented way to turn a
// @handle into an id:
//
//   GET /youtube/v3/channels?part=id,snippet&forHandle=@yinkajibril
//   -> id "UCJn5-UlFahjdoquyV90LW3A", title "Yinka Jibril",
//      customUrl "@yinkajibril"  (13 videos at time of writing)
//
// Hardcoded rather than resolved at runtime: a handle can be changed by its
// owner but the channel id never changes, so looking it up on every launch
// would spend quota to re-derive a constant.
export const YINKA_CHANNEL_ID = 'UCJn5-UlFahjdoquyV90LW3A';

export const featuredChannels: FeaturedChannel[] = [
  {
    id: 'yinka',
    name: 'Pastor Yinka Jibril',
    tagline: 'Teaching, conversation and encouragement',
    speaker: 'Pst. Yinka Jibril',
    role: 'The OliveBrook Church',
    channelId: YINKA_CHANNEL_ID,
  },
];

export function getFeaturedChannel(id: FeaturedChannelId): FeaturedChannel | undefined {
  return featuredChannels.find((c) => c.id === id);
}
