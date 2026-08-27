import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { TranslationCode } from '../../services/bibleVersions';

interface ReadingViewportProps {
  reference: string; // 'Genesis 12:1–3'
  translation: TranslationCode;
  verses: { number: number; text: string }[];
  onContinue?: () => void;
}

export const ReadingViewport = ({ 
  reference, 
  translation, 
  verses,
  onContinue 
}: ReadingViewportProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  const [fontSize, setFontSize] = useState(14);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.reference}>{reference} ({translation.toUpperCase()})</Text>
        <View style={styles.controls}>
          <Pressable 
            onPress={() => setFontSize(prev => Math.max(12, prev - 2))}
            style={styles.sizeBtn}
          >
            <Text style={styles.sizeBtnText}>A-</Text>
          </Pressable>
          <Pressable 
            onPress={() => setFontSize(prev => Math.min(20, prev + 2))}
            style={styles.sizeBtn}
          >
            <Text style={styles.sizeBtnText}>A+</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scriptureScroll}>
        {verses.map((verse, index) => (
          <Text key={index} style={[styles.verse, { fontSize }]}>
            <Text style={styles.verseNumber}>{verse.number}</Text>
            {verse.text}
          </Text>
        ))}
      </ScrollView>

      {onContinue && (
        <Pressable onPress={onContinue} style={styles.continueBtn}>
          <Text style={styles.continueText}>Continue reading {reference.split('–')[0]}</Text>
          <Ionicons name="chevron-forward" size={16} color={c.slate} />
        </Pressable>
      )}
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  container: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: c.grayBorder,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  reference: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '700',
    color: c.navy,
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sizeBtn: {
    backgroundColor: c.bg,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: c.slate,
    // Was fontWeight with no fontFamily -> fell back to the system font.
    fontFamily: theme.fontFamily.bodyBold,
},
  scriptureScroll: {
    maxHeight: 350,
  },
  verse: {
    fontFamily: theme.fontFamily.body,
    lineHeight: 26,
    // Was #2C3E50, an off-palette slate that existed nowhere else in the
    // app and sat a shade cooler than everything around it.
    color: c.navy,
    marginBottom: theme.spacing.md,
  },
  verseNumber: {
    fontWeight: '700',
    fontSize: 11,
    color: c.pink,
    marginRight: theme.spacing.xs,
    // Was fontWeight with no fontFamily -> fell back to the system font.
    fontFamily: theme.fontFamily.bodyBold,
},
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.grayBorder,
  },
  continueText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: c.slate,
  },
}));