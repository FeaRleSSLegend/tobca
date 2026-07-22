// ============================================
// TYPES
// ============================================

export interface Verse {
  number: number;
  kjv: string;
  niv: string;
}

export interface ChapterContent {
  book: string;
  chapter: number;
  verses: Verse[];
}

export interface ScriptureRef {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

export interface ScriptureContent {
  reference: string;
  kjv: string;
  niv: string;
  book: string;
  chapter: number;
  verses: Verse[];  // Uses the full Verse interface
}

// ============================================
// BIBLE CONTENT DATA
// ============================================

export const bibleContent: Record<string, Record<number, ChapterContent>> = {
  Genesis: {
    1: {
      book: 'Genesis',
      chapter: 1,
      verses: [
        { number: 1, kjv: 'In the beginning God created the heaven and the earth.', niv: 'In the beginning God created the heavens and the earth.' },
        { number: 2, kjv: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.', niv: 'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.' },
        { number: 3, kjv: 'And God said, Let there be light: and there was light.', niv: 'And God said, "Let there be light," and there was light.' },
        { number: 4, kjv: 'And God saw the light, that it was good: and God divided the light from the darkness.', niv: 'God saw that the light was good, and he separated the light from the darkness.' },
        { number: 5, kjv: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.', niv: 'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.' },
        { number: 6, kjv: 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.', niv: 'And God said, "Let there be a vault between the waters to separate water from water."' },
        { number: 7, kjv: 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.', niv: 'So God made the vault and separated the water under the vault from the water above it. And it was so.' },
        { number: 8, kjv: 'And God called the firmament Heaven. And the evening and the morning were the second day.', niv: 'God called the vault "sky." And there was evening, and there was morning—the second day.' },
        { number: 9, kjv: 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.', niv: 'And God said, "Let the water under the sky be gathered to one place, and let dry ground appear." And it was so.' },
        { number: 10, kjv: 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.', niv: 'God called the dry ground "land," and the gathered waters he called "seas." And God saw that it was good.' },
        // ... continue through verse 31
      ]
    },
    12: {
      book: 'Genesis',
      chapter: 12,
      verses: [
        { number: 1, kjv: 'Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father\'s house, unto a land that I will shew thee:', niv: 'The LORD had said to Abram, "Go from your country, your people and your father\'s household to the land I will show you."' },
        { number: 2, kjv: 'And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing:', niv: '"I will make you into a great nation, and I will bless you; I will make your name great, and you will be a blessing."' },
        { number: 3, kjv: 'And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed.', niv: '"I will bless those who bless you, and whoever curses you I will curse; and all peoples on earth will be blessed through you."' },
        { number: 4, kjv: 'So Abram departed, as the LORD had spoken unto him; and Lot went with him: and Abram was seventy and five years old when he departed out of Haran.', niv: 'So Abram went, as the LORD had told him; and Lot went with him. Abram was seventy-five years old when he set out from Haran.' },
        { number: 5, kjv: 'And Abram took Sarai his wife, and Lot his brother\'s son, and all their substance that they had gathered, and the souls that they had gotten in Haran; and they went forth to go into the land of Canaan; and into the land of Canaan they came.', niv: 'He took his wife Sarai, his nephew Lot, all the possessions they had accumulated and the people they had acquired in Haran, and they set out for the land of Canaan, and they arrived there.' },
        { number: 6, kjv: 'And Abram passed through the land unto the place of Sichem, unto the plain of Moreh. And the Canaanite was then in the land.', niv: 'Abram traveled through the land as far as the site of the great tree of Moreh at Shechem. At that time the Canaanites were in the land.' },
        { number: 7, kjv: 'And the LORD appeared unto Abram, and said, Unto thy seed will I give this land: and there builded he an altar unto the LORD, who appeared unto him.', niv: 'The LORD appeared to Abram and said, "To your offspring I will give this land." So he built an altar there to the LORD, who had appeared to him.' },
        { number: 8, kjv: 'And he removed from thence unto a mountain on the east of Bethel, and pitched his tent, having Bethel on the west, and Hai on the east: and there he builded an altar unto the LORD, and called upon the name of the LORD.', niv: 'From there he went on toward the hills east of Bethel and pitched his tent, with Bethel on the west and Ai on the east. There he built an altar to the LORD and called on the name of the LORD.' },
        { number: 9, kjv: 'And Abram journeyed, going on still toward the south.', niv: 'Then Abram set out and continued toward the Negev.' }
      ]
    }
    // ... all chapters
  },
  Job: {
    3: {
      book: 'Job',
      chapter: 3,
      verses: [
        { number: 1, kjv: 'After this opened Job his mouth, and cursed his day.', niv: 'After this, Job opened his mouth and cursed the day of his birth.' },
        { number: 2, kjv: 'And Job spake, and said,', niv: 'He said:' },
        { number: 3, kjv: 'Let the day perish wherein I was born, and the night in which it was said, There is a man child conceived.', niv: '"May the day of my birth perish, and the night that said, \'A boy is conceived!\'"' },
        { number: 4, kjv: 'Let that day be darkness; let not God regard it from above, neither let the light shine upon it.', niv: 'That day—may it be darkness; may God above not seek it, nor any light shine on it.' },
        { number: 5, kjv: 'Let darkness and the shadow of death stain it; let a cloud dwell upon it; let the blackness of the day terrify it.', niv: 'May gloom and utter darkness claim it once more; may a cloud settle over it; may blackness overwhelm it.' },
        { number: 6, kjv: 'As for that night, let darkness seize upon it; let it not be joined unto the days of the year, let it not come into the number of the months.', niv: 'That night—may thick darkness seize it; may it not be included among the days of the year nor be entered in any of the months.' },
        { number: 7, kjv: 'Lo, let that night be solitary, let no joyful voice come therein.', niv: 'May that night be barren; may no shout of joy be heard in it.' },
        { number: 8, kjv: 'Let them curse it that curse the day, who are ready to raise up their mourning.', niv: 'May those who curse days curse that day, those who are ready to rouse Leviathan.' },
        { number: 9, kjv: 'Let the stars of the twilight thereof be dark; let it look for light, but have none; neither let it see the dawning of the day:', niv: 'May its morning stars become dark; may it wait for daylight in vain and not see the first rays of dawn,' },
        { number: 10, kjv: 'Because it shut not up the doors of my mother\'s womb, nor hid sorrow from mine eyes.', niv: 'for it did not shut the doors of the womb on me nor hide trouble from my eyes.' },
        // ... continue through verse 26
      ]
    }
    // ... all books
  }
  // ... all books
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get scripture for a specific reference
 * Example: getScriptureForReference('Genesis 12:1-3', 'kjv')
 */
export function getScriptureForReference(reference: string, translation: 'kjv' | 'niv' = 'kjv'): ScriptureContent | null {
  // Parse reference like "Genesis 1:1-31" or "Genesis 1:1"
  const match = reference.match(/^([\w\s]+)\s+(\d+):(\d+)-?(\d+)?$/);
  if (!match) return null;
  
  const [_, book, chapterStr, startStr, endStr] = match;
  const chapter = parseInt(chapterStr, 10);
  const startVerse = parseInt(startStr, 10);
  const endVerse = endStr ? parseInt(endStr, 10) : startVerse;
  
  // Get book data
  const bookData = bibleContent[book];
  if (!bookData) return null;
  
  // Get chapter data
  const chapterData = bookData[chapter];
  if (!chapterData) return null;
  
  // Filter verses
  const verses = chapterData.verses.filter(v => 
    v.number >= startVerse && v.number <= endVerse
  );
  
  if (verses.length === 0) return null;
  
  return {
    reference,
    kjv: verses.map(v => v.kjv).join(' '),
    niv: verses.map(v => v.niv).join(' '),
    book,
    chapter,
    verses  // Returns the full Verse[] with kjv and niv
  };
}

/**
 * Get full chapter content
 * Example: getChapter('Genesis', 12)
 */
export function getChapter(book: string, chapter: number): ChapterContent | null {
  const bookData = bibleContent[book];
  if (!bookData) return null;
  return bookData[chapter] || null;
}

/**
 * Parse a reference into its components
 * Example: parseReference('Genesis 12:1-3') => { book: 'Genesis', chapter: 12, startVerse: 1, endVerse: 3 }
 */
export function parseReference(reference: string): ScriptureRef | null {
  const match = reference.match(/^([\w\s]+)\s+(\d+):(\d+)-?(\d+)?$/);
  if (!match) return null;
  
  const [_, book, chapterStr, startStr, endStr] = match;
  return {
    book,
    chapter: parseInt(chapterStr, 10),
    startVerse: parseInt(startStr, 10),
    endVerse: endStr ? parseInt(endStr, 10) : parseInt(startStr, 10)
  };
}

/**
 * Get verses for a reference as simple { number, text } for display
 * This is what your ScriptureReader component needs
 */
export function getScriptureVerses(reference: string, translation: 'kjv' | 'niv' = 'kjv'): { number: number; text: string }[] | null {
  const result = getScriptureForReference(reference, translation);
  if (!result) return null;
  
  return result.verses.map(v => ({
    number: v.number,
    text: v[translation]
  }));
}