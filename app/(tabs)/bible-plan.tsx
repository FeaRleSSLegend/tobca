import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { TodayCard } from '../../components/bible/TodayCard';
import { StatsBar } from '../../components/bible/StatsBar';
import { WeekView } from '../../components/bible/WeekView';
import { ReadingViewport } from '../../components/bible/ReadingViewport';
import { CompactReading } from '../../components/bible/CompactReading';
import { 
  getTodayReading, 
  getProgress, 
  markDayAsRead,
  getCompletionPercentage,
  getWeekProgress,
  ReadingProgress 
} from '../../utils/biblePlan.utils';
import { DayPlan } from '../../data/biblePlan';
import { TranslationCode } from '../../services/bibleVersions';
import { getVersesForReference, Verse } from '../../services/bibleApi';

export default function PlanScreen() {
  const [translation, setTranslation] = useState<TranslationCode>('niv');
  const [todayReading, setTodayReading] = useState<DayPlan | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isRead, setIsRead] = useState(false);

  const [otVerses, setOtVerses] = useState<Verse[]>([]);
  const [ntVerses, setNtVerses] = useState<Verse[]>([]);
  const [psalmVerses, setPsalmVerses] = useState<Verse[]>([]);
  const [proverbVerses, setProverbVerses] = useState<Verse[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!todayReading) return;

    let cancelled = false;
    setVersesLoading(true);

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
      .catch(err => console.error('Failed to load verses:', err))
      .finally(() => {
        if (!cancelled) setVersesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [todayReading, translation]);

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
  const weekProgress = getWeekProgress();
  const todayNumber = new Date().getDate();

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
          reference={todayReading.oldTestament.split(',')[0]}
          isRead={isRead}
          onMarkAsRead={handleMarkAsRead}
        />

        <StatsBar 
          streak={progress?.currentStreak || 0}
          completed={progress?.completedDays.length || 0}
          percentage={percentage}
        />

        <SectionLabel label="This Week" />
        <WeekView week={weekProgress} todayNumber={todayNumber} />

        <SectionLabel label="Today's Reading" />
        
        <ReadingViewport 
          reference={todayReading.oldTestament}
          translation={translation}
          verses={otVerses}
          onContinue={() => console.log('Continue reading Genesis 12–14')}
        />
        
        <CompactReading 
          title="Psalm"
          reference={todayReading.psalm}
        />
        
        <CompactReading 
          title="Proverb"
          reference={todayReading.proverb}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
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