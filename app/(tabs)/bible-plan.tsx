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

// Mock verses for demo
const mockVerses = [
  { number: 1, text: 'Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father\'s house, unto a land that I will shew thee:' },
  { number: 2, text: 'And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing:' },
  { number: 3, text: 'And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed.' },
];

export default function PlanScreen() {
  const [translation, setTranslation] = useState<'kjv' | 'niv'>('kjv');
  const [todayReading, setTodayReading] = useState<DayPlan | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
          reference="Genesis 12:1–3"
          translation={translation}
          verses={mockVerses}
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