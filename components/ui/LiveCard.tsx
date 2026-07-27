import {Text, View, Pressable} from 'react-native'
import {theme} from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { liveStyles } from '../../constants/styles/live.styles';
import { Ionicons } from '@expo/vector-icons';
import { getNextService, services } from '../../data/services';

interface LiveCardProps {
  isLive?: boolean;
}

const { service: nextService, countdownLabel } = getNextService();

// This is the first thing anyone sees on the app — same move as
// CurrentMessageCard and FocusCard: flat navy panel -> the pink/purple
// gradient, matching how boldly the real site treats its own hero. Two
// things that used to sit ON TOP of a navy card needed to change once the
// card itself became the gradient, or they'd have vanished into it:
//   - the Play button was gradient-filled; now a white circle + pink icon,
//     same as the real site's actual play button and Library's card.
//   - "Add to Calendar" was gradient-filled too; a gradient button on a
//     gradient card has ~no visible edge, so it's now solid white with
//     navy text, mirroring the site's own white CTA boxes.
// The status pills (YouTube Live / LIVE NOW) switched from a flat slate
// fill to a translucent dark scrim, the same overlay treatment already
// used for duration badges on colored/photo thumbnails elsewhere.
export const LiveCard = ({isLive}: LiveCardProps) => {
  return isLive ? (
    <LinearGradient
      colors={theme.gradient.colors}
      start={theme.gradient.start}
      end={theme.gradient.end}
      style={liveStyles.liveCard}
    >
      <View style={liveStyles.badgePill}>
        <View style={liveStyles.pulseDot} />
        <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.white, fontWeight: theme.fontWeight.medium }}>
          YouTube Live
        </Text>
      </View>

      <Pressable style={liveStyles.playButtonWrapper}>
        <View style={liveStyles.playButton}>
          <Ionicons name="play" size={26} color={theme.colors.pink} style={{ marginLeft: 3 }} />
        </View>
      </Pressable>

      <View style={[liveStyles.badgePill, { marginTop: theme.spacing.xxxl }]}>
        <View style={liveStyles.pulseDot} />
        <Text style={{ fontSize: theme.fontSize.body, color: theme.colors.white, fontWeight: theme.fontWeight.bold }}>
          LIVE NOW
        </Text>
      </View>

      <Text style={{ fontSize: theme.fontSize.display, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
        Sunday Service
      </Text>
      <Text style={{ fontSize: theme.fontSize.caption, color: 'rgba(255,255,255,0.8)' }}>
        Second Service · Pst. Abu Jibril
      </Text>
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

      <Text style={{ fontSize: theme.fontSize.display, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
        {`${nextService.day}, ${nextService.time}`}
      </Text>
      <Text style={{ fontSize: theme.fontSize.caption, color: 'rgba(255,255,255,0.8)' }}>
        {`${nextService.name} · ${countdownLabel}`}
      </Text>

      <Pressable style={liveStyles.addCalendarWrapper}>
        <View style={liveStyles.addCalendarButton}>
          <Text style={{ fontSize: theme.fontSize.body, color: theme.colors.navy, fontWeight: theme.fontWeight.bold }}>
            Add to Calendar
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.navy} style={{ marginTop: 1.5 }} />
        </View>
      </Pressable>
    </LinearGradient>
  );
};
