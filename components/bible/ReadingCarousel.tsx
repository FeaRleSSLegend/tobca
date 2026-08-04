import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Verse } from '../../services/bibleApi';
import { PressableScale } from '../ui/motion';

// Each reading type gets its own glyph so the four cards aren't visually
// interchangeable — a small personality cue that helps the eye tell "which
// reading is this" before reading the label.
function iconFor(key: string): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case 'oldTestament': return 'book-outline';
    case 'newTestament': return 'sparkles-outline';
    case 'psalm': return 'musical-notes-outline';
    case 'proverb': return 'bulb-outline';
    default: return 'book-outline';
  }
}

export interface ReadingCarouselItem {
  key: string;
  label: string;
  reference: string;
  verses: Verse[];
  // True when THIS preview's fetch failed — the card shows a fallback
  // instead of sitting on "Loading…" forever, and the Read link still
  // works (opening the full passage retries the fetch on its own).
  failed?: boolean;
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

function previewText(item: ReadingCarouselItem): string {
  if (item.failed) return 'Preview unavailable right now. Tap Read to open the full passage.';
  if (item.verses.length === 0) return 'Loading…';
  return item.verses.slice(0, 2).map(v => v.text).join(' ');
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
          <PressableScale
            onPress={() => onPressCard(item)}
            style={[styles.card, { width: CARD_WIDTH, marginRight: CARD_GAP }]}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}, ${item.reference}. Tap to read.`}
          >
            <View style={styles.cardHead}>
              <View style={styles.iconBadge}>
                <Ionicons name={iconFor(item.key)} size={15} color={theme.colors.pink} />
              </View>
              <Text style={styles.label}>{item.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.reference}>{item.reference}</Text>
            <Text style={styles.preview} numberOfLines={4}>
              {previewText(item)}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.readMore}>Read passage</Text>
              <Ionicons name="arrow-forward" size={15} color={theme.colors.pink} />
            </View>
          </PressableScale>
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
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    minHeight: 210,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    backgroundColor: '#FDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    letterSpacing: 0.8,
  },
  reference: {
    fontFamily: theme.fontFamily.display,
    fontSize: 20,
    color: theme.colors.navy,
    marginBottom: theme.spacing.sm,
  },
  preview: {
    flex: 1,
    // Serif — mirrors the actual reader and the reference's scripture
    // typography, so the preview reads like a taste of the passage rather
    // than UI text.
    fontFamily: theme.fontFamily.serif,
    fontSize: 15,
    lineHeight: 23,
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