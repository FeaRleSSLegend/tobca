import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Verse {
  number: number;
  text: string;
}

interface ScriptureReaderProps {
  reference: string;
  translation: 'kjv' | 'niv';
  verses?: Verse[];
  onTranslationChange?: (translation: 'kjv' | 'niv') => void;
  onReadMore?: () => void;
  style?: any;
}

export const ScriptureReader = ({ 
  reference, 
  translation, 
  verses = [],
  onTranslationChange,
  onReadMore,
  style
}: ScriptureReaderProps) => {
  const [fontSize, setFontSize] = useState(14);
  
  if (verses.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>Scripture not found</Text>
        <Text style={styles.emptySubtext}>{reference}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.reference}>{reference}</Text>
        <View style={styles.controls}>
          <Pressable 
            onPress={() => setFontSize(prev => Math.max(12, prev - 2))}
            style={styles.controlBtn}
          >
            <Text style={styles.controlText}>A-</Text>
          </Pressable>
          <Pressable 
            onPress={() => setFontSize(prev => Math.min(20, prev + 2))}
            style={styles.controlBtn}
          >
            <Text style={styles.controlText}>A+</Text>
          </Pressable>
          {onTranslationChange && (
            <Pressable 
              onPress={() => onTranslationChange(translation === 'kjv' ? 'niv' : 'kjv')}
              style={[styles.controlBtn, styles.translationBtn]}
            >
              <Text style={styles.controlText}>
                {translation.toUpperCase()}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      
      <ScrollView style={styles.scriptureContainer}>
        {verses.map((verse, index) => (
          <Text key={index} style={[styles.verse, { fontSize }]}>
            <Text style={styles.verseNumber}>{verse.number}</Text>
            {verse.text}
          </Text>
        ))}
      </ScrollView>
      
      {onReadMore && (
        <Pressable onPress={onReadMore} style={styles.readMoreBtn}>
          <Text style={styles.readMoreText}>Read Full Chapter</Text>
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
    marginTop: theme.spacing.sm,
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
  controlBtn: {
    backgroundColor: theme.colors.bg,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationBtn: {
    width: 'auto',
    paddingHorizontal: theme.spacing.sm,
  },
  controlText: {
    fontSize: theme.fontSize.caption,
    fontWeight: '700',
    color: theme.colors.slate,
  },
  scriptureContainer: {
    maxHeight: 400,
  },
  verse: {
    fontFamily: theme.fontFamily.body,
    lineHeight: 26,
    color: '#2C3E50',
    marginBottom: theme.spacing.sm,
  },
  verseNumber: {
    fontWeight: '700',
    fontSize: 11,
    color: theme.colors.pink,
    marginRight: theme.spacing.xs,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grayBorder,
  },
  readMoreText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: theme.colors.slate,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
  },
  emptyText: {
    fontFamily: theme.fontFamily.body,
    color: theme.colors.graySecondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.grayIcon,
  },
});