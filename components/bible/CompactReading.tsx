import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { makeThemedStyles } from '../../hooks/useTheme';

interface CompactReadingProps {
  title: string;
  reference: string;
}

export const CompactReading = ({ title, reference }: CompactReadingProps) => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.reference}>{reference}</Text>
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  container: {
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: theme.spacing.xs,
  },
  reference: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.navy,
    fontWeight: '500',
  },
}));