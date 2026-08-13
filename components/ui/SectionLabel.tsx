import { Text, View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PressableScale } from './motion';
import { theme } from '../../constants/theme'
import { sharedStyles } from "../../constants/styles/sharedStyles"

interface SectionLabelProps {
  label: string;
  // New pattern (Library hub): pass onPress to make the WHOLE ROW the tap
  // target, rendered with a "›" chevron. Replaces per-section "See All"
  // text links — one chevron per row instead of the same two words
  // repeated four times down the screen, and a full-width row is a far
  // easier target than a small trailing link.
  onPress?: () => void;
  // Old pattern (still used by Live's "View All"/"See All" rows): a
  // trailing text action with its own small tap target. Kept for
  // back-compat; prefer onPress for anything new.
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionLabel = ({ label, onPress, actionText, onActionPress }: SectionLabelProps) => {
  if (onPress) {
    // NOTE: the row layout goes on `style`, NOT `containerStyle`.
    // PressableScale renders its children inside an inner Animated.View, so a
    // flexDirection: 'row' that lands on the OUTER pressable applies to that
    // single wrapper while the actual children stack in a column — which is
    // exactly how the chevron ended up on its own line under the section
    // title. `containerStyle` is only for what the outer pressable itself
    // needs in order to measure (flex: 1).
    return (
      <PressableScale
        style={sharedStyles.sectionHeaderRow}
        onPress={onPress}
        // Row is visually short (~20pt of text) — hitSlop stretches the
        // tappable band to the 44pt floor without adding visible height.
        hitSlop={{ top: 12, bottom: 12 }}
        accessibilityRole="button"
        accessibilityLabel={`${label}, view all`}
      >
        <Text style={sharedStyles.sectionTitle}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.grayIcon} />
      </PressableScale>
    );
  }

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
