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
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { useAutoHideOnScroll } from '../hooks/useAutoHideOnScroll';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { makeThemedStyles, useThemeColors } from '../hooks/useTheme';
import { useSheetStyles, sheetStylesFor } from '../constants/styles/sharedStyles';
import { TranslationCode, getSavedTranslation } from '../services/bibleVersions';
import { getVersesForReference, Verse } from '../services/bibleApi';
import { HIGHLIGHT_COLORS, colorValue, verseKey, getAllHighlights, setHighlight } from '../utils/highlights';
import { compactReference } from '../utils/referenceParser';
import {
  confirmPassageRead,
  unconfirmPassageRead,
  getConfirmedPassages,
  getDayByDate,
  PASSAGE_KEYS,
  type PassageKey,
} from '../utils/biblePlan.utils';
import { BibleQuickNav, QuickNavItem } from '../components/bible/BibleQuickNav';
import { PopIn, FadeInUp, PressableScale } from '../components/ui/motion';
import { BrandLoader } from '../components/ui/BrandLoader';

const scrollKey = (date: string, readingKey: string) => `@bible_scroll_${date}_${readingKey}`;

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
  const styles = useStyles();
  const c = useThemeColors();
  const sheetStyles = useSheetStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const push = useGuardedPush();
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
  // Which of the day's four passages have been explicitly confirmed. Read on
  // mount and kept in sync as the quick-nav switches between them, so the
  // button below always reflects the passage currently on screen.
  const [confirmed, setConfirmed] = useState<PassageKey[]>([]);
  const [reference, setReference] = useState(params.reference);
  const [label, setLabel] = useState(params.label);
  const [translation, setTranslation] = useState<TranslationCode>(params.translation ?? 'niv');

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // verseKey -> colorId, loaded once and updated in place as the reader taps.
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  // The verse whose color menu is open (null = menu closed).
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);

  // Load saved highlights once.
  useEffect(() => {
    getAllHighlights().then(setHighlights);
  }, []);

  // Apply (or clear) a color on the currently-selected verse, persist, and
  // close the menu. Optimistically updates local state so the highlight
  // appears instantly.
  const applyHighlight = useCallback(async (colorId: string | null) => {
    if (!activeVerse) return;
    const key = verseKey(activeVerse.book, activeVerse.chapter, activeVerse.number);
    setHighlights((prev) => {
      const next = { ...prev };
      if (colorId === null) delete next[key];
      else next[key] = colorId;
      return next;
    });
    setActiveVerse(null);
    await setHighlight(key, colorId);
  }, [activeVerse]);
  const [fontSize, setFontSize] = useState(17);
  const {
    visible: navVisible,
    onScroll: autoHideOnScroll,
    toggle: toggleNav,
  } = useAutoHideOnScroll();
  const [retryCount, setRetryCount] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const saveOffsetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const lastFetchedReference = useRef<string | null>(null);

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
    // Stale-while-switching: when only the TRANSLATION changed, the old
    // text stays on screen (with a small switching indicator) until the
    // new version arrives — usually instantly, since the version screen
    // prefetched it. Blanking to a full-screen "Loading…" is reserved for
    // an actual passage change, where the old text would be the WRONG
    // text rather than the same passage in yesterday's wording.
    if (lastFetchedReference.current !== reference) {
      setVerses([]);
    }
    setLoading(true);
    setLoadError(false);
    // bypassCache on a RETRY only. A first load should still be served from
    // disk instantly when the passage is already there — that is the whole
    // point of the cache. But a retry exists because the previous attempt
    // produced nothing usable, and reading the same store again cannot change
    // that answer: it is what made "Try again" show a spinner and return the
    // identical failure without a request ever leaving the device. See the
    // long note on getVersesForReference.
    getVersesForReference(reference, translation, { bypassCache: retryCount > 0 })
      .then(result => {
        if (cancelled) return;
        lastFetchedReference.current = reference;
        setVerses(result);
      })
      .catch(err => {
        console.error('Failed to load reading:', err);
        // Only a TOTAL failure reaches here now — getVersesForReference
        // returns partial results rather than throwing when SOME of the
        // passage loaded. So this genuinely means nothing loaded, which
        // earns a real retryable error state instead of a blank page.
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reference, translation, retryCount]);

  // THE AUTO-COMPLETE THAT USED TO LIVE HERE IS GONE.
  //
  // It ran `markReadingUnlocked(date); markDayAsRead(date);` as soon as verses
  // rendered, on the argument that "opening a reading IS reading it". That
  // argument does not survive the plan's actual shape: a day has FOUR
  // passages, and this fired on the first one. Opening a single Psalm
  // completed the whole day and advanced the streak, so the streak counted
  // app-opens rather than reading — which is exactly the integrity bug this
  // change exists to fix.
  //
  // Confirmation is now an explicit, per-passage action (the button at the end
  // of the passage below), and the day completes only when all four are
  // confirmed. See the note in utils/biblePlan.utils.ts.

  // The day's confirmations, re-read whenever the day changes. Cheap (one
  // AsyncStorage read) and it has to be re-read on focus-return too, because
  // the Plan tab can reset a day.
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    getConfirmedPassages(date).then((keys) => {
      if (!cancelled) setConfirmed(keys);
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const isConfirmed = !!readingKey && confirmed.includes(readingKey as PassageKey);

  // A TOGGLE, not a one-way latch. Someone who taps it by accident, or who
  // wants to re-read a passage properly, must be able to take it back —
  // otherwise the honest thing (undo) is impossible and the dishonest thing
  // (an inflated streak) is permanent, which is the failure this whole change
  // is about.
  const togglePassageRead = async () => {
    if (!date || !readingKey) return;
    const key = readingKey as PassageKey;
    const next = isConfirmed
      ? await unconfirmPassageRead(date, key)
      : await confirmPassageRead(date, key);
    setConfirmed(next);
  };

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

    // Auto-hide: scrolling down = reading, tuck the nav away; scrolling up or
    // being near the top = navigating, bring it back. The rule now lives in
    // useAutoHideOnScroll so the Library filter row behaves identically —
    // this screen keeps only the parts that are actually about reading.
    autoHideOnScroll(e);

    if (date && readingKey) {
      if (saveOffsetTimer.current) clearTimeout(saveOffsetTimer.current);
      saveOffsetTimer.current = setTimeout(() => {
        AsyncStorage.setItem(scrollKey(date, readingKey), String(contentOffset.y)).catch(() => {});
      }, 400);
    }

    // Reaching the bottom no longer confirms anything either. Scrolling past
    // the last verse is not the same as having read it, and it was the second
    // way a day could be completed without the reader saying so.
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
          <Ionicons name="chevron-back" size={26} color={c.navy} />
        </Pressable>

        <Pressable
          style={styles.translationPill}
          onPress={() => push('/bible-versions')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Bible version ${translation?.toUpperCase()}, change version`}
        >
          <Text style={styles.translationText}>{translation?.toUpperCase()}</Text>
          <Ionicons name="chevron-down" size={12} color={c.graySecondary} />
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
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* The page itself toggles the quick nav on tap — the standard
            ebook gesture. A Pressable wrapper (not an overlay) so scrolls
            and text selection keep working untouched. */}
        <Pressable onPress={toggleNav} accessible={false}>
          {/* MASTHEAD. The references all open a passage the same way: a small
              tracked label, then the reference set large and centred, then a
              lot of air before the first verse. Centring is the change that
              matters — left-aligned it read as another screen header; centred
              with space above and below it reads as a title page, and the
              scroll that follows feels like a book rather than a feed. */}
          <View style={styles.masthead}>
            <Text style={styles.eyebrow}>{label?.toUpperCase()}</Text>
            <Text style={styles.title}>{compactReference(reference)}</Text>
          </View>

          {/* Visible only during a translation switch with old text still
              on screen — a one-line whisper, not a loading screen. */}
          {loading && verses.length > 0 && (
            <View style={styles.switchingRow}>
              <BrandLoader width={54} />
              <Text style={styles.switchingText}>Loading {translation?.toUpperCase()}</Text>
            </View>
          )}

          {loading && verses.length === 0 ? (
            // Full-passage load (not a version switch) — the branded loader
            // carries the wait instead of the word "Loading…".
            <View style={styles.passageLoading}>
              <BrandLoader width={170} />
              <Text style={styles.switchingText}>Loading {translation?.toUpperCase()}</Text>
            </View>
          ) : loadError && verses.length === 0 ? (
            <View style={styles.errorBlock}>
              <Ionicons name="cloud-offline-outline" size={28} color={c.grayIcon} />
              <Text style={styles.errorTitle}>Couldn't load this passage</Text>
              <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
              <Pressable
                onPress={() => setRetryCount((c) => c + 1)}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Retry loading passage"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : verses.length === 0 ? (
            // Loaded successfully but empty — a one-verse reference that is
            // itself a textual variant, or a translation whose catalogue does
            // not carry this book (see the ASV note in bibleVersions.ts).
            //
            // This gets a Try again of its own now. It used to be a sentence
            // and nothing else, which made it a dead end: an empty result is
            // indistinguishable from a failure to the person looking at it,
            // and until recently it was also CACHED, so the dead end was
            // permanent. The retry now bypasses that cache, so tapping it is a
            // real second attempt rather than a re-read of the same nothing.
            <View style={styles.errorBlock}>
              <Ionicons name="book-outline" size={28} color={c.grayIcon} />
              <Text style={styles.errorTitle}>No verses to display</Text>
              <Text style={styles.errorSubtitle}>
                This passage came back empty. It may not be available in{' '}
                {translation?.toUpperCase()}.
              </Text>
              <Pressable
                onPress={() => setRetryCount((c) => c + 1)}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Retry loading passage"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            // The passage SETTLES in rather than cutting. The key restarts it
            // on every reference/translation change, so switching version or
            // tapping through the quick-nav lands softly instead of snapping.
            // 6pt of travel, not the default 8 — long text needs less movement
            // than a card to read as arriving, and more would look like a jolt.
            <FadeInUp key={`${reference}:${translation}`} offset={6}>
            {verses.map((verse, index) => {
              const chapterKey = `${verse.book ?? ''}|${verse.chapter ?? ''}`;
              const isNewChapter = showChapterDividers && chapterKey !== prevChapterKey;
              prevChapterKey = chapterKey;
              return (
                <View key={index}>
                  {isNewChapter && verse.chapter !== undefined && (
                    <View style={[styles.chapterDivider, index === 0 && styles.chapterDividerFirst]}>
                      <View style={styles.chapterRule} />
                      <Text style={styles.chapterLabel}>
                        {/* Book name travels WITH every chapter marker — a
                            reader mid-scroll in a Job-then-Psalms passage
                            has no other way to know which book "Chapter 2"
                            belongs to without scrolling back to the top. */}
                        {verse.book ? `${verse.book} · Chapter ${verse.chapter}` : `Chapter ${verse.chapter}`}
                      </Text>
                      <View style={styles.chapterRule} />
                    </View>
                  )}
                  <Text
                    onPress={() => setActiveVerse(verse)}
                    style={[
                      styles.verse,
                      { fontSize, lineHeight: fontSize * theme.editorial.readingLineHeight },
                      colorValue(highlights[verseKey(verse.book, verse.chapter, verse.number)]) != null && {
                        backgroundColor: colorValue(highlights[verseKey(verse.book, verse.chapter, verse.number)]),
                      },
                    ]}
                  >
                    {/* Superscript, muted — see styles.verseNumber. */}
                    <Text style={[styles.verseNumber, { fontSize: Math.round(fontSize * 0.62) }]}>
                      {verse.number}
                    </Text>
                    <Text>  </Text>
                    {verse.text}
                  </Text>
                </View>
              );
            })}

            {/* THE CONFIRMATION. Placed at the END of the passage, after the
                last verse, because that is where someone who has actually read
                it arrives — and it is the one position that cannot be tapped
                without at least scrolling past the text. It is not a gate
                (nothing stops you tapping it early); it is an explicit
                statement, which is all the streak ever needed and never had. */}
            {!!date && !!readingKey && (
              <PressableScale
                style={[styles.confirmBtn, isConfirmed && styles.confirmBtnDone]}
                onPress={togglePassageRead}
                accessibilityRole="button"
                accessibilityState={{ checked: isConfirmed }}
                accessibilityLabel={
                  isConfirmed
                    ? `${label} marked as read. Tap to undo.`
                    : `Mark ${label} as read`
                }
              >
                <Ionicons
                  name={isConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isConfirmed ? c.success : c.textSecondary}
                />
                <Text style={[styles.confirmText, isConfirmed && styles.confirmTextDone]}>
                  {isConfirmed ? 'Read' : "I've read this"}
                </Text>
              </PressableScale>
            )}

            {/* How much of the DAY is left, so the button above has a visible
                consequence instead of just changing its own colour. */}
            {!!date && (
              <Text style={styles.confirmProgress}>
                {confirmed.length} of {PASSAGE_KEYS.length} readings confirmed today
              </Text>
            )}
            </FadeInUp>
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

      {/* Highlight color picker — a light bottom sheet that appears when a
          verse is tapped. Pink and purple lead (brand + what was asked
          for); the rest give choice. If the verse is already highlighted, a
          Remove option clears it. */}
      {activeVerse && (
        <>
          <Pressable style={sheetStyles.scrim} onPress={() => setActiveVerse(null)} accessibilityLabel="Close highlight menu" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.xxl }]}>
            <View style={sheetStyles.handle} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {activeVerse.book ? `${activeVerse.book} ` : ''}
              {activeVerse.chapter ? `${activeVerse.chapter}:` : ''}{activeVerse.number}
            </Text>
            <Text style={styles.sheetSub}>Highlight</Text>
            <View style={styles.swatchRow}>
              {HIGHLIGHT_COLORS.map((swatch) => {
                const selected =
                  highlights[verseKey(activeVerse.book, activeVerse.chapter, activeVerse.number)] === swatch.id;
                return (
                  <Pressable
                    key={swatch.id}
                    onPress={() => applyHighlight(swatch.id)}
                    style={[styles.swatch, { backgroundColor: swatch.value }, selected && styles.swatchSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`Highlight ${swatch.label}`}
                    accessibilityState={{ selected }}
                  >
                    {/* The tick mounts the instant a colour is applied, so
                        popping it in is the app confirming the highlight
                        rather than the swatch just quietly redrawing. */}
                    {selected && (
                      <PopIn>
                        <Ionicons name="checkmark" size={18} color={c.navy} />
                      </PopIn>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {highlights[verseKey(activeVerse.book, activeVerse.chapter, activeVerse.number)] && (
              <Pressable onPress={() => applyHighlight(null)} style={styles.removeBtn} accessibilityRole="button" accessibilityLabel="Remove highlight">
                <Ionicons name="close-circle-outline" size={18} color={c.graySecondary} />
                <Text style={styles.removeText}>Remove highlight</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: c.grayBorder,
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
    backgroundColor: c.bg,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.space.micro,
  },
  translationText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
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
    backgroundColor: c.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: c.slate,
    // Was fontWeight with no fontFamily -> fell back to the system font.
    fontFamily: theme.fontFamily.bodyBold,
},
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    // No top padding here. The masthead below is always the first child and
    // sets its own opening air deliberately (see its note); 20 here landed on
    // top of the masthead's own 20 for 40pt from two owners, so any later
    // change to "how much air before the title" would have moved only half of
    // it. The masthead owns the whole thing now — the rendered distance is
    // unchanged, this just makes it adjustable in one place.
    paddingTop: 0,
    paddingBottom: theme.layout.scrollClearance.stack,
  },
  // Generous, deliberately. The refs give the title block roughly a third of
  // the first screen before any body text — that pause is what signals
  // "settle in and read" instead of "scan this".
  masthead: {
    alignItems: 'center',
    // The sole owner of the space above the title — 40 (the `major` step,
    // a change of subject) is the full opening pause, not half of it.
    paddingTop: theme.space.major,
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.md,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    // Brand pink, restored by request. The eyebrow is one small element per
    // screen, not a repeated run, so it brands the reader without the
    // repetition problem the verse numbers had.
    color: c.pink,
    letterSpacing: theme.editorial.trackLabel,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: theme.editorial.mastheadTitle,
    // Large serif set at 0 tracking reads loose; pulling it in is what makes
    // it look typeset rather than merely big.
    letterSpacing: theme.editorial.trackTight,
    lineHeight: theme.editorial.mastheadTitle * 1.15,
    color: c.navy,
    textAlign: 'center',
  },
  switchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  // Vertical stack for the full-passage wait: the mark reads as the subject,
  // with the translation named underneath so the wait is explained.
  passageLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
  },
  switchingText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
  errorBlock: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.sm,
  },
  errorTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.navy,
    marginTop: theme.spacing.xs,
  },
  errorSubtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: c.textPrimary,
  },
  // The per-passage confirmation. Sized on the shared control scale, and
  // deliberately quiet: it is a statement of fact, not the screen's hero.
  confirmBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.control.gap.md,
    height: theme.control.height.md,
    paddingHorizontal: theme.control.padX.lg,
    marginTop: theme.space.major,
    borderRadius: theme.radius.full,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  confirmBtnDone: {
    borderColor: c.success,
    backgroundColor: c.successWash,
  },
  confirmText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },
  confirmTextDone: {
    color: c.success,
  },
  confirmProgress: {
    marginTop: theme.space.header,
    textAlign: 'center',
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textMuted,
  },
  retryText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.navy,
  },
  // Scrim and handle come from the shared sheet recipe now; the absolute
  // positioning is what is specific here, since this sheet is not in a Modal.
  sheet: {
    ...sheetStylesFor(c).sheet,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetTitle: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    color: c.navy,
  },
  sheetSub: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: c.grayIcon,
    marginTop: theme.space.hairline,
    marginBottom: theme.spacing.md,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  // Selection has to survive being drawn on top of five different fills, so
  // it is a heavy ring plus the checkmark rather than a colour change - the
  // old 1pt-to-2pt border shift was nearly invisible on the darker swatches.
  swatchSelected: {
    borderWidth: 3,
    borderColor: c.textPrimary,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    minHeight: 44,
  },
  removeText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.graySecondary,
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
    backgroundColor: c.grayBorder,
  },
  chapterLabel: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.slate,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  verse: {
    fontFamily: theme.fontFamily.serif,
    // Was #2C3E50, an off-palette slate a shade cooler than anything else
    // in the app. Scripture body text is the last place that should drift.
    color: c.navy,
    marginBottom: theme.editorial.verseGap,
  },
  // Pink, restored by request — it is what makes the reader feel like OUR
  // reader rather than a generic Bible view. Kept SUPERSCRIPT and ratio-sized
  // (the two fixes worth keeping): at a fixed 13pt they stopped scaling when
  // the reader bumped the font, and set at body size they broke the line.
  // Small + pink brands the page; large + pink fought the text.
  verseNumber: {
    fontFamily: theme.fontFamily.bodySemibold,
    color: c.pink,
  },
}));
