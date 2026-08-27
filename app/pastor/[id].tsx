// app/pastor/[id].tsx
// A PASTOR'S OWN PAGE — reached from the circular avatar in the Library's
// "Our Pastors" row (components/ui/PastorsRow.tsx).
//
// WHY A DEDICATED ROUTE AND NOT /see-all?channel=…
// Because /see-all does not, and did not, handle a `channel` param. The old
// "Pastor Yinka's Teachings" shelf pushed exactly that URL, and
// app/see-all.tsx reads only `section`, `filter` and `title` — so the push
// fell through to the no-param branch, which renders getRecentlyAdded() over
// useMessages(). Tapping the header of HER shelf showed the CHURCH's recent
// uploads under her name. That is the concrete bug behind "her page still
// shows general OliveBrook content", and it is not fixable by adding a
// `channel` branch to see-all: everything in that file is built over
// useMessages, which is the church's sermon feed and deliberately excludes her
// channel (see hooks/useFeaturedChannel for why the two feeds are kept apart).
//
// So her content needs its own screen over her own hook, which is this file.
// The data source is visible in one line below: useFeaturedChannel('yinka'),
// which fetches data/channels.ts YINKA_CHANNEL_ID = UCJn5-UlFahjdoquyV90LW3A.
//
// THE GRID IS SQUARE, per the Our Pastors spec, and that is a real decision
// rather than a crop. YouTube gives 16:9 stills; drawn into a square tile with
// contentFit="cover" they lose their left and right edges. That is acceptable
// HERE and nowhere else in the app: a channel page is a body of work by one
// person, and a square grid is the form every platform uses for exactly that
// (a profile grid), so the page reads as "her channel" at a glance rather than
// as another list of church videos. The sermon shelves stay 16:9 because there
// the thumbnail's text is often the only thing distinguishing two recordings
// of the same weekly service.

import { View, Text, FlatList, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors, useThemeGradient } from '../../hooks/useTheme';
import { SmartImage } from '../../components/ui/SmartImage';
import { PressableScale } from '../../components/ui/motion';
import { EmptyState } from '../../components/ui/EmptyState';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { getFeaturedChannel, type FeaturedChannelId } from '../../data/channels';
import { useFeaturedChannel } from '../../hooks/useFeaturedChannel';
import { useChannelProfile } from '../../hooks/useChannelProfile';
import { usePlayback } from '../../providers/PlaybackProvider';
import { useStackBottomClearance } from '../../hooks/useBottomClearance';
import type { Message } from '../../data/contentModel';

const GUTTER = theme.layout.screenPadding;
const COLUMNS = 2;
const HERO_AVATAR = 88;

export default function PastorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const styles = useStyles();
  const c = useThemeColors();
  const gradient = useThemeGradient();
  const { width } = useWindowDimensions();
  const bottomClearance = useStackBottomClearance();
  const { play } = usePlayback();

  const channel = getFeaturedChannel((id ?? '') as FeaturedChannelId);

  // HER CHANNEL, not the church's. This one line is the whole answer to "is it
  // actually pulling from her own channel id" — useFeaturedChannel resolves
  // the id through data/channels.ts and calls fetchChannelUploads with it, and
  // it never touches useMessages.
  const feed = useFeaturedChannel((channel?.id ?? 'yinka') as FeaturedChannelId);
  const { profile } = useChannelProfile(channel?.channelId);

  // Tile size derived from the real viewport rather than a fixed number, so
  // the grid stays flush to both gutters on every screen width.
  const tile = Math.floor((width - GUTTER * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS);

  if (!channel) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Header onBack={() => router.back()} title="Not found" />
        <EmptyState icon="person-outline" title="No such page" />
      </SafeAreaView>
    );
  }

  const initial = channel.name
    .replace(/^(Pastor|Pst\.?|Rev\.?)\s+/i, '')
    .charAt(0)
    .toUpperCase();

  const openChannel = () =>
    // The web URL, not the vnd.youtube:// deep link. data/socials.ts uses the
    // app scheme because that screen's whole job is "go to their profile in
    // the app you already have"; here the in-app grid IS the primary way to
    // watch, and this button is the secondary "see everything / subscribe"
    // escape hatch, where a URL that always resolves beats one that only
    // resolves when YouTube is installed.
    Linking.openURL(`https://www.youtube.com/channel/${channel.channelId}`).catch(() => {});

  const renderTile = ({ item, index }: { item: Message; index: number }) => (
    <PressableScale
      style={[styles.tile, { width: tile }, index % COLUMNS === 0 ? null : styles.tileGap]}
      onPress={() => play(item)}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
    >
      <View style={[styles.tileArt, { width: tile, height: tile }]}>
        <SmartImage
          uri={item.thumbnail}
          style={{ width: tile, height: tile }}
          radius={theme.radius.md}
          // COVER into a square — this is the crop the header note explains.
          contentFit="cover"
        />
        {!!item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </PressableScale>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <Header onBack={() => router.back()} title={channel.name} />

      <FlatList
        data={feed.episodes}
        keyExtractor={(m) => m.id}
        numColumns={COLUMNS}
        renderItem={renderTile}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.heroRing}>
              {profile?.avatar ? (
                <SmartImage
                  uri={profile.avatar}
                  style={styles.heroAvatar}
                  radius={HERO_AVATAR / 2}
                  showPlaceholder={false}
                  accessibilityLabel={`${channel.name}'s profile photo`}
                />
              ) : (
                <LinearGradient
                  colors={gradient.colors}
                  start={gradient.start}
                  end={gradient.end}
                  style={styles.heroAvatar}
                >
                  <Text style={styles.heroInitial}>{initial}</Text>
                </LinearGradient>
              )}
            </View>

            <Text style={styles.heroName}>{channel.name}</Text>
            <Text style={styles.heroRole}>{channel.role}</Text>
            <Text style={styles.heroTagline}>{channel.tagline}</Text>

            <PressableScale
              style={styles.channelBtn}
              onPress={openChannel}
              accessibilityRole="link"
              accessibilityLabel={`Open ${channel.name}'s channel on YouTube`}
            >
              <Ionicons name="logo-youtube" size={15} color={c.textPrimary} />
              <Text style={styles.channelBtnText}>View channel</Text>
              <Ionicons name="open-outline" size={13} color={c.textMuted} />
            </PressableScale>

            {feed.episodes.length > 0 && (
              <Text style={styles.count}>
                {feed.episodes.length} message{feed.episodes.length === 1 ? '' : 's'}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          feed.loading ? (
            <View style={styles.stateBox}>
              <BrandLoader width={140} />
            </View>
          ) : feed.pending ? (
            <EmptyState
              icon="hourglass-outline"
              title="Coming soon"
              subtitle={`${channel.name}'s messages will appear here once her channel is connected.`}
            />
          ) : feed.failed ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Couldn't load her messages"
              subtitle="Check your connection and try again."
            />
          ) : (
            <EmptyState icon="videocam-outline" title="No messages yet" subtitle="Check back soon." />
          )
        }
      />
    </SafeAreaView>
  );
}

/** The same back-and-title bar Settings uses, so a pushed screen looks pushed. */
const Header = ({ onBack, title }: { onBack: () => void; title: string }) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <View style={styles.header}>
      <PressableScale
        style={styles.backBtn}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={26} color={c.textPrimary} />
      </PressableScale>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};

const useStyles = makeThemedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: GUTTER,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: c.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.textPrimary,
  },
  listContent: {
    paddingHorizontal: GUTTER,
  },
  column: {
    marginBottom: theme.space.related,
  },

  // ---- Hero ----
  hero: {
    alignItems: 'center',
    paddingTop: theme.space.section,
    paddingBottom: theme.space.section,
    gap: theme.space.micro,
  },
  heroRing: {
    width: HERO_AVATAR,
    height: HERO_AVATAR,
    borderRadius: HERO_AVATAR / 2,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    backgroundColor: c.surfaceSunken,
    overflow: 'hidden',
    marginBottom: theme.space.tight,
  },
  heroAvatar: {
    width: HERO_AVATAR,
    height: HERO_AVATAR,
    borderRadius: HERO_AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitial: {
    fontFamily: theme.fontFamily.display,
    fontSize: 34,
    color: c.textOnAccent,
  },
  heroName: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.pageTitle,
    color: c.textPrimary,
    textAlign: 'center',
  },
  heroRole: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: c.accent,
  },
  heroTagline: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: theme.fontSize.bodyLg * 1.45,
    color: c.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.space.micro,
  },
  channelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
    marginTop: theme.space.header,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  channelBtnText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.textPrimary,
  },
  count: {
    marginTop: theme.space.related,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textMuted,
  },

  // ---- Grid ----
  tile: {
    gap: theme.space.tight,
  },
  tileGap: {
    marginLeft: GUTTER,
  },
  tileArt: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: c.surfaceSunken,
  },
  // Bottom-right, the position every video platform puts a runtime in, so it
  // is read without being looked at.
  durationBadge: {
    position: 'absolute',
    right: theme.space.tight,
    bottom: theme.space.tight,
    paddingHorizontal: theme.space.tight,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    // Literal, not a token: this sits on ARTWORK, which is the same in both
    // appearances, so it must not follow the palette.
    backgroundColor: 'rgba(10,22,33,0.82)',
  },
  durationText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  tileTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    lineHeight: theme.fontSize.body * 1.35,
    color: c.textPrimary,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.major,
  },
}));
