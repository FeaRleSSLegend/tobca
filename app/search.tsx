// Dedicated search screen, pushed from the Library tab. Search used to be
// an inline TextInput on the Library screen that grew a results list
// straight into the same ScrollView — fine while empty, but every
// keystroke added more views into a screen that already had a hero card,
// a filter row, and two horizontal lists competing for space. Giving it
// its own screen (same pattern reading.tsx uses for the scripture reader)
// means results have the whole screen to render into, and Library never
// has to reflow around them.
//
// THE PRE-SEARCH STATE
// Everything above `results` is what this screen shows before the first
// keystroke. It used to be a single "Recently Added" list; it is now three
// blocks, in the order a person actually uses them:
//
//   Recent Searches   what you looked for last, as dismissable chips. The
//                     cheapest possible re-run of a search you have already
//                     done once.
//   Browse            the church's real content groupings — the series and
//                     recurring services that classifyMessages derives from
//                     the actual titles on the channel. NOT invented genres:
//                     "Sunday Service" and "The Manifold Grace of God" are
//                     things this church really publishes, and each tile
//                     opens the collection screen that already exists for it.
//   Recently Added    unchanged, and still last: it is the fallback for
//                     "I don't know what I'm looking for", which is the
//                     weakest of the three intents.
//
// WHAT IS DELIBERATELY ABSENT: a "Trending" / "Most Viewed" rail. Ranking
// needs engagement data and the app has none — services/youtube.ts requests
// `part=snippet` and `part=contentDetails` only, never `statistics`, so no
// view count exists anywhere in the content model. A rail ranked by recency
// with "trending" written above it would be a lie about data we do not have,
// so the section is skipped rather than faked.
//
// Typing anything hands the screen back to the existing results behaviour,
// unchanged.
import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { searchStyles } from '../constants/styles/search.styles';
import { MessageCard } from '../components/ui/MessageCard';
import { GroupCard } from '../components/ui/GroupCard';
import { ScreenWithWatermark } from '../components/ui/ScreenWithWatermark';
import { getRecentlyAdded } from '../data/content';
import { useMessages } from '../hooks/useMessages';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { classifyMessages } from '../utils/contentGrouping';
import { shortDate } from '../utils/collections';
import { SkeletonList } from '../components/ui/Skeletons';
import { PressableScale } from '../components/ui/motion';
import { usePlayback } from '../providers/PlaybackProvider';
import { useStackBottomClearance } from '../hooks/useBottomClearance';

// Two rows of tiles. Enough to show the shape of the library without turning
// the pre-search screen into the browse screen — see-all is where the full
// list of collections lives, and every tile here already goes there.
const BROWSE_LIMIT = 4;

/**
 * One recent term. Two separate tap targets in one pill rather than a
 * pressable inside a pressable: the label re-runs the search, the glyph
 * forgets the term, and nesting them would make the outer press fire
 * whenever the inner one was missed by a couple of points.
 */
const RecentChip = ({
  term,
  onPress,
  onRemove,
}: {
  term: string;
  onPress: () => void;
  onRemove: () => void;
}) => (
  <View style={searchStyles.chip}>
    <PressableScale
      containerStyle={searchStyles.chipPress}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8 }}
      accessibilityRole="button"
      accessibilityLabel={`Search again for ${term}`}
    >
      <Text style={searchStyles.chipLabel} numberOfLines={1}>
        {term}
      </Text>
    </PressableScale>
    <Pressable
      onPress={onRemove}
      hitSlop={8}
      style={searchStyles.chipDismiss}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${term} from recent searches`}
    >
      <Ionicons name="close" size={14} color={theme.colors.graySecondary} />
    </Pressable>
  </View>
);

export default function SearchScreen() {
  const router = useRouter();
  const push = useGuardedPush();
  const { play } = usePlayback();
  const [query, setQuery] = useState('');
  const bottomClearance = useStackBottomClearance();
  const { messages, isBranchReady } = useMessages();
  const { recents, record, remove, clear } = useRecentSearches();
  const ready = isBranchReady('all');
  const recentlyAdded = getRecentlyAdded(messages);

  // The browsable collections, straight out of the same classifier the
  // Library shelves use — services first (they are the church's backbone and
  // the labels people recognise), then the biggest series. Sorted by size
  // within each kind by classifyMessages already.
  const browse = useMemo(() => {
    const { recurringServices, series } = classifyMessages(messages);
    return [...recurringServices, ...series].slice(0, BROWSE_LIMIT);
  }, [messages]);

  const browseRows = useMemo(() => {
    const rows: (typeof browse)[] = [];
    for (let i = 0; i < browse.length; i += 2) rows.push(browse.slice(i, i + 2));
    return rows;
  }, [browse]);

  const results = query.trim().length > 0
    ? messages.filter((m) => m.title.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  // Recording happens on SUBMIT, not on change. Saving as you type would fill
  // the history with every prefix of every word ("g", "gr", "gra"…), which is
  // noise the person never chose to keep.
  const submit = () => record(query);

  const rerun = (term: string) => {
    setQuery(term);
    record(term);
  };

  return (
    <ScreenWithWatermark style={searchStyles.container}>
      <View style={searchStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={searchStyles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>

        <View style={searchStyles.inputWrap}>
          <Ionicons name="search" size={18} color={theme.colors.grayIcon} />
          <TextInput
            autoFocus
            placeholder="Search sermons, videos, and more"
            placeholderTextColor={theme.colors.grayIcon}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            style={searchStyles.input}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={searchStyles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={theme.colors.grayIcon} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[searchStyles.scrollContent, { paddingBottom: bottomClearance }]}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim().length === 0 ? (
          // Nothing typed yet — a blank screen right after opening search
          // reads as broken, and search UX research backs showing something
          // useful before the first keystroke rather than an empty page.
          <View style={searchStyles.preSearch}>
            {recents.length > 0 && (
              <View>
                <View style={searchStyles.sectionHeadRow}>
                  <Text style={[searchStyles.sectionLabel, searchStyles.sectionHeadLabel]}>
                    Recent Searches
                  </Text>
                  <Pressable
                    onPress={clear}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all recent searches"
                  >
                    <Text style={searchStyles.clearAll}>Clear all</Text>
                  </Pressable>
                </View>
                <View style={searchStyles.chipWrap}>
                  {recents.map((term) => (
                    <RecentChip
                      key={term}
                      term={term}
                      onPress={() => rerun(term)}
                      onRemove={() => remove(term)}
                    />
                  ))}
                </View>
              </View>
            )}

            {browse.length > 0 && (
              <View>
                <Text style={searchStyles.sectionLabel}>Browse</Text>
                <View style={searchStyles.tileGrid}>
                  {browseRows.map((row) => (
                    <View key={row[0].key} style={searchStyles.tileRow}>
                      {row.map((group) => (
                        <GroupCard
                          key={group.key}
                          title={group.label}
                          subtitle={`${group.count} message${group.count === 1 ? '' : 's'}`}
                          thumbnail={group.thumbnail}
                          // The collection screen that already exists for this
                          // group — the same destination the Library posters
                          // use, so browse and search never disagree about
                          // where a series lives.
                          onPress={() =>
                            push({
                              pathname: '/see-all',
                              params: { filter: group.label, title: group.label },
                            })
                          }
                        />
                      ))}
                      {row.length === 1 && <View style={searchStyles.tileSpacer} />}
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View>
              <Text style={searchStyles.sectionLabel}>Recently Added</Text>
              {!ready ? (
                <SkeletonList rows={4} />
              ) : (
                <View style={searchStyles.resultsList}>
                  {recentlyAdded.map((msg) => (
                    <MessageCard
                      key={msg.id}
                      id={msg.id}
                      title={msg.title}
                      speaker={msg.speaker}
                      duration={msg.duration}
                      series={msg.series}
                      type={msg.type}
                      publishedAt={shortDate(msg.publishedAt)}
                      thumbnail={msg.thumbnail}
                      onPress={() => play(msg)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : results.length > 0 ? (
          <View style={searchStyles.resultsList}>
            {results.map((msg) => (
              <MessageCard
                key={msg.id}
                id={msg.id}
                title={msg.title}
                speaker={msg.speaker}
                duration={msg.duration}
                series={msg.series}
                type={msg.type}
                publishedAt={shortDate(msg.publishedAt)}
                thumbnail={msg.thumbnail}
                onPress={() => play(msg)}
              />
            ))}
          </View>
        ) : (
          <Text style={searchStyles.noResults}>No results for "{query}"</Text>
        )}
      </ScrollView>
    </ScreenWithWatermark>
  );
}
