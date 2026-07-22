import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ReadingViewportProps {
  reference: string; // 'Genesis 12:1–3'
  translation: 'kjv' | 'niv';
  verses: { number: number; text: string }[];
  onContinue?: () => void;
}

export const ReadingViewport = ({ 
  reference, 
  translation, 
  verses,
  onContinue 
}: ReadingViewportProps) => {
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
          <Ionicons name="chevron-forward" size={16} color={theme.colors.slate} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayBorder,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  reference: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '700',
    color: theme.colors.navy,
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sizeBtn: {
    backgroundColor: theme.colors.bg,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.slate,
  },
  scriptureScroll: {
    maxHeight: 350,
  },
  verse: {
    fontFamily: theme.fontFamily.body,
    lineHeight: 26,
    color: '#2C3E50',
    marginBottom: theme.spacing.md,
  },
  verseNumber: {
    fontWeight: '700',
    fontSize: 11,
    color: theme.colors.pink,
    marginRight: theme.spacing.xs,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grayBorder,
  },
  continueText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.slate,
  },
});