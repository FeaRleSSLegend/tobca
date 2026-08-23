// utils/audioArtwork.ts
// Deterministic artwork for audio items that HAVE no artwork.
//
// THE PROBLEM THIS REPLACES
// Every audio surface previously drew the same thing: a pink→purple gradient
// with the same nine-bar waveform on top, repeated for all 546 recordings. At
// row size that is fine; on a shelf of six cards it reads as one asset
// copy-pasted, and the eye stops using the artwork to tell items apart at all
// — which is the only job artwork has in a list.
//
// THE RULE THIS FOLLOWS INSTEAD
// Artwork is DERIVED, never random. Every visual property below comes from a
// hash of a seed string, so the same recording draws the same tile on every
// render, on every device, forever — a list does not shimmer into a different
// arrangement when it re-renders, and a track you recognise in the shelf is
// the same one you recognise in the player.
//
// The seed is the SERIES label when an item belongs to one, and the title
// otherwise. That is deliberate: it makes every part of a teaching series
// share a palette, so a series reads as a set on the shelf and inside the
// queue, while unrelated standalone recordings keep drifting apart.
//
// WHAT IT DOES NOT DO
// It does not pretend to be amplitude data. The curve is a sum of three sine
// harmonics, not a rendering of this file's audio — no waveform is available
// without decoding a 100MB mp3, and a fake one that varies per item would be
// a more convincing lie than the identical bars were.

// ---------------------------------------------------------------------------
// HASH
// FNV-1a, 32-bit. Chosen over anything cleverer because it is eight lines, has
// no dependencies, and distributes short ASCII strings (which is all a title
// ever is) well enough that neighbouring titles in an alphabetical list land
// on different palettes — which is the only distribution property that matters
// here.
// ---------------------------------------------------------------------------
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    // >>> 0 after each step keeps this in unsigned 32-bit space; without it
    // the multiply overflows into float territory and the low bits — the ones
    // every consumer below reads — stop being meaningful.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** A stable value in [0,1) for a given seed and channel. */
function unit(seed: string, channel: number): number {
  return (hashSeed(`${channel}:${seed}`) % 10000) / 10000;
}

export interface AudioPalette {
  /** Gradient start — the dominant colour of the tile. */
  from: string;
  /** Gradient end. */
  to: string;
  /** The colour a wave drawn ON this ground should use for its accent line. */
  ink: string;
}

// ---------------------------------------------------------------------------
// THE PALETTES
//
// All six live on the brand's own axis: pink (#F80068) → purple (#C820F8) →
// navy (#1A3247), plus the two blends between them. Nothing here introduces a
// hue the app does not already use, because "varied" was never a licence to
// leave the palette — a green tile would be more distinguishable and would
// also stop looking like this church's app.
//
// Every pair is a DUOTONE with real separation between its stops, so the tiles
// differ from each other by hue AND by the direction their gradient runs,
// which is what still reads at 44pt in a list row where hue alone is a smudge.
// ---------------------------------------------------------------------------
export const AUDIO_PALETTES: AudioPalette[] = [
  { from: '#F80068', to: '#C820F8', ink: '#FFFFFF' }, // the house gradient
  { from: '#C820F8', to: '#284868', ink: '#FFFFFF' }, // purple into slate
  { from: '#1A3247', to: '#F80068', ink: '#FFFFFF' }, // navy into pink
  { from: '#7A2FB0', to: '#F80068', ink: '#FFFFFF' }, // violet into pink
  { from: '#3E617F', to: '#C820F8', ink: '#FFFFFF' }, // slate into purple
  { from: '#B01E86', to: '#1A3247', ink: '#FFFFFF' }, // magenta into navy
];

/** The palette a seed always resolves to. */
export function paletteFor(seed: string): AudioPalette {
  return AUDIO_PALETTES[hashSeed(seed) % AUDIO_PALETTES.length];
}

/**
 * The seed for an item: its series when it has one (so a series shares a
 * palette), its title otherwise. Kept here rather than at the call sites so
 * every surface — shelf card, list row, mini bar, full player — cannot
 * disagree about what colour a given recording is.
 */
export function artSeed(title: string, seriesLabel?: string | null): string {
  return seriesLabel && seriesLabel.length > 0 ? seriesLabel : title;
}

// ---------------------------------------------------------------------------
// THE WAVE
//
// A sum of three sine harmonics sampled across the tile's width. The seed
// picks each harmonic's amplitude, frequency and phase, so two tiles differ in
// the SHAPE of the curve rather than only in its colour — the difference
// survives being scaled down to a 44pt row thumbnail, which a hue shift alone
// does not.
//
// Frequencies stay low (roughly 0.6–3 cycles across the tile). Anything faster
// aliases into a jagged mess once the tile is small, and anything slower is a
// straight line.
// ---------------------------------------------------------------------------
interface Harmonic {
  amp: number;
  freq: number;
  phase: number;
}

function harmonicsFor(seed: string): Harmonic[] {
  return [0, 1, 2].map((i) => ({
    // Later harmonics are quieter, so the curve keeps one readable primary
    // swell instead of becoming noise.
    amp: (0.34 + unit(seed, i * 3 + 1) * 0.3) / (i + 1),
    freq: 0.6 + unit(seed, i * 3 + 2) * 2.4 + i * 0.8,
    phase: unit(seed, i * 3 + 3) * Math.PI * 2,
  }));
}

const SAMPLES = 48;

/**
 * An SVG path for one wave band, as a CLOSED shape filled down to the bottom
 * of the box — a filled band reads as a solid form at thumbnail size where a
 * 1pt stroke disappears.
 *
 * @param offset shifts the whole curve vertically as a fraction of height, so
 *   two bands from the same seed can be stacked at different depths.
 */
export function wavePath(
  seed: string,
  width: number,
  height: number,
  offset = 0
): string {
  const harmonics = harmonicsFor(seed);
  const mid = height * (0.52 + offset);
  // Amplitude budget: the curve must never clip the top of the box, or the
  // flat cut across the crest looks like a rendering bug.
  const span = height * 0.3;

  const points: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = t * width;
    let y = 0;
    for (const h of harmonics) y += h.amp * Math.sin(t * Math.PI * 2 * h.freq + h.phase);
    points.push(`${x.toFixed(1)} ${(mid + y * span).toFixed(1)}`);
  }

  // M first, L through the samples, then down the right edge, along the
  // bottom and closed — the fill region.
  return `M${points[0]}L${points.slice(1).join('L')}L${width.toFixed(1)} ${height.toFixed(
    1
  )}L0 ${height.toFixed(1)}Z`;
}

export interface WaveBand {
  d: string;
  opacity: number;
}

// ---------------------------------------------------------------------------
// THE CACHE, AND WHY IT IS NOT OPTIONAL
//
// One tile is three bands x 49 samples x 3 harmonics = ~440 Math.sin calls
// plus the string building around them. That is trivial once. It was not being
// done once: the Library's audio page draws roughly twenty tiles at a time
// (two shelves of six, plus the visible rows), and it re-rendered on every
// playback status update — twice a second — because the player's position sat
// in the same React context the lists read from. ~9,000 sin calls and twenty
// path strings, 2Hz, on the JS thread, is what produced React Native's
// "VirtualizedList: large list slow to update" warning and the stall when
// opening the Audio tab.
//
// The context split in providers/AudioFileProvider is the real fix for the
// frequency. This is the fix for the cost: the output is a pure function of
// (seed, width, height), so it is computed once per distinct tile and then
// never again. Bounded because the inputs are — a few hundred titles across
// four fixed sizes — and entries are worth keeping for the session, since
// scrolling back up a list asks for exactly the same tiles again.
// ---------------------------------------------------------------------------
const bandCache = new Map<string, WaveBand[]>();

/**
 * The three stacked bands one tile draws, back to front, with the opacity each
 * should be painted at. Three is the point where the tile reads as depth
 * rather than as a single line; a fourth stops being distinguishable.
 *
 * Deterministic, and cached on that basis — see above.
 */
export function waveBands(seed: string, width: number, height: number): WaveBand[] {
  const key = `${seed}|${Math.round(width)}|${Math.round(height)}`;
  const hit = bandCache.get(key);
  if (hit) return hit;

  const bands: WaveBand[] = [
    { d: wavePath(seed, width, height, 0.16), opacity: 0.18 },
    { d: wavePath(`${seed}~b`, width, height, 0.06), opacity: 0.3 },
    { d: wavePath(`${seed}~c`, width, height, -0.04), opacity: 0.5 },
  ];
  bandCache.set(key, bands);
  return bands;
}
