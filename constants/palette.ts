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

  // ---- Fills ----
  // A FILLED control, as opposed to a surface. The distinction only becomes
  // load-bearing in dark mode: in light, a selected chip is navy with white on
  // it and `navy` was reached for directly. `navy` is the primary-TEXT role, so
  // in dark it is near-white and every one of those controls turned into a
  // white slab. These name the job instead.
  /** High-emphasis filled control: selected chip, primary button, badge. */
  fillStrong: string;
  /** Text and icons drawn on `fillStrong`. */
  onFillStrong: string;
  /** Low-emphasis fill: the active tab pill, a hover ground. Translucent so it
   *  works over whatever surface it lands on. */
  fillSubtle: string;
  /** The frame behind artwork while it loads. Dark in BOTH appearances: it
   *  sits under photography, and a light box flashing behind every thumbnail
   *  is the most visible loading artefact a media app can have. */
  mediaPlaceholder: string;
  /** Skeleton block ground, and the sweep that crosses it. */
  skeletonBase: string;
  skeletonSheen: string;
  /** shadowColor. Navy in light (a tinted lift); black in dark, because a
   *  light-coloured shadow on a dark ground is a glow. */
  shadow: string;

  // ---- Ink for surfaces that DO NOT follow the theme ----
  // The mirror image of `mediaPlaceholder`. That token exists because some
  // surfaces are dark in both appearances (artwork frames, the video stage);
  // these exist because some are LIGHT in both — a white pill on the brand
  // gradient, a play disc on a photo. Their background is `white` in both
  // palettes, so their FOREGROUND has to be literal too.
  //
  // This is the `navy` trap in its least obvious form. A white button drawn
  // with `c.navy` text looks perfect in light mode and renders white-on-white
  // in dark (measured: 1.21:1), because `navy` is the primary-TEXT role and
  // inverts. Reaching for these instead is what makes that impossible.
  /** Primary ink on a surface that is light in BOTH appearances. */
  inkOnLight: string;
  /** The brand accent on a surface that is light in BOTH appearances. */
  accentOnLight: string;

  // ---- Accents ----
  /** The accent as a MARK: text, icons, thin rules, progress fills. Lifted in
   *  dark so it stays legible against a dark ground. */
  accent: string;
  /** The accent as a FILL, with `onAccentFill` on top. Deeper than `accent`,
   *  because the two cannot be the same colour and both pass contrast — see
   *  the note in the dark palette. */
  accentFill: string;
  onAccentFill: string;
  accentSecondary: string;
  /** The faintest wash of the accent: a callout card ground. */
  accentWash: string;
  /** A tinted disc behind an accent glyph. */
  accentTint: string;
  /** The border on an accent-washed card. */
  accentTintEdge: string;
  success: string;
  /** Status card grounds: the reading row's "to read" (warm) and "done" states.
   *  These were hardcoded pastels and so had no dark form at all. */
  warmWash: string;
  warmWashEdge: string;
  successWash: string;
  successWashEdge: string;
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

  // Every value here is what the light app ALREADY draws, just named. The
  // components that used to reach for `navy` / `slate` / a hardcoded pastel
  // now reach for these, and light mode renders byte-for-byte as before.
  fillStrong: '#1A3247',            // was: theme.colors.navy
  onFillStrong: '#FFFFFF',
  fillSubtle: 'rgba(40,72,104,0.08)', // was: hardcoded in TabIcon
  mediaPlaceholder: '#284868',      // was: theme.colors.slate
  skeletonBase: '#E9EDF0',          // was: theme.colors.grayBorder
  skeletonSheen: 'rgba(255,255,255,0.55)',
  shadow: '#1A3247',                // was: theme.colors.navy
  inkOnLight: '#1A3247',
  accentOnLight: '#F80068',

  accent: '#F80068',
  accentFill: '#F80068',
  onAccentFill: '#FFFFFF',
  accentSecondary: '#C820F8',
  accentWash: '#FDF2F7',
  accentTint: '#FFE4EE',
  accentTintEdge: '#F8D6E6',
  success: '#0E9F6E',
  warmWash: '#FBF7F0',              // was: hardcoded in TodayReadingRow
  warmWashEdge: '#F0E9DD',
  successWash: '#F1F9F5',
  successWashEdge: '#DCEEE4',
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
// DARK — rebuilt in the visual audit. This is not the first dark palette; it
// replaces one that was technically valid and did not hold together.
//
// WHAT WAS WRONG, and what each fix addresses:
//
// 1. TOO BLUE. The neutrals carried 29-33% saturation at hue 210. That reads as
//    a cold blue-grey product rather than as this app at night, and it fought
//    every warm-toned sermon thumbnail on screen. The ramp now runs 14-24%
//    saturation, and saturation DROPS as lightness rises so the lighter
//    surfaces do not get progressively bluer. The navy identity is carried by
//    hue (still ~210) rather than by intensity.
//
// 2. BORDERS WERE BRIGHTER THAN THE SURFACES THEY BOUNDED. The old `border`
//    (#243342) sat at 20% lightness while `surfaceRaised` sat at 16.9%, so
//    every card was outlined in something lighter than the highest surface in
//    the system. That is why borders "stood out": they were doing elevation's
//    job and winning. The ladder is now strictly monotonic —
//
//      surfaceSunken  6.1%    a recess: search field, unselected segment
//      background     9.0%    the screen
//      surface       12.5%    a card, a row, the tab bar
//      border        16.1%    a hairline ON a card, now BELOW raised
//      surfaceRaised 18.0%    a menu, a popover, a sheet
//      fillStrong    25.1%    a filled control (selected chip, primary button)
//      borderStrong  26.9%    the border that is supposed to be seen
//
//    Elevation is carried by the surface steps; borders only separate.
//
// 3. THE ACCENT WASHES WERE DISCONNECTED. #231320 / #2E1826 / #3D2130 were
//    built by darkening the pink toward black, which lands them in a warm
//    magenta-brown that shares nothing with a hue-210 ground. They are now
//    built in HSL at the ACCENT'S hue with the SURFACE'S restraint (19-30%
//    saturation, lightness a controlled 2-15 points above `surface`), so a
//    tinted card reads as this palette's surface with the accent in it.
//
// 4. ONE ACCENT COULD NOT DO TWO JOBS. Measured across the whole hue: no pink
//    at H338 is simultaneously >=4.5:1 as text on `surface` AND >=4.5:1 with
//    white on top. The lightest that passes as a fill (L46%) reads 3.20:1 as
//    text; the darkest that passes as text (L62%) reads 3.43:1 as a fill. The
//    old single token sat in the middle and failed both (white on #FF3D86 was
//    3.35:1). So the token split: `accent` is the MARK colour, lifted for
//    legibility; `accentFill` is the FILL, kept near the brand pink so large
//    colour areas stay brand-true, with white on it at 4.80:1.
//
// 5. TEXT WAS SLIGHTLY OVERBRIGHT AND UNDER-SEPARATED. Secondary sat at 69%
//    lightness, close enough to primary that long metadata competed with
//    titles. The three tiers are now 92 / 64 / 54, and because the surfaces
//    went darker the muted tier gained contrast while getting dimmer —
//    4.18:1 before, 4.61:1 now, which moves it from large-text-only to a
//    genuine AA.
//
// CONTRAST, MEASURED (WCAG 2.x) on `surface` unless stated:
//   textPrimary    13.61:1  AAA      textPrimary on surfaceRaised  11.38:1 AAA
//   textSecondary   6.38:1  AA       textSecondary on background    7.01:1 AAA
//   textMuted       4.61:1  AA       textPrimary on fillStrong      8.75:1 AAA
//   accent          4.69:1  AA       white on accentFill            4.80:1 AA
//   success         7.79:1  AAA      frost                          6.95:1 AA
//
// Two pairs land below AA and both are deliberate, non-body-text cases:
//   accent on accentTint          4.03:1  an icon on its own tinted disc,
//                                          where the bar is 3:1 for non-text
//   textSecondary on fillStrong   4.10:1  fillStrong carries onFillStrong
//                                          (8.75:1) for its labels; this pair
//                                          is only reachable via a caption
//                                          nothing currently draws
// ---------------------------------------------------------------------------
export const darkPalette: Palette = {
  surfaceSunken: '#0C0F13',
  background: '#12171C',
  surface: '#1A2026',
  surfaceRaised: '#272E35',

  textPrimary: '#E7EAEE',
  textSecondary: '#96A3B0',
  textMuted: '#7C8998',
  textOnAccent: '#FFFFFF',

  border: '#23292F',
  borderStrong: '#3B454E',

  fillStrong: '#36404A',
  onFillStrong: '#E7EAEE',
  // Light-on-dark rather than dark-on-light: a subtle fill in dark mode is a
  // lift, not a shade. Translucent so it composites correctly over the tab
  // bar, a card, or the background without needing three variants.
  fillSubtle: 'rgba(231,234,238,0.08)',
  // Dark in both appearances, and only a little above `surface`: a loading
  // tile should read as part of the card it is in, not as a hole in it.
  mediaPlaceholder: '#1D232B',
  skeletonBase: '#242B32',
  // 0.05, not the light theme's 0.55. A white sheep sweeping across a dark
  // skeleton at light-mode opacity is a strobe.
  skeletonSheen: 'rgba(255,255,255,0.05)',
  // Black, not the light theme's navy. A navy shadow over a dark ground is
  // lighter than the ground and renders as a halo around the element.
  shadow: '#000000',
  // IDENTICAL to the light palette, and that is the entire point: the surfaces
  // these are drawn on are white in both appearances, so their ink must not
  // move either.
  inkOnLight: '#1A3247',
  accentOnLight: '#F80068',

  accent: '#F54284',
  accentFill: '#DF115C',
  onAccentFill: '#FFFFFF',
  accentSecondary: '#CE66EA',
  accentWash: '#2E1F24',
  accentTint: '#3D242D',
  accentTintEdge: '#5A303F',

  success: '#41C89B',
  warmWash: '#2B251D',
  warmWashEdge: '#463B2B',
  successWash: '#1B2C27',
  successWashEdge: '#2A473E',
  frost: '#7FAED2',
  frostFill: 'rgba(127,174,210,0.13)',
  frostBorder: 'rgba(127,174,210,0.34)',

  // Near-black rather than pure black, in the ramp's own hue, so a scrimmed
  // thumbnail edge does not go colder than the surface around it.
  scrim: 'rgba(6,9,12,0.90)',
  statusBar: 'light',

  // ---- Legacy names, re-pointed at the new ramp ----
  // Each maps to the ROLE it was playing in light mode, which is why several
  // of them no longer describe their own pigment. `navy` is the notorious one:
  // it was primary TEXT, so here it is near-white, and any component that used
  // it as a dark SURFACE has been moved to `fillStrong` or `mediaPlaceholder`
  // during this audit rather than left to invert into a white slab.
  navy: '#E7EAEE',
  pinkWash: '#2E1F24',
  pinkTint: '#3D242D',
  pinkTintEdge: '#5A303F',
  slate: '#96A3B0',
  slateLight: '#8492A0',
  graySecondary: '#96A3B0',
  grayIcon: '#7C8998',
  grayBorder: '#23292F',
  bg: '#12171C',
  pink: '#F54284',
  purple: '#CE66EA',
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
