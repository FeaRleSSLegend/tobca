import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useTheme';
import { useSeeAllStyles } from '../../constants/styles/seeAll.styles';
import { FilterPill } from './FilterPill';
import { CollectionSearchInput } from './CollectionSearchInput';
import { ScreenWithWatermark } from './ScreenWithWatermark';

interface CollectionShellProps {
  title: string;
  subtitle?: string; // small count line under the title, e.g. "24 messages"
  description?: string;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  pills?: string[];
  activePill?: string;
  onPillPress?: (pill: string) => void;
  children: React.ReactNode;
}

/**
 * The shared chrome every dedicated collection screen wears: back header
 * with title + live count, optional one-line description, scoped search,
 * optional filter-pill row — then whatever content area the caller
 * renders as children. This component is the consistency mechanism of
 * the Library redesign: because Series / Services / Recently Added /
 * Playlists / playlist detail all mount THIS for their top half, their
 * chrome cannot drift apart, while the content area below stays free to
 * be a grid, a grouped list, or circles per content type.
 *
 * A pill row with fewer than two entries isn't rendered at all — a lone
 * "All" pill is a filter that can't filter anything.
 */
export function CollectionShell({
  title,
  subtitle,
  description,
  searchPlaceholder,
  query,
  onQueryChange,
  pills,
  activePill,
  onPillPress,
  children,
}: CollectionShellProps) {
  const seeAllStyles = useSeeAllStyles();
  const c = useThemeColors();
  const router = useRouter();
  return (
    <ScreenWithWatermark style={seeAllStyles.container}>
      <View style={seeAllStyles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={seeAllStyles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={c.navy} />
        </Pressable>
        <View style={seeAllStyles.titleWrap}>
          <Text style={seeAllStyles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={seeAllStyles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {description ? <Text style={seeAllStyles.description}>{description}</Text> : null}

      <CollectionSearchInput
        placeholder={searchPlaceholder}
        value={query}
        onChangeText={onQueryChange}
      />

      {pills && pills.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={seeAllStyles.pillsView}
          contentContainerStyle={seeAllStyles.pillsRow}
        >
          {pills.map((p) => (
            <FilterPill
              key={p}
              label={p}
              isActive={activePill === p}
              onPress={() => onPillPress?.(p)}
            />
          ))}
        </ScrollView>
      )}

      {children}
    </ScreenWithWatermark>
  );
}
