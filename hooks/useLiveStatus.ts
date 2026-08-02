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

function currentScheduledService(): string | undefined {
  const todays = getTodayServices();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const match = todays.find((s) => {
    const [time, meridiem] = s.time.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const serviceMinutes = h * 60 + m;
    return nowMinutes >= serviceMinutes - 15 && nowMinutes <= serviceMinutes + 150;
  });
  return match?.name;
}

export interface LiveStatus {
  isLive: boolean;
  videoId?: string;
  title?: string;
  // Where the answer came from — 'youtube' is a confirmed fact, 'schedule'
  // is a best guess used only when YouTube couldn't be asked. Cards use
  // this to caption honestly ("Streaming live" vs "Service in progress").
  source: 'youtube' | 'schedule';
}

/**
 * YouTube is the PRIMARY source of truth for live status; the service
 * schedule is only a fallback (inverted from the old behavior, where the
 * schedule gated whether YouTube even got asked — which meant an
 * off-schedule stream, like a special program or a delayed start outside
 * the window, could never show as live).
 *
 * Order of operations per poll:
 *   1. Ask YouTube (via checkChannelLive, which caches).
 *   2. Whatever YouTube says — live or not — is the answer.
 *   3. Only if YouTube CAN'T answer (no key, offline, quota exhausted)
 *      fall back to the schedule: inside a service window → assume live,
 *      flagged source:'schedule' so the UI can say so honestly.
 *
 * Quota safety moved from "don't ask outside windows" to cache freshness:
 * near a scheduled window the cache is trusted for 4 minutes (catch the
 * stream starting promptly), outside windows for 30 (a surprise stream
 * still gets noticed, just within half an hour). Worst case that's
 * ~2 checks/hour idle and ~15/hour around services — well inside the
 * ~100/day the search.list quota allows.
 */
export function useLiveStatus(): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>({ isLive: false, source: 'youtube' });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const nearWindow = isNearServiceWindow();
      try {
        const result = await checkChannelLive(nearWindow ? 4 * 60 * 1000 : 30 * 60 * 1000);
        if (cancelled) return;
        setStatus(
          result.isLive
            ? { isLive: true, videoId: result.videoId, title: result.title, source: 'youtube' }
            : { isLive: false, source: 'youtube' }
        );
      } catch (e) {
        console.warn('Live status check failed, falling back to schedule:', e);
        if (cancelled) return;
        setStatus(
          nearWindow
            ? { isLive: true, title: currentScheduledService(), source: 'schedule' }
            : { isLive: false, source: 'schedule' }
        );
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
