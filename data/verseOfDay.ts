// data/verseOfDay.ts
// THE VERSE POOL.
//
// This file used to export a single hardcoded object — Psalm 46:10, "Be still,
// and know that I am God." — which is why every screenshot ever taken of this
// app shows the same verse. It was never randomised; there was nothing to
// randomise from. The rotation itself lives in hooks/useVerseOfDay.ts; this
// file is only the pool it draws on.
//
// TRANSLATION: KJV throughout, and that is a licensing decision, not a
// stylistic one. The King James Version is public domain, so these can be
// shipped inside the binary. The NIV is not — Biblica's licence permits up to
// 500 verses in a non-commercial work with attribution, but "500 verses baked
// into an app store listing" is exactly the case their terms ask you to write
// in about, and the app already fetches NIV text from an API at runtime for
// the reading plan rather than embedding it. Same rule here: what ships in the
// bundle is public domain.
//
// POOL SIZE MATTERS AND IS CHECKED. The rotation excludes anything shown in
// the trailing 30 days, so a pool of 30 or fewer would exhaust itself and fall
// back to least-recently-used every single day — which is a fancy way of
// spelling "fixed 30-day loop". VERSE_POOL_SIZE below is exported so the hook
// can report it and so the assertion in the test of that hook has something to
// assert against. At 61 verses there are two full months of headroom.
//
// SELECTION: short enough to read at a glance on a card (the card clamps at 5
// lines), and weighted toward comfort/assurance/instruction rather than
// narrative fragments, which is what a verse shown out of context can carry
// without being misread.

export interface VerseOfDay {
  /** The canonical reference. Doubles as the verse's stable id in history. */
  reference: string;
  text: string;
}

export const verseOfDayPool: VerseOfDay[] = [
  { reference: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
  { reference: 'Proverbs 3:5', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { reference: 'Proverbs 3:6', text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
  { reference: 'Isaiah 40:31', text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.' },
  { reference: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee.' },
  { reference: 'Isaiah 26:3', text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.' },
  { reference: 'Isaiah 43:2', text: 'When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee.' },
  { reference: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
  { reference: 'Jeremiah 33:3', text: 'Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.' },
  { reference: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
  { reference: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
  { reference: 'Psalm 27:1', text: 'The LORD is my light and my salvation; whom shall I fear?' },
  { reference: 'Psalm 34:8', text: 'O taste and see that the LORD is good: blessed is the man that trusteth in him.' },
  { reference: 'Psalm 34:18', text: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.' },
  { reference: 'Psalm 37:4', text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.' },
  { reference: 'Psalm 55:22', text: 'Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.' },
  { reference: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
  { reference: 'Psalm 121:1', text: 'I will lift up mine eyes unto the hills, from whence cometh my help.' },
  { reference: 'Psalm 121:2', text: 'My help cometh from the LORD, which made heaven and earth.' },
  { reference: 'Psalm 139:14', text: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works.' },
  { reference: 'Psalm 118:24', text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.' },
  { reference: 'Psalm 91:1', text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.' },
  { reference: 'Psalm 62:1', text: 'Truly my soul waiteth upon God: from him cometh my salvation.' },
  { reference: 'Psalm 30:5', text: 'Weeping may endure for a night, but joy cometh in the morning.' },
  { reference: 'Psalm 19:14', text: 'Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD.' },
  { reference: 'Lamentations 3:22', text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not.' },
  { reference: 'Lamentations 3:23', text: 'They are new every morning: great is thy faithfulness.' },
  { reference: 'Matthew 5:16', text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.' },
  { reference: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
  { reference: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
  { reference: 'Matthew 19:26', text: 'With men this is impossible; but with God all things are possible.' },
  { reference: 'Mark 11:24', text: 'What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.' },
  { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { reference: 'John 8:32', text: 'And ye shall know the truth, and the truth shall make you free.' },
  { reference: 'John 14:6', text: 'I am the way, the truth, and the life: no man cometh unto the Father, but by me.' },
  { reference: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: let not your heart be troubled, neither let it be afraid.' },
  { reference: 'John 15:5', text: 'I am the vine, ye are the branches: he that abideth in me, and I in him, the same bringeth forth much fruit.' },
  { reference: 'John 16:33', text: 'In the world ye shall have tribulation: but be of good cheer; I have overcome the world.' },
  { reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { reference: 'Romans 8:31', text: 'If God be for us, who can be against us?' },
  { reference: 'Romans 12:2', text: 'Be not conformed to this world: but be ye transformed by the renewing of your mind.' },
  { reference: 'Romans 15:13', text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope.' },
  { reference: '1 Corinthians 10:13', text: 'God is faithful, who will not suffer you to be tempted above that ye are able.' },
  { reference: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.' },
  { reference: '1 Corinthians 16:14', text: 'Let all your things be done with charity.' },
  { reference: '2 Corinthians 5:7', text: 'For we walk by faith, not by sight.' },
  { reference: '2 Corinthians 12:9', text: 'My grace is sufficient for thee: for my strength is made perfect in weakness.' },
  { reference: 'Galatians 5:22', text: 'The fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.' },
  { reference: 'Galatians 6:9', text: 'Let us not be weary in well doing: for in due season we shall reap, if we faint not.' },
  { reference: 'Ephesians 2:8', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.' },
  { reference: 'Ephesians 4:32', text: 'Be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you.' },
  { reference: 'Philippians 4:6', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
  { reference: 'Philippians 4:7', text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  { reference: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.' },
  { reference: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' },
  { reference: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
  { reference: 'Hebrews 13:8', text: 'Jesus Christ the same yesterday, and to day, and for ever.' },
  { reference: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and it shall be given him.' },
  { reference: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.' },
  { reference: '1 John 4:19', text: 'We love him, because he first loved us.' },
];

/** Exported so the rotation can report it — see the note above on why it matters. */
export const VERSE_POOL_SIZE = verseOfDayPool.length;

/** The window the rotation refuses to repeat inside, in days. */
export const NO_REPEAT_DAYS = 30;

const byReference = new Map(verseOfDayPool.map((v) => [v.reference, v]));

/** Look a verse up by the id stored in history. Undefined if the pool changed. */
export function getVerse(reference: string): VerseOfDay | undefined {
  return byReference.get(reference);
}

/**
 * The fallback shown for the single frame before AsyncStorage answers, and the
 * last-resort answer if the pool were ever emptied. Deliberately the verse the
 * app has always shown, so the change is invisible in the failure case.
 */
export const fallbackVerse: VerseOfDay = verseOfDayPool[0];
