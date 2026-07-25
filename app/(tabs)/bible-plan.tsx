import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { TodayCard } from '../../components/bible/TodayCard';
import { StreakSummary } from '../../components/bible/StreakSummary';
import { StreakModal } from '../../components/bible/StreakModal';
import { ReadingCarousel, ReadingCarouselItem } from '../../components/bible/ReadingCarousel';
import { 
  getTodayReading, 
  getProgress, 
  markDayAsRead,
  getCompletionPercentage,
  getWeekProgress,
  isReadingUnlocked,
  ReadingProgress 
} from '../../utils/biblePlan.utils';
import { DayPlan } from '../../data/biblePlan';
import { TranslationCode } from '../../services/bibleVersions';
import { getVersesForReference, Verse } from '../../services/bibleApi';

export default function PlanScreen() {
  const router = useRouter();
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!todayReading) return;

    let cancelled = false;

    Promise.all([
      getVersesForReference(todayReading.oldTestament, translation),
      getVersesForReference(todayReading.newTestament, translation),
      getVersesForReference(todayReading.psalm, translation),
      getVersesForReference(todayReading.proverb, translation),
    ])
      .then(([ot, nt, psalm, proverb]) => {
        if (cancelled) return;
        setOtVerses(ot);
        setNtVerses(nt);
        setPsalmVerses(psalm);
        setProverbVerses(proverb);
      })
      .catch(err => console.error('Failed to load verses:', err));

    return () => {
      cancelled = true;
    };
  }, [todayReading, translation]);

  // Re-check the unlock flag every time this tab regains focus — covers
  // coming back from app/reading.tsx after finishing a passage there.
  useFocusEffect(
    useCallback(() => {
      if (!todayReading) return;
      isReadingUnlocked(todayReading.date).then(setHasReadSomething);
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
    router.push({
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

  const percentage = progress ? getCompletionPercentage(progress.completedDays) : 0;
  const weekProgress = getWeekProgress(progress?.completedDays || []);
  const todayNumber = new Date().getDate();

  const readings: ReadingCarouselItem[] = [
    { key: 'oldTestament', label: 'Old Testament', reference: todayReading.oldTestament, verses: otVerses },
    { key: 'newTestament', label: 'New Testament', reference: todayReading.newTestament, verses: ntVerses },
    { key: 'psalm', label: 'Psalm', reference: todayReading.psalm, verses: psalmVerses },
    { key: 'proverb', label: 'Proverb', reference: todayReading.proverb, verses: proverbVerses },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <Text style={styles.pageTitle}>Reading Plan</Text>
          <View style={sharedStyles.avatar}>
            <Text style={styles.avatarText}>JN</Text>
          </View>
        </View>

        <TodayCard 
          day={todayReading.day}
          isRead={isRead}
          canMarkAsRead={hasReadSomething}
          onMarkAsRead={handleMarkAsRead}
        />

        <StreakSummary
          streak={progress?.currentStreak || 0}
          percentage={percentage}
          onPress={() => setStreakModalVisible(true)}
        />

        <SectionLabel label="Today's Reading" />

        <ReadingCarousel readings={readings} onPressCard={openReading} />

        <View style={styles.bottomPadding} />
      </ScrollView>

      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        streak={progress?.currentStreak || 0}
        longestStreak={progress?.longestStreak || 0}
        completedCount={progress?.completedDays.length || 0}
        percentage={percentage}
        week={weekProgress}
        todayNumber={todayNumber}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.xxxl,
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
  pageTitle: {
    fontSize: theme.fontSize.pageTitle,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.navy,
  },
  avatarText: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.display,
    color: theme.colors.white,
  },
  bottomPadding: {
    height: theme.spacing.xxxl,
  },
});