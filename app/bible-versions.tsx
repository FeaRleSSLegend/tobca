// Dedicated Bible Version selection screen, pushed from the translation pill
// in the reader's header. Selection persists (AsyncStorage) and the Plan tab
// and reader both read it, so the choice is app-wide, not per-screen.
//
// WHAT WAS REMOVED IN THE CLEANUP, and why each was redundant rather than
// merely wordy:
//
//   "English" on every card. The whole catalog this app key exposes is
//   English (see services/bibleVersions.ts), so the word appeared six times
//   and distinguished nothing. Removed from the data model, not just hidden.
//
//   The standalone approach PILL. "Word-for-word" sat on its own row below
//   the name, which cost every card a third line to carry two words. It is
//   now part of the single meta line beside the year, where it is read in the
//   same glance as everything else that orients you.
//
//   Second sentences. Each description was one or two sentences; at three
//   versions that was a paragraph per card, at six it is a wall. Every entry
//   is now exactly one sentence answering one question: who is this for.
//
// The APPROACH itself was kept, and deliberately: word-for-word vs
// thought-for-thought is the axis that actually separates these translations
// in practice, far more than the publication year does.
//
// The list is a plain map, not a FlatList — six entries don't need
// virtualization.
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { makeThemedStyles, useThemeColors } from '../hooks/useTheme';
import {
  BIBLE_VERSIONS,
  TranslationCode,
  getSavedTranslation,
  saveTranslation,
} from '../services/bibleVersions';
import { prefetchReferences } from '../services/bibleApi';
import { getTodayReading } from '../utils/biblePlan.utils';

export default function BibleVersionsScreen() {
  const styles = useStyles();
  const c = useThemeColors();
  const router = useRouter();
  const [selected, setSelected] = useState<TranslationCode | null>(null);

  useEffect(() => {
    getSavedTranslation().then(setSelected);
  }, []);

  const choose = async (code: TranslationCode) => {
    setSelected(code);
    await saveTranslation(code);
    // Start pulling today's readings for the new version IMMEDIATELY —
    // fire-and-forget, so by the time the user lands back in the reader
    // the switched text is usually already cached and renders with no
    // loading screen. (The Platform API has no offline-download endpoint
    // like YouVersion's own app uses, so instant switching is manufactured
    // by prefetching what's about to be read — see prefetchReferences.)
    const today = getTodayReading();
    if (today) {
      prefetchReferences(
        [today.oldTestament, today.newTestament, today.psalm, today.proverb],
        code
      );
    }
    // Back to the reader immediately — picking a version IS the task; a
    // lingering screen after the choice would just add a manual back-tap.
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={c.navy} />
        </Pressable>
        <View>
          <Text style={styles.title}>Bible Version</Text>
          <Text style={styles.subtitle}>Applies to your plan and reader</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {BIBLE_VERSIONS.map((v) => {
          const isSelected = v.code === selected;
          return (
            <Pressable
              key={v.code}
              onPress={() => choose(v.code)}
              style={[styles.card, isSelected && styles.cardSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${v.name}, ${v.abbreviation}, ${v.approach}${isSelected ? ', currently selected' : ''}`}
            >
              <View style={styles.cardTop}>
                <View style={styles.abbrBadge}>
                  <Text style={styles.abbrText}>{v.abbreviation}</Text>
                </View>
                <View style={styles.nameWrap}>
                  <Text style={styles.name}>{v.name}</Text>
                  {/* One meta line: what kind of translation it is, then when
                      it dates from. The approach used to be a separate pill on
                      its own row. */}
                  <Text style={styles.meta}>{v.approach} · {v.year}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={c.success} />
                )}
              </View>

              <Text style={styles.description}>{v.description}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: c.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.navy,
  },
  subtitle: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: c.graySecondary,
    marginTop: theme.space.hairline,
  },
  scrollContent: {
    padding: theme.layout.screenPadding,
    gap: theme.spacing.md,
    paddingBottom: theme.layout.scrollClearance.stack,
  },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.grayBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  // Selection carries a border change AND the checkmark — never color
  // alone, so the state survives color-vision differences.
  cardSelected: {
    borderColor: c.fillStrong,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  abbrBadge: {
    minWidth: 52,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: c.fillStrong,
    alignItems: 'center',
  },
  abbrText: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    color: c.onFillStrong,
    letterSpacing: 0.5,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.navy,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    marginTop: theme.space.hairline,
  },
  description: {
    marginTop: theme.spacing.md,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    lineHeight: 19,
    color: c.graySecondary,
  },
}));
