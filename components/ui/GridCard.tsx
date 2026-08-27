import React from 'react';
import { displayTitle } from '../../utils/contentGrouping';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { SmartImage } from './SmartImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { MessageType } from '../../data/content';

interface GridCardProps {
  title: string;
  duration: string;
  speaker?: string;
  type?: MessageType;
  thumbnail?: string;
  onPress?: () => void;
}

// Every card in this grid used to be the same navy rectangle with the same
// play triangle — title text was the only way to tell one from another,
// which is exactly the "user has to read everything" problem raised on
// this screen, and the skill's own color-and-contrast rule ("don't rely
// solely on color to convey information") points at the same fix: the
// icon needs to change, not just a tint. Until there's real thumbnail
// artwork, the content type is the one real signal available, so each
// type gets its own icon. Kept off pink/purple on purpose — that budget
// belongs to the one hero card above, not four small grid tiles.
const typeIcon: Record<MessageType, keyof typeof Ionicons.glyphMap> = {
  sermon: 'mic',
  series: 'albums',
  audio: 'headset',
  video: 'videocam',
  service: 'calendar',
};

export const GridCard = React.memo(({
  title,
  duration,
  speaker,
  type = 'sermon',
  thumbnail,
  onPress,
}: GridCardProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <PressableScale
      onPress={onPress}
      // The grid measures the Pressable, so its column share has to live
      // here; `card` keeps the surface (background, border, radius) because
      // that is the box being scaled on press.
      containerStyle={styles.cardSlot}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle(title)}${speaker ? `, ${speaker}` : ''}, ${duration}`}
    >
      <View style={styles.thumbnail}>
        {thumbnail ? (
          <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient
            colors={[c.navy, c.slateLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* Icon still shows over a real thumbnail — same play/type signal,
            now as an overlay badge instead of the only thing in the tile. */}
        <View style={thumbnail ? styles.iconBadge : undefined}>
          <Ionicons name={typeIcon[type]} size={thumbnail ? 14 : 20} color={c.white} style={{ zIndex: 1 }} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {displayTitle(title)}
        </Text>
        {speaker && (
          <Text style={styles.speaker} numberOfLines={1}>
            {speaker}
          </Text>
        )}
        <Text style={styles.duration}>{duration}</Text>
      </View>
    </PressableScale>
  );
});

const useStyles = makeThemedStyles((c) => ({
  cardSlot: {
    flex: 1,
  },
  card: {
    width: '100%',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.grayBorder,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 72,
    backgroundColor: c.mediaPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.55)', // translucent dark scrim, same treatment as duration badges elsewhere
    borderRadius: theme.radius.full,
    padding: 4,
  },
  body: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.navy,
    lineHeight: 16,
    marginBottom: 4,
  },
  speaker: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: c.graySecondary,
    marginBottom: theme.space.hairline,
  },
  duration: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.body,
    color: c.grayIcon,
  },
}));
