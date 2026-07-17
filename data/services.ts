// data/services.ts
// Real OliveBrook service schedule — this data is stable, no placeholders needed.

export interface Service {
  id: string;
  day: string;
  time: string;
  name: string;
}

export const services: Service[] = [
  { id: '1', day: 'Sunday', time: '8:30 AM', name: 'First Service' },
  { id: '2', day: 'Sunday', time: '10:00 AM', name: 'Second Service' },
  { id: '3', day: 'Wednesday', time: '6:30 PM', name: 'Midweek Service' },
  { id: '4', day: 'Saturday', time: '8:00 AM', name: 'Prayer Meeting' },
];

// Helper: figure out if "today" matches one of the services above.
// Screens use this to decide the Live card's state (see content.ts note).
export function getTodayServices(): Service[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  return services.filter((s) => s.day === today);
}

// Finds the next upcoming service (wraps to next week if today's already past).
// Used by live.tsx to power the Next-Service card when isLive is false.
export function getNextService(): { service: Service; countdownLabel: string } {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const nowDayIndex = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  function toMinutes(timeStr: string): number {
    const [time, meridiem] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  let best: { service: Service; minutesAway: number } | null = null;

  for (const service of services) {
    const serviceDayIndex = dayNames.indexOf(service.day);
    let daysAway = (serviceDayIndex - nowDayIndex + 7) % 7;
    const serviceMinutes = toMinutes(service.time);

    if (daysAway === 0 && serviceMinutes <= nowMinutes) {
      daysAway = 7; // already happened today — push to next week
    }

    const minutesAway = daysAway * 24 * 60 + (serviceMinutes - nowMinutes);

    if (!best || minutesAway < best.minutesAway) {
      best = { service, minutesAway };
    }
  }

  const hoursAway = Math.floor(best!.minutesAway / 60);
  const days = Math.floor(hoursAway / 24);
  const hours = hoursAway % 24;

  const countdownLabel =
    days > 0
      ? `in ${days} day${days > 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`
      : `in ${hours} hr${hours !== 1 ? 's' : ''}`;

  return { service: best!.service, countdownLabel };
}