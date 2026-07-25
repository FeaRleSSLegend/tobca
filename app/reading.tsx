// Dedicated full-screen scripture reader, pushed from the Bible Plan
// carousel. Deliberately minimal chrome — this screen exists to get out
// of the way of the text, not to look like the rest of the app.
import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { TranslationCode } from '../services/bibleVersions';
import { getVersesForReference, Verse } from '../services/bibleApi';
import { markReadingUnlocked } from '../utils/biblePlan.utils';

const scrollKey = (date: string, readingKey: string) => `@bible_scroll_${date}_${readingKey}`;

export default function ReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reference: string;
    translation: TranslationCode;
    label: string;
    readingKey: string;
    date: string;
  }>();
  const { reference, translation, label, readingKey, date } = params;

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(17);

  const scrollRef = useRef<ScrollView>(null);
  const hasFiredUnlock = useRef(false);
  const saveOffsetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVersesForReference(reference, translation)
      .then(result => {
        if (!cancelled) setVerses(result);
      })
      .catch(err => console.error('Failed to load reading:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reference, translation]);

  // Restore scroll position once verses have rendered, then never again —
  // this only needs to happen the first time the screen mounts with content.
  useEffect(() => {
    if (restoredRef.current || verses.length === 0 || !date || !readingKey) return;
    restoredRef.current = true;
    AsyncStorage.getItem(scrollKey(date, readingKey)).then(saved => {
      if (saved) {
        const y = Number(saved);
        setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
      }
    }).catch(() => {});
  }, [verses, date, readingKey]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    if (date && readingKey) {
      if (saveOffsetTimer.current) clearTimeout(saveOffsetTimer.current);
      saveOffsetTimer.current = setTimeout(() => {
        AsyncStorage.setItem(scrollKey(date, readingKey), String(contentOffset.y)).catch(() => {});
      }, 400);
    }

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 24 && !hasFiredUnlock.current && date) {
      hasFiredUnlock.current = true;
      markReadingUnlocked(date);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>

        <View style={styles.translationPill}>
          <Text style={styles.translationText}>{translation?.toUpperCase()}</Text>
        </View>

        <View style={styles.fontControls}>
          <Pressable onPress={() => setFontSize(s => Math.max(15, s - 2))} style={styles.sizeBtn} hitSlop={8}>
            <Text style={styles.sizeBtnText}>A-</Text>
          </Pressable>
          <Pressable onPress={() => setFontSize(s => Math.min(26, s + 2))} style={styles.sizeBtn} hitSlop={8}>
            <Text style={styles.sizeBtnText}>A+</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.eyebrow}>{label?.toUpperCase()}</Text>
        <Text style={styles.title}>{reference}</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : (
          verses.map((verse, index) => (
            <Text key={index} style={[styles.verse, { fontSize, lineHeight: fontSize * 1.65 }]}>
              <Text style={styles.verseNumber}>{verse.number} </Text>
              {verse.text}
            </Text>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: theme.colors.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationPill: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  translationText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    letterSpacing: 0.5,
  },
  fontControls: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  sizeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.slate,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl * 2,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 28,
    color: theme.colors.navy,
    marginBottom: theme.spacing.xl,
  },
  loadingText: {
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
  },
  verse: {
    fontFamily: theme.fontFamily.serif,
    color: '#2C3E50',
    marginBottom: theme.spacing.lg,
  },
  verseNumber: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 13,
    color: theme.colors.pink,
  },
});