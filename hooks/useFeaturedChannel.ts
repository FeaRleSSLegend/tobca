import { useEffect, useState } from 'react';
import { buildMessage, Message } from '../data/contentModel';
import { FeaturedChannelId, getFeaturedChannel } from '../data/channels';
import { fetchChannelUploads, PlaceholderChannelError } from '../services/youtube';

interface UseFeaturedChannelResult {
  episodes: Message[];
  loading: boolean;
  /** The channel id is still a placeholder — show "coming soon", not an error. */
  pending: boolean;
  /** A real fetch failure, as opposed to `pending`. */
  failed: boolean;
}

/**
 * Uploads from a featured (non-branch) channel — see data/channels.ts.
 *
 * Deliberately NOT part of useMessages. Keeping this list separate is what
 * stops a podcast episode from being swept into sermon classification, the
 * Library's series/services rows, "Recently Added", global search, or the
 * branch filter. Her content is browsable in exactly one place, which is the
 * point: it's her channel, not the church's sermon feed.
 *
 * Episodes are still built with buildMessage, so they are ordinary Messages
 * that the existing PlayerHost plays with no special-casing — only their
 * composite id namespace differs (`youtube:yinka:…`).
 */
export function useFeaturedChannel(id: FeaturedChannelId): UseFeaturedChannelResult {
  const [episodes, setEpisodes] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const channel = getFeaturedChannel(id);
    if (!channel) {
      setLoading(false);
      setFailed(true);
      return;
    }

    fetchChannelUploads(channel.channelId)
      .then((videos) => {
        if (cancelled) return;
        setEpisodes(
          videos.map((v) =>
            buildMessage({
              source: 'youtube',
              branchId: channel.id,
              externalId: v.videoId,
              title: v.title,
              speaker: channel.speaker,
              publishedAt: v.publishedAt,
              type: 'video',
              thumbnail: v.thumbnail,
              media: [
                {
                  kind: 'video',
                  source: 'youtube',
                  externalId: v.videoId,
                  durationSeconds: v.durationSeconds,
                },
              ],
            })
          )
        );
      })
      .catch((e) => {
        if (cancelled) return;
        // A placeholder id is expected until the real one lands — that's a
        // "not wired up yet" state, not a failure, and the two get different
        // copy on screen.
        if (e instanceof PlaceholderChannelError) setPending(true);
        else {
          console.warn(`Featured channel "${id}" fetch failed:`, e);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { episodes, loading, pending, failed };
}
