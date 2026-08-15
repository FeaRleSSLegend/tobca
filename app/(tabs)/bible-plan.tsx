import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition } from '../../components/ui/motion';
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
  isReadingUnlocked,
  ReadingProgress 
} from '../../utils/biblePlan.utils';
import { DayPlan, totalDays } from '../../data/biblePlan';
import { compactReference } from '../../utils/referenceParser';
import { TranslationCode, getSavedTranslation } from '../../services/bibleVersions';
import { getVersesForReference, Verse } from '../../services/bibleApi';

export default function PlanScreen() {
  const router = useRouter();
  const push = useGuardedPush();
  const bottomClearance = useTabBottomClearance();
  const [translation, setTranslation] = useState<TranslationCode>('niv');
  const [todayReading, setTodayReading] = useState<DayPlan | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isRead, setIsRead] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  // Driven by isReadingUnlocked, re-checked on focus (see below) rather than
  // by a scroll event on this screen — the actual reading now happens on a
  // separate pushed screen (app/reading.tsx), so this can't be local state
  // that a scroll handler flips directly anymore.
  const [hasReadSomething, setHasReadSomething] = useState(false);

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
      isReadingUnlocked(todayReading.date).then(setHasReadSomething);
      getProgress().then((prog) => {
        setProgress(prog);
        setIsRead(prog.completedDays.includes(todayReading.date));
      });
    }, [todayReading])
  );

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
    if (todayReading) {
      await markDayAsRead(todayReading.date);
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
    { key: 'oldTestament', label: 'Old Testament', reference: todayReading.oldTestament, verses: otVerses, failed: previewFailed.oldTestament },
    { key: 'newTestament', label: 'New Testament', reference: todayReading.newTestament, verses: ntVerses, failed: previewFailed.newTestament },
    { key: 'psalm', label: 'Psalm', reference: todayReading.psalm, verses: psalmVerses, failed: previewFailed.psalm },
    { key: 'proverb', label: 'Proverb', reference: todayReading.proverb, verses: proverbVerses, failed: previewFailed.proverb },
  ];

  return (
    <TabTransition>
    <ScreenWithWatermark style={sharedStyles.container}>
      {/* Clearance is composed at the call site, not baked into scrollContent:
          the mini-player's footprint is a runtime value. See the note in
          hooks/useBottomClearance.ts. */}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomClearance }]}>
        <View style={sharedStyles.headerRow}>
          <Text style={sharedStyles.screenTitle}>Reading Plan</Text>
          <View style={sharedStyles.avatar}>
            <Text style={styles.avatarText}>JN</Text>
          </View>
        </View>

        <TodayCard
          day={todayReading.day}
          isRead={isRead}
          canMarkAsRead={hasReadSomething}
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
            <Ionicons name="arrow-forward-circle-outline" size={16} color={theme.colors.grayIcon} />
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

const styles = StyleSheet.create({
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
    color: theme.colors.graySecondary,
  },
  avatarText: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.white,
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
    color: theme.colors.graySecondary,
  },
});