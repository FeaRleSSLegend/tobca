// data/verseOfDay.ts
// Hardcoded for now, on purpose — we'll circle back on where this actually
// comes from (rotating list, API, tied to the reading plan, etc). Kept as
// its own small module so swapping the *source* later only means changing
// how `verseOfDay` gets produced, not how VerseOfDayCard consumes it.
export interface VerseOfDay {
  reference: string;
  text: string;
}

export const verseOfDay: VerseOfDay = {
  reference: 'Psalm 46:10',
  text: 'Be still, and know that I am God.',
};
