import { Text, View } from 'react-native'
import { PressableScale } from './motion'
import { theme } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { liveStyles } from '../../constants/styles/live.styles';
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
}

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
export const LiveCard = ({ isLive, title, source = 'youtube', onWatch }: LiveCardProps) => {
  // Recomputed per render, NOT at module load — as a module-level const
  // this was evaluated once when the JS bundle first ran, so the countdown
  // ("in 2 days 3 hrs") silently froze at whatever was true at app launch
  // and the card could keep advertising a service that already happened.
  const { service: nextService, countdownLabel } = getNextService();

  return isLive ? (
    <LinearGradient
      colors={theme.gradient.colors}
      start={theme.gradient.start}
      end={theme.gradient.end}
      style={liveStyles.liveCard}
    >
      <View style={liveStyles.badgePill}>
        <View style={liveStyles.pulseDot} />
        <Text style={liveStyles.badgeText}>LIVE</Text>
      </View>

      <View style={liveStyles.liveTitleBlock}>
        <Text style={liveStyles.heroTitle} numberOfLines={2}>
          {title ?? 'Sunday Service'}
        </Text>
        <Text style={liveStyles.heroCaption}>
          {source === 'youtube' ? 'Streaming live on YouTube' : 'Service in progress'}
        </Text>
      </View>

      <PressableScale
        style={liveStyles.primaryBtnWrapper}
        onPress={onWatch}
        disabled={!onWatch}
        accessibilityRole="button"
        accessibilityLabel="Watch the live stream"
      >
        <View style={liveStyles.primaryBtn}>
          <Ionicons name="play" size={16} color={theme.colors.pink} style={{ marginLeft: 1 }} />
          <Text style={liveStyles.primaryBtnText}>Watch now</Text>
        </View>
      </PressableScale>
    </LinearGradient>
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
        accessibilityRole="button"
        accessibilityLabel={`Add ${nextService.name} to calendar`}
      >
        <View style={liveStyles.primaryBtn}>
          <Ionicons name="calendar-outline" size={15} color={theme.colors.navy} />
          <Text style={[liveStyles.primaryBtnText, { color: theme.colors.navy }]}>
            Add to Calendar
          </Text>
        </View>
      </PressableScale>
    </LinearGradient>
  );
};
