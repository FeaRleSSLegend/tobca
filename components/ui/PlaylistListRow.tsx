import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { SmartImage } from './SmartImage';
import { PressableScale } from './motion';

interface PlaylistListRowProps {
  title: string;
  count: number;
  thumbnail?: string;
  onPress: () => void;
}

// Spotify/Apple-Music-style playlist row, replacing the circle grid. Round
// thumbnails read as PEOPLE or stations; a playlist is a collection of
// items, and every mature audio/library app renders those as square-art
// rows (Spotify's "Your Library", Apple Music playlists). Square art also
// simply shows the church's playlist cover art properly instead of cropping
// it into a circle. The row form gives the title room and states the track
// count plainly, the two facts that actually help someone pick a playlist.
export const PlaylistListRow = ({ title, count, thumbnail, onPress }: PlaylistListRowProps) => {
  return (
    <PressableScale
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} playlist, ${count} video${count === 1 ? '' : 's'}`}
    >
      <View style={styles.artwork}>
        <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.meta}>Playlist · {count} video{count === 1 ? '' : 's'}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  artwork: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.grayBorder,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
    lineHeight: 20,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
});
