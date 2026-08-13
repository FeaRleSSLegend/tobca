// app/(tabs)/reels.tsx
// Vertical short-video feed. One short per screen, swipe up for the next.
//
// THREE DECISIONS WORTH KNOWING
//
// 1. Only the ACTIVE item mounts a player. Every short is a YouTube iframe
//    inside a WebView, and a WebView is one of the most expensive things you
//    can put on screen — mounting even the three items a paged FlatList likes
//    to keep alive would mean three WebViews, three network sessions and, on
//    Android, three simultaneous media surfaces. Neighbours render their
//    thumbnail instead, so a swipe still lands on a filled frame and the player
//    swaps in underneath.
//
// 2. Item height is MEASURED, not computed. Subtracting a hard-coded tab-bar
//    height from the window would be wrong the moment the bar changes size (it
//    just did — this is a five-tab bar now) or on a device with a different
//    home indicator. onLayout gives the exact height this screen was handed.
//
// 3. NONE of YouTube's own UI is ever allowed on screen. See the block comment
//    above PLAYER_PARAMS for exactly how, and what the residual risks are.
//
// Playback shares the app's existing react-native-youtube-iframe engine; it
// does NOT go through PlayerHost. PlayerHost is the persistent mini-player for
// long-form content that must survive navigation — the opposite of a feed where
// audio has to stop the instant you leave.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Linking,
  Share,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer, {
  InitialPlayerParams,
  PLAYER_STATES,
  YoutubeIframeRef,
} from 'react-native-youtube-iframe';
import { theme } from '../../constants/theme';
import { Message } from '../../data/contentModel';
import { useShorts } from '../../hooks/useShorts';
import { SmartImage } from '../../components/ui/SmartImage';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { PressableScale } from '../../components/ui/motion';
import { displayTitle } from '../../utils/contentGrouping';

// ---------------------------------------------------------------------------
// SUPPRESSING YOUTUBE'S OWN CHROME
//
// The visible complaint was YouTube's branded embed UI showing through: a
// "Watch on YouTube" card, a "More videos" grid, and the native transport
// controls. Four mechanisms, because no single one is sufficient:
//
//   1. controls: 0    — removes the scrubber, the play/pause, the fullscreen
//                       and overflow buttons, and the title bar that appears
//                       with them.
//   2. rel: 0         — since 2018 this no longer removes end-screen suggestions,
//                       it only restricts them to the SAME channel. It is set
//                       because same-channel is strictly better than any-channel,
//                       not because it solves the problem. Point 4 solves it.
//   3. iv_load_policy: 3 — suppresses the annotation/card layer.
//   4. pointerEvents: 'none' on the player layer, and an opaque cover of ours
//                       over every non-playing state. This is the mechanism that
//                       actually guarantees the requirement: the iframe cannot
//                       receive a touch, so it can never surface the title bar
//                       or the watch-on-YouTube affordance that a tap on a
//                       controls-hidden embed otherwise reveals; and because
//                       the end screen only paints AFTER the 'ended' event, we
//                       cover and rewind on that event before it can be seen.
//
// modestbranding is deliberately NOT in this object. YouTube documents it as
// having no effect since 2023-08-15, and react-native-youtube-iframe's own
// TypeScript types mark it deprecated. Passing it would be cargo cult; points
// 1 and 4 are what remove the branding.
//
// The library's `forceAndroidAutoplay` prop is deliberately NOT enabled either,
// even though it exists to solve exactly the autoplay problem this screen has.
// It works by swapping the WebView's user agent for a desktop Chrome string —
// which makes YouTube serve the DESKTOP embed, and the desktop embed is where
// the "Watch on YouTube" card and the larger branded chrome come from. It would
// trade the failure we no longer have for the one we are trying to remove.
// Muted autoplay already starts playback here without it.
//
// `loop` is also not set. YouTube's loop parameter needs a `playlist` value to
// loop a SINGLE video, which this player never sends, so `loop: true` was a
// no-op here. Looping is done on the 'ended' event instead — see onChangeState.
// ---------------------------------------------------------------------------
const PLAYER_PARAMS: InitialPlayerParams = {
  controls: false,
  rel: false,
  iv_load_policy: 3,
  preventFullScreen: true,
};

// How long to wait for muted autoplay before assuming it was refused and
// offering our own play button. Muted playback is exempt from the user-gesture
// requirement on both platforms, so this should never fire — but "should never"
// is not "cannot", and the failure mode without it is a feed stuck forever on
// our own loading cover, which is worse than the branded card we replaced.
const AUTOPLAY_GRACE_MS = 3500;

// The right-hand rail must clear the caption block, and the caption must clear
// the rail. One constant each, declared together so they cannot drift.
const RAIL_BOTTOM_OFFSET = 96;
const CAPTION_RIGHT_INSET = 84;

function youtubeUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${videoId}`;
}

// ---------------------------------------------------------------------------
// One circular icon button on the right-hand rail. 44pt target, translucent
// dark disc — a bare white glyph disappears over a bright frame, and this feed
// has no control over what the frame contains.
// ---------------------------------------------------------------------------
const RailButton = ({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
}) => (
  <PressableScale
    style={styles.railBtn}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={22} color={tint ?? theme.colors.white} />
  </PressableScale>
);

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { shorts, loading, empty } = useShorts();
  const playerRef = useRef<YoutubeIframeRef>(null);

  const [itemHeight, setItemHeight] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  // MUTED BY DEFAULT — this is what makes autoplay work at all, not a
  // preference. Android's WebView refuses programmatic playback of UNMUTED
  // media without a user gesture; the request is denied, the iframe stays on
  // its poster frame, and YouTube paints its branded card over it. Muted
  // playback is exempt from the gesture requirement, so the video actually
  // starts, and the user trades one tap for sound instead of one tap for
  // anything at all.
  const [muted, setMuted] = useState(true);
  // Leaving the tab must stop audio. Without this the feed keeps talking over
  // whatever screen you moved to, which is the single most obvious way a
  // video feed feels broken.
  const [focused, setFocused] = useState(true);
  // ARM DELAY — the same guard PlayerHost needed, for the same reason.
  // Mounting a YouTube WebView into a hierarchy that is still moving makes
  // YouTube serve its interstitial instead of the player, and nothing dismisses
  // it. In a paged feed the tree is ALWAYS moving at the moment the active
  // index changes, so the player has to wait for the scroll to settle before it
  // mounts. 250ms is a swipe settling, not a guess: below ~200 the interstitial
  // came back.
  const [armed, setArmed] = useState(false);
  // Has THIS short actually reached the 'playing' state? Our opaque cover stays
  // over the player until it has. This is the guarantee that YouTube's loading
  // card never shows for even one frame — the iframe boots underneath a screen
  // we painted, and is revealed only once there are real video pixels behind it.
  const [started, setStarted] = useState(false);
  // Autoplay appears to have been refused — reveal the frame and offer our own
  // play control rather than sitting on the loader forever.
  const [autoplayRefused, setAutoplayRefused] = useState(false);
  // Local-only, per the brief: no API call, no persistence, just the toggle.
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  // Every per-short piece of state resets together when the active index moves.
  useEffect(() => {
    setArmed(false);
    setStarted(false);
    setAutoplayRefused(false);
    const t = setTimeout(() => setArmed(true), 250);
    return () => clearTimeout(t);
  }, [activeIndex]);

  useEffect(() => {
    if (!armed || started) return;
    const t = setTimeout(() => setAutoplayRefused(true), AUTOPLAY_GRACE_MS);
    return () => clearTimeout(t);
  }, [armed, started, activeIndex]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const onChangeState = useCallback((state: PLAYER_STATES) => {
    if (state === PLAYER_STATES.PLAYING) {
      setStarted(true);
      setAutoplayRefused(false);
    } else if (state === PLAYER_STATES.ENDED) {
      // The ONE moment YouTube's end screen would paint. Re-cover first (so the
      // suggestion grid has nothing to appear on top of), then rewind and let
      // it run again — a short loops, the way Shorts does.
      setStarted(false);
      playerRef.current?.seekTo(0, true);
      setPlaying(true);
    }
  }, []);

  const viewabilityConfig = useRef({
    // 80%: a paged list settles decisively, so a high threshold means exactly
    // one item is ever "active" and the player never thrashes mid-swipe.
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setActiveIndex(first.index);
      // A new short always starts playing — the feed's whole premise.
      setPlaying(true);
    }
  }).current;

  // Tap on the frame. Normally a play/pause toggle, but the refused-autoplay
  // case needs different handling: `playing` is already true there (the app
  // asked, the platform declined), so toggling would PAUSE a video that never
  // started. The library only issues playVideo() when its `play` prop changes,
  // so recovery has to drive a real false→true transition — and the tap itself
  // is the user gesture that makes the second attempt allowed.
  const startOrToggle = useCallback(() => {
    if (autoplayRefused) {
      setAutoplayRefused(false);
      setPlaying(false);
      requestAnimationFrame(() => setPlaying(true));
      return;
    }
    setPlaying((p) => !p);
  }, [autoplayRefused]);

  const share = useCallback(async (item: Message) => {
    const url = youtubeUrl(item.videoId);
    try {
      // Same shape as PlayerHost's share, so a short and a full message share
      // identically — one share format for the whole app.
      await Share.share({ message: `${displayTitle(item.title)}\n${url}`, url });
    } catch {
      /* dismissed */
    }
  }, []);

  const openOnYoutube = useCallback((item: Message) => {
    Linking.openURL(youtubeUrl(item.videoId)).catch(() => {
      // No browser and no YouTube app is a real device state; nothing useful
      // to say about it.
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isActive = index === activeIndex;
      const isLiked = !!liked[item.id];
      // Reveal the player only once real playback has begun — or once we've
      // concluded autoplay was refused, in which case the frame plus our own
      // play button is still better than an endless loader.
      const revealed = started || autoplayRefused;

      return (
        <View
          style={[styles.page, { height: itemHeight }]}
          accessibilityLabel={`${displayTitle(item.title)} by ${item.speaker}`}
        >
          {/* Thumbnail underneath always — it is the poster frame while the
              player boots, and the whole frame for inactive neighbours. */}
          <SmartImage uri={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />

          {isActive && armed && itemHeight > 0 && itemWidth > 0 && (
            // pointerEvents="none" is load-bearing, not an optimisation. A
            // controls-hidden YouTube embed still responds to a tap by
            // surfacing its title bar and "Watch on YouTube" link — the exact
            // branding this screen exists to hide. Making the layer untouchable
            // is what makes that impossible. It costs nothing: with controls:0
            // there was no YouTube control worth tapping, and our own overlay
            // above handles every gesture the feed needs.
            <View style={styles.playerLayer} pointerEvents="none">
              <YoutubePlayer
                ref={playerRef}
                // A 16:9 box centred in the black page, NOT a forced 9:16 fill.
                // The iframe renders the video at its own aspect regardless of
                // the height it is given, so stretching the container just left
                // a 16:9 player pinned to the top of a tall black rectangle.
                // Most of this church's short uploads are landscape clips
                // anyway; a centred 16:9 stage is honest about that.
                height={Math.round((itemWidth * 9) / 16)}
                width={itemWidth}
                play={playing && focused}
                mute={muted}
                videoId={item.videoId}
                initialPlayerParams={PLAYER_PARAMS}
                onChangeState={onChangeState}
                useLocalHTML
                baseUrlOverride="https://theolivebrookchurch.org"
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  androidLayerType: 'hardware',
                  setSupportMultipleWindows: false,
                  scrollEnabled: false,
                }}
              />
            </View>
          )}

          {/* OUR LOADING STATE, covering the player completely until real
              playback starts. Opaque, not translucent: the point is that
              YouTube's own boot sequence — its branded card, its poster frame,
              its spinner — is never visible for even one frame. Same brand
              shimmer the rest of the app loads with. */}
          {isActive && !revealed && (
            <View style={styles.cover}>
              <BrandLoader width={180} tint={theme.colors.white} />
            </View>
          )}

          {/* Bottom scrim for caption legibility. A soft gradient rather than
              the solid bar this used to have — the video keeps showing through,
              which is what makes the chrome read as an overlay on the video
              rather than a card under it. */}
          <LinearGradient
            colors={['rgba(10,22,33,0)', 'rgba(10,22,33,0.55)', 'rgba(10,22,33,0.9)']}
            locations={[0, 0.55, 1]}
            style={[styles.scrim, { height: 220 + insets.bottom }]}
            pointerEvents="none"
          />

          {isActive && (
            <>
              {/* Tap anywhere to pause/resume. This is the ONLY thing that can
                  receive a tap on the video itself, which is how the feed keeps
                  a single meaning for a single gesture. */}
              <PressableScale
                containerStyle={StyleSheet.absoluteFill}
                style={styles.tapLayer}
                activeScale={1}
                onPress={() => startOrToggle()}
                accessibilityRole="button"
                accessibilityLabel={playing ? 'Pause video' : 'Play video'}
              >
                {(!playing || autoplayRefused) && (
                  <View style={styles.pausedBadge}>
                    <Ionicons
                      name="play"
                      size={30}
                      color={theme.colors.white}
                      style={styles.pausedGlyph}
                    />
                  </View>
                )}
              </PressableScale>

              {/* TOP-RIGHT: sound. Its own control rather than a tap-anywhere
                  gesture — tapping the frame already means play/pause, and
                  overloading one gesture with two meanings makes both feel
                  unreliable. */}
              <PressableScale
                containerStyle={[styles.soundSlot, { top: insets.top + theme.spacing.md }]}
                style={styles.soundBtn}
                onPress={() => setMuted((m) => !m)}
                accessibilityRole="button"
                accessibilityLabel={muted ? 'Unmute video' : 'Mute video'}
              >
                <Ionicons
                  name={muted ? 'volume-mute' : 'volume-high'}
                  size={18}
                  color={theme.colors.white}
                />
              </PressableScale>

              {/* RIGHT RAIL: like, share, open the source. Deliberately three
                  and no more — every icon here is one the user has to rule out
                  before they can watch. */}
              <View
                style={[styles.rail, { bottom: insets.bottom + RAIL_BOTTOM_OFFSET }]}
              >
                <RailButton
                  icon={isLiked ? 'heart' : 'heart-outline'}
                  tint={isLiked ? theme.colors.pink : theme.colors.white}
                  label={isLiked ? 'Unlike this short' : 'Like this short'}
                  onPress={() => setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                />
                <RailButton
                  icon="arrow-redo-outline"
                  label="Share this short"
                  onPress={() => share(item)}
                />
                <RailButton
                  icon="open-outline"
                  label="Watch the full video on YouTube"
                  onPress={() => openOnYoutube(item)}
                />
              </View>
            </>
          )}

          {/* BOTTOM-LEFT: who made this, then what it is. Right-inset so it can
              never run under the rail, even with a long channel name. */}
          <View
            style={[
              styles.caption,
              { paddingBottom: insets.bottom + theme.spacing.lg, right: CAPTION_RIGHT_INSET },
            ]}
            pointerEvents="none"
          >
            <View style={styles.creatorRow}>
              {/* The model carries no channel avatar (see data/channels.ts —
                  featured channels store a name and an id, not artwork), so the
                  video's own thumbnail stands in. It still does the job the
                  avatar does here: a circular image that says "this is whose
                  content you're watching". */}
              <View style={styles.avatar}>
                <SmartImage uri={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
              </View>
              <Text style={styles.creatorName} numberOfLines={1}>
                {item.speaker}
              </Text>
            </View>
            <Text style={styles.captionTitle} numberOfLines={2}>
              {displayTitle(item.title)}
            </Text>
          </View>
        </View>
      );
    },
    [
      activeIndex,
      armed,
      itemHeight,
      itemWidth,
      playing,
      focused,
      muted,
      started,
      autoplayRefused,
      liked,
      insets.bottom,
      insets.top,
      onChangeState,
      startOrToggle,
      share,
      openOnYoutube,
    ]
  );

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        setItemHeight(Math.round(e.nativeEvent.layout.height));
        setItemWidth(Math.round(e.nativeEvent.layout.width));
      }}
    >
      {loading ? (
        <View style={styles.centre}>
          <BrandLoader width={180} tint={theme.colors.white} />
        </View>
      ) : empty ? (
        <View style={styles.centre}>
          <Ionicons name="film-outline" size={34} color="rgba(255,255,255,0.6)" />
          <Text style={styles.emptyTitle}>No shorts yet</Text>
          <Text style={styles.emptyBody}>
            Short videos from the church channels will appear here as they&apos;re posted.
          </Text>
        </View>
      ) : itemHeight > 0 ? (
        <FlatList
          data={shorts}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // Exact page height means paging snaps cleanly and getItemLayout can
          // skip measurement entirely.
          getItemLayout={(_, index) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index,
          })}
          // A feed of WebViews cannot afford a deep render window.
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews
        />
      ) : (
        <View style={styles.centre}>
          <ActivityIndicator color={theme.colors.white} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black },
  page: { width: '100%', backgroundColor: theme.colors.black, justifyContent: 'center' },
  playerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  // Opaque, deliberately — see the call site. A translucent cover would let
  // YouTube's branded loading card show through it, which is the whole thing
  // this is here to prevent.
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tapLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedBadge: {
    width: 78,
    height: 78,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(10,22,33,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The play glyph's bounding box carries empty space on its left, so it reads
  // as off-centre in a circle unless nudged back.
  pausedGlyph: { marginLeft: theme.space.micro },
  soundSlot: {
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 5,
  },
  soundBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // Translucent dark disc rather than a bare glyph: over a bright frame a
    // white icon alone disappears.
    backgroundColor: 'rgba(10,22,33,0.55)',
  },
  rail: {
    position: 'absolute',
    right: theme.spacing.md,
    alignItems: 'center',
    // Even, comfortable spacing — one value, so the rail reads as a single
    // column rather than three buttons that happen to be stacked.
    gap: theme.space.related,
    zIndex: 5,
  },
  railBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,22,33,0.55)',
  },
  caption: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingLeft: theme.spacing.lg,
    zIndex: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.tight,
    marginBottom: theme.space.tight,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  creatorName: {
    flex: 1,
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.white,
  },
  // Lighter than the creator name, which is what makes the pair read as
  // "who" then "what" rather than as two headlines.
  captionTitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.9)',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxxl,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: theme.colors.white,
  },
  emptyBody: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
});
