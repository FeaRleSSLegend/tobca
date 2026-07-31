import { FlatList, View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';
import { GridCard } from './GridCard';

const COLUMNS = 3;
const H_PADDING = theme.spacing.lg * 2;
const GAP = theme.spacing.sm;
const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - H_PADDING - GAP * (COLUMNS - 1)) / COLUMNS;

interface CardGridProps {
  data: Message[];
}

/**
 * Reusable 3-column grid for any "See All" destination — Recently Added,
 * Latest Messages, search results, etc. all render through this.
 *
 * No pagination UI on purpose: FlatList virtualizes automatically (only
 * renders what's on/near screen), so it handles a 20-item list and a
 * 200-item list the same way — no "page 2" button needed, which is a
 * desktop pattern that doesn't translate well to a thumb-scrollable phone
 * screen (small tap targets, breaks the scroll flow). If the dataset ever
 * grows past what fits in memory comfortably, the next step up is
 * infinite-scroll via onEndReached (YouTube's own API already supports
 * paging through pageToken in services/youtube.ts) — not numbered pages.
 */
export function CardGrid({ data }: CardGridProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      // Perf props per the performance-patterns reference — this list can
      // grow well past what fits on screen once real data is in.
      removeClippedSubviews
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
      renderItem={({ item }) => (
        <View style={{ width: CARD_WIDTH }}>
          <GridCard
            title={item.title}
            duration={item.duration}
            speaker={item.speaker}
            type={item.type}
            thumbnail={item.thumbnail}
            // No onPress yet — tapping through to actual playback isn't
            // wired up anywhere in the app yet (Library's own grid has
            // the same gap today), not something specific to this screen.
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
});
