// components/library/AudioLibrary.tsx
// The Audio MODE of the Library — not a filtered view of the video library.
//
// WHAT "MODE" MEANS HERE
// Switching the header control to AUDIO has to change what the Library IS,
// not just what it lists. So this page carries its own shelves, its own hero
// and its own vocabulary:
//
//   Latest      the newest recording, given the hero slot that CurrentMessage
//               occupies on the video side — the one thing to press play on
//   Teachings   audio that belongs to a teaching/series, grouped under it, so
//               a multi-part midweek study reads as one body of work
//   Recent      the standalone recordings, newest first
//
// Every section is derived from the audio that actually exists. None of them
// render when their bucket is empty, which is why there is no "Playlists" row
// here: playlists come from the YouTube channel (usePlaylists) and are video
// collections. Putting them on this page would be exactly the "changed one
// filter" reading the redesign is trying to kill.
//
// SECTIONS DO NOT NAVIGATE, ON PURPOSE
// The video shelves are teasers with a "›" into a collection screen. Audio has
// no collection screen (see-all's collections render 16:9 grids and count
// themselves in "videos"), so these headers carry no chevron. A chevron into a
// screen that would show audio as broken video thumbnails is worse than no
// chevron — and the whole audio set is short enough to live on one page.
//
// WHY THIS RENDERS EMPTY TODAY, AND WHY THAT IS THE POINT
// No source currently produces audio-only messages. The Telegram ingestion
// pipeline that will produce them is a separate, unbuilt piece. So this page
// is built against the real typed shape — Message[] from getAudioMessages() —
// and renders the empty state when that array is empty, which today is always.
// No mock rows: they would have to be deleted later and, worse, would hide the
// empty state from review right up until the day it becomes what everyone
// sees. When the pipeline lands, messages with `source: 'telegram'` and a
// single `kind: 'audio'` variant arrive through the same useMessages() path
// the video shelves use, getAudioMessages() picks them up, and these shelves
// fill in. Nothing here needs editing.

import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { EmptyState } from '../ui/EmptyState';
import { AudioRow, AudioWaveformTile } from '../ui/AudioRow';
import { SectionLabel } from '../ui/SectionLabel';
import { FadeInUp, staggerDelay, PressableScale } from '../ui/motion';
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

/** One teaching/series and the audio recorded under it, newest first. */
interface AudioGroup {
  key: string;
  label: string;
  items: Message[];
}

const durationLabel = (m: Message) => {
  const variant = primaryVariant(m);
  return variant ? formatDuration(variant.durationSeconds) : '';
};

// ---------------------------------------------------------------------------
// The hero. Same role as CurrentMessage on the video page — the page's one
// large press-to-play surface — but built from the audio vocabulary rather
// than a 16:9 still: a large waveform tile, the title, and a play affordance.
// Deliberately not a gradient card: the video page already spends the
// gradient budget on its hero, and two gradient heroes one swipe apart would
// make the modes look like the same screen twice.
// ---------------------------------------------------------------------------
const AudioFeature = ({ message, onPress }: { message: Message; onPress: () => void }) => (
  <PressableScale
    style={styles.feature}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Play ${message.title}, audio, ${message.speaker}, ${durationLabel(message)}`}
  >
    <AudioWaveformTile size={84} />
    <View style={styles.featureBody}>
      <Text style={styles.featureTitle} numberOfLines={2}>
        {message.title}
      </Text>
      <Text style={styles.featureMeta} numberOfLines={1}>
        {message.series ? `${message.series} · ${message.speaker}` : message.speaker}
      </Text>
      <View style={styles.featureAction}>
        <View style={styles.featurePlay}>
          <Ionicons name="play" size={13} color={theme.colors.white} />
        </View>
        <Text style={styles.featureDuration}>{durationLabel(message)}</Text>
      </View>
    </View>
  </PressableScale>
);

/** Small caps header for one teaching group — the same register see-all uses
 *  for its date/series buckets, so a group inside a shelf never gets mistaken
 *  for a shelf of its own. */
const GroupHeader = ({ label, count }: { label: string; count: number }) => (
  <View style={styles.groupHeaderRow}>
    <Text style={styles.groupHeader} accessibilityRole="header" numberOfLines={1}>
      {label}
    </Text>
    <Text style={styles.groupCount}>{count}</Text>
  </View>
);

export const AudioLibrary = ({
  items,
  branch,
  onScroll,
  bottomClearance,
  onPlay,
}: AudioLibraryProps) => {
  const branchName = branch === 'all' ? null : getBranch(branch)?.shortName ?? null;

  // One pass over the audio, splitting it into the three shelves. The hero is
  // removed from the shelves below it — a page where the top item also appears
  // three rows down reads as a bug, not as emphasis.
  const { featured, groups, loose } = useMemo(() => {
    const [first, ...rest] = items;
    const byLabel = new Map<string, Message[]>();
    const standalone: Message[] = [];

    for (const m of rest) {
      if (m.series) {
        const bucket = byLabel.get(m.series);
        if (bucket) bucket.push(m);
        else byLabel.set(m.series, [m]);
      } else {
        standalone.push(m);
      }
    }

    // A "group" of one is not a teaching, it is a single recording — it reads
    // better in the flat Recent shelf than under a header of its own.
    const teachings: AudioGroup[] = [];
    for (const [label, bucket] of byLabel) {
      if (bucket.length > 1) {
        teachings.push({ key: label.toLowerCase().replace(/\s+/g, '-'), label, items: bucket });
      } else {
        standalone.push(...bucket);
      }
    }
    teachings.sort((a, b) => b.items.length - a.items.length);
    standalone.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return { featured: first, groups: teachings, loose: standalone };
  }, [items]);

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
  // inherit either.
  if (!featured) {
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

  // The stagger runs across the WHOLE page rather than restarting per shelf,
  // so a mode switch reads as one page arriving instead of three lists racing
  // each other. Incremented as rows are emitted.
  let row = 0;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
    >
      {/* The video page's hero (CurrentMessage) carries no section label,
          because it is a full-bleed banner and announces itself. This hero is
          a card at row scale, so without a label it would read as a stray
          first row rather than as the top of the library. */}
      <SectionLabel label="Latest" />
      <FadeInUp delay={staggerDelay(row++)}>
        <AudioFeature message={featured} onPress={() => onPlay(featured)} />
      </FadeInUp>

      {groups.length > 0 && (
        <>
          <SectionLabel label="Teachings" />
          {groups.map((g) => (
            <View key={g.key}>
              <GroupHeader label={g.label} count={g.items.length} />
              {g.items.map((m) => (
                <FadeInUp key={m.id} delay={staggerDelay(row++)}>
                  <View style={styles.rowSlot}>
                    <AudioRow
                      title={m.title}
                      speaker={m.speaker}
                      duration={durationLabel(m)}
                      onPress={() => onPlay(m)}
                    />
                  </View>
                </FadeInUp>
              ))}
            </View>
          ))}
        </>
      )}

      {loose.length > 0 && (
        <>
          <SectionLabel label="Recent Audio" />
          {loose.map((m) => (
            <FadeInUp key={m.id} delay={staggerDelay(row++)}>
              <View style={styles.rowSlot}>
                <AudioRow
                  title={m.title}
                  speaker={m.speaker}
                  duration={durationLabel(m)}
                  context={m.series}
                  onPress={() => onPlay(m)}
                />
              </View>
            </FadeInUp>
          ))}
        </>
      )}
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
  // stays correct whatever height the search bar, mode switch and filter
  // pills happen to take on a given device.
  emptyPage: {
    flex: 1,
  },
  rowSlot: {
    marginBottom: theme.space.tight,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.related,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.grayBorder,
    borderWidth: theme.layout.cardBorderWidth,
    borderRadius: theme.radius.md,
    padding: theme.space.related,
  },
  featureBody: {
    flex: 1,
    gap: theme.space.micro,
  },
  featureTitle: {
    fontFamily: theme.fontFamily.displaySemibold,
    fontSize: theme.fontSize.heroTitle,
    lineHeight: 25,
    letterSpacing: -0.3,
    color: theme.colors.navy,
  },
  featureMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  featureAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
    marginTop: theme.space.micro,
  },
  featurePlay: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    // Optical centring: a play triangle sits visually left of a circle's
    // true centre unless it is nudged across.
    paddingLeft: 2,
  },
  featureDuration: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.space.tight,
    marginBottom: theme.space.tight,
  },
  groupHeader: {
    flex: 1,
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.slate,
  },
  groupCount: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
  },
});
