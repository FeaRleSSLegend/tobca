// data/biblePlan.ts
// A 1-year chronological plan. Only a few days ship with full inline text —
// writing all 365 days by hand isn't realistic. Days without an `excerpt`
// still work fine in the UI (they just skip the inline reader, showing
// reference only) — see note at the bottom for the real long-term fix.

export interface Verse {
  number: number;
  text: string;
}

export interface BiblePlanDay {
  day: number;
  reference: string; // full reading range for the day, e.g. "Genesis 12–14"
  excerptReference?: string; // e.g. "Genesis 12:1–3 (KJV)"
  excerpt?: Verse[]; // first few verses only — public domain KJV, safe to ship
  readTime: string;
  completed: boolean;
}

export const planProgress = {
  currentDay: 45,
  totalDays: 365,
  streak: 14,
  completedCount: 44,
};

export const planDays: BiblePlanDay[] = [
  { day: 42, reference: 'Genesis 6–7', readTime: '~8 min', completed: true },
  { day: 43, reference: 'Genesis 8–9', readTime: '~7 min', completed: true },
  { day: 44, reference: 'Genesis 10–11', readTime: '~6 min', completed: true },
  {
    day: 45,
    reference: 'Genesis 12–14',
    excerptReference: 'Genesis 12:1–3 (KJV)',
    readTime: '~9 min',
    completed: false,
    excerpt: [
      {
        number: 1,
        text: "Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will shew thee:",
      },
      {
        number: 2,
        text: 'And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing:',
      },
      {
        number: 3,
        text: 'And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed.',
      },
    ],
  },
  { day: 46, reference: 'Genesis 15–17', readTime: '~9 min', completed: false },
  { day: 47, reference: 'Genesis 18–19', readTime: '~8 min', completed: false },
];

// LONG-TERM NOTE (not for this week): hand-writing 365 days of scripture
// doesn't scale. Once the backend exists, the real fix is pulling verse
// text at request-time from a public-domain Bible API (e.g. bible-api.com
// serves KJV/WEB free, no auth) keyed off `reference` — the plan stays
// static, the text renders live. Worth remembering, not worth building now.