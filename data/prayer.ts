// data/prayer.ts

export interface PrayerFocus {
  month: string;
  title: string;
  description: string;
}

export interface PrayerResource {
  id: string;
  name: string;
  pages: number;
  fileUrl: string; // TODO: replace with a real hosted PDF URL once uploaded
}

export const currentFocus: PrayerFocus = {
  month: 'July',
  title: 'Praying for Divine Direction & Open Doors',
  description:
    'A focused month of fasting and prayer for clarity, breakthrough, and new opportunities across the OliveBrook family.',
};

export const prayerResources: PrayerResource[] = [
  { id: '1', name: '21 Days Fasting Guide', pages: 8, fileUrl: 'REPLACE_ME' },
  { id: '2', name: 'Daily Prayer Points', pages: 5, fileUrl: 'REPLACE_ME' },
  { id: '3', name: 'Scriptures for Breakthrough', pages: 3, fileUrl: 'REPLACE_ME' },
];

export const archivedFocuses: PrayerFocus[] = [
  {
    month: 'June',
    title: 'June Focus',
    description: 'Archived — see PDF for full content.',
  },
  {
    month: 'May',
    title: 'May Focus',
    description: 'Archived — see PDF for full content.',
  },
];