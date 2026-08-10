// data/branches.ts
// The branch registry — one entry per physical church branch, the single
// source of truth the whole app reads for "which branches exist".
//
// The church is in ABUJA, Nigeria, with two branches: Kubwa and Wuse 2.
// (An earlier version of this file modelled a non-existent "Ikeja" branch;
// that was wrong and has been removed.) Per the architecture doc, branch is an
// ATTRIBUTE of content, never a top-level navigation split — so nothing here
// creates a tab; branches surface as one lightweight switcher.

import { Service, services as abujaServices } from './services';

export type BranchId = 'kubwa' | 'wuse2';

export interface Branch {
  id: BranchId;
  name: string; // full display name
  shortName: string; // for compact labels / pills
  city: string;
  channelId: string; // YouTube channel this branch's uploads come from
  // Optional accent, used ONLY as a hairline or small label tint so a
  // branch is identifiable at a glance — never a full re-skin, because the
  // branches are one church, not two apps. Undefined means "use the app's
  // default treatment", which is correct for the primary branch.
  accent?: string;
  // Each branch keeps its own service schedule — the two branches stream on
  // their own channels at their own times, so live detection is per-branch.
  serviceSchedule: Service[];
}

/**
 * The main branch, and the one every "which channel do we mean by default"
 * call resolves to.
 *
 * KUBWA, not Wuse 2 — and this was checked rather than assumed. The real
 * channel the app has always fetched (UC2iX9RmSZ6uAjFqi7putEaA,
 * @theolivebrookchurch, 1,314 videos) describes itself as:
 *
 *   "Location: IGNOBIS HOTELS, Kubwa, Abuja - Nigeria"
 *
 * So the existing content belongs to Kubwa. Wuse 2 is the branch still
 * awaiting a channel id.
 */
export const PRIMARY_BRANCH_ID: BranchId = 'kubwa';

// ---------------------------------------------------------------------------
// >>> REPLACE ME <<<
// Wuse 2's real YouTube channel id. Until this is a genuine "UC…" id, every
// fetch for that branch fails fast (see isPlaceholderChannel) and the branch
// shows an empty state — deliberately, so a placeholder can never be mistaken
// for "this branch has published nothing".
// TODO: replace with real Wuse 2 YouTube channel ID
// ---------------------------------------------------------------------------
export const WUSE2_CHANNEL_ID_PLACEHOLDER = 'WUSE2_CHANNEL_ID_PLACEHOLDER';

// Kubwa's channel. EXPO_PUBLIC_YT_CHANNEL_ID stays supported as an override —
// it previously existed here while services/youtube.ts ignored it and used its
// own hardcoded copy, so the two could disagree. There is now exactly one
// place a channel id is declared, and the service reads it from here.
export const KUBWA_CHANNEL_ID =
  process.env.EXPO_PUBLIC_YT_CHANNEL_ID ?? 'UC2iX9RmSZ6uAjFqi7putEaA';

export const branches: Branch[] = [
  {
    id: 'kubwa',
    name: 'The OliveBrook Church, Kubwa',
    shortName: 'Kubwa',
    city: 'Abuja',
    channelId: KUBWA_CHANNEL_ID,
    serviceSchedule: abujaServices,
  },
  {
    id: 'wuse2',
    name: 'The OliveBrook Church, Wuse 2',
    shortName: 'Wuse 2',
    city: 'Abuja',
    channelId: WUSE2_CHANNEL_ID_PLACEHOLDER,
    // Empty rather than a copy of Kubwa's: the two branches stream at their
    // own times, and inventing a schedule here would make the live-status
    // fallback confidently wrong about when Wuse 2 is on.
    // TODO: add Wuse 2's real service times
    serviceSchedule: [],
  },
];

export function getBranch(id: BranchId): Branch | undefined {
  return branches.find((b) => b.id === id);
}

export function getPrimaryBranch(): Branch {
  // The registry always contains the primary branch, so this is total.
  return branches.find((b) => b.id === PRIMARY_BRANCH_ID) ?? branches[0];
}

/**
 * True while a channel id is still a placeholder rather than a real YouTube id.
 *
 * Real ids are always "UC" + 22 chars. Checking the SHAPE rather than
 * string-matching the placeholder constant means any stand-in value — an empty
 * string, a note-to-self, a half-pasted id — is caught the same way, and the
 * check keeps working after someone edits the placeholder text.
 */
export function isPlaceholderChannel(channelId: string): boolean {
  return !/^UC[\w-]{22}$/.test(channelId);
}
