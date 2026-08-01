// Reusable destination for every "See All" / "View All" action across the
// app. Rather than a separate screen per section, this one screen reads a
// `section` param (for the two built-in ones below) or a `filter` param
// (any label produced by classifyMessages — a specific series, recurring
// service, or "Clips") to decide which list to show, plus a `title` param
// for the header.
//
// `filter` re-runs the same classification the Library screen already
// does, rather than serializing a full item array through the URL — the
// classification is cheap (it's just array grouping over already-fetched
// data) and this keeps the URL a plain string instead of smuggling JSON
// through route params.
//
// Playlists get their own destination (see app/playlist/[id].tsx) since
// a playlist's items come from a different API call, not from
// classification — not wired into this screen.
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { seeAllStyles } from '../constants/styles/seeAll.styles';
import { CardGrid } from '../components/ui/CardGrid';
import { getLatestMessages, getRecentlyAdded, Message } from '../data/content';
import { useMessages } from '../hooks/useMessages';
import { classifyMessages } from '../utils/contentGrouping';
import { ScreenWithWatermark } from '../components/ui/ScreenWithWatermark';

type Section = 'latest' | 'recentlyAdded';

function resolveList(
  section: Section | string | undefined,
  filter: string | undefined,
  messages: Message[]
): Message[] {
  if (filter) {
    const { recurringServices, series, clips } = classifyMessages(messages);
    if (filter === 'Clips') return clips;
    const match = [...recurringServices, ...series].find((g) => g.label === filter);
    return match ? match.items : [];
  }

  switch (section) {
    case 'latest':
      // No cap (unlike the home-screen preview's default of 2) — See All
      // means show everything, so pass the full length explicitly.
      return getLatestMessages(messages, messages.length);
    case 'recentlyAdded':
      return getRecentlyAdded(messages, messages.length);
    default:
      return messages;
  }
}

export default function SeeAllScreen() {
  const router = useRouter();
  const { section, filter, title } = useLocalSearchParams<{
    section?: string;
    filter?: string;
    title?: string;
  }>();
  const { messages, loading } = useMessages();
  const list = resolveList(section, filter, messages);

  return (
    <ScreenWithWatermark style={seeAllStyles.container}>
      <View style={seeAllStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={seeAllStyles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>
        <Text style={seeAllStyles.title}>{title ?? filter ?? 'All'}</Text>
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
    </ScreenWithWatermark>
  );
}
