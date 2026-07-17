import {View, Text, Pressable} from 'react-native'
import { liveStyles } from '../../constants/styles/live.styles'
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
}

export const MessageCard = ({title, speaker, duration, videoId, series, type, publishedAt}: MessageCardProps) => {
    return(
        <View style={liveStyles.latestMessageRow}>
              <View style={liveStyles.latestMessageThumb}>
                <Ionicons name="play" size={15} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={liveStyles.latestMessageTitle}>{title}</Text>
                <Text style={liveStyles.latestMessageMeta}>
                  {speaker} · {duration}
                </Text>
                <Text style={liveStyles.latestMessageMeta}>
                  {publishedAt} · {series}
                </Text>
              </View>
            </View>
    )
}