import {Text, View, Pressable} from 'react-native'
import {sharedStyles} from "../../constants/styles/sharedStyles"

interface SectionLabelProps {
  label: string;
  actionText?: string;
}

export const SectionLabel = ({ label, actionText }: SectionLabelProps) => {
  return (
    <View style={sharedStyles.sectionHeaderRow}>
      <Text style={sharedStyles.sectionTitle}>{label}</Text>

      {actionText && (
        <Pressable>
          <Text style={sharedStyles.seeAllLink}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};