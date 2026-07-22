import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface DocCardProps {
  name: string;
  subtitle: string; // e.g. "8 pages"
  onPress?: () => void;
}

export const DocCard = ({ name, subtitle, onPress }: DocCardProps) => {
  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name="document-text-outline" size={18} color={theme.colors.slate} />
      </View>
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
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
    marginTop: 2,
  },
});