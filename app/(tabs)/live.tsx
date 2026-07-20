import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { sharedStyles } from "../../constants/styles/sharedStyles";
import { latestMessages } from "../../data/content";
import { services } from "../../data/services";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { LiveCard } from "../../components/ui/LiveCard";
import { ServicePill } from "../../components/ui/ServicePill";
import { ReadingCard } from "../../components/ui/ReadingCard";
import { MessageCard } from "../../components/ui/MessageCard";


const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];




export default function LiveScreen() {
  const todayName = DAY_NAMES[new Date().getDay()];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
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

        {/* Live vs Next-Service card */}
        <LiveCard isLive={false}/>

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

        {/* Today's Reading */}
        <SectionLabel label="Today's Reading" />

        <ReadingCard/>

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
    </SafeAreaView>
  );
}