// components/ui/DocumentRow.tsx
// One downloadable document (a PDF prayer guide, a fasting timetable).
//
// A ROW, NOT A TILE, AND NO PAGE PREVIEW. DocCard already exists for the
// horizontal shelves on Prayer, but these come from the documents manifest and
// there can be dozens of them, with long titles ("21 Days Prayer Guide With
// Timetable") that a 112pt tile truncates into uselessness. A full-width row
// gives the title the space to be read, which is the only thing distinguishing
// one PDF from the next here.
//
// The icon is a GENERIC document glyph, deliberately — a rendered first-page
// thumbnail was considered and rejected earlier: it needs a PDF renderer, it
// makes every row look like a wall of white paper, and it says nothing a
// filename does not.
//
// The trailing glyph is a CHEVRON, and that is a factual claim about where the
// tap goes. It used to be "open outside" because tapping handed the file to the
// system PDF viewer; the document now opens on a screen inside the app
// (app/document), so the outward-pointing glyph would be promising the wrong
// thing. The in-app screen keeps an "open externally" escape hatch of its own —
// but that is a fallback there, not what this row does.

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { PressableScale } from './motion';

interface DocumentRowProps {
  title: string;
  /** e.g. "1.3 MB". Omitted when the manifest has no size. */
  sizeLabel?: string;
  onPress: () => void;
}

export const DocumentRow = ({ title, sizeLabel, onPress }: DocumentRowProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
  <PressableScale
    style={styles.row}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${title}, PDF${sizeLabel ? `, ${sizeLabel}` : ''}`}
  >
    <View style={styles.icon}>
      <Ionicons name="document-text-outline" size={18} color={c.slate} />
    </View>

    <View style={styles.body}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>{sizeLabel ? `PDF · ${sizeLabel}` : 'PDF'}</Text>
    </View>

    <Ionicons name="chevron-forward" size={18} color={c.grayIcon} />
  </PressableScale>
);
}

const useStyles = makeThemedStyles((c) => ({
  // The same list-row recipe the document/series rows share (white surface,
  // hairline border,
  // 16pt gap) so a document row and an audio row read as members of one
  // family rather than as two people's components.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.related,
    backgroundColor: c.surface,
    borderColor: c.grayBorder,
    borderWidth: theme.layout.cardBorderWidth,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: c.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: theme.space.hairline,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: 19,
    color: c.navy,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
}));
