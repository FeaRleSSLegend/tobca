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
    // The shelf gap is a shelf metric, not a generic one — it belongs with
    // the card width it is tuned against (see layout.rowCard), because the
    // two together are what produce the partial-card peek.
    gap: theme.layout.rowCard.gap,
    // NO vertical padding. This used to be 8pt top and bottom, and it was
    // silently stacking with the SectionLabel margins on both sides of every
    // shelf in the app: a label's own 12pt bottom margin plus 8 here made the
    // label→shelf gap 20 (meant to be 12), and the shelf's 8 plus the NEXT
    // label's 24pt top margin made the section gap 32 (meant to be 24). Four
    // shelves down Library that error accumulated into a page that read as
    // loosely spaced without any single value looking wrong. The label owns
    // the gap above and below a shelf; the shelf contributes nothing.
    paddingVertical: 0,
  },
});