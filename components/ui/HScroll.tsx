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
      // NESTED-HORIZONTAL HARDENING. Every shelf in this app is a horizontal
      // scroller living inside the Library's horizontal mode PAGER, which is
      // the classic arbitration conflict: two scrollers competing for the same
      // axis, where the parent can swallow the child's pan and the shelf reads
      // as frozen.
      //
      //   directionalLockEnabled  iOS. Locks a gesture to whichever axis it
      //     started on, so a shelf drag that wanders a few points vertically
      //     is not handed up to the vertical list instead.
      //   nestedScrollEnabled     Android. Lets this view keep a gesture it
      //     has claimed rather than yielding it to an ancestor scroller.
      //
      // Neither changes behaviour where things already work; both remove a
      // failure mode that only shows up on device. The audio shelves' actual
      // freeze had a different cause (see the removeClippedSubviews note in
      // components/library/AudioLibrary.tsx) — this is the other half of the
      // diagnosis, fixed here because it would apply to every shelf equally.
      directionalLockEnabled
      nestedScrollEnabled
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