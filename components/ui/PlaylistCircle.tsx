import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { SmartImage } from './SmartImage';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface PlaylistCircleProps {
  title: string;
  count: number;
  thumbnail?: string;
  onPress?: () => void;
}

const CIRCLE_SIZE = 88;

export const PlaylistCircle = React.memo(({ title, count, thumbnail, onPress }: PlaylistCircleProps) => (
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
        <Ionicons name="albums" size={28} color={theme.colors.white} />
      )}
    </View>
    <Text style={styles.title} numberOfLines={2}>
      {title}
    </Text>
    <Text style={styles.count}>{count} videos</Text>
  </PressableScale>
));

const styles = StyleSheet.create({
  wrap: {
    width: CIRCLE_SIZE + theme.spacing.md,
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: theme.colors.navy,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.caption,
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.navy,
    textAlign: 'center',
  },
  count: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
});
