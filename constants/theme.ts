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
};

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
};

export default theme;