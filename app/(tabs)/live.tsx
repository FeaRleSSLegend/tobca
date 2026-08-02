import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { sharedStyles } from "../../constants/styles/sharedStyles";
import { getLatestMessages } from "../../data/content";
import { services } from "../../data/services";
import { verseOfDay } from "../../data/verseOfDay";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { LiveCard } from "../../components/ui/LiveCard";
import { ServicePill } from "../../components/ui/ServicePill";
import { MessageCard } from "../../components/ui/MessageCard";
import { VerseOfDayCard } from "../../components/ui/VerseOfDayCard";
import { TodayReadingRow } from "../../components/ui/TodayReadingRow";
import { ScreenWithWatermark } from "../../components/ui/ScreenWithWatermark";
import { useLiveStatus } from "../../hooks/useLiveStatus";
import { useMessages } from "../../hooks/useMessages";
import { getTodayReading, isDayCompleted } from "../../utils/biblePlan.utils";
import { useFocusEffect, useRouter } from "expo-router";

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "Welcome Back" was static filler — a greeting that never changes stops
// being read. Time-of-day is the cheapest real personalization there is:
// it costs nothing, it's correct every time, and it makes the screen feel
// aware of the moment someone opened it.
function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Home's job, in order: (1) is church live right now / when is it next —
 * the one time-critical fact, so it leads; (2) today's verse — the
 * devotional moment; (3) today's reading — the daily ACTION this screen
 * should encourage, previously missing entirely (the redesign's "what
 * actions should Home encourage?" answer for a Bible app is: read); then
 * (4) the week's schedule and (5) latest messages as the utility tail.
 * Everything on the screen is one of those five answers; nothing else
 * earned a slot.
 */
export default function LiveScreen() {
  const todayName = DAY_NAMES[new Date().getDay()];
  const router = useRouter();
  const liveStatus = useLiveStatus();
  const { messages } = useMessages();
  const latestMessages = getLatestMessages(messages);

  const todayReading = getTodayReading();
  const [readingDone, setReadingDone] = useState(false);

  // Re-checked on focus, not just mount — the whole point of the done
  // state is reflecting a reading finished over on the Plan tab moments ago.
  useFocusEffect(
    useCallback(() => {
      if (!todayReading) return;
      isDayCompleted(todayReading.date).then(setReadingDone);
    }, [todayReading])
  );

  return (
    <ScreenWithWatermark style={sharedStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header row: greeting + avatar */}
        <View style={sharedStyles.headerRow}>
          <View>
            <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.graySecondary }}>
              {greetingForNow()}
            </Text>
            <Text style={{ fontSize: theme.fontSize.heroTitle, fontFamily: theme.fontFamily.display }}>
              OliveBrook
            </Text>
          </View>

          <View style={sharedStyles.avatar}>
            <Text style={{ fontSize: theme.fontSize.body, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
              JN
            </Text>
          </View>
        </View>

        {/* Live vs Next-Service card — leads the screen since this is the
            one thing on it that's actually time-sensitive; a "next service"
            countdown loses its point if it's not the first thing you see. */}
        <LiveCard isLive={liveStatus.isLive} title={liveStatus.title} source={liveStatus.source} />

        {/* Verse of the Day — the second loud moment on this screen, but a
            different register (photographic, devotional) from LiveCard's
            gradient card just above it, so the two don't compete as
            "identical hero cards stacked twice." */}
        <VerseOfDayCard reference={verseOfDay.reference} text={verseOfDay.text} />

        {/* Today's Reading — the slim bridge to the Plan tab. Quiet white
            row on purpose: the two cards above own the screen's color
            budget; this is the third item, so it drops to the utility
            register the rest of the screen uses. */}
        {todayReading && (
          <TodayReadingRow
            day={todayReading.day}
            oldTestament={todayReading.oldTestament}
            isDone={readingDone}
            onPress={() => router.push('/bible-plan')}
          />
        )}

        {/* Extra breathing room marks the shift from the hero moments
            above into the everyday utility list below. */}
        <View style={{ height: theme.spacing.sm }} />

        {/* This Week's Services — the schedule strip below shows upcoming
            slots; the chevron leads to the Services COLLECTION (past
            recordings by month), which is the closest real destination
            until a dedicated schedule screen exists. */}
        <SectionLabel label="This Week's Services" onPress={() => router.push({ pathname: '/see-all', params: { section: 'services', title: 'Services' } })}/>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: theme.spacing.xl, maxHeight: 110 }}
          contentContainerStyle={{ gap: theme.spacing.md }}
        >
          {services.map((s) => {
            const isToday = s.day === todayName;
            return (
              <ServicePill
              key={s.id}
              service={s}
              isToday={isToday}/>
            );
          })}
        </ScrollView>

        {/* Latest Messages — same chevron-row pattern as Library's hub
            headers: one interaction language for "this section continues
            elsewhere" across both tabs. */}
        <SectionLabel label="Latest Messages" onPress={() => router.push({ pathname: '/see-all', params: { section: 'latest', title: 'Latest Messages' } })}/>

        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md, marginBottom: theme.spacing.xxxl }}>
          {latestMessages.map((m) => (
            <MessageCard 
            key={m.id}
            id={m.id} 
            title={m.title}
            speaker={m.speaker}
            duration={m.duration}
            series={m.series}
            publishedAt={m.publishedAt}
            thumbnail={m.thumbnail}/>
          ))}
        </View>
      </ScrollView>
    </ScreenWithWatermark>
  );
}
