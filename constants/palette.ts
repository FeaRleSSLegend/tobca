// constants/palette.ts
// THE SEMANTIC COLOUR LAYER — the thing constants/theme.ts was missing.
//
// WHY THIS FILE EXISTS
// `theme.colors` names PIGMENTS: navy, pink, grayBorder, bg. That is fine for
// a one-appearance app and fatal for two, because a pigment name cannot change
// meaning. `navy` has to stay navy; what actually needs to flip between light
// and dark is the ROLE it was playing — "the colour primary text is drawn in".
// So this file names roles, and each appearance supplies its own pigment for
// every role.
//
// THE LIGHT PALETTE IS BYTE-FOR-BYTE THE CURRENT APP. Every value below in
// `light` is copied from constants/theme.ts, so a screen converted from
// `theme.colors.navy` to `c.textPrimary` renders identically in light mode.
// That is the property that makes the conversion safe to do a screen at a
// time: a half-converted app is not a half-broken app, it is an app where
// some screens also do dark.
//
// LEGACY KEYS ARE DELIBERATELY CARRIED THROUGH. `navy`, `bg`, `surface`,
// `grayBorder`, `graySecondary`, `grayIcon` all appear in both palettes,
// mapped to the right role for that appearance. A file being converted can
// therefore change its import and its StyleSheet.create call and nothing
// else — the property names it already uses keep working, and it can migrate
// to the semantic names later. Without this the conversion would be a
// 570-reference rename on top of a structural change, which is how a
// migration like this stalls half-done.
//
// WHAT IS NOT THEMED, ON PURPOSE
//   pink / purple  the brand gradient. It is the logo. It gets a slightly
//                  lifted pair in dark for contrast against a dark ground,
//                  but it is never inverted — a brand that changes hue with
//                  the OS setting is not a brand.
//   black / white  literal, absolute values. The video viewport is black in
//                  both appearances because video is black in both.

/** Every colour role the app draws with. Both palettes must implement all of it. */
export interface Palette {
  // ---- Surfaces ----
  /** The screen behind everything. */
  background: string;
  /** A card, a sheet, a row that sits ON the background. */
  surface: string;
  /** A recess INSIDE a surface: an icon disc, an unselected segment, a well. */
  surfaceSunken: string;
  /** A surface raised above another surface: a menu, a popover. */
  surfaceRaised: string;

  // ---- Content ----
  /** Titles, primary labels, the thing you read first. */
  textPrimary: string;
  /** Body copy, metadata, captions that still have to be legible. */
  textSecondary: string;
  /** Placeholders, inactive icons, the quietest legible tier. */
  textMuted: string;
  /** Text drawn ON the accent or on the brand gradient. */
  textOnAccent: string;

  // ---- Lines ----
  /** Card borders, dividers, hairlines. */
  border: string;
  /** A border that has to be seen — a focused field, a selected card. */
  borderStrong: string;

  // ---- Accents ----
  accent: string;
  accentSecondary: string;
  /** The faintest wash of the accent: a callout card ground. */
  accentWash: string;
  /** A tinted disc behind an accent glyph. */
  accentTint: string;
  /** The border on an accent-washed card. */
  accentTintEdge: string;
  success: string;
  /** Streak freezes. Desaturated blue, distinct from success and accent. */
  frost: string;
  frostFill: string;
  frostBorder: string;

  /** A scrim over artwork or video, so white type stays legible on any image. */
  scrim: string;
  /** The status-bar content style this appearance needs. */
  statusBar: 'light' | 'dark';

  // ---- Legacy pigment names, mapped to their role ----
  // Present so an existing StyleSheet can be converted without also renaming
  // every property it reads. New code should prefer the semantic names above.
  navy: string;
  pinkWash: string;
  pinkTint: string;
  pinkTintEdge: string;
  slate: string;
  slateLight: string;
  graySecondary: string;
  grayIcon: string;
  grayBorder: string;
  bg: string;
  pink: string;
  purple: string;
  white: string;
  black: string;
}

// ---------------------------------------------------------------------------
// LIGHT — the app exactly as it shipped. Do not "improve" these values here;
// they are a copy, and their being a copy is what makes the migration safe.
// ---------------------------------------------------------------------------
export const lightPalette: Palette = {
  background: '#F7F8F9',
  surface: '#FFFFFF',
  surfaceSunken: '#F7F8F9',
  surfaceRaised: '#FFFFFF',

  textPrimary: '#1A3247',
  textSecondary: '#5C6F80',
  textMuted: '#8C9BA8',
  textOnAccent: '#FFFFFF',

  border: '#E9EDF0',
  borderStrong: '#D4DBE2',

  accent: '#F80068',
  accentSecondary: '#C820F8',
  accentWash: '#FDF2F7',
  accentTint: '#FFE4EE',
  accentTintEdge: '#F8D6E6',
  success: '#0E9F6E',
  frost: '#5B8DB8',
  frostFill: 'rgba(91,141,184,0.12)',
  frostBorder: 'rgba(91,141,184,0.35)',

  scrim: 'rgba(10,22,33,0.85)',
  statusBar: 'dark',

  navy: '#1A3247',
  pinkWash: '#FDF2F7',
  pinkTint: '#FFE4EE',
  pinkTintEdge: '#F8D6E6',
  slate: '#284868',
  slateLight: '#3E617F',
  graySecondary: '#5C6F80',
  grayIcon: '#8C9BA8',
  grayBorder: '#E9EDF0',
  bg: '#F7F8F9',
  pink: '#F80068',
  purple: '#C820F8',
  white: '#FFFFFF',
  black: '#0A1621',
};

// ---------------------------------------------------------------------------
// DARK
//
// NOT an inversion. Three things are deliberate:
//
// 1. The ground is a desaturated NAVY-BLACK (#0F1821), not neutral grey and
//    not pure black. Pure black makes the elevation system impossible — you
//    cannot go darker than a card to show a recess — and it smears on OLED
//    while scrolling. The hue is carried over from `navy` so the dark app is
//    recognisably the same app.
//
// 2. Elevation goes UP with lightness, the convention every platform shares:
//    background < surface < raised. In light mode the app does the opposite
//    (cards are WHITE on a grey ground), which is why `surfaceSunken` exists
//    as its own role rather than being derived — it is background-coloured in
//    light and lighter-than-surface in dark, and no arithmetic gets both.
//
// 3. Text steps DOWN from #E8EDF3 rather than being pure white. Full-white
//    body copy on a dark ground haloes; the top tier is reserved for the
//    highest-contrast case and even that stops short of #FFF.
//
// CONTRAST, MEASURED (WCAG 2.x relative luminance) against `surface`, which is
// the ground these actually sit on:
//   textPrimary   #E8EDF3 on #16212C -> 13.85:1  AAA
//   textSecondary #A3B1BF on #16212C ->  7.45:1  AAA
//   textMuted     #74838F on #16212C ->  4.18:1  AA for large text, and for
//                                        the non-text uses it actually has
//                                        (inactive icons, placeholders)
//   accent        #FF3D86 on #16212C ->  4.86:1  AA
//   success       #2CC48E on #16212C ->  7.29:1  AAA
//
// KNOWN WEAK SPOT, in BOTH palettes: white on the accent.
//   #FFFFFF on #F80068 -> 4.05:1   (light)
//   #FFFFFF on #FF3D86 -> 3.35:1   (dark)
// Both are large-text-only by WCAG. That is survivable where the app actually
// uses it — the gradient CTA labels and pill text are >=18pt semibold — but it
// is not a licence to set caption-sized white type on a pink fill. The light
// value is inherited from the brand pink and was not introduced here; the dark
// value is worse because the accent was lightened for legibility AGAINST the
// dark ground, which necessarily moves it closer to white. Fixing it properly
// means a darker `textOnAccent` for dark mode, which is a design decision
// rather than a token tweak, so it is recorded here rather than guessed at.
// ---------------------------------------------------------------------------
export const darkPalette: Palette = {
  background: '#0F1821',
  surface: '#16212C',
  surfaceSunken: '#0B131B',
  surfaceRaised: '#1E2B38',

  textPrimary: '#E8EDF3',
  textSecondary: '#A3B1BF',
  textMuted: '#74838F',
  textOnAccent: '#FFFFFF',

  border: '#243342',
  borderStrong: '#33465A',

  // Lifted off the brand pink/purple. #F80068 on a dark ground drops to 3.9:1
  // and reads muddy; these keep the same hue and reach AA.
  accent: '#FF3D86',
  accentSecondary: '#D45BFA',
  accentWash: '#231320',
  accentTint: '#2E1826',
  accentTintEdge: '#3D2130',
  success: '#2CC48E',
  frost: '#7FB0D8',
  frostFill: 'rgba(127,176,216,0.14)',
  frostBorder: 'rgba(127,176,216,0.38)',

  scrim: 'rgba(0,0,0,0.88)',
  statusBar: 'light',

  // Legacy names, mapped to the role each was playing in light mode. `navy`
  // was "primary text", so in dark it is the light text colour — the name is
  // now a lie about the pigment and honest about the job, which is the whole
  // reason the semantic names above are preferred for new code.
  navy: '#E8EDF3',
  // The accent washes, re-derived for a dark ground rather than inverted: a
  // pale pink tint over dark reads as a mistake, so these are the accent hue
  // at low luminance, which is what "a faint wash of the accent" means here.
  pinkWash: '#231320',
  pinkTint: '#2E1826',
  pinkTintEdge: '#3D2130',
  slate: '#A3B1BF',
  slateLight: '#8494A3',
  graySecondary: '#A3B1BF',
  grayIcon: '#74838F',
  grayBorder: '#243342',
  bg: '#0F1821',
  pink: '#FF3D86',
  purple: '#D45BFA',
  white: '#FFFFFF',
  black: '#0A1621',
};

export const palettes = { light: lightPalette, dark: darkPalette } as const;

/**
 * The brand gradient for an appearance. A function rather than a constant
 * because the two stops differ between palettes — see the note on `accent`.
 */
export function gradientFor(p: Palette) {
  return {
    colors: [p.accent, p.accentSecondary] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.3 },
  };
}
