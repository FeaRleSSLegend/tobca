// constants/theme.ts
// Design tokens pulled directly from the OliveBrook logo + UI mockup.
// Every screen/component should import from here — never hardcode a hex value inline.

export const colors = {
  navy: '#1A3247',       // primary text, headers, active nav state, dark surfaces
  slate: '#284868',      // secondary dark, icons, nav bar accents
  slateLight: '#3E617F', // used in gradients (feature card backgrounds)
  graySecondary: '#5C6F80', // body/meta text — passes 4.5:1 contrast on white
  grayIcon: '#8C9BA8',      // inactive icons, placeholders — passes 3:1 minimum
  grayBorder: '#E9EDF0',    // card borders, dividers
  bg: '#F7F8F9',            // screen background
  surface: '#FFFFFF',       // card background

  pink: '#F80068',    // gradient start — logo swoosh
  purple: '#C820F8',  // gradient end — logo swoosh

  white: '#FFFFFF',
  black: '#0A1621',   // media viewport / video background
} as const;

// Gradient as a stop array — pass to expo-linear-gradient's `colors` prop.
// Use ONLY for: live badge, active tab indicator, primary CTA, progress fill.
// Everything else stays navy-on-white — the gradient is the one bold moment.
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

// Two font families only — Space Grotesk for anything with personality
// (headers, titles, numbers), Inter for everything read at length (body, meta).
export const fontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displaySemibold: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
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