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

