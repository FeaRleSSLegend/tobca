// app/documents.tsx
// THE FULL DOCUMENT LIST — what the Prayer tab's "Prayer Resources" chevron
// opens.
//
// The third instance of one pattern, not a third pattern. app/see-all.tsx does
// this for the church's videos and app/audio-collection.tsx does it for the
// R2 audio; both are a CollectionShell (back + title + count + description +
// scoped search) wrapped around a virtualised list, reached from a capped
// preview whose section header carries a chevron. Documents were the one
// resource type on the Prayer tab still rendering as an unbounded flat list,
// so they get the same treatment through the same shell rather than a
// bespoke screen that would drift from the other two.
//
// NO PILLS. The other two collections filter by a real axis — series status,
// service name, saved-for-offline. The documents manifest carries a title, a
// URL and a byte size and nothing else; there is no category to filter on, so
// a pill row here would either be one dead "All" pill (which CollectionShell
// already declines to render) or invented taxonomy.
//
// SEARCH IS TITLE-ONLY for the same reason: the title is the only text field
// that exists. A search box that appears to search PDF contents and does not
// would be worse than none, so the placeholder says "Search documents" rather
// than anything implying full-text.

import { useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { theme } from '../constants/theme';
import { makeThemedStyles } from '../hooks/useTheme';
import { useSeeAllStyles } from '../constants/styles/seeAll.styles';
import { CollectionShell } from '../components/ui/CollectionShell';
import { DocumentRow } from '../components/ui/DocumentRow';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeletons';
import { useR2Manifest } from '../hooks/useR2Manifest';
import { formatBytes } from '../services/r2';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { useStackBottomClearance } from '../hooks/useBottomClearance';

export default function DocumentsScreen() {
  const seeAllStyles = useSeeAllStyles();
  const push = useGuardedPush();
  const styles = useStyles();
  const bottomClearance = useStackBottomClearance();
  const [query, setQuery] = useState('');

  // Already cached — the Prayer tab rendered its preview from this same
  // manifest, so reaching this screen cannot cost a network call.
  const documents = useR2Manifest('documents');

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? documents.items.filter((d) => d.title.toLowerCase().includes(q)) : documents.items),
    [documents.items, q]
  );

  // In-app, exactly as the Prayer tab opens them — see app/document.tsx for
  // why a PDF stays inside the app rather than going out to the system viewer.
  const openDocument = (url: string, title: string) =>
    push({ pathname: '/document', params: { url, title } });

  return (
    <CollectionShell
      title="Prayer Resources"
      subtitle={`${documents.items.length} document${documents.items.length === 1 ? '' : 's'}`}
      description="Guides, timetables and prayer points published by the church."
      searchPlaceholder="Search documents"
      query={query}
      onQueryChange={setQuery}
    >
      {documents.status === 'loading' ? (
        <View style={styles.skeleton}>
          <SkeletonList rows={6} />
        </View>
      ) : documents.status === 'error' ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load documents"
          subtitle="Check your connection and try again."
          actionLabel="Try again"
          onAction={documents.reload}
        />
      ) : visible.length > 0 ? (
        <FlatList
          data={visible}
          keyExtractor={(d) => d.url}
          style={{ flex: 1 }}
          contentContainerStyle={[seeAllStyles.listContent, { paddingBottom: bottomClearance }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={9}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DocumentRow
              title={item.title}
              sizeLabel={formatBytes(item.sizeBytes)}
              onPress={() => openDocument(item.url, item.title)}
            />
          )}
          ListFooterComponent={
            documents.stale ? <Text style={styles.staleNote}>Offline copy</Text> : null
          }
        />
      ) : q ? (
        <EmptyState
          icon="search"
          title="No matches"
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <EmptyState
          icon="document-text-outline"
          title="No documents yet"
          subtitle="Prayer guides and timetables will appear here once they are published."
        />
      )}
    </CollectionShell>
  );
}

const useStyles = makeThemedStyles((c) => ({
  skeleton: {
    paddingHorizontal: theme.layout.screenPadding,
  },
  separator: {
    height: theme.space.tight,
  },
  staleNote: {
    marginTop: theme.space.header,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textMuted,
    textAlign: 'center',
  },
}));
