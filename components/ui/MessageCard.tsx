import {View, Text, Pressable} from 'react-native'
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
    onPress?: () => void,
}

export const MessageCard = ({title, speaker, duration, series, publishedAt, onPress}: MessageCardProps) => {
    return(
        <Pressable onPress={onPress} style={liveStyles.latestMessageRow}>
              <View style={liveStyles.latestMessageThumb}>
                <View style={liveStyles.latestMessagePlayCircle}>
                  <Ionicons name="play" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
                </View>
                {duration && (
                  <View style={liveStyles.latestMessageDurationBadge}>
                    <Text style={liveStyles.latestMessageDurationText}>{duration}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={liveStyles.latestMessageTitle} numberOfLines={2}>{title}</Text>
                <Text style={liveStyles.latestMessageMeta} numberOfLines={1}>
                  {speaker}
                  {series ? <Text style={liveStyles.latestMessageSeriesTag}> · {series}</Text> : null}
                  {publishedAt ? ` · ${publishedAt}` : ''}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
            </Pressable>
    )
}