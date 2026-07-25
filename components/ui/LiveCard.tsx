import {Text, View, Pressable} from 'react-native'
import {sharedStyles} from "../../constants/styles/sharedStyles"
import {theme} from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { liveStyles } from '../../constants/styles/live.styles';
import { Ionicons } from '@expo/vector-icons';
import { getNextService, services } from '../../data/services';

interface LiveCardProps {
  isLive?: boolean;
}

const { service: nextService, countdownLabel } = getNextService();

// Background is flat navy now, not a bespoke navy→slate gradient — navy's
// one job here is "dark surface," full stop. The pink→purple brand gradient
// is reserved for this card's actual primary action (Play / Add to
// Calendar) instead, which is what theme.ts's own gradient rule already
// says it's for.
export const LiveCard = ({isLive}: LiveCardProps) => {return isLive ? (
          <View style={[liveStyles.liveCard, { backgroundColor: theme.colors.navy }]}>
            <View style={liveStyles.badgePill}>
              <View style={liveStyles.pulseDot} />
              <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.white, fontWeight: theme.fontWeight.medium }}>
                YouTube Live
              </Text>
            </View>

            <Pressable style={liveStyles.playButtonWrapper}>
              <LinearGradient
                colors={theme.gradient.colors}
                start={theme.gradient.start}
                end={theme.gradient.end}
                style={liveStyles.playButton}
              >
                <Ionicons name="play" size={30} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </LinearGradient>
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
            <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.grayIcon }}>
              Second Service · Pst. Abu Jibril
            </Text>
          </View>
        ) : (
          <View style={[liveStyles.liveCard, { backgroundColor: theme.colors.navy }]}>
            <Text style={sharedStyles.overlineText}>NEXT SERVICE</Text>

            <Text style={{ fontSize: theme.fontSize.display, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
              {`${nextService.day}, ${nextService.time}`}
            </Text>
            <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.grayIcon }}>
              {`${nextService.name} · ${countdownLabel}`}
            </Text>

            <Pressable style={liveStyles.addCalendarWrapper}>
              <LinearGradient
                colors={theme.gradient.colors}
                start={theme.gradient.start}
                end={theme.gradient.end}
                style={liveStyles.addCalendarButton}
              >
                <Text style={{ fontSize: theme.fontSize.body, color: theme.colors.white, fontWeight: theme.fontWeight.bold }}>
                  Add to Calendar
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.white} style={{ marginTop: 1.5 }} />
              </LinearGradient>
            </Pressable>
          </View>
        )}