// components/ui/AudioListRow.tsx
// The compact row for browsing audio. Replaces AudioRow, which was a CARD —
// white surface, hairline border, 12pt padding, a 60pt tile and a 36pt filled
// play button, ~92pt tall.
//
// WHY THAT WAS WRONG HERE
// A card is a browsing object: it earns its weight when the artwork is the
// thing you are choosing by. There are 254 standalone recordings and none of
// them have artwork worth choosing by, so 254 cards was 254 identical frames
// with the only real information — the title — set at card scale inside them.
// You could fit four on a screen. This list is for SCANNING titles, so it is
// built like a list of titles: no surface, no border, a hairline divider, a
// small supporting thumbnail, and roughly twice as many rows per screen.
//
// WHAT A ROW SAYS, AND WHAT IT REFUSES TO SAY
//   series      an eyebrow above the title, ONLY when the title-grouping
//               actually detected one. Standalone recordings show nothing —
//               there is no series id in the manifest to fall back on.
//   title       the row's subject, one line, ellipsised.
//   speaker     from Telegram's performer tag, normalised for display and
//               omitted entirely when the tag names nobody (about 1 in 5).
//   date        real, from the manifest; omitted for the ~5% that lack one.
//   duration    a LIVE reading from the player, so it exists only for the item
//               currently loaded. Every other row shows the file size instead,
//               which is the only concrete thing known about it. Neither is
//               ever faked into the other's slot.
//   branch      never. The audio manifest has no branch field and no way to
//               derive one, so the row omits it rather than showing a blank or
//               a guess — the same reason the Library's branch pills are
//               hidden in Audio mode.

import { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale } from './motion';
import { AudioArt } from './AudioArt';
import { PlayingBars } from './PlayingBars';
import { artSeed } from '../../utils/audioArtwork';

export const AUDIO_ROW_ART = 46;

interface AudioListRowProps {
  title: string;
  /** The derived group title, when the item belongs to a detected series. */
  series?: string | null;
  /** Already normalised — pass normalizeSpeaker()'s output, not the raw tag. */
  speaker?: string | null;
  /** Formatted date, or null when the manifest has none for this item. */
  date?: string | null;
  /** Live runtime for the active item ("34:12"); undefined for every other. */
  duration?: string | null;
  /** "12.4 MB" — the fallback shown in the duration slot. */
  sizeLabel?: string | null;
  /** This row is the item loaded in the player (playing OR paused). */
  isActive?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
  /** A saved-for-offline marker, so the list can be read on a plane. */
  isSaved?: boolean;
  onPress?: () => void;
}

const AudioListRowBase = ({
  title,
  series,
  speaker,
  date,
  duration,
  sizeLabel,
  isActive = false,
  isPlaying = false,
  isLoading = false,
  isSaved = false,
  onPress,
}: AudioListRowProps) => {
  // The meta line only renders what is true. Joined with '·' rather than laid
  // out as slots, so a missing speaker closes up instead of leaving a gap that
  // reads as data failing to load.
  const meta = [speaker, date].filter(Boolean).join(' · ');
  const trailing = duration ?? sizeLabel ?? null;

  return (
    <PressableScale
      style={styles.row}
      // Barely any dip: at this row height a 0.97 scale is a visible lurch,
      // and rows this dense are tapped fast and often.
      activeScale={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={[
        isPlaying ? `Pause ${title}` : `Play ${title}`,
        series ? `from ${series}` : null,
        speaker,
        date,
        trailing,
        isSaved ? 'saved offline' : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <AudioArt
        seed={artSeed(title, series)}
        width={AUDIO_ROW_ART}
        height={AUDIO_ROW_ART}
        radius={theme.radius.sm}
      />

      <View style={styles.body}>
        {series ? (
          <Text style={styles.eyebrow} numberOfLines={1}>
            {series}
          </Text>
        ) : null}
        <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.pink} />
        ) : isActive ? (
          // The active row swaps its size/duration for the moving marker. Both
          // in the same slot would make this the one row wider than the rest,
          // which is exactly the wobble a scannable list cannot have.
          <PlayingBars animating={isPlaying} />
        ) : (
          <Ionicons name="play" size={13} color={theme.colors.grayIcon} />
        )}
        {trailing ? (
          <Text style={[styles.trailingLabel, isActive && styles.trailingActive]}>{trailing}</Text>
        ) : null}
        {isSaved ? (
          <Ionicons name="arrow-down-circle" size={11} color={theme.colors.success} />
        ) : null}
      </View>
    </PressableScale>
  );
};

/**
 * MEMOISED, and this is the one that matters most: the browse list renders
 * these by the dozen and each draws generated SVG artwork. Every prop is a
 * primitive except onPress, which callers pass as a fresh arrow — so the
 * shallow compare only pays off where the parent memoises that too. It still
 * removes the whole-list re-render whenever an unrelated ancestor updates.
 */
export const AudioListRow = memo(AudioListRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight + 4,
    // Vertical padding only. NO card surface and NO border: the divider
    // between rows is the list's structure, and a border per row at this
    // density draws 254 boxes down the page.
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: theme.colors.pink,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: 19,
    color: theme.colors.navy,
  },
  titleActive: {
    color: theme.colors.pink,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: theme.space.micro,
    // A fixed width so the titles beside them all end at the same place — a
    // ragged right edge is what makes a long list feel unruly.
    minWidth: 54,
  },
  trailingLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: 11,
    color: theme.colors.grayIcon,
  },
  trailingActive: {
    color: theme.colors.pink,
  },
});
