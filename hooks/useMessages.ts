import { useCallback, useEffect, useMemo, useState } from 'react';
import { Message } from '../data/content';
import { buildMessage } from '../data/contentModel';
import { BranchId, branches, PRIMARY_BRANCH_ID } from '../data/branches';
import { fetchChannelUploads, PlaceholderChannelError, YouTubeVideo } from '../services/youtube';

/** 'all' means every branch merged. */
export type BranchFilter = BranchId | 'all';

/** Where a single branch's fetch has got to. */
export type BranchStatus = 'loading' | 'ready' | 'empty' | 'failed';

interface UseMessagesResult {
  /** Every SETTLED branch's messages, merged and newest-first. */
  messages: Message[];
  /** True until every branch has settled. Prefer isBranchReady for UI gating. */
  loading: boolean;
  statusByBranch: Record<BranchId, BranchStatus>;
  /**
   * Has everything the given view needs finished loading?
   *
   * This is what screens gate their skeletons on, and it is scoped per branch
   * ON PURPOSE. Gating the whole app on a global `loading` would mean the one
   * branch still carrying a placeholder channel id could hold the visible
   * screen on skeletons forever. Asking only about the branch actually being
   * looked at means a stalled or unconfigured branch can never freeze a screen
   * that isn't showing it.
   *
   * 'all' waits for every branch to SETTLE — settle, not succeed. A
   * placeholder branch rejects synchronously before any network call, so it
   * settles immediately and contributes nothing rather than blocking.
   */
  isBranchReady: (filter: BranchFilter) => boolean;
}

function toMessages(videos: YouTubeVideo[], branchId: BranchId, speaker: string): Message[] {
  return videos.map((v) =>
    buildMessage({
      source: 'youtube',
      branchId,
      externalId: v.videoId,
      title: v.title,
      // YouTube's API exposes no speaker field; a consistent generic stands in
      // until titles/descriptions are parsed for it.
      speaker,
      publishedAt: v.publishedAt,
      type: 'sermon',
      thumbnail: v.thumbnail,
      media: [
        { kind: 'video', source: 'youtube', externalId: v.videoId, durationSeconds: v.durationSeconds },
      ],
    })
  );
}

const initialStatus = () =>
  branches.reduce(
    (acc, b) => ({ ...acc, [b.id]: 'loading' as BranchStatus }),
    {} as Record<BranchId, BranchStatus>
  );

/**
 * Single source of truth for "the list of messages" across Library, Home and
 * Search.
 *
 * NO MOCK SEEDING. This used to start from the static mock list so screens had
 * something to paint immediately — but that meant the app showed seventeen
 * fabricated sermons AS IF THEY WERE REAL, then swapped them for the true feed
 * a second later. A visible content pop, and worse, a moment where everything
 * on screen was a lie. It now starts empty and screens render skeletons until
 * their branch settles, which is both honest and steadier to look at.
 */
export function useMessages(): UseMessagesResult {
  const [byBranch, setByBranch] = useState<Record<string, Message[]>>({});
  const [statusByBranch, setStatusByBranch] = useState<Record<BranchId, BranchStatus>>(initialStatus);

  useEffect(() => {
    let cancelled = false;

    // Each branch resolves into its own slot rather than through one combined
    // await, so a slow branch never delays a fast one's status flipping.
    branches.forEach((branch) => {
      fetchChannelUploads(branch.channelId)
        .then((videos) => {
          if (cancelled) return;
          const msgs = toMessages(videos, branch.id, branch.name);
          setByBranch((prev) => ({ ...prev, [branch.id]: msgs }));
          setStatusByBranch((prev) => ({
            ...prev,
            [branch.id]: msgs.length > 0 ? 'ready' : 'empty',
          }));
        })
        .catch((e) => {
          if (cancelled) return;
          // A placeholder id is an expected, uninteresting state — not a fault
          // worth shouting about on every launch. Anything else is real.
          const placeholder = e instanceof PlaceholderChannelError;
          if (!placeholder) {
            console.warn(`Uploads fetch failed for branch "${branch.id}":`, e);
          }
          setStatusByBranch((prev) => ({
            ...prev,
            [branch.id]: placeholder ? 'empty' : 'failed',
          }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const messages = useMemo(() => {
    const merged = branches.flatMap((b) => byBranch[b.id] ?? []);
    // Newest first ACROSS branches, so a merged feed interleaves by date
    // rather than showing one branch's whole history then the next's.
    return merged.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [byBranch]);

  const isBranchReady = useCallback(
    (filter: BranchFilter) => {
      if (filter === 'all') return branches.every((b) => statusByBranch[b.id] !== 'loading');
      return statusByBranch[filter] !== 'loading';
    },
    [statusByBranch]
  );

  const loading = branches.some((b) => statusByBranch[b.id] === 'loading');

  return { messages, loading, statusByBranch, isBranchReady };
}

/** Narrow a merged message list to one branch (or leave it whole for 'all'). */
export function filterByBranch(messages: Message[], filter: BranchFilter): Message[] {
  if (filter === 'all') return messages;
  return messages.filter((m) => m.branchId === filter);
}

export { PRIMARY_BRANCH_ID };
