// components/ui/FeaturedChannelRow.tsx
// Pastor Yinka Jibril's channel on the Library screen.
//
// PLACEMENT: a section on Library rather than a fifth tab or its own screen.
// A tab would put one person's channel at the same level as Home, the whole
// library, prayer and the reading plan — far more prominence than one content
// stream warrants, and the tab bar is full. Library is already the "everything
// to watch" surface, so it belongs there alongside Series, Services and
// Playlists.
//
// DISTINCTNESS: it deliberately does NOT reuse SectionLabel + PosterCard like
// the rows above it. Those rows are the church's sermon archive; this is one
// person's own voice, and rendering it identically would read as just another
// OliveBrook category. So it gets its own framed card with a name, a tagline
// and a gradient avatar — enough to say "this is hers" without inventing a
// second visual language for the app.

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Message } from '../../data/contentModel';
import { FeaturedChannel } from '../../data/channels';
import { HScroll } from './HScroll';
import { PosterCard } from './PosterCard';
import { FadeInUp, staggerDelay } from './motion';
import { BrandLoader } from './BrandLoader';

interface FeaturedChannelRowProps {
  channel: FeaturedChannel;
  episodes: Message[];
  loading: boolean;
  /** Channel id not filled in yet — say "coming soon", not "failed". */
  pending: boolean;
  failed: boolean;
  onPlay: (m: Message) => void;
  /** How many episodes to preview in the row. */
  previewCount?: number;
}

export const FeaturedChannelRow = ({
  channel,
  episodes,
  loading,
  pending,
  failed,
  onPlay,
  previewCount = 6,
}: FeaturedChannelRowProps) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={styles.avatar}
        >
          <Ionicons name="mic" size={18} color={theme.colors.white} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{channel.name}</Text>
          <Text style={styles.tagline} numberOfLines={1}>{channel.tagline}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <BrandLoader width={140} />
        </View>
      ) : pending ? (
        // The channel simply isn't connected yet. Worded as an announcement,
        // because that is what it is — nothing has gone wrong.
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Coming soon</Text>
          <Text style={styles.stateBody}>
            {channel.name}'s episodes will appear here once her channel is connected.
          </Text>
        </View>
      ) : failed || episodes.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>No episodes yet</Text>
          <Text style={styles.stateBody}>Check back soon.</Text>
        </View>
      ) : (
        <HScroll>
          {episodes.slice(0, previewCount).map((m, i) => (
            <FadeInUp key={m.id} delay={staggerDelay(i)}>
              <PosterCard
                title={m.title}
                subtitle={m.duration}
                thumbnail={m.thumbnail}
                onPress={() => onPlay(m)}
              />
            </FadeInUp>
          ))}
        </HScroll>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.xxl,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: theme.colors.navy,
  },
  tagline: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
    marginTop: 2,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xl,
  },
  stateTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
  },
  stateBody: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
