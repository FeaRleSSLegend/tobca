// app/(tabs)/reels.tsx
// Vertical short-video feed. One short per screen, swipe up for the next.
//
// TWO DECISIONS WORTH KNOWING
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
  Pressable,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../../constants/theme';
import { Message } from '../../data/contentModel';
import { useShorts } from '../../hooks/useShorts';
import { SmartImage } from '../../components/ui/SmartImage';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { PressableScale } from '../../components/ui/motion';
import { displayTitle } from '../../utils/contentGrouping';

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { shorts, loading, empty } = useShorts();

  const [itemHeight, setItemHeight] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  // MUTED BY DEFAULT — this is what makes autoplay work at all, not a
  // preference. Android's WebView refuses programmatic playback of UNMUTED
  // media without a user gesture; the request is denied, the iframe stays on
  // its poster frame, and YouTube paints its branded "Watch on YouTube" card
  // over it. That card was never a consent prompt we could configure away — it
  // was the visible symptom of a refused autoplay. Muted playback is exempt
  // from the gesture requirement, so the video actually starts, and the user
  // trades one tap for sound instead of one tap for anything at all.
  const [muted, setMuted] = useState(true);
  // Leaving the tab must stop audio. Without this the feed keeps talking over
  // whatever screen you moved to, which is the single most obvious way a
  // video feed feels broken.
  const [focused, setFocused] = useState(true);
  // ARM DELAY — the same guard PlayerHost needed, for the same reason.
  // Mounting a YouTube WebView into a hierarchy that is still moving makes
  // YouTube serve its "Watch on YouTube" interstitial instead of the player,
  // and nothing dismisses it. In a paged feed the tree is ALWAYS moving at the
  // moment the active index changes, so the player has to wait for the scroll
  // to settle before it mounts. 250ms is a swipe settling, not a guess: below
  // ~200 the interstitial came back.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setArmed(false);
    const t = setTimeout(() => setArmed(true), 250);
    return () => clearTimeout(t);
  }, [activeIndex]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

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

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isActive = index === activeIndex;
      return (
        <View
          style={[styles.page, { height: itemHeight }]}
          accessibilityLabel={`${displayTitle(item.title)} by ${item.speaker}`}
        >
          {/* Thumbnail underneath always — it is the poster frame while the
              player boots, and the whole frame for inactive neighbours. */}
          <SmartImage uri={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />

          {isActive && armed && itemHeight > 0 && itemWidth > 0 && (
            // NOT pointerEvents:none. YouTube's embed requires a user gesture
            // to begin playback whenever autoplay is refused, so a player the
            // user physically cannot touch gets stuck on the poster frame
            // forever — which is exactly what happened: the branded
            // "Watch on YouTube" overlay with no way to dismiss it.
            <View style={styles.playerLayer}>
              <YoutubePlayer
                // A 16:9 box centred in the black page, NOT a forced 9:16 fill.
                // The iframe renders the video at its own aspect regardless of
                // the height it is given, so stretching the container just left
                // a 16:9 player pinned to the top of a tall black rectangle.
                // Most of this church's short uploads are landscape clips
                // anyway; a centred 16:9 stage is honest about that.
                height={Math.round(itemWidth * 9 / 16)}
                width={itemWidth}
                play={playing && focused}
                mute={muted}
                videoId={item.videoId}
                // No chrome: the feed IS the control surface. controls:0 also
                // stops YouTube's own UI fighting the overlay below.
                // controls:true, matching PlayerHost. With controls:false the
                // embed has no play button of its own, so once autoplay was
                // refused there was no way for anyone — user or app — to start
                // it. YouTube's transport is also the only reliable way to
                // begin playback after a gesture.
                initialPlayerParams={{ controls: true, modestbranding: true, rel: false, loop: true }}
                useLocalHTML
                baseUrlOverride="https://theolivebrookchurch.org"
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  androidLayerType: 'hardware',
                  setSupportMultipleWindows: false,
                  // The player layer is pointerEvents:none so taps reach the
                  // Pressable above; scrolling stays with the FlatList.
                  scrollEnabled: false,
                }}
              />
            </View>
          )}

          {/* SOUND TOGGLE. Its own control rather than a tap-anywhere gesture:
              tapping the frame already means play/pause, and overloading one
              gesture with two meanings makes both feel unreliable. Placed top-
              right, the conventional spot, so it is findable without a hint. */}
          {isActive && (
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
          )}

          {/* Attribution sits at the bottom over a scrim, the one piece of
              chrome the feed needs: which channel am I watching, and what is
              this. */}
          <View style={[styles.caption, { paddingBottom: insets.bottom + theme.spacing.lg }]} pointerEvents="none">
            <Text style={styles.captionSource} numberOfLines={1}>{item.speaker}</Text>
            <Text style={styles.captionTitle} numberOfLines={2}>{displayTitle(item.title)}</Text>
          </View>
        </View>
      );
    },
    [activeIndex, armed, itemHeight, itemWidth, playing, focused, muted, insets.bottom, insets.top]
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
  playerLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' },
  pausedLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pausedBadge: {
    width: 78,
    height: 78,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(10,22,33,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    // white icon alone disappears, and this is the only control on screen.
    backgroundColor: 'rgba(10,22,33,0.55)',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    // A scrim rather than a solid bar: the video keeps showing through, but
    // white type stays legible over whatever frame is underneath.
    backgroundColor: 'rgba(10,22,33,0.55)',
  },
  captionSource: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  captionTitle: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.sectionHeading,
    color: theme.colors.white,
    lineHeight: 24,
  },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xxxl },
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
