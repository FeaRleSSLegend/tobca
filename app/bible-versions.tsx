// Dedicated Bible Version selection screen, pushed from the translation
// pill in the reader's header. One card per translation, and the content
// of each card is chosen around the actual decision someone is making:
// the translation APPROACH (word-for-word vs thought-for-thought vs
// amplified) is the axis that separates these versions in practice, so it
// gets a labeled tag; name/year/language orient; one plain-language
// sentence says who each suits. Selection persists (AsyncStorage) and the
// Plan tab + reader both read it, so the choice is app-wide, not
// per-screen. The list is a plain map, not a FlatList — three entries
// don't need virtualization, and the layout scales to a dozen before
// that changes.
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import {
  BIBLE_VERSIONS,
  TranslationCode,
  getSavedTranslation,
  saveTranslation,
} from '../services/bibleVersions';
import { prefetchReferences } from '../services/bibleApi';
import { getTodayReading } from '../utils/biblePlan.utils';

export default function BibleVersionsScreen() {
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
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
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
                  <Text style={styles.meta}>{v.language} · {v.year}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
                )}
              </View>

              <View style={styles.approachTag}>
                <Text style={styles.approachText}>{v.approach}</Text>
              </View>

              <Text style={styles.description}>{v.description}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  title: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.navy,
  },
  subtitle: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
    marginTop: theme.space.hairline,
  },
  scrollContent: {
    padding: theme.layout.screenPadding,
    gap: theme.spacing.md,
    paddingBottom: theme.layout.scrollClearance.stack,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  // Selection carries a border change AND the checkmark — never color
  // alone, so the state survives color-vision differences.
  cardSelected: {
    borderColor: theme.colors.navy,
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
    backgroundColor: theme.colors.navy,
    alignItems: 'center',
  },
  abbrText: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: theme.space.hairline,
  },
  approachTag: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.space.micro,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
  },
  approachText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.slate,
  },
  description: {
    marginTop: theme.spacing.md,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    lineHeight: 19,
    color: theme.colors.graySecondary,
  },
});
