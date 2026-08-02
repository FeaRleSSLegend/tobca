// Dedicated full-screen scripture reader, pushed from the Bible Plan
// carousel. Deliberately minimal chrome — this screen exists to get out
// of the way of the text, not to look like the rest of the app.
//
// Reading-experience pass (this revision):
//  - CHAPTER BOUNDARIES: verses now know their chapter (see bibleApi.ts),
//    so a passage spanning "Job 39, 40, 41" renders each chapter under
//    its own divider instead of verse numbers silently resetting 30→1
//    mid-scroll with nothing marking the seam. One continuous scroll is
//    kept on purpose — dividers, not pagination.
//  - COMPACT TITLE: the header now reads "Job 39-41", not the raw
//    "Job 39:1-30, 40:1-24, 41:1-34" — the verse-by-verse detail is
//    what the body is FOR; the title only needs to orient.
//  - QUICK NAV: a floating bottom bar switches between the day's four
//    readings (OT / NT / Psalm / Proverb) without round-tripping through
//    the Plan tab. It hides while scrolling down (reading), returns on
//    scroll-up or a tap on the page — standard ebook-reader behavior.
//  - VERSION SWITCHING: the translation pill opens the Bible Version
//    screen; the choice persists and this screen re-reads it on focus.
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { TranslationCode, getSavedTranslation } from '../services/bibleVersions';
import { getVersesForReference, Verse } from '../services/bibleApi';
import { parseReadingReference } from '../utils/referenceParser';
import { markReadingUnlocked, getDayByDate } from '../utils/biblePlan.utils';
import { BibleQuickNav, QuickNavItem } from '../components/bible/BibleQuickNav';

const scrollKey = (date: string, readingKey: string) => `@bible_scroll_${date}_${readingKey}`;

// "Job 39:1-30, 40:1-24, 41:1-34" → "Job 39-41". Falls back to the raw
// reference for anything the parser can't read (never worse than before).
function compactReference(reference: string): string {
  const segments = parseReadingReference(reference);
  if (segments.length === 0) return reference;
  const books = new Set(segments.map((s) => s.book));
  if (books.size > 1) return reference; // cross-book reference — keep it explicit
  const chapters = segments.map((s) => s.chapter);
  const min = Math.min(...chapters);
  const max = Math.max(...chapters);
  const book = segments[0].book;
  return min === max ? `${book} ${min}` : `${book} ${min}-${max}`;
}

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { key: 'oldTestament', label: 'OT' },
  { key: 'newTestament', label: 'NT' },
  { key: 'psalm', label: 'Psalm' },
  { key: 'proverb', label: 'Proverb' },
];

const READING_LABELS: Record<string, string> = {
  oldTestament: 'Old Testament',
  newTestament: 'New Testament',
  psalm: 'Psalm',
  proverb: 'Proverb',
};

export default function ReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reference: string;
    translation: TranslationCode;
    label: string;
    readingKey: string;
    date: string;
  }>();
  const { date } = params;

  // Reference/label/key are STATE seeded from params, not read straight
  // off them — the quick nav switches readings in place, and params can't
  // change under a mounted screen.
  const [readingKey, setReadingKey] = useState(params.readingKey);
  const [reference, setReference] = useState(params.reference);
  const [label, setLabel] = useState(params.label);
  const [translation, setTranslation] = useState<TranslationCode>(params.translation ?? 'niv');

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(17);
  const [navVisible, setNavVisible] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const hasFiredUnlock = useRef(false);
  const saveOffsetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const lastOffsetY = useRef(0);

  const dayPlan = date ? getDayByDate(date) : null;

  // Re-read the persisted translation whenever this screen regains focus —
  // that's the return path from the Bible Version screen, and a changed
  // choice should re-render the passage without leaving the reader.
  useFocusEffect(
    useCallback(() => {
      getSavedTranslation().then((saved) => {
        setTranslation((current) => (saved !== current ? saved : current));
      });
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVersesForReference(reference, translation)
      .then(result => {
        if (!cancelled) setVerses(result);
      })
      .catch(err => console.error('Failed to load reading:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reference, translation]);

  // Restore scroll position once per reading — re-armed when the quick
  // nav switches to a different reading, so each of the four keeps its
  // own place.
  useEffect(() => {
    if (restoredRef.current || verses.length === 0 || !date || !readingKey) return;
    restoredRef.current = true;
    AsyncStorage.getItem(scrollKey(date, readingKey)).then(saved => {
      if (saved) {
        const y = Number(saved);
        setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
      }
    }).catch(() => {});
  }, [verses, date, readingKey]);

  const switchReading = (key: string) => {
    if (!dayPlan || key === readingKey) return;
    const nextReference =
      key === 'oldTestament' ? dayPlan.oldTestament :
      key === 'newTestament' ? dayPlan.newTestament :
      key === 'psalm' ? dayPlan.psalm : dayPlan.proverb;
    setReadingKey(key);
    setReference(nextReference);
    setLabel(READING_LABELS[key]);
    setVerses([]);
    restoredRef.current = false; // let the restore effect run for the new reading
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    // Auto-hide: scrolling down = reading, tuck the nav away; scrolling
    // up or being near the top = navigating, bring it back. The ±12
    // deadband keeps micro-jitters from flickering it.
    const dy = contentOffset.y - lastOffsetY.current;
    if (contentOffset.y < 40) {
      setNavVisible(true);
    } else if (dy > 12) {
      setNavVisible(false);
    } else if (dy < -12) {
      setNavVisible(true);
    }
    lastOffsetY.current = contentOffset.y;

    if (date && readingKey) {
      if (saveOffsetTimer.current) clearTimeout(saveOffsetTimer.current);
      saveOffsetTimer.current = setTimeout(() => {
        AsyncStorage.setItem(scrollKey(date, readingKey), String(contentOffset.y)).catch(() => {});
      }, 400);
    }

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 24 && !hasFiredUnlock.current && date) {
      hasFiredUnlock.current = true;
      markReadingUnlocked(date);
    }
  };

  // Chapter dividers only earn their ink when the passage actually spans
  // more than one chapter — a single-chapter Psalm doesn't need a divider
  // restating what the title already said.
  const distinctChapters = new Set(
    verses.map((v) => `${v.book ?? ''}|${v.chapter ?? ''}`)
  ).size;
  const showChapterDividers = distinctChapters > 1;

  let prevChapterKey: string | null = null;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>

        <Pressable
          style={styles.translationPill}
          onPress={() => router.push('/bible-versions')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Bible version ${translation?.toUpperCase()}, change version`}
        >
          <Text style={styles.translationText}>{translation?.toUpperCase()}</Text>
          <Ionicons name="chevron-down" size={12} color={theme.colors.graySecondary} />
        </Pressable>

        <View style={styles.fontControls}>
          <Pressable onPress={() => setFontSize(s => Math.max(15, s - 2))} style={styles.sizeBtn} hitSlop={8}>
            <Text style={styles.sizeBtnText}>A-</Text>
          </Pressable>
          <Pressable onPress={() => setFontSize(s => Math.min(26, s + 2))} style={styles.sizeBtn} hitSlop={8}>
            <Text style={styles.sizeBtnText}>A+</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        contentContainerStyle={styles.scrollContent}
      >
        {/* The page itself toggles the quick nav on tap — the standard
            ebook gesture. A Pressable wrapper (not an overlay) so scrolls
            and text selection keep working untouched. */}
        <Pressable onPress={() => setNavVisible(v => !v)} accessible={false}>
          <Text style={styles.eyebrow}>{label?.toUpperCase()}</Text>
          <Text style={styles.title}>{compactReference(reference)}</Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading…</Text>
          ) : (
            verses.map((verse, index) => {
              const chapterKey = `${verse.book ?? ''}|${verse.chapter ?? ''}`;
              const isNewChapter = showChapterDividers && chapterKey !== prevChapterKey;
              prevChapterKey = chapterKey;
              return (
                <View key={index}>
                  {isNewChapter && verse.chapter !== undefined && (
                    <View style={[styles.chapterDivider, index === 0 && styles.chapterDividerFirst]}>
                      <View style={styles.chapterRule} />
                      <Text style={styles.chapterLabel}>
                        {`Chapter ${verse.chapter}`}
                      </Text>
                      <View style={styles.chapterRule} />
                    </View>
                  )}
                  <Text style={[styles.verse, { fontSize, lineHeight: fontSize * 1.7 }]}>
                    <Text style={styles.verseNumber}>{verse.number} </Text>
                    {verse.text}
                  </Text>
                </View>
              );
            })
          )}
        </Pressable>
      </ScrollView>

      {dayPlan && (
        <BibleQuickNav
          items={QUICK_NAV_ITEMS}
          activeKey={readingKey}
          visible={navVisible}
          onSelect={switchReading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: theme.colors.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
  },
  translationText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    letterSpacing: 0.5,
  },
  fontControls: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  sizeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.slate,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl * 2,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 28,
    color: theme.colors.navy,
    marginBottom: theme.spacing.xl,
  },
  loadingText: {
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
  },
  // Centered label between two hairlines — the classic book treatment for
  // a chapter break: unmistakable as a boundary, but quiet enough (small
  // caps-ish tracking, gray rules) not to shout inside the reading flow.
  chapterDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  // The FIRST chapter's divider sits right under the title, which already
  // provides the top spacing — doubling it opened a hole before verse 1.
  chapterDividerFirst: {
    marginTop: 0,
  },
  chapterRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.grayBorder,
  },
  chapterLabel: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.slate,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  verse: {
    fontFamily: theme.fontFamily.serif,
    color: '#2C3E50',
    marginBottom: theme.spacing.lg,
  },
  verseNumber: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 13,
    color: theme.colors.pink,
  },
});
