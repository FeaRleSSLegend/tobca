// utils/highlights.ts
// Verse highlighting, persisted locally. A highlight is a color attached to
// one verse, keyed by a stable identity (book + chapter + verse) so it holds
// no matter which reading or passage the verse is viewed through, and
// survives translation switches (the words differ, but "John 3:16" is the
// same verse to highlight). Best-effort AsyncStorage, same as the rest of
// the app's local state.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@verse_highlights';

// The palette offered in the reader. Pink and purple lead (the app's brand
// colors, and what the user asked for); the rest give a bit of choice
// without turning it into a paint program. Values are the highlight fill;
// each is a soft tint so text stays readable on top.
export const HIGHLIGHT_COLORS: { id: string; label: string; value: string }[] = [
  { id: 'pink', label: 'Pink', value: '#FBD5E6' },
  { id: 'purple', label: 'Purple', value: '#E7D5FB' },
  { id: 'gold', label: 'Gold', value: '#FBEFC9' },
  { id: 'green', label: 'Green', value: '#CFF0DD' },
  { id: 'blue', label: 'Blue', value: '#D2E4FB' },
];

export function colorValue(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return HIGHLIGHT_COLORS.find((c) => c.id === id)?.value;
}

// Stable per-verse key, independent of translation and reading path.
export function verseKey(book: string | undefined, chapter: number | undefined, verse: number): string {
  return `${book ?? '?'}|${chapter ?? '?'}|${verse}`;
}

type HighlightMap = Record<string, string>; // verseKey -> colorId

async function readMap(): Promise<HighlightMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HighlightMap) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: HighlightMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to persist highlights:', e);
  }
}

export async function getAllHighlights(): Promise<HighlightMap> {
  return readMap();
}

// Set a color on a verse, or pass colorId=null to clear it.
export async function setHighlight(key: string, colorId: string | null): Promise<HighlightMap> {
  const map = await readMap();
  if (colorId === null) {
    delete map[key];
  } else {
    map[key] = colorId;
  }
  await writeMap(map);
  return map;
}
