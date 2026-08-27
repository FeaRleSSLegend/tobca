import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { SmartImage } from './SmartImage';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

interface PlaylistCircleProps {
  title: string;
  count: number;
  thumbnail?: string;
  onPress?: () => void;
}

// Was an 88pt CIRCLE. The artwork is a 16:9 YouTube thumbnail, and the church
// bakes the playlist name into that artwork — so a circular crop threw away
// ~44% of the frame horizontally AND cut the top and bottom off, which is how
// covers reading "WHAT IF" and "SPIRIT BREAKTHROUGH" ended up as unreadable
// fragments on the Library shelf. A 16:9 tile is the shape the asset actually
// is, so nothing has to be cropped at all. Matches the Series/Services posters
// directly above it, which makes the shelf read as one system.
// Now taken from the shared shelf metric rather than declared here — this
// tile sits directly below the Series/Services posters and any difference in
// width between them shows up as a ragged left edge down the page.
const TILE_WIDTH = theme.layout.rowCard.width;
const TILE_HEIGHT = theme.layout.rowCard.height;

export const PlaylistCircle = React.memo(({ title, count, thumbnail, onPress }: PlaylistCircleProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
  <PressableScale
    onPress={onPress}
    style={styles.wrap}
    accessibilityRole="button"
    accessibilityLabel={`${title} playlist, ${count} videos`}
  >
    <View style={styles.circle}>
      {thumbnail ? (
        <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
      ) : (
        <Ionicons name="albums" size={28} color={c.white} />
      )}
    </View>
    <Text style={styles.title} numberOfLines={2}>
      {title}
    </Text>
    <Text style={styles.count}>{count} videos</Text>
  </PressableScale>
);
});

const useStyles = makeThemedStyles((c) => ({
  wrap: {
    width: TILE_WIDTH,
  },
  circle: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: theme.radius.sm,
    backgroundColor: c.mediaPlaceholder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  // Left-aligned now the tile is rectangular — centred labels under a wide
  // tile leave ragged gaps on both sides of a two-line title.
  title: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.navy,
    lineHeight: 16,
  },
  count: {
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    marginTop: theme.space.hairline,
  },
}));
