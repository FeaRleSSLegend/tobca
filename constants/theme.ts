// constants/theme.ts
// Design tokens pulled directly from the OliveBrook logo + UI mockup.
// Every screen/component should import from here — never hardcode a hex value inline.

export const colors = {
  // One job, kept narrow on purpose: primary text/headers/active nav state
  // on light backgrounds, plus small, specific accents (an icon, a pill, a
  // caption) — not full-card or full-screen backgrounds. Pulled from
  // theolivebrookchurch.org's own real usage: navy shows up in body copy,
  // captions and button labels, never as a big colored block. When a hero
  // moment needs a bold background, reach for `gradient` (pink→purple)
  // instead — that's the color the site spends its "big chunk" budget on.
  navy: '#1A3247',
  slate: '#284868',      // secondary dark, icons, nav bar accents
  slateLight: '#3E617F', // used in gradients (feature card backgrounds)
  graySecondary: '#5C6F80', // body/meta text — passes 4.5:1 contrast on white
  grayIcon: '#8C9BA8',      // inactive icons, placeholders — passes 3:1 minimum
  grayBorder: '#E9EDF0',    // card borders, dividers
  bg: '#F7F8F9',            // screen background
  surface: '#FFFFFF',       // card background

  pink: '#F80068',    // gradient start — logo swoosh
  purple: '#C820F8',  // gradient end — logo swoosh
  success: '#0E9F6E', // "read"/completed state — deliberately not Material's default
                       // #4CAF50; sits closer to the navy/pink palette than a
                       // generic framework green would

  // ---- Accent tints ----
  // The app has ONE accent (pink), and these are the light washes of it used
  // for a tinted disc behind an icon or a soft callout card. They were being
  // written as raw hex at five call sites - #FDF2F7 twice, #FFE4EE twice and
  // #F8D6E6 once - which is how a single accent quietly becomes three.
  pinkWash: '#FDF2F7',    // faintest: callout card backgrounds
  pinkTint: '#FFE4EE',    // tinted disc behind a pink glyph
  pinkTintEdge: '#F8D6E6', // border on a pink-washed card

  // ---- Frost ----
  // Streak freezes only. Deliberately a desaturated blue rather than a fourth
  // brand colour: it has to be instantly distinguishable from the success
  // green and the pink accent at a glance, in a 32pt circle, without becoming
  // an identity of its own. Defined once here because it appears in three
  // components (the hero chip, the week strip, the detail sheet) and they must
  // agree exactly - a frozen day that looks slightly different in the sheet
  // than on the card reads as a different kind of day.
  frost: '#5B8DB8',
  frostFill: 'rgba(91,141,184,0.12)',
  frostBorder: 'rgba(91,141,184,0.35)',

  white: '#FFFFFF',
  black: '#0A1621',   // media viewport / video background
} as const;

// Gradient as a stop array — pass to expo-linear-gradient's `colors` prop.
// This IS the app's bold color, in the same proportion the real site uses
// it: pink carries the big colored moments, purple rides along as its
// second stop, navy stays reserved for text. Use for: hero-card backgrounds
// (one per screen, not stacked), live badges, active tab indicator, primary
// CTAs, progress fills. Everything else — body copy, secondary cards,
// utility chrome like the sticky audio bar — stays navy-text-on-white so
// the gradient reads as a genuine highlight instead of wallpaper.
export const gradient = {
  colors: [colors.pink, colors.purple] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0.3 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ---------------------------------------------------------------------------
// SPACING SCALE (Refactoring UI).
//
// The scale above is linear-ish through its middle — 12, 16, 20, 24 are all
// within 4pt of a neighbour. Refactoring UI's point is that a scale whose
// adjacent steps are barely distinguishable forces ARBITRARY choices: there is
// no meaningful reason to pick 20 over 24, so different screens picked
// differently and the app's vertical rhythm ended up looking random rather
// than composed. The audit found exactly that on Home (gaps of 90/35/55/90
// between stacked blocks) and on Plan.
//
// These are the LAYOUT steps — deliberately few, deliberately far apart, so
// each one means something and two of them can never be confused:
//   tight    relationship: label to the thing it labels
//   related  same group, different element
//   section  one section to the next
//   major    a change of subject on the page
// Component-internal padding still uses `spacing`; this governs the gaps
// BETWEEN blocks, which is what the eye reads as rhythm.
// ---------------------------------------------------------------------------
export const space = {
  /** Hairline offset — optical nudges only (a label off its value), not a gap. */
  hairline: 2,
  /** The smallest real gap: glyph to its own caption inside one element. */
  micro: 4,
  /** Label to the thing it labels; icon to its text. */
  tight: 8,
  /** Same group, different element. */
  related: 16,
  /** A section header to its own content. */
  header: 12,
  /** One section to the next — the page's main rhythm. */
  section: 24,
  /** A change of subject. */
  major: 40,
} as const;

// ---------------------------------------------------------------------------
// WHY `space` EXISTS ALONGSIDE `spacing`
//
// `spacing` is 4/8/12/16/20/24/32 — its middle is nearly linear, so 12, 16 and
// 20 are within 4pt of a neighbour and nothing distinguishes them at a glance.
// Refactoring UI's point is that a scale whose steps are indistinguishable
// forces ARBITRARY choices: there was no reason to pick 20 over 24, so
// different screens picked differently and the page rhythm looked random.
//
// `space` is the LAYOUT scale: few steps, far apart, each with a stated
// meaning, so "which gap goes here" has one answer. `spacing` stays for
// component-internal padding, where fine steps are genuinely useful.
//
// The rule that matters most: space BETWEEN groups must exceed space WITHIN
// them. section (24) > header (12) > tight (8) encodes that directly.
// ---------------------------------------------------------------------------

export const radius = {
  sm: 12,   // small cards, pills
  md: 14,   // standard cards
  lg: 24,   // hero banner bottom corners
  full: 999, // pills, badges, circular buttons
};

export const fontSize = {
  caption: 12,   // strict floor — tags, meta, labels. Never go below this.
  body: 13,
  bodyLg: 14,
  cardTitle: 17,
  sectionHeading: 18,
  pageTitle: 20,
  heroTitle: 20,
  display: 23,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Two font families for UI chrome — Space Grotesk for anything with
// personality (headers, titles, numbers), Inter for everything read at
// length in-app (body, meta). A third, serif family is used ONLY inside
// the dedicated full-screen reading view (app/reading.tsx) — scripture
// text gets a different typographic treatment than app chrome on purpose,
// the same way YouVersion/Bible apps consistently do. Don't reach for
// these outside that screen.
export const fontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  serif: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  serifSemibold: 'Lora_600SemiBold',
};

export const layout = {
  screenPadding: 16,
  tabBarHeight: 83,       // Apple HIG standard incl. safe-area clearance
  tabTapTarget: 48,       // minimum touch target, WCAG 2.2 AA
  cardBorderWidth: 1,

  // ---- Horizontal shelf cards ----
  // Every shelf on Library scrolls sideways, and every one of them used to
  // pick its own card width: posters at 126, playlist tiles at 150, the
  // Recently Added wrapper at 148. Three widths within 24pt of each other is
  // the worst case — too close to read as deliberate variety, far enough that
  // the left edges of successive shelves never line up as you scroll down.
  //
  // One width for all of them. The artwork is 16:9 in every case (they are all
  // YouTube thumbnails), so the height is derived rather than declared, and
  // the text stack below sits on a common baseline across shelves.
  //
  // 148 is chosen for the PEEK: at a 390pt screen with 16pt page padding and
  // a 16pt gap, two cards and a clear slice of the third are visible, which is
  // what tells you the shelf scrolls without needing an affordance.
  rowCard: {
    width: 148,
    height: Math.round((148 * 9) / 16),
    gap: 16,
  },

  // ---- Scroll clearance ----
  // How much empty space a scroll view needs BELOW its last item. This was
  // hardcoded per screen and every screen picked differently: 32 here, 64
  // there, 110 on Prayer, 80 on Socials — so the last card sat at a different
  // height above the bottom on every tab, and on some screens it sat flush
  // under the tab bar with nothing behind it.
  //
  // Two values, because there are two situations and only two:
  scrollClearance: {
    /** Inside (tabs): must clear the tab bar AND the floating mini-player,
     *  which is taller than the bar and overlaps the last row when docked. */
    tab: 120,
    /** A pushed screen: no tab bar, so this is just a generous end-of-content
     *  margin. Safe-area insets are added on top where the content can scroll
     *  under the home indicator. */
    stack: 64,
  },
};


// ---------------------------------------------------------------------------
// EDITORIAL SCALE — added in the taste pass.
//
// The reference readers (Hebrews 11, Apple Books, the dark chapter-pill Bible)
// share one move: scripture is set like a BOOK, not like app UI. That needs
// three things the app's UI scale doesn't carry, because they'd be wrong for a
// card label:
//   - display sizes far larger than `display: 23`, for a masthead you meet
//     before you start reading;
//   - NEGATIVE tracking on those large sizes (type set large looks loose at
//     0 tracking) and POSITIVE tracking on small caps labels (set small it
//     looks cramped) — the opposite corrections, which is why one token can't
//     serve both;
//   - a measured line-height for long-form reading, looser than UI text.
//
// Kept as a separate group rather than extending fontSize so nothing existing
// re-renders: these are additive.
// ---------------------------------------------------------------------------
export const editorial = {
  // Masthead sizes for the reader.
  mastheadLabel: 13,   // "OLD TESTAMENT" — small caps, tracked open
  mastheadTitle: 34,   // "Psalm 13-15"  — the thing you actually came for
  // Tracking. Large type tightens, small caps opens up.
  trackTight: -0.6,
  trackLabel: 1.6,
  // Long-form reading. 1.7 was already close; 1.75 with a slightly wider
  // paragraph gap is the difference between "readable" and "restful".
  readingLineHeight: 1.75,
  verseGap: 18,
} as const;

// Bundled export so you can do: import { theme } from '@/constants/theme'
export const theme = {
  colors,
  gradient,
  spacing,
  radius,
  fontSize,
  fontWeight,
  fontFamily,
  layout,
  editorial,
  space,
};

export default theme;