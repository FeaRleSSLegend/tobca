import { useEffect, useMemo, useState } from 'react';
import { buildMessage, Message } from '../data/contentModel';
import { branches } from '../data/branches';
import { featuredChannels } from '../data/channels';
import { fetchChannelUploads, PlaceholderChannelError } from '../services/youtube';

/**
 * A Short is a duration heuristic, not an API flag.
 *
 * The YouTube Data API does NOT expose "is this a Short". There is no field for
 * it on videos.list, and the only reliable signal Google gives is a redirect on
 * the /shorts/<id> URL, which costs one HTTP request per video and is not
 * something to run over a 1,300-video channel.
 *
 * So: duration. Shorts are capped at 3 minutes by YouTube (60s before Oct 2024),
 * but plenty of ordinary uploads are also under 3 minutes — clips, trailers,
 * announcements. 90s is the compromise: comfortably above the old 60s limit so
 * real Shorts still qualify, comfortably below 3 minutes so full short-form
 * uploads that were never meant as Shorts mostly stay out.
 *
 * Consequence worth knowing: a genuine 2-minute Short will be missed, and a
 * 45-second announcement clip will be included. This is a heuristic and will
 * misfile things at the edges.
 */
const MAX_SHORT_SECONDS = 90;

// Zero-duration entries are livestream archives still processing, or videos the
// duration lookup couldn't resolve. They are never Shorts and would render as a
// dead frame in a full-screen feed.
const MIN_SHORT_SECONDS = 1;

interface ShortsSource {
  channelId: string;
  /** Whose channel this is — shown as attribution over the video. */
  attribution: string;
}

interface UseShortsResult {
  shorts: Message[];
  loading: boolean;
  /** Every source failed or was a placeholder — show an empty state. */
  empty: boolean;
}

/**
 * The vertical feed's data: short uploads from EVERY configured YouTube source
 * — both church branches plus each featured channel — merged newest-first.
 *
 * Sources are fetched independently and a failure in one never blocks another,
 * for the same reason useMessages does it: several of these channel ids are
 * still placeholders and reject immediately, and one expected rejection must
 * not empty the feed.
 */
export function useShorts(): UseShortsResult {
  const [byChannel, setByChannel] = useState<Record<string, Message[]>>({});
  const [pending, setPending] = useState(0);
  const [started, setStarted] = useState(false);

  const sources = useMemo<ShortsSource[]>(
    () => [
      ...branches.map((b) => ({ channelId: b.channelId, attribution: b.shortName })),
      ...featuredChannels.map((c) => ({ channelId: c.channelId, attribution: c.name })),
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;
    setStarted(true);
    setPending(sources.length);

    sources.forEach((src) => {
      fetchChannelUploads(src.channelId)
        .then((videos) => {
          if (cancelled) return;
          const shorts = videos
            .filter(
              (v) => v.durationSeconds >= MIN_SHORT_SECONDS && v.durationSeconds <= MAX_SHORT_SECONDS
            )
            .map((v) =>
              buildMessage({
                source: 'youtube',
                // The feed is cross-source by design, so branchId here is only
                // provenance for the composite id — the visible attribution is
                // carried by `speaker`, which is what the overlay reads.
                branchId: 'kubwa',
                externalId: v.videoId,
                title: v.title,
                speaker: src.attribution,
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
            );
          setByChannel((prev) => ({ ...prev, [src.channelId]: shorts }));
        })
        .catch((e) => {
          if (cancelled) return;
          if (!(e instanceof PlaceholderChannelError)) {
            console.warn(`Shorts fetch failed for ${src.attribution}:`, e);
          }
        })
        .finally(() => {
          if (!cancelled) setPending((n) => n - 1);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [sources]);

  const shorts = useMemo(() => {
    const merged = Object.values(byChannel).flat();
    // Dedupe by composite id: two sources could in principle carry the same
    // video, and a duplicate key in a paged FlatList is a real bug.
    const seen = new Set<string>();
    const unique = merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
    return unique.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [byChannel]);

  const loading = !started || pending > 0;
  return { shorts, loading, empty: !loading && shorts.length === 0 };
}
