// data/socials.ts
// The one place social handles live.
//
// LINK-OUT ONLY. Instagram content is never fetched, embedded or replayed in
// this app: Meta only permits that through a business-verified, app-reviewed
// Graph API setup, and the unofficial endpoints that appear to work are both
// against their terms and liable to break without warning. So every entry here
// is a destination, not a data source.
//
// Handles are stored BARE (no URL, no query string). Two reasons:
//   - the share sheet hands out links like
//     instagram.com/theolivebrookchurch?igsh=MWx5…  — that igsh parameter is a
//     share-attribution token tied to whoever copied it. Storing it would
//     attribute every tap in the app to one person's share, forever.
//   - the app link (instagram://user?username=…) and the web link
//     (https://www.instagram.com/…) need the handle in different positions, so
//     one canonical handle beats storing two URLs that can drift apart.

export type SocialPlatform = 'instagram';

export interface SocialAccount {
  id: string;
  /** Who the account belongs to. */
  name: string;
  /** What they are, one line — used as the card's second line. */
  role: string;
  platform: SocialPlatform;
  /** Bare handle, no @, no URL, no query params. */
  handle: string | null;
}

// All four handles are now real — no placeholders remain in this file.
// Note Abu's is "officialabujibril", not "abujibril": the shorter name is a
// different account, so don't shorten it.
export const ABU_INSTAGRAM = 'officialabujibril';

export const socialAccounts: SocialAccount[] = [
  {
    id: 'tobc',
    name: 'The OliveBrook Church',
    role: 'Kubwa, Abuja',
    platform: 'instagram',
    handle: 'theolivebrookchurch',
  },
  {
    id: 'tobc-wuse2',
    name: 'TOBC Wuse 2',
    role: 'Wuse 2, Abuja',
    platform: 'instagram',
    handle: 'tobc_wuse2',
  },
  {
    id: 'yinka',
    name: 'Pastor Yinka Jibril',
    role: 'Pastor',
    platform: 'instagram',
    handle: 'yinkajibril',
  },
  {
    id: 'abu',
    name: 'Pastor Abu Jibril',
    role: 'Pastor',
    platform: 'instagram',
    handle: ABU_INSTAGRAM,
  },
];

/** Canonical public profile URL — the fallback when the app isn't installed. */
export function webUrl(handle: string): string {
  return `https://www.instagram.com/${handle}`;
}

/**
 * The native-app deep link.
 *
 * `instagram://user?username=…` is Instagram's documented scheme and lands on
 * the profile inside the app. Linking.openURL rejects when no handler exists,
 * which is what the caller uses to fall back to the web URL — checking with
 * canOpenURL first would be wrong on Android 11+, where queries for schemes not
 * declared in the manifest return false even when the app IS installed.
 */
export function appUrl(handle: string): string {
  return `instagram://user?username=${handle}`;
}
