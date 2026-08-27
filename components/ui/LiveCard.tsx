import { Text, View, Linking, StyleSheet, Animated, Easing } from 'react-native'
import { useEffect, useRef } from 'react'
import { PressableScale } from './motion'
import { SmartImage } from './SmartImage'
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLiveStyles } from '../../constants/styles/live.styles';
import { Ionicons } from '@expo/vector-icons';
import { getNextService } from '../../data/services';

interface LiveCardProps {
  isLive?: boolean;
  title?: string;
  // 'youtube' = confirmed live; 'schedule' = assumed from service times
  // because YouTube couldn't be reached. The caption tells the truth
  // about which one it is instead of claiming "streaming now" on a guess.
  source?: 'youtube' | 'schedule';
  // Tapping "Watch now" on a confirmed-live card. Undefined when there's
  // no confirmed stream to open (schedule-only fallback), which is why the
  // button is only wired in the youtube-source case.
  onWatch?: () => void;
  /** Live stream artwork. When present the card becomes a photo hero. */
  thumbnail?: string;
}

/**
 * The LIVE dot, actually pulsing.
 *
 * It was a static pink circle before — a "live indicator" that never moved,
 * which is the one thing a live indicator has to do. Opacity + scale on a
 * gentle loop, native driver, so it keeps breathing regardless of what the JS
 * thread is doing.
 */
const PulseDot = () => {
  const heroStyles = useHeroStyles();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        heroStyles.dot,
        {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
        },
      ]}
    />
  );
};

// The first thing anyone sees on the app — pink/purple gradient hero,
// matching how boldly the real site treats its own hero moment.
//
// Refinement pass on the LIVE state: the old layout said "live" three
// times (a "YouTube Live" pill, a bare play circle floating mid-card, and
// a second "LIVE NOW" pill) — three elements, one fact, no clear action.
// Collapsed to one statement of each thing: one LIVE badge, the title as
// the biggest element (it's the actual information), one honest caption,
// and a labeled full-width "Watch now" button. A button with a word wins
// over a bare icon circle for the card's single primary action — the icon
// alone made "what happens if I tap this?" a guess.
export const LiveCard = ({ isLive, title, source = 'youtube', onWatch, thumbnail }: LiveCardProps) => {
  const liveStyles = useLiveStyles();
  const heroStyles = useHeroStyles();
  const c = useThemeColors();
  // Recomputed per render, NOT at module load — as a module-level const
  // this was evaluated once when the JS bundle first ran, so the countdown
  // ("in 2 days 3 hrs") silently froze at whatever was true at app launch
  // and the card could keep advertising a service that already happened.
  const { service: nextService, countdownLabel, startsAt } = getNextService();

  // "Add to Calendar" was a button with no onPress at all — the most
  // prominent control on the home screen did nothing, and once every card
  // gained press-scale it even animated as though it had worked. Wired to a
  // Google Calendar template URL, which needs no new dependency and is
  // handled by the Calendar app when installed, the browser otherwise.
  const onAddToCalendar = () => {
    // Google's template wants UTC basic-format timestamps: 20260808T083000Z
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ends = new Date(startsAt.getTime() + 90 * 60 * 1000);
    const url =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(`${nextService.name} · The OliveBrook Church`)}` +
      `&dates=${stamp(startsAt)}/${stamp(ends)}`;
    Linking.openURL(url).catch(() => {
      // No calendar app and no browser is a legitimate device state; there is
      // nothing useful to say about it, so fail quietly rather than throw.
    });
  };

  return isLive ? (
    // PHOTO HERO. The stream's own thumbnail is the card, with a scrim for
    // legibility — same SmartImage + gradient-scrim recipe as the playlist
    // masthead and CurrentMessage card, so it reads as part of the same app.
    // Falls back to the brand gradient when there's no thumbnail (the
    // schedule-only path has no stream, so no artwork).
    <View style={[liveStyles.liveCard, heroStyles.hero]}>
      {thumbnail ? (
        <>
          <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
          {/* Two stops weighted to the bottom: the top stays light enough to
              see the picture, the bottom goes dark enough to carry text. */}
          <LinearGradient
            colors={['rgba(10,22,33,0.15)', 'rgba(10,22,33,0.55)', 'rgba(10,22,33,0.92)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={heroStyles.content}>
        <View style={heroStyles.badge}>
          <PulseDot />
          <Text style={liveStyles.badgeText}>LIVE</Text>
        </View>

        <View style={heroStyles.spacer} />

        <Text style={liveStyles.heroTitle} numberOfLines={2}>
          {title ?? 'Sunday Service'}
        </Text>
        <Text style={[liveStyles.heroCaption, { marginTop: theme.space.micro }]}>
          {source === 'youtube' ? 'Streaming live on YouTube' : 'Service in progress'}
        </Text>

        <PressableScale
          containerStyle={heroStyles.ctaSlot}
          style={heroStyles.cta}
          onPress={onWatch}
          disabled={!onWatch}
          accessibilityRole="button"
          accessibilityLabel="Watch the live stream"
        >
          <Ionicons name="play" size={16} color={c.pink} style={{ marginLeft: theme.space.hairline }} />
          <Text style={liveStyles.primaryBtnText}>Watch now</Text>
        </PressableScale>
      </View>
    </View>
  ) : (
    <LinearGradient
      colors={theme.gradient.colors}
      start={theme.gradient.start}
      end={theme.gradient.end}
      style={liveStyles.liveCard}
    >
      {/* sharedStyles.overlineText is pink-on-white everywhere else in the
          app — correct there, but pink text on a card that starts as pink
          would be nearly invisible, so this one instance gets a local
          override instead of changing the shared style. */}
      <Text style={liveStyles.overlineOnGradient}>NEXT SERVICE</Text>

      <View style={liveStyles.liveTitleBlock}>
        <Text style={liveStyles.heroTitle}>
          {`${nextService.day}, ${nextService.time}`}
        </Text>
        <Text style={liveStyles.heroCaption}>
          {`${nextService.name} · ${countdownLabel}`}
        </Text>
      </View>

      <PressableScale
        style={liveStyles.primaryBtnWrapper}
        onPress={onAddToCalendar}
        accessibilityRole="button"
        accessibilityLabel={`Add ${nextService.name} to calendar`}
      >
        <View style={liveStyles.primaryBtn}>
          <Ionicons name="calendar-outline" size={15} color={c.navy} />
          <Text style={[liveStyles.primaryBtnText, { color: c.navy }]}>
            Add to Calendar
          </Text>
        </View>
      </PressableScale>
    </LinearGradient>
  );
};

const useHeroStyles = makeThemedStyles((c) => ({
  // A real minimum height: the old card was only as tall as its text, which
  // is fine for a gradient but makes a photo hero look like a cropped strip.
  hero: {
    minHeight: 230,
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    padding: theme.spacing.lg,
  },
  spacer: {
    height: theme.spacing.xxxl,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    height: 26,
    borderRadius: theme.radius.sm,
    // Solid red rather than a translucent scrim: on a photo the badge has to
    // survive whatever is behind it, and red IS the live convention.
    backgroundColor: '#E01B3C',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: c.white,
  },
  ctaSlot: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 46,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.radius.full,
    backgroundColor: c.white,
  },
}));
