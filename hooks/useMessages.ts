import { useEffect, useState } from 'react';
import { messages as mockMessages, Message } from '../data/content';
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
        const real: Message[] = videos.map((v) => ({
          id: v.videoId,
          title: v.title,
          speaker: 'OliveBrook Church',
          duration: v.duration,
          durationSeconds: v.durationSeconds,
          videoId: v.videoId,
          type: 'sermon',
          publishedAt: v.publishedAt,
          thumbnail: v.thumbnail,
        }));
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
