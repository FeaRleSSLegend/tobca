import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Message } from '../../data/content';

interface ServiceRowProps {
  message: Message;
  serviceLabel?: string;
  onPress?: () => void;
}

/**
 * List row purpose-built for the Services collection. MessageCard leads
 * with a thumbnail — right for mixed content, wrong here: service
 * recordings all share near-identical channel artwork, so 72pt of every
 * row was spent repeating the same picture while the ONE fact that
 * distinguishes a Sunday recording from the next (its date) hid in a
 * caption. This row inverts that: a calendar block leads (weekday over
 * day number, the way calendar and event apps do it), the month is
 * carried by the section header above, and the meta line keeps service
 * name + duration. Same white-card recipe as MessageCard so the two row
 * types still read as siblings.
 */
export const ServiceRow = React.memo(({ message, serviceLabel, onPress }: ServiceRowProps) => {
  const d = new Date(message.publishedAt);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = d.getDate();
  const fullDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${message.title}, ${fullDate}, ${message.duration}`}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.weekday}>{weekday}</Text>
        <Text style={styles.dayNum}>{dayNum}</Text>
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
  dateBlock: {
    width: 48,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
  },
  weekday: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNum: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.pageTitle,
    color: theme.colors.navy,
    marginTop: 1,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
    marginBottom: theme.spacing.xs,
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
