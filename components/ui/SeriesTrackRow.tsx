// components/ui/SeriesTrackRow.tsx
// One numbered part in a series, laid out as a TRACKLIST row.
//
// WHY A TRACKLIST AND NOT THE GRID IT REPLACED
// The series detail screen used to render CardGrid: a 2-column grid of equal
// thumbnails. A grid says "these are alternatives, pick one" — which is right
// for Recently Added and wrong for a series, where the items are ordered parts
// of one thing and the only question is where to start. A numbered vertical
// list answers that in the first glance, the same way an album view does.
//
// DELIBERATELY NOT A NEW VISUAL LANGUAGE. The anatomy here is
// components/ui/AudioListRow's, reused rather than reinvented: the same 46pt
// artwork square, the same "no card surface, no per-row border, a hairline
// between rows is the structure" rule, the same eyebrow/title/meta stack, the
// same trailing slot for a duration. The one addition is the leading INDEX,
// which is the whole point of the row.
//
// THE INDEX IS POSITIONAL, NOT PARSED. It is "the nth item in the order you
// are currently looking at", not a part number read from the title —
// utils/contentGrouping strips installment markers ("Part 2", "Day 3") while
// grouping and never retains them, so no true part number survives to display.
// It therefore renumbers when the sort flips, which is correct for what it
// claims: it is a position in a list, and it says so by changing.

import { View, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { SmartImage } from './SmartImage';
import { PressableScale } from './motion';
import { Ionicons } from '@expo/vector-icons';

/** Matches AUDIO_ROW_ART so a row in either list is the same object. */
export const SERIES_ROW_ART = 46;

interface SeriesTrackRowProps {
  /** 1-based position in the CURRENT ordering. */
  index: number;
  title: string;
  thumbnail?: string;
  duration?: string | null;
  speaker?: string | null;
  date?: string | null;
  onPress: () => void;
}

export const SeriesTrackRow = ({
  index,
  title,
  thumbnail,
  duration,
  speaker,
  date,
  onPress,
}: SeriesTrackRowProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  // Only what is true, joined rather than slotted, so a missing speaker closes
  // up instead of leaving a gap that reads as data failing to load.
  const meta = [speaker, date].filter(Boolean).join(' · ');

  return (
    <PressableScale
      style={styles.row}
      // Barely any dip, matching AudioListRow: at this row height a 0.97 scale
      // is a visible lurch rather than a press.
      activeScale={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Part ${index}, ${title}${duration ? `, ${duration}` : ''}`}
    >
      {/* Tabular figures and a fixed width so 1 and 10 occupy the same column
          and the artwork edge below never steps sideways. */}
      <Text style={styles.index}>{index}</Text>

      <View style={styles.artWrap}>
        <SmartImage
          uri={thumbnail}
          style={styles.art}
          radius={theme.radius.sm}
          showPlaceholder={false}
        />
        <View style={styles.playScrim}>
          <Ionicons name="play" size={13} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      {duration ? <Text style={styles.duration}>{duration}</Text> : null}
    </PressableScale>
  );
};

const useStyles = makeThemedStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight + 4,
    // Vertical padding only. No card surface and no border: the hairline
    // between rows is the list's structure. See AudioListRow.
    paddingVertical: theme.spacing.md,
  },
  index: {
    width: 22,
    textAlign: 'center',
    fontFamily: theme.fontFamily.displayMedium,
    fontSize: theme.fontSize.bodyLg,
    fontVariant: ['tabular-nums'],
    color: c.textMuted,
  },
  artWrap: {
    width: SERIES_ROW_ART,
    height: SERIES_ROW_ART,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: c.mediaPlaceholder,
  },
  art: {
    width: SERIES_ROW_ART,
    height: SERIES_ROW_ART,
  },
  // A small scrim disc over the corner of the artwork, the same treatment the
  // duration badges use: it marks the row as playable without spending a
  // whole column on a play button.
  playScrim: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // Literal: this sits on ARTWORK, which does not follow the theme.
    backgroundColor: 'rgba(10,22,33,0.66)',
  },
  body: {
    flex: 1,
    gap: theme.space.hairline,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: 19,
    color: c.textPrimary,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textSecondary,
  },
  duration: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    fontVariant: ['tabular-nums'],
    color: c.textMuted,
  },
}));
