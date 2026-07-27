import { Pressable, ScrollView, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { sharedStyles } from "../../constants/styles/sharedStyles";
import { latestMessages } from "../../data/content";
import { services } from "../../data/services";
import { verseOfDay } from "../../data/verseOfDay";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { LiveCard } from "../../components/ui/LiveCard";
import { ServicePill } from "../../components/ui/ServicePill";
import { MessageCard } from "../../components/ui/MessageCard";
import { VerseOfDayCard } from "../../components/ui/VerseOfDayCard";
import { ScreenWithWatermark } from "../../components/ui/ScreenWithWatermark";


const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];




export default function LiveScreen() {
  const todayName = DAY_NAMES[new Date().getDay()];

  return (
    <ScreenWithWatermark style={sharedStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header row: greeting + avatar */}
        <View style={sharedStyles.headerRow}>
          <View>
            <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.graySecondary }}>
              Welcome Back
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
        <LiveCard isLive={false}/>

        {/* Verse of the Day — the second loud moment on this screen, but a
            different register (photographic, devotional) from LiveCard's
            flat dark card just above it, so the two don't compete as
            "identical hero cards stacked twice." */}
        <VerseOfDayCard reference={verseOfDay.reference} text={verseOfDay.text} />

        {/* Extra breathing room marks the shift from the two hero moments
            above into the everyday utility list below — the rest of this
            screen is deliberately tighter/quieter than the two cards above. */}
        <View style={{ height: theme.spacing.xl }} />

        {/* This Week's Services */}
        <SectionLabel label="This Week's Services" actionText="View All"/>

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

        {/* Today's Reading was cut from here — it duplicated both the Verse
            of the Day card above and the full Bible Plan tab below, and was
            the third "streak in a box" implementation in the app. The Plan
            tab is the real home for daily reading now; this screen doesn't
            need its own smaller copy of it. */}

        {/* Latest Messages */}
        <SectionLabel label="Latest Messages" actionText="See All"/>

        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
          {latestMessages.map((m) => (
            <MessageCard 
            key={m.id}
            id={m.id} 
            title={m.title}
            speaker={m.speaker}
            duration={m.duration}
            series={m.series}
            publishedAt={m.publishedAt}/>
          ))}
        </View>
      </ScrollView>
    </ScreenWithWatermark>
  );
}