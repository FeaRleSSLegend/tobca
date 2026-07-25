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
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    height: 20,
    backgroundColor: theme.colors.slateLight,
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

  // Today's Reading
  readingTeaser: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  readingTeaserLeft: {
    flex: 1,
    padding: theme.spacing.md,
  },
  readingTeaserEyebrow: {
    fontSize: theme.fontSize.caption,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.slate,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  readingTeaserVerse: {
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: theme.spacing.sm,
  },
  // Extracted from an inline object — also fixes the "link looks
  // underweighted" note: more top margin so it reads as its own tappable
  // row instead of a trailing clause of the verse above it.
  readingTeaserCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs, // small tap-target buffer
  },
  readingTeaserCtaText: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.slate,
    fontWeight: theme.fontWeight.bold,
  },
  readingTeaserStreak: {
    width: 70,
    backgroundColor: theme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNum: {
    fontFamily: theme.fontFamily.display,
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  streakLabel: {
    fontSize: 9.5,
    fontWeight: theme.fontWeight.bold,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 2,
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