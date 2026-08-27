import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { useSharedStyles } from "../../constants/styles/sharedStyles";
import { getLatestMessages } from "../../data/content";
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { services } from "../../data/services";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { LiveCard } from "../../components/ui/LiveCard";
import { ServicePill } from "../../components/ui/ServicePill";
import { MessageCard } from "../../components/ui/MessageCard";
import { VerseOfDayCard } from "../../components/ui/VerseOfDayCard";
import { useVerseOfDay } from "../../hooks/useVerseOfDay";
import { TodayReadingRow } from "../../components/ui/TodayReadingRow";
import { FadeInUp, staggerDelay, TabTransition } from "../../components/ui/motion";
import { ScreenWithWatermark } from "../../components/ui/ScreenWithWatermark";
import { useLiveStatus } from "../../hooks/useLiveStatus";
import { useMessages } from "../../hooks/useMessages";
import { SkeletonList } from "../../components/ui/Skeletons";
import { usePlayback } from "../../providers/PlaybackProvider";
import { getTodayReading, isDayCompleted, getProgress, getCompletionPercentage } from "../../utils/biblePlan.utils";
import { buildMessage } from "../../data/contentModel";
import { PRIMARY_BRANCH_ID } from "../../data/branches";
import { useFocusEffect, useRouter } from "expo-router";
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { useThemeColors } from '../../hooks/useTheme';

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
  const sharedStyles = useSharedStyles();
  const c = useThemeColors();
  // Today's verse. See hooks/useVerseOfDay for the no-repeat-within-30-days
  // rule and why the choice is written down rather than re-picked per render.
  const { verse } = useVerseOfDay();
  const todayName = DAY_NAMES[new Date().getDay()];
  const router = useRouter();
  const push = useGuardedPush();
  const liveStatus = useLiveStatus();
  const { messages, isBranchReady } = useMessages();
  // Home shows the whole church, so it waits on every branch settling.
  const messagesReady = isBranchReady('all');
  const { play } = usePlayback();
  const bottomClearance = useTabBottomClearance();
  const latestMessages = getLatestMessages(messages);

  const todayReading = getTodayReading();
  const [readingDone, setReadingDone] = useState(false);
  const [planProgress, setPlanProgress] = useState(0);

  // Re-checked on focus, not just mount — the whole point of the done
  // state is reflecting a reading finished over on the Plan tab moments ago.
  useFocusEffect(
    useCallback(() => {
      if (!todayReading) return;
      isDayCompleted(todayReading.date).then(setReadingDone);
      // Overall plan progress feeds the card's day-ring — a quiet, always-
      // present sense of "how far into the year's plan am I".
      getProgress().then((p) =>
        setPlanProgress(getCompletionPercentage(p.completedDays) / 100)
      );
    }, [todayReading])
  );

  return (
    <TabTransition>
    <ScreenWithWatermark style={sharedStyles.container}>
      {/* Content-driven clearance. This was a flat 120pt, which put a fixed
          hole under Latest Messages whether or not anything needed clearing —
          most visibly when the section was short. Nothing overlaps a tab
          screen by default, so the hook returns plain breathing room and adds
          the mini-player's footprint only while it is actually docked. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomClearance }}
      >
        {/* Greeting + title, with the settings gear all four tabs now carry.
            The "JN" disc that used to sit on the right was an avatar for an
            account that does not exist. */}
        <ScreenHeader title="OliveBrook" eyebrow={greetingForNow()} />

        {/* Live vs Next-Service card — leads the screen since this is the
            one thing on it that's actually time-sensitive; a "next service"
            countdown loses its point if it's not the first thing you see.
            Watch now plays the confirmed live broadcast; it's only wired
            when YouTube actually returned a live videoId (schedule-only
            fallback has nothing concrete to open, so the button stays
            inert there rather than lying). */}
        <LiveCard
          isLive={liveStatus.isLive}
          title={liveStatus.title}
          source={liveStatus.source}
          thumbnail={liveStatus.thumbnail}
          onWatch={
            liveStatus.videoId
              ? () =>
                  play(
                    buildMessage({
                      source: 'youtube',
                      branchId: PRIMARY_BRANCH_ID,
                      externalId: liveStatus.videoId!,
                      title: liveStatus.title ?? 'Live Service',
                      speaker: 'OliveBrook Church',
                      publishedAt: new Date().toISOString().slice(0, 10),
                      type: 'video',
                      media: [
                        { kind: 'video', source: 'youtube', externalId: liveStatus.videoId!, durationSeconds: 0 },
                      ],
                    })
                  )
              : undefined
          }
        />

        {/* Verse of the Day — the second loud moment on this screen, but a
            different register (photographic, devotional) from LiveCard's
            gradient card just above it, so the two don't compete as
            "identical hero cards stacked twice."

            NOW ACTUALLY ROTATES. This used to render a single hardcoded
            constant, which is why the same verse appears in every screenshot
            the app has ever produced. hooks/useVerseOfDay picks one per
            calendar day from a 61-verse pool, excludes everything shown in the
            trailing 30 days, and records the choice so it is stable for the
            rest of the day rather than re-rolling on every tab switch. */}
        <VerseOfDayCard reference={verse.reference} text={verse.text} />

        {/* Today's Reading — the slim bridge to the Plan tab. Quiet white
            row on purpose: the two cards above own the screen's color
            budget; this is the third item, so it drops to the utility
            register the rest of the screen uses. */}
        {todayReading && (
          <TodayReadingRow
            day={todayReading.day}
            references={[
              todayReading.oldTestament,
              todayReading.newTestament,
              todayReading.psalm,
              todayReading.proverb,
            ]}
            isDone={readingDone}
            planProgress={planProgress}
            onPress={() => push('/bible-plan')}
          />
        )}

        {/* No manual spacer here. A 24pt View used to sit in this slot to mark
            the shift from hero cards into the utility list — but SectionLabel
            already carries a 24pt section margin of its own, so the two added
            up to a 48pt hole, twice every other gap on the screen and the
            single biggest spacing error on this tab. One owner per gap. */}

        {/* This Week's Services — the schedule strip below shows upcoming
            slots; the chevron leads to the Services COLLECTION (past
            recordings by month), which is the closest real destination
            until a dedicated schedule screen exists. */}
        <SectionLabel label="This Week's Services" onPress={() => push({ pathname: '/see-all', params: { section: 'services', title: 'Services' } })}/>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // No marginTop: SectionLabel's own 12pt bottom margin is the
          // label-to-content gap. The 20 that was here made it 32 — wider than
          // the gap between the label and the SECTION above it, so the header
          // visually grouped upward, away from the pills it labels.
          style={{ maxHeight: 110 }}
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
        <SectionLabel label="Latest Messages" onPress={() => push({ pathname: '/see-all', params: { section: 'latest', title: 'Latest Messages' } })}/>

        {/* Same two corrections as the services strip: no marginTop (the
            label's 12 is the label-to-content gap; adding 12 here made it 24,
            identical to the SECTION gap above the label) and no marginBottom
            (end-of-scroll clearance is the ScrollView's job now, and 32 was
            never enough to clear the tab bar anyway). */}
        <View style={{ gap: theme.spacing.md }}>
          {!messagesReady ? (
            <SkeletonList rows={2} />
          ) : latestMessages.length === 0 ? (
            <Text style={{ fontFamily: theme.fontFamily.body, fontSize: theme.fontSize.body, color: c.graySecondary }}>
              No messages yet.
            </Text>
          ) : (
            latestMessages.map((m, i) => (
            <FadeInUp key={m.id} delay={staggerDelay(i)}>
              <MessageCard 
              id={m.id} 
              title={m.title}
              speaker={m.speaker}
              duration={m.duration}
              series={m.series}
              publishedAt={m.publishedAt}
              thumbnail={m.thumbnail}
              onPress={() => play(m)}/>
            </FadeInUp>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWithWatermark>
    </TabTransition>
  );
}
