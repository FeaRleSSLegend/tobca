import { liveStyles } from "../../constants/styles/live.styles";
import { View, Text, Pressable } from "react-native";
import { planDays, planProgress} from "../../data/biblePlan";
import { theme } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export const ReadingCard = () => {
    const todayPlan = planDays.find((d) => d.day === planProgress.currentDay);

    return todayPlan && (
          <View style={liveStyles.readingTeaser}>
            <View style={liveStyles.readingTeaserLeft}>
              <Text style={liveStyles.readingTeaserEyebrow}>
                {`Day ${todayPlan.day} · ${todayPlan.reference}`}
              </Text>

              <Text style={liveStyles.readingTeaserVerse} numberOfLines={2}>
                {todayPlan.excerpt
                  ? `"${todayPlan.excerpt[0].text}"`
                  : `${todayPlan.reference} — open to read today's passage.`}
              </Text>

              <Pressable style={liveStyles.readingTeaserCta}>
                <Text style={liveStyles.readingTeaserCtaText}>Continue reading</Text>
                <Ionicons name="chevron-forward" size={12} color={theme.colors.slate} />
              </Pressable>
            </View>

            <View style={liveStyles.readingTeaserStreak}>
              <Text style={liveStyles.streakNum}>{planProgress.streak}</Text>
              <Text style={liveStyles.streakLabel}>{`DAY\nSTREAK`}</Text>
            </View>
          </View>
        )

}