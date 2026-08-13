// data/socials.ts
// The one place social handles live.
//
// LINK-OUT ONLY for Instagram. Meta only permits fetching or embedding IG
// content through a business-verified, app-reviewed Graph API setup, and the
// unofficial endpoints that appear to work are both against their terms and
// liable to break without warning. YouTube is different — the app genuinely
// plays that content in-app — but the links here are still just links: a way
// to go and SUBSCRIBE, which is a different job from watching.
//
// Handles are stored BARE (no URL, no query string). The share sheet hands out
// links like instagram.com/theolivebrookchurch?igsh=MWx5… and that igsh
// parameter is a share-attribution token tied to whoever copied it — storing it
// would attribute every tap in the app to one person's share, forever.

import { KUBWA_CHANNEL_ID, WUSE2_CHANNEL_ID } from './branches';
import { YINKA_CHANNEL_ID } from './channels';

export type SocialPlatform = 'instagram' | 'youtube';

/** Which group a row belongs to on the Socials screen. */
export type SocialSection = 'pastors' | 'church';

export interface SocialAccount {
  id: string;
  /** Who the account belongs to. */
  name: string;
  platform: SocialPlatform;
  section: SocialSection;
  /**
   * Instagram: bare handle, no @, no URL.
   * YouTube: the channel ID (UC…), because a channel's @handle can be changed
   * by its owner while the id never can.
   */
  handle: string;
  /** Shown under the name. For YouTube this is the @handle, which is friendlier
   *  to read than a UC… id. */
  display: string;
}

// ---------------------------------------------------------------------------
// >>> CHECK ME <<<
// Instagram shows this account as "official_abujibril" (with an underscore) in
// the app's own search results. The brief gave it as "officialabujibril"
// without one. Instagram's search is the more authoritative source of the two,
// so that is what is stored — but the two spellings are different accounts, and
// if the no-underscore form is the real one this single constant is the fix.
// ---------------------------------------------------------------------------
export const ABU_INSTAGRAM = 'official_abujibril';

export const socialAccounts: SocialAccount[] = [
  // ---- Pastors ----
  {
    id: 'yinka-ig',
    name: 'Pastor Yinka Jibril',
    platform: 'instagram',
    section: 'pastors',
    handle: 'yinkajibril',
    display: '@yinkajibril',
  },
  {
    id: 'yinka-yt',
    name: 'Pastor Yinka Jibril',
    platform: 'youtube',
    section: 'pastors',
    handle: YINKA_CHANNEL_ID,
    display: '@yinkajibril',
  },
  {
    id: 'abu-ig',
    name: 'Pastor Abu Jibril',
    platform: 'instagram',
    section: 'pastors',
    handle: ABU_INSTAGRAM,
    display: `@${ABU_INSTAGRAM}`,
  },
  // No YouTube row for Pastor Abu — he has no channel. Omitted entirely rather
  // than shown disabled: a greyed-out row invites "when is this coming?", and
  // the honest answer is "never", which a placeholder cannot say.

  // ---- Church channels ----
  {
    id: 'tobc-ig',
    name: 'The OliveBrook Church',
    platform: 'instagram',
    section: 'church',
    handle: 'theolivebrookchurch',
    display: '@theolivebrookchurch',
  },
  {
    id: 'tobc-yt',
    name: 'The OliveBrook Church, Kubwa',
    platform: 'youtube',
    section: 'church',
    handle: KUBWA_CHANNEL_ID,
    display: '@theolivebrookchurch',
  },
  {
    id: 'wuse2-ig',
    name: 'TOBC Wuse 2',
    platform: 'instagram',
    section: 'church',
    handle: 'tobc_wuse2',
    display: '@tobc_wuse2',
  },
  {
    id: 'wuse2-yt',
    name: 'TOBC Wuse 2',
    platform: 'youtube',
    section: 'church',
    handle: WUSE2_CHANNEL_ID,
    // Note the asymmetry: YouTube is @tobcwuse2 (no underscore), Instagram is
    // @tobc_wuse2 (with one). Not a typo — don't "correct" either to match.
    display: '@tobcwuse2',
  },
];

export const SECTION_TITLES: Record<SocialSection, string> = {
  pastors: 'Pastors',
  church: 'Church Channels',
};

/** Canonical public URL — the fallback when the native app isn't installed. */
export function webUrl(a: SocialAccount): string {
  return a.platform === 'instagram'
    ? `https://www.instagram.com/${a.handle}`
    : `https://www.youtube.com/channel/${a.handle}`;
}

/**
 * The native-app deep link.
 *
 * Instagram documents `instagram://user?username=…`. YouTube's `vnd.youtube://`
 * scheme accepts a channel id directly. Linking.openURL REJECTS when no handler
 * exists, and that rejection is the check — calling canOpenURL first would be
 * wrong on Android 11+, where a query for a scheme the manifest doesn't declare
 * returns false even when the app IS installed.
 */
export function appUrl(a: SocialAccount): string {
  return a.platform === 'instagram'
    ? `instagram://user?username=${a.handle}`
    : `vnd.youtube://www.youtube.com/channel/${a.handle}`;
}
