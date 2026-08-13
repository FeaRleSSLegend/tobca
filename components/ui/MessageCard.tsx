import {View, Text, Pressable, StyleSheet} from 'react-native'
import { displayTitle, displaySubtitle } from '../../utils/contentGrouping';
import { SmartImage } from './SmartImage';
import { PressableScale } from './motion';
import { liveStyles } from '../../constants/styles/live.styles'
import { theme } from '../../constants/theme'
import { Ionicons } from '@expo/vector-icons'

interface MessageCardProps {
    id: string,
    title: string,
    speaker: string,
    duration?: string,
    videoId?: string,
    series?: string,
    type?: string,
    publishedAt?: string,
    thumbnail?: string,
    onPress?: () => void,
}

// type-based icon, same fix as GridCard's grid tiles — this row is used
// for search results now, where sermons/series/audio/video can all show up
// mixed together and "play" for everything stopped being a useful signal.
// Defaults to 'play' when type isn't passed, so Live tab's existing rows
// (which never pass type) look exactly as they did before.
const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    sermon: 'play',
    series: 'albums',
    audio: 'headset',
    video: 'videocam',
};

export const MessageCard = ({title, speaker, duration, series, type, publishedAt, thumbnail, onPress}: MessageCardProps) => {
    const icon = (type && typeIcon[type]) || 'play';
    // Prefer the SERVICE over the speaker on the meta line. On a church channel
    // every upload has the same speaker, so that line was identical on every
    // row — a full line of type that distinguished nothing. The service does.
    const context = displaySubtitle(title) ?? speaker;
    return(
        <PressableScale
          onPress={onPress}
          style={liveStyles.latestMessageRow}
          accessibilityRole="button"
          accessibilityLabel={`${displayTitle(title)}, ${speaker}${duration ? `, ${duration}` : ''}`}
        >
              <View style={liveStyles.latestMessageThumb}>
                {thumbnail && (
                  <SmartImage uri={thumbnail} style={StyleSheet.absoluteFill} />
                )}
                <View style={liveStyles.latestMessagePlayCircle}>
                  <Ionicons name={icon} size={13} color="#FFFFFF" style={icon === 'play' ? { marginLeft: theme.space.hairline } : undefined} />
                </View>
                {duration && (
                  <View style={liveStyles.latestMessageDurationBadge}>
                    <Text style={liveStyles.latestMessageDurationText}>{duration}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={liveStyles.latestMessageTitle} numberOfLines={2}>{displayTitle(title)}</Text>
                <Text style={liveStyles.latestMessageMeta} numberOfLines={1}>
                  {context}
                  {series ? <Text style={liveStyles.latestMessageSeriesTag}> · {series}</Text> : null}
                  {publishedAt ? ` · ${publishedAt}` : ''}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
            </PressableScale>
    )
}