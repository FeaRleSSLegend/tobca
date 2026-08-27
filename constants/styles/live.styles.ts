// app/(tabs)/live.styles.ts
// Styles specific to the Live screen only. If Library/Prayer/Bible Plan
// ever need one of these, that's the signal to promote it up into
// sharedStyles.ts — don't import from here into another screen.
import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { lightPalette, type Palette } from '../palette';
import { makeThemedSheet } from '../../hooks/useTheme';

// THEMED, with a light-only compatibility export — the same two-exposure
// shape constants/styles/sharedStyles.ts documents, and for the same reason:
// this sheet is read by screens that have been converted and by screens that
// have not, and both have to keep working while the migration finishes.
//
//   useLiveStyles()   follows the active appearance. Use this.
//   liveStyles     frozen against the light palette, for unconverted callers.
const liveStylesFactory = (c: Palette) => StyleSheet.create({
  liveCard: {
    // NO top margin. This is the first card under the greeting header, and
    // sharedStyles.headerRow already ends in 16pt of padding — the 20 here
    // stacked on it for a 36pt gap, the widest on the screen.
    marginTop: 0,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    height: 22,
    // Was a flat slate fill — now a translucent dark scrim sitting on the
    // gradient card, the same overlay treatment latestMessageDurationBadge
    // already uses for a badge on top of a colored/photo surface.
    backgroundColor: 'rgba(10,22,33,0.35)',
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: theme.fontSize.caption,
    color: c.white,
    fontFamily: theme.fontFamily.bodyBold,
    letterSpacing: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    backgroundColor: c.pink,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
  },
  // Title + caption grouped tight, with the group itself carrying the
  // breathing room from the badge above — hierarchy through one gap in
  // the right place instead of margins scattered across four elements.
  liveTitleBlock: {
    marginTop: theme.spacing.sm,
    gap: theme.space.micro,
  },
  heroTitle: {
    fontSize: theme.fontSize.display,
    fontFamily: theme.fontFamily.display,
    color: c.white,
  },
  heroCaption: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.body,
    color: 'rgba(255,255,255,0.85)',
  },
  // One primary-button recipe for BOTH card states ("Watch now" live,
  // "Add to Calendar" upcoming) — solid white, matching the site's own
  // CTA treatment and CurrentMessageCard's play button; a gradient button
  // on a gradient card has no visible edge. Full-width with a label
  // because the card has exactly one action and it should say what it is.
  // THE BUG THIS FIXES: there was no `alignSelf` here. The wrapper is a
  // block-level child of a column flex container, so it inherited
  // alignItems:'stretch' and ran the FULL WIDTH of the card - and `primaryBtn`
  // below centres its content, so a 15pt icon and two words sat marooned in the
  // middle of a card-wide pill with ~120pt of empty white on either side. That
  // is the "huge empty pill" on the service card, and it hit "Watch now" on
  // the live variant identically, because both render this same style.
  //
  // A secondary action HUGS ITS LABEL. LiveCard's hero `ctaSlot` already did
  // this (`alignSelf: 'flex-start'`); this is the same rule applied to the
  // control that needed it.
  primaryBtnWrapper: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  primaryBtn: {
    // One of the three control heights rather than a local minHeight, and its
    // PAIRED horizontal padding - see the `control` note in constants/theme.
    height: theme.control.height.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.control.gap.md,
    backgroundColor: c.white,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.control.padX.md,
  },
  // accentOnLight, NOT `pink`. This label sits on `primaryBtn`, which is
  // `white` in BOTH appearances because it is a pill on the brand gradient.
  // `pink` is lifted for legibility against DARK grounds, so in dark mode it
  // was being drawn at 3.50:1 on white — and the Add to Calendar variant, which
  // overrode this to `navy`, rendered at 1.21:1. White on white.
  primaryBtnText: {
    fontSize: theme.fontSize.body,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.accentOnLight,
  },
  // Local override for the one spot sharedStyles.overlineText's pink
  // doesn't work — everywhere else it's pink-on-white, here it's sitting on
  // a card that starts pink itself.
  overlineOnGradient: {
    fontSize: theme.fontSize.bodyLg,
    color: c.white,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    // Was fontWeight with no fontFamily -> fell back to the system font.
    fontFamily: theme.fontFamily.bodySemibold,
},

  // This Week's Services strip
  servicePill: {
    borderWidth: 1,
    borderColor: c.grayBorder, // was 0.05 with no color set — effectively invisible before
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  servicePillToday: {
    // merge with servicePill: [servicePill, isToday && servicePillToday]
    // fillStrong, not `navy`: this is a FILLED pill, and `navy` is the
    // primary-text role, so in dark it turned into a white slab with white
    // text on it.
    backgroundColor: c.fillStrong,
    borderColor: c.fillStrong,
  },
  serviceTime: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.cardTitle,
    color: c.slate,
  },
  serviceTimeToday: {
    color: c.onFillStrong,
  },
  serviceNameToday: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Latest Messages
  latestMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  latestMessageThumb: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.sm,
    // A frame under artwork. `slateLight` is a TEXT role, so in dark this was
    // a pale grey square behind every thumbnail on Home.
    backgroundColor: c.mediaPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  latestMessagePlayCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentFill,
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
    paddingHorizontal: theme.space.micro,
    paddingVertical: theme.space.hairline,
  },
  latestMessageDurationText: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    color: c.white,
  },
  latestMessageTitle: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.navy,
    marginBottom: theme.spacing.xs,
  },
  latestMessageMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
  latestMessageSeriesTag: {
    fontFamily: theme.fontFamily.bodyBold,
    color: c.slate,
  },
});

/** Themed. Follows the active appearance. Prefer this. */
export const useLiveStyles = makeThemedSheet(liveStylesFactory);
/** @deprecated Light-only. Kept while screens are still being converted. */
export const liveStyles = liveStylesFactory(lightPalette);