import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { SmartImage } from './SmartImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';

interface GroupCardProps {
  title: string;
  subtitle: string;
  thumbnail?: string;
  onPress?: () => void;
}

/**
 * 2-column tile for a content GROUP (a whole series or recurring service)
 * on the dedicated collection screens. Not PosterCard: that's the fixed
 * 126pt-wide unit for horizontal preview rows on the Library hub, and
 * these tiles need to flex to half the screen width inside grid rows —
 * per the tile-vs-list guidance, the grid form works here because the
 * choice being made is visual ("which series"), so the thumbnail earns
 * the bigger footprint. Uses the 'albums' icon (a stack), not 'play',
 * because tapping this opens a collection of messages, not playback of
 * one — same icon-per-meaning reasoning GridCard applies to its types.
 */
export const GroupCard = React.memo(({ title, subtitle, thumbnail, onPress }: GroupCardProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
  <PressableScale
    // containerStyle, not style: `card` is pure layout (flex: 1 for the
    // 2-col grid) and has to land on the element the grid measures.
    containerStyle={styles.card}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${title}, ${subtitle}`}
  >
    <View style={styles.thumb}>
      {thumbnail ? (
        <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
      ) : (
        <LinearGradient
          colors={['rgba(248,0,104,0.35)', 'rgba(200,32,248,0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.iconBadge}>
        <Ionicons name="albums" size={14} color={c.white} />
      </View>
    </View>
    <Text style={styles.title} numberOfLines={2}>
      {title}
    </Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </PressableScale>
);
});

const useStyles = makeThemedStyles((c) => ({
  card: {
    flex: 1,
  },
  thumb: {
    // 16:9-ish at half screen width. Height instead of aspectRatio keeps
    // both tiles in a row identical even if one image fails to load.
    height: 96,
    borderRadius: theme.radius.sm,
    backgroundColor: c.slate,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.55)', // same scrim recipe as GridCard's badge
    borderRadius: theme.radius.full,
    padding: 4,
  },
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.body,
    color: c.navy,
    lineHeight: 17,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    marginTop: theme.space.hairline,
  },
}));
