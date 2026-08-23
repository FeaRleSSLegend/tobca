// components/ui/AudioRow.tsx
// A row for an audio-only message.
//
// THE ARTWORK PROBLEM THIS SOLVES
// Audio items arriving from the Telegram pipeline have no thumbnail — there
// is no frame to grab, because there is no video. Reusing MessageCard or
// GridCard would therefore render their 16:9 image slot as an empty grey
// rectangle, which does not read as "this is audio". It reads as a picture
// that failed to load, and a person's next move is to wonder whether the app
// is broken.
//
// So the slot that would hold artwork holds a WAVEFORM instead: a square tile
// with a bar figure that could only ever mean sound. Square rather than 16:9
// on purpose — 16:9 is the shape of video, and keeping that ratio would
// re-introduce the "missing thumbnail" reading through proportion alone.
//
// Everything else is deliberately the existing list-row recipe (white surface,
// hairline border, 12pt gap, title over meta, PressableScale) so an audio row
// sits in the same family as ServiceRow and the Latest Messages rows rather
// than being a bespoke card.

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PressableScale } from './motion';

interface AudioRowProps {
  title: string;
  /**
   * OPTIONAL, because the R2 manifest has no speaker field. Where a source
   * genuinely knows who preached (the future Telegram pipeline, tagged
   * uploads), pass it; where it does not, the meta line is simply omitted
   * rather than filled with "Unknown" — a row that states nothing is honest,
   * a row that states a guess is not.
   */
  speaker?: string;
  /** Formatted runtime. Also optional: an mp3's duration is not known until
   *  it has been loaded, and the manifest does not carry it. */
  duration?: string;
  /** e.g. "12.4 MB". Shown in the duration slot when no duration is known, so
   *  the row still says something concrete about the file. */
  sizeLabel?: string;
  /** e.g. "Wed Bible Study · 12 Aug" — the same subtitle register as video rows. */
  context?: string;
  /** Swaps the play glyph for pause. The row is the play/pause control. */
  isPlaying?: boolean;
  /** Track is loading/buffering — the button shows a spinner instead. */
  isLoading?: boolean;
  onPress?: () => void;
}

// A fixed bar pattern, not random heights. Random would shimmer differently on
// every render and, worse, imply the bars are real amplitude data for THIS
// file — they are not. A repeating figure reads as an icon, which is honest.
const BARS = [0.35, 0.6, 0.9, 0.5, 1, 0.7, 0.45, 0.8, 0.3];

export const AudioWaveformTile = ({ size = 60 }: { size?: number }) => (
  <View style={[styles.tile, { width: size, height: size }]}>
    <View style={styles.bars}>
      {BARS.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: `${Math.round(h * 100)}%`,
              // The tallest bars carry the accent, the rest recede. A flat
              // single-colour waveform reads as a loading placeholder; the
              // variation is what makes it read as a mark.
              backgroundColor: h >= 0.8 ? theme.colors.pink : 'rgba(248,0,104,0.35)',
            },
          ]}
        />
      ))}
    </View>
  </View>
);

export const AudioRow = ({
  title,
  speaker,
  duration,
  sizeLabel,
  context,
  isPlaying = false,
  isLoading = false,
  onPress,
}: AudioRowProps) => {
  // The meta line only renders when there is something true to put on it.
  const meta = context && speaker ? `${context} · ${speaker}` : context ?? speaker ?? null;
  return (
    <PressableScale
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isPlaying }}
      accessibilityLabel={
        [isPlaying ? `Pause ${title}` : `Play ${title}`, 'audio', speaker, duration ?? sizeLabel]
          .filter(Boolean)
          .join(', ')
      }
    >
      <AudioWaveformTile />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
        {duration ? (
          <View style={styles.durationRow}>
            {/* Headphones, not a clock: the glyph is doing double duty as the
                "this is listening, not watching" cue in the one place the eye
                lands after the title. */}
            <Ionicons name="headset-outline" size={12} color={theme.colors.grayIcon} />
            <Text style={styles.duration}>{duration}</Text>
          </View>
        ) : sizeLabel ? (
          // No glyph on the size line, deliberately: the headphones above mean
          // "runtime", and reusing it for megabytes would say the file is 12
          // minutes long when it is 12 megabytes.
          <Text style={[styles.duration, styles.sizeLine]}>{sizeLabel}</Text>
        ) : null}
      </View>

      <View style={styles.playBtn}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={15}
            color={theme.colors.white}
            // Optical centring: a play triangle reads left-of-centre inside a
            // circle, a pause bar pair does not.
            style={isPlaying ? undefined : styles.playGlyph}
          />
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
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
  tile: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.pinkWash,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '58%',
    width: '70%',
  },
  bar: {
    flex: 1,
    borderRadius: theme.radius.full,
    minHeight: 3,
  },
  body: {
    flex: 1,
    gap: theme.space.hairline,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.cardTitle,
    lineHeight: 21,
    color: theme.colors.navy,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.micro,
    marginTop: theme.space.hairline,
  },
  duration: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
  },
  sizeLine: {
    marginTop: theme.space.hairline,
  },
  playGlyph: {
    marginLeft: 2,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
