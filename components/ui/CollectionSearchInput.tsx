import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface CollectionSearchInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

/**
 * Scoped in-place search for collection screens — deliberately NOT the
 * SearchBar component Library uses. That one is a Pressable that routes
 * to the global /search screen; this one is a real TextInput that filters
 * the collection you're already looking at, in place. Two different jobs,
 * so two components — reusing SearchBar here would mean tapping "Search
 * series" and being teleported to a global search over everything, which
 * is exactly the scope confusion a per-collection search exists to avoid.
 *
 * No debounce on purpose: filtering here is an in-memory array filter
 * over already-fetched data, not a network call, so every keystroke
 * re-filtering is instant. Debouncing would only add perceived lag.
 * (search_behavior guidance about debouncing applies to remote queries —
 * if this ever hits an API instead, that's when to add it.)
 *
 * Same visual recipe as the search fields elsewhere (grayBorder recessed
 * pill, 44pt min height for the touch-target floor) so every search
 * field in the app reads as the same control.
 */
export const CollectionSearchInput = ({ placeholder, value, onChangeText }: CollectionSearchInputProps) => (
  <View style={styles.wrap}>
    <Ionicons name="search" size={18} color={theme.colors.grayIcon} />
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={theme.colors.grayIcon}
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      returnKeyType="search"
      autoCorrect={false}
      accessibilityLabel={placeholder}
    />
    {value.length > 0 && (
      <Pressable
        onPress={() => onChangeText('')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
      >
        <Ionicons name="close-circle" size={18} color={theme.colors.grayIcon} />
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.grayBorder,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
    marginHorizontal: theme.layout.screenPadding,
    marginTop: theme.spacing.md,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.navy,
    paddingVertical: theme.spacing.sm,
  },
});
