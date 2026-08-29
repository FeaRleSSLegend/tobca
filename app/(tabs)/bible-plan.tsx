import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { theme } from '../../constants/theme';
import { useSharedStyles } from '../../constants/styles/sharedStyles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition, PressableScale } from '../../components/ui/motion';
import { TodayCard } from '../../components/bible/TodayCard';
import { StreakHero } from '../../components/bible/StreakHero';
import { StreakModal } from '../../components/bible/StreakModal';
import { ReadingCarousel, ReadingCarouselItem } from '../../components/bible/ReadingCarousel';
import { 
  getTodayReading, 
  getTomorrowReading,
  getProgress, 
  markDayAsRead,
  MAX_FREEZES,
  getWeekProgress,
  getEffectiveStreak,
  getConfirmedPassages,
  isDayFullyRead,
  PASSAGE_KEYS,
  PASSAGES_PER_DAY,
  getLegacyProgressNotice,
  acknowledgeLegacyProgressNotice,
  type PassageKey,
  type LegacyProgressNotice,
  ReadingProgress 
} from '../../utils/biblePlan.utils';
import { DayPlan, totalDays } from '../../data/biblePlan';
import { compactReference } from '../../utils/referenceParser';
import { TranslationCode, getSavedTranslation } from '../../services/bibleVersions';
import { getVersesForReference, Verse } from '../../services/bibleApi';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

export default function PlanScreen() {
  const styles = useStyles();
  const c = useThemeColors();
    const sharedStyles = useSharedStyles();
  const router = useRouter();
  const push = useGuardedPush();
  const bottomClearance = useTabBottomClearance();
  const [translation, setTranslation] = useState<TranslationCode>('niv');
  const [todayReading, setTodayReading] = useState<DayPlan | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isRead, setIsRead] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  // WHICH of today's four passages are confirmed, not merely whether one was
  // opened. This replaced `hasReadSomething`, whose name was the bug in
  // miniature: "something" was enough to complete the day.
  const [confirmedToday, setConfirmedToday] = useState<PassageKey[]>([]);
  const canComplete = confirmedToday.length === PASSAGES_PER_DAY;

  // A one-time, honest note about streak data earned under the old rule.
  // Null when there is nothing to disclose. See utils/biblePlan.utils.
  const [legacyNotice, setLegacyNotice] = useState<LegacyProgressNotice | null>(null);

  const [otVerses, setOtVerses] = useState<Verse[]>([]);
  const [ntVerses, setNtVerses] = useState<Verse[]>([]);
  const [psalmVerses, setPsalmVerses] = useState<Verse[]>([]);
  const [proverbVerses, setProverbVerses] = useState<Verse[]>([]);
  // Which previews FAILED (vs merely still loading) — drives per-card
  // fallbacks in the carousel instead of four cards stuck on "Loading…".
  const [previewFailed, setPreviewFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  // The translation is chosen once on the Bible Version screen and applies
  // app-wide — re-read on every focus so a change made from the reader is
  // reflected here without an app restart.
  useFocusEffect(
    useCallback(() => {
      getSavedTranslation().then((saved) => {
        setTranslation((current) => (saved !== current ? saved : current));
      });
    }, [])
  );

  useEffect(() => {
    if (!todayReading) return;

    let cancelled = false;
    setPreviewFailed({});

    // allSettled, NOT Promise.all — .all rejects wholesale, so ONE
    // reference the API stumbled on (a licensing gap in the selected
    // translation, a transient 500) took all four previews down with it
    // even though the other three had loaded fine. Each preview now
    // succeeds or fails independently: fulfilled results render, a
    // rejected one flags only its own card.
    Promise.allSettled([
      getVersesForReference(todayReading.oldTestament, translation),
      getVersesForReference(todayReading.newTestament, translation),
      getVersesForReference(todayReading.psalm, translation),
      getVersesForReference(todayReading.proverb, translation),
    ]).then(([ot, nt, psalm, proverb]) => {
      if (cancelled) return;
      const failed: Record<string, boolean> = {};
      const apply = (
        result: PromiseSettledResult<Verse[]>,
        key: string,
        set: (v: Verse[]) => void
      ) => {
        if (result.status === 'fulfilled') {
          set(result.value);
        } else {
          console.warn(`Preview failed for ${key}:`, result.reason);
          set([]);
          failed[key] = true;
        }
      };
      apply(ot, 'oldTestament', setOtVerses);
      apply(nt, 'newTestament', setNtVerses);
      apply(psalm, 'psalm', setPsalmVerses);
      apply(proverb, 'proverb', setProverbVerses);
      setPreviewFailed(failed);
    });

    return () => {
      cancelled = true;
    };
  }, [todayReading, translation]);

  // Re-check completion state every time this tab regains focus — covers
  // coming back from app/reading.tsx, which now marks the day complete on
  // its own the moment a passage renders. Without re-reading progress here
  // (not just the unlock flag), the card would keep offering "Mark as Read"
  // for a day the reader had already finished seconds earlier.
  useFocusEffect(
    useCallback(() => {
      if (!todayReading) return;
      getConfirmedPassages(todayReading.date).then(setConfirmedToday);
      getProgress().then((prog) => {
        setProgress(prog);
        setIsRead(prog.completedDays.includes(todayReading.date));
      });
    }, [todayReading])
  );

  useEffect(() => {
    getLegacyProgressNotice().then(setLegacyNotice);
  }, []);

  const dismissLegacyNotice = async () => {
    setLegacyNotice(null);
    await acknowledgeLegacyProgressNotice();
  };

  const loadData = async () => {
    const reading = getTodayReading();
    setTodayReading(reading);
    
    const prog = await getProgress();
    setProgress(prog);
    
    if (reading && prog.completedDays.includes(reading.date)) {
      setIsRead(true);
    }
  };

  const handleMarkAsRead = async () => {
    if (!todayReading) return;
    // markDayAsRead now REFUSES a day whose passages are not all confirmed,
    // and returns whether it actually completed. Trusting the return rather
    // than optimistically setting isRead is what stops the card claiming a
    // completion the store rejected.
    const completed = await markDayAsRead(todayReading.date);
    if (completed) {
      setIsRead(true);
      await loadData();
    }
  };

  const openReading = (item: ReadingCarouselItem) => {
    if (!todayReading) return;
    push({
      pathname: '/reading',
      params: {
        reference: item.reference,
        translation,
        label: item.label,
        readingKey: item.key,
        date: todayReading.date,
      },
    });
  };

  if (!todayReading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No reading for today</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weekProgress = getWeekProgress(progress?.completedDays || [], progress?.frozenDays || []);
  const todayNumber = new Date().getDate();
  // Displayed streak is DERIVED, not the raw stored value — the stored
  // number goes stale after missed days (it only updates on a mark), and
  // showing a dead streak as alive is worse than showing the truth.
  const effectiveStreak = progress ? getEffectiveStreak(progress) : 0;
  const tomorrow = getTomorrowReading();

  const readings: ReadingCarouselItem[] = [
    { key: 'oldTestament', label: 'Old Testament', reference: todayReading.oldTestament, verses: otVerses, failed: previewFailed.oldTestament, confirmed: confirmedToday.includes('oldTestament') },
    { key: 'newTestament', label: 'New Testament', reference: todayReading.newTestament, verses: ntVerses, failed: previewFailed.newTestament, confirmed: confirmedToday.includes('newTestament') },
    { key: 'psalm', label: 'Psalm', reference: todayReading.psalm, verses: psalmVerses, failed: previewFailed.psalm, confirmed: confirmedToday.includes('psalm') },
    { key: 'proverb', label: 'Proverb', reference: todayReading.proverb, verses: proverbVerses, failed: previewFailed.proverb, confirmed: confirmedToday.includes('proverb') },
  ];

  return (
    <TabTransition>
    <ScreenWithWatermark style={sharedStyles.container}>
      {/* Clearance is composed at the call site, not baked into scrollContent:
          the mini-player's footprint is a runtime value. See the note in
          hooks/useBottomClearance.ts. */}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomClearance }]}>
        <ScreenHeader title="Reading Plan" />

        {/* A ONE-TIME, DISMISSIBLE DISCLOSURE. Shown only to installs that
            already had completed days when the stricter rule shipped. It says
            what changed and what that means for the number on screen, and it
            does NOT offer to "fix" the history — see the note in
            utils/biblePlan.utils on why that correction cannot be made
            honestly. */}
        {legacyNotice && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeHead}>
              <Ionicons name="information-circle-outline" size={18} color={c.accent} />
              <Text style={styles.noticeTitle}>About your past streak</Text>
            </View>
            <Text style={styles.noticeBody}>
              Until this update, a day counted as read once you opened any one of its four
              readings. Each reading is now confirmed on its own, and a day is only complete
              when all four are. Your {legacyNotice.legacyCompletedCount} previously completed
              {legacyNotice.legacyCompletedCount === 1 ? ' day has' : ' days have'} been left
              exactly as recorded, so some may reflect the old rule.
            </Text>
            <PressableScale
              style={styles.noticeBtn}
              onPress={dismissLegacyNotice}
              accessibilityRole="button"
              accessibilityLabel="Got it, hide this note"
            >
              <Text style={styles.noticeBtnText}>Got it</Text>
            </PressableScale>
          </View>
        )}

        <TodayCard
          day={todayReading.day}
          isRead={isRead}
          canMarkAsRead={canComplete}
          confirmedCount={confirmedToday.length}
          totalPassages={PASSAGES_PER_DAY}
          onMarkAsRead={handleMarkAsRead}
          // progress === null means stored data is still in flight, so
          // isRead/canMarkAsRead are defaults rather than facts.
          loading={progress === null}
        />

        <StreakHero
          streak={effectiveStreak}
          week={weekProgress}
          completedCount={progress?.completedDays.length ?? 0}
          totalDays={totalDays}
          freezes={progress?.freezes ?? MAX_FREEZES}
          maxFreezes={MAX_FREEZES}
          onPress={() => setStreakModalVisible(true)}
        />

        {/* No manual spacer here. There used to be a 24pt one "to mark the
            pause" — but SectionLabel already carries its own section-sized
            top margin, so the two stacked into a hole roughly twice the size
            of every other gap on the screen. One owner per gap. */}
        <SectionLabel label="Today's Reading" />

        <ReadingCarousel readings={readings} onPressCard={openReading} />

        {/* Tomorrow, at a glance — lets tonight's reader see what's ahead
            (and roughly how heavy it is) without paging the plan forward.
            One quiet line, not a card: it's a preview, not a task. */}
        {tomorrow && (
          <View style={styles.tomorrowRow}>
            <Ionicons name="arrow-forward-circle-outline" size={16} color={c.textMuted} />
            <Text style={styles.tomorrowText} numberOfLines={1}>
              Tomorrow · {compactReference(tomorrow.oldTestament)} · {compactReference(tomorrow.newTestament)}
            </Text>
          </View>
        )}

      </ScrollView>

      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        streak={effectiveStreak}
        longestStreak={progress?.longestStreak || 0}
        completedCount={progress?.completedDays.length || 0}
        freezes={progress?.freezes ?? MAX_FREEZES}
        maxFreezes={MAX_FREEZES}
        week={weekProgress}
        todayNumber={todayNumber}
      />
    </ScreenWithWatermark>
    </TabTransition>
  );
}

const useStyles = makeThemedStyles((c) => ({
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    // paddingBottom is applied at the call site — it depends on whether the
    // mini-player is docked, which is a runtime fact.
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: theme.fontFamily.body,
    color: c.textSecondary,
  },
  // The one-time legacy-streak disclosure. An accent-washed card rather than
  // a banner: it is information about the reader's own record, so it sits in
  // the content flow where they will actually read it, not pinned as chrome.
  noticeCard: {
    backgroundColor: c.accentWash,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.accentTintEdge,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginTop: theme.space.related,
    gap: theme.space.tight,
  },
  noticeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
  },
  noticeTitle: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },
  noticeBody: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    lineHeight: theme.fontSize.body * 1.55,
    color: c.textSecondary,
  },
  noticeBtn: {
    alignSelf: 'flex-start',
    height: theme.control.height.sm,
    paddingHorizontal: theme.control.padX.md,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    marginTop: theme.space.micro,
  },
  noticeBtnText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.textPrimary,
  },
  tomorrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  tomorrowText: {
    flex: 1,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textSecondary,
  },
}));
