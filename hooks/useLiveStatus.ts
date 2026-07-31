import { useEffect, useState } from 'react';
import { checkChannelLive } from '../services/youtube';
import { getTodayServices } from '../data/services';

function isNearServiceWindow(): boolean {
  const todays = getTodayServices();
  if (todays.length === 0) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return todays.some((s) => {
    const [time, meridiem] = s.time.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const serviceMinutes = h * 60 + m;
    // 15 min before start through 2.5 hrs after — covers a typical service.
    return nowMinutes >= serviceMinutes - 15 && nowMinutes <= serviceMinutes + 150;
  });
}

interface LiveStatus {
  isLive: boolean;
  videoId?: string;
  title?: string;
}

/**
 * Checks real YouTube live status, but only actually calls the API when
 * today has a scheduled service happening soon or in progress — outside
 * that window it just reports isLive: false without spending API quota.
 * Polls every 5 minutes while a window is active.
 */
export function useLiveStatus(): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>({ isLive: false });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (!isNearServiceWindow()) {
        if (!cancelled) setStatus({ isLive: false });
        return;
      }
      try {
        const result = await checkChannelLive();
        if (cancelled) return;
        setStatus(
          result.isLive
            ? { isLive: true, videoId: result.videoId, title: result.title }
            : { isLive: false }
        );
      } catch (e) {
        console.warn('Live status check failed:', e);
      }
    }

    poll();
    const interval = setInterval(poll, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}
