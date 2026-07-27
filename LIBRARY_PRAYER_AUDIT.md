# Library + Prayer audit — findings & fixes

Same pass as the earlier Live/Bible Plan session, applied to `app/(tabs)/library.tsx`,
`app/(tabs)/prayer.tsx`, and the shared components they depend on.

## Component inventory first

Used by Library/Prayer (all kept, several fixed): `SearchBar`, `FilterPill`,
`CurrentMessageCard`, `HScroll`, `PosterCard`, `GridCard`, `SectionLabel`,
`FocusCard`, `DocCard`, `AudioPlayer`, `MessageCard` (via SearchBar's inline
results).

Dead code found while checking usage, deleted:
- `components/ui/Card.tsx`, `Chip.tsx`, `MediaViewport.tsx` — empty (0-byte) stub files, never imported.
- `components/ui/ReadingCard.tsx` — orphaned; was the old "Today's Reading" card, superseded when Live tab's own reading teaser was cut in the previous pass. Unimported anywhere.
- `components/bible/StatsBar.tsx`, `CompactReading.tsx` — unimported. `StatsBar` was the exact thing `StatBox`'s own code comment says it replaced; it just never got deleted.

## Findings → fixes

### 1. Redundant double-labeling — `CurrentMessageCard.tsx`
`library.tsx:52-53` puts a `SectionLabel label="Current Message"` directly above
the card, and the card's own internal eyebrow said "NOW STREAMING" in the same
uppercase/bold/letter-spaced treatment — two labels for the same idea back to
back. Fix: quieted the internal eyebrow to plain sentence-case text (same
technique used on `TodayCard.dayCount` in the previous pass), so the outer
SectionLabel carries the section identity and the card doesn't repeat it at
the same visual volume.

### 2. Contradictory copy — `prayer.tsx`
The "Live Prayer Audio — Coming Soon" tag sat a few lines above a fully
interactive `AudioPlayer` (`isPlaying` state, working play/pause) whose own
subtitle already reads "Streaming audio · Tap to expand." One screen was
telling the user the same feature both exists and doesn't. Removed the tag;
the player itself is the signal. The gap it left doubles as the breathing-room
pause Live and Bible Plan both insert after their hero moment, which Prayer
was missing.

### 3. Sub-44pt touch targets
Confirmed and fixed (matches the touch-target sweep from the previous pass):
- `FilterPill` — pill was ~33pt tall. Added `hitSlop={8}` rather than growing the pill visually.
- `SectionLabel`'s "See All" link — text-only Pressable, no padding, used on **every** tab. Added `hitSlop={8}`; benefits Live/Plan too since it's shared.
- `CurrentMessageCard`'s play button — 36×36 with no hitSlop, unlike the button `VerseOfDayCard` set the precedent for. Added `hitSlop={8}`.
- `FocusCard`'s "View Full Focus →" link — text-only, no padding. Added `hitSlop={8}`.
- `AudioPlayer`'s play/pause control — 20pt icon in 4pt padding (~28pt total), the single most important control on the Prayer screen. Padding bumped to `theme.spacing.md` (12pt), landing exactly on 44pt.

### 4. Off-token / hardcoded values
`library.styles.ts` had a leftover placeholder comment ("check your actual
token name...") and several hand-typed numbers that don't sit on the spacing
scale (10, 11, 14, 6px against the 4/8/12/16/20/24/32 scale). `GridCard.tsx`
had a 12.5pt title size (splitting the difference between tokens) and 11pt
meta text — one point under the caption floor theme.ts documents as a "strict
floor... never go below this." `AudioPlayer.tsx` had the same 11pt violation
plus a handful of untokenized spacing/radius values. All mapped onto existing
tokens; no new values introduced.

### 5. Wrong token for the job — `library.styles.ts`
`searchBar.borderColor` used `theme.colors.grayIcon`, which theme.ts documents
as reserved for "inactive icons, placeholders." `grayBorder` is the documented
token for card/field borders and is what every other bordered surface in the
app uses. Swapped.

### 6. Missing search icon — `SearchBar.tsx`
The field had no leading glass icon — every comparable search UI (podcast
apps, Spotify, and the Bible-reading apps this one sits next to, per Dwell's
own "Smarter, Faster Search" pattern) leads with one. Added, using
`theme.colors.grayIcon` (this actually is the icon token's intended job).

### 7. Inline layout value — `library.tsx`
The filter-pill row's `contentContainerStyle={{ gap: theme.spacing.md }}` was
a one-off object literal passed straight to a component, instead of living in
`library.styles.ts` like the rest of this screen's layout — the exact
convention `sharedStyles.ts`'s own header comment calls out. Moved into a
`filterRow` style.

### 8. Two mechanisms doing the same job — `prayer.tsx`
`scrollContent` had `paddingBottom: 100` *and* a separate `bottomPadding` spacer
`View` of height 80 at the end of the scroll content — both existed purely to
keep content clear of the sticky `AudioPlayer`. Consolidated to a single
`paddingBottom: 110` in the new `prayer.styles.ts`.

### 9. No per-screen styles file — `prayer.tsx`
Prayer was the one tab still keeping an inline `StyleSheet.create()` at the
bottom of the screen file, instead of following the `live.styles.ts` /
`library.styles.ts` convention. Extracted to `constants/styles/prayer.styles.ts`.

### 10. Identical cards for different content — `DocCard` / Prayer's Archive
"Prayer Resources" (PDF guides) and "Archive" (past monthly focuses) both
rendered as the same `DocCard` with the same document icon — two different
kinds of content that looked identical at a glance. Gave `DocCard` an
optional `icon` prop (defaults to the original document glyph, so the
Resources call site needs no change) and passed `archive-outline` for the
Archive cards.

### 11. Duplicate interface — `data/prayer.ts`
`PrayerFocus` was declared twice in the same file (TS interface merging
silently allowed it, so nothing broke, but it's the same kind of leftover
cruft as the dead component files). Consolidated into one declaration.

## Left alone, on purpose

- **Filter pills don't actually filter anything.** `activeFilter` state
  updates on tap but nothing in `library.tsx` reads it. The `filterLabels`
  categories ("Bible Studies," "Prayer Requests," "Events") also don't match
  `Message.type`'s actual enum (`sermon | series | audio | video`) — wiring
  real filtering means extending the data model, not just fixing UI, so it's
  flagged here rather than solved silently.
- **GridCard/PosterCard thumbnails are flat color + icon, not artwork.**
  Real podcast/media libraries (Dwell in particular) lean hard on distinct
  cover art to make a grid scannable by content, not just by title text.
  There's no artwork asset pipeline in this project yet, so faking photos
  wasn't in scope — noting it as the next real investment for Library's
  visual identity once there's real thumbnail imagery to use.
- **SearchBar owns its own query state and renders results itself,** including
  importing `messages` and `MessageCard` directly rather than being a pure
  presentational field. That's a container/presentational split the skill
  flags, but restructuring it risked changing behavior beyond a "restrained,
  explainable one-by-one" pass — left as-is beyond adding the icon.

---

## Round 2 — color hierarchy + search screen + scannability

Prompted by screenshots of the actual live app plus screenshots of
theolivebrookchurch.org itself (fetched and reviewed directly). The real
site's color budget is inverted from what `theme.ts` had documented: pink
carries the big background moments (the homepage's "Current Message" panel
is a full pink diagonal block with a huge white play button), purple rides
along as pink's gradient partner, and navy shows up almost entirely in body
text and button labels — never as a full-panel background.

### Color hierarchy corrected
`theme.ts`'s own comments previously said the opposite ("navy... the app's
one dark surface color... hero cards, gradients, filled panels" and
"gradient... everything else stays navy-on-white") — that documented rule is
what led every hero card toward navy in the first place. Rewrote both
comments to state the corrected hierarchy, then applied it:
- `CurrentMessageCard.tsx` (Library hero) — flat navy → the pink/purple
  gradient. Play button changed from a small tinted circle to a white
  circle with a pink icon, mirroring the site's actual button. Also
  collapsed a duplicated eyebrow — the card had picked up both a "Current
  Message" label AND a "Now streaming" line saying the same thing; now just
  the one caption, matching the real site's copy exactly.
- `FocusCard.tsx` (Prayer hero) — same navy → gradient swap. Progress fill
  changed from a second gradient to solid white, since a gradient track
  under a gradient fill would have almost no visible contrast.
- `AudioPlayer.tsx` — this is sticky utility chrome, not a hero, so it went
  the other direction: pulled *out* of navy entirely into a plain white
  surface (matching every other card on the screen), with only the
  play/pause button keeping color. Minimal, on request, and gives the one
  actionable control the only color emphasis on the bar.

Not touched: `LiveCard.tsx` on the Live tab uses this same flat-navy-panel
pattern and would benefit from the identical fix, but Live wasn't part of
this round's ask — flagging it here for whenever that tab comes back up.

---

## Round 3 — same revamp on Live (home), app-wide logo watermark

### LiveCard gets the same fix
`LiveCard.tsx` was the flagged-but-not-touched item from Round 2 — it's the
very first thing anyone sees on opening the app, so it got the same
navy-panel → gradient treatment as CurrentMessageCard and FocusCard. Two
things that used to sit on top of the navy card would have gone invisible
once the card became the gradient itself, so both changed with it:
- the Play button (Live state) was a gradient-filled circle → now a white
  circle with a pink icon, matching the real site's actual play button
- "Add to Calendar" (Next Service state) was gradient-filled → now solid
  white with navy text, since a gradient button has no visible edge on a
  gradient card of the same colors

Caught a real contrast bug in the process: the "NEXT SERVICE" label uses
`sharedStyles.overlineText`, which is pink text — correct everywhere else
it's used (pink-on-white), but this card now starts as pink itself, so pink
text on it would have been close to invisible. Gave it a local override
(`overlineOnGradient`, white) rather than touching the shared style, since
every other use of `overlineText` is still correctly pink-on-white.

The status pills ("YouTube Live" / "LIVE NOW") moved from a flat slate fill
to a translucent dark scrim — the same overlay treatment already used for
duration badges on photos/colored surfaces elsewhere in the app, so a badge
sitting on top of a now-colorful card reads the same way a badge on a photo
thumbnail does.

### App-wide "premium faded logo" background
Built `components/ui/LogoWatermark.tsx` and added it to all four tabs plus
the Search screen. Used the monochrome icon asset (`assets/android-icon-
monochrome.png`) already bundled in the project for Android's themed-icon
support — no new asset needed, and a single-shape silhouette is exactly
what a watermark wants: legible at very low opacity with no color of its
own to clash with what's on top of it. Tinted navy at 4% opacity, sized
well past the screen edges so it reads as texture in the gaps around cards
rather than a crisp logo anyone's eye catches on.

Deliberately left off `app/reading.tsx` — that screen is dense body text
for actual scripture reading, and a watermark behind long-form reading text
works against legibility in a way it doesn't behind cards with generous
white space. Every other screen in the app is card-based, so the watermark
only ever shows through gaps, never through text blocks.

### Dead code, again
`Card.tsx`, `Chip.tsx`, `MediaViewport.tsx`, `ReadingCard.tsx`,
`StatsBar.tsx`, and `CompactReading.tsx` had reappeared in this upload
(confirmed still unimported) — removed again, along with the
`readingTeaser*`/`streakNum`/`streakLabel` styles in `live.styles.ts` that
only the now-deleted `ReadingCard.tsx` was using.

### "Everything in a category looks identical"
`GridCard.tsx`'s four "Recently Added" tiles were the same navy rectangle
with the same play triangle — title text was the only differentiator. Per
the skill's own color-and-contrast rule ("don't rely solely on color to
convey information"), gave each content type its own icon (mic / albums /
headset / videocam) instead of reaching for more color to solve it.
`MessageCard.tsx` got the same treatment for consistency in the new search
results list, additively — it defaults to the original plain "play" icon
when no `type` is passed, so Live tab's existing rows aren't affected.

Also fixed, spotted in the screenshot: several "Recently Added" titles were
rendering the literal placeholder string `"REPLACE_ME"` on screen. Replaced
with real-looking titles derived from each item's series name and part
number in `data/content.ts`.

---

### Search is now its own screen
`SearchBar.tsx` was a real `TextInput` that grew a results list straight
into the Library `ScrollView` as soon as someone typed, pushing everything
else down. Built `app/search.tsx` — same header/back-button convention
`reading.tsx` already established — with an auto-focused input. Before
anything is typed it shows "Recently Added" instead of a blank screen
(researched pattern: a dedicated search screen with an empty-state prompt is
the standard mobile pattern once content varies by type, and a blank screen
right after opening search reads as broken rather than ready). `SearchBar`
on Library is now a lightweight `Pressable` styled as a field that pushes
to `/search` — the actual query state and results live entirely on the new
screen.


---

## Round 4 — watermark positioning bug + the real logo

Two separate issues from the same screenshot: the watermark was rendering
as a real block pushing the header down instead of floating behind content,
and the asset it was using turned out not to be a finished logo.

### The positioning bug
`LogoWatermark` was a direct child of `SafeAreaView`, positioned with
`StyleSheet.absoluteFillObject`. That's supposed to pull it out of layout
flow — but `SafeAreaView` isn't a plain `View` under the hood (it does its
own native work measuring and applying safe-area insets), and an absolutely
positioned child of it didn't reliably get that positioning context. Net
effect: it rendered as a normal block and pushed everything else down.
Fixed with a new `ScreenWithWatermark` wrapper — a plain `View` holds the
watermark absolutely, with `SafeAreaView` stacked on top of it as a
flex *sibling* instead of a *child*. All five screens (four tabs + Search)
now go through this wrapper instead of managing `SafeAreaView` +
`LogoWatermark` by hand.

### The logo
What was bundled (`assets/android-icon-monochrome.png`) had alignment-guide
circles and dashed lines baked into the image — an unflattened icon-design
template, not finished art. Turned the watermark off entirely rather than
ship that as branding, and asked for the real file.

Got it — `assets/brand-logo.png`, confirmed to have genuine alpha
transparency (fully transparent corners, not a flattened white background),
so it composites cleanly. Two changes from the placeholder version:
- Rendered in its natural pink-to-purple-to-navy colors instead of tinted
  flat navy — a `tintColor` override would've collapsed the actual swoosh
  gradient into one flat tone, which is a real detail to lose when the
  point was "the logo," not "a logo-shaped mark."
- Sized to the file's actual 768×273 (~2.81:1) ratio instead of the square
  box the placeholder icon used, so it's not being squeezed or needlessly
  letterboxed.
- Opacity nudged from 0.04 to 0.06 — a wordmark has thinner linework (the
  swoosh strokes, the letterforms) than a bold icon shape, and 0.04 made it
  functionally invisible.
