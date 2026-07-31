import { Text, View, Pressable } from 'react-native'
import { sharedStyles } from "../../constants/styles/sharedStyles"

interface SectionLabelProps {
  label: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionLabel = ({ label, actionText, onActionPress }: SectionLabelProps) => {
  return (
    <View style={sharedStyles.sectionHeaderRow}>
      <Text style={sharedStyles.sectionTitle}>{label}</Text>

      {actionText && (
        // Text-only tap target (no padding of its own) — same touch-target
        // gap as the pills/icon buttons elsewhere, and this row appears on
        // every screen, so the fix benefits all four tabs at once.
        <Pressable
          hitSlop={8}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionText} ${label}`}
        >
          <Text style={sharedStyles.seeAllLink}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};
