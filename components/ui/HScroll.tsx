import { ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface HScrollProps {
  children: React.ReactNode;
}

export const HScroll = ({ children }: HScrollProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});