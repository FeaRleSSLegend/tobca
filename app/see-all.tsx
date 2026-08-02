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
import { View, Text, FlatList, SectionList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { seeAllStyles } from '../constants/styles/seeAll.styles';
import { CardGrid } from '../components/ui/CardGrid';
import { CollectionShell } from '../components/ui/CollectionShell';
import { MessageCard } from '../components/ui/MessageCard';
import { GroupCard } from '../components/ui/GroupCard';
import { PlaylistCircle } from '../components/ui/PlaylistCircle';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeletons';
import { Message, getRecentlyAdded } from '../data/content';
import { useMessages } from '../hooks/useMessages';
import { usePlaylists } from '../hooks/usePlaylists';
import { classifyMessages, ContentGroup } from '../utils/contentGrouping';
import {
  chunk,
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
// scroll longest.
const GroupHeader = ({ label }: { label: string }) => (
  <Text style={seeAllStyles.groupHeader} accessibilityRole="header">
    {label}
  </Text>
);

const messageRow = (m: Message, onPress?: () => void) => (
  <View style={seeAllStyles.listRowWrap}>
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
  </View>
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

// One FlatList renders both the group headers and the 2-col rows, so the
// whole thing stays virtualized (SectionList can't do numColumns, and
// nesting FlatLists inside a ScrollView breaks virtualization entirely).
type SeriesRow =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'row'; key: string; groups: ContentGroup[] };

function SeriesCollection({ groups, loading, onOpenGroup }: {
  groups: ContentGroup[];
  loading: boolean;
  onOpenGroup: (label: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState('All');

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
      return chunk(sorted, 2).map((pair, i) => ({ kind: 'row', key: `r${i}`, groups: pair }));
    }
    if (pill === 'Ongoing') visible = visible.filter(isOngoing);
    if (pill === 'Completed') visible = visible.filter((g) => !isOngoing(g));
    if (pill !== 'All') {
      return chunk(visible, 2).map((pair, i) => ({ kind: 'row', key: `r${i}`, groups: pair }));
    }

    const ongoing = visible.filter(isOngoing);
    const completed = visible.filter((g) => !isOngoing(g));
    const out: SeriesRow[] = [];
    if (ongoing.length > 0) {
      out.push({ kind: 'header', key: 'h-ongoing', label: 'Ongoing' });
      chunk(ongoing, 2).forEach((pair, i) => out.push({ kind: 'row', key: `ro${i}`, groups: pair }));
    }
    if (completed.length > 0) {
      out.push({ kind: 'header', key: 'h-completed', label: 'Completed' });
      chunk(completed, 2).forEach((pair, i) => out.push({ kind: 'row', key: `rc${i}`, groups: pair }));
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
          contentContainerStyle={seeAllStyles.listContent}
          {...listPerfProps}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <GroupHeader label={item.label} />
            ) : (
              <View style={seeAllStyles.tileRow}>
                {item.groups.map((g) => (
                  <GroupCard
                    key={g.key}
                    title={g.label}
                    subtitle={`${g.count} message${g.count === 1 ? '' : 's'}`}
                    thumbnail={g.thumbnail}
                    onPress={() => onOpenGroup(g.label)}
                  />
                ))}
                {/* Odd final row: spacer keeps the lone tile at half width
                    instead of stretching across the whole screen. */}
                {item.groups.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            )
          }
        />
      ) : loading ? (
        <SkeletonGrid />
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
}) {
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState('All');

  const { sections, visibleCount } = useMemo(() => {
    const q = query.trim().toLowerCase();
    let visible = filterItems(list, pill);
    if (q) visible = visible.filter((m) => m.title.toLowerCase().includes(q));
    // Search results come back flat — date-grouping a handful of matches
    // just adds headers between them for no orientation benefit.
    const grouped: MessageSection[] = q
      ? visible.length > 0 ? [{ title: `${visible.length} result${visible.length === 1 ? '' : 's'}`, data: visible }] : []
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
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={seeAllStyles.listContent}
          stickySectionHeadersEnabled={false}
          {...listPerfProps}
          renderSectionHeader={({ section }) => <GroupHeader label={section.title} />}
          renderItem={({ item }) => messageRow(item)}
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
// Playlists — 3-col circle grid, no pills. Circles match how playlists
// already render on the hub, and at the channel's current playlist count
// a filter row would be UI weight with no problem behind it. Search stays
// because it's the shell's constant.
// ---------------------------------------------------------------------------

function PlaylistsCollection() {
  const router = useRouter();
  const { playlists, loading } = usePlaylists();
  const [query, setQuery] = useState('');

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
          numColumns={3}
          style={{ flex: 1 }}
          columnWrapperStyle={seeAllStyles.circleRow}
          contentContainerStyle={seeAllStyles.listContent}
          {...listPerfProps}
          renderItem={({ item }) => (
            <PlaylistCircle
              title={item.title}
              count={item.itemCount}
              thumbnail={item.thumbnail}
              onPress={() =>
                router.push({ pathname: '/playlist/[id]', params: { id: item.id, title: item.title } })
              }
            />
          )}
        />
      ) : loading ? (
        <SkeletonGrid tiles={6} />
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

function FilteredGroupCollection({ label, messages, loading }: {
  label: string;
  messages: Message[];
  loading: boolean;
}) {
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const { recurringServices, series, clips } = classifyMessages(messages);
    const base =
      label === 'Clips'
        ? clips
        : [...recurringServices, ...series].find((g) => g.label === label)?.items ?? [];
    const q = query.trim().toLowerCase();
    return q ? base.filter((m) => m.title.toLowerCase().includes(q)) : base;
  }, [messages, label, query]);

  return (
    <CollectionShell
      title={label}
      subtitle={`${items.length} video${items.length === 1 ? '' : 's'}`}
      searchPlaceholder={`Search ${label}`}
      query={query}
      onQueryChange={setQuery}
    >
      {items.length > 0 ? (
        <View style={seeAllStyles.gridWrap}>
          <CardGrid data={items} />
        </View>
      ) : loading ? (
        <SkeletonGrid tiles={6} />
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
          router.push({ pathname: '/see-all', params: { filter: label, title: label } })
        }
      />
    );
  }

  if (section === 'services') {
    // The list is individual recordings flattened out of the classified
    // service groups (so one row = one service you can watch), with pills
    // generated from whatever groups classification actually found —
    // hardcoding "Sunday Service / Wednesday Service" here would drift
    // from reality the moment the channel adds or renames one.
    const flat = classified.recurringServices
      .flatMap((g) => g.items.map((m) => ({ ...m, series: g.label })))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const pills = ['All', ...classified.recurringServices.map((g) => g.label)];
    return (
      <MessageListCollection
        title="Services"
        description="Past service recordings, newest first."
        searchPlaceholder="Search services"
        list={flat}
        pills={pills}
        filterItems={(list, pill) => (pill === 'All' ? list : list.filter((m) => m.series === pill))}
        groupSections={groupByMonth}
        loading={loading}
        emptyIcon="calendar"
        emptyTitle="No services yet"
        emptySubtitle="Recordings will appear here after each service."
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
      emptyTitle="Nothing added yet"
      emptySubtitle="New uploads from the channel will land here."
    />
  );
}
