// Reusable destination for every "See All" / "View All" action across the
// app. Rather than a separate screen per section (see-all-latest,
// see-all-recently-added, ...), this one screen reads a `section` param
// to decide which derived list to show, and a `title` param for the
// header — same pattern search.tsx already uses for navigation, just
// parameterized instead of one-off.
//
// Only wired up for Message-shaped sections (Latest Messages, Recently
// Added) for now, since those share GridCard's shape. Series ("See All"
// on the Series row) is a different card shape (name + count, not a
// playable item) and isn't wired to this screen yet — deliberately left
// as-is rather than forcing it into a shape it doesn't fit.
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { seeAllStyles } from '../constants/styles/seeAll.styles';
import { CardGrid } from '../components/ui/CardGrid';
import { getLatestMessages, getRecentlyAdded, Message } from '../data/content';
import { useMessages } from '../hooks/useMessages';

type Section = 'latest' | 'recentlyAdded';

function resolveList(section: Section | string | undefined, messages: Message[]): Message[] {
  switch (section) {
    case 'latest':
      // No cap here (unlike the home-screen preview's getLatestMessages(messages)
      // default of 2) — See All means show everything, so pass the full length.
      return getLatestMessages(messages, messages.length);
    case 'recentlyAdded':
      return getRecentlyAdded(messages, messages.length);
    default:
      return messages;
  }
}

export default function SeeAllScreen() {
  const router = useRouter();
  const { section, title } = useLocalSearchParams<{ section?: string; title?: string }>();
  const { messages, loading } = useMessages();
  const list = resolveList(section, messages);

  return (
    <View style={seeAllStyles.container}>
      <View style={seeAllStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={seeAllStyles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>
        <Text style={seeAllStyles.title}>{title ?? 'All'}</Text>
      </View>

      <View style={seeAllStyles.gridWrap}>
        {list.length > 0 ? (
          <CardGrid data={list} />
        ) : (
          <View style={seeAllStyles.emptyState}>
            <Text style={seeAllStyles.emptyText}>
              {loading ? 'Loading…' : 'Nothing here yet.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
