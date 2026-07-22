import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface CompactReadingProps {
  title: string;
  reference: string;
}

export const CompactReading = ({ title, reference }: CompactReadingProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.reference}>{reference}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: theme.spacing.xs,
  },
  reference: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
    fontWeight: '500',
  },
});