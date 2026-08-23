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
// SEARCH NOW COVERS AUDIO TOO.
// It was video-only, which the placeholder said out loud ("Search sermons,
// videos, and more") while the church's 546 audio recordings — the larger half
// of its library — were reachable only from inside the Audio tab. Results are
// split into two labelled groups and drawn with each medium's own component:
// video keeps MessageCard (16:9 thumbnail), audio uses AudioListRow (derived
// artwork, speaker, date). That is the distinction the rest of the app already
// makes between the two, so nothing new had to be invented to tell them apart.
//
// PERFORMANCE. Both corpora are matched on every search, so the filtering is
// debounced (hooks/useDebouncedValue) and memoised on the settled term. The
// audio side is matched against a PRE-BUILT index — see audioCorpus below —
// rather than lower-casing 546 titles and speakers on each pass.
import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
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
import { AudioListRow } from '../components/ui/AudioListRow';
import { useR2Manifest } from '../hooks/useR2Manifest';
import { useAudioFiles } from '../providers/AudioFileProvider';
import { groupAudio, formatAudioDate } from '../utils/audioGrouping';
import { buildTrackIndex } from '../utils/audioTracks';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { AUDIO_ROW_ART } from '../components/ui/AudioListRow';

// Two rows of tiles. Enough to show the shape of the library without turning
// the pre-search screen into the browse screen — see-all is where the full
// list of collections lives, and every tile here already goes there.
const BROWSE_LIMIT = 4;

// Results are capped per medium. Someone searching "grace" against 546
// recordings does not want 300 rows; they want to see that there are many and
// then narrow. The count line above each group states the real total.
const RESULT_LIMIT = 25;

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
  const audio = useAudioFiles();
  const [query, setQuery] = useState('');
  const bottomClearance = useStackBottomClearance();
  const { messages, isBranchReady } = useMessages();
  const { recents, record, remove, clear } = useRecentSearches();
  const ready = isBranchReady('all');
  // Memoised: this used to be recomputed on every render, which — on a screen
  // whose state changes with every keystroke — meant re-deriving the pre-search
  // list while the user was typing and could not even see it.
  const recentlyAdded = useMemo(() => getRecentlyAdded(messages), [messages]);

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

  // ---- AUDIO CORPUS -------------------------------------------------------
  // Built once per manifest load, not once per keystroke: the lower-cased
  // haystack for each recording is precomputed here so a search pass is 546
  // substring tests rather than 1,092 toLowerCase() allocations plus the
  // tests. Grouping runs here too, so a result row can show the series it
  // belongs to — the same derived name the Audio tab shows.
  const { items: audioItems } = useR2Manifest('audio');
  const audioCorpus = useMemo(() => {
    const { seriesByUrl } = groupAudio(audioItems);
    const { all } = buildTrackIndex(audioItems, seriesByUrl);
    return all.map((track) => ({
      track,
      haystack: `${track.title} ${track.speaker ?? ''}`.toLowerCase(),
    }));
  }, [audioItems]);

  // ---- FILTERING ----------------------------------------------------------
  // On the DEBOUNCED term, and memoised on it. `query` still drives the input
  // (typing must never feel laggy), while the two corpus passes wait for the
  // typing to settle — see hooks/useDebouncedValue for why both halves are
  // needed.
  const settled = useDebouncedValue(query.trim(), 250);
  const needle = settled.toLowerCase();

  const videoResults = useMemo(
    () => (needle ? messages.filter((m) => m.title.toLowerCase().includes(needle)) : []),
    [messages, needle]
  );

  const audioResults = useMemo(
    () => (needle ? audioCorpus.filter((entry) => entry.haystack.includes(needle)) : []),
    [audioCorpus, needle]
  );

  const hasResults = videoResults.length > 0 || audioResults.length > 0;
  // The results view is shown as soon as anything is typed, but it renders the
  // SETTLED term's results — so the screen never flashes "No results for
  // 'grac'" on the way to "grace".
  const searching = query.trim().length > 0;
  const pending = searching && settled !== query.trim();

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
            placeholder="Search sermons, audio, and more"
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
        ) : hasResults ? (
          // TWO GROUPS, each drawn in its own medium's language. Interleaving
          // them into one list would need a single card that serves both, and
          // the two have nothing in common to show: a video has a thumbnail
          // and a runtime, a recording has neither and has a speaker instead.
          <View style={searchStyles.preSearch}>
            {videoResults.length > 0 && (
              <View>
                <Text style={searchStyles.sectionLabel}>
                  Videos · {videoResults.length}
                </Text>
                <View style={searchStyles.resultsList}>
                  {videoResults.slice(0, RESULT_LIMIT).map((msg) => (
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
              </View>
            )}

            {audioResults.length > 0 && (
              <View>
                <Text style={searchStyles.sectionLabel}>
                  Audio · {audioResults.length}
                </Text>
                <View>
                  {audioResults.slice(0, RESULT_LIMIT).map(({ track }, i) => (
                    <View key={track.id}>
                      {i > 0 && <View style={styles.divider} />}
                      <AudioListRow
                        title={track.title}
                        series={track.series}
                        speaker={track.speaker}
                        date={formatAudioDate(track.date)}
                        isActive={audio.isActive(track.id)}
                        isPlaying={audio.isPlaying(track.id)}
                        isLoading={audio.isLoading(track.id)}
                        isSaved={!!track.sourceUrl && audio.isSaved(track.sourceUrl)}
                        // The queue is THE RESULTS you are looking at, so
                        // "next" moves down the list on screen rather than
                        // jumping into unrelated content.
                        onPress={() =>
                          audio.toggle(track, {
                            items: audioResults.slice(0, RESULT_LIMIT).map((r) => r.track),
                            label: `Search: ${settled}`,
                          })
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : pending ? (
          // The term is still settling. Saying "no results" here would be a
          // claim about a search that has not run yet.
          <SkeletonList rows={3} />
        ) : (
          <Text style={searchStyles.noResults}>No results for "{settled}"</Text>
        )}
      </ScrollView>
    </ScreenWithWatermark>
  );
}

const styles = StyleSheet.create({
  // Matches the divider the Audio tab's own lists use, so an audio row looks
  // the same here as it does where it lives.
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.grayBorder,
    marginLeft: AUDIO_ROW_ART + theme.space.tight + 4,
  },
});
