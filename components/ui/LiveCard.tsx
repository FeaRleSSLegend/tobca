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

export const LiveCard = ({isLive}: LiveCardProps) => {return isLive ? (
          <LinearGradient
            colors={[theme.colors.navy, theme.colors.slate]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={liveStyles.liveCard}
          >
            <View style={liveStyles.badgePill}>
              <View style={liveStyles.pulseDot} />
              <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.white, fontWeight: theme.fontWeight.medium }}>
                YouTube Live
              </Text>
            </View>

            <Pressable style={liveStyles.playButton}>
              <Ionicons name="play" size={30} color="#FFFFFF" style={{ marginLeft: 3 }} />
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
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={[theme.colors.navy, theme.colors.slate]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={liveStyles.liveCard}
          >
            <Text style={sharedStyles.overlineText}>NEXT SERVICE</Text>

            <Text style={{ fontSize: theme.fontSize.display, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
              {`${nextService.day}, ${nextService.time}`}
            </Text>
            <Text style={{ fontSize: theme.fontSize.caption, color: theme.colors.grayIcon }}>
              {`${nextService.name} · ${countdownLabel}`}
            </Text>

            <Pressable style={liveStyles.addCalendarButton}>
              <Text style={{ fontSize: theme.fontSize.body, color: theme.colors.white, fontWeight: theme.fontWeight.medium }}>
                Add to Calendar
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.white} style={{ marginTop: 2.5 }} />
            </Pressable>
          </LinearGradient>
        )}