import { Text, View, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { SmartImage } from './SmartImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface PosterCardProps {
  title: string;
  subtitle: string;
  thumbnail?: string;
  onPress?: () => void;
}

export const PosterCard = ({ title, subtitle, thumbnail, onPress }: PosterCardProps) => {
  return (
    <PressableScale style={styles.wrapper} onPress={onPress}>
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
        <Ionicons name="play" size={16} color={theme.colors.white} style={styles.icon} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: theme.layout.rowCard.width,
  },
  thumb: {
    // Shared shelf metric, and a DERIVED 16:9 height. Was 126x82, which is
    // 16:10.4 — so every thumbnail was being cropped slightly top and bottom
    // for no reason, since the source images are 16:9.
    width: theme.layout.rowCard.width,
    height: theme.layout.rowCard.height,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.slate,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    zIndex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.navy,
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: theme.space.hairline,
  },
});