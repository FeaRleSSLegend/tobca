// data/branches.ts
// The branch registry — one entry per physical church branch, the single
// source of truth the whole app reads for "which branches exist". This is
// the seam that makes the second branch (Wuse 2) a data change rather than
// a code change: adding it here plus a fetch adapter is the entire wiring,
// with no screen touched. Per the architecture doc, branch is an ATTRIBUTE
// of content, never a top-level navigation split — so nothing here creates
// a tab; branches surface as an optional filter.

import { Service, services as ikejaServices } from './services';

export type BranchId = 'ikeja' | 'wuse2';

export interface Branch {
  id: BranchId;
  name: string; // full display name
  shortName: string; // for compact labels / pills
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

// The primary/home branch. Its channel is the one the app has always
// fetched (the existing EXPO_PUBLIC_YT_CHANNEL_ID). Wuse 2 is intentionally
// NOT added yet — this iteration builds the foundation; the second branch
// plugs in here when its integration turn comes.
export const PRIMARY_BRANCH_ID: BranchId = 'ikeja';

export const branches: Branch[] = [
  {
    id: 'ikeja',
    name: 'The OliveBrook Church',
    shortName: 'Main',
    channelId: process.env.EXPO_PUBLIC_YT_CHANNEL_ID ?? 'UC2iX9RmSZ6uAjFqi7putEaA',
    serviceSchedule: ikejaServices,
  },
];

export function getBranch(id: BranchId): Branch | undefined {
  return branches.find((b) => b.id === id);
}

export function getPrimaryBranch(): Branch {
  // The registry always contains the primary branch, so this is total.
  return branches.find((b) => b.id === PRIMARY_BRANCH_ID) ?? branches[0];
}
