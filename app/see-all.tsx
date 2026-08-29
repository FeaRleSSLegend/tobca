// The shared collection-screen template — the second half of the Library
// redesign. Library (the hub) shows preview rows; THIS screen is where a
// whole collection actually gets browsed. One route, one consistent
// chrome (header → optional description → scoped search → filter pills),
// and a content area that changes shape per collection, because the right
// layout follows from the content type:
//
//   section=series        grouped 2-col tile grid (Ongoing / Completed)
//   section=services      vertical list grouped This Week → month buckets
//   section=recentlyAdded vertical list grouped Today/This Week/…
//   section=latest        same as recentlyAdded (Live tab's "See All")
//   section=playlists     3-col circle grid, no pills
//   filter=<label>        drill-in: every message in ONE series/service
//
// Consistency lives in the chrome (identical header/search/pills on every
// variant); uniqueness lives in the content area. Tiles/grids where the
// choice is visual (series posters, playlist circles), metadata-first
// list rows where it isn't (services and recents, where date/duration
// matter more than near-identical thumbnails).
//
// "Pagination": every list here is a FlatList/SectionList, so rendering
// is already virtualized — only what's on/near screen mounts, whether the
// dataset is 20 items or 500. True fetch-more-from-network paging isn't
// wired because useMessages loads the channel in one cached call today;
// when that changes, onEndReached + the pageToken support already in
// services/youtube.ts is the path.
import { useMemo, useState } from 'react';
import { View, Text, FlatList, SectionList, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { Ionicons } from '@expo/vector-icons';
import { useSeeAllStyles } from '../constants/styles/seeAll.styles';
import { theme } from '../constants/theme';
import { CardGrid } from '../components/ui/CardGrid';
import { CollectionShell } from '../components/ui/CollectionShell';
import { usePlayback } from '../providers/PlaybackProvider';
import { MessageCard } from '../components/ui/MessageCard';
import { ServiceRow } from '../components/ui/ServiceRow';
import { SeriesListRow } from '../components/ui/SeriesListRow';
import { PlaylistListRow } from '../components/ui/PlaylistListRow';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeletons';
import { SeriesTrackRow, SERIES_ROW_ART } from '../components/ui/SeriesTrackRow';
import { makeThemedStyles } from '../hooks/useTheme';
import { Message, getRecentlyAdded } from '../data/content';
import { useMessages } from '../hooks/useMessages';
import { usePlaylists } from '../hooks/usePlaylists';
import { useStackBottomClearance } from '../hooks/useBottomClearance';
import { classifyMessages, displayTitle, ContentGroup } from '../utils/contentGrouping';
import {
  groupByMonth,
  groupByRecency,
  isOngoing,
  shortDate,
  MessageSection,
} from '../utils/collections';

// The shared chrome (watermark screen wrapper + header + description +
// search + pills) lives in components/ui/CollectionShell.tsx — shared
// with playlist/[id].tsx so a playlist's detail page wears the exact
// same top half as every collection here.

// Section header inside a SectionList / grouped grid ("This Week",
// "June 2026", "Ongoing"…). Not sticky: with search + pills above the list,
// a sticky header would eat vertical space on exactly the screens that
// scroll longest. The trailing count answers "how deep is this bucket"
// before scrolling into it — cheap orientation for month groups that can
// hold anything from 1 to 12 services.
const GroupHeader = ({ label, count }: { label: string; count?: number }) => {
  const seeAllStyles = useSeeAllStyles();
  return (
  <View style={seeAllStyles.groupHeaderRow}>
    <Text style={seeAllStyles.groupHeader} accessibilityRole="header">
      {label}
    </Text>
    {count !== undefined && <Text style={seeAllStyles.groupHeaderCount}>{count}</Text>}
  </View>
);
}

const messageRow = (m: Message, onPress?: () => void) => (
  <MessageCard
    id={m.id}
    title={m.title}
    speaker={m.speaker}
    duration={m.duration}
    series={m.series}
    type={m.type}
    publishedAt={shortDate(m.publishedAt)}
    thumbnail={m.thumbnail}
    onPress={onPress}
  />
);

const listPerfProps = {
  showsVerticalScrollIndicator: false,
  removeClippedSubviews: true,
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 5,
} as const;

// ---------------------------------------------------------------------------
// Series — grouped 2-col tile grid. Grid because picking a series is a
// visual decision (poster recognition); grouped Ongoing/Completed because
// classification already knows which programs are still running, and
// "is there a new part of X" is the question people bring to this screen.
// ---------------------------------------------------------------------------

const SERIES_PILLS = ['All', 'Ongoing', 'Completed', 'A-Z'];

// One FlatList renders both the group headers and the series rows, so the
// whole thing stays virtualized. Rows are full-width now (SeriesListRow),
// not 2-col tiles — see SeriesListRow for the rationale.
type SeriesRow =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'row'; key: string; group: ContentGroup };

function SeriesCollection({ groups, loading, onOpenGroup }: {
  groups: ContentGroup[];
  loading: boolean;
  onOpenGroup: (label: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState('All');
  const seeAllStyles = useSeeAllStyles();
  const bottomClearance = useStackBottomClearance();

  const rows = useMemo<SeriesRow[]>(() => {
    const q = query.trim().toLowerCase();
    let visible = q ? groups.filter((g) => g.label.toLowerCase().includes(q)) : groups;

    // Search results and A-Z are flat (grouping by status while searching
    // would scatter matches); All groups by status; Ongoing/Completed are
    // that one status, flat.
    if (q || pill === 'A-Z') {
      const sorted = pill === 'A-Z'
        ? [...visible].sort((a, b) => a.label.localeCompare(b.label))
        : visible;
      return sorted.map((g) => ({ kind: 'row', key: g.key, group: g }));
    }
    if (pill === 'Ongoing') visible = visible.filter(isOngoing);
    if (pill === 'Completed') visible = visible.filter((g) => !isOngoing(g));
    if (pill !== 'All') {
      return visible.map((g) => ({ kind: 'row', key: g.key, group: g }));
    }

    const ongoing = visible.filter(isOngoing);
    const completed = visible.filter((g) => !isOngoing(g));
    const out: SeriesRow[] = [];
    if (ongoing.length > 0) {
      out.push({ kind: 'header', key: 'h-ongoing', label: 'Ongoing' });
      ongoing.forEach((g) => out.push({ kind: 'row', key: g.key, group: g }));
    }
    if (completed.length > 0) {
      out.push({ kind: 'header', key: 'h-completed', label: 'Completed' });
      completed.forEach((g) => out.push({ kind: 'row', key: g.key, group: g }));
    }
    return out;
  }, [groups, query, pill]);

  const count = `${groups.length} series`;

  return (
    <CollectionShell
      title="Series"
      subtitle={count}
      description="Themed multi-part teachings, grouped from everything on the channel."
      searchPlaceholder="Search series"
      query={query}
      onQueryChange={setQuery}
      pills={SERIES_PILLS}
      activePill={pill}
      onPillPress={setPill}
    >
      {rows.length > 0 ? (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          style={{ flex: 1 }}
          contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
          {...listPerfProps}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          renderItem={({ item, index }) =>
            item.kind === 'header' ? (
              <GroupHeader label={item.label} />
            ) : (
              <SeriesListRow
                title={item.group.label}
                count={item.group.count}
                thumbnail={item.group.thumbnail}
                isOngoing={isOngoing(item.group)}
                index={rows.slice(0, index + 1).filter((r) => r.kind === 'row').length}
                onPress={() => onOpenGroup(item.group.label)}
              />
            )
          }
        />
      ) : loading ? (
        <SkeletonList rows={6} />
      ) : query || pill !== 'All' ? (
        <EmptyState
          icon="search"
          title="No matching series"
          subtitle="Try a different search or filter."
          actionLabel={query ? 'Clear search' : 'Show all'}
          onAction={() => { setQuery(''); setPill('All'); }}
        />
      ) : (
        <EmptyState
          icon="albums"
          title="No series yet"
          subtitle="Series will appear here as multi-part teachings are uploaded."
        />
      )}
    </CollectionShell>
  );
}

// ---------------------------------------------------------------------------
// Services / Recently Added / Latest — vertical list rows grouped by time.
// List (not grid) because these rows are metadata decisions — date, type,
// duration — and service thumbnails all look alike, so the grid's bigger
// image would buy nothing while costing the text space that actually
// differentiates rows.
// ---------------------------------------------------------------------------

function MessageListCollection({
  title,
  description,
  searchPlaceholder,
  list,
  pills,
  filterItems,
  groupSections,
  loading,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  renderRow,
}: {
  title: string;
  description?: string;
  searchPlaceholder: string;
  list: Message[];
  pills: string[];
  filterItems: (list: Message[], pill: string) => Message[];
  groupSections: (list: Message[]) => MessageSection[];
  loading: boolean;
  emptyIcon: keyof typeof Ionicons.glyphMap;
  emptyTitle: string;
  emptySubtitle: string;
  // Per-collection row override — Services swaps in the calendar-block
  // ServiceRow; everything else defaults to the thumbnail MessageCard.
  // Per-collection row override — Services swaps in the calendar-block
  // ServiceRow; everything else defaults to the thumbnail MessageCard.
  // Receives an onPress that plays the row, so the override doesn't need
  // its own playback wiring.
  renderRow?: (m: Message, onPress: () => void) => React.ReactElement;
}) {
  const { play } = usePlayback();
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState('All');
  const seeAllStyles = useSeeAllStyles();
  const bottomClearance = useStackBottomClearance();

  const { sections, visibleCount } = useMemo(() => {
    const q = query.trim().toLowerCase();
    let visible = filterItems(list, pill);
    if (q) visible = visible.filter((m) => m.title.toLowerCase().includes(q));
    // Search results come back flat — date-grouping a handful of matches
    // just adds headers between them for no orientation benefit.
    const grouped: MessageSection[] = q
      ? visible.length > 0 ? [{ title: 'Results', data: visible }] : []
      : groupSections(visible);
    return { sections: grouped, visibleCount: visible.length };
  }, [list, query, pill, filterItems, groupSections]);

  return (
    <CollectionShell
      title={title}
      subtitle={`${list.length} message${list.length === 1 ? '' : 's'}`}
      description={description}
      searchPlaceholder={searchPlaceholder}
      query={query}
      onQueryChange={setQuery}
      pills={pills}
      activePill={pill}
      onPillPress={setPill}
    >
      {visibleCount > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(m, index) => `${m.id}:${index}`}
          style={{ flex: 1 }}
          contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
          stickySectionHeadersEnabled={false}
          {...listPerfProps}
          renderSectionHeader={({ section }) => (
            <GroupHeader label={section.title} count={section.data.length} />
          )}
          renderItem={({ item }) => (
            <View style={seeAllStyles.listRowWrap}>
              {renderRow ? renderRow(item, () => play(item)) : messageRow(item, () => play(item))}
            </View>
          )}
        />
      ) : loading ? (
        <SkeletonList />
      ) : query || pill !== 'All' ? (
        <EmptyState
          icon="search"
          title="No matches"
          subtitle="Try a different search or filter."
          actionLabel={query ? 'Clear search' : 'Show all'}
          onAction={() => { setQuery(''); setPill('All'); }}
        />
      ) : (
        <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} />
      )}
    </CollectionShell>
  );
}

// ---------------------------------------------------------------------------
// Playlists — a vertical list of square-art rows (Spotify/Apple Music
// style), replacing the circle grid. See PlaylistListRow for why: circles
// read as people/stations, square-art rows read as collections, and the
// list form gives titles and counts real room.
// ---------------------------------------------------------------------------

function PlaylistsCollection() {
  const seeAllStyles = useSeeAllStyles();
  const router = useRouter();
  const push = useGuardedPush();
  const { playlists, loading } = usePlaylists();
  const [query, setQuery] = useState('');
  const bottomClearance = useStackBottomClearance();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? playlists.filter((p) => p.title.toLowerCase().includes(q)) : playlists;
  }, [playlists, query]);

  return (
    <CollectionShell
      title="Playlists"
      subtitle={`${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`}
      description="Collections curated on the church's channel."
      searchPlaceholder="Search playlists"
      query={query}
      onQueryChange={setQuery}
    >
      {visible.length > 0 ? (
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          style={{ flex: 1 }}
          contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
          {...listPerfProps}
          renderItem={({ item }) => (
            <PlaylistListRow
              title={item.title}
              count={item.itemCount}
              thumbnail={item.thumbnail}
              onPress={() =>
                push({ pathname: '/playlist/[id]', params: { id: item.id, title: item.title } })
              }
            />
          )}
        />
      ) : loading ? (
        <SkeletonList rows={6} />
      ) : query ? (
        <EmptyState
          icon="search"
          title="No matching playlists"
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <EmptyState
          icon="albums"
          title="No playlists yet"
          subtitle="Playlists created on the channel will show up here."
        />
      )}
    </CollectionShell>
  );
}

// ---------------------------------------------------------------------------
// Drill-in — every message inside ONE series or recurring service (reached
// from a Series/Services tile, or a hub poster). Same 3-col CardGrid as
// before, now wearing the shared shell so it gets scoped search and the
// same header treatment as its parents.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ONE SERIES, AS A TRACKLIST.
//
// This was a 2-column CardGrid. A grid presents its items as alternatives —
// correct for Recently Added, wrong for a series, where the items are ordered
// parts of one thing and the reader's actual question is "where do I start".
// A numbered vertical list answers that before anything is read.
//
// SORT DEFAULTS TO OLDEST FIRST, and it is a real toggle rather than a fixed
// order. Reasoning, and the concerns that go with it, are on SERIES_SORT below.
// ---------------------------------------------------------------------------

const SORT_OLDEST = 'Oldest first';
const SERIES_SORT = [SORT_OLDEST, 'Newest first'];

function FilteredGroupCollection({ label, messages, loading }: {
  label: string;
  messages: Message[];
  loading: boolean;
}) {
  const seeAllStyles = useSeeAllStyles();
  const styles = useSeriesStyles();
  const { play } = usePlayback();
  const bottomClearance = useStackBottomClearance();
  const [query, setQuery] = useState('');
  // OLDEST FIRST by default: a series is meant to be followed in order, and
  // the default view should therefore open on Part 1 rather than on the
  // ending. "Clips" is the one label routed here that is NOT a series, so it
  // keeps the newest-first order a feed wants.
  const isSeries = label !== 'Clips';
  const [sort, setSort] = useState(isSeries ? SORT_OLDEST : 'Newest first');

  const items = useMemo(() => {
    const { recurringServices, series, clips } = classifyMessages(messages);
    const base =
      label === 'Clips'
        ? clips
        : [...recurringServices, ...series].find((g) => g.label === label)?.items ?? [];

    // classifyMessages hands these back newest-first.
    const ordered =
      sort === SORT_OLDEST
        ? [...base].sort(
            (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
          )
        : [...base].sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          );

    const q = query.trim().toLowerCase();
    return q ? ordered.filter((m) => m.title.toLowerCase().includes(q)) : ordered;
  }, [messages, label, query, sort]);

  return (
    <CollectionShell
      title={label}
      subtitle={`${items.length} part${items.length === 1 ? '' : 's'}`}
      searchPlaceholder={`Search ${label}`}
      query={query}
      onQueryChange={setQuery}
      // The sort control reuses the shell's existing pill row rather than
      // introducing a second kind of control to the collection chrome. Every
      // other collection screen filters with these; this one orders with them.
      pills={SERIES_SORT}
      activePill={sort}
      onPillPress={setSort}
    >
      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          {...listPerfProps}
          renderItem={({ item, index }) => (
            <SeriesTrackRow
              // Position in the CURRENT order, so the numbers stay 1..n
              // whichever way the list is sorted. See the note in
              // SeriesTrackRow on why this is not a parsed part number.
              index={index + 1}
              title={displayTitle(item.title)}
              thumbnail={item.thumbnail}
              duration={item.duration}
              speaker={item.speaker}
              date={shortDate(item.publishedAt)}
              onPress={() => play(item)}
            />
          )}
        />
      ) : loading ? (
        <SkeletonList rows={6} />
      ) : query ? (
        <EmptyState
          icon="search"
          title="No matches"
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <EmptyState icon="videocam" title="Nothing here yet" />
      )}
    </CollectionShell>
  );
}

const useSeriesStyles = makeThemedStyles((c) => ({
  // A hairline between rows instead of a gap between cards — what makes the
  // list read as one ordered thing rather than n separate objects. Inset to
  // clear the index and artwork so it aligns under the title.
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginLeft: 22 + SERIES_ROW_ART + (theme.space.tight + 4) * 2,
  },
}));

// ---------------------------------------------------------------------------
// Route component — reads params and mounts the right collection. The
// playlists variant is its own component (not a branch inside one big
// render) so usePlaylists only runs — and only spends its API call — when
// the playlists collection is actually open.
// ---------------------------------------------------------------------------

export default function SeeAllScreen() {
  const { section, filter, title } = useLocalSearchParams<{
    section?: string;
    filter?: string;
    title?: string;
  }>();

  if (section === 'playlists') return <PlaylistsCollection />;
  return <MessagesRouter section={section} filter={filter} title={title} />;
}

function MessagesRouter({ section, filter, title }: {
  section?: string;
  filter?: string;
  title?: string;
}) {
  const router = useRouter();
  const push = useGuardedPush();
  const { messages, loading } = useMessages();

  const classified = useMemo(() => classifyMessages(messages), [messages]);

  if (filter) {
    return <FilteredGroupCollection label={filter} messages={messages} loading={loading} />;
  }

  if (section === 'series') {
    return (
      <SeriesCollection
        groups={classified.series}
        loading={loading}
        onOpenGroup={(label) =>
          push({ pathname: '/see-all', params: { filter: label, title: label } })
        }
      />
    );
  }

  if (section === 'services') {
    // One row per RECORDING. A recording can match more than one service
    // pattern (a Praise & Miracle Service held on a Sunday lands in both
    // the "Sunday Service" and "Praise & Miracle Service" buckets by
    // design), so flattening the buckets naively emits that video's id
    // twice — which is exactly the duplicate-key warning. Dedupe by id
    // here, collapsing a recording's multiple service labels into one row
    // that remembers all of them, so it still shows under every relevant
    // filter pill without ever rendering twice.
    const byId = new Map<string, Message & { serviceLabels: string[] }>();
    for (const g of classified.recurringServices) {
      for (const m of g.items) {
        const existing = byId.get(m.id);
        if (existing) {
          if (!existing.serviceLabels.includes(g.label)) existing.serviceLabels.push(g.label);
        } else {
          byId.set(m.id, { ...m, series: g.label, serviceLabels: [g.label] });
        }
      }
    }
    const flat = Array.from(byId.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const pills = ['All', ...classified.recurringServices.map((g) => g.label)];
    return (
      <MessageListCollection
        title="Services"
        description="Past service recordings, newest first."
        searchPlaceholder="Search services"
        list={flat}
        pills={pills}
        filterItems={(list, pill) =>
          pill === 'All'
            ? list
            : list.filter((m) => (m as Message & { serviceLabels?: string[] }).serviceLabels?.includes(pill) ?? m.series === pill)
        }
        groupSections={groupByMonth}
        loading={loading}
        emptyIcon="calendar"
        emptyTitle="No services yet"
        emptySubtitle="Recordings will appear here after each service."
        renderRow={(m, onPress) => <ServiceRow message={m} serviceLabel={m.series} onPress={onPress} />}
      />
    );
  }

  // recentlyAdded + latest + no-param fallback: same feed, different title.
  const recent = getRecentlyAdded(messages, messages.length);
  const clipIds = new Set(classified.clips.map((c) => c.id));
  const typeLabels: Record<string, string> = {
    sermon: 'Sermons', series: 'Series', audio: 'Audio', video: 'Videos',
  };
  // Pills from the types actually present, so a pill never leads to an
  // empty list. Real YouTube data currently maps everything to 'sermon',
  // in which case only "All" (+ maybe Clips) survives and the pill row
  // hides itself entirely (the shell skips rendering a 1-pill row).
  const presentTypes = Array.from(new Set(recent.filter((m) => !clipIds.has(m.id)).map((m) => m.type)));
  const pills = ['All', ...presentTypes.map((t) => typeLabels[t] ?? t)];
  if (classified.clips.length > 0) pills.push('Clips');
  const labelToType = Object.fromEntries(Object.entries(typeLabels).map(([t, l]) => [l, t]));

  return (
    <MessageListCollection
      title={title ?? 'Recently Added'}
      searchPlaceholder="Search recent messages"
      list={recent}
      pills={pills}
      filterItems={(list, pill) => {
        if (pill === 'All') return list.filter((m) => !clipIds.has(m.id));
        if (pill === 'Clips') return list.filter((m) => clipIds.has(m.id));
        return list.filter((m) => m.type === labelToType[pill] && !clipIds.has(m.id));
      }}
      groupSections={groupByRecency}
      loading={loading}
      emptyIcon="time"
      emptyTitle="Nothing new recently"
      emptySubtitle="Uploads from the last two months will land here."
    />
  );
}
