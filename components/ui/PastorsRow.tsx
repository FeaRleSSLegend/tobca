// components/ui/PastorsRow.tsx
// "OUR PASTORS" — the circular entry point into a pastor's own page.
//
// WHAT THIS REPLACES, and why the replacement is a different SHAPE rather than
// a restyle. The Library used to carry a shelf headed "Pastor Yinka's
// Teachings": a SectionLabel plus a row of 16:9 PosterCards, identical in
// every respect to Series, Services and Recently Added above it. That made a
// person look like a content category. Scrolling past four visually identical
// shelves, the only thing distinguishing hers was the words in the header.
//
// A CIRCLE IS THE POINT. Round artwork means "a person" in every interface
// people already use — a contact, an author byline, a channel avatar, a story
// ring. Rectangular artwork means "a thing to watch". Using the round form
// here does in one glance what the old header had to spell out, and it stops
// her section competing with the sermon shelves on their own terms: it is
// smaller than any of them and reads as a doorway rather than as content.
//
// REAL AVATAR, NOT A GLYPH. The image is the channel's actual YouTube profile
// photo, fetched via hooks/useChannelProfile. An earlier version of this idea
// drew a gradient disc with a microphone icon in it, which is a decoration
// standing where a face should be — the whole reason a circle reads as a
// person is that there is normally a person in it.
//
// ONLY PASTORS WITH SOMETHING BEHIND THE TAP APPEAR HERE. Pastor Abu Jibril
// has no YouTube channel (see data/socials.ts, where his row is Instagram
// only), so he is not in this row. A second circle that opened an empty page,
// or opened nothing, would be worse than a row of one — the row's promise is
// that a face leads to that person's messages.

import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SmartImage } from './SmartImage';
import { SectionLabel } from './SectionLabel';
import { HScroll } from './HScroll';
import { PressableScale } from './motion';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors, useThemeGradient } from '../../hooks/useTheme';
import { useChannelProfile } from '../../hooks/useChannelProfile';
import { featuredChannels, type FeaturedChannel } from '../../data/channels';
import { useGuardedPush } from '../../hooks/useGuardedPush';

/** The circle's drawn diameter. 72 is the smallest size a face is still a
 *  face at, and it keeps the whole row shorter than one poster card. */
const AVATAR = 72;

const PastorCircle = ({ channel }: { channel: FeaturedChannel }) => {
  const styles = useStyles();
  const c = useThemeColors();
  const gradient = useThemeGradient();
  const push = useGuardedPush();
  const { profile } = useChannelProfile(channel.channelId);

  // First initial of the LAST word of the display name is wrong for
  // "Pastor Yinka Jibril" (you would get J for a person everyone calls
  // Yinka), so this takes the first letter of the first word that is not an
  // honorific — the name people would actually recognise.
  const initial = channel.name.replace(/^(Pastor|Pst\.?|Rev\.?)\s+/i, '').charAt(0).toUpperCase();

  return (
    <PressableScale
      style={styles.item}
      onPress={() => push({ pathname: '/pastor/[id]', params: { id: channel.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${channel.name}, open her messages`}
    >
      <View style={styles.ring}>
        {profile?.avatar ? (
          <SmartImage
            uri={profile.avatar}
            style={styles.avatar}
            radius={AVATAR / 2}
            // A tiny circle: the shimmer sweep is more noticeable than the
            // 88px image it is standing in for, so the neutral fill wins.
            showPlaceholder={false}
            accessibilityLabel={`${channel.name}'s profile photo`}
          />
        ) : (
          // The considered fallback, not an error state — see the header note.
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start}
            end={gradient.end}
            style={styles.avatar}
          >
            <Text style={styles.initial}>{initial}</Text>
          </LinearGradient>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {channel.name}
      </Text>
      <View style={styles.metaRow}>
        <Ionicons name="logo-youtube" size={11} color={c.textMuted} />
        <Text style={styles.meta}>Channel</Text>
      </View>
    </PressableScale>
  );
};

export const PastorsRow = () => {
  if (featuredChannels.length === 0) return null;

  return (
    <>
      {/* No chevron. A section header's chevron means "there are more of these
          behind here", and there is no fuller list of pastors to open — the
          row already shows all of them. */}
      <SectionLabel label="Our Pastors" />
      <HScroll>
        {featuredChannels.map((ch) => (
          <PastorCircle key={ch.id} channel={ch} />
        ))}
      </HScroll>
    </>
  );
};

const useStyles = makeThemedStyles((c) => ({
  item: {
    // Wider than the circle so a two-line name has somewhere to go without
    // the circles below drifting out of alignment with each other.
    width: 96,
    alignItems: 'center',
    gap: theme.space.tight,
  },
  // A hairline ring around the photo. Channel avatars are frequently
  // near-white at the edges, and without it a light avatar dissolves into a
  // light card; in dark mode it does the same against the dark ground.
  ring: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    backgroundColor: c.surfaceSunken,
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: theme.fontFamily.display,
    fontSize: 28,
    color: c.textOnAccent,
  },
  name: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    lineHeight: theme.fontSize.body * 1.3,
    color: c.textPrimary,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.micro,
    marginTop: -theme.space.micro,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textMuted,
  },
}));
