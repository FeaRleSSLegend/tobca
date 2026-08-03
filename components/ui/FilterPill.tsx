import { View, Text, StyleSheet } from 'react-native';
import { colors, theme } from "../../constants/theme";
import { PressableScale } from './motion';

interface FilterPillProps {
    isActive: boolean;
    label: string;
    onPress: () => void;
}

export const FilterPill = ({ isActive, label, onPress }: FilterPillProps) => {
    return (
        <PressableScale
            activeScale={0.94}
            style={[
                style.pillStyle,
                {
                    backgroundColor: isActive ? theme.colors.navy : theme.colors.white,
                    borderColor: isActive ? theme.colors.navy : theme.colors.grayBorder,
                }
            ]}
            onPress={onPress}
            // The pill's visible padding only gets it to ~33pt tall — same fix
            // as VerseOfDayCard's shareBtn: extend the tappable area with
            // hitSlop instead of growing the pill itself, so a row of these
            // doesn't get visually heavier just to satisfy touch-target math.
            hitSlop={8}
            accessibilityRole="button"
            // Active state was previously conveyed by color alone (navy fill
            // vs white) — invisible to a screen reader. selected:true is what
            // makes VoiceOver/TalkBack announce "Ongoing, selected" instead
            // of just "Ongoing".
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
        >
            <Text
                numberOfLines={1}
                style={{
                    color: isActive ? theme.colors.white : theme.colors.graySecondary,
                    fontWeight: theme.fontWeight.medium
                }}
            >
                {label}
            </Text>
        </PressableScale>
    );
};

const style = StyleSheet.create({
    pillStyle: {
        borderWidth: 1,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
        // Without this, Pressable inside a horizontal ScrollView stretches
        // to fill the scroll container's full height — turning a pill into
        // the giant rectangle seen in the "All" active state. alignSelf
        // tells it to size to its own content instead.
        alignSelf: 'flex-start',
        // Guards against the row's flex layout squeezing a pill narrower
        // than its label — which is what let "Sunday Service" wrap onto a
        // second line and, with it, drag the whole row's height up.
        flexShrink: 0,
    }
});

export const filterLabels = {
    all: "All",
    sermon: "Sermons",
    bibleStudy: "Bible Studies",
    prayer: "Prayer Requests",
    event: "Events"
};
