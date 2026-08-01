import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, theme } from "../../constants/theme";

interface FilterPillProps {
    isActive: boolean;
    label: string;
    onPress: () => void;
}

export const FilterPill = ({ isActive, label, onPress }: FilterPillProps) => {
    return (
        <Pressable
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
        >
            <Text style={{
                color: isActive ? theme.colors.white : theme.colors.graySecondary,
                fontWeight: theme.fontWeight.medium
            }}>
                {label}
            </Text>
        </Pressable>
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
    }
});

export const filterLabels = {
    all: "All",
    sermon: "Sermons",
    bibleStudy: "Bible Studies",
    prayer: "Prayer Requests",
    event: "Events"
};
