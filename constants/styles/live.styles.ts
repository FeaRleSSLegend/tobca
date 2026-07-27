// app/(tabs)/live.styles.ts
// Styles specific to the Live screen only. If Library/Prayer/Bible Plan
// ever need one of these, that's the signal to promote it up into
// sharedStyles.ts — don't import from here into another screen.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const liveStyles = StyleSheet.create({
  liveCard: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    height: 20,
    // Was a flat slate fill — now a translucent dark scrim sitting on the
    // gradient card, the same overlay treatment latestMessageDurationBadge
    // already uses for a badge on top of a colored/photo surface.
    backgroundColor: 'rgba(10,22,33,0.35)',
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    backgroundColor: theme.colors.pink,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
  },
  playButtonWrapper: {
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // Solid white, matching CurrentMessageCard's play button and the real
    // site's actual button — a gradient circle on a gradient card would
    // have no visible edge.
    backgroundColor: theme.colors.white,
  },
  addCalendarWrapper: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  addCalendarButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    // Same reasoning as playButton above — solid white instead of a second
    // gradient, so the button reads as a distinct, tappable element instead
    // of disappearing into the card behind it.
    backgroundColor: theme.colors.white,
  },
  // Local override for the one spot sharedStyles.overlineText's pink
  // doesn't work — everywhere else it's pink-on-white, here it's sitting on
  // a card that starts pink itself.
  overlineOnGradient: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
  },

  // This Week's Services strip
  servicePill: {
    borderWidth: 1,
    borderColor: theme.colors.grayBorder, // was 0.05 with no color set — effectively invisible before
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  servicePillToday: {
    // merge with servicePill: [servicePill, isToday && servicePillToday]
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  serviceTime: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.cardTitle,
    color: theme.colors.slate,
  },
  serviceTimeToday: {
    color: theme.colors.white,
  },
  serviceNameToday: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Latest Messages
  latestMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.grayBorder,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  latestMessageThumb: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  latestMessagePlayCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Small dark pill in the thumbnail's corner, the way a real video
  // thumbnail shows its length — this also frees the meta line below from
  // repeating duration as plain text.
  latestMessageDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(10,22,33,0.75)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  latestMessageDurationText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
  latestMessageTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
    marginBottom: theme.spacing.xs,
  },
  latestMessageMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  latestMessageSeriesTag: {
    fontFamily: theme.fontFamily.bodyBold,
    color: theme.colors.slate,
  },
});