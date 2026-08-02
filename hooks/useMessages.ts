import { useEffect, useState } from 'react';
import { messages as mockMessages, Message } from '../data/content';
import { buildMessage } from '../data/contentModel';
import { PRIMARY_BRANCH_ID } from '../data/branches';
import { fetchChannelUploads } from '../services/youtube';

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  isRealData: boolean;
}

/**
 * Single source of truth for "the list of messages" across Library, Live,
 * and Search. Starts with the static mock (so screens render instantly,
 * no blank/loading flash on first paint), then swaps in real YouTube
 * videos once the fetch resolves. If the fetch fails (no API key set yet,
 * offline, quota issue) it just stays on the mock — screens don't need
 * their own error handling for this.
 *
 * NOTE: YouTube's API doesn't expose a "speaker" field, so real videos get
 * a generic speaker value below. If sermon titles/descriptions end up
 * encoding the speaker name in a consistent way, this is the one place to
 * add that parsing later.
 */
export function useMessages(): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchChannelUploads()
      .then((videos) => {
        if (cancelled || videos.length === 0) return;
        const real: Message[] = videos.map((v) =>
          buildMessage({
            source: 'youtube',
            branchId: PRIMARY_BRANCH_ID,
            externalId: v.videoId,
            title: v.title,
            // YouTube's API exposes no speaker field; a consistent generic
            // stands in until titles/descriptions are parsed for it.
            speaker: 'OliveBrook Church',
            publishedAt: v.publishedAt,
            type: 'sermon',
            thumbnail: v.thumbnail,
            media: [
              { kind: 'video', source: 'youtube', externalId: v.videoId, durationSeconds: v.durationSeconds },
            ],
          })
        );
        setMessages(real);
        setIsRealData(true);
      })
      .catch((e) => {
        console.warn('Falling back to mock messages — YouTube fetch failed:', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { messages, loading, isRealData };
}
