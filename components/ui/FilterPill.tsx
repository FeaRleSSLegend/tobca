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
    }
});

export const filterLabels = {
    all: "All",
    sermon: "Sermons",
    bibleStudy: "Bible Studies",
    prayer: "Prayer Requests",
    event: "Events"
};