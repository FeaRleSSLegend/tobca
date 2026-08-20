// components/library/AudioLibrary.tsx
// The Audio half of the Library.
//
// WHY THIS IS EMPTY TODAY, AND WHY THAT IS THE POINT
// No source currently produces audio-only messages. The Telegram ingestion
// pipeline that will produce them is a separate, unbuilt piece. So this page
// is built against the real typed shape — Message[] from getAudioMessages() —
// and renders the empty state when that array is empty, which today is
// always. No mock rows, because mock rows would have to be deleted later and,
// worse, would hide the empty state itself from review right up until the day
// it becomes the thing everyone sees.
//
// When the pipeline lands, messages with `source: 'telegram'` and a single
// `kind: 'audio'` media variant start arriving through the same useMessages()
// path the video shelves already use, getAudioMessages() picks them up, and
// this page fills in. Nothing here needs editing.

import { View, ScrollView, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { theme } from '../../constants/theme';
import { EmptyState } from '../ui/EmptyState';
import { AudioRow } from '../ui/AudioRow';
import { SectionLabel } from '../ui/SectionLabel';
import { FadeInUp, staggerDelay } from '../ui/motion';
import { formatDuration, primaryVariant, type Message } from '../../data/contentModel';
import { getBranch } from '../../data/branches';
import type { BranchFilter as BranchFilterValue } from '../../hooks/useMessages';

interface AudioLibraryProps {
  items: Message[];
  /** Only used to name the branch in the empty state copy. */
  branch: BranchFilterValue;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  bottomClearance: number;
  onPlay: (m: Message) => void;
}

export const AudioLibrary = ({
  items,
  branch,
  onScroll,
  bottomClearance,
  onPlay,
}: AudioLibraryProps) => {
  const branchName = branch === 'all' ? null : getBranch(branch)?.shortName ?? null;

  // EMPTY AND FILLED ARE TWO DIFFERENT LAYOUTS, not one layout with a flag.
  //
  // This is the pattern the rest of the app already uses (see-all.tsx,
  // playlist/[id].tsx): EmptyState is rendered as a direct flex child of the
  // screen body, NOT inside a scroll container. That is what lets its own
  // `flex: 1` resolve against the real available height, and its
  // justifyContent:'center' then does the vertical centring for free.
  //
  // The first version here put it inside the ScrollView's contentContainer
  // instead. It still centred — but against a box that also carried
  // paddingTop (8) and the bottom scroll clearance (32), so the content sat
  // ~10dp above true centre, measured on device. Those paddings exist to
  // separate a LIST from the chrome above and the tab bar below; an empty
  // state has no list to separate and nothing to clear, so it should not
  // inherit either. Dropping the scroll container removes the skew at its
  // source rather than cancelling it with a compensating offset.
  if (items.length === 0) {
    return (
      <View style={styles.emptyPage}>
        <EmptyState
          icon="headset-outline"
          title={branchName ? `No audio from ${branchName} yet` : 'No audio yet'}
          subtitle="Audio-only recordings — midweek teachings and messages shared straight to the church — will appear here once they start being published."
        />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={100}
      contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
    >
      <SectionLabel label="Recent Audio" />
      {items.map((m, i) => {
        const variant = primaryVariant(m);
        return (
          <FadeInUp key={m.id} delay={staggerDelay(i)}>
            <View style={styles.rowSlot}>
              <AudioRow
                title={m.title}
                speaker={m.speaker}
                duration={variant ? formatDuration(variant.durationSeconds) : ''}
                context={m.series}
                onPress={() => onPlay(m)}
              />
            </View>
          </FadeInUp>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    // No horizontal padding: the pager's parent already carries the screen
    // gutter, and adding it again here would inset this page relative to the
    // video page beside it — visible as a jump on every swipe.
    paddingTop: theme.space.tight,
  },
  // Fills the page so EmptyState's own flex:1 has a real height to resolve
  // against. No padding: the centring must be governed by flex alone, so it
  // stays correct whatever height the search bar, tab control and filter
  // pills happen to take on a given device.
  emptyPage: {
    flex: 1,
  },
  rowSlot: {
    marginBottom: theme.space.tight,
  },
});
