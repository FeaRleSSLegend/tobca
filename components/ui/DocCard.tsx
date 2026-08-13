import { Text, View, StyleSheet } from 'react-native';
import { PressableScale } from './motion';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface DocCardProps {
  name: string;
  subtitle: string; // e.g. "8 pages"
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

// Same card, two different meanings today: a downloadable PDF guide
// ("Prayer Resources") and a past month's focus ("Archive"). Both used the
// same document icon, so the two rows in Prayer looked identical at a
// glance even though tapping one opens a PDF and the other opens an old
// focus. `icon` defaults to the original document glyph so existing call
// sites don't need to change, but lets Archive pass something that reads
// as "past" instead of "file."
export const DocCard = ({ name, subtitle, icon = 'document-text-outline', onPress }: DocCardProps) => {
  return (
    <PressableScale style={styles.wrapper} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={theme.colors.slate} />
      </View>
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 112,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.navy,
    textAlign: 'center',
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: theme.space.hairline,
  },
});
