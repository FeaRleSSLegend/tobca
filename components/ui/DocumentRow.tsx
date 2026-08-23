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
// The trailing glyph is "open outside", not a chevron: tapping this leaves the
// app for the system PDF viewer, and a chevron would promise an in-app screen
// that does not exist.

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale } from './motion';

interface DocumentRowProps {
  title: string;
  /** e.g. "1.3 MB". Omitted when the manifest has no size. */
  sizeLabel?: string;
  onPress: () => void;
}

export const DocumentRow = ({ title, sizeLabel, onPress }: DocumentRowProps) => (
  <PressableScale
    style={styles.row}
    onPress={onPress}
    accessibilityRole="link"
    accessibilityLabel={`${title}, PDF${sizeLabel ? `, ${sizeLabel}` : ''}, opens outside the app`}
  >
    <View style={styles.icon}>
      <Ionicons name="document-text-outline" size={18} color={theme.colors.slate} />
    </View>

    <View style={styles.body}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>{sizeLabel ? `PDF · ${sizeLabel}` : 'PDF'}</Text>
    </View>

    <Ionicons name="open-outline" size={18} color={theme.colors.grayIcon} />
  </PressableScale>
);

const styles = StyleSheet.create({
  // The same list-row recipe as AudioRow (white surface, hairline border,
  // 16pt gap) so a document row and an audio row read as members of one
  // family rather than as two people's components.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.related,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.grayBorder,
    borderWidth: theme.layout.cardBorderWidth,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.grayBorder,
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
    color: theme.colors.navy,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
});
