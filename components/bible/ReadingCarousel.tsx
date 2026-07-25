import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Verse } from '../../services/bibleApi';

export interface ReadingCarouselItem {
  key: string;
  label: string;
  reference: string;
  verses: Verse[];
}

interface ReadingCarouselProps {
  readings: ReadingCarouselItem[];
  onPressCard: (item: ReadingCarouselItem) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = theme.spacing.md;
// Leave a deliberate sliver of the next card visible so the row reads as
// scrollable at a glance — a full-width card with nothing peeking past the
// edge looks like a single static block, not a carousel, until someone
// accidentally swipes it.
const CARD_PEEK = 32;
const CARD_WIDTH = SCREEN_WIDTH - theme.layout.screenPadding * 2 - CARD_PEEK;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

function previewText(verses: Verse[]): string {
  if (verses.length === 0) return 'Loading…';
  return verses.slice(0, 2).map(v => v.text).join(' ');
}

export const ReadingCarousel = ({ readings, onPressCard }: ReadingCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<ReadingCarouselItem>>(null);

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, readings.length - 1));
    listRef.current?.scrollToOffset({ offset: clamped * SNAP_INTERVAL, animated: true });
    setActiveIndex(clamped);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveIndex(Math.max(0, Math.min(index, readings.length - 1)));
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={readings}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingRight: CARD_PEEK }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressCard(item)}
            style={[styles.card, { width: CARD_WIDTH, marginRight: CARD_GAP }]}
          >
            <Text style={styles.label}>{item.label.toUpperCase()}</Text>
            <Text style={styles.reference}>{item.reference}</Text>
            <Text style={styles.preview} numberOfLines={4}>
              {previewText(item.verses)}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.readMore}>Read</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.pink} />
            </View>
          </Pressable>
        )}
      />

      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          style={styles.arrowBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={18} color={activeIndex === 0 ? theme.colors.grayBorder : theme.colors.graySecondary} />
        </Pressable>

        <View style={styles.dots}>
          {readings.map((item, index) => (
            <View
              key={item.key}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable
          onPress={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === readings.length - 1}
          style={styles.arrowBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={18} color={activeIndex === readings.length - 1 ? theme.colors.grayBorder : theme.colors.graySecondary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    minHeight: 190,
  },
  label: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  reference: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.cardTitle,
    fontWeight: '700',
    color: theme.colors.navy,
    marginBottom: theme.spacing.sm,
  },
  preview: {
    flex: 1,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    lineHeight: 20,
    color: theme.colors.graySecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  readMore: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.pink,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.grayBorder,
  },
  dotActive: {
    backgroundColor: theme.colors.pink,
    width: 16,
  },
});