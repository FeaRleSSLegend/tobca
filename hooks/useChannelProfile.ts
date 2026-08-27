// hooks/useChannelProfile.ts
// A YouTube channel's own name, avatar and description.
//
// Separate from useFeaturedChannel on purpose. That hook answers "what has she
// posted" and pulls up to 500 playlist items to do it; this one answers "what
// does she look like" and costs a single quota unit against a week-long cache.
// The Library's pastors row needs ONLY the avatar, and making it wait on (or
// pay for) the uploads fetch to get a 88px circle would be the tail wagging
// the dog — the circle appears on a tab people open constantly, the video list
// only matters once they tap it.
//
// FAILURE IS NOT AN ERROR STATE HERE. A missing avatar means the circle falls
// back to an initial on the brand gradient, which is a complete, deliberate
// design rather than a broken image — so there is no `failed` flag to render
// against. Callers just use `profile?.avatar`, which is undefined until (or
// unless) it arrives.

import { useEffect, useState } from 'react';
import { fetchChannelProfile, type YouTubeChannelProfile } from '../services/youtube';

export function useChannelProfile(channelId: string | undefined): {
  profile: YouTubeChannelProfile | null;
  loading: boolean;
} {
  const [profile, setProfile] = useState<YouTubeChannelProfile | null>(null);
  const [loading, setLoading] = useState(!!channelId);

  useEffect(() => {
    if (!channelId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchChannelProfile(channelId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      // Swallowed rather than surfaced — see the note above. A placeholder
      // channel id throws PlaceholderChannelError here too, and that is the
      // same non-event: no avatar, draw the fallback.
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  return { profile, loading };
}
