import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmartImage } from './SmartImage';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';

interface ServiceRowProps {
  message: Message;
  serviceLabel?: string;
  onPress?: () => void;
}

/**
 * List row for the Services collection, revision 2. Revision 1 replaced
 * the thumbnail with a calendar block on the argument that service
 * artwork is near-identical — fair for recognition BETWEEN services, but
 * it threw away pre-attentive processing entirely: people lock onto
 * images before they read a single word, and a text-only list scans
 * slower even when the pictures repeat. This version keeps BOTH signals
 * in one element: the artwork is back as the row's anchor, and the date
 * (still the genuinely differentiating fact) rides on it as a scrim chip
 * — the exact overlay-badge recipe MessageCard already uses for
 * durations, so nothing new is invented. Duration moves to the meta text
 * where it reads fine; the month stays on the section header above.
 */
export const ServiceRow = React.memo(({ message, serviceLabel, onPress }: ServiceRowProps) => {
  const d = new Date(message.publishedAt);
  const day = d.getDate();
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const fullDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${message.title}, ${fullDate}, ${message.duration}`}
    >
      <View style={styles.thumbWrap}>
        {message.thumbnail ? (
          <SmartImage uri={message.thumbnail} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons name="calendar" size={20} color={theme.colors.grayIcon} />
          </View>
        )}
        <View style={styles.dateChip}>
          <Text style={styles.dateChipDay}>{day}</Text>
          <Text style={styles.dateChipMonth}>{monthShort}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{message.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {serviceLabel ? <Text style={styles.serviceTag}>{serviceLabel}</Text> : null}
          {serviceLabel ? ' · ' : ''}
          {message.duration}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.grayBorder,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  thumbWrap: {
    width: 104,
    height: 60,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.slate,
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  // Same translucent-scrim overlay recipe as MessageCard's duration badge
  // — a chip must carry its own contrast when it sits on unpredictable
  // artwork.
  dateChip: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: 'rgba(10,22,33,0.72)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateChipDay: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.body,
    color: theme.colors.white,
  },
  dateChipMonth: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  meta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  serviceTag: {
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.slate,
  },
});
